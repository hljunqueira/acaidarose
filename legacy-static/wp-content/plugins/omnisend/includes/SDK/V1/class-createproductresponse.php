<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

class CreateProductResponse {
	private WP_Error $wp_error;
	private string $product_id;

	/**
	 * @param WP_Error $wp_error
	 * @param string   $product_id
	 */
	public function __construct( WP_Error $wp_error, string $product_id = '' ) {
		$this->wp_error   = $wp_error;
		$this->product_id = $product_id;
	}

	public function get_product_id(): string {
		return $this->product_id;
	}

	public function get_wp_error(): WP_Error {
		return $this->wp_error;
	}
}
