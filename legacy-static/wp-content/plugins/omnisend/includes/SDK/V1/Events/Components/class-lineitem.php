<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1\Events\Components;

use Omnisend\Internal\Utils;
use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Omnisend LineItem class. It should be used with Omnisend Events.
 */
class LineItem {
	private const REQUIRED_PROPERTIES = array(
		'id',
		'price',
		'quantity',
		'title',
		'variant_id',
	);
	private const STRING_PROPERTIES   = array(
		'description',
		'id',
		'image_url',
		'sku',
		'title',
		'url',
		'variant_id',
		'variant_image_url',
		'variant_title',
		'vendor',
	);
	private const NUMERIC_PROPERTIES  = array(
		'discount',
		'price',
		'quantity',
		'weight',
		'strike_through_price',
	);

	/**
	 * @var string $description
	 */
	private $description = null;

	/**
	 * @var mixed $discount
	 */
	private $discount = null;

	/**
	 * @var string $id
	 */
	private $id = null;

	/**
	 * @var string $image_url
	 */
	private $image_url = null;

	/**
	 * @var mixed $price
	 */
	private $price = null;

	/**
	 * @var int $quantity
	 */
	private $quantity = null;

	/**
	 * @var string $sku
	 */
	private $sku = null;

	/**
	 * @var string $title
	 */
	private $title = null;

	/**
	 * @var string $url
	 */
	private $url = null;

	/**
	 * @var string $variant_id
	 */
	private $variant_id = null;

	/**
	 * @var string $variant_image_url
	 */
	private $variant_image_url = null;

	/**
	 * @var string $variant_title
	 */
	private $variant_title = null;

	/**
	 * @var string $vendor
	 */
	private $vendor = null;

	/**
	 * @var mixed $weight
	 */
	private $weight = null;

	/**
	 * @var mixed $strike_through_price
	 */
	private $strike_through_price = null;

	/**
	 * @var array $categories
	 */
	private array $categories = array();

	/**
	 * @var array $tags
	 */
	private array $tags = array();

	/**
	 * Sets item description
	 *
	 * @param string $description
	 *
	 * @return void
	 */
	public function set_description( $description ): void {
		$this->description = $description;
	}

	/**
	 * Sets item discount
	 *
	 * @param mixed $discount_amount
	 *
	 * @return void
	 */
	public function set_discount( $discount_amount ): void {
		$this->discount = $discount_amount;
	}

	/**
	 * Sets item ID
	 *
	 * @param string $id
	 *
	 * @return void
	 */
	public function set_id( $id ): void {
		$this->id = $id;
	}

	/**
	 * Sets item featured image
	 *
	 * @param string $image_url
	 *
	 * @return void
	 */
	public function set_image_url( $image_url ): void {
		$this->image_url = $image_url;
	}

	/**
	 * Sets item final price
	 *
	 * @param mixed $price
	 *
	 * @return void
	 */
	public function set_price( $price ): void {
		$this->price = $price;
	}

	/**
	 * Sets item original price, if discount is active
	 *
	 * @param mixed $strike_through_price
	 *
	 * @return void
	 */
	public function set_strike_through_price( $strike_through_price ): void {
		$this->strike_through_price = $strike_through_price;
	}

	/**
	 * Sets item quantity
	 *
	 * @param int $quantity
	 *
	 * @return void
	 */
	public function set_quantity( $quantity ): void {
		$this->quantity = $quantity;
	}

	/**
	 * Sets item SKU
	 *
	 * @param string $sku
	 *
	 * @return void
	 */
	public function set_sku( $sku ): void {
		$this->sku = $sku;
	}

	/**
	 * Sets item title
	 *
	 * @param string $title
	 *
	 * @return void
	 */
	public function set_title( $title ): void {
		$this->title = $title;
	}

	/**
	 * Sets item URL
	 *
	 * @param string $url
	 *
	 * @return void
	 */
	public function set_url( $url ): void {
		$this->url = $url;
	}

	/**
	 * Sets item variant ID
	 *
	 * @param string $variant_id
	 *
	 * @return void
	 */
	public function set_variant_id( $variant_id ): void {
		$this->variant_id = $variant_id;
	}

	/**
	 * Sets item variant image URL
	 *
	 * @param string $variant_image_url
	 *
	 * @return void
	 */
	public function set_variant_image_url( $variant_image_url ): void {
		$this->variant_image_url = $variant_image_url;
	}

