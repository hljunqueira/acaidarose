<?php

namespace MetForm_Pro\Core\Integrations;


use MetForm_Pro\XPD_Constants;

class Convert_Kit {

	const SETTINGS_KEY_ALL = 'metform_option__settings';
	const SETTINGS_KEY_CKIT = 'mf_ckit_api_key';
	const CKIT_FORMS_CACHE_KEY = 'mf_ckit_forms_key';


	protected $base_url          = 'https://api.convertkit.com/v3/';
	protected $form_url          = 'https://api.convertkit.com/v3/forms';


	/**
	 * Convert_Kit constructor.
	 *
	 * @param bool $loadActions
	 */
	public function __construct($loadActions = true) {

		if($loadActions) {
			#Registering Aweber authorization check route only
			add_action('wp_ajax_get_form_lists', [$this, 'get_email_lists']);
		}
	}



	/**
	 *
	 * @param $formId
	 *
	 * @return string
	 */
	public function get_subscriber_add_url($formId) {

		//https://api.convertkit.com/v3/forms/45/subscribe
		return $this->base_url.'forms/'.$formId.'/subscribe';
	}


	/**
	 *
	 * @return string
	 */
	public function retrieve_api_key() {

		$sett = get_option(self::SETTINGS_KEY_ALL);

		return empty($sett[self::SETTINGS_KEY_CKIT]) ? '' : $sett[self::SETTINGS_KEY_CKIT];
	}


	/**
	 *
	 * @return mixed
	 */
	public function get_email_lists() {

		$apiKey = $this->retrieve_api_key();

		$config = [];
		$config['api_key'] = $apiKey;

		$headers = array(
			'Content-Type' => 'application/json; charset=utf-8',
		);

		$payLoad = array(
			'headers' => $headers,
			'method'  => 'GET',
			'body'    => $config
		);


		try {

			$response = wp_remote_get($this->form_url, $payLoad);

		} catch(\Exception $ex) {

			return wp_send_json_error([
				'result' => XPD_Constants::RETURN_OKAY,
				'retrieved' => 'no',
				'msg' => $ex->getMessage(),
			]);
		}

		$json = json_decode( $response['body'] );

		$forms = [];

		if(isset($json->forms)) {

			$frm = $json->forms;

			foreach($frm as $item) {

				$tmp = [];
				$tmp['id'] = $item->id;
				$tmp['name'] = $item->name;
				$tmp['uid'] = $item->uid;

				$forms[] = $tmp;
			}

			update_option(self::CKIT_FORMS_CACHE_KEY, $forms);

		}


		return wp_send_json_success([
			'result' => XPD_Constants::RETURN_OKAY,
			'forms' => $forms,
			'msg' => 'successfully retrieved.',
		]);

	}


	/**
	 * Just to be the same/consistent as other developers - how they called it
	 *
	 * @param $form_data
	 * @param $settings
	 *
	 * @return mixed
	 */
	public function call_api($form_data, $settings) {

		$cKit_formId = $settings['mail_settings']['mf_ckit_list_id'];
		$emailFld   = $settings['email_name'];
		$fNm        = (isset($form_data['mf-listing-fname']) ? $form_data['mf-listing-fname'] : 'NF') ;
		$email      = (isset($form_data[$emailFld]) ? $form_data[$emailFld] : '') ;

		$data['email'] = $email;
		$data['name'] = $fNm;

		return $this->add_subscriber_to_form($cKit_formId, $data);
	}


	/**
	 *
	 * @param $formId
	 * @param $form_data
	 *
	 * @return mixed
	 */
	public function add_subscriber_to_form($formId, $form_data) {

		$apiKey = $this->retrieve_api_key();
		$return = [];

		$config = [];
		$config['api_key']      = $apiKey;
		$config['email']        = $form_data['email'];
		$config['first_name']   = $form_data['name'];
		#$config['fields'] = ['key1' => 'val1', 'key2' => 'val2',];
		#$config['tags'] = [112, 114];

		$headers = array(
			'Content-Type' => 'application/json; charset=utf-8',
		);

		$payLoad = array(
			'headers' => $headers,
			'method'  => 'POST',
			'body'    => wp_json_encode($config),
		);

		$url = $this->get_subscriber_add_url($formId);

		try {

			$response = wp_remote_post($url, $payLoad);

		} catch(\Exception $ex) {

			$return['status'] = 0;
			$return['msg'] = "Something went wrong: " . esc_html($ex->getMessage());

			return $return;
		}

		if (is_wp_error($response)) {
			$error_message = $response->get_error_message();
			$return['status'] = 0;
			$return['msg'] = "Something went wrong: " . esc_html($error_message);

			return $return;
		}

		$return['status'] = 1;
		$return['msg'] = esc_html__('Your data inserted on ConvertKit.', 'metform-pro');

		return $return;
	}
}