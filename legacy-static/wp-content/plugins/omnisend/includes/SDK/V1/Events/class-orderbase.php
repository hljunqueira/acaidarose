<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1\Events;

use WP_Error;
use Omnisend\Internal\Utils;
use Omnisend\SDK\V1\Events\Components\Address;
use Omnisend\SDK\V1\Events\Components\LineItem;
use Omnisend\SDK\V1\Events\Components\Tracking;
use Omnisend\SDK\V1\Events\Components\Discount;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Omnisend OrderBase class. It should be extended in order event
 */
abstract class OrderBase {
	private const REQUIRED_PROPERTIES          = array(
		'currency',
		'id',
		'number',
		'fulfillment_status',
		'payment_status',
		'payment_method',
		'subtotal_price',
		'subtotal_tax_included',
		'total_discount',
		'total_price',
		'total_tax',
		'line_items',
		'address',
		'created_at',
	);
	private const STRING_PROPERTIES            = array(
		'created_at',
		'currency',
		'fulfillment_status',
		'status_url',
		'id',
		'payment_status',
		'payment_method',
		'shipping_method',
		'note',
		'cancel_reason',
	);
	private const NUMERIC_PROPERTIES           = array(
		'shipping_price',
		'subtotal_price',
		'total_discount',
		'total_price',
		'total_tax',
		'number',
		'total_refunded_amount',
		'total_refunded_tax_amount',
	);
	private const AVAILABLE_FULFILLMENT_STATUS = array(
		'unfulfilled',
		'inProgress',
		'fulfilled',
		'delivered',
		'restocked',
	);
	private const AVAILABLE_PAYMENT_STATUS     = array(
		'awaitingPayment',
		'partiallyPaid',
		'paid',
		'partiallyRefunded',
		'refunded',
		'voided',
	);

	/**
	 * @var string $created_at
	 */
	protected $created_at = null;

	/**
	 * @var string $currency
	 */
	protected $currency = null;

	/**
	 * @var string $fulfillment_status
	 */
	protected $fulfillment_status = null;

	/**
	 * @var string $status_url
	 */
	protected $status_url = null;

	/**
	 * @var string $note
	 */
	protected $note = null;

	/**
	 * @var string $id
	 */
	protected $id = null;

	/**
	 * @var int $number
	 */
	protected $number = null;

	/**
	 * @var string $payment_status
	 */
	protected $payment_status = null;

	/**
	 * @var string $payment_method
	 */
	protected $payment_method = null;

	/**
	 * @var string $shipping_method
	 */
	protected $shipping_method = null;

	/**
	 * @var mixed $shipping_price
	 */
	protected $shipping_price = null;

	/**
	 * @var mixed $subtotal_price
	 */
	protected $subtotal_price = null;

	/**
	 * @var bool $subtotal_tax_included
	 */
	protected $subtotal_tax_included = null;

	/**
	 * @var mixed $total_discount
	 */
	protected $total_discount = null;

	/**
	 * @var mixed $total_price
	 */
	protected $total_price = null;

	/**
	 * @var mixed $total_tax
	 */
	protected $total_tax = null;

	/**
	 * @var mixed $total_refunded_tax_amount
	 */
	protected $total_refunded_tax_amount = null;

	/**
	 * @var mixed $total_refunded_amount
	 */
	protected $total_refunded_amount = null;

	/**
	 * @var string $cancel_reason
	 */
	protected $cancel_reason = null;

	/**
	 * @var Address $address
	 */
	protected $address = null;

	/**
	 * @var Tracking $tracking
	 */
	protected $tracking = null;

	/**
	 * @var array $discounts
	 */
	protected array $discounts = array();

	/**
	 * @var array $line_items
	 */
	protected array $line_items = array();

	/**
	 * @var array $tags
	 */
	protected array $tags = array();

	/**
	 * @var array $refunded_line_items
	 */
	protected array $refunded_line_items = array();

