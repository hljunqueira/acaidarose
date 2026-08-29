<?php

namespace Metform_Pro\Core\Integrations;

use MetForm_Pro\Traits\Singleton;

defined('ABSPATH') || exit;

class Fluent_Crm {

    use Singleton;

    public function __construct() {
        add_action('metform_fluent_crm_editor_markup', [$this, 'screen']);
    }

    /**
     * @param $url
     * @param $data
     */
    public static function send_data($url, $data, $email_name) {

        $primary_data = [
            'email'      => $data[$email_name],
            'first_name' => isset($data['mf-listing-fname']) ? $data['mf-listing-fname'] : '',
            'last_name'  => isset($data['mf-listing-lname']) ? $data['mf-listing-lname'] : ''
        ];
        
        $data = array_merge($data, $primary_data);

        $response = wp_remote_post($url, ['body' => $data]);

		return $response;
    }

    public function screen() {
        ?>
            <div class="mf-input-group">
                <label class="attr-input-label">
                    <input type="checkbox" value="1" name="mf_fluent" class="mf-admin-control-input mf-form-modalinput-fluent">
                    <span><?php esc_html_e('Fluent:', 'metform-pro'); ?></span>
                </label>
                <span class='mf-input-help'><?php esc_html_e('Integrate fluent with this form.', 'metform-pro'); ?><strong><?php esc_html_e('The form must have at least one Email widget and it should be required.', 'metform-pro'); ?></strong></span>
            </div>

            <div class="mf-input-group mf-fluent mf-form-top-spacing">
                <label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Fluent webhook:', 'metform-pro'); ?></label>
                <input type="text" name="mf_fluent_webhook" class="mf-fluent-web-hook attr-form-control" placeholder="<?php esc_html_e('Fluent webhook', 'metform-pro'); ?>">
                <span class='mf-input-help'><?php esc_html_e('Enter here fluent web hook.', 'metform-pro'); ?></span>
            </div>
        <?php
    }
}