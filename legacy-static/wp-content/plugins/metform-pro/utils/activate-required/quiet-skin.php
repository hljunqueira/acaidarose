<?php

namespace MetForm_Pro\Utils\Activate_Required;

defined('ABSPATH') || exit;

// Custom skin class to suppress feedback
class Quiet_Skin extends \WP_Upgrader_Skin {
	public function feedback($string, ...$args) {
		// Suppress feedback
	}
}