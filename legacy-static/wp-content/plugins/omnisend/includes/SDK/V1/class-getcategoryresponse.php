<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

class GetCategoryResponse {
	private ?Category $category;
	private WP_Error $wp_error;

	/**
	 * @param WP_Error  $wp_error
	 * @param ?Category $category
	 */
	public function __construct( WP_Error $wp_error, ?Category $category = null ) {
		$this->wp_error = $wp_error;
		$this->category = $category;
	}

	public function get_category(): ?Category {
		return $this->category;
	}

	public function get_wp_error(): WP_Error {
		return $this->wp_error;
	}
}
