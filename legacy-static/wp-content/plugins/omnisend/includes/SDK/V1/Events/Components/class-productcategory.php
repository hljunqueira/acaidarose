<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1\Events\Components;

use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Omnisend ProductCategory class. It should be used with Omnisend LineItem.
 */
class ProductCategory {
	private const STRING_PROPERTIES = array(
		'id',
		'title',
	);

	/**
	 * @var string $id
	 */
	private $id = null;

	/**
	 * @var string $title
	 */
	private $title = null;

	/**
	 * Sets category ID
	 *
	 * @param string $id
	 *
	 * @return void
	 */
	public function set_id( $id ): void {
		$this->id = $id;
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
	 * Converts ProductCategory to array.
	 *
	 * If ProductCategory is valid it will be transformed to array that can be used with LineItem
	 *
	 * @return array
	 */
	public function to_array() {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( $this->id !== null ) {
			$arr['id'] = $this->id;
		}

		if ( $this->title !== null ) {
			$arr['title'] = $this->title;
		}

		return $arr;
	}

	/**
	 * Validates properties
	 *
	 * It ensures that properties are valid
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
		if ( empty( $this->title ) && empty( $this->id ) ) {
			$error->add( 'required_properties', 'Title or ID should not be empty' );
		}

		foreach ( $this as $property_key => $property_value ) {
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
		if ( $this->title !== null && strlen( $this->title ) > 100 ) {
			$error->add( 'title', 'Title should not exceed 100 characters' );
		}

		return $error;
	}
}
