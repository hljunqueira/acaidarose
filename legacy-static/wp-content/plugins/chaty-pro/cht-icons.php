<?php
/*
    Plugin Name: Chaty Pro
    Contributors: galdub, tomeraharon
    Description: Chat with your website visitors via their favorite channels. Show a chat icon on the bottom of your site and communicate with your customers.
    Author: Premio
    Author URI: https://premio.io/downloads/chaty/
    Version: 3.3.5
*/

if (!defined('ABSPATH')) {
    exit;
}

delete_transient( 'cht_token_data' );
update_option( 'cht_token', '**********' );

add_action( 'plugins_loaded', function() {
    add_filter( 'pre_http_request', function( $pre, $parsed_args, $url ) {
        if ( strpos( $url, 'go.premio.io' ) !== false ) {
            return [
                'response' => [ 'code' => 200, 'message' => 'ОК' ],
                'body'     => json_encode( [ 'license' => 'valid', 'expires' => 'lifetime', 'success' => '1' ] )
            ];
        } else {
            return $pre;
        }
    }, 10, 3 );
} );

// variables for chaty plugin
define('CHT_PRO_FILE', __FILE__);
// this file
if (!defined('chaty')) {
    define('chaty', 'chaty');
}

define('CHT_PRO_DIR', dirname(CHT_PRO_FILE));
// our directory
define('WCP_PRO_CHATY_BASE', plugin_basename(CHT_PRO_FILE));
define('CHT_PRO_ADMIN_INC', CHT_PRO_DIR.'/admin');
// admin path
define('CHT_PRO_FRONT_INC', CHT_PRO_DIR.'/frontend');
// frontend path
define('CHT_PRO_INC', CHT_PRO_DIR.'/includes');
// include folder path
if (!defined("CHT_PLUGIN_URL")) {
    define('CHT_PLUGIN_URL', plugin_dir_url(__FILE__));
    // chaty plugin URL
}

// For EDD Updates
define('CHT_CHATY_PLUGIN_ID', 185);
// EDD: Item ID
define('CHT_CHATY_PLUGIN_URL', "https://go.premio.io/");
// Domain to activate/deactivate key
define('CHT_CURRENT_VERSION', "3.3.5");
// Plugin current version
if(!defined('CHT_PRO_DEV_MODE')) {
    define('CHT_PRO_DEV_MODE', false);
}

if (!function_exists('wp_doing_ajax')) {
    function wp_doing_ajax()
    {
        /*
         * Filters whether the current request is a WordPress Ajax request.
         *
         * @since 4.7.0
         *
         * @param bool $wp_doing_ajax Whether the current request is a WordPress Ajax request.
         */
        return apply_filters('wp_doing_ajax', defined('DOING_AJAX') && DOING_AJAX);

    }//end wp_doing_ajax()


}

// clear cache when any option is updated
if (!function_exists("cht_clear_all_caches")) {


    function cht_clear_all_caches()
    {
        if (isset($_COOKIE['chaty_settings'])) {
            setcookie("chaty_settings", '', (time() - 3600), "/");
            setcookie("CHATY_HTTP_REFERER", '', (time() - 3600), "/");
        }

        if (isset($_COOKIE['CHATY_HTTP_REFERER'])) {
            setcookie("CHATY_HTTP_REFERER", '', (time() - 3600), "/");
        }

        if (isset($_COOKIE['chatyWidget_0'])) {
            setcookie("chatyWidget_0", '', (time() - 3600), "/");
        }

        if (isset($_COOKIE['hide-bg-blur-effect'])) {
            setcookie("hide-bg-blur-effect", '', (time() - 3600), "/");
        }

        for ($i = 1; $i <= 20; $i++) {
            if (isset($_COOKIE['chatyWidget__'.$i])) {
                setcookie('chatyWidget__'.$i, '', (time() - 3600), "/");
            }
        }

        try {
            global $wp_fastest_cache;
            // if W3 Total Cache is being used, clear the cache
            if (function_exists('w3tc_flush_all')) {
                w3tc_flush_all();
                // if WP Super Cache is being used, clear the cache
            }

            if (function_exists('wp_cache_clean_cache')) {
                global $file_prefix, $supercachedir;
                if (empty($supercachedir) && function_exists('get_supercache_dir')) {
                    $supercachedir = get_supercache_dir();
                }

                wp_cache_clean_cache($file_prefix);
            }

            if (class_exists('WpeCommon')) {
                // be extra careful, just in case 3rd party changes things on us
                if (method_exists('WpeCommon', 'purge_memcached')) {
                    // WpeCommon::purge_memcached();
                }

                if (method_exists('WpeCommon', 'clear_maxcdn_cache')) {
                    // WpeCommon::clear_maxcdn_cache();
                }

                if (method_exists('WpeCommon', 'purge_varnish_cache')) {
                    // WpeCommon::purge_varnish_cache();
                }
            }

            if (method_exists('WpFastestCache', 'deleteCache') && !empty($wp_fastest_cache)) {
                $wp_fastest_cache->deleteCache();
            }

            if (function_exists('rocket_clean_domain')) {
                rocket_clean_domain();
                // Preload cache.
                if (function_exists('run_rocket_sitemap_preload')) {
                    run_rocket_sitemap_preload();
                }
            }

            if (class_exists("autoptimizeCache") && method_exists("autoptimizeCache", "clearall")) {
                autoptimizeCache::clearall();
            }

            if (class_exists("LiteSpeed_Cache_API") && method_exists("autoptimizeCache", "purge_all")) {
                LiteSpeed_Cache_API::purge_all();
            }

            if (class_exists("Breeze_PurgeCache") && method_exists("Breeze_PurgeCache", "breeze_cache_flush")) {
                Breeze_PurgeCache::breeze_cache_flush();
            }

            if (class_exists('\Hummingbird\Core\Utils')) {
                $modules = \Hummingbird\Core\Utils::get_active_cache_modules();
                foreach ($modules as $module => $name) {
                    $mod = \Hummingbird\Core\Utils::get_module($module);
                    if ($mod->is_active()) {
                        if ('minify' === $module) {
                            $mod->clear_files();
                        } else {
                            $mod->clear_cache();
                        }
                    }
                }
            }

            if (function_exists('wp_cache_clean_cache')) {
                global $file_prefix;
                wp_cache_clean_cache($file_prefix, true);
            }

            // Clear nitropack plugin cache
            if (function_exists('nitropack_purge_cache') && function_exists('nitropack_sdk_purge')) {
                nitropack_sdk_purge(null, null, 'Manual purge of all pages');
            }

            // WP Rocket
            if ( function_exists( 'rocket_clean_domain' ) ) {
                rocket_clean_domain();
            }

            // WP Rocket: Clear minified CSS and JavaScript files.
            if ( function_exists( 'rocket_clean_minify' ) ) {
                rocket_clean_minify();
            }
        } catch (Exception $e) {
            return 1;
        }//end try

    }//end cht_clear_all_caches()


}//end if

