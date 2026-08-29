<?php

namespace MetForm_Pro\Core\Integrations\Google_Sheet;

defined( 'ABSPATH' ) || exit;

class Google_Access_Token {

	public $redirect_uri; 

	public $google_client_id;

	public $google_client_secret;

	public function __construct() {

		$settings = \MetForm\Core\Admin\Base::instance()->get_settings_option();
        $this->google_client_id = isset($settings['mf_google_sheet_client_id']) ? $settings['mf_google_sheet_client_id'] : '';
        $this->google_client_secret = isset($settings['mf_google_sheet_client_secret']) ? $settings['mf_google_sheet_client_secret'] : '';

		$this->redirect_uri = admin_url('/admin.php?page=metform-menu-settings');
	}

	public function get_access_token() {

		$code = $_GET['code'];

		$url = 'https://accounts.google.com/o/oauth2/token';

		$params = array(
			"code" => $code,
			"client_id" => $this->google_client_id,
			"client_secret" => $this->google_client_secret,
			"redirect_uri" => $this->redirect_uri,
			"grant_type" => "authorization_code",
			"access_type"=>"offline",
		);

		$response = wp_remote_post( $url, array(
			'method'      => 'POST',
			'body'        => $params
			)
		);
		
		if ( is_wp_error($response) or isset(json_decode($response['body'], true)['error'])) {
			return false;
		}
		return $response;
	}

	public function get_code() {
		$url = "https://accounts.google.com/o/oauth2/auth";

		$params = array(
			"response_type"     => "code",
			"client_id"         => $this->google_client_id,
			"redirect_uri"      => $this->redirect_uri,
			'scope'             => 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
			'approval_prompt'   => 'force',
			'access_type'       => 'offline'
		);

		$request_to = $url . '?' . http_build_query($params);
		
		return $request_to;
	}
}