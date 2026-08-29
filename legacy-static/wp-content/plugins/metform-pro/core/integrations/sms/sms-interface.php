<?php

namespace MetForm_Pro\Core\Integrations\Sms;

interface Sms_Interface {
    /**
     * @param $form_settings
     * @param $to
     */
    public function send_sms($form_settings, $to, $message);
}