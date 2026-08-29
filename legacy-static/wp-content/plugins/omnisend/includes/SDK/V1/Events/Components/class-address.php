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
 * Omnisend Address class. It should be used with Omnisend Events.
 */
class Address {
	private const STRING_PROPERTIES = array(
		'shipping_address_1',
		'shipping_address_2',
		'shipping_city',
		'shipping_company',
		'shipping_country',
		'shipping_first_name',
		'shipping_last_name',
		'shipping_phone',
		'shipping_state',
		'shipping_state_code',
		'shipping_zip',
		'billing_address_1',
		'billing_address_2',
		'billing_city',
		'billing_company',
		'billing_country',
		'billing_first_name',
		'billing_last_name',
		'billing_phone',
		'billing_state',
		'billing_state_code',
		'billing_zip',
	);

	/**
	 * @var string $shipping_address_1
	 */
	private $shipping_address_1 = null;

	/**
	 * @var string $shipping_address_2
	 */
	private $shipping_address_2 = null;

	/**
	 * @var string $shipping_city
	 */
	private $shipping_city = null;

	/**
	 * @var string $shipping_company
	 */
	private $shipping_company = null;

	/**
	 * @var string $shipping_country
	 */
	private $shipping_country = null;

	/**
	 * @var string $shipping_first_name
	 */
	private $shipping_first_name = null;

	/**
	 * @var string $shipping_last_name
	 */
	private $shipping_last_name = null;

	/**
	 * @var string $shipping_phone
	 */
	private $shipping_phone = null;

	/**
	 * @var string $shipping_state
	 */
	private $shipping_state = null;

	/**
	 * @var string $shipping_state_code
	 */
	private $shipping_state_code = null;

	/**
	 * @var string $shipping_zip
	 */
	private $shipping_zip = null;

	/**
	 * @var string $billing_address_1
	 */
	private $billing_address_1 = null;

	/**
	 * @var string $billing_address_2
	 */
	private $billing_address_2 = null;

	/**
	 * @var string $billing_city
	 */
	private $billing_city = null;

	/**
	 * @var string $billing_company
	 */
	private $billing_company = null;

	/**
	 * @var string $billing_country
	 */
	private $billing_country = null;

	/**
	 * @var string $billing_first_name
	 */
	private $billing_first_name = null;

	/**
	 * @var string $billing_last_name
	 */
	private $billing_last_name = null;

	/**
	 * @var string $billing_phone
	 */
	private $billing_phone = null;

	/**
	 * @var string $billing_state
	 */
	private $billing_state = null;

	/**
	 * @var string $billing_state_code
	 */
	private $billing_state_code = null;

	/**
	 * @var string $billing_zip
	 */
	private $billing_zip = null;

	/**
	 * Sets billing address 1
	 *
	 * @param string $billing_address_1
	 *
	 * @return void
	 */
	public function set_billing_address_1( $billing_address_1 ): void {
		$this->billing_address_1 = $billing_address_1;
	}

	/**
	 * Sets billing address 2
	 *
	 * @param string $billing_address_2
	 *
	 * @return void
	 */
	public function set_billing_address_2( $billing_address_2 ): void {
		$this->billing_address_2 = $billing_address_2;
	}

	/**
	 * Sets billing city
	 *
	 * @param string $billing_city
	 *
	 * @return void
	 */
	public function set_billing_city( $billing_city ): void {
		$this->billing_city = $billing_city;
	}

	/**
	 * Sets billing company
	 *
	 * @param string $billing_company
	 *
	 * @return void
	 */
	public function set_billing_company( $billing_company ): void {
		$this->billing_company = $billing_company;
	}

	/**
	 * Sets billing country
	 *
	 * @param string $billing_country
	 *
	 * @return void
	 */
	public function set_billing_country( $billing_country ): void {
		$this->billing_country = $billing_country;
	}

	/**
	 * Sets billing first name
	 *
	 * @param string $billing_first_name
	 *
	 * @return void
	 */
	public function set_billing_first_name( $billing_first_name ): void {
		$this->billing_first_name = $billing_first_name;
	}

	/**
	 * Sets billing last name
	 *
	 * @param string $billing_last_name
	 *
	 * @return void
	 */
	public function set_billing_last_name( $billing_last_name ): void {
		$this->billing_last_name = $billing_last_name;
	}

	/**
	 * Sets billing phone
	 *
	 * @param string $billing_phone
	 *
	 * @return void
	 */
	public function set_billing_phone( $billing_phone ): void {
		$this->billing_phone = $billing_phone;
	}

	/**
	 * Sets billing state
	 *
	 * @param string $billing_state
	 *
	 * @return void
	 */
	public function set_billing_state( $billing_state ): void {
		$this->billing_state = $billing_state;
	}

	/**
	 * Sets billing state code
	 *
	 * @param string $billing_state_code
	 *
	 * @return void
	 */
	public function set_billing_state_code( $billing_state_code ): void {
		$this->billing_state_code = $billing_state_code;
	}

	/**
	 * Sets billing zip
	 *
	 * @param string $billing_zip
	 *
	 * @return void
	 */
	public function set_billing_zip( $billing_zip ): void {
		$this->billing_zip = $billing_zip;
	}

	/**
	 * Sets shipping address 1
	 *
	 * @param string $shipping_address_1
	 *
	 * @return void
	 */
	public function set_shipping_address_1( $shipping_address_1 ): void {
		$this->shipping_address_1 = $shipping_address_1;
	}