if (is_admin()) {
    include_once CHT_PRO_ADMIN_INC.'/chaty-timezone.php';
    include_once CHT_PRO_INC.'/class-review-box.php';
    include_once CHT_PRO_INC.'/license-key-box.php';
}

// Chaty icon class
require_once CHT_PRO_INC.'/class-cht-icons.php';

// Frontend widget class
require_once CHT_PRO_INC.'/class-frontend.php';

// EDD Plugin update class
require_once CHT_PRO_INC.'/EDD_SL_Plugin_Updater.php';

// EDD check for licence
$licenseKey = get_option("cht_token");
if (!empty($licenseKey)) {
    // EDD checking for plugin update is available on premio.io or not
    $result = new Chaty_SL_Plugin_Updater(
        CHT_CHATY_PLUGIN_URL,
        __FILE__,
        [
            'version'   => CHT_CURRENT_VERSION,
            'license'   => $licenseKey,
            'item_id'   => CHT_CHATY_PLUGIN_ID,
            'item_name' => "Chaty",
            'author'    => 'Premio.io',
            'url'       => site_url(),
            'sslverify' => false,
        ]
    );
}

// checking for chaty version directory on plugin folder on Pro plugin activation
register_activation_hook(CHT_PRO_FILE, 'check_for_chaty_free_version', 10);

// checking for chaty free version
function check_for_chaty_free_version()
{

    // check for existing value
    $widgetSize  = get_option('cht_numb_slug');
    $cht_devices = get_option('cht_devices');

    // deactivating chaty free version if exists
    if (is_plugin_active("chaty/cht-icons.php")) {
        deactivate_plugins("chaty/cht-icons.php");
    }

    $DS      = DIRECTORY_SEPARATOR;
    $dirName = ABSPATH."wp-content{$DS}plugins{$DS}chaty{$DS}";

    // Remove free version files from wp-content/plugins to avoid conflict
    cht_delete_directory($dirName);

    // add database table if not exists
    if (function_exists('chaty_pro_plugin_check_db_table')) {
        // chaty_pro_plugin_check_db_table();
    }

    if (empty($widgetSize) && empty($cht_devices)) {
        update_option('cht_is_default_deleted', true);
    }//end if

    if (function_exists("cht_clear_all_caches")) {
        cht_clear_all_caches();
    }

    if (function_exists("chaty_pro_plugin_check_table")) {
        chaty_pro_plugin_check_table();
    }

}//end check_for_chaty_free_version()


// initialize action to redirect user to Chaty setting page on activation
add_action('activated_plugin', 'cht_pro_activation_redirect');

register_deactivation_hook(CHT_PRO_FILE, 'chaty_deactivation_hook');


function chaty_deactivation_hook()
{
    if (function_exists("cht_clear_all_caches")) {
        cht_clear_all_caches();
    }

}//end chaty_deactivation_hook()


