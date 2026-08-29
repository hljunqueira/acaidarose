<?php

namespace MetForm_Pro\Core\Integrations;


use MetForm_Pro\XPD_Constants;

class Aweber {

	const ACCESS_TOKEN_KEY       = 'met_form_aweber_mail_access_token_key';
	const REFRESH_TOKEN_KEY      = 'met_form_aweber_mail_refresh_token_key';
	const AUTHORIZATION_CODE_KEY = 'met_form_aweber_mail_auth_code_key';
	const NONCE_VERIFICATION_KEY = 'met_form_aweber_mail_state_key';
	const BASIC_AUTH_64_CRED_KEY = 'met_form_aweber_basic_auth_64_key';

	const AWEBER_LISTS_CACHE_KEY = 'mf_aweber_lists_key';
	const AWEBER_ACCOUNT_DATA_CACHE_KEY = 'mf_aweber_account_data_key';

	protected $auth_url          = 'https://auth.aweber.com/oauth2/';
	protected $authorization_url = 'https://auth.aweber.com/oauth2/authorize';
	protected $access_token_url  = 'https://auth.aweber.com/oauth2/token';
	protected $aweber_api_account_url  = 'https://api.aweber.com/1.0/accounts';

	private $tmp_uri = '/admin.php?page=metform-menu-settings';


	/**
	 * Aweber constructor.
	 *
	 * @param bool $loadActions
	 */
	public function __construct($loadActions = true) {

		$this->tmp_uri = get_admin_url() . 'admin.php?page=metform-menu-settings';

		if($loadActions) {
			add_action('wp_ajax_get_list_lists', [$this, 'get_list_lists']);
		}

		add_action('wp_ajax_get_aweber_custom_fields', [$this, 'get_aweber_custom_fields']);
	}