	/**
	 * Sets item variant title
	 *
	 * @param string $variant_title
	 *
	 * @return void
	 */
	public function set_variant_title( $variant_title ): void {
		$this->variant_title = $variant_title;
	}

	/**
	 * Sets item vendor
	 *
	 * @param string $vendor
	 *
	 * @return void
	 */
	public function set_vendor( $vendor ): void {
		$this->vendor = $vendor;
	}

	/**
	 * Sets item weight
	 *
	 * @param mixed $weight
	 *
	 * @return void
	 */
	public function set_weight( $weight ): void {
		$this->weight = $weight;
	}

	/**
	 * Adds item category
	 *
	 * @param ProductCategory $product_category
	 *
	 * @return void
	 */
	public function add_category( $product_category ): void {
		$this->categories[] = $product_category;
	}

	/**
	 * Adds a tag
	 *
	 * @param string $tag
	 * @param bool   $clean_up_tag
	 *
	 * @return void
	 */
	public function add_tag( $tag, $clean_up_tag = true ): void {
		if ( $clean_up_tag ) {
			$tag = Utils::clean_up_tag( $tag );
		}

		if ( $tag == '' ) {
			return;
		}

		$this->tags[] = $tag;
	}

	/**
	 * Converts LineItem to array
	 *
	 * If LineItem is valid, it will be transformed to array that can be used with event
	 *
	 * @return array
	 */
	public function to_array(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( $this->description !== null ) {
			$arr['productDescription'] = $this->description;
		}

		if ( $this->discount !== null ) {
			$arr['productDiscount'] = $this->discount;
		}

		if ( $this->id !== null ) {
			$arr['productID'] = $this->id;
		}

		if ( $this->image_url !== null ) {
			$arr['productImageURL'] = $this->image_url;
		}

		if ( $this->price !== null ) {
			$arr['productPrice'] = $this->price;
		}

		if ( $this->strike_through_price !== null ) {
			$arr['productStrikeThroughPrice'] = $this->strike_through_price;
		}

		if ( $this->quantity !== null ) {
			$arr['productQuantity'] = $this->quantity;
		}

		if ( $this->sku !== null ) {
			$arr['productSKU'] = $this->sku;
		}

		if ( ! empty( $this->tags ) ) {
			$arr['productTags'] = array_values( array_unique( $this->tags ) );
		}

		if ( $this->title !== null ) {
			$arr['productTitle'] = $this->title;
		}

		if ( $this->url !== null ) {
			$arr['productURL'] = $this->url;
		}

		if ( $this->variant_id !== null ) {
			$arr['productVariantID'] = $this->variant_id;
		}

		if ( $this->variant_image_url !== null ) {
			$arr['productVariantImageURL'] = $this->variant_image_url;
		}

		if ( $this->variant_title !== null ) {
			$arr['productVariantTitle'] = $this->variant_title;
		}

		if ( $this->vendor !== null ) {
			$arr['productVendor'] = $this->vendor;
		}

		if ( $this->weight !== null ) {
			$arr['productWeight'] = $this->weight;
		}

		foreach ( $this->categories as $category ) {
			$arr['productCategories'][] = $category->to_array();
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

			if ( $property_value !== null && in_array( $property_key, self::STRING_PROPERTIES ) && ! is_string( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a string' );
			}

			if ( $property_value !== null && in_array( $property_key, self::NUMERIC_PROPERTIES ) && ! is_numeric( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a number' );
			}
		}

		foreach ( $this->categories as $category ) {
			if ( ! $category instanceof ProductCategory ) {
				$error->add( 'categories', 'Categories is not an instance of ProductCategory' );
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
		foreach ( $this->tags as $tag ) {
			if ( ! Utils::is_valid_tag( $tag ) ) {
				$error->add( 'tags', 'Tag "' . $tag . '" is not valid. Please cleanup it before setting it.' );
			}
		}

		foreach ( $this->categories as $category ) {
			$error->merge_from( $category->validate() );
		}

		if ( ! empty( $this->image_url ) && ! filter_var( $this->image_url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'image_url', 'Image must contain a valid URL' );
		}

		if ( ! empty( $this->url ) && ! filter_var( $this->url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'url', 'Product must contain a valid URL' );
		}

		if ( ! empty( $this->variant_image_url ) && ! filter_var( $this->variant_image_url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'variant_image_url', 'Variant image must contain a valid URL' );
		}

		return $error;
	}
}
