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
 * Omnisend Product class. It should be used with Omnisend Client.
 */
class Product {
	public const STATUS_IN_STOCK      = 'inStock';
	public const STATUS_OUT_OF_STOCK  = 'outOfStock';
	public const STATUS_NOT_AVAILABLE = 'notAvailable';
	public const AVAILABLE_STATUS     = array(
		self::STATUS_IN_STOCK,
		self::STATUS_OUT_OF_STOCK,
		self::STATUS_NOT_AVAILABLE,
	);

	private const REQUIRED_PROPERTIES = array(
		'currency',
		'id',
		'status',
		'title',
		'url',
	);
	private const STRING_PROPERTIES   = array(
		'created_at',
		'currency',
		'default_image_url',
		'description',
		'id',
		'status',
		'title',
		'type',
		'updated_at',
		'url',
		'vendor',
	);
	private const ARRAY_PROPERTIES    = array(
		'variants',
		'images',
		'category_ids',
	);

	/**
	 * @var string $created_at
	 */
	private $created_at = null;

	/**
	 * @var string $currency
	 */
	private $currency = null;

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
	 * @var string $status
	 */
	private $status = null;

	/**
	 * @var string $title
	 */
	private $title = null;

	/**
	 * @var string $type
	 */
	private $type = null;

	/**
	 * @var string $updated_at
	 */
	private $updated_at = null;

	/**
	 * @var string $url
	 */
	private $url = null;

	/**
	 * @var string $vendor
	 */
	private $vendor = null;

	/**
	 * @var array $images
	 */
	private array $images = array();

	/**
	 * @var array $tags
	 */
	private array $tags = array();

	/**
	 * @var array $category_ids
	 */
	private array $category_ids = array();

	/**
	 * @var array $variants
	 */
	private array $variants = array();

