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
 * Omnisend Discount class. It should be used with Omnisend Events.
 */
class Discount {
	private const REQUIRED_PROPERTIES = array(
		'amount',
	);
	private const NUMERIC_PROPERTIES  = array(
		'amount',
	);
	private const STRING_PROPERTIES   = array(
		'code',
		'type',
	);

	/**
	 * @var mixed $amount
	 */
	private $amount = null;

	/**
	 * @var string $code
	 */
	private $code = null;

	/**
	 * @var string $type
	 */
	private $type = null;

	/**
	 * Sets discount amount
	 *
	 * @param mixed $amount
	 *
	 * @return void
	 */
	public function set_amount( $amount ): void {
		$this->amount = $amount;
	}

	/**
	 * Sets discount code
	 *
	 * @param string $code
	 *
	 * @return void
	 */
	public function set_code( $code ): void {
		$this->code = $code;
	}

	/**
	 * Sets discount type
	 *
	 * @param string $type
	 *
	 * @return void
	 */
	public function set_type( $type ): void {
		$this->type = $type;
	}

	/**
	 * Converts discount to array
	 *
	 * If discount is valid, it will be transformed to array that can be used with event
	 *
	 * @return array
	 */
	public function to_array() {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( $this->amount !== null ) {
			$arr['amount'] = $this->amount;
		}

		if ( $this->code !== null ) {
			$arr['code'] = $this->code;
		}

		if ( $this->type !== null ) {
			$arr['type'] = $this->type;
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

		return $error;
	}

	/**
	 * Validate property types
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error
	 */
	private function validate_properties( WP_Error $error ): WP_Error {
		foreach ( $this as $property_key => $property_value ) {
			if ( in_array( $property_key, self::REQUIRED_PROPERTIES ) && empty( $property_value ) ) {
				$error->add( $property_key, $property_key . ' is a required property' );
			}

			if ( $property_value !== null && in_array( $property_key, self::NUMERIC_PROPERTIES ) && ! is_numeric( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a number' );
			}

			if ( ! empty( $property_value ) && in_array( $property_key, self::STRING_PROPERTIES ) && ! is_string( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a string' );
			}
		}

		return $error;
	}
}
