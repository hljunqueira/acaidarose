<?php

/**
 * Load bootstrap for and essentials settings markcup
 *
 */
namespace MetForm_Pro\Core\Integrations\Auth\Loader;

use MetForm_Pro\Traits\Singleton;
use MetForm_Pro\Utils\Render;



defined('ABSPATH') || exit;

class Loader
{

    use Singleton;
    /**
     * @var string
     */
    public $id = 'mf-auth';
    /**
     * @var string
     */
    public $label = 'Auth';

    public function init()
    {
        add_action('mf_form_settings_tab', [$this, 'tab']);
        add_action('mf_form_settings_tab_content', [$this, 'tab_content']);
    }

    public function tab()
    {
        Render::form_tab($this->id, $this->label);
    }

    public function tab_content()
    {
        Render::form_tab_content($this->id);
    }
}

Loader::instance()->init();
