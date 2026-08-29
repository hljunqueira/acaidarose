<?php
/**
 * MSE Admin integration
 *
 * @author  : Premio <contact@premio.io>
 * @license : GPL2
 * */

if (defined('ABSPATH') === false) {
    exit;
}


global $wp_version ;

global $wpdb;
$query = $wpdb->get_results("SELECT option_name FROM ". $wpdb->prefix . "options WHERE option_name LIKE 'cht_social%Contact_Us'");
if(!empty($query)) {
    $contact_form = $query[0]->option_name;
}
$show_mailchimp_integration_popup = get_option('chaty_show_mailchimp_integration_popup');
$show_klaviyo_integration_popup  = get_option('chaty_show_klaviyo_integration_popup');

$mailchimp_flg  = false;
$mailpoet_flg   = false;
$is_integration = -1;

$license_data  = \CHT\admin\CHT_PRO_Admin_Base::getLicenseKeyInformation(get_option("cht_token"));
$is_pro_active = 0;
if (!empty($license_data)) {
    if ($license_data['license'] == "expired" || $license_data['license'] == "valid") {
        $is_pro_active = 1;
    }
}
$chaty_widget = [];
$total_widget = 0;
$activeWidget = 0;
$is_deleted = get_option("cht_is_default_deleted");
$uniqueStatus = get_option("cht_active");
if($is_deleted === false && $uniqueStatus == 1) {
    $chaty_widget[] = 0;
    $total_widget = $total_widget+1;
    $activeWidget = 1;
}
$chaty_widgets = get_option("chaty_total_settings");

$deleted_list = get_option("chaty_deleted_settings");
if(empty($deleted_list) || !is_array($deleted_list)) {
    $deleted_list = array();
}
if (!empty($chaty_widgets) && $chaty_widgets != null && is_numeric($chaty_widgets) && $chaty_widgets > 0) {
    for ($i = 0; $i <= $chaty_widgets; $i++) {
        if(!in_array($i, $deleted_list)) {
            $status = get_option("cht_active_".$i);
            $total_widget = $total_widget + 1;
            if($status == 1) {
                $activeWidget++;
                $chaty_widget[] = $i;
            }
        }
    }
}
//echo "<pre>";print_r($chaty_widget);echo "</pre>";die;
if (isset($_POST['chaty_mc_api_key']) && !empty($_POST['chaty_mc_api_key'])) {
    if(isset($_POST['mailchimp_nonce']) && wp_verify_nonce($_POST['mailchimp_nonce'], "mailchimp_nonce")) {
        $mc_api_key = sanitize_text_field($_POST['chaty_mc_api_key']);

        $dataCenter = substr($mc_api_key, (strpos($mc_api_key, '-') + 1));

        $headers = [
            'Authorization' => 'Basic ' . base64_encode('user:' . $mc_api_key),
            'Content-Type: application/json',
        ];
        $data = [
            'fields' => 'lists',
            'count' => 100,
        ];

        $url = 'https://' . $dataCenter . '.api.mailchimp.com/3.0/lists/?' . http_build_query($data);
        $args = [
            'method' => 'GET',
            'timeout' => 45,
            'redirection' => 5,
            'httpversion' => '1.0',
            'blocking' => true,
            'user-agent' => 'WordPress/' . $wp_version . '; ' . home_url(),
            'headers' => $headers,
            'cookies' => [],
            'sslverify' => true,
        ];
        $response = wp_remote_get($url, $args);
        $api_response_body = json_decode(wp_remote_retrieve_body($response), true);

        $mailchimp_lists = [];
        if (isset($api_response_body['lists'])) {
            update_option('chaty_mc_api_key', $mc_api_key);
            $is_integration = 1;
            $mailchimp_flg = 1;
        } else {
            update_option('chaty_mc_api_key', "");
            $is_integration = 0;
        }
    }
}

if (isset($_POST['disconnect_mailchimp']) && !empty($_POST['disconnect_mailchimp'])) {
    $nonce = sanitize_text_field($_POST['disconnect_mailchimp']);
    if(wp_verify_nonce($nonce, "disconnect_mailchimp")) {
        update_option('chaty_mc_api_key', '');
        $is_integration = -1;
    }
}


