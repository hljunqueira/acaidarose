<?php

namespace MetForm_Pro\Core\Integrations\Ecommerce\Woocommerce;

class Pay
{

    public function __construct()
    {
        

    }
    public function action($form_data, $entry_id)
    {

        if (isset($form_data['mf-woo-checkout'])) {
            $calculation_field_name = $form_data['mf-woo-checkout-calculation-field'];

            if (isset($form_data[$calculation_field_name])) {
                $this->create_temp_product(
                    $form_data['mf-woo-checkout-title'],
                    $form_data['mf-woo-checkout-details'],
                    $form_data[$calculation_field_name],
                    $entry_id
                );
            }
        }
    }

    protected function create_temp_product($title, $description, $price, $entry_id)
    {
        //add price to the product,
        update_post_meta($entry_id, '_regular_price', $price);
        update_post_meta($entry_id, '_sale_price', $price);
        update_post_meta($entry_id, '_price', $price);
        update_post_meta($entry_id, 'price', $price);
        update_option('mf_last_entry_id', $entry_id);

        /** Include required files */
        include_once WC_ABSPATH . 'includes/wc-cart-functions.php';
        include_once WC_ABSPATH . 'includes/class-wc-cart.php';
        wc_load_cart();

        global $woocommerce;

	    WC()->cart->empty_cart();

        $woocommerce->cart->add_to_cart($entry_id, 1);
        update_option('mf_woo_product_added_' . $entry_id, $entry_id);
    }
}
