<?php

namespace MetForm_Pro\Core\Integrations;

defined( 'ABSPATH' ) || exit;

class Zapier {


	public function call_webhook( $form_data, $settings ) {

		$data = $form_data;
		unset( $data['action'] );
		unset( $data['id'] );
		unset( $data['form_nonce'] );

		return $this->post( $settings['url'], $data );
	}

	public function post( $url, $data = [] ) {
		$data = json_encode( $data );
		$curl = curl_init();
		curl_setopt( $curl, CURLOPT_URL, $url );
		curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, 'POST' );
		curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
		curl_setopt( $curl, CURLOPT_CONNECTTIMEOUT, 5 );
		curl_setopt( $curl, CURLOPT_TIMEOUT, 20 );
		curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
		curl_setopt( $curl, CURLOPT_HTTPHEADER, [
			'Content-Type: application/json'
		] );
		curl_setopt( $curl, CURLOPT_POSTFIELDS, $data );

		$msg      = [];
		$response = curl_exec( $curl );

		if ( 0 !== curl_errno( $curl ) ) {
			$msg['status'] = 0;
			$msg['msg']    = curl_error( $curl );
		} else {
			$msg['status'] = 1;
			$msg['msg']    = esc_html__( 'Your data inserted on zapier.', 'metform-pro' );
		}
		curl_close( $curl );

		//return json_decode( $response, true );
		return $msg;
	}

}