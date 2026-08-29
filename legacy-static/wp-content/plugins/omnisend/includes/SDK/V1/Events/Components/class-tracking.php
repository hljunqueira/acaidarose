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
 * Omnisend Tracking class. It should be used with Omnisend Events.
 */
class Tracking {
	private const STRING_PROPERTIES = array(
		'code',
		'courier_title',
		'courier_url',
	);

	/**
	 * @var string $code
	 */
	private $code = null;

	/**
	 * @var string $courier_title
	 */
	private $courier_title = null;

	/**
	 * @var string $courier_url
	 */
	private $courier_url = null;

	/**
	 * Sets tracking code
	 *
	 * @param string $code
	 *
	 * @return void
	 */
	public function set_code( $code ): void {
		$this->code = $code;
	}

	/**
	 * Sets courier title
	 *
	 * @param string $title
	 *
	 * @return void
	 */
	public function set_courier_title( $title ): void {
		$this->courier_title = $title;
	}

	/**
	 * Sets courier URL
	 *
	 * @param string $url
	 *
	 * @return void
	 */
	public function set_courier_url( $url ): void {
		$this->courier_url = $url;
	}

	/**
	 * Converts tracking to array.
	 *
	 * If tracking is valid it will be transformed to array that can be used with event
	 *
	 * @return array
	 */
	public function to_array() {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( $this->code !== null ) {
			$arr['code'] = $this->code;
		}

		if ( $this->courier_title !== null ) {
			$arr['courierTitle'] = $this->courier_title;
		}

		if ( $this->courier_url !== null ) {
			$arr['courierURL'] = $this->courier_url;
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
		if ( empty( $this->code ) && empty( $this->courier_title ) && empty( $this->courier_url ) ) {
			$error->add( 'required_properties', 'Tracking code or courier title or courier URL should not be empty' );
		}

		foreach ( $this as $property_key => $property_value ) {
			if ( in_array( $property_key, self::STRING_PROPERTIES ) && $property_value !== null && ! is_string( $property_value ) ) {
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
		if ( $this->courier_url !== null && ! filter_var( $this->courier_url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'courier_url', 'courier url must contain a valid URL' );
		}

		return $error;
	}
}
