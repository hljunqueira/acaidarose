<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\Internal;

use Omnisend\SDK\V1\Product;
use Omnisend\SDK\V1\ProductVariant;

class ProductFactory {
	/**
	 * Create a product object from an array of Product data.
	 *
	 * @param array $product_data
	 *
	 * @return Product
	 */
	public static function create_product( array $product_data ): Product {
		$product = new Product();

		if ( isset( $product_data['categoryIDs'] ) && is_array( $product_data['categoryIDs'] ) ) {
			foreach ( $product_data['categoryIDs'] as $category_id ) {
				$product->add_category_id( $category_id );
			}
		}

		if ( isset( $product_data['variants'] ) && is_array( $product_data['variants'] ) ) {
			foreach ( $product_data['variants'] as $variant ) {
				$omnisend_variant = new ProductVariant();

				$omnisend_variant->set_id( isset( $variant['id'] ) ? $variant['id'] : null );
				$omnisend_variant->set_title( isset( $variant['title'] ) ? $variant['title'] : null );
				$omnisend_variant->set_sku( isset( $variant['sku'] ) ? $variant['sku'] : null );
				$omnisend_variant->set_price( isset( $variant['price'] ) ? $variant['price'] : null );
				$omnisend_variant->set_strike_through_price( isset( $variant['strikeThroughPrice'] ) ? $variant['strikeThroughPrice'] : null );
				$omnisend_variant->set_url( isset( $variant['url'] ) ? $variant['url'] : null );
				$omnisend_variant->set_status( isset( $variant['status'] ) ? $variant['status'] : null );
				$omnisend_variant->set_description( isset( $variant['description'] ) ? $variant['description'] : null );
				$omnisend_variant->set_default_image_url( isset( $variant['defaultImageUrl'] ) ? $variant['defaultImageUrl'] : null );

				if ( isset( $variant['images'] ) && ! empty( $variant['images'] ) ) {
					foreach ( $variant['images'] as $image ) {
						$omnisend_variant->add_image( $image );
					}
				}

				$product->add_variant( $omnisend_variant );
			}
		}

		if ( isset( $product_data['images'] ) && is_array( $product_data['images'] ) ) {
			foreach ( $product_data['images'] as $image ) {
				$product->add_image( $image );
			}
		}

		if ( isset( $product_data['createdAt'] ) ) {
			$product->set_created_at( $product_data['createdAt'] );
		}

		if ( isset( $product_data['currency'] ) ) {
			$product->set_currency( $product_data['currency'] );
		}

		if ( isset( $product_data['defaultImageUrl'] ) ) {
			$product->set_default_image_url( $product_data['defaultImageUrl'] );
		}

		if ( isset( $product_data['description'] ) ) {
			$product->set_description( $product_data['description'] );
		}

		if ( isset( $product_data['id'] ) ) {
			$product->set_id( $product_data['id'] );
		}

		if ( isset( $product_data['status'] ) ) {
			$product->set_status( $product_data['status'] );
		}

		if ( isset( $product_data['tags'] ) && is_array( $product_data['tags'] ) ) {
			foreach ( $product_data['tags'] as $tag ) {
				$product->add_tag( $tag );
			}
		}

		if ( isset( $product_data['title'] ) ) {
			$product->set_title( $product_data['title'] );
		}

		if ( isset( $product_data['type'] ) ) {
			$product->set_type( $product_data['type'] );
		}

		if ( isset( $product_data['updatedAt'] ) ) {
			$product->set_updated_at( $product_data['updatedAt'] );
		}

		if ( isset( $product_data['url'] ) ) {
			$product->set_url( $product_data['url'] );
		}

		if ( isset( $product_data['vendor'] ) ) {
			$product->set_vendor( $product_data['vendor'] );
		}

		return $product;
	}
}