	/**
	 * Sets shipping address 2
	 *
	 * @param string $shipping_address_2
	 *
	 * @return void
	 */
	public function set_shipping_address_2( $shipping_address_2 ): void {
		$this->shipping_address_2 = $shipping_address_2;
	}

	/**
	 * Sets shipping city
	 *
	 * @param string $shipping_city
	 *
	 * @return void
	 */
	public function set_shipping_city( $shipping_city ): void {
		$this->shipping_city = $shipping_city;
	}

	/**
	 * Sets shipping company
	 *
	 * @param string $shipping_company
	 *
	 * @return void
	 */
	public function set_shipping_company( $shipping_company ): void {
		$this->shipping_company = $shipping_company;
	}

	/**
	 * Sets shipping country
	 *
	 * @param string $shipping_country
	 *
	 * @return void
	 */
	public function set_shipping_country( $shipping_country ): void {
		$this->shipping_country = $shipping_country;
	}

	/**
	 * Sets shipping first name
	 *
	 * @param string $shipping_first_name
	 *
	 * @return void
	 */
	public function set_shipping_first_name( $shipping_first_name ): void {
		$this->shipping_first_name = $shipping_first_name;
	}

	/**
	 * Sets shipping last name
	 *
	 * @param string $shipping_last_name
	 *
	 * @return void
	 */
	public function set_shipping_last_name( $shipping_last_name ): void {
		$this->shipping_last_name = $shipping_last_name;
	}

	/**
	 * Sets shipping phone
	 *
	 * @param string $shipping_phone
	 *
	 * @return void
	 */
	public function set_shipping_phone( $shipping_phone ): void {
		$this->shipping_phone = $shipping_phone;
	}

	/**
	 * Sets shipping state
	 *
	 * @param string $shipping_state
	 *
	 * @return void
	 */
	public function set_shipping_state( $shipping_state ): void {
		$this->shipping_state = $shipping_state;
	}

	/**
	 * Sets shipping state code
	 *
	 * @param string $shipping_state_code
	 *
	 * @return void
	 */
	public function set_shipping_state_code( $shipping_state_code ): void {
		$this->shipping_state_code = $shipping_state_code;
	}

	/**
	 * Sets shipping zip
	 *
	 * @param string $shipping_zip
	 *
	 * @return void
	 */
	public function set_shipping_zip( $shipping_zip ): void {
		$this->shipping_zip = $shipping_zip;
	}

	/**
	 * Converts shipping address to array
	 *
	 * If shipping address is valid it will be transformed to array that can be used with event
	 *
	 * @return array
	 */
	public function to_array_shipping(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( ! empty( $this->shipping_address_1 ) ) {
			$arr['address1'] = $this->shipping_address_1;
		}

		if ( ! empty( $this->shipping_address_2 ) ) {
			$arr['address2'] = $this->shipping_address_2;
		}

		if ( ! empty( $this->shipping_city ) ) {
			$arr['city'] = $this->shipping_city;
		}

		if ( ! empty( $this->shipping_company ) ) {
			$arr['company'] = $this->shipping_company;
		}

		if ( ! empty( $this->shipping_country ) ) {
			$arr['country'] = $this->shipping_country;
		}

		if ( ! empty( $this->shipping_first_name ) ) {
			$arr['firstName'] = $this->shipping_first_name;
		}

		if ( ! empty( $this->shipping_last_name ) ) {
			$arr['lastName'] = $this->shipping_last_name;
		}

		if ( ! empty( $this->shipping_phone ) ) {
			$arr['phone'] = $this->shipping_phone;
		}

		if ( ! empty( $this->shipping_state ) ) {
			$arr['state'] = $this->shipping_state;
		}

		if ( ! empty( $this->shipping_state_code ) ) {
			$arr['stateCode'] = $this->shipping_state_code;
		}

		if ( ! empty( $this->shipping_zip ) ) {
			$arr['zip'] = $this->shipping_zip;
		}

		return $arr;
	}

	/**
	 * Convert billing address to array.
	 *
	 * If billing address is valid, it will be transformed to array that can be used with event
	 *
	 * @return array
	 */
	public function to_array_billing(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( ! empty( $this->billing_address_1 ) ) {
			$arr['address1'] = $this->billing_address_1;
		}

		if ( ! empty( $this->billing_address_2 ) ) {
			$arr['address2'] = $this->billing_address_2;
		}

		if ( ! empty( $this->billing_city ) ) {
			$arr['city'] = $this->billing_city;
		}

		if ( ! empty( $this->billing_company ) ) {
			$arr['company'] = $this->billing_company;
		}

		if ( ! empty( $this->billing_country ) ) {
			$arr['country'] = $this->billing_country;
		}

		if ( ! empty( $this->billing_first_name ) ) {
			$arr['firstName'] = $this->billing_first_name;
		}

		if ( ! empty( $this->billing_last_name ) ) {
			$arr['lastName'] = $this->billing_last_name;
		}

		if ( ! empty( $this->billing_phone ) ) {
			$arr['phone'] = $this->billing_phone;
		}

		if ( ! empty( $this->billing_state ) ) {
			$arr['state'] = $this->billing_state;
		}

		if ( ! empty( $this->billing_state_code ) ) {
			$arr['stateCode'] = $this->billing_state_code;
		}

		if ( ! empty( $this->billing_zip ) ) {
			$arr['zip'] = $this->billing_zip;
		}

		return $arr;
	}

	/**
	 * Validate properties
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
			if ( $property_value !== null && in_array( $property_key, self::STRING_PROPERTIES ) && ! is_string( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a string' );
			}
		}

		return $error;
	}
}
