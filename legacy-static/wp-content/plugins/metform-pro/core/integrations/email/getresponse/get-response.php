<?php

namespace MetForm_Pro\Core\Integrations\Email\Getresponse;

defined('ABSPATH') || exit;

class Get_Response {

	public static function get_list($api_key) {

		$url = 'https://api.getresponse.com/v3/';

		$endpoint = 'campaigns';

		$response = wp_remote_post(
			$url . $endpoint,
			[
				'method'      => 'GET',
				'data_format' => 'body',
				'timeout'     => 45,
				'headers'     => [

					'X-Auth-Token' => 'api-key ' . $api_key,
					'Content-Type' => 'application/json; charset=utf-8',
				],
				'body'        => '',
			]
		);

		$campaign_list = json_decode($response['body']);

		return $campaign_list;

	}

	public function call_api($form_data, $settings) {
		$return = [];
		$auth = [
			'api_key' => ($settings['auth']['mf_get_reponse_api_key'] != '') ? $settings['auth']['mf_get_reponse_api_key'] : null,
			'list_id' => ($settings['auth']['mf_get_response_list_id'] != '') ? $settings['auth']['mf_get_response_list_id'] : null,
		];

		$url = 'https://api.getresponse.com/v3/';
		$api_key = $auth['api_key'];

		$endpoint = 'contacts';
		$campaign_id = $auth['list_id'];

		$data = [
			'name'       => (isset($form_data['mf-listing-fname']) ? $form_data['mf-listing-fname'] : '') . ' ' . (isset($form_data['mf-listing-lname']) ? $form_data['mf-listing-lname'] : ''),
			'campaign'   => [
				'campaignId' => $campaign_id,
			],
			'email'      => (isset($form_data[$settings['email_name']]) ? $form_data[$settings['email_name']] : ''),
			'dayOfCycle' => '42',
		];

		$response = wp_remote_post(
			$url . $endpoint,
			[
				'method'      => 'POST',
				'data_format' => 'body',
				'timeout'     => 45,
				'headers'     => [
					'X-Auth-Token' => 'api-key ' . $api_key,
					'Content-Type' => 'application/json',
				],
				'body'        => json_encode($data),
			]
		);

		if(is_wp_error($response)) {
			$error_message = $response->get_error_message();
			$return['status'] = 0;
			$return['msg'] = "Something went wrong: " . esc_html($error_message);
		} else {
			$return['status'] = 1;
			$return['msg'] = esc_html__('Your data inserted on Active.', 'metform-pro');
		}

		return $return;


	}


}