	/**
	 * Sets product created date, format: "Y-m-d\Th:i:s\Z"
	 *
	 * @param string $created_at
	 *
	 * @return void
	 */
	public function set_created_at( $created_at ): void {
		$this->created_at = $created_at;
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
	 * Sets product default image URL
	 *
	 * @param string $default_image_url
	 *
	 * @return void
	 */
	public function set_default_image_url( $default_image_url ): void {
		$this->default_image_url = $default_image_url;
	}

	/**
	 * Sets product description
	 *
	 * @param string $description
	 *
	 * @return void
	 */
	public function set_description( $description ): void {
		$this->description = $description;
	}

	/**
	 * Sets product id
	 *
	 * @param string $id
	 *
	 * @return void
	 */
	public function set_id( $id ): void {
		$this->id = $id;
	}

	/**
	 * Sets product status
	 *
	 * @param string $status
	 *
	 * @return void
	 */
	public function set_status( $status ): void {
		$this->status = $status;
	}

	/**
	 * Sets product title
	 *
	 * @param string $title
	 *
	 * @return void
	 */
	public function set_title( $title ): void {
		$this->title = $title;
	}

	/**
	 * Sets product type
	 *
	 * @param string $type
	 *
	 * @return void
	 */
	public function set_type( $type ): void {
		$this->type = $type;
	}

	/**
	 * Sets product updated date, format: "Y-m-d\Th:i:s\Z"
	 *
	 * @param string $updated_at
	 *
	 * @return void
	 */
	public function set_updated_at( $updated_at ): void {
		$this->updated_at = $updated_at;
	}

	/**
	 * Sets product URL
	 *
	 * @param string $url
	 *
	 * @return void
	 */
	public function set_url( $url ): void {
		$this->url = $url;
	}

	/**
	 * Sets product vendor
	 *
	 * @param string $vendor
	 *
	 * @return void
	 */
	public function set_vendor( $vendor ): void {
		$this->vendor = $vendor;
	}

	/**
	 * Adds new tag to tag array
	 *
	 * @param string $tag
	 * @param bool   $clean_up_tag clean up tag to be compatible with Omnisend
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
	 * Adds product variant
	 *
	 * @param ProductVariant $variant
	 *
	 * @return void
	 */
	public function add_variant( $variant ): void {
		$this->variants[] = $variant;
	}

	/**
	 * Adds product image, should not contain "default image url"
	 *
	 * @param string $image_url
	 *
	 * @return void
	 */
	public function add_image( $image_url ): void {
		$this->images[] = $image_url;
	}

	/**
	 * Adds category ID
	 *
	 * @param string $category_ids
	 *
	 * @return void
	 */
	public function add_category_id( $category_id ): void {
		$this->category_ids[] = $category_id;
	}

	/**
	 * Gets category ids
	 *
	 * @return ?array
	 */
	public function get_category_ids(): ?array {
		return is_array( $this->category_ids ) ? $this->category_ids : null;
	}

	/**
	 * Gets product created_at date
	 *
	 * @return ?string
	 */
	public function get_created_at(): ?string {
		return is_string( $this->created_at ) ? $this->created_at : null;
	}

	/**
	 * Gets currency
	 *
	 * @return ?string
	 */
	public function get_currency(): ?string {
		return is_string( $this->currency ) ? $this->currency : null;
	}

	/**
	 * Gets product default image URL
	 *
	 * @return ?string
	 */
	public function get_default_image_url(): ?string {
		return is_string( $this->default_image_url ) ? $this->default_image_url : null;
	}

	/**
	 * Gets product description
	 *
	 * @return ?string
	 */
	public function get_descripton(): ?string {
		return is_string( $this->description ) ? $this->description : null;
	}

	/**
	 * Gets product id
	 *
	 * @return ?string
	 */
	public function get_id(): ?string {
		return is_string( $this->id ) ? $this->id : null;
	}

	/**
	 * Gets product images
	 *
	 * @return ?array
	 */
	public function get_images(): ?array {
		return is_array( $this->images ) ? $this->images : null;
	}

	/**
	 * Gets product status
	 *
	 * @return ?string
	 */
	public function get_status(): ?string {
		return is_string( $this->status ) ? $this->status : null;
	}

	/**
	 * Gets tags
	 *
	 * @return ?array
	 */
	public function get_tags(): ?array {
		return is_array( $this->tags ) ? $this->tags : null;
	}

	/**
	 * Gets product title
	 *
	 * @return ?string
	 */
	public function get_title(): ?string {
		return is_string( $this->title ) ? $this->title : null;
	}

	/**
	 * Gets product type
	 *
	 * @return ?string
	 */
	public function get_type(): ?string {
		return is_string( $this->type ) ? $this->type : null;
	}

	/**
	 * Gets product updated_at date
	 *
	 * @return ?string
	 */
	public function get_updated_at(): ?string {
		return is_string( $this->updated_at ) ? $this->updated_at : null;
	}

	/**
	 * Gets product URL
	 *
	 * @return ?string
	 */
	public function get_url(): ?string {
		return is_string( $this->url ) ? $this->url : null;
	}

	/**
	 * Gets product variants
	 *
	 * @return ?array
	 */
	public function get_variants(): ?array {
		return is_array( $this->variants ) ? $this->variants : null;
	}

	/**
	 * Gets product vendor
	 *
	 * @return ?string
	 */
	public function get_vendor(): ?string {
		return is_string( $this->vendor ) ? $this->vendor : null;
	}

	/**
	 * Validates product properties
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

		$error = $this->validate_variants( $error );

		if ( $error->has_errors() ) {
			return $error;
		}

		$error = $this->validate_values( $error );

		return $error;
	}

	/**
	 * Convert product to array
	 *
	 * If product is valid it will be transformed to array that can be sent to Omnisend.
	 *
	 * @return array
	 */
	public function to_array(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array(
			'tags'     => array_values( array_unique( $this->tags ) ),
			'currency' => $this->currency,
			'id'       => $this->id,
			'status'   => $this->status,
			'title'    => $this->title,
			'url'      => $this->url,
		);

		if ( ! empty( $this->category_ids ) ) {
			$arr['categoryIDs'] = $this->category_ids;
		}

		if ( ! empty( $this->created_at ) ) {
			$arr['createdAt'] = $this->created_at;
		}

		if ( ! empty( $this->default_image_url ) ) {
			$arr['defaultImageUrl'] = $this->default_image_url;
		}

		if ( ! empty( $this->description ) ) {
			$arr['description'] = $this->description;
		}

		if ( ! empty( $this->images ) ) {
			$arr['images'] = $this->images;
		}

		if ( ! empty( $this->type ) ) {
			$arr['type'] = $this->type;
		}

		if ( ! empty( $this->updated_at ) ) {
			$arr['updatedAt'] = $this->updated_at;
		}

		if ( ! empty( $this->vendor ) ) {
			$arr['vendor'] = $this->vendor;
		}

		foreach ( $this->variants as $variant ) {
			$arr['variants'][] = $variant->to_array();
		}

		return $arr;
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

			if ( $property_value !== null && in_array( $property_key, self::ARRAY_PROPERTIES ) && ! is_array( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be an array' );
			}

			if ( $property_value !== null && in_array( $property_key, self::STRING_PROPERTIES ) && ! is_string( $property_value ) ) {
				$error->add( $property_key, $property_key . ' must be a string' );
			}
		}

		return $error;
	}

	/**
	 * Validates product variants
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error $error
	 */
	private function validate_variants( WP_Error $error ): WP_Error {
		foreach ( $this->variants as $variant ) {
			if ( get_class( $variant ) !== 'Omnisend\SDK\V1\ProductVariant' ) {
				$error->add( 'variant', 'Variant is not a class of Omnisend\SDK\V1\ProductVariant' );

				return $error;
			}

			if ( $variant->validate()->has_errors() ) {
				$error->merge_from( $variant->validate() );
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
		foreach ( $this->tags as $tag ) {
			if ( ! Utils::is_valid_tag( $tag ) ) {
				$error->add( 'tags', 'Tag "' . $tag . '" is not valid. Please cleanup it before setting it.' );
			}
		}

		if ( ! in_array( $this->status, self::AVAILABLE_STATUS ) ) {
			$error->add( 'status', sprintf( 'Status must be one of the following: %s', implode( ',', self::AVAILABLE_STATUS ) ) );
		}

		if ( strlen( $this->id ) > 100 ) {
			$error->add( 'id', 'ID must be under 100 characters' );
		}

		if ( strlen( $this->title ) > 100 ) {
			$error->add( 'title', 'Title must be under 100 characters' );
		}

		if ( ! ctype_upper( $this->currency ) ) {
			$error->add( 'currency', 'Currency code must be all uppercase' );
		}

		if ( $this->description !== null && strlen( $this->description ) > 300 ) {
			$error->add( 'description', 'Description must be under 300 characters' );
		}

		if ( $this->type !== null && strlen( $this->type ) > 100 ) {
			$error->add( 'type', 'Type must be under 100 characters' );
		}

		if ( $this->vendor !== null && strlen( $this->vendor ) > 100 ) {
			$error->add( 'vendor', 'Vendor must be under 100 characters' );
		}

		if ( ! empty( $this->default_image_url ) && ! filter_var( $this->default_image_url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'default_image_url', 'Default image must contain a valid URL' );
		}

		if ( ! filter_var( $this->url, FILTER_VALIDATE_URL ) ) {
			$error->add( 'url', 'Url must contain a valid URL' );
		}

		return $error;
	}
}
