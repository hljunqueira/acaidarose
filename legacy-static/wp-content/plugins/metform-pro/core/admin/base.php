<?php

namespace MetForm_Pro\Core\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * License related all functionalities.
 *
 * @version 1.6.18
 */
class Base {
    use \MetForm\Traits\Singleton;

    public static function parent_slug(){
        return 'metform-menu';
    }

    public function init(){
        $this->auto_updater();
        add_action('admin_menu', [$this, 'register_menus'], 999);
        add_action('admin_init', [$this, 'register_actions'], 999);
        add_action('mf_add_url_databypass_input', [$this, 'add_databypass_fields'], 999);
    }

    public function register_menus(){
        add_submenu_page( self::parent_slug(), esc_html__( 'License', 'metform-pro' ), esc_html__( 'License', 'metform-pro' ), 'manage_options', self::parent_slug().'-license', [$this, 'register_settings_contents__license'], 11);
    }

    public function register_settings_contents__license(){
        include('views/license.php');
    }

    public function register_actions(){
        if(isset( $_POST['metform-pro-settings-page-action'])) {
            // run a quick security check
            $key = !isset($_POST['metform-pro-settings-page-key']) ? '' : sanitize_text_field($_POST['metform-pro-settings-page-key']);

            if( !check_admin_referer('metform-pro-settings-page', 'metform-pro-settings-page')){
                return;
            }
            

            switch($_POST['metform-pro-settings-page-action']){
                case 'activate':
                    \MetForm_Pro\Libs\License::instance()->activate($key);
                break;
                case 'deactivate':
                    \MetForm_Pro\Libs\License::instance()->deactivate();
                break;
            }
        }
    }

    public function auto_updater(){

        $license_key = !empty(\MetForm_Pro\Libs\License::instance()->get_license()) ? explode('-', trim( \MetForm_Pro\Libs\License::instance()->get_license() )) : '';
        $license_key = !isset($license_key[0]) ? '' : $license_key[0];

        $plugin_dir_and_filename = \MetForm_Pro\Plugin::instance()->plugin_dir() . 'metform-pro.php';

        $active_plugins = get_option( 'active_plugins' );
        foreach ( $active_plugins as $active_plugin ) {
            if ( false !== strpos( $active_plugin, 'metform-pro.php' ) ) {
                $plugin_dir_and_filename = $active_plugin;
                break;
            }
        }
        if (!isset( $plugin_dir_and_filename ) || empty( $plugin_dir_and_filename)) {
            throw new \Exception( 'Plugin not found! Check the name of your plugin file in the if check above' );
        }

        new \MetForm_Pro\Libs\Plugin_Updater(
            \MetForm_Pro\Plugin::instance()->account_url(),
            $plugin_dir_and_filename,
            array(
                'version' => \MetForm_Pro\Plugin::instance()->version(), // current version number.
                'license' => $license_key, // license key 
                'item_id' => \MetForm_Pro\Plugin::instance()->product_id(), // id of this product
                'author'  => \MetForm_Pro\Plugin::instance()->author_name(), // author of this plugin.
                'url'     => home_url(),
            )
        );
    }

    public function add_databypass_fields(){
        ?>
            <div class="mf-box-style">
                <div class="mf-input-group">
                    <label class="attr-input-label">
                        <input type="checkbox" value="1" name="mf_redirect_params_status" class="mf-admin-control-input mf_redirect_params_status mf-form-redirect-enable">
                        <span><?php esc_html_e('Redirect Form Data:', 'metform-pro'); ?></span>
                    </label>
                    
                </div>

                <div class="mf-input-group mf-form-redirect-confirmation"><label class="attr-input-label"><?php esc_html_e('Form Fields', 'metform-pro') ?> </label>
                    <div class="mf-inputs mf-cf-fields">
                        
                        <div id="paramFieldsrepeaterResult">
                            <div id="mf-cf-single-field-data-bypass" class="mf-cf-single-field mf-form-data-bypass-single-field">
                                <div class="mf-cf-single-field-input">
                                    <label><?php esc_html_e('Name', 'metform-pro') ?></label>
                                    <input type="text" name="mf_url_submission_custom_fields_name[]" class="attr-form-control mf-form-data-bypass-input">
                                </div>    
                                <div class="mf-cf-single-field-input">
                                    <label><?php esc_html_e('Select Field', 'metform-pro') ?></label>
                                    <select name="mf_url_submission_mf_field_name[]" id="mf-form-fields-url-copier" class="attr-form-control mf-form-data-bypass-select">
                                    
                                    </select>
                                </div>
                                
                                <a href="#" class=" mf-form-data-bypass-delete-btn"><?php esc_html_e('Delete', 'metform-pro') ?></a>
                            </div>
                        </div>
                        <button class="mf-add-param_fields" type="button">
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="white" viewBox="0 0 20 20">
                                    <path fill="#000" fill-rule="evenodd" d="M9 17a1 1 0 1 0 2 0v-6h6a1 1 0 1 0 0-2h-6V3a1 1 0 1 0-2 0v6H3a1 1 0 0 0 0 2h6v6z"/>
                                </svg>
                            </span>
                            <span>Add Field</span>
                        </button>
                    </div>
                </div>
            </div>
        <?php
    }
}