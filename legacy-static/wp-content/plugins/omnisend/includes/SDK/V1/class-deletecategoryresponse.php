<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

class DeleteCategoryResponse {
	private WP_Error $wp_error;
	private bool $success;

	/**
	 * @param WP_Error $wp_error
	 * @param bool     $success
	 */
	public function __construct( WP_Error $wp_error, bool $success = false ) {
		$this->wp_error = $wp_error;
		$this->success  = $success;
	}

	public function get_response(): bool {
		return $this->success;
	}

	public function get_wp_error(): WP_Error {
		return $this->wp_error;
	}
}