	/**
	 * Converts Order to array.
	 *
	 * If Order is valid it will be transformed to array that can be used with Event
	 *
	 * @return array
	 */
	public function to_array(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( ! empty( $this->tags ) ) {
			$arr['tags'] = array_values( array_unique( $this->tags ) );
		}

		if ( $this->created_at !== null ) {
			$arr['createdAt'] = $this->created_at;
		}

		if ( $this->currency !== null ) {
			$arr['currency'] = $this->currency;
		}

		if ( $this->fulfillment_status !== null ) {
			$arr['fulfillmentStatus'] = $this->fulfillment_status;
		}

		if ( $this->id !== null ) {
			$arr['orderID'] = $this->id;
		}

		if ( $this->number !== null ) {
			$arr['orderNumber'] = $this->number;
		}

		if ( $this->payment_method !== null ) {
			$arr['paymentMethod'] = $this->payment_method;
		}

		if ( $this->payment_status !== null ) {
			$arr['paymentStatus'] = $this->payment_status;
		}

		if ( $this->subtotal_price !== null ) {
			$arr['subTotalPrice'] = $this->subtotal_price;
		}

		if ( $this->subtotal_tax_included !== null ) {
			$arr['subtotalTaxIncluded'] = $this->subtotal_tax_included;
		}

		if ( $this->total_tax !== null ) {
			$arr['totalTax'] = $this->total_tax;
		}

		if ( $this->total_discount !== null ) {
			$arr['totalDiscount'] = $this->total_discount;
		}

		if ( $this->total_price !== null ) {
			$arr['totalPrice'] = $this->total_price;
		}

		if ( $this->shipping_price !== null ) {
			$arr['shippingPrice'] = $this->shipping_price;
		}

		if ( $this->status_url !== null ) {
			$arr['orderStatusURL'] = $this->status_url;
		}

		if ( $this->note !== null ) {
			$arr['note'] = $this->note;
		}

		if ( $this->shipping_method !== null ) {
			$arr['shippingMethod'] = $this->shipping_method;
		}

		if ( $this->tracking !== null ) {
			$arr['tracking'] = $this->tracking->to_array();
		}

		if ( $this->cancel_reason !== null ) {
			$arr['cancelReason'] = $this->cancel_reason;
		}

		if ( $this->total_refunded_amount !== null ) {
			$arr['totalRefundedAmount'] = $this->total_refunded_amount;
		}

		if ( $this->total_refunded_tax_amount !== null ) {
			$arr['totalRefundedTaxAmount'] = $this->total_refunded_tax_amount;
		}

		foreach ( $this->line_items as $item ) {
			$arr['lineItems'][] = $item->to_array();
		}

		foreach ( $this->discounts as $discount ) {
			$arr['discounts'][] = $discount->to_array();
		}

		foreach ( $this->refunded_line_items as $item ) {
			$arr['refundedLineItems'][] = $item->to_array();
		}

		if ( $this->address !== null ) {
			$arr['shippingAddress'] = $this->address->to_array_shipping();
			$arr['billingAddress']  = $this->address->to_array_billing();
		}

		return $arr;
	}

	/**
	 * Validates properties.
	 *
	 * @return WP_Error
	 */
	public function validate(): WP_Error {
		$error = new WP_Error();
		$error = $this->validate_properties( $error );
		$error = $this->validate_extra_properties( $error );

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

		if ( ! is_bool( $this->subtotal_tax_included ) ) {
			$error->add( 'subtotal_tax_included', 'Subtotal tax included should be a boolean' );
		}

		if ( $this->tracking !== null && ! $this->tracking instanceof Tracking ) {
			$error->add( 'tracking', 'Tracking is not an instance of Omnisend\SDK\V1\Events\Components\Tracking' );
		}

		if ( $this->address !== null && ! $this->address instanceof Address ) {
			$error->add( 'address', 'Address is not an instance of Omnisend\SDK\V1\Events\Components\Address' );
		}

		foreach ( $this->discounts as $discount ) {
			if ( ! $discount instanceof Discount ) {
				$error->add( 'discounts', 'Discount is not an instance of Omnisend\SDK\V1\Events\Components\Discount' );
			}
		}

		foreach ( $this->line_items as $item ) {
			if ( ! $item instanceof LineItem ) {
				$error->add( 'line_item', 'Line Item is not an instance of Omnisend\SDK\V1\Events\Components\LineItem' );
			}
		}

		return $error;
	}

	/**
	 * Validates extra properties, should be extended when needed within Order event
	 *
	 * @param WP_Error $wp_error
	 *
	 * @return WP_Error
	 */
	public function validate_extra_properties( WP_Error $wp_error ): WP_Error {
		return $wp_error;
	}

	/**
	 * Validates property values
	 *
	 * @param WP_Error $error
	 *
	 * @return WP_Error
	 */
	private function validate_values( WP_Error $error ): WP_Error {
		foreach ( $this->discounts as $discount ) {
			$error->merge_from( $discount->validate() );
		}

		foreach ( $this->tags as $tag ) {
			if ( ! Utils::is_valid_tag( $tag ) ) {
				$error->add( 'tags', 'Tag "' . $tag . '" is not valid. Please cleanup it before setting it.' );
			}
		}

		foreach ( $this->line_items as $item ) {
			$error->merge_from( $item->validate() );
		}

		if ( $this->tracking !== null ) {
			$error->merge_from( $this->tracking->validate() );
		}

		if ( $this->address !== null ) {
			$error->merge_from( $this->address->validate() );
		}

		if ( ! in_array( $this->fulfillment_status, self::AVAILABLE_FULFILLMENT_STATUS ) ) {
			$error->add( 'fulfillment_status', 'Fulfillment status is not one of ' . implode( ',', self::AVAILABLE_FULFILLMENT_STATUS ) );
		}

		if ( ! in_array( $this->payment_status, self::AVAILABLE_PAYMENT_STATUS ) ) {
			$error->add( 'payment_status', 'Payment status is not one of ' . implode( ',', self::AVAILABLE_PAYMENT_STATUS ) );
		}

		if ( ! ctype_upper( $this->currency ) ) {
			$error->add( 'currency', 'Currency code must be all uppercase' );
		}

		return $error;
	}
}
