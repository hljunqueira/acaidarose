<?php

namespace MetForm_Pro\Core\Integrations\Auth\Login;

use MetForm_Pro\Traits\Singleton;
use MetForm_Pro\Utils\Render;

defined('ABSPATH') || exit;

class Loader
{
    use Singleton;

    public function init()
    {
        $loader    = \MetForm_Pro\Core\Integrations\Auth\Loader\Loader::instance();
        $parent_id = $loader->id;

        add_action('metform_after_store_form_data', [$this, 'login_action'], 10, 3);
        add_action('mf_push_tab_content_' . $parent_id, [$this, 'settings_content']);

        add_action('rest_api_init', function () {
            register_rest_route('xs/login', '/settings/(?P<id>\d+)', [
                'methods'             => 'GET',
                'callback'            => [$this, 'rest_func'],
                'permission_callback' => '__return_true'
            ]);

        });
    }

    /**
     * @param $request
     */
    public function rest_func($request)
    {
        $id = $request['id'];
        return get_option('mf_auth_login_settings_' . $id);
    }

    public function settings_content()
    {
        $data = [
            'name'    => 'mf_login',
            'label'   => 'Login',
            'class'   => 'mf-login',
            'details' => 'Enable or Disable login system'
        ];

        Render::checkbox($data);
        Render::div('', 'mf_login_form_fields');
        Render::seperator();
    }

    /**
     * @param $form_id
     * @param $form_data
     * @param $form_settings
     */
    public function login_action($form_id, $form_data, $form_settings)
    {
        if (isset($form_settings['mf_login']) && $form_settings['mf_login'] == '1') {
            $settings = get_option('mf_auth_login_settings_' . $form_id);

            $user_name     = $form_data[$settings['mf_auth_login_user_name']];
            $user_password = $form_data[$settings['mf_auth_login_user_password']];

            $creds = [
                'user_login'    => $user_name,
                'user_password' => $user_password,
                'remember'      => true
            ];

            wp_signon($creds, false);
        }
    }
}

Loader::instance()->init();
