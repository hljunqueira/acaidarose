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
 * Omnisend OrderFulfilled class. It should be used with Omnisend Event.
 */
class OrderFulfilled extends OrderBase {
	public const EVENT_NAME = 'order fulfilled';

	/**
	 * Sets order address component
	 *
	 * @param Address $address
	 *
	 * @return void
	 */
	public function set_address( $address ): void {
		$this->address = $address;
	}

	/**
	 * Sets order created_at, format: "Y-m-d\Th:i:s\Z"
	 *
	 * @param string $created_at
	 *
	 * @return void
	 */
	public function set_created_at( $created_at ): void {
		$this->created_at = $created_at;
	}

	/**
	 * Sets order currency
	 *
	 * @param string $currency
	 *
	 * @return void
	 */
	public function set_currency( $currency ): void {
		$this->currency = $currency;
	}

	/**
	 * Sets order fulfillment status
	 *
	 * @param string $fulfillment_status
	 *
	 * @return void
	 */
	public function set_fulfillment_status( $fulfillment_status ): void {
		$this->fulfillment_status = $fulfillment_status;
	}

	/**
	 * Sets order note
	 *
	 * @param string $note
	 *
	 * @return void
	 */
	public function set_note( $note ): void {
		$this->note = $note;
	}

	/**
	 * Sets order ID
	 *
	 * @param string $id
	 *
	 * @return void
	 */
	public function set_id( $id ): void {
		$this->id = $id;
	}

	/**
	 * Sets order number
	 *
	 * @param int $number
	 *
	 * @return void
	 */
	public function set_number( $number ): void {
		$this->number = $number;
	}

	/**
	 * Sets order status URL
	 *
	 * @param string $status_url
	 *
	 * @return void
	 */
	public function set_status_url( $status_url ): void {
		$this->status_url = $status_url;
	}

	/**
	 * Sets order payment method
	 *
	 * @param string $payment_method
	 *
	 * @return void
	 */
	public function set_payment_method( $payment_method ): void {
		$this->payment_method = $payment_method;
	}

	/**
	 * Sets order payment status
	 *
	 * @param string $payment_status
	 *
	 * @return void
	 */
	public function set_payment_status( $payment_status ): void {
		$this->payment_status = $payment_status;
	}

	/**
	 * Sets order shipping method
	 *
	 * @param string $shipping_method
	 *
	 * @return void
	 */
	public function set_shipping_method( $shipping_method ): void {
		$this->shipping_method = $shipping_method;
	}

	/**
	 * Sets order shipping price
	 *
	 * @param mixed $shipping_price
	 *
	 * @return void
	 */
	public function set_shipping_price( $shipping_price ): void {
		$this->shipping_price = $shipping_price;
	}

	/**
	 * Sets order subtotal price (amount)
	 *
	 * @param mixed $subtotal_price
	 *
	 * @return void
	 */
	public function set_subtotal_price( $subtotal_price ): void {
		$this->subtotal_price = $subtotal_price;
	}

	/**
	 * Sets flag, if order subtotal is with tax
	 *
	 * @param bool $subtotal_tax_included
	 *
	 * @return void
	 */
	public function set_subtotal_tax_included( $subtotal_tax_included ): void {
		$this->subtotal_tax_included = $subtotal_tax_included;
	}

	/**
	 * Sets order total discount
	 *
	 * @param mixed $total_discount
	 *
	 * @return void
	 */
	public function set_total_discount( $total_discount ): void {
		$this->total_discount = $total_discount;
	}

	/**
	 * Sets order total price
	 *
	 * @param mixed $total_price
	 *
	 * @return void
	 */
	public function set_total_price( $total_price ): void {
		$this->total_price = $total_price;
	}

	/**
	 * Sets order total tax
	 *
	 * @param mixed $total_tax
	 *
	 * @return void
	 */
	public function set_total_tax( $total_tax ): void {
		$this->total_tax = $total_tax;
	}

	/**
	 * Sets order Tracking componenet
	 *
	 * @param Tracking $tracking
	 *
	 * @return void
	 */
	public function set_tracking( $tracking ): void {
		$this->tracking = $tracking;
	}

	/**
	 * Adds order tag
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
	 * Adds order discount component
	 *
	 * @param Discount $discount
	 *
	 * @return void
	 */
	public function add_discount( $discount ): void {
		$this->discounts[] = $discount;
	}

	/**
	 * Adds order LineItem component
	 *
	 * @param LineItem $line_item
	 *
	 * @return void
	 */
	public function add_line_item( $line_item ): void {
		$this->line_items[] = $line_item;
	}
}
