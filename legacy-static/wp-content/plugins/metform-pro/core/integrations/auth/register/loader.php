<?php

namespace MetForm_Pro\Core\Integrations\Auth\Register;

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

        add_action('metform_after_store_form_data', [$this, 'register_action'], 10, 3);
        add_action('mf_push_tab_content_' . $parent_id, [$this, 'settings_content']);
        add_action('mf_cpt', function () {

            return [
                'mf_registration' => [
                    'name' => 'mf_registration'
                ]
            ];
        });

        add_action('rest_api_init', function () {

            register_rest_route('xs/register', '/settings/(?P<id>\d+)', [
                'methods'             => 'GET',
                'callback'            => [$this, 'rest_func'],
                'permission_callback' => '__return_true'
            ]);

        });

        add_action('rest_api_init', function () {

            register_rest_route('xs/register', '/test', [
                'methods'             => 'GET',
                'callback'            => [$this, 'test_rest'],
                'permission_callback' => '__return_true'
            ]);

            register_rest_route('xs/register', '/settings/(?P<id>\d+)', [
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

        return get_option('mf_auth_reg_settings_' . $id);
    }

    public function test_rest()
    {
        $id = 5;

        return get_option('mf_auth_reg_settings_' . $id);
    }

    public function settings_content()
    {
        $data = [
            'name'    => 'mf_registration',
            'label'   => 'Registration',
            'class'   => 'mf-register',
            'details' => 'Enable or disable user registration'
        ];

        Render::checkbox($data);
        Render::div('', 'mf_register_form_fields');

    }
    /**
     * @param $form_id
     * @param $form_data
     * @param $form_settings
     */
    public function register_action($form_id, $form_data, $form_settings)
    {
        if (isset($form_settings['mf_registration']) && $form_settings['mf_registration'] == '1') {
            /** Get form settings data */
            $settings = get_option('mf_auth_reg_settings_' . $form_id);

            $user_name     = $form_data[$settings['mf_auth_reg_user_name']];
            $user_email    = $form_data[$settings['mf_auth_reg_user_email']];
            $user_role     = $settings['mf_auth_reg_role'];
            $user_password = rand(100000, 999999);

            $userdata = [
                'user_login' => $user_name,
                'user_email' => $user_email,
                'user_pass'  => $user_password,
                'role'       => $user_role
            ];

            $user_id = wp_insert_user($userdata);

            if (!is_wp_error($user_id)) {
                // Email login details to user
                $blogname = wp_specialchars_decode(get_option('blogname'), ENT_QUOTES);
                $message  = "Welcome! Your login details are as follows:" . "\r\n";
                $message .= sprintf(__('Username: %s', 'metform-pro'), $user_name) . "\r\n";
                $message .= sprintf(__('Password: %s', 'metform-pro'), $user_password) . "\r\n";
                $message .= wp_login_url() . "\r\n";
                wp_mail($user_email, sprintf(__('[%s] Your username and password', 'metform-pro'), $blogname), $message);
            }
        }
    }
}

Loader::instance()->init();
