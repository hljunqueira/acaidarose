<?php

namespace MetForm_Pro\Core\Integrations\Crm\Zoho;

use MetForm_Pro\Traits\Singleton;
use MetForm_Pro\Utils\Render;

defined('ABSPATH') || exit;

class Integration
{
    use Singleton;

    /**
     * @var mixed
     */
    private $parent_id;
    /**
     * @var mixed
     */
    private $sub_tab_id;
    /**
     * @var mixed
     */
    private $sub_tab_title;

    public function init()
    {
        /**
         *
         * Create a new tab in admin settings tab
         *
         */

        $this->parent_id = 'mf_crm';

        $this->sub_tab_id    = 'zoho';
        $this->sub_tab_title = 'Zoho';

        add_action('metform_after_store_form_data', [$this, 'create_contact'], 10, 4);
        add_action('metform_settings_subtab_' . $this->parent_id, [$this, 'sub_tab']);
        add_action('metform_settings_subtab_content_' . $this->parent_id, [$this, 'sub_tab_content']);
        add_action('wp_ajax_get_contact_fields', [$this, 'get_contact_fields']);
        add_action('wp_ajax_zoho_revoke_token', [$this, 'zoho_revoke_token']);
        add_action('wp_ajax_save_zoho_data_center', [$this, 'save_zoho_data_center']);

        add_action('init', [$this, 'setup_token']);
    }

    public function setup_token(){

        if(!current_user_can('manage_options')){
            return false;
        }

        $data = [];
        if( isset($_REQUEST['zoho']) && 
            isset($_REQUEST['state']) &&
            wp_verify_nonce(sanitize_text_field(wp_unslash($_REQUEST['state'])))){
            
            $data['access_token']  = isset($_REQUEST['access_token']) ? sanitize_text_field(wp_unslash($_REQUEST['access_token'])) : '';
            $data['refresh_token'] = isset($_REQUEST['refresh_token']) ? sanitize_text_field(wp_unslash($_REQUEST['refresh_token'])) : '';
            $data['expires_in']    = isset($_REQUEST['expires_in']) ? sanitize_text_field(wp_unslash($_REQUEST['expires_in'])) : '';
            
            update_option('mf_zoho_token_info', json_encode($data));
            set_transient('mf_zoho_token', $data['access_token'], ((int)$data['expires_in'] - 20));
            // after saving token redirect to crm section            
            wp_safe_redirect(admin_url('admin.php?page=metform-menu-settings#mf_crm'));
        }

        
    }
    public function sub_tab()
    {
        Render::sub_tab($this->sub_tab_title, $this->sub_tab_id);
    }

