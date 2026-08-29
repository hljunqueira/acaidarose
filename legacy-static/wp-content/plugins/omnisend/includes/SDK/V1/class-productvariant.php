<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use Omnisend\SDK\V1\Product;
use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Omnisend ProductVariant class. It should be used with Omnisend Product.
 */
class ProductVariant {
	private const REQUIRED_PROPERTIES = array(
		'id',
		'price',
		'title',
		'url',
	);
	private const STRING_PROPERTIES   = array(
		'default_image_url',
		'description',
		'sku',
		'status',
		'id',
		'title',
		'url',
	);
	private const NUMERIC_PROPERTIES  = array(
		'price',
		'strike_through_price',
	);
	private const ARRAY_PROPERTIES    = array(
		'images',
	);

	/**
	 * @var string $default_image_url
	 */
	private $default_image_url = null;

	/**
	 * @var string $description
	 */
	private $description = null;

	/**
	 * @var string $id
	 */
	private $id = null;

	/**
	 * @var mixed $price
	 */
	private $price = null;

	/**
	 * @var string $sku
	 */
	private $sku = null;

	/**
	 * @var string $status
	 */
	private $status = null;

	/**
	 * @var mixed $strike_through_price
	 */
	private $strike_through_price = null;

	/**
	 * @var string $title
	 */
	private $title = null;

	/**
	 * @var string $url
	 */
	private $url = null;

	/**
	 * @var array $images
	 */
	private array $images = array();

	/**
	 * Sets variant default image URL
	 *
	 * @param string $default_image_url
	 *
	 * @return void
	 */
	public function set_default_image_url( $default_image_url ): void {
		$this->default_image_url = $default_image_url;
	}

	/**
	 * Sets variant description
	 *
	 * @param string $description
	 *
	 * @return void
	 */
	public function set_description( $description ): void {
		$this->description = $description;
	}

	/**
	 * Sets variant ID
	 *
	 * @param string $id
	 *
	 * @return void
	 */
	public function set_id( $id ): void {
		$this->id = $id;
	}

	/**
	 * Sets variant price
	 *
	 * @param mixed $price
	 *
	 * @return void
	 */
	public function set_price( $price ): void {
		$this->price = $price;
	}

	/**
	 * Sets variant SKU
	 *
	 * @param string $sku
	 *
	 * @return void
	 */
	public function set_sku( $sku ): void {
		$this->sku = $sku;
	}

	/**
	 * Sets variant status
	 *
	 * @param string $status
	 *
	 * @return void
	 */
	public function set_status( $status ): void {
		$this->status = $status;
	}

	/**
	 * Sets variant price before discount
	 *
	 * @param mixed $strike_through_price
	 *
	 * @return void
	 */
	public function set_strike_through_price( $strike_through_price ): void {
		$this->strike_through_price = $strike_through_price;
	}

	/**
	 * Sets variant title
	 *
	 * @param string $title
	 *
	 * @return void
	 */
	public function set_title( $title ): void {
		$this->title = $title;
	}

	/**
	 * Sets variant URL
	 *
	 * @param string $url
	 *
	 * @return void
	 */
	public function set_url( $url ): void {
		$this->url = $url;
	}

	/**
	 * Adds variant image
	 *
	 * @param string $image_url
	 *
	 * @return void
	 */
	public function add_image( $image_url ): void {
		$this->images[] = $image_url;
	}

	/**
	 * Convert product variants to array
	 *
	 * If variants are valid it will be transformed to array that can be sent with Product to Omnisend.
	 *
	 * @return array
	 */
	public function to_array(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array(
			'id'    => $this->id,
			'price' => $this->price,
			'title' => $this->title,
			'url'   => $this->url,
		);

		if ( ! empty( $this->default_image_url ) ) {
			$arr['defaultImageUrl'] = $this->default_image_url;
		}

		if ( ! empty( $this->description ) ) {
			$arr['description'] = $this->description;
		}

		if ( ! empty( $this->images ) ) {
			$arr['images'] = $this->images;
		}

		if ( ! empty( $this->sku ) ) {
			$arr['sku'] = $this->sku;
		}

		if ( ! empty( $this->status ) ) {
			$arr['status'] = $this->status;
		}

		if ( ! empty( $this->strike_through_price ) ) {
			$arr['strikeThroughPrice'] = $this->strike_through_price;
		}

		return $arr;
	}

	/**
	 * Validates properties
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
	 * @return WP_Error $error
	 */
	private function validate_properties( WP_Error $error ): WP_Error {
		foreach ( $this as $property_key => $property_value ) {
			if ( in_array( $property_key, self::REQUIRED_PROPERTIES ) && $property_value === null ) {
				$error->add( $property_key, $property_key . ' is a required property' );
			}

			if ( $property_value !== null && in_array( $property_key, self::NUMERIC_PROPERTIES ) && ! is_numeric( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a number' );
			}

			if ( $property_value !== null && in_array( $property_key, self::STRING_PROPERTIES ) && ! is_string( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a string' );
			}

			if ( $property_value !== null && in_array( $property_key, self::ARRAY_PROPERTIES ) && ! is_array( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be an array' );
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
		if ( $this->status !== null && ! in_array( $this->status, Product::AVAILABLE_STATUS ) ) {
			$error->add( 'status', sprintf( 'Status must be one of the following: %s', implode( ',', Product::AVAILABLE_STATUS ) ) );
		}

		if ( strlen( $this->id ) > 100 ) {
			$error->add( 'id', 'ID must be under 100 characters' );
		}

		if ( strlen( $this->title ) > 100 ) {
			$error->add( 'title', 'Title must be under 100 characters' );
		}

		if ( $this->description !== null && strlen( $this->description ) > 300 ) {
			$error->add( 'description', 'Description must be under 300 characters' );
		}

		if ( $this->sku !== null && strlen( $this->sku ) > 100 ) {
			$error->add( 'sku', 'SKU must be under 100 characters' );
		}

		if ( ! empty( $this->default_image_url ) && ! filter_var( $this->default_image_url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'default_image_url', 'Default image URL must contain a valid URL' );
		}

		if ( ! filter_var( $this->url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'url', 'Url must contain a valid URL' );
		}

		return $error;
	}
}
