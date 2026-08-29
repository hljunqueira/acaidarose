<?php

/**
 * Check if WooCommerce is active then include the
 * WooCommerce Checkout support for metform
 */

class MF_Woo_Checkout
{

    public function __construct()
    {
        require 'woo-cpt.php';
    }

    public function init()
    {

    }

    /**
     * ----------------------------------------------
     *          Function that will check if
     *      Woocommerce plugin is active or not
     * ----------------------------------------------
     */
    public function mf_is_woo_exists()
    {
        if (in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
            return true;
        }
        return false;
    }
}