    public function contents()
    {
       $token =  get_option('mf_zoho_token_info');
       $selected_data_center = get_option('mf_zoho_data_center', 'US');
       
       $connect_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none">
            <path stroke="#0D1427" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m7.08614 6.21462.12414-.12414c1.18722-1.18727 3.11212-1.18727 4.29932 0 1.1873 1.18722 1.1873 3.11214 0 4.29932l-1.71968 1.7198c-1.18722 1.1873-3.11214 1.1873-4.29939 0-1.18724-1.1873-1.18724-3.11218 0-4.2994l.27861-.27858"/>
            <path stroke="#0D1427" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m11.8307 6.46841.2785-.27858c1.1873-1.18726 1.1873-3.11215 0-4.2994-1.1872-1.18724-3.1121-1.18724-4.29932 0L6.09016 3.61019c-1.18727 1.18724-1.18727 3.11214 0 4.29936 1.18722 1.18728 3.11214 1.18728 4.29934 0l.1242-.12414M1 4.60003l1.8.6M1.6 7.90004l1.2-.90001m-.3-4.8.9 1.2"/>
        </svg>';
       $disconnect_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.33333 1.06335C8.02867 1.02161 7.717 1 7.4 1C3.86538 1 1 3.68629 1 7C1 10.3137 3.86538 13 7.4 13C7.717 13 8.02867 12.9784 8.33333 12.9367" stroke="#0D1427" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.3335 5.33333L13.0002 6.99999L11.3335 8.66666M6.3335 6.99999H12.5943" stroke="#0D1427" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>';

        $data_centers = array(
            "US" => "US",
            "AU" => "Australia", 
            "EU" => "Europe",
            "IN" => "India",
            "CN" => "China",
            "JP" => "Japan",
            "SA" => "Saudi Arabia",
            "CA" => "Canada"
        );

        ?>
            <div class="mf-setting-input-group">
                <?php if(!trim($token)): ?>
                <div class="mf-setting-field">
                    <label class="mf-setting-label" for="mf_zoho_data_center"><?php esc_html_e(' Select Data Center:', 'metform-pro'); ?></label>
                    <select class="mf-setting-input attr-form-control" id="mf_zoho_data_center" name="mf_zoho_data_center" data-nonce="<?php echo wp_create_nonce('save_zoho_data_center'); ?>" style="margin-bottom: 14px;">
                        <?php foreach($data_centers as $value => $label): ?>
                            
                            <option value="<?php echo esc_attr($value); ?>" <?php selected($selected_data_center, $value); ?>>
                                <?php echo esc_html($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <?php endif; ?>
                
                <p class="description">
                    <?php if(!trim($token)): ?>
                    <a id="zoho_connect_btn" href="https://api.wpmet.com/public/zoho-api/auth.php?redirect_url=<?php echo esc_url(get_admin_url() . 'admin.php?page=metform-menu-settings') . "&state=" . wp_create_nonce() . "&data_center=" . $selected_data_center . "&section_id=mf-newsletter_integration"; ?>" class="button-primary mf-setting-btn"> 
                        <?php \MetForm\Utils\Util::metform_content_renderer( $connect_icon); ?>
                        <?php esc_html_e('Connect Zoho ', 'metform-pro'); ?> 
                    </a>
                    <?php  else: ?>

                        <a 
                            id="revoke_zoho" 
                            data-admin-url="<?php echo admin_url('admin-ajax.php'); ?>" 
                            data-zoho-nonce="<?php echo  esc_attr(wp_create_nonce('revoke_zoho')); ?>" 
                            class="button-primary mf-setting-btn"> 
                            <?php \MetForm\Utils\Util::metform_content_renderer( $disconnect_icon); ?>
                            <?php esc_html_e('Disconnect Zoho ', 'metform-pro'); ?> 
                        </a>
                    <?php endif; ?>
                </p>
            </div>
        <?php
    }

    public function zoho_revoke_token(){
    
        if(!isset($_POST['nonce']) 
           || !wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce']) ), 'revoke_zoho')
           || !current_user_can( 'manage_options' ) ){ 

            wp_send_json_error(esc_html__("You're not permitted", 'metform-pro')); 
        }
       
        $mf_zoho_token_info = json_decode(get_option('mf_zoho_token_info'), true);
        
        if(isset($mf_zoho_token_info['refresh_token'])){

            // Define the URL for token revocation
            $revoke_url = 'https://accounts.zoho.com/oauth/v2/token/revoke';

            // Define the parameters to be sent in the request body
            $request_body = array(
                'body' => array(
                    'token' => $mf_zoho_token_info['refresh_token']
                )
            );

            // Send a POST request to revoke the token
            $response = wp_remote_request($revoke_url, $request_body);
            
            if (!is_wp_error($response)) {
                $response_body = wp_remote_retrieve_body($response);
                $zoho_response = json_decode($response_body, true);
                // zoho will return status success
                if(isset($zoho_response['status']) && $zoho_response['status'] == 'success'){
                    $this->clear_data(); // clear data 
                }
            }
        }
        $this->clear_data(); //if no token clear data
    }

    public function save_zoho_data_center(){
        
        if(!isset($_POST['nonce']) 
           || !wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce']) ), 'save_zoho_data_center')
           || !current_user_can( 'manage_options' ) ){ 

            wp_send_json_error(esc_html__("You're not permitted", 'metform-pro')); 
        }

        $data_center = isset($_POST['data_center']) ? sanitize_text_field(wp_unslash($_POST['data_center'])) : 'US';
        
        // Validate data center value
        $allowed_data_centers = array('US', 'AU', 'EU', 'IN', 'CN', 'JP', 'SA', 'CA');
        if(!in_array($data_center, $allowed_data_centers)){
            $data_center = 'US';
        }

        update_option('mf_zoho_data_center', $data_center);
        wp_send_json_success();
    }

    /**
     * Delete zoho token info, delete zoho transient
     * Send success response
     */
    function clear_data(){
        
        delete_transient('mf_zoho_token_info');
        delete_option('mf_zoho_token_info');
        delete_option('mf_zoho_data_center');
        // send response after deleting
        wp_send_json_success();
    }

    public function sub_tab_content()
    {
        Render::sub_tab_content($this->sub_tab_id, [$this, 'contents']);
    }

    /**
     * @param $form_id
     * @param $form_data
     * @param $form_settings
     * @param $attributes
     * @return null
     */
    public function create_contact($form_id, $form_data, $form_settings, $attributes)
    {
        if (isset($form_settings['mf_zoho']) && $form_settings['mf_zoho'] == '1') {

            $settings_option = $this->get_access_token();
            
            $token = $settings_option['access_token'];

            $zoho_existing_fields = get_post_meta($form_id, 'mf_zoho_fields');
            $zoho_data = [];

            // if empty or not array or the specific index is not present close here
            if('' == $zoho_existing_fields || (!is_array($zoho_existing_fields) &&  !isset($zoho_existing_fields[0]))){                
                return;
            }

            // if empty or not array or the specific index is not present close here
            $m_data = isset($zoho_existing_fields[0]) && trim($zoho_existing_fields[0]) !== ''? json_decode($zoho_existing_fields[0], true) : false;
            if( !$m_data || !is_array($m_data)){
                return ;
            }

            foreach ( $m_data as $key => $value) {
                $zoho_data[$value] =  isset($form_data[$key]) ? $form_data[$key] : '';  

                // Converting Date Object for zoho api date format
                if('Date_of_Birth' == $value && !empty(trim($form_data[$key]))){
                   
                    $dateTime = \DateTime::createFromFormat('m-d-Y', $form_data[$key])->format('Y-m-d');

                    $zoho_data['Date_of_Birth'] =  $dateTime;   
                }
                if('Email_Opt_Out'  == $value && !empty(trim($form_data[$key]))){
                   // Zoho Email_Opt_Out  boolean value setting according to api data format
                    $zoho_data['Email_Opt_Out'] = isset($form_data[$key]) ? true : false;
                }
            }
            
            $url  = 'https://www.zohoapis.com/crm/v2/Contacts';
            
            $data = [
                'data' => [$zoho_data]
            ];
            
           $rr = wp_remote_post($url, [
                'method'  => 'POST',
                'timeout' => 45,
                'headers' => [
                    'Authorization' => 'Zoho-oauthtoken ' . $token,
                    'Content-Type'  => 'application/json; charset=utf-8'
                ],
                'body'    => json_encode($data)
            ]);
            
        }

        return;
    }
    public function get_contact_fields() {

        $settings_option = $this->get_access_token();

        if(!isset($settings_option['access_token'])){
            wp_send_json_error($settings_option['error']);
        }

        $token = $settings_option['access_token'];

        $response = wp_remote_get(
            'https://zohoapis.com/crm/v2/settings/layouts?module=Contacts',
                array(
                    'headers' => array(
                        'Authorization' => 'Bearer '.$token
                    ),
                    'sslverify' => false, // Set to true for SSL verification currently false
                )
            );
            
        if (is_array($response) && !is_wp_error($response)) {
            $response_body = [];
            $response_body['zoho_api_fields'] = wp_remote_retrieve_body($response);
            
            if(isset($_POST['formId'])){
                $response_body['zoho_existing_fields'] = get_post_meta($_POST['formId'], 'mf_zoho_fields');
            }

            wp_send_json_success($response_body);

        }
    }

    /**
     * Get token or refresh new token from zoho
     * @method get_access_token()
     * @return array
     * @since 3.5.0
     */
    public function get_access_token( ){
        // update_option('mf_zoho_token_info', '');
        // is token expired if yes get new token
        $icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7.08614 6.21462L7.21028 6.09048C8.3975 4.90321 10.3224 4.90321 11.5096 6.09048C12.6969 7.2777 12.6969 9.20262 11.5096 10.3898L9.78992 12.1096C8.6027 13.2969 6.67778 13.2969 5.49053 12.1096C4.30329 10.9223 4.30329 8.99742 5.49053 7.8102L5.76914 7.53162" stroke="#0D1427" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.8307 6.46841L12.1092 6.18983C13.2965 5.00257 13.2965 3.07768 12.1092 1.89043C10.922 0.70319 8.9971 0.70319 7.80988 1.89043L6.09016 3.61019C4.90289 4.79743 4.90289 6.72233 6.09016 7.90955C7.27738 9.09683 9.2023 9.09683 10.3895 7.90955L10.5137 7.78541" stroke="#0D1427" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 4.60003L2.8 5.20003M1.6 7.90004L2.8 7.00003M2.5 2.20003L3.4 3.40003" stroke="#0D1427" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>';
        if(!get_transient('mf_zoho_token')){  
            $mf_zoho_token_info = json_decode(get_option('mf_zoho_token_info'), true);
            
            if(!isset($mf_zoho_token_info['refresh_token'])){
                return ['error' => sprintf('%1$s <a target="_blank" class="mf-zoho-connect-url" href="'.admin_url().'admin.php?page=metform-menu-settings#mf_crm">%2$s %3$s</a>',esc_html__('Token Not Found. Please','metform-pro'), $icon, esc_html__('Connect Zoho','metform-pro')) ];
            }
            // Refresh the token
            $response = wp_remote_get( 'https://api.wpmet.com/public/zoho-api/refresh-token.php?refresh_token='.  $mf_zoho_token_info['refresh_token'] );
        
            // Check if request is successful
            if(isset($response['response']['code']) &&  $response['response']['code'] === 200){

                
                $responseBody = isset ($response['body']) ? json_decode($response['body'], true) : [];

                if(!isset($responseBody['access_token'])){
                    return ['error' => esc_html__("Access Token Not Found", 'metform-pro')];
                }
                // Save new token values
                $token_data = [];
                $token_data['access_token']  = isset($responseBody['access_token']) ? sanitize_text_field($responseBody['access_token']): '' ;
                $token_data['refresh_token'] = isset($mf_zoho_token_info['refresh_token']) ? sanitize_text_field($mf_zoho_token_info['refresh_token']) : '' ;
                $token_data['expires_in']    = isset($responseBody['expires_in'])? sanitize_text_field($responseBody['expires_in']) : '';

                // Save the results in a transient named
                set_transient( 'mf_zoho_token', $responseBody['access_token'], ((int)$responseBody['expires_in'] - 20));
                // Update mf_zoho_token_info options
                update_option('mf_zoho_token_info', json_encode($token_data));

                return $token_data;
            }else{

                return ['error' => esc_html__("Connection Failed", 'metform-pro')];
            }
        }

        $token_data = json_decode(get_option('mf_zoho_token_info'), true);

        // if no token need to connect zoho
        if(!isset($token_data['access_token'])){
            return ['error' => sprintf('%1$s <a target="_blank" class="mf-zoho-connect-url" href="'.admin_url().'admin.php?page=metform-menu-settings#mf_crm">%2$s</a>',esc_html__('Token Not Found. Please','metform-pro'), $icon . esc_html__(' Connect Zoho','metform-pro')) ];
        }
        return $token_data;
    }
}

Integration::instance()->init();