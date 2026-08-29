<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Client to interact with Omnisend.
 *
 */
interface Client {

	/**
	 * Create a contact in Omnisend. For it to succeed ensure that provided contact at least have email or phone number.
	 *
	 * @param Contact $contact
	 *
	 * @return CreateContactResponse
	 * @deprecated Use save_contact() instead.
	 */
	public function create_contact( $contact ): CreateContactResponse;

	/**
	 * Send customer event to Omnisend. Customer events are used to track customer behavior and trigger automations based on that behavior.
	 *
	 * @param Event $event
	 *
	 * @return SendCustomerEventResponse
	 */
	public function send_customer_event( $event ): SendCustomerEventResponse;

	/**
	 * Save a contact in Omnisend.
	 * @param Contact $contact
	 *
	 * @return SaveContactResponse
	 */
	public function save_contact( Contact $contact ): SaveContactResponse;

	/**
	 * Get contact in Omnisend by Email.
	 *
	 * @param string $email
	 *
	 * @return GetContactResponse
	 */
	public function get_contact_by_email( string $email ): GetContactResponse;

	/**
	 * Connect PHP based ecommerce platform/store to Omnisend.
	 *
	 * @param string $platform must be whitelisted (for additional added value) in Omnisend.
	 * If you're integrating new platform please contact product-team-integrations@omnisend.com
	 *
	 * @return ConnectStoreResponse
	 */
	public function connect_store( string $platform ): ConnectStoreResponse;

	/**
	 * Send batch of categories/products/events/contacts
	 * @param Batch $batch
	 *
	 * @return SendBatchResponse
	 */
	public function send_batch( $batch ): SendBatchResponse;

	/**
	 * Create category in Omnisend
	 *
	 * @param Category $category
	 *
	 * @return CreateCategoryResponse
	 */
	public function create_category( $category ): CreateCategoryResponse;

	/**
	 * Update category in Omnisend
	 *
	 * @param Category $category
	 *
	 * @return CreateCategoryResponse
	 */
	public function update_category( $category ): UpdateCategoryResponse;

	/**
	 * Get category by ID in Omnisend
	 *
	 * @param string $category_id
	 *
	 * @return GetCategoryResponse
	 */
	public function get_category_by_id( string $category_id ): GetCategoryResponse;

	/**
	 * Delete category by ID in Omnisend
	 *
	 * @param string $category_id
	 *
	 * @return DeleteCategoryResponse
	 */
	public function delete_category_by_id( string $category_id ): DeleteCategoryResponse;

	/**
	 * Create product in Omnisend
	 *
	 * @param Product $product
	 *
	 * @return CreateProductResponse
	 */
	public function create_product( $product ): CreateProductResponse;

	/**
	 * Replace product in Omnisend
	 *
	 * @param Product $product
	 *
	 * @return CreateProductResponse
	 */
	public function replace_product( $product ): CreateProductResponse;

	/**
	 * Get product in Omnisend by product ID
	 *
	 * @param string $product_id
	 *
	 * @return GetProductResponse
	 */
	public function get_product_by_id( string $product_id ): GetProductResponse;

	/**
	 * Delete product by ID
	 *
	 * @param string $product_id
	 *
	 * @return DeleteProductResponse
	 */
	public function delete_product_by_id( string $product_id ): DeleteProductResponse;
}
