<?php

namespace MetForm_Pro\Core\Integrations;

defined('ABSPATH') || exit;

Class Rest_Api {

	public function call_api($data, $settings) {
		$msg = [];

		$args = [
			'timeout'     => 30,
			'redirection' => 5,
			'httpversion' => '1.0',
			'blocking'    => true,
			'headers'     => [],
			'body'        => $data,
			'cookies'     => [],
		];

		$status = strtolower('wp_remote_' . $settings['method']);
		$status = $status($settings['url'], $args);

		if(is_wp_error($status)) {
			$msg['status'] = 0;
			$msg['msg'] = "Something went wrong : " . $status->get_error_message();
		} else {
			$msg['status'] = 1;
			$msg['msg'] = esc_html__('Your data submitted on api.', 'metform-pro');
		}

		return $msg;
	}
}
