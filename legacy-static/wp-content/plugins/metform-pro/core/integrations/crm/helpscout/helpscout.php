<?php

namespace MetForm_Pro\Core\Integrations\Crm\Helpscout;

defined('ABSPATH') || exit;

class Helpscout
{
    /**
     * ====================================
     *      Create ticket on Helpscout
     * ====================================
     */
    public function create_ticket($form_id, $form_data, $form_settings, $attributes)
    {
        if (isset($form_settings['mf_helpscout']) && $form_settings['mf_helpscout'] == '1') {

            $attachment        = \MetForm\Core\Entries\Action::instance()->get_input_name_by_widget_type('mf-file-upload');
            $attachments_files = [];

            if ($attachment && !empty($attributes['file_upload_info']) && !empty($attributes['file_data'])) { // If attachment available
                foreach($attributes['file_upload_info'] as $file_info) {
                    foreach($file_info as $file) {
                        $attachment_thread = [
                            'fileName' => $file['name'],
                            'mimeType' => $file['type'],
                            'data'     => base64_encode(file_get_contents($file['file']))
                        ];
                        array_push($attachments_files, $attachment_thread);
                    }
                }
            }

            $this->post_data($form_data, $form_settings, $attachment, $attachments_files);
        }
    }

    /**
     * @param $mailbox_id
     * @param $subject
     * @param $email
     * @param $first_name
     * @param $last_name
     * @param $message
     */
    private function post_data($form_data, $form_settings, $attachment, $attachments_files)
    {
        $mailbox_id = $form_settings['mf_helpscout_mailbox'];
        $subject    = $form_data[$form_settings['mf_helpscout_conversation_subject']];
        $email      = $form_data[$form_settings['mf_helpscout_conversation_customer_email']];
        $first_name = $form_data[$form_settings['mf_helpscout_conversation_customer_first_name']];
        $last_name  = $form_data[$form_settings['mf_helpscout_conversation_customer_last_name']];
        $message    = $form_data[$form_settings['mf_helpscout_conversation_customer_message']];

        $endpoint = 'https://api.helpscout.net/v2/';
        $edge     = 'conversations ';
        $token    = get_option('mf_helpscout_access_token');
        $url      = $endpoint . $edge;

        $data = [
            'subject'   => $subject,
            'customer'  => [
                'email'     => $email,
                'firstName' => $first_name,
                'lastName'  => $last_name
            ],
            'mailboxId' => $mailbox_id,
            'type'      => 'email',
            'status'    => 'active',
            'threads'   => [
                0 => [
                    'type'     => 'customer',
                    'customer' => [
                        'email' => $email
                    ],
                    'text'     => $message
                ]
            ]
        ];

        if ($attachment) {
            $data = [
                'subject'   => $subject,
                'customer'  => [
                    'email'     => $email,
                    'firstName' => $first_name,
                    'lastName'  => $last_name
                ],
                'mailboxId' => $mailbox_id,
                'type'      => 'email',
                'status'    => 'active',
                'threads'   => [
                    0 => [
                        'type'        => 'customer',
                        'customer'    => [
                            'email' => $email
                        ],
                        'text'        => $message,
                        'attachments' => $attachments_files
                    ]
                ]
            ];
        }

        try {
            $response = wp_remote_post(
                $url,
                [
                    'method'      => 'POST',
                    'data_format' => 'body',
                    'redirection' => 5,
                    'timeout'     => 60,
                    'headers'     => [
                        'Authorization' => 'Bearer ' . $token,
                        'Content-Type'  => 'application/json; charset=UTF-8'
                    ],
                    'body'        => json_encode($data)
                ]
            );

            $conversation_id = wp_remote_retrieve_header($response, 'Resource-ID');
        } catch (\Exception $exception) {
        }
        return;
    }
}
