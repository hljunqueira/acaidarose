<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\Internal;

use Omnisend\SDK\V1\Category;

class CategoryFactory {
	/**
	 * Create a category object from an array of category data.
	 *
	 * @param array $category_data
	 *
	 * @return Category
	 */
	public static function create_category( array $category_data ): Category {
		$category = new Category();

		if ( isset( $category_data['categoryID'] ) ) {
			$category->set_category_id( $category_data['categoryID'] );
		}

		if ( isset( $category_data['title'] ) ) {
			$category->set_title( $category_data['title'] );
		}

		return $category;
	}
}
