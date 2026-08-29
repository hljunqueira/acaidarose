<?php
/**
 * Class CHT_Icons *
 *
 * @since 1.0
 */

namespace CHT\includes;

if (!defined('ABSPATH')) {
    exit;
}

class CHT_PRO_Widget
{

    protected $plugin_slug = 'chaty-app';

    protected $friendly_name = 'Chaty Widget';

    protected static $instance = null;


    public function __construct()
    {

    }//end __construct()


    public static function get_instance()
    {
        // If the single instance hasn't been set, set it now.
        if (null == self::$instance) {
            self::$instance = new self;
        }

        return self::$instance;

    }//end get_instance()


    public function get_plugin_slug()
    {
        return $this->plugin_slug;

    }//end get_plugin_slug()


    public function get_name()
    {
        return $this->friendly_name;

    }//end get_name()


}//end class
