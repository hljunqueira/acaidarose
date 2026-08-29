<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1\Events;

use WP_Error;
use Omnisend\SDK\V1\Events\Components\LineItem;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Omnisend StartedCheckout class. It should be used with Omnisend Event.
 */
class StartedCheckout {
	public const EVENT_NAME = 'started checkout';

	private const REQUIRED_PROPERTIES = array(
		'abandoned_checkout_url',
		'cart_id',
		'currency',
		'value',
	);
	private const STRING_PROPERTIES   = array(
		'abandoned_checkout_url',
		'cart_id',
		'currency',
	);
	private const NUMERIC_PROPERTIES  = array(
		'value',
	);

	/**
	 * @var string $abandoned_checkout_url
	 */
	private $abandoned_checkout_url = null;

	/**
	 * @var string $cart_id
	 */
	private $cart_id = null;

	/**
	 * @var string $currency
	 */
	private $currency = null;

	/**
	 * @var mixed $value
	 */
	private $value = null;

	/**
	 * @var array $line_items
	 */
	private array $line_items = array();

	/**
	 * Sets abandoned checkout URL
	 *
	 * @param string $abandoned_checkout_url
	 *
	 * @return void
	 */
	public function set_abandoned_checkout_url( $abandoned_checkout_url ): void {
		$this->abandoned_checkout_url = $abandoned_checkout_url;
	}

	/**
	 * Sets cart ID
	 *
	 * @param string $cart_id
	 *
	 * @return void
	 */
	public function set_cart_id( $cart_id ): void {
		$this->cart_id = $cart_id;
	}

	/**
	 * Sets currency
	 *
	 * @param string $currency
	 *
	 * @return void
	 */
	public function set_currency( $currency ): void {
		$this->currency = $currency;
	}

	/**
	 * Sets total cart value
	 *
	 * @param mixed $value
	 *
	 * @return void
	 */
	public function set_value( $value ): void {
		$this->value = $value;
	}

	/**
	 * Adds line item
	 *
	 * @param LineItem $item
	 *
	 * @return void
	 */
	public function add_line_item( $item ): void {
		$this->line_items[] = $item;
	}

	/**
	 * Converts StartedCheckout to array.
	 *
	 * If StartedCheckout is valid it will be transformed to array that can be sent to Omnisend.
	 *
	 * @return array
	 */
	public function to_array(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( $this->abandoned_checkout_url !== null ) {
			$arr['abandonedCheckoutURL'] = $this->abandoned_checkout_url;
		}

		if ( $this->cart_id !== null ) {
			$arr['cartID'] = $this->cart_id;
		}

		if ( $this->currency !== null ) {
			$arr['currency'] = $this->currency;
		}

		if ( $this->value !== null ) {
			$arr['value'] = $this->value;
		}

		foreach ( $this->line_items as $item ) {
			$arr['lineItems'][] = $item->to_array();
		}

		return $arr;
	}

	/**
	 * Validate properties
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
	 * Validate property types
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error
	 */
	private function validate_properties( WP_Error $error ): WP_Error {
		foreach ( $this as $property_key => $property_value ) {
			if ( in_array( $property_key, self::REQUIRED_PROPERTIES ) && $property_value === null ) {
				$error->add( $property_key, $property_key . ' is a required property' );
			}

			if ( $property_value !== null && in_array( $property_key, self::STRING_PROPERTIES ) && ! is_string( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a string' );
			}

			if ( $property_value !== null && in_array( $property_key, self::NUMERIC_PROPERTIES ) && ! is_numeric( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a number' );
			}
		}

		foreach ( $this->line_items as $item ) {
			if ( ! $item instanceof LineItem ) {
				$error->add( 'line_item', 'Line Item is not an instance of LineItem' );
			}
		}

		return $error;
	}

	/**
	 * Validate property values
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error
	 */
	private function validate_values( WP_Error $error ): WP_Error {
		foreach ( $this->line_items as $item ) {
			$error->merge_from( $item->validate() );
		}

		if ( ! filter_var( $this->abandoned_checkout_url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'abandoned_checkout_url', 'Abandoned checkout URL must contain a valid URL' );
		}

		if ( ! ctype_upper( $this->currency ) ) {
			$error->add( 'currency', 'Currency code must be all uppercase' );
		}

		return $error;
	}
}
