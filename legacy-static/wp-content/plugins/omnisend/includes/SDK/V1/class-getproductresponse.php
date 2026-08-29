<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

class GetProductResponse {
	private WP_Error $wp_error;
	private ?Product $product;

	/**
	 * @param WP_Error $wp_error
	 * @param ?Product $product
	 */
	public function __construct( WP_Error $wp_error, ?Product $product = null ) {
		$this->wp_error = $wp_error;
		$this->product  = $product;
	}

	public function get_product(): ?Product {
		return $this->product;
	}

	public function get_wp_error(): WP_Error {
		return $this->wp_error;
	}
}
