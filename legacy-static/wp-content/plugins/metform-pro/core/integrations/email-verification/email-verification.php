<?php

namespace MetForm_Pro\Core\Integrations\Email_Verification;

use MetForm_Pro\Traits\Singleton;

class Email_Verification {

    use Singleton;

    public function init() {
        new Email_Verification_Api();
        add_action('get_metform_email_verification_settings', [$this, 'admin_settings']);
        add_action('met_form_email_verification', [$this, 'send_email'], 10, 3);
    }

    public function send_email($entry_id, $email, $form_settings) {

        $bytes      = random_bytes(20);
        $unique_key = bin2hex($bytes);
        add_post_meta($entry_id, 'email_verified', false);
        add_option($unique_key, $entry_id);

        wp_mail($email, $form_settings['email_verification_email_subject'], $this->email_template($unique_key, $form_settings), [
            'Content-Type: text/html; charset=UTF-8',
        ]);
    }

    public function email_template($unique_key, $form_settings) {

        $url        = get_rest_url(null, 'metform-pro/v1/email-verification/confirm/' . $unique_key);
        $heading    = !empty($form_settings['email_verification_heading']) ? $form_settings['email_verification_heading'] : '';
        $paragraph  = !empty($form_settings['email_verification_paragraph']) ? $form_settings['email_verification_paragraph'] : '';
        $site_title = get_bloginfo('name');
        $logo_id    = get_theme_mod('custom_logo');
        $image      = wp_get_attachment_image_src($logo_id, 'full');

        $logo_url = '';
        if (is_array($image)) {
            $logo_url = $image[0];
        }

        ob_start();
        include_once METFROM_PRO_PLUGIN_DIR . 'core/integrations/email-verification/screens/email-template.php';
        $html = ob_get_clean();
        return $html;
    }

    public function admin_settings() {
        include_once METFROM_PRO_PLUGIN_DIR . 'core/integrations/email-verification/screens/admin-settings.php';
    }
}