<?php

use MetForm_Pro\Utils\Helper;

defined('ABSPATH') || exit;

/**
 * Plugin Name: MetForm Pro
 * Plugin URI:  http://products.wpmet.com/metform/
 * Description: Most flexible and design friendly form builder for Elementor
 * Version: 3.9.1
 * Author: Wpmet
 * Author URI:  https://wpmet.com
 * Text Domain: metform-pro
 * Domain Path: /languages
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.txt
 */

require_once plugin_dir_path( __FILE__ ) . 'autoloader.php';
require_once plugin_dir_path( __FILE__ ) . 'libs/vendor/build/vendor/src/autoload.php';
require_once plugin_dir_path( __FILE__ ) . 'plugin.php';
require_once plugin_dir_path( __FILE__ ) . 'utils/notice/notice.php';
require_once plugin_dir_path( __FILE__ ) . 'utils/activate-required/activate-metform.php';

\Oxaim\Libs\Notice::init();

add_action('plugins_loaded', function () {

    MetForm_Pro\Plugin::instance()->init();

	/**
     * ---------------------------------------------------------
     * Woocommerce Checkout feature
     * Add metform entires into woocommerce cart as a product
     * Price will come from the calculation form
     * ---------------------------------------------------------
     *
     * Add functionality to @wp_head hook
     */

    require_once plugin_dir_path( __FILE__ ) .  'core/integrations/ecommerce/woocommerce/woo-cpt.php';

    do_action('xpd_metform_pro/plugin_loaded');

}, 115);

register_activation_hook( __FILE__, 'mf_activate_metform_free_plugin' );

if( !function_exists( 'mf_activate_metform_free_plugin' ) ){
    
    /**
     * Activation callback for the MetForm Free plugin.
     * This function is triggered when the plugin is activated.
     * You can add any setup or initialization code needed upon activation here.
     */
    function mf_activate_metform_free_plugin() {
        ob_start();
       \MetForm_Pro\Utils\Activate_Required\Activate_Metform::activate_metform();
        ob_end_clean();
    }
}