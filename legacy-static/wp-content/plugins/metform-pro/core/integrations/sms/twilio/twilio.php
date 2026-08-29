<?php

namespace MetForm_Pro\Core\Integrations\Sms\Twilio;

use MetForm_Pro\Core\Integrations\Sms\Sms_Interface;

class Twilio implements Sms_Interface {

    /**
     * @return null
     */
    public function send_sms($form_settings, $to, $message) {

        $sid   = isset($form_settings['mf_sms_twilio_account_sid']) ? $form_settings['mf_sms_twilio_account_sid'] : '';
        $token = isset($form_settings['mf_sms_twilio_auth_token']) ? $form_settings['mf_sms_twilio_auth_token'] : '';
        $from  = isset($form_settings['mf_sms_from']) ? $form_settings['mf_sms_from'] : '';
        $api   = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
        $auth  = base64_encode($sid . ':' . $token);

        return wp_remote_post($api, [
            'headers' => [
                'Authorization' => "Basic $auth"
            ],
            'body'    => [
                'Body' => $message,
                'To'   => '+' . $to,
                'From' => $from
            ]
        ]);
    }
}
