<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use Omnisend\Internal\Utils;
use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Omnisend Batch class. It should be used with Omnisend Client.
 */
class Batch {
	public const POST_METHOD = 'POST';
	public const PUT_METHOD  = 'PUT';

	private const REQUIRED_PROPERTIES = array(
		'items',
		'method',
	);
	private const STRING_PROPERTIES   = array(
		'endpoint',
		'method',
		'origin',
	);
	private const ARRAY_PROPERTIES    = array(
		'items',
	);
	private const ENDPOINT_MAPPINGS   = array(
		'Omnisend\SDK\V1\Category' => 'categories',
		'Omnisend\SDK\V1\Product'  => 'products',
		'Omnisend\SDK\V1\Contact'  => 'contacts',
		'Omnisend\SDK\V1\Event'    => 'events',
	);
	private const AVAILABLE_METHODS   = array(
		self::POST_METHOD,
		self::PUT_METHOD,
	);

	/**
	 * @var string $method
	 */
	private $method = null;

	/**
	 * @var string $origin
	 */
	private $origin = null;

	/**
	 * @var array $items
	 */
	private array $items = array();

	/**
	 * Sets batch items
	 *
	 * Alternative method of "add_item" method
	 *
	 * @param array $items
	 *
	 * @return void
	 */
	public function set_items( $items ): void {
		$this->items = $items;
	}

	/**
	 * Adds a single batch item
	 *
	 * Alternative method of "set_items" method
	 *
	 * @param mixed $item
	 *
	 * @return void
	 */
	public function add_item( $item ): void {
		if ( ! is_array( $this->items ) ) {
			$this->items = array();
		}

		$this->items[] = $item;
	}

	/**
	 * Sets method, it can be "PUT" or "POST"
	 *
	 * @param string $method
	 *
	 * @return void
	 */
	public function set_method( $method ): void {
		$this->method = $method;
	}

	/**
	 * Sets origin of request
	 *
	 * @param string $origin
	 *
	 * @return void
	 */
	public function set_origin( $origin ): void {
		$this->origin = $origin;
	}

	/**
	 * Convert batch to array
	 *
	 * If batch is valid it will be transformed to array that can be sent to Omnisend.
	 *
	 * @return array
	 */
	public function to_array(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array(
			'endpoint' => self::ENDPOINT_MAPPINGS[ get_class( reset( $this->items ) ) ],
			'method'   => $this->method,
		);

		foreach ( $this->items as $item ) {
			$arr['items'][] = $item->to_array();
		}

		if ( $this->origin !== null ) {
			$arr['origin'] = $this->origin;
		}

		return $arr;
	}


	/**
	 * Validate properties.
	 *
	 * It ensures that required properties are set and that they are valid.
	 *
	 * @return WP_Error
	 */
	public function validate(): WP_Error {
		$error = new WP_Error();
		$error = $this->validate_properties( $error );
		$error = $this->validate_items( $error );

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
	 * @return WP_Error $error
	 */
	private function validate_properties( WP_Error $error ): WP_Error {
		foreach ( $this as $property_key => $property_value ) {
			if ( in_array( $property_key, self::REQUIRED_PROPERTIES ) && empty( $property_value ) ) {
				$error->add( $property, $property_key . ' is a required property.' );
			}

			if ( $property_value !== null && in_array( $property_key, self::STRING_PROPERTIES ) && ! is_string( $property_value ) ) {
				$error->add( $property, $property_key . ' must be a string.' );
			}

			if ( $property_value !== null && in_array( $property_key, self::ARRAY_PROPERTIES ) && ! is_array( $property_value ) ) {
				$error->add( $property, $property_key . ' must be an array.' );
			}
		}

		return $error;
	}

	/**
	 * Validates provided items
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error $error
	 */
	private function validate_items( WP_Error $error ): WP_Error {
		$type = get_class( reset( $this->items ) );

		if ( ! array_key_exists( $type, self::ENDPOINT_MAPPINGS ) ) {
			$error->add( 'Items', 'Unknown item type' );

			return $error;
		}

		foreach ( $this->items as $item ) {
			if ( get_class( $item ) !== $type ) {
				$error->add( 'Items', 'Mixed items found, make sure items are of one type: ' . implode( ',', self::ENDPOINT_MAPPINGS ) );

				return $error;
			}

			if ( $item->validate()->has_errors() ) {
				$error->merge_from( $item->validate() );
			}
		}

		return $error;
	}

	/**
	 * Validates property values
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error $error
	 */
	private function validate_values( WP_Error $error ): WP_Error {
		if ( empty( $this->items ) || count( $this->items ) > 1000 ) {
			$error->add( 'items', sprintf( 'Items are empty or batch size limit: %s was exceeded', 1000 ) );
		}

		return $error;
	}
}
