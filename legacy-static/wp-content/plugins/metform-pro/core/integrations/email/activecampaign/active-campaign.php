<?php

namespace MetForm_Pro\Core\Integrations\Email\Activecampaign;

defined('ABSPATH') || exit;

class Active_Campaign {

	const CK_ACT_CAMP_EMAIL_LIST_CACHE_KEY = 'cache_active_campaign_email_list';
	const CK_ACT_CAMP_TAG_LIST_CACHE_KEY = 'cache_active_campaign_tag_list';

	public function call_api($form_data, $settings) {

		$settings_option = \MetForm\Core\Admin\Base::instance()->get_settings_option();
		$url = $settings_option['mf_active_campaign_url'] . '/api/3/';
		$endpoint = 'contacts';
		$form_id = $form_data['id'];
		$form_settings = $settings['auth'];

		$data = [
			"contact" => [
				"email"     => (isset($form_data[$settings['email_name']]) ? $form_data[$settings['email_name']] : ''),
				'firstName' => (isset($form_data['mf-listing-fname']) ? $form_data['mf-listing-fname'] : ''),
				'lastName'  => (isset($form_data['mf-listing-lname']) ? $form_data['mf-listing-lname'] : ''),
				'phone'     => (isset($form_data['mf-listing-phone']) ? $form_data['mf-listing-phone'] : ''),
			],
		];


		$response = wp_remote_post(
			$url . $endpoint,
			[
				'method'      => 'POST',
				'data_format' => 'body',
				'timeout'     => 45,
				'headers'     => [

					'Api-Token'    => $settings_option['mf_active_campaign_api_key'],
					'Content-Type' => 'application/json; charset=utf-8',
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
			$return['msgs'] = [];


			$contact = json_decode($response['body']);
			$contact_id = $contact->contact->id ?? null;

			if(!empty($form_settings['mf_active_campaign_list_id'])) {

				$res1 = $this->assign_to_a_list($contact_id, $form_settings['mf_active_campaign_list_id'], $settings_option);

				$return['msgs']['msg_list'] = $res1['msg'];
			}

			if(!empty($form_settings['mf_active_campaign_tag_id'])) {

				$res2 =  $this->assign_a_tag_to_contact($contact_id, $form_settings['mf_active_campaign_tag_id'], $settings_option);

				$return['msgs']['msg_tag'] = $res2['msg'];
			}
		}

		return $return;
	}


	public function assign_to_a_list($contact_id, $list_id, $settings) {

		$data = [
			"contactList" => [
				"list"    => $list_id,
				'contact' => $contact_id,
				'status'  => 1,
			],
		];

		$url = $settings['mf_active_campaign_url'] . '/api/3/contactLists';
		$token = $settings['mf_active_campaign_api_key'];

		return $this->send_post_req($data, $token, $url);
	}

	public function assign_a_tag_to_contact($contact_id, $tag_id, $settings) {

		$data = [
			"contactTag" => [
				"tag"    => $tag_id,
				'contact' => $contact_id,
			],
		];

		$url = $settings['mf_active_campaign_url'] . '/api/3/contactTags';
		$token = $settings['mf_active_campaign_api_key'];

		return $this->send_post_req($data, $token, $url);

	}

	private function send_post_req($data, $token, $url) {

		$config = json_encode($data);

		$headers = [
			'Content-Type' => 'application/json; charset=utf-8',
			'Api-Token'    => $token,
		];

		$payLoad = [
			'headers' => $headers,
			'method'  => 'POST',
			'data_format' => 'body',
			'body'    => $config,
		];

		try {

			$response = wp_remote_post($url, $payLoad);

		} catch(\Exception $ex) {

			return [
				'status' => 0,
				'msg' => $ex->getMessage(),
			];
		}

		if(is_wp_error($response)) {

			return [
				'status' => 0,
				'msg' => $response->get_error_message(),
			];
		}


		return [
			'status' => 1,
			'msg'    => 'successfully added.',
			'uri'    => $url,
		];
	}
}
