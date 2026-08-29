<?php

namespace Metform_Pro\Core\Integrations\Crm\Helpscout;

use MetForm_Pro\Core\Integrations\Crm\Helpscout\Helpscout;
use MetForm_Pro\Traits\Singleton;
use MetForm_Pro\Utils\Render;

defined('ABSPATH') || exit;

class Integration
{
    use Singleton;

    /**
     * @var mixed
     */
    private $parent_id;
    /**
     * @var mixed
     */
    private $sub_tab_id;
    /**
     * @var mixed
     */
    private $sub_tab_title;

    public function init()
    {
        /**
         *
         * Create a new tab in admin settings tab
         *
         */

        $this->parent_id = 'mf_crm';

        $this->sub_tab_id    = 'helpscout';
        $this->sub_tab_title = 'Help Scout';

        add_action('metform_after_store_form_data', [new Helpscout, 'create_ticket'], 10, 4);
        add_action('metform_settings_subtab_' . $this->parent_id, [$this, 'sub_tab']);
        add_action('metform_settings_subtab_content_' . $this->parent_id, [$this, 'sub_tab_content']);
    }

    public function sub_tab()
    {
        Render::sub_tab($this->sub_tab_title, $this->sub_tab_id);
    }

    public function contents()
    {
        $app_id_field = [
            'lable'       => 'App ID',
            'name'        => 'mf_helpscout_app_id',
            'description' => '',
            'placeholder' => 'Help Scout App ID'
        ];

        $app_secret_field = [
            'lable'       => 'App Secret',
            'name'        => 'mf_helpscout_app_secret',
            'description' => '',
            'placeholder' => 'Help Scout App Secret'
        ];

        $button = [
            'class' => 'button button-primary',
            'text'  => 'Get access token',
            'id'    => 'mf-helpscout-btn-token'
        ];

        $access_token = get_option('mf_helpscout_access_token');
        $app_id       = \MetForm\Utils\Util::get_form_settings('mf_helpscout_app_id');
        $app_secret   = \MetForm\Utils\Util::get_form_settings('mf_helpscout_app_secret');

        Render::textbox($app_id_field);
        Render::textbox($app_secret_field);

        if ($access_token && !empty($access_token)) {
            echo 'Connected  <br><br>';
            echo 'Access Token : <code>' . $access_token . '</code>' . '<br><br>';
        }

        if ($app_id && !empty($app_id)) {
            Render::button($button);
        }

    }

    public function sub_tab_content()
    {
        Render::sub_tab_content($this->sub_tab_id, [$this, 'contents']);
    }
}

Integration::instance()->init();
