<?php

namespace MetForm_Pro\Core\Integrations\Sms;

class Sms {

    public function __construct() {
        add_action('metform_sms_integration_editor_markup', [$this, 'screen']);
    }

    public function screen() {
        require __DIR__ . '/screen.php';
    }

    /**
     * @param $provider
     * @param $form_settings
     * @param $to
     * @return mixed
     */
    public static function send_sms($provider, $form_settings, $to, $message) {
        if (isset(self::provider_list()[$provider])) {
            $class    = self::provider_list()[$provider];
            $provider = new $class();
            if ($provider instanceof Sms_Interface) {
                return $provider->send_sms($form_settings, $to, $message);
            }
        }
        return false;
    }

    public static function provider_list() {
        return [
            'twilio' => '\MetForm_Pro\Core\Integrations\Sms\Twilio\Twilio'
        ];
    }
}