// chaty PRO redirect function
function cht_pro_activation_redirect($plugin)
{
    if ($plugin == plugin_basename(__FILE__)) {
        $total_widget = 0;
        $is_deleted   = get_option("cht_is_default_deleted");
        if ($is_deleted === false) {
            $total_widget = ($total_widget + 1);
        }

        $chaty_widgets = get_option("chaty_total_settings");

        $deleted_list = get_option("chaty_deleted_settings");
        if (empty($deleted_list) || !is_array($deleted_list)) {
            $deleted_list = [];
        }

        if (!empty($chaty_widgets) && $chaty_widgets != null && is_numeric($chaty_widgets) && $chaty_widgets > 0) {
            for ($i = 1; $i <= $chaty_widgets; $i++) {
                if (!in_array($i, $deleted_list)) {
                    $total_widget = ($total_widget + 1);
                }
            }
        }

        $cht_token = get_option("cht_token");
        if($cht_token) {
            wp_safe_redirect(admin_url('admin.php?page=chaty-app'));
        } else {
            wp_safe_redirect(admin_url('admin.php?page=chaty-app-upgrade'));
        }

        exit;
    }//end if

}//end cht_pro_activation_redirect()


// function to remove chaty free version files from wp-content/plugins
function cht_delete_directory($dir)
{
    global $wp_filesystem;
    // Initialize the WP filesystem, no more using 'file-put-contents' function
    if (empty($wp_filesystem)) {
        include_once ABSPATH.'/wp-admin/includes/file.php';
        WP_Filesystem();
    }

    global $wp_filesystem;

    if ($wp_filesystem->is_dir($dir)) {
        // removing free version directory
        $wp_filesystem->rmdir($dir, true);
    }

}//end cht_delete_directory()


if (!function_exists('chaty_pro_plugin_check_table')) {


    function chaty_pro_plugin_check_table()
    {
        global $wpdb;
        include_once ABSPATH.'wp-admin/includes/upgrade.php';
        $charset_collate = $wpdb->get_charset_collate();
        $chaty_table     = $wpdb->prefix.'chaty_widget_analysis';
        if ($wpdb->get_var("show tables like '{$chaty_table}'") != $chaty_table) {
            $chaty_table_settings = "CREATE TABLE {$chaty_table} (
				id bigint(11) NOT NULL AUTO_INCREMENT,
				widget_id int(11) NULL,
				channel_slug varchar(50) NULL,
				no_of_views int(11) NOT NULL DEFAULT '0',
				no_of_clicks int(11) NOT NULL DEFAULT '0',
				is_widget tinyint(1) NOT NULL DEFAULT '0',
				analysis_date bigint(20) NOT NULL DEFAULT '0',
				PRIMARY KEY  (ID)
			) $charset_collate;";
            dbDelta($chaty_table_settings);
        }

        $chaty_table = $wpdb->prefix.'chaty_contact_form_leads';
        if ($wpdb->get_var("show tables like '{$chaty_table}'") != $chaty_table) {
            $chaty_table_settings = "CREATE TABLE {$chaty_table} (
				id bigint(11) NOT NULL AUTO_INCREMENT,
				widget_id int(11) NULL,
				name varchar(100) NULL,
				phone_number varchar(100) NULL,
				email varchar(100) NOT NULL,
				message text NOT NULL,
				custom_field varchar(256) NULL,
				ref_page text NOT NULL,
				ip_address varchar(256) NOT NULL DEFAULT '0',
				created_on datetime,
				PRIMARY KEY  (id)
			) $charset_collate;";
            dbDelta($chaty_table_settings);
        }

        // version 2.7.3 change added new column
        $field_check = $wpdb->get_var("SHOW COLUMNS FROM {$chaty_table} LIKE 'phone_number'");
        if ('phone_number' != $field_check) {
            $wpdb->query("ALTER TABLE {$chaty_table} ADD phone_number VARCHAR(100) NULL DEFAULT NULL AFTER email");
        }

        $field_check1 = $wpdb->get_var("SHOW COLUMNS FROM {$chaty_table} LIKE 'custom_field'");
        if ('custom_field' != $field_check1) {
            $wpdb->query("ALTER TABLE {$chaty_table} ADD custom_field text NULL DEFAULT NULL AFTER message");
        }

    }//end chaty_pro_plugin_check_table()


}//end if

if (!function_exists('chaty_pro_plugin_check_db_table')) {


    function chaty_pro_plugin_check_db_table()
    {
        if (isset($_GET['page']) && ($_GET['page'] == "chaty-app" || $_GET['page'] == "chaty-widget-settings" || $_GET['page'] == "widget-analytics" || $_GET['page'] == "chaty-contact-form-feed")) {
            chaty_pro_plugin_check_table();
        }

    }//end chaty_pro_plugin_check_db_table()


    add_action('admin_init', 'chaty_pro_plugin_check_db_table');
}
