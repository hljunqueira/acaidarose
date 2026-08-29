<?php

namespace MetForm_Pro\Core\Integrations\Email\Mailster;

defined('ABSPATH') || exit;

class Api
{


    /**
     * Get all forms list of Mailster
     * @return mixed
     */
    public function get_forms(){
        if (function_exists('mailster')) {
            return mailster('forms')->get();
        }
    }

    /**
     * Get specific form data
     *
     * @param $form_id
     * @return mixed
     */
    public function get_form($form_id){
        if (function_exists('mailster')) {
            return mailster('forms')->get($form_id);
        }
    }



    /**
     * Get all fields ( including custom fields ) of form from Mailster
     *
     * @return array
     */
    public function get_fields()
    {
        if (function_exists('mailster')) {

            $custom_fields = mailster()->get_custom_fields();


            $default_fields = array(
                'email' => mailster_text('email'),
                'firstname' => mailster_text('firstname'),
                'lastname' => mailster_text('lastname'),
            );

            if ($custom_fields) {
                foreach ($custom_fields as $field => $data) {
                    $default_fields[$field] = $data['name'];
                }
            }

            return $default_fields;
        }

    }
}