$chaty_mc_api_key       = get_option('chaty_mc_api_key');
$elements_mailpoet_connect = get_option('elements_mailpoet_connect');
?>
    <div class="chaty-new-widget-wrap">
        <h2 class="text-center chaty-integrate-title-main"><?php esc_html_e('Connect your Chaty form to the following platforms to automatically receive leads', 'chaty'); ?></h2>
        <div class="chaty-new-widget-row">
            <div class="chaty-features">
                <ul>
                    <li>
                        <div class="elements-int-container chaty-feature <?php echo esc_attr(( !$is_pro_active ) ? 'chaty-free' : '');?>">
                            <div class="chaty-feature-top">
                                <img src="<?php echo esc_url(CHT_PLUGIN_URL.'admin/assets/images/mailchimp.png') ?>" />
                            </div>
                            <div class="feature-title"><?php esc_html_e("Connect your forms to Mailchimp", "chaty") ?></div>
                            <div id="elements-int-container-content feature-description">
                                <form method="post" action="" id="elements-mc-form">
                                    <table width="100%">
                                        <tr>
                                            <td colspan="2">
                                                <?php if ($is_pro_active) : ?>
                                                    <input type="text" id="elements-mc-api-key" required name="chaty_mc_api_key" value="<?php echo (isset($chaty_mc_api_key) && $chaty_mc_api_key != '') ? esc_attr(substr_replace($chaty_mc_api_key, "**********", 18, 10)) : ''; ?>" placeholder="<?php esc_html_e('Enter Mailchimp API Key', 'chaty');?>" style="width: 100%;" <?php if (isset($chaty_mc_api_key) && $chaty_mc_api_key != '') :
                                                        ?> readonly <?php
                                                    endif; ?>>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                        <?php if ($is_integration == 0) : ?>
                                            <tr>
                                                <td colspan="2">
                                                    <span style="color:red;" class="valid-key-message"><?php esc_html_e('API key is not valid. Please enter a valid key', 'chaty');?></span>
                                                </td>
                                            </tr>
                                        <?php endif; ?>
                                        <tr>
                                            <td class="intergation-buttons-row">
                                                <p><button class="integrate-element-form mailchimp-integration-btn button-primary <?php echo ($chaty_mc_api_key != '') ? 'btn-connected' : '';?>"
                                                        <?php if ($chaty_mc_api_key != '') :?> disabled="disabled" <?php
                                                    endif; ?>>
                                                        <?php echo ($chaty_mc_api_key != '') ? 'Connected' : 'Connect';?></button>
                                                    <input type="hidden" name="mailchimp_nonce" value="<?php echo esc_attr(wp_create_nonce("mailchimp_nonce")) ?>">
                                                </p>
                                            </td>
                                            <?php if (isset($chaty_mc_api_key) && $chaty_mc_api_key != '') :?>
                                                <td align="right">
                                                    <p><button class="integrate-element-form button-primary btn-disconnected"><?php esc_html_e("Disconnect ", "chaty") ?></button></p>
                                                    <input type="hidden" name="disconnect_mailchimp" value="<?php echo esc_attr(wp_create_nonce("disconnect_mailchimp")) ?>">
                                                </td>
                                            <?php endif; ?>
                                        </tr>
                                        <?php
                                        if (!empty($contact_form) && $show_mailchimp_integration_popup == '' && $chaty_mc_api_key != '') {
//                                            update_option('chaty_show_mailchimp_integration_popup', 1);
                                            $settingLink = admin_url("admin.php?page=chaty-app");
                                            if($activeWidget == 1 && isset($chaty_widget[0])) {
                                                $settingLink = admin_url("admin.php?page=chaty-app&widget=$chaty_widget[0]");
                                            }
                                            ?>
                                            <tr class="integartion-text">
                                                <td colspan="2">
                                                    <span class="suggestion-icon">
                                                        <svg width="25" height="25" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M22.5 0C10.0736 0 0 10.0736 0 22.5C0 34.9264 10.0736 45 22.5 45C34.9264 45 45 34.9264 45 22.5C45 10.0736 34.9264 0 22.5 0ZM21.7365 8.31664H23.2636V12.8183H21.7365V8.31664ZM15.4907 9.66795L18.0725 13.3539L16.8201 14.2328L14.2383 10.5469L15.4907 9.66795ZM29.5093 9.66795L30.7617 10.5469L28.1799 14.2328L26.9275 13.3539L29.5093 9.66795ZM22.5 14.0488C26.2408 14.0488 29.2731 16.3194 29.2731 19.1217L25.4251 30.7755H19.5749L15.7269 19.1217C15.7269 16.3193 18.7595 14.0488 22.5 14.0488ZM10.3354 15.4001L14.5651 16.9409L14.0405 18.3774L9.81353 16.8366L10.3354 15.4001ZM34.6646 15.4001L35.1865 16.8366L30.9567 18.3774L30.4349 16.9409L34.6646 15.4001ZM14.3619 21.9727L14.7574 23.4503L10.4096 24.6149L10.014 23.1372L14.3619 21.9727ZM30.6381 21.9727L34.986 23.1372L34.5905 24.6149L30.2426 23.4503L30.6381 21.9727ZM19.4898 31.6269H25.5103V33.6511H19.4898V31.6269ZM19.4898 34.6591H25.5103V36.6833H19.4898V34.6591Z" fill="#F59E0B"></path>
                                                        </svg>
                                                    </span>
                                                    <?php esc_html_e("Enable ", "chaty") ?><span><?php esc_html_e("Sends leads to Mailchimp", "chaty") ?></span><?php esc_html_e(" from your ", "chaty") ?><a href="<?php echo esc_url($settingLink); ?>" target="_blank"><?php esc_html_e("contact form settings", "chaty") ?></a><?php esc_html_e(" to start receiving the emails of contact form submissions in Mailchimp.", "chaty") ?>
                                                </td>
                                            </tr>
                                        <?php } ?>
                                        <?php if ($chaty_mc_api_key == '') :?>
                                            <tr>
                                                <td>
                                                    <p class="chaty-key-guide-text integration-infotext">
                                                        <a href="https://premio.io/help/chaty/how-to-integrate-your-chaty-contact-form-with-mailchimp/" target="_blank">
                                                            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>
                                                            <?php esc_html_e("How to create your Mailchimp API key?", "chaty") ?>
                                                        </a>
                                                    </p>
                                                </td>
                                            </tr>
                                        <?php endif;?>
                                    </table>
                                </form>
                            </div>
                            <?php if (!$is_pro_active) : ?>
                                <div class="chaty-integration-button">
                                    <a href="<?php echo esc_url(admin_url("admin.php?page=chaty-app-upgrade")); ?>" class="new-upgrade-button" target="blank"><?php esc_html_e("ACTIVATE YOUR KEY", "chaty") ?></a>
                                </div>
                            <?php endif; ?>
                        </div>
                    </li>
                    <li>
                        <div class="elements-int-container chaty-feature <?php echo ( !$is_pro_active ) ? 'chaty-free' : '';?>">
                            <div class="chaty-feature-top">
                                <img src="<?php echo esc_url(CHT_PLUGIN_URL) ?>admin/assets/images/klaviyo_icon.png" />
                            </div>

                            <div class="feature-title"><?php esc_html_e("Connect your forms to Klaviyo", "chaty") ?></div>

                            <div id="elements-int-container-content feature-description">
                                <?php
                                $klaviyo_details = get_option('chaty_klaviyo_detail');
                                $ko_status = 0;
                                $ko_key = '';
                                if (!empty($klaviyo_details)) {

                                    $ko_status = (int) $klaviyo_details['status'];
                                    $ko_key = $klaviyo_details['api'];
                                }
                                $masked_key = '';
                                if (!empty($ko_key)) {
                                $masked_key = substr_replace($ko_key, '**************', 6, 20);
                                }
                                ?>
                                <form method="post" action="" id="elements-klv-form">
                                    <table width="100%">
                                        <tr>
                                            <td colspan="2">
                                                <?php if ($is_pro_active) : ?>
                                                <input type='hidden' id='klaviyo_unmasked' value='<?php echo esc_attr($ko_key); ?>' />
                                                <input type="text" id="elements-klv-api-key" name="elements_klv_api_key" value="<?php echo esc_attr($masked_key); ?>" placeholder="Enter Your Klaviyo API Key" required style="width: 100%;" <?php echo esc_attr(1 !== $ko_status ? '' : 'readonly') ?> />
                                                <input type="hidden" name="connect_klaviyo_nonce" value="<?php echo esc_attr(wp_create_nonce("connect_klaviyo_nonce")) ?>">
                                                <p class='klaviyo-error hide'>
                                                    <?php esc_html_e("Please enter API key", "chaty") ?>
                                                </p>
                                                <p class='klaviyo-refreshed hide'><?php esc_html_e("Klaviyo list is updated", "chaty") ?></p>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class='mc-td'>
                                                <p>
                                                    <input type='submit' class="integrate-element-form button-primary connect-klaviyo <?php echo esc_attr(1 !== $ko_status ? '' : 'refresh-klaviyo-list'); ?>" name="connect_klaviyo" value="<?php echo esc_attr(1 !== $ko_status ? 'Connect to Klaviyo' : 'Refresh List'); ?>">
                                                </p>
                                            </td>
                                            <td align="right">
                                                <p>
                                                    <input type='button' class="integrate-element-form button-primary disconnect-klaviyo btn-disconnected <?php echo esc_attr(1 !== $ko_status ? 'hide' : ''); ?>" name="disconnect_klaviyo" value="Disconnect">
                                                    <input type="hidden" name="disconnect_klaviyo_nonce" value="<?php echo esc_attr(wp_create_nonce("disconnect_klaviyo_nonce")); ?>">
                                                </p>
                                            </td>
                                        </tr>
                                        <?php if (!empty($contact_form) && $show_klaviyo_integration_popup == '' && $ko_status == 1) {
//                                        update_option('chaty_show_klaviyo_integration_popup', 1);
                                            $settingLink = admin_url("admin.php?page=chaty-app");
                                            if($activeWidget == 1 && isset($chaty_widget[0])) {
                                                $settingLink = admin_url("admin.php?page=chaty-app&widget=$chaty_widget[0]");
                                            }
                                        ?>
                                            <tr class="integartion-text">
                                                <td colspan="2">
                                                    <span class="suggestion-icon">
                                                        <svg width="25" height="25" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M22.5 0C10.0736 0 0 10.0736 0 22.5C0 34.9264 10.0736 45 22.5 45C34.9264 45 45 34.9264 45 22.5C45 10.0736 34.9264 0 22.5 0ZM21.7365 8.31664H23.2636V12.8183H21.7365V8.31664ZM15.4907 9.66795L18.0725 13.3539L16.8201 14.2328L14.2383 10.5469L15.4907 9.66795ZM29.5093 9.66795L30.7617 10.5469L28.1799 14.2328L26.9275 13.3539L29.5093 9.66795ZM22.5 14.0488C26.2408 14.0488 29.2731 16.3194 29.2731 19.1217L25.4251 30.7755H19.5749L15.7269 19.1217C15.7269 16.3193 18.7595 14.0488 22.5 14.0488ZM10.3354 15.4001L14.5651 16.9409L14.0405 18.3774L9.81353 16.8366L10.3354 15.4001ZM34.6646 15.4001L35.1865 16.8366L30.9567 18.3774L30.4349 16.9409L34.6646 15.4001ZM14.3619 21.9727L14.7574 23.4503L10.4096 24.6149L10.014 23.1372L14.3619 21.9727ZM30.6381 21.9727L34.986 23.1372L34.5905 24.6149L30.2426 23.4503L30.6381 21.9727ZM19.4898 31.6269H25.5103V33.6511H19.4898V31.6269ZM19.4898 34.6591H25.5103V36.6833H19.4898V34.6591Z" fill="#F59E0B"></path>
                                                        </svg>
                                                    </span>
                                                    <?php esc_html_e("Enable ", "chaty") ?><span><?php esc_html_e("Sends leads to Klaviyo", "chaty") ?></span><?php esc_html_e(" from your ", "chaty") ?><a href="<?php echo esc_url($settingLink); ?>" target="_blank"><?php esc_html_e("contact form settings", "chaty") ?></a><?php esc_html_e(" to start receiving the emails of contact form submissions in Klaviyo.", "chaty") ?>
                                                </td>
                                            </tr>
                                        <?php } ?>
                                        <?php if ($ko_key == '') :?>
                                            <tr>
                                                <td>
                                                    <p class="chaty-key-guide-text integration-infotext">
                                                        <a href="https://help.klaviyo.com/hc/en-us/articles/115005062267-How-to-Manage-Your-Account-s-API-Keys" target="_blank">
                                                            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>
                                                            <?php esc_html_e("How to create your API key", "chaty") ?>
                                                        </a>
                                                    </p>
                                                </td>
                                            </tr>
                                        <?php endif;?>
                                    </table>
                                </form>
                            </div>
                            <?php if (!$is_pro_active) : ?>
                                <div class="chaty-integration-button">
                                    <a href="<?php echo esc_url(admin_url("admin.php?page=chaty-app-upgrade")); ?>" class="new-upgrade-button" target="blank"><?php esc_html_e("ACTIVATE YOUR KEY", "chaty") ?></a>
                                </div>
                            <?php endif; ?>
                        </div>
                    </li>
                </ul>
                <div class="clear clearfix"></div>
            </div>
        </div>
    </div>

    <style>
        *, ::after, ::before {
            box-sizing: border-box;
        }
        .suggestion-icon {
            display: inline-block;
            vertical-align: middle;
        }
        .hide {
            display: none !important;
        }
        .chaty-feature-top img {
            width: 100%;
            height: auto;
        }
        .chaty-features ul li:hover .chaty-integration-button{
            display: block;
        }
        .chaty-integration-button {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%);
            z-index: 9;
        }
        .chaty-new-widget-wrap {
            background: #fff;
            padding: 30px;
            margin: 0px auto 0 auto;
            width: 100%;
            line-height: 20px;
        }
        .chaty-new-widget-wrap, .chaty-new-widget-wrap * {
            box-sizing: border-box;
        }
        .chaty-new-widget-wrap h2.chaty-integrate-title-main {
            font-style: normal;
            font-weight: 500;
            font-size: 18px;
            line-height: 1.5;
            color: #1E1E1E;
            margin: 0 auto;
            max-width: 490px;
            position: relative;
            padding-bottom: 30px;
        }
        .chaty-new-widget-wrap h2 {
            font-style: normal;
            font-weight: 600;
            font-size: 20px;
            line-height: 30px;
            color: #1e1e1e;
            margin: 0;
            text-align: center;
        }
        .chaty-new-widget-wrap h2.chaty-integrate-title-main::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            width: 158px;
            height: 1px;
            background-color: #3C85F7;
            margin: 0 auto;
        }
        .chaty-features {
            padding-top: 40px;
            max-width: 776px;
            margin: 0 auto;
        }
        .chaty-features ul {
            margin: 0 -20px;
            padding: 0;
            align-items: initial;
        }
        .chaty-new-widget-row ul {
            display: flex;
            /*align-items: center;*/
            flex-wrap: wrap;
            margin-top: 0;
            margin-bottom: 0;
        }
        .chaty-features ul li {
            margin: 0;
            width: 50%;
            padding: 30px;
        }
        /*.chaty-new-widget-row ul li {*/
        /*    width: 33.33%;*/
        /*    padding: 10px 10px 0px;*/
        /*    margin-bottom: 0;*/
        /*}*/
        .chaty-feature {
            background: #fff;
            border-radius: 10px;
            padding: 60px 20px 10px 20px;
            height: 100%;
            position: relative;
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.06), 0px 4px 6px rgba(0, 0, 0, 0.1);
        }
        .chaty-feature-top {
            width: 73px;
            height: 73px;
            border-radius: 50%;
            position: absolute;
            left: 0;
            right: 0;
            margin: 0 auto;
            top: -25px;
            background: #fff;
            z-index: 11;
            padding: 10px;
            box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1);
        }
        .chaty-feature-top img {
            width: 100%;
            height: auto;
            max-width: 100%;
            max-height: 100%;
        }
        .feature-title {
            font-style: normal;
            font-weight: 400;
            font-size: 16px;
            line-height: 18px;
            color: #334155;
            margin-bottom: 15px;
            text-align: center;
        }
        .chaty-feature input[type="text"] {
            border: 1px solid #E2E8F0;
            color: #9CA3AF;
            font-size: 12px;
        }
        .intergation-buttons-row {
            width: 25%;
            padding-right: 10px;
        }
        .chaty-feature .button-primary {
            border: 1px solid #3C85F7;
            background-color: transparent;
            color: #3C85F7;
            padding: 5px 17px;
            line-height: 20px;
            border-radius: 2px;
        }
        .chaty-feature .button-primary:hover {
            background-color: #3C85F7;
            color: #fff;
        }
        .wp-core-ui .button-primary {
            text-shadow: none;
            box-shadow: none;
        }
        .chaty-key-guide-text.integration-infotext {
            margin: 0px;
        }
        .chaty-key-guide-text {
            cursor: pointer;
            margin-top: 30px;
        }
        .chaty-key-guide-text:hover a {
            color: #64748B;
        }
        .chaty-key-guide-text a {
            color: #94A3B8;
            text-decoration: none;
        }
        .chaty-key-guide-text.integration-infotext svg {
            fill: #94A3B8;
            background: none;
            font-size: 18px;
        }
        .chaty-key-guide-text svg {
            width: 18px;
            height: 18px;
            line-height: 18px;
            border-radius: 35px;
            padding: 0;
            text-align: center;
            font-size: 10px;
            display: inline-block;
            background-color: #94A3B8;
            color: #ffffff;
            vertical-align: sub;
            margin-right: 5px;
        }
        .chaty-features .feature-description.mailpoet_section {
            display: flex;
        }
        #elements-mp-form {
            margin-right: 10px;
        }
        .install-mailpoat-text {
            min-height: 37px;
        }
        .integrate-element-form.button-primary.btn-connected[disabled] {
            background-color: #057A55 !important;
            color: #fff !important;
        }
        .chaty-feature .button-primary.btn-connected {
            border-color: #057A55;
            color: #057A55;
        }
        .chaty-feature .button-primary.btn-disconnected:hover {
            background-color: transparent;
            color: #B91C1C;
        }
        .chaty-feature .button-primary.btn-disconnected {
            color: #B91C1C;
            border: 0;
            padding: 0;
            background-color: transparent;
        }
        .chaty-feature.chaty-free {
            min-height: 140px;
        }
        a.new-upgrade-button {
            display: inline-block;
            margin-top: 15px;
            padding: 8px 15px;
            border: solid 2px rgba(176, 143, 229, 1);
            color: rgba(176, 143, 229, 1);
            font-weight: 600;
            border-radius: 4px;
            font-size: 14px;
            text-decoration: none;
            letter-spacing: 0.6px;
        }
        a.new-upgrade-button:hover {
            background-color: rgba(176, 143, 229, 1);
            color: #ffffff;
        }
        .chaty-features ul li:hover a.new-upgrade-button {
        background-color: rgba(176, 143, 229, 1);
        color: #ffffff;
    }
        .chaty-integration-button {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%);
            z-index: 9;
        }
        .klaviyo-error {
            color: #ff0000;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }
        .klaviyo-refreshed {
            color: green;
            padding: 0;
            margin: 0;
        }
        .integartion-text {
            font-size: 15px;
            line-height: 22px;
        }
        .integartion-text span {
            font-weight: bold;
        }
        .integartion-text a, .integartion-text a:hover, .integartion-text a:active, .integartion-text a:focus {
            color: #3f70eb;
            text-decoration: none;
            outline: none;
            box-shadow: none;
        }
    </style>

    <script type="text/javascript">
        ( function( $ ) {
            "use strict";
            $(document).ready(function() {
                var result = "";
                $(document).on("submit", "#elements-klv-form", function () {
                    var key = $('#elements-klv-api-key').val();
                    if ($('.connect-klaviyo').hasClass('refresh-klaviyo-list')) {
                        key = $('#klaviyo_unmasked').val();
                    }

                    if (key == '') {
                        // $('.klaviyo-error').removeClass('hide');
                    } else {
                        // $('.klaviyo-error').addClass('hide');
                        $.ajax({
                            url: '<?php echo esc_url(admin_url("admin-ajax.php")) ?>',
                            data: {
                                action: "chaty_connect_to_klaviyo",
                                key: key,
                                nonce: $("input[name='connect_klaviyo_nonce']").val()
                            },
                            type: 'post',
                            cache: false,
                            success: function (response) {
                                result = JSON.parse(response);
                                console.log(response);
                                if (result.status == 1) {
                                    if ($('.connect-klaviyo').hasClass('refresh-klaviyo-list')) {
                                        $('.klaviyo-refreshed').removeClass('hide');
                                    } else {
                                        $('.connect-klaviyo').attr('value', 'Connected');
                                        location.reload();
                                    }
                                } else {
                                    alert(result.message)
                                }
                                //window.location.reload();
                            }
                        })
                    }
                });

                $(document).on('click', '.disconnect-klaviyo', function () {
                    var action = "chaty_disconnect_klaviyo";
                    var nonce = $("input[name='disconnect_klaviyo_nonce']").val();

                    $.ajax({
                        url: '<?php echo esc_url(admin_url("admin-ajax.php")) ?>',
                        data: {
                            action: action,
                            nonce: nonce
                        },
                        type: 'post',
                        cache: false,
                        success: function (response) {
                            result = JSON.parse(response);
                            $('.disconnect-klaviyo').addClass('hide')
                            window.location.reload();
                        }
                    });
                });

            });
        })( jQuery );
    </script>
