<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

class CreateCategoryResponse {
	private string $category_id;
	private WP_Error $wp_error;

	/**
	 * @param WP_Error $wp_error
	 * @param string   $category_id
	 */
	public function __construct( WP_Error $wp_error, string $category_id = '' ) {
		$this->wp_error    = $wp_error;
		$this->category_id = $category_id;
	}

	public function get_category_id(): string {
		return $this->category_id;
	}

	public function get_wp_error(): WP_Error {
		return $this->wp_error;
	}
}