	public function get_aweber_custom_fields(){

		if ( 
			!isset( $_POST['nonce'] ) || 
			!wp_verify_nonce( sanitize_text_field(wp_unslash($_POST['nonce'])), 'wp_rest' ) 
		) {
			wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'Unauthorized access.',
			]);
		}

		if(isset($_POST['formId'])){
			$form_id = isset($_POST['formId']) ? sanitize_text_field(wp_unslash($_POST['formId'])) : '';
		} else {
			wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'No form ID.',
			]);
		}

		$selected_value = isset($_POST['selectedValue']) ? sanitize_text_field(wp_unslash($_POST['selectedValue'])) : '';

		if($selected_value == -1){
			$settings = \MetForm\Core\Forms\Action::instance()->get_all_data($form_id);
			if(isset($settings['mf_aweber_list_id'])){
				$selected_value = $settings['mf_aweber_list_id'];
			} else {
				wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'No settings for selected value.',
				]);
			}
		}

		if(empty($selected_value) || $selected_value == '-1'){
			wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'Please select a option first.',
			]);
		}

		// Generate access token
		$accToken = $this->get_access_token();
		if($accToken['result'] === XPD_Constants::RETURN_NOT_OKAY) {
			if(!empty($accToken['action_need'])) {
				wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Developer did not authorized the application, please first authorize the app and then try again.',
				]);
			}

			wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => $accToken['msg'],
			]);
		}

		if(empty($accToken['token'])) {
			wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'Access token could not be retrieved.',
			]);
		}

		$accessToken = $accToken['token'];
		$aweber_acc_data = get_option(self::AWEBER_ACCOUNT_DATA_CACHE_KEY);
		// If there is no account data saved then make a request for account data
		if( !$aweber_acc_data ){
			try {
				$bearerAuth = 'Bearer  ' . $accessToken;
				$headers = array(
					'Authorization' => $bearerAuth,
					'Accept' 	=> 'application/json',
					'User-Agent' 	=> 'XPD-AWeber-get-account',
				);
	
				$body = [];
				$payLoad = array(
					'method' => 'GET',
					'headers' => $headers,
					'body' => $body
				);
	
				$url = $this->aweber_api_account_url;
				$response = wp_remote_post($url, $payLoad);
	
			} catch(\Exception $ex) {
	
				wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Could not retrieved list due to api call fail! - ['. $ex->getMessage().']',
				]);
			}
	
			if (is_wp_error($response) || isset($response['body']['error'])) {
	
				wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Could not retrieved account information due to - '. $response->get_error_message(),
				]);
			}
	
			$responseBody = json_decode($response['body']);
			$aweber_acc_data = $responseBody->entries[0];
		}
		
		if(isset($aweber_acc_data->lists_collection_link)){


			try {

				$bearerAuth = 'Bearer  ' . $accessToken;
	
				$headers = array(
					'Authorization' => $bearerAuth,
					'Accept' 	=> 'application/json',
					'User-Agent' 	=> 'XPD-AWeber-get-account',
				);
	
				$body = [];
	
				$payLoad = array(
					'method' => 'GET',
					'headers' => $headers,
					'body' => $body
				);
	
				$url = $aweber_acc_data->lists_collection_link . '/'. $selected_value .'/custom_fields';

				$response = wp_remote_post($url, $payLoad);

	
			} catch(\Exception $ex) {
	
				wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Could not retrieved list due to api call fail! - ['. $ex->getMessage().']',
				]);
			}

			if ( is_wp_error($response)) {
				wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Could not retrieved account information due to - '. $response->get_error_message(),
				]);
			}

			if(isset($response['response']['code']) && $response['response']['code'] !==200) {
				wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Could not retrieved account information due to - '. json_decode($response['body'])->error_description,
				]);
			}

			$responseBody = json_decode($response['body']);

		} else {
			wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'Something wend wrong!',
			]);
		}

		if(isset($responseBody->entries)){
			array_unshift($responseBody->entries , (object) [
				'id' => 'mf_subscription_email',
				'name' => 'Email',
			]);
			array_unshift($responseBody->entries , (object) [
				'id' => 'mf_subscription_name',
				'name' => 'Name',
			]);
		}
		wp_send_json_success([
			'result' => XPD_Constants::RETURN_OKAY,
			'custom_fields' => $responseBody,
			'msg' => 'Successfully returned.',
		]);
		wp_die();
	}


	/**
	 *
	 * @param $accountId
	 *
	 * @return string
	 */
	public function build_list_fetching_url($accountId) {
		return trailingslashit($this->aweber_api_account_url) . $accountId .'/lists';
	}


	/**
	 * Get the list of aweber mail list
	 *
	 * @return mixed
	 */
	public function get_list_lists() {

		$accToken = $this->get_access_token();

		if($accToken['result'] === XPD_Constants::RETURN_NOT_OKAY) {

			if(!empty($accToken['action_need'])) {

				return wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Developer did not authorized the application, please first authorize the app and then try again.',
				]);
			}

			return wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => $accToken['msg'],
			]);
		}

		if(empty($accToken['token'])) {

			return wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'Access token could not be retrieved.',
			]);
		}

		$accessToken = $accToken['token'];

		try {

			$bearerAuth = 'Bearer  ' . $accessToken;

			$headers = array(
				'Authorization' => $bearerAuth,
				'Accept' 	=> 'application/json',
				'User-Agent' 	=> 'XPD-AWeber-get-account',
			);

			$body = [];

			$payLoad = array(
				'method' => 'GET',
				'headers' => $headers,
				'body' => $body
			);

			$url = $this->aweber_api_account_url;

			$response = wp_remote_post($url, $payLoad);

		} catch(\Exception $ex) {

			return wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'Could not retrieved list due to api call fail! - ['. $ex->getMessage().']',
			]);
		}

		if (is_wp_error($response)) {

			return wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'Could not retrieved account information due to - '. $response->get_error_message(),
			]);
		}

		$json = json_decode($response['body']);

		if(!empty($json)) {

			if(property_exists($json, 'error')) {

				return wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Error returned while getting accounts. ['.$json->error.' :: '.$json->message.']',
				]);
			}

			if($json->total_size < 1) {

				return wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'No accounts found of this user!.',
				]);
			}

			// Todo: Do a loop to get all the accounts of this user...

			$entries = $json->entries;
			$account = $entries[0];
			$accountId = $account->id;

			// Save account data in option for future use.
			update_option(self::AWEBER_ACCOUNT_DATA_CACHE_KEY, $account);

			try {
				$bearerAuth = 'Bearer  ' . $accessToken;
				$headers = array(
					'Authorization' => $bearerAuth,
					'Accept' 	=> 'application/json',
					'User-Agent' 	=> 'XPD-AWeber-get-account',
				);

				$body = [];
				$payLoad = array(
					'method' => 'GET',
					'headers' => $headers,
					'body' => $body
				);

				$listUrl = $this->build_list_fetching_url($accountId);
				$response1 = wp_remote_post($listUrl, $payLoad);
			} catch(\Exception $ex) {

				return wp_send_json_error([
					'result' => XPD_Constants::RETURN_NOT_OKAY,
					'msg' => 'Account retrieve success but could not retrieved the list due to api call fail! - ['. $ex->getMessage().']',
				]);
			}


			$json = json_decode($response1['body']);
			if(!empty($json)) {

				if(property_exists($json, 'error')) {

					return wp_send_json_error([
						'result' => XPD_Constants::RETURN_NOT_OKAY,
						'msg' => 'Error returned while getting lists. ['.$json->error_description.']',
						'msg3' => $json->error,
					]);
				}

				$acOptions = [];

				if(!empty($json->entries)) {

					foreach($json->entries as $entry) {

						$tmp = [];
						$tmp['id'] = $entry->id;
						$tmp['name'] = $entry->name;
						$tmp['s_link'] = $entry->subscribers_collection_link;

						$acOptions[$entry->id] = $tmp;
					}

					update_option(self::AWEBER_LISTS_CACHE_KEY, $acOptions);
				}

				return wp_send_json_success([
					'result' => XPD_Constants::RETURN_OKAY,
					'lists' => $acOptions,
					'msg' => 'successfully retrieved.',
				]);
			}


			return wp_send_json_error([
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'Something very awful happened! Southern army attacked the Northern army :(, please try again later.'
			]);
		}


		return wp_send_json_error([
			'result' => XPD_Constants::RETURN_NOT_OKAY,
			'msg' => 'Could not retrieved account information, empty body returned from aweber server.'
		]);
	}


	/**
	 *
	 * @return array
	 */
	public function get_access_token() {

		return self::refresh_token();
	}


	/**
	 *
	 * @param $form_data
	 * @param $settings
	 *
	 * @return mixed
	 */
	public function call_api($form_data, $settings) {
		
		$listId     = $settings['mail_settings']['mf_aweber_list_id'];

		if(!empty($settings['mail_settings']['mf_aweber_custom_field_name_mf_subscription_email']['field_key'])){
			$emailFld   = $settings['mail_settings']['mf_aweber_custom_field_name_mf_subscription_email']['field_key'];
		} else {
			$emailFld   = $settings['email_name'];
		}
		if(!empty($settings['mail_settings']['mf_aweber_custom_field_name_mf_subscription_name']['field_key'])){
			$name_field_key   = $settings['mail_settings']['mf_aweber_custom_field_name_mf_subscription_name']['field_key'];
		} else {
			$name_field_key = 'mf-listing-fname';
		}
		$fNm        = (isset($form_data[$name_field_key]) ? $form_data[$name_field_key] : 'NF') ;
		$email      = (isset($form_data[$emailFld]) ? $form_data[$emailFld] : '') ;

		$data['email'] = $email;
		$data['name'] = $fNm;
		$aweber_custom_fields = [];
		foreach ($settings['mail_settings'] as $key => $value) {
                
			if (strpos($key, 'mf_aweber_custom_field_name_') !== false) {
				array_push($aweber_custom_fields, [
					'key' => $value['custom_field_key'],
					'value' => $form_data[$value['field_key']]
				]);
			}
		}

		$data['aweber_custom_fields'] = $aweber_custom_fields;

		return $this->add_subscriber_to_form($listId, $data);
	}


	/**
	 *
	 * @param $formId
	 * @param $form_data
	 *
	 * @return array
	 */
	public function add_subscriber_to_form($formId, $form_data) {

		$cacheList = get_option(self::AWEBER_LISTS_CACHE_KEY);
		$return = [];

		if(empty($cacheList[$formId])) {

			#error .........

			$return['status'] = 0;
			$return['msg'] = esc_html__('Lists could not found in cache!, please refresh the lists first.', 'metform-pro');

			return $return;
		}

		$accessToken = $this->get_access_token();

		if(empty($accessToken['token'])) {

			$return['status'] = 0;
			$return['msg'] = esc_html__('Failed to retrieve access token for aweber! action could not be performed.', 'metform-pro');

			return $return;
		}

		$config = [];
		$config['email']    = $form_data['email'];
		$config['name']     = $form_data['name'];

		if(isset($form_data['aweber_custom_fields']) && !empty($form_data['aweber_custom_fields'])){
			foreach($form_data['aweber_custom_fields'] as $field){
				$config['custom_fields'][$field['key']] = $field['value'];
			}
		}

		
		#$config['misc_notes']     = '';
		#$config['ad_tracking']    = '';
		#$config['custom_fields']  = ['key1' => 'val1', 'key2' => 'val2',];
		#$config['tags']           = [112, 114];

		try {

			$bearerAuth = 'Bearer  ' . $accessToken['token'];

			$headers = array(
				'Authorization' => $bearerAuth,
				'Content-Type' => 'application/json; charset=utf-8',
				'Accept' 	=> 'application/json',
				'User-Agent' 	=> 'XPD-AWeber-get-account',
			);

			$payLoad = array(
				'headers' => $headers,
				'method'  => 'POST',
				'body'    => wp_json_encode($config),
			);

			$url = $cacheList[$formId]['s_link'];

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

	public static function refresh_token() {
		
        $response = false;
		$token_data = get_option(self::ACCESS_TOKEN_KEY);
		if(empty($token_data)) {

			return [
				'result' => XPD_Constants::RETURN_NOT_OKAY,
				'msg' => 'No token found!',
			];
		}


        if(isset($token_data['token_type']) || !empty($token_data['token_type'])){
			
            if(!get_transient('mf_aweber_token_transient')){
                // Refresh the token
                $response = wp_remote_get( 'https://api.wpmet.com/public/aweber-auth/refresh-token.php?refresh_token='. $token_data['refresh_token'] );
			

                // Check if request is successful
                if($response['response']['code'] === 200){
                    
					$responseBody = json_decode($response['body'], true);
                    
					// Save new token values
                    $token_data['access_token'] = $responseBody['access_token'];
                    $token_data['refresh_token'] = $responseBody['refresh_token'];
                    $token_data['token_type'] = $responseBody['token_type'];
                    $token_data['expires_in'] = $responseBody['expires_in'];
    
                    // Save the results in a transient named latest_5_posts
                    set_transient( 'mf_aweber_token_transient', $responseBody['access_token'], $responseBody['expires_in'] );
    
                    // Update settings options
                    update_option(self::ACCESS_TOKEN_KEY, $token_data);

                    return [
						'result' => XPD_Constants::RETURN_OKAY,
						'token' => $token_data['access_token'],
					];
                }               
            }
        }
		return [
			'result' => XPD_Constants::RETURN_OKAY,
			'token' => $token_data['access_token'],
		];
    }

}