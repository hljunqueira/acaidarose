<?php

namespace MetForm_Pro\Libs;

defined('ABSPATH') || exit;

/**
 * Allows plugins to use their own update API.
 *
 * @version 1.6.18
 */
class License
{
    use \MetForm\Traits\Singleton;

    public function activate($key)
    {
        // global $mf_res;

        $data = [
            'key' => $key,
            'id' => \MetForm_Pro\Plugin::instance()->product_id()
        ];
        $mf_res = $this->check_license($data);

        if (isset($mf_res->validate) && $mf_res->validate == 1) {
            update_option('__mf_oppai__', $mf_res->oppai);
            update_option('__mf_license_key__', $mf_res->key);
        } else {
            if (isset($mf_res->error)) {

                $message = $mf_res->message;
                \Oxaim\Libs\Notice::instance('metform-pro', 'unsupported-metform-pro-version')
                    ->set_dismiss('global', (3600 * 24 * 15))
                    ->set_message($message)
                    ->call();

                // return;
            } else {

                $message = $mf_res->message;
                \Oxaim\Libs\Notice::instance('metform-pro', 'unsupported-metform-pro-version')
                    ->set_dismiss('global', (3600 * 24 * 15))
                    ->set_message($message)
                    ->call();
            }
        }
    }

    public function deactivate()
    {
        delete_option('__mf_oppai__');
        update_option('__mf_license_key__', '');
    }

    public function status()
    {
        $cached = wp_cache_get('metform_license_status');

        if (false !== $cached) {
            return $cached;
        }

        $oppai = get_option('__mf_oppai__');
        $key = get_option('__mf_license_key__');

        $status = 'invalid';

        if ($oppai != '' && $key != '') {
            $status = 'valid';
        }

        wp_cache_set('metform_license_status', $status);

        return $status;
    }

    public function get_license()
    {
        $cached = wp_cache_get('mf_license_key');

        if (false !== $cached) {
            return $cached;
        }

        $oppai = get_option('__mf_oppai__');
        $key = get_option('__mf_license_key__');

        $return = null;

        if ($oppai != '' && $key != '') {
            $return = $key;
        }

        wp_cache_set('mf_license_key', $return);

        return $return;
    }

    public function check_license($data = [])
    {
        if (strlen($data['key']) < 28) {
            $data['error'] = 'yes';
            $data['message'] = 'Invalid license key';
            return (object) $data;
        }
        $data['oppai'] = get_option('__mf_oppai__');
        $data['action'] = 'activate';
        $data['marketplace'] = \MetForm_Pro\Plugin::instance()->marketplace();
        $data['author_name'] = \MetForm_Pro\Plugin::instance()->author_name();
        $data['v'] = \MetForm_Pro\Plugin::instance()->version();

        $url = \MetForm_Pro\Plugin::instance()->api_url() . 'license?' . http_build_query($data);

        $args = array(
            'timeout'     => 60,
            'redirection' => 3,
            'httpversion' => '1.0',
            'blocking'    => true,
            'sslverify'   => true,
        );


        $res = wp_remote_get($url, $args);
        return (object)json_decode((string) $res['body']);
    }
}
