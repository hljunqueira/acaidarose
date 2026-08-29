<?php

namespace MetForm_Pro\Utils\Activate_Required;

defined('ABSPATH') || exit;

class Activate_Metform
{

	/**
	 * Plugin slug and file path.
	 */
	private static $plugin_slug = 'metform';
	private static $plugin_file = 'metform/metform.php';

	/**
	 * Activate MetForm.
	 *
	 * @return void
	 */
	public static function activate_metform()
	{
		self::initialize_filesystem();

		// Ensure the function is available
		if (!function_exists('is_plugin_active')) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		// Return if plugin is already activated
		if (is_plugin_active(self::$plugin_file)) {
			return;
		}

		// Check if Metform is installed
		if (self::is_plugin_installed()) {
			activate_plugin(self::$plugin_file);
		} else {
			// Install the plugin if not installed
			self::install_plugin();
		}
	}

	// Function to get plugin information
	public static function get_plugin_information($plugin_slug)
	{
		global $wp_version;

		$url = 'http://api.wordpress.org/plugins/info/1.2/';
		$url = add_query_arg(
			array(
				'action'  => 'plugin_information',
				'request' => [
					'slug'   => $plugin_slug,
					'fields' => [
						'downloaded' => true,
						'sections' => false,
					],
				],
			),
			$url
		);

		$http_args = array(
			'timeout'    => 15,
			'user-agent' => 'WordPress/' . substr($wp_version, 0, 3) . '; ' . home_url('/'),
		);

		$request = wp_remote_get($url, $http_args);

		$res = false;
		if (is_wp_error($request)) {
			return false;
		} else {
			$res = json_decode(wp_remote_retrieve_body($request), true);
			if (is_array($res)) {
				// Object casting is required in order to match the info/1.0 format.
				$res = (object) $res;
			} else {
				return false;
			}
		}

		return $res;
	}

	/**
	 * Install the MetForm plugin.
	 *
	 * @return void
	 */
	private static function install_plugin()
	{
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		include_once ABSPATH . 'wp-admin/includes/plugin.php';

		$plugin_info = self::get_plugin_information(self::$plugin_slug);

		// Check if the API call was successful
		if (is_wp_error($plugin_info) || $plugin_info == false) {
			return;
		}

		include_once ( new \MetForm_Pro\Plugin() )->utils_dir() . 'activate-required/quiet-skin.php';
		
		// Download and install the plugin
		$upgrader = new \Plugin_Upgrader(new \MetForm_Pro\Utils\Activate_Required\Quiet_Skin());
		$upgrader->install($plugin_info->download_link);

		// Check if the plugin files are present
		if (!self::is_plugin_installed()) {
			return;
		}

		// Activate the plugin
		$activate = activate_plugin(self::$plugin_file);

		// Check if the activation was successful
		if (is_wp_error($activate)) {
			return;
		}

		if (!is_plugin_active(self::$plugin_file)) {
			return;
		}
	}

	/**
	 * Check if the MetForm plugin is installed.
	 *
	 * @return bool
	 */
	private static function is_plugin_installed()
	{
		global $wp_filesystem;
		return $wp_filesystem->exists(WP_PLUGIN_DIR . '/' . self::$plugin_file);
	}

	/**
	 * Initialize the WordPress filesystem.
	 *
	 * @return void
	 */
	private static function initialize_filesystem()
	{
		global $wp_filesystem;

		if (!function_exists('WP_Filesystem')) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		WP_Filesystem();
	}

	/**
	 * Check if MetForm is missing and add admin notice if necessary.
	 *
	 * @return void
	 */
	public static function metform_missing()
	{
		add_action('admin_notices', [__CLASS__, 'metform_missing_notice']);
	}

	/**
	 * Display an admin notice if the MetForm plugin is missing.
	 *
	 * @return void
	 */
	public static function metform_missing_notice()
	{
		if (!current_user_can('activate_plugins') || !current_user_can('install_plugins')) {
			return;
		}

		if (!function_exists('is_plugin_active')) {
			include_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		// Return if plugin is already activated
		if (is_plugin_active(self::$plugin_file)) {
			return;
		}

		self::initialize_filesystem();

		if (self::is_plugin_installed()) {
			self::display_activate_notice();
		} else {
			self::display_install_notice();
		}
	}

	/**
	 * Display a notice to activate the MetForm.
	 *
	 * @return void
	 */
	private static function display_activate_notice()
	{
?>
		<div class="notice notice-error is-dismissible" style="padding: 0 0.8rem 0.8rem;">
			<p><?php esc_html_e('MetForm Pro requires MetForm, which is currently NOT RUNNING.', 'metform-pro'); ?></p>
			<a href="<?php echo esc_url(wp_nonce_url('plugins.php?action=activate&plugin=' . self::$plugin_file, 'activate-plugin_' . self::$plugin_file)); ?>" class="button button-primary">
				<?php esc_html_e('Activate MetForm', 'metform-pro'); ?>
			</a>
		</div>
	<?php
	}

	/**
	 * Display a notice to install the Metform plugin.
	 *
	 * @return void
	 */
	private static function display_install_notice()
	{
		$nonce_action = 'install-plugin_' . self::$plugin_slug;
		$nonce = wp_create_nonce($nonce_action);
	?>
		<div class="notice notice-error is-dismissible" style="padding: 0 0.8rem 0.8rem;">
			<p><?php esc_html_e('MetForm Pro requires MetForm, which is currently NOT RUNNING.', 'metform-pro'); ?></p>
			<a href="<?php echo esc_url(admin_url('update.php?action=install-plugin&plugin=' . self::$plugin_slug . '&_wpnonce=' . $nonce)); ?>" class="button button-primary">
				<?php esc_html_e('Install MetForm', 'metform-pro'); ?>
			</a>
		</div>
<?php
	}
}
