<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Omnisend Category class. It should be used with Omnisend Client.
 */
class Category {
	private const REQUIRED_PROPERTIES = array(
		'category_id',
		'title',
	);
	private const STRING_PROPERTIES   = array(
		'category_id',
		'title',
	);

	/**
	 * @var string $category_id
	 */
	private $category_id = null;

	/**
	 * @var string $title
	 */
	private $title = null;

	/**
	 * Sets category id
	 *
	 * @param string $category_id
	 *
	 * @return void
	 */
	public function set_category_id( $category_id ): void {
		$this->category_id = $category_id;
	}

	/**
	 * Sets category title
	 *
	 * @param string $title
	 *
	 * @return void
	 */
	public function set_title( $title ): void {
		$this->title = $title;
	}

	/**
	 * Gets category ID
	 *
	 * @return string
	 */
	public function get_category_id(): string {
		return (string) $this->category_id;
	}

	/**
	 * Gets category title
	 *
	 * @return string
	 */
	public function get_title(): string {
		return (string) $this->title;
	}

	/**
	 * Convert category to array
	 *
	 * If category is valid it will be transformed to array that can be sent to Omnisend.
	 *
	 * @return array
	 */
	public function to_array(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		return array(
			'categoryId' => $this->category_id,
			'title'      => $this->title,
		);
	}

	/**
	 * Convert category to array for update
	 *
	 * If category is valid it will be transformed to array that can be sent to Omnisend.
	 *
	 * @return array
	 */
	public function to_array_for_update(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		return array(
			'title' => $this->title,
		);
	}

	/**
	 * Validates category properties
	 *
	 * It ensures that required properties are set and that they are valid.
	 *
	 * @return WP_Error
	 */
	public function validate(): WP_Error {
		$error = new WP_Error();
		$error = $this->validate_properties( $error );

		if ( $error->has_errors() ) {
			return $error;
		}

		$error = $this->validate_values( $error );

		return $error;
	}

	/**
	 * Validates property types
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error
	 */
	private function validate_properties( WP_Error $error ): WP_Error {
		foreach ( $this as $property_key => $property_value ) {
			if ( in_array( $property_key, self::REQUIRED_PROPERTIES ) && empty( $property_value ) ) {
				$error->add( $property_key, $property_key . ' is a required property.' );
			}

			if ( $property_value !== null && in_array( $property_key, self::STRING_PROPERTIES ) && ! is_string( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a string' );
			}
		}

		return $error;
	}

	/**
	 * Validates property values
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error
	 */
	private function validate_values( WP_Error $error ): WP_Error {
		if ( strlen( $this->category_id ) > 100 ) {
			$error->add( 'category_id', 'Category ID must be under 100 characters' );
		}

		if ( strlen( $this->title ) > 100 ) {
			$error->add( 'title', 'Title must be under 100 characters' );
		}

		return $error;
	}
}
