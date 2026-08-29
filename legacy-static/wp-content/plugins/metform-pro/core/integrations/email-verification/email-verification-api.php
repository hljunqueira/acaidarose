<?php

namespace MetForm_Pro\Core\Integrations\Email_Verification;

use MetForm\Core\Forms\Action;
use MetForm_Pro\Base\Api;

class Email_Verification_Api extends Api {

    public function config() {

        $this->prefix = 'email-verification';
        $this->param  = "/(?P<id>\w+)";
    }

    public function get_confirm() {

        $id       = $this->request['id'];
        $entry_id = get_option($id);

        if ($entry_id !== false) {

            update_post_meta($entry_id, 'email_verified', true);
            delete_option($id);

            $form_id       = get_post_meta($entry_id, 'metform_entries__form_id', true);
            $form_settings = Action::instance()->get_all_data($form_id);
            $response      = wp_remote_get($form_settings['email_verification_confirm_redirect']);
            $status_code   = wp_remote_retrieve_response_code($response);

            if (200 === $status_code) {
                wp_redirect($form_settings['email_verification_confirm_redirect']);
            } else {
                wp_redirect(get_site_url());
            }

        } else {
            wp_redirect(get_site_url());
        }
        exit;
    }
}