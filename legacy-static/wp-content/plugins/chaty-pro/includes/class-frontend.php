<?php

namespace CHT\frontend;

use CHT\admin\CHT_PRO_Admin_Base;
use CHT\admin\CHT_PRO_Social_Icons;
use CHT\admin\CHT_Social_Icons;

if (!defined('ABSPATH')) {
    exit;
}

$admin_base = CHT_PRO_ADMIN_INC.'/class-admin-base.php';
require_once $admin_base;

$social_icons = CHT_PRO_ADMIN_INC.'/class-social-icons.php';
require_once $social_icons;

class CHT_PRO_Frontend extends CHT_PRO_Admin_Base
{

    public $widget_number = "";

    public $inline_css = "";

    public $widget_settings = [];

    public $chaty_settings = [];

    public $hasFont = false;

    public $hasEmail = false;

    public $hasEmoji = false;

    public $isProductPage = null;

    public $hasChatway = false;

    public $chatwayIcons = [];


    /**
     * constructor.
     */
    public function __construct()
    {
        $this->socials = CHT_PRO_Social_Icons::get_instance()->get_icons_list();
        $this->chatwayIcons = CHT_PRO_Social_Icons::get_instance()->get_chatway_icons();
        // collecting default social media icons
        if (wp_doing_ajax()) {
            // initialize function it is AJAX request
            add_action('wp_ajax_choose_social', [$this, 'choose_social_handler']);
            // return setting for a social media in html
            add_action('wp_ajax_get_chaty_settings', [$this, 'get_chaty_settings']);
            // return setting for a social media in html
            add_action('wp_ajax_remove_chaty_widget', [$this, 'remove_chaty_widget']);
            // remove social media widget
            add_action('wp_ajax_rename_chaty_widget', [$this, 'rename_chaty_widget']);
            // rename social media widget
            add_action('wp_ajax_change_chaty_widget_status', [$this, 'change_chaty_widget_status']);
            // remove social media widget
        }

        // save contact form submit data
        add_action('wp_ajax_chaty_front_form_save_data', [$this, 'chaty_front_form_save_data']);
        add_action('wp_ajax_nopriv_chaty_front_form_save_data', [$this, 'chaty_front_form_save_data']);

        // update channel widget views
        add_action('wp_ajax_update_chaty_widget_views', [$this, 'update_chaty_widget_views']);
        add_action('wp_ajax_nopriv_update_chaty_widget_views', [$this, 'update_chaty_widget_views']);

        // update channel widget views
        add_action('wp_ajax_update_chaty_channel_views', [$this, 'update_chaty_channel_views']);
        add_action('wp_ajax_nopriv_update_chaty_channel_views', [$this, 'update_chaty_channel_views']);

        // update channel widget views
        add_action('wp_ajax_update_chaty_widget_click', [$this, 'update_chaty_widget_click']);
        add_action('wp_ajax_nopriv_update_chaty_widget_click', [$this, 'update_chaty_widget_click']);

        // update channel widget views
        add_action('wp_ajax_update_chaty_channel_click', [$this, 'update_chaty_channel_click']);
        add_action('wp_ajax_nopriv_update_chaty_channel_click', [$this, 'update_chaty_channel_click']);

        $in_editors = $this->check_for_editors();
        if (!($in_editors)) {
            add_action('wp_enqueue_scripts', [$this, 'cht_front_end_css_and_js']);
        }

    }//end __construct()


    function chaty_front_form_save_data()
    {
        $response = [
            'status'  => 0,
            'error'   => 0,
            'errors'  => [],
            'message' => '',
        ];
        $postData = filter_input_array(INPUT_POST);
        $widgetIndex  = $postData['widget'];
        if(empty($widgetIndex)) {
            $widgetIndex = "";
        }

        if (isset($postData['nonce']) && isset($postData['widget']) && (wp_verify_nonce($postData['nonce'], "chaty_widget_nonce".$widgetIndex) || $postData['nonce'] == wp_create_nonce("chaty_widget_nonce".$widgetIndex))) {
            $name    = isset($postData['name']) ? $postData['name'] : "";
            $email   = isset($postData['email']) ? $postData['email'] : "";
            $message = isset($postData['message']) ? $postData['message'] : "";
            $phone   = isset($postData['phone']) ? $postData['phone'] : "";
            $ref_url = isset($postData['ref_url']) ? $postData['ref_url'] : "";
            $channel = $postData['channel'];
            $widget  = $postData['widget'];
            if(empty($widget)) {
                $widget = "";
            }

            $value = get_option('cht_social'.$widget.'_'.$channel);
            // get saved settings for button
            $errors = [];
            if (!empty($value)) {
                $field_setting = isset($value['name']) ? $value['name'] : [];
                if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes" && isset($field_setting['is_required']) && $field_setting['is_required'] == "yes" && empty($name)) {
                    $error    = [
                        'field'   => 'chaty-field-name',
                        'message' => esc_html__("this field is required", 'chaty'),
                    ];
                    $errors[] = $error;
                }

                $field_setting = isset($value['phone']) ? $value['phone'] : [];
                if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes" && isset($field_setting['is_required']) && $field_setting['is_required'] == "yes" && empty($phone)) {
                    $error    = [
                        'field'   => 'chaty-field-phone',
                        'message' => esc_html__("this field is required", 'chaty'),
                    ];
                    $errors[] = $error;
                }

                $field_setting = isset($value['email']) ? $value['email'] : [];
                if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes" && isset($field_setting['is_required']) && $field_setting['is_required'] == "yes") {
                    if (empty($email)) {
                        $error    = [
                            'field'   => 'chaty-field-name',
                            'message' => esc_html__("this field is required", 'chaty'),
                        ];
                        $errors[] = $error;
                    } else if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $error    = [
                            'field'   => 'chaty-field-email',
                            'message' => esc_html__("email address is not valid", 'chaty'),
                        ];
                        $errors[] = $error;
                    }
                }

                $field_setting = isset($value['message']) ? $value['message'] : [];
                if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes" && isset($field_setting['is_required']) && $field_setting['is_required'] == "yes" && empty($message)) {
                    $error    = [
                        'field'   => 'chaty-field-message',
                        'message' => esc_html__("this field is required", 'chaty'),
                    ];
                    $errors[] = $error;
                }

                $recaptchaV2SecretKey = "";
                $recaptchaV3SecretKey = "";
                $recaptchaV3SiteKey = "";
                $recaptchaV2SiteKey = "";
                if(isset($value['captcha_type']) && $value['captcha_type'] == "v2") {
                    $recaptchaV2SecretKey = @$value['v2_secret_key'];
                    $recaptchaV2SiteKey = @$value['v2_site_key'];
                }
                if(isset($value['captcha_type']) && $value['captcha_type'] == "v3") {
                    $recaptchaV3SecretKey = @$value['v3_secret_key'];
                    $recaptchaV3SiteKey = @$value['v3_site_key'];
                }
                $showRecaptcha = get_option('cht_social'.$postData['widget'].'_'.$postData['channel']);

                if (empty($errors)) {

                    // Google Recaptcha V3
                    $captchaStatus = 1;
                    if(isset($postData['token']) && !empty($postData['token'])){
                        if(isset($showRecaptcha['enable_recaptcha']) && $showRecaptcha['enable_recaptcha'] == "yes" && !empty($recaptchaV3SiteKey) && !empty($recaptchaV3SecretKey)) {
                            $captchaStatus = 0;
                            $google_recaptcha_url = 'https://www.google.com/recaptcha/api/siteverify';

                            // Make the request and capture the response by making below request.
                            $get_recaptcha_response = @file_get_contents($google_recaptcha_url . '?secret=' . $recaptchaV3SecretKey . '&response=' . $postData['token']);
                            $get_recaptcha_response = json_decode($get_recaptcha_response);

                            // Set the Google recaptcha spam score here and based the score, take your action
                            if (isset($get_recaptcha_response->success) && $get_recaptcha_response->success == true && $get_recaptcha_response->score >= 0.5 && $get_recaptcha_response->action == 'contact_form') {
                                $captchaStatus = 1;
                            }
                        }

                        // Google Recaptcha V2
                    } else if (isset($showRecaptcha['enable_recaptcha']) && $showRecaptcha['enable_recaptcha'] == "yes"  && !empty($recaptchaV2SiteKey) && !empty($recaptchaV2SecretKey)) {
                        $captchaStatus = 0;
                        if (!empty($postData["v2token"])) {

                            $captchaResponse = @file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret=" . $recaptchaV2SecretKey . "&response=" . $postData['v2token'] . "&remoteip=" . $_SERVER['REMOTE_ADDR']);

                            $captchaResponse = json_decode($captchaResponse);

                            // If captcha response is true we sign them on
                            if (isset($captchaResponse->success) && $captchaResponse->success == true) {
                                $captchaStatus = 1;
                            }
                        }
                    }

                    if($captchaStatus == 0) {
                        $response['status'] = 0;
                        $response['message'] = esc_html__("Invalid Captcha, Please try again", "chaty");
                        echo wp_json_encode($response);
                        exit;
                    }

                    $widget = trim($widget, "_");
                    $response['message']          = esc_html($value['thanks_message']);
                    $response['redirect_action']  = esc_sql($value['redirect_action']);
                    $response['redirect_link']    = esc_url($value['redirect_link']);
                    $response['link_in_new_tab']  = $this->sanitize_xss($value['link_in_new_tab']);
                    $response['close_form_after'] = $this->sanitize_xss($value['close_form_after']);
                    $response['close_form_after_seconds'] = $this->sanitize_xss($value['close_form_after_seconds']);
                    $send_leads_in_email = $value['send_leads_in_email'];
                    $save_leads_locally  = $value['save_leads_locally'];

                    wp_timezone_string();
                    $new_date = gmdate("Y-m-d H:i:s");

                    $wpmime = get_allowed_mime_types();

                    $fileURL = '';

                    if (isset($_FILES['custom_fields']['tmp_name']) && !empty($_FILES['custom_fields']['tmp_name'])) {

                        $custom_file_dir = array();
                        foreach ($_FILES['custom_fields']['tmp_name'] as $key => $val1) {

                            foreach ($val1 as $key2 => $sub_value) {

                                $file               = [];
                                $file['name']       = sanitize_file_name($_FILES['custom_fields']['name'][$key][$key2]);
                                $file['type']       = $_FILES['custom_fields']['type'][$key][$key2];
                                $file['tmp_name']   = $_FILES['custom_fields']['tmp_name'][$key][$key2];
                                $file['error']      = $_FILES['custom_fields']['error'][$key][$key2];
                                $file['size']       = $_FILES['custom_fields']['size'][$key][$key2];

                                // Getting file extension
                                $filename           = sanitize_file_name($file['name']);
                                $filename           = explode( '.', $filename );
                                $extension          = array_pop( $filename );

                                if(!isset($wpmime[$extension]) && !in_array($file['type'], $wpmime)) {
                                    $response['status'] = 0;
                                    $response['message'] = esc_html__("Invalid file, Please try again", "chaty");
                                    echo wp_json_encode($response);
                                    exit;
                                }

                                if($file['error'] == 0) {
                                    $uploaded_file = wp_handle_upload($file, ['test_form' => false]);

                                    if (isset($uploaded_file['file'])) {
                                        $file_path = $uploaded_file['file'];
                                        $file_name = basename($file_path);
                                        $file_type = wp_check_filetype($file_name);

                                        $postData['custom_fields'][$key][$postData['custom_fields'][$key]['slug']] = $uploaded_file['url'];
                                        $custom_file_dir[$key][] = $uploaded_file['url'];

                                        $fileURL = $uploaded_file['url'];

                                        // Prepare an attachment.
                                        $attachment = [
                                            'guid' => $uploaded_file['url'],
                                            'post_mime_type' => $file_type['type'],
                                            'post_title' => preg_replace('/\.[^.]+$/', '', $file_name),
                                            'post_content' => '',
                                            'post_status' => 'inherit',
                                        ];

                                        // Insert the attachment into the database.
                                        $attach_id = wp_insert_attachment($attachment, $file_path);

                                        // Generate attachment metadata and update the database.
                                        $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
                                        wp_update_attachment_metadata($attach_id, $attach_data);
                                    } else {
                                        $response['status'] = 0;
                                        $response['message'] = esc_html__("Error during file upload", "chaty");
                                        echo wp_json_encode($response);
                                        exit;
                                    }
                                } else {
                                    $response['status'] = 0;
                                    $response['message'] = esc_html__("Error during file upload", "chaty");
                                    echo wp_json_encode($response);
                                    exit;
                                }
                            }
                        }
                    }

                    $customFieldData = [];

                    foreach ($postData['custom_fields'] as $key => $val2) {
                        if($val2['slug'] != 'file' && $val2['slug'] != 'textblock') {
                            $customFieldData[$val2['label_' . $val2['slug']]] = $val2[$val2['slug']];
                        } else if($val2['slug'] == 'file' && !empty($fileURL)) {
                            $customFieldData[$val2['label_' . $val2['slug']]] = $fileURL;
                        }
                    }
                    $customJsonFieldData = wp_json_encode($customFieldData);

                    if ($save_leads_locally == "yes") {
                        global $wpdb;
                        $chaty_table   = $wpdb->prefix.'chaty_contact_form_leads';
                        $insert        = [];
                        $field_setting = isset($value['name']) ? $value['name'] : [];
                        if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes") {
                            $insert['name'] = esc_sql(sanitize_text_field($name));
                        }

                        $field_setting = isset($value['email']) ? $value['email'] : [];
                        if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes") {
                            $insert['email'] = esc_sql(sanitize_text_field($email));
                        }

                        $field_setting = isset($value['phone']) ? $value['phone'] : [];
                        if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes") {
                            $insert['phone_number'] = esc_sql(sanitize_text_field($phone));
                        }

                        $field_setting = isset($value['message']) ? $value['message'] : [];
                        if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes") {
                            $insert['message'] = esc_sql(sanitize_text_field($message));
                        }

                        $ip_address = "";
                        if(isset($value['capture_ip_address']) && $value['capture_ip_address'] == "yes") {
                            $ip_address = $this->get_user_ipaddress();
                        }

                        $insert['custom_field'] = esc_sql($customJsonFieldData);
                        $insert['ref_page']   = esc_url(esc_sql($ref_url));
                        $insert['ip_address'] = $ip_address;
                        $insert['widget_id']  = esc_sql(sanitize_text_field($widget));
                        $insert['created_on'] = esc_sql($new_date);

                        $wpdb->insert($chaty_table, $insert);
                    }//end if

                    if ($send_leads_in_email == "yes") {
                        $mail_content  = "";
                        $mail_content .= "<table cellspacing='0' cellpadding='0' border='0' >";
                        $field_setting = isset($value['name']) ? $value['name'] : [];
                        if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes") {
                            $mail_content .= "<tr>";
                            $mail_content .= "<th align='left'>".esc_html__("Name", "chaty").": </th>";
                            $mail_content .= "<td>".esc_attr($name)."</td>";
                            $mail_content .= "</tr>";
                        }

                        $field_setting = isset($value['email']) ? $value['email'] : [];
                        if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes") {
                            $mail_content .= "<tr>";
                            $mail_content .= "<th align='left'>".esc_html__("Email", "chaty").": </th>";
                            $mail_content .= "<td>".esc_attr($email)."</td>";
                            $mail_content .= "</tr>";
                        } else if (empty($email)) {
                            $email = "no-reply@".$_SERVER['HTTP_HOST'];
                        }

                        $field_setting = isset($value['phone']) ? $value['phone'] : [];
                        if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes") {
                            $mail_content .= "<tr>";
                            $mail_content .= "<th align='left'>".esc_html__("Phone", "chaty").": </th>";
                            $mail_content .= "<td>".esc_attr($phone)."</td>";
                            $mail_content .= "</tr>";
                        }

                        $field_setting = isset($value['message']) ? $value['message'] : [];
                        if (isset($field_setting['is_active']) && $field_setting['is_active'] == "yes") {
                            $mail_content .= "<tr>";
                            $mail_content .= "<th align='left'>".esc_html__("Message", "chaty").": </th>";
                            $mail_content .= "<td>".nl2br($message)."</td>";
                            $mail_content .= "</tr>";
                        }

                        $blog_email = (isset($value['email_address']) && !empty($value['email_address'])) ? $value['email_address'] : get_bloginfo('admin_email');
                        $cc_email   = (isset($value['cc_email_address']) && !empty($value['cc_email_address'])) ? $value['cc_email_address'] : "";
                        $bcc_email  = (isset($value['bcc_email_address']) && !empty($value['bcc_email_address'])) ? $value['bcc_email_address'] : "";
                        $sender_name  = (isset($value['sender_name']) && !empty($value['sender_name'])) ? $value['sender_name'] : "";
                        $subject    = (isset($value['email_subject']) && !empty($value['email_subject'])) ? $value['email_subject'] : "New contact form lead";

                        $date_format = get_option("date_format");
                        $time_format = get_option("time_format");

                        if (empty($date_format)) {
                            $date_format = "Y-m-d";
                        }

                        if (empty($time_format)) {
                            $time_format = "H:i:s";
                        }

                        $current_date = $new_date;
                        $date         = get_date_from_gmt($current_date, $date_format);
                        $time         = get_date_from_gmt($current_date, $time_format);

                        $subject = str_replace(["{name}", "{phone}", "{email}", "{date}", "{hour}"], [esc_attr($name), $this->sanitize_xss($phone), $this->sanitize_xss($email), $this->sanitize_xss($date), $this->sanitize_xss($time)], $subject);

                        $from_email = isset($value['sender_email'])?$value['sender_email']:$email;

                        if(empty($from_email) || $from_email == "{email}") {
                            $from_email = $email;
                        }

                        if (!filter_var($from_email, FILTER_VALIDATE_EMAIL)) {
                            $from_email = "no-reply@".$_SERVER['HTTP_HOST'];
                        }

                        if(!empty($sender_name)) {
                            $sender_name = str_replace(["{name}", "{phone}", "{email}", "{date}", "{hour}"], [esc_attr($name), $this->sanitize_xss($phone), $this->sanitize_xss($email), $this->sanitize_xss($date), $this->sanitize_xss($time)], $sender_name);;
                        }

                        if(empty($sender_name)) {
                            $sender_name = "Chaty Form";
                        }

                        $headers  = "MIME-Version: 1.0\r\n";
                        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
                        $headers .= 'From: '.$sender_name.' <'.$from_email.'>'."\r\n";
                        $headers .= 'X-Mailer: PHP/'.phpversion()."\r\n";
                        if (isset($email) && !empty($email) && isset($name) && !empty($name) && $email != "no-reply@".$_SERVER['HTTP_HOST']) {
                            $headers .= "Reply-To: ".sanitize_text_field($name)." <".sanitize_email($email).">\r\n";
                        }
                        if(!empty($cc_email)) {
                            $headers .= 'Cc: '.$cc_email. "\r\n";
                        }
                        if(!empty($bcc_email)) {
                            $headers .= 'Bcc: '.$bcc_email. "\r\n";
                        }

                        foreach ($postData['custom_fields'] as $field) {
                            if(isset($field['label_text']) && isset($field['text'])) {
                                $mail_content .= "<tr>";
                                $mail_content .= "<th align='left'>" . $this->sanitize_xss($field['label_text']) . ": </th>";
                                $mail_content .= "<td>" . nl2br(esc_attr($field['text'])) . "</td>";
                                $mail_content .= "</tr>";
                            } else if(isset($field['label_dropdown']) && isset($field['dropdown'])) {
                                $mail_content .= "<tr>";
                                $mail_content .= "<th align='left'>" . $this->sanitize_xss($field['label_dropdown']) . ": </th>";
                                $mail_content .= "<td>" . nl2br(esc_attr($field['dropdown'])) . "</td>";
                                $mail_content .= "</tr>";
                            } else if(isset($field['label_textarea']) && isset($field['textarea'])) {
                                $mail_content .= "<tr>";
                                $mail_content .= "<th align='left'>" . $this->sanitize_xss($field['label_textarea']) . ": </th>";
                                $mail_content .= "<td>" . nl2br(esc_attr($field['textarea'])) . "</td>";
                                $mail_content .= "</tr>";
                            } else if(isset($field['label_number']) && isset($field['number'])) {
                                $mail_content .= "<tr>";
                                $mail_content .= "<th align='left'>" . $this->sanitize_xss($field['label_number']) . ": </th>";
                                $mail_content .= "<td>" . nl2br(esc_attr($field['number'])) . "</td>";
                                $mail_content .= "</tr>";
                            } else if(isset($field['label_date']) && isset($field['date'])) {
                                $mail_content .= "<tr>";
                                $mail_content .= "<th align='left'>" . $this->sanitize_xss($field['label_date']) . ": </th>";
                                $mail_content .= "<td>" . nl2br(esc_attr($field['date'])) . "</td>";
                                $mail_content .= "</tr>";
                            } else if(isset($field['label_url']) && isset($field['url'])) {
                                $mail_content .= "<tr>";
                                $mail_content .= "<th align='left'>" . $this->sanitize_xss($field['label_url']) . ": </th>";
                                $mail_content .= "<td>" . nl2br(esc_attr($field['url'])) . "</td>";
                                $mail_content .= "</tr>";
                            } else if(isset($field['label_file']) && isset($field['slug']) && $field['slug'] == 'file' && !empty($fileURL)) {
                                $mail_content .= "<tr>";
                                $mail_content .= "<th align='left'>" . $this->sanitize_xss($field['label_file']) . ": </th>";
                                $mail_content .= "<td>" . esc_url($fileURL) . "</td>";
                                $mail_content .= "</tr>";
                            }
                        }

                        $has_mail_content = isset($value['has_custom_mail_content']) ? $value['has_custom_mail_content'] : "no";
                        if($has_mail_content == "yes") {
                            $custom_content = isset($value['mail_content']) ? $value['mail_content'] : "";
                            if(!empty($custom_content)) {

                                $custom_content = nl2br($custom_content);

                                $pageId = isset($postData['page_id'])?sanitize_text_field($postData['page_id']):0;
                                $pageId = intval($pageId);
                                if(!empty($pageId)) {
                                    $postInfo = get_post($pageId);
                                    $pageTitle = isset($postData['page_title'])?esc_attr($postData['page_title']):"";
                                    $find = ["{title}", "{url}", "{woo-itemName}", "{woo-sku}", "{woo-price}", "{woo-regular}", "{woo-discount}"];
                                    $replace = [
                                        $this->get_table_row(esc_html__('Page Title', 'chaty'), $this->sanitize_xss($pageTitle)),
                                        $this->get_table_row(esc_html__('Page URL', 'chaty'), esc_sql($ref_url)),
                                        "",
                                        "",
                                        "",
                                        "",
                                        ""
                                    ];
                                    if(!empty($postInfo)) {
                                        if($postInfo->post_type == "product") {
                                            $product = wc_get_product($pageId);
                                            $regular_price = $product->get_regular_price();
                                            $sale_price = $product->get_sale_price();
                                            $sku = $product->get_sku();
                                            $name = $postInfo->post_title;
                                            if ($product->is_type( 'variable' )) {
                                                $regular_price = esc_html__( 'Variable product', 'chaty' );
                                                $sale_price = esc_html__( 'Variable product', 'chaty' );
                                                $discount = "-";
                                            } else {
                                                $discount = $regular_price - $sale_price;
                                            }

                                            $replace = [
                                                $this->get_table_row(esc_html__('Page Title', 'chaty'), $this->sanitize_xss($pageTitle)),
                                                $this->get_table_row(esc_html__('Page URL', 'chaty'), esc_sql($ref_url)),
                                                $this->get_table_row(esc_html__('Product Name', 'chaty'), $this->sanitize_xss($name)),
                                                $this->get_table_row(esc_html__('Product SKU', 'chaty'), $this->sanitize_xss($sku)),
                                                $this->get_table_row(esc_html__('Product Price', 'chaty'), $this->sanitize_xss($sale_price)),
                                                $this->get_table_row(esc_html__('Regular Price', 'chaty'), $this->sanitize_xss($regular_price)),
                                                $this->get_table_row(esc_html__('Discount Price', 'chaty'), $this->sanitize_xss($discount)),
                                            ];
                                        }
                                    }
                                    $custom_content = str_replace($find, $replace, $custom_content);
                                }

                                $custom_content = str_replace("<br />", "", $custom_content);
                                $mail_content .= $custom_content;
                            }
                        }

                        $mail_content .= "</table>";

                        $status = wp_mail($blog_email, $subject, $mail_content, $headers);
                        if(!$status) {
                            $headers  = "MIME-Version: 1.0\r\n";
                            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
                            $headers .= 'From: '.$sender_name.' <wordpress@'.$_SERVER['HTTP_HOST'].'>'."\r\n";
                            $headers .= 'X-Mailer: PHP/'.phpversion()."\r\n";
                            if (isset($email) && !empty($email) && isset($name) && !empty($name) && $email != "no-reply@".$_SERVER['HTTP_HOST']) {
                                $headers .= "Reply-To: ".sanitize_text_field($name)." <".sanitize_email($email).">\r\n";
                            }
                            if(!empty($cc_email)) {
                                $headers .= 'Cc: '.$cc_email. "\r\n";
                            }
                            if(!empty($bcc_email)) {
                                $headers .= 'Bcc: '.$bcc_email. "\r\n";
                            }
                            $status = wp_mail($blog_email, $subject, $mail_content, $headers);
                        }
                    }//end if

                    $mailchimpEnable = $value['send_leads_mailchimp'];
                    $klaviyoEnable = $value['send_leads_klaviyo'];

                    if ($mailchimpEnable == "yes") {
                        $this->contactleadpushmailchimp($value, $name, $email, $phone, $message, $customFieldData);
                        $flg = true;
                    }
                    if ($klaviyoEnable == "yes") {
                        $this->contactleadpushklaviyo($value, $email);
                        $flg = true;
                    }

                    $response['status'] = 1;
                } else {
                    $response['errors'] = $errors;
                    $response['error']  = 1;
                }//end if
            } else {
                $response['message'] = "Invalid request, Please try again 1";
            }//end if
        } else {
            $response['message'] = "Invalid request, Please try again 2 ";
        }//end if

        echo wp_json_encode($response);
        exit;

    }//end chaty_front_form_save_data()

    function get_table_row($title, $value) {
        return "<tr><th align='left'>".esc_attr($title).":</th><td>".esc_attr($value)."</td>";
    }


    function contactleadpushmailpoet($contact_form, $name, $email, $phone, $message)
    {

        if (class_exists('\MailPoet\API\API')) {

            $field_missing = [];
            /* Get the Mailpoet fields*/
            $mailpoet_fields = \MailPoet\API\API::MP('v1')->getSubscriberFields();

            $mp_fields = [];

            $subscriber_data = array('email' => sanitize_email($email), 'first_name' => sanitize_text_field($name), 'status' => 'Subscribed');

            foreach ($mailpoet_fields as $field) {
                if ($field['name'] == 'Phone') {
                    if (isset($phone) && $phone != '') {
                        $subscriber_data[$field['id']] = sanitize_text_field($phone);
                    }
                }
                if ($field['name'] == 'Message') {
                    if (isset($message) && $message != '') {
                        $subscriber_data[$field['id']] = sanitize_text_field($message);
                    }
                }
            }

            $result = 'success';
            $list_id = $contact_form['mailpoet_list'];
            $lists = array($list_id);
            try {
                \MailPoet\API\API::MP('v1')->addSubscriber($subscriber_data, $lists);
            } catch (Exception $exception) {
                $result = $exception->getMessage();
            }
        }

    }

    public function contactleadpushklaviyo($contact_form, $email){
        $klaviyo_details = get_option('chaty_klaviyo_detail');
        $status = 0;
        $list = '';
        $key = '';
        if ('' !== $klaviyo_details) {
            $status = (int) $klaviyo_details['status'];
            $key  = $klaviyo_details['api'];
        }
        if (1 === $status) {

            $klaviyo_status = 'subscribed';
            $list_id = $contact_form['klaviyo_list'];

            $url = "https://a.klaviyo.com/api/v2/list/$list_id/members";
            $url = str_replace("'", '', $url);
            $merge_fields = [
                'email' => $email
            ];

            $post_data = [
                'email_address' => $email,
                'merge_fields'  => $merge_fields,
            ];
            $data = wp_json_encode(
                [
                    'api_key'   => $key,
                    'profiles'  => $post_data['merge_fields'],
                ]
            );
            $args = [
                'headers'     => [
                    'Content-Type' => 'application/json',
                ],
                'method'    => 'POST',
                'body'      => $data,
            ];

            $result = wp_remote_request($url, $args);

            $response_code = wp_remote_retrieve_response_code($result);
            return $response_code;
        }
        return '';
    }

    public function contactleadpushmailchimp($contact_form, $name, $email, $phone, $message, $custom_fields_value)
    {
        global $wp_version;
        $chaty_mc_api_key = get_option('chaty_mc_api_key');
        $list_id = $contact_form['mailchimp_list'];
        $mailchimp_tags = $contact_form['mailchimp_tags'];
        $mailchimp_status = 'subscribed';
        $sfba_mailchimp_groups = $contact_form['mailchimp-group'];
        $interests = array();
        if (isset($contact_form['mailchimp-enable-group']) && $contact_form['mailchimp-enable-group'] == 'yes' && !empty($sfba_mailchimp_groups)) {
            foreach ($sfba_mailchimp_groups as $group) {
                $interests[$group] = true;
            }
        }
        $merge_fields = [
            'FNAME' => sanitize_text_field($name),
            'LNAME' => '',
            'PHONE' => sanitize_text_field($phone),
            'MESSAGE' => sanitize_text_field($message),
        ];

        /* Merge Custom fields*/
        if (isset($contact_form['mailchimp-field-mapping']) && is_array($contact_form['mailchimp-field-mapping'])) {
            foreach ($contact_form['mailchimp-field-mapping'] as $fields_key => $fields) {
                foreach ($custom_fields_value as $custom_field_key => $custom_field_value) {
                    if ($fields_key == $custom_field_key) {

                        if (is_array($custom_field_value)) {
                            foreach ($custom_field_value as $index => $value) {
                                if($fields == "BIRTHDAY") {
                                    if(!empty($value)) {
                                        $value = gmdate("m/d", strtotime($value));
                                    }
                                }
                                $merge_fields[$fields] = $value;
                            }
                        } else {
                            if($fields == "BIRTHDAY") {
                                if(!empty($custom_field_value)) {
                                    $custom_field_value = gmdate("m/d", strtotime($custom_field_value));
                                }
                            }
                            $merge_fields[$fields] = $custom_field_value;
                        }
                    }
                }
            }
        }


        $post_data = [
            'email_address' => sanitize_email($email),
            'status' => $mailchimp_status, // "subscribed","unsubscribed","cleaned","pending"
            'merge_fields' => $merge_fields,
            'email_type' => 'html',
            'interests' => $interests
        ];

        if (empty($interests)) {
            unset($post_data['interests']);
        }


        $headers = array(
            'Authorization' => 'Basic ' . base64_encode('user:' . $chaty_mc_api_key),
            'Content-Type' => 'application/json',
        );
        $args = array(
            'method' => 'PUT',
            'timeout' => 45,
            'redirection' => 5,
            'httpversion' => '1.0',
            'blocking' => true,
            'user-agent' => 'WordPress/' . $wp_version . '; ' . home_url(),
            'headers' => $headers,
            'body' => wp_json_encode($post_data),
            'cookies' => array(),
            'sslverify' => true,
        );
        $memberId = md5(strtolower(sanitize_email($email)));
        $dataCenter = substr($chaty_mc_api_key, strpos($chaty_mc_api_key, '-') + 1);
        $url = 'https://' . $dataCenter . '.api.mailchimp.com/3.0/lists/' . $list_id . '/members/' . $memberId;
        $response = wp_remote_post($url, $args);
        $api_response_body = json_decode(wp_remote_retrieve_body($response), true);

        if ($mailchimp_tags != '' && isset($contact_form['mailchimp_enable_tag']) && $contact_form['mailchimp_enable_tag'] == 'yes') {
            $tags = explode(',', $mailchimp_tags);
            $tags = array_map('trim', $tags);
            // remove empty tag values
            foreach ($tags as $i => $tag) {
                if ($tag === '') {
                    unset($tags[$i]);
                }
            }
            $tags = array_values($tags);
            $post_data = [
                "tags" => CHT_PRO_Social_Icons::get_instance()->chaty_merge_and_format_member_tags(array(), $tags)
            ];
            $url = 'https://' . $dataCenter . '.api.mailchimp.com/3.0/lists/' . $list_id . '/members/' . $memberId . '/tags';
            $headers = array(
                'Authorization' => 'Basic ' . base64_encode('user:' . $chaty_mc_api_key),
                'Content-Type' => 'application/json',
            );
            $args = array(
                'method' => 'POST',
                'timeout' => 45,
                'redirection' => 5,
                'httpversion' => '1.0',
                'blocking' => true,
                'user-agent' => 'WordPress/' . $wp_version . '; ' . home_url(),
                'headers' => $headers,
                'body' => wp_json_encode($post_data),
                'cookies' => array(),
                'sslverify' => true,
            );
            $response = wp_remote_post($url, $args);
            $api_response_body = json_decode(wp_remote_retrieve_body($response), true);
        }
    }


    function check_for_editors()
    {
        $is_elementor    = isset($_GET['elementor-preview']) ? 1 : 0;
        $is_ct_builder   = isset($_GET['ct_builder']) ? 1 : 0;
        $is_divi_theme   = isset($_GET['et_fb']) ? 1 : 0;
        $is_zion_builder = isset($_GET['zionbuilder-preview']) ? 1 : 0;
        $is_site_origin  = isset($_GET['siteorigin_panels_live_editor']) ? 1 : 0;
        $fl_builder      = isset($_GET['fl_builder']) ? 1 : 0;
        return ($is_ct_builder || $is_elementor || $is_divi_theme || $is_zion_builder || $is_site_origin || $fl_builder) ? 1 : 0;

    }//end check_for_editors()


    function cht_front_end_css_and_js()
    {
        if($this->isProductPage == null) {
            if(is_single() && get_post_type() == "product" && function_exists("wc_get_product")) {
                $this->isProductPage = true;
            } else {
                $this->isProductPage = false;
            }
        }


        if ($this->canInsertWidget()) :
            $settings = $this->widget_settings;
            if (!empty($settings)) {
                $chaty_updated_on = get_option("chaty_updated_on");
                if (empty($chaty_updated_on)) {
                    $chaty_updated_on = time();
                }

                $data = [];
                $data['chaty_widgets'] = $settings;
                $data['ajax_url']      = admin_url("admin-ajax.php");
                $status = get_option("cht_data_analytics_status");
                $status = ($status === false) ? "on" : $status;
                $data['data_analytics_settings'] = $status;

                global $post;
                $data['page_id'] = 0;
                if(isset($post->ID)) {
                    $data['page_id'] = $post->ID;
                }

                $wooName = "";
                $wooSKU = "";
                $wooPrice = "";
                $wooRegPrice = "";
                $wooDisc = "";

                if($this->isProductPage) {
                    $product_id = get_the_ID();
                    $product = wc_get_product( $product_id );
                    if(!empty($product)) {
                        $wooName = $product->get_name();
                        $wooSKU = $product->get_sku();
                        $wooPrice = wp_strip_all_tags(wc_price($product->get_price()));
                        $wooRegPrice = wp_strip_all_tags(wc_price($product->get_regular_price()));
                        $wooDisc = wp_strip_all_tags(wc_price(floatval($product->get_regular_price()) - floatval($product->get_price())));
                    }
                }

                $data['product'] = [
                    'title' => $this->sanitize_xss($wooName),
                    'sku' => $this->sanitize_xss($wooSKU),
                    'price' => $this->sanitize_xss($wooPrice),
                    'regPrice' => $this->sanitize_xss($wooRegPrice),
                    'discount' => $this->sanitize_xss($wooDisc),
                ];

                $minified = CHT_PRO_DEV_MODE?'':'.min';

                wp_enqueue_style('chaty-css', CHT_PLUGIN_URL."css/chaty-front".esc_attr($minified).".css", [], CHT_CURRENT_VERSION.$chaty_updated_on);
                wp_add_inline_style('chaty-css', $this->inline_css);

                if ($this->hasFont) {
                    wp_enqueue_style('font-awesome-css', "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.0/css/all.min.css", array(), CHT_CURRENT_VERSION);
                }

                wp_enqueue_script("chaty", CHT_PLUGIN_URL."js/cht-front-script".esc_attr($minified).".js", ['jquery'], CHT_CURRENT_VERSION.$chaty_updated_on, true);

                if($this->hasEmail) {
                    wp_enqueue_script("chaty-mail-check", CHT_PLUGIN_URL . "js/mailcheck.js", ['jquery', 'chaty'], CHT_CURRENT_VERSION, true);
                }

                if($this->hasEmoji) {
                    wp_enqueue_script('chaty-picmo-js', CHT_PLUGIN_URL . 'js/picmo-umd.min.js', ['jquery', 'chaty'], CHT_CURRENT_VERSION, true);
                }

                wp_enqueue_script("chaty");

                $data['lang'] = $this->get_language_strings();
                $data['has_chatway'] = $this->hasChatway;
                wp_localize_script('chaty', 'chaty_settings', $data);

                if ( version_compare( get_bloginfo( 'version' ), '6.2.3', '>=' ) ) {
                    wp_script_add_data( 'chaty', 'strategy', 'defer' );
                    wp_script_add_data( 'chaty-mail-check', 'strategy', 'defer' );
                }

                $this->chaty_settings['chaty_settings'] = $data;
            }//end if
        endif;


    }//end cht_front_end_css_and_js()


    /**
     * Returns an array of language strings used in the application.
     *
     * @return array
     */
    public function get_language_strings() {
        return [
            'whatsapp_label' => esc_html__("WhatsApp Message", "chaty"),
            'whatsapp_button' => esc_html__("Send WhatsApp Message", "chaty"),
            'hide_whatsapp_form' => esc_html__("Hide WhatsApp Form", "chaty"),
            'emoji_picker' => esc_html__("Show Emojis", "chaty"),
        ];
    }

    /**
     * Sanitizes a string by removing any HTML tags and converting special characters to their HTML entities.
     *
     * @param string $value The string to sanitize.
     *
     * @return string The sanitized string.
     * @since 1.0.0
     * @access public
     *
     */
    function sanitize_xss($value) {
        return esc_attr(htmlspecialchars(strip_tags($value)));
    }


    /**
     * Update the click count for a Chaty widget.
     *
     * @return void
     */
    public function update_chaty_widget_click()
    {
        $postData = filter_input_array(INPUT_POST);
        $response = [];
        if (!empty($postData)) {
            $widget_id = trim(isset($postData['widgetId']) ? $postData['widgetId'] : "");
            $type      = isset($postData['type']) ? $postData['type'] : "";
            $date      = strtotime(gmdate("Y-m-d 00:00:00"));
            global $wpdb;
            $chaty_table = $wpdb->prefix.'chaty_widget_analysis';
            $widget_id   = trim($widget_id, "_");
            $channels    = isset($postData['channels']) ? $postData['channels'] : [];
            $widget_id   = esc_sql($widget_id);

            // checking for existing widgets data for current data
            $query = "SELECT id, widget_id, channel_slug, no_of_views, no_of_clicks, is_widget, analysis_date
                FROM {$chaty_table}
                WHERE widget_id = '%d' AND is_widget = '1' AND analysis_date ='%d'";
            $query = $wpdb->prepare($query, [$widget_id, $date]);

            if (!empty($query)) {
                $result = $wpdb->get_row($query, ARRAY_A);
                if (!empty($result)) {
                    $id    = $result['id'];
                    $query = "UPDATE {$chaty_table} SET no_of_clicks = no_of_clicks + 1 WHERE id = '%d'";
                    $query = $wpdb->prepare($query, [$id]);
                    $wpdb->query($query);
                } else {
                    $data = [];
                    $data['is_widget']     = 0;
                    $data['no_of_views']   = 0;
                    $data['no_of_clicks']  = 1;
                    $data['widget_id']     = $widget_id;
                    $data['channel_slug']  = '';
                    $data['analysis_date'] = $date;
                    $wpdb->insert($chaty_table, $data);
                }

                if (!empty($channels)) {
                    $isSingle = isset($postData['isSingle']) ? $postData['isSingle'] : 0;
                    $isOpen   = isset($postData['isOpen']) ? $postData['isOpen'] : 0;

                    if ($isSingle || $isOpen) {
                        foreach ($channels as $channel) {
                            $channel = esc_sql(strtolower($channel));
                            $query   = "SELECT id, widget_id, channel_slug, no_of_views, no_of_clicks, is_widget, analysis_date
                                    FROM {$chaty_table}
                                    WHERE widget_id = '%d' AND is_widget = '0' AND analysis_date ='%d' AND channel_slug = '%s'";
                            $query   = $wpdb->prepare($query, [$widget_id, $date, $channel]);
                            if (!empty($query)) {
                                $result = $wpdb->get_row($query, ARRAY_A);
                                if (!empty($result)) {
                                    $id    = $result['id'];
                                    $query = "UPDATE {$chaty_table} SET no_of_clicks = no_of_clicks + 1 WHERE id = '%d'";
                                    $query = $wpdb->prepare($query, [$id]);
                                    $wpdb->query($query);
                                } else {
                                    $data = [];
                                    $data['is_widget']     = 0;
                                    $data['no_of_views']   = 0;
                                    $data['no_of_clicks']  = 1;
                                    $data['widget_id']     = $widget_id;
                                    $data['channel_slug']  = $channel;
                                    $data['analysis_date'] = $date;

                                    $wpdb->insert($chaty_table, $data);
                                }
                            }
                        }//end foreach
                    } else {
                        foreach ($channels as $channel) {
                            $channel = esc_sql(strtolower($channel));
                            $query   = "SELECT id, widget_id, channel_slug, no_of_views, no_of_clicks, is_widget, analysis_date
                                    FROM {$chaty_table}
                                    WHERE widget_id = '%d' AND is_widget = '0' AND analysis_date ='%d' AND channel_slug = '%s'";
                            $query   = $wpdb->prepare($query, [$widget_id, $date, $channel]);
                            if (!empty($query)) {
                                $result = $wpdb->get_row($query, ARRAY_A);
                                if (!empty($result)) {
                                    $id    = $result['id'];
                                    $query = "UPDATE {$chaty_table} SET no_of_views = no_of_views + 1 WHERE id = '%d'";
                                    $query = $wpdb->prepare($query, [$id]);
                                    $wpdb->query($query);
                                } else {
                                    $data = [];
                                    $data['is_widget']     = 0;
                                    $data['no_of_views']   = 1;
                                    $data['no_of_clicks']  = 0;
                                    $data['widget_id']     = $widget_id;
                                    $data['channel_slug']  = $channel;
                                    $data['analysis_date'] = $date;

                                    $wpdb->insert($chaty_table, $data);
                                }
                            }
                        }//end foreach
                    }//end if
                }//end if
            }//end if
        }//end if

        echo "1";
        exit;

    }//end update_chaty_widget_click()


    public function update_chaty_channel_click()
    {
        $postData = filter_input_array(INPUT_POST);
        $response = [];
        if (!empty($postData)) {
            $widget_id = trim(isset($postData['widgetId']) ? $postData['widgetId'] : "");
            $date      = strtotime(gmdate("Y-m-d 00:00:00"));
            global $wpdb;
            $chaty_table = $wpdb->prefix.'chaty_widget_analysis';
            $widget_id   = esc_sql(trim($widget_id, "_"));
            $channel     = isset($postData['channel']) ? $postData['channel'] : "";
            $channel     = esc_sql(strtolower($channel));

            $query = "SELECT id, widget_id, channel_slug, no_of_views, no_of_clicks, is_widget, analysis_date
                                    FROM {$chaty_table}
                                    WHERE widget_id = '%d' AND is_widget = '0' AND analysis_date ='%d' AND channel_slug = '%s'";

            $query = $wpdb->prepare($query, [$widget_id, $date, $channel]);
            if (!empty($query)) {
                $result = $wpdb->get_row($query, ARRAY_A);
                if (!empty($result)) {
                    $id    = $result['id'];
                    $query = "UPDATE {$chaty_table} SET no_of_clicks = no_of_clicks + 1 WHERE id = '%d'";
                    $query = $wpdb->prepare($query, [$id]);
                    $wpdb->query($query);
                } else {
                    $data = [];
                    $data['is_widget']     = 0;
                    $data['no_of_views']   = 0;
                    $data['no_of_clicks']  = 1;
                    $data['widget_id']     = $widget_id;
                    $data['channel_slug']  = $channel;
                    $data['analysis_date'] = $date;

                    $wpdb->insert($chaty_table, $data);
                }
            }
        }//end if

        echo "1";
        exit;

    }//end update_chaty_channel_click()


    public function update_chaty_widget_views()
    {
        $postData = filter_input_array(INPUT_POST);
        $response = [];
        if (!empty($postData)) {
            if(!get_option("chaty_views")) {
                add_option("chaty_views", 1);
            }

            $widget_id = trim(isset($postData['widgetId']) ? $postData['widgetId'] : "");
            $date      = strtotime(gmdate("Y-m-d 00:00:00"));
            global $wpdb;
            $chaty_table = $wpdb->prefix.'chaty_widget_analysis';
            $widget_id   = esc_sql(trim($widget_id, "_"));
            $channels    = isset($postData['channels']) ? $postData['channels'] : [];

            // checking for existing widgets data for current data
            $query = "SELECT id, widget_id, channel_slug, no_of_views, no_of_clicks, is_widget, analysis_date
                FROM {$chaty_table}
                WHERE widget_id = '%d' AND is_widget = '1' AND analysis_date ='%d'";
            $query = $wpdb->prepare($query, [$widget_id, $date]);

            if (!empty($query)) {
                $result = $wpdb->get_row($query, ARRAY_A);
                if (!empty($result)) {
                    $id    = $result['id'];
                    $query = "UPDATE {$chaty_table} SET no_of_views = no_of_views + 1 WHERE id = '%d'";
                    $query = $wpdb->prepare($query, [$id]);
                    $wpdb->query($query);
                } else {
                    $data = [];
                    $data['is_widget']     = 1;
                    $data['no_of_views']   = 0;
                    $data['no_of_clicks']  = 0;
                    $data['widget_id']     = $widget_id;
                    $data['channel_slug']  = '';
                    $data['analysis_date'] = $date;
                    $data['no_of_views']   = 1;
                    $wpdb->insert($chaty_table, $data);
                }

                if (!empty($channels)) {
                    $isSingle = esc_sql(isset($postData['isSingle']) ? $postData['isSingle'] : 0);
                    $isOpen   = esc_sql(isset($postData['isOpen']) ? $postData['isOpen'] : 0);

                    if ($isSingle || $isOpen) {
                        foreach ($channels as $channel) {
                            $channel = esc_sql(strtolower($channel));
                            $query   = "SELECT id, widget_id, channel_slug, no_of_views, no_of_clicks, is_widget, analysis_date
                                    FROM {$chaty_table}
                                    WHERE widget_id = '%d' AND is_widget = '0' AND analysis_date ='%d' AND channel_slug = '%s'";
                            $query   = $wpdb->prepare($query, [$widget_id, $date, $channel]);
                            if (!empty($query)) {
                                $result = $wpdb->get_row($query, ARRAY_A);
                                if (!empty($result)) {
                                    $id    = $result['id'];
                                    $query = "UPDATE {$chaty_table} SET no_of_views = no_of_views + 1 WHERE id = '%d'";
                                    $query = $wpdb->prepare($query, [$id]);
                                    $wpdb->query($query);
                                } else {
                                    $data = [];
                                    $data['is_widget']     = 0;
                                    $data['no_of_views']   = 1;
                                    $data['no_of_clicks']  = 0;
                                    $data['widget_id']     = $widget_id;
                                    $data['channel_slug']  = $channel;
                                    $data['analysis_date'] = $date;

                                    $wpdb->insert($chaty_table, $data);
                                }
                            }
                        }//end foreach
                    }//end if
                }//end if
            }//end if
        }//end if

        echo "1";
        exit;

    }//end update_chaty_widget_views()


    public function update_chaty_channel_views()
    {
        $postData = filter_input_array(INPUT_POST);
        $response = [];
        if (!empty($postData)) {
            $widget_id = trim(isset($postData['widgetId']) ? $postData['widgetId'] : "");
            $date      = strtotime(gmdate("Y-m-d 00:00:00"));
            global $wpdb;
            $chaty_table = $wpdb->prefix.'chaty_widget_analysis';
            $widget_id   = esc_sql(trim($widget_id, "_"));
            $channels    = isset($postData['channels']) ? $postData['channels'] : [];

            // checking for existing widgets data for current data
            $query = "SELECT id, widget_id, channel_slug, no_of_views, no_of_clicks, is_widget, analysis_date
                FROM {$chaty_table}
                WHERE widget_id = '%d' AND is_widget = '1' AND analysis_date ='%d'";
            $query = $wpdb->prepare($query, [$widget_id, $date]);

            if (!empty($query)) {
                $result = $wpdb->get_row($query, ARRAY_A);
                /*
                    if(!empty($result)) {
                    $id = $result['id'];
                    $query = "UPDATE {$chaty_table} SET no_of_views = no_of_views + 1 WHERE id = '%d'";
                    $query = $wpdb->prepare($query, array($id));
                    $wpdb->query($query);
                    } else {
                    $data = array();
                    $data['is_widget'] = 1;
                    $data['no_of_views'] = 0;
                    $data['no_of_clicks'] = 0;
                    $data['widget_id'] = $widget_id;
                    $data['channel_slug'] = '';
                    $data['analysis_date'] = $date;
                    $data['no_of_views'] = 1;
                    $wpdb->insert($chaty_table, $data);
                }*/

                if (!empty($channels)) {
                    foreach ($channels as $channel) {
                        $channel = esc_sql(strtolower($channel));
                        $query   = "SELECT id, widget_id, channel_slug, no_of_views, no_of_clicks, is_widget, analysis_date
                                FROM {$chaty_table}
                                WHERE widget_id = '%d' AND is_widget = '0' AND analysis_date ='%d' AND channel_slug = '%s'";
                        $query   = $wpdb->prepare($query, [$widget_id, $date, $channel]);
                        if (!empty($query)) {
                            $result = $wpdb->get_row($query, ARRAY_A);
                            if (!empty($result)) {
                                $id    = $result['id'];
                                $query = "UPDATE {$chaty_table} SET no_of_views = no_of_views + 1 WHERE id = '%d'";
                                $query = $wpdb->prepare($query, [$id]);
                                $wpdb->query($query);
                            } else {
                                $data = [];
                                $data['is_widget']     = 0;
                                $data['no_of_views']   = 1;
                                $data['no_of_clicks']  = 0;
                                $data['widget_id']     = $widget_id;
                                $data['channel_slug']  = $channel;
                                $data['analysis_date'] = $date;

                                $wpdb->insert($chaty_table, $data);
                            }
                        }
                    }//end foreach
                }//end if
            }//end if
        }//end if

        echo "1";
        exit;

    }//end update_chaty_channel_views()


    /**
     * Retrieves the user's IP address.
     *
     * This method checks various server variables to determine the user's IP address.
     *
     * @return string The user's IP address.
     */
    function get_user_ipaddress()
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = sanitize_text_field($_SERVER['HTTP_CLIENT_IP']);
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = sanitize_text_field($_SERVER['HTTP_X_FORWARDED_FOR']);
        } else {
            $ip = sanitize_text_field($_SERVER['REMOTE_ADDR']);
        }
        return $ip;

    }//end get_user_ipaddress()


    /**
     * Retrieves the settings for a social media channel.
     *
     * @return void
     */
    public function get_chaty_settings()
    {
        if (current_user_can('manage_options')) {
            $slug    = sanitize_text_field($_POST['social']);
            $channel = sanitize_text_field($_POST['channel']);
            $status  = 0;
            $data    = [];
            if (!empty($slug)) {
                foreach ($this->socials as $social) {
                    if ($social['slug'] == $slug) {
                        break;
                    }
                }

                if (!empty($social)) {
                    $status = 1;
                    $data   = $social;
                    $data['help']      = "";
                    $data['help_text'] = "";
                    $data['help_link'] = "";
                    if ((isset($social['help']) && !empty($social['help'])) || isset($social['help_link'])) {
                        $data['help_title'] = isset($social['help_title']) ? $social['help_title'] : "Doesn't work?";
                        $data['help_text']  = isset($social['help']) ? $social['help'] : "";
                        if (isset($data['help_link']) && !empty($data['help_link'])) {
                            $data['help_link'] = $data['help_link'];
                        } else {
                            $data['help_title'] = $data['help_title'];
                        }
                    }
                }
            }//end if

            $response            = [];
            $response['data']    = $data;
            $response['status']  = $status;
            $response['channel'] = $this->sanitize_xss($channel);
            echo wp_json_encode($response);
            die;
        }//end if

    }//end get_chaty_settings()


    // function choose_social_handler start
    public function choose_social_handler()
    {
        if (current_user_can('manage_options')) {
            check_ajax_referer('cht_nonce_ajax', 'nonce_code');
            $slug = sanitize_text_field($_POST['social']);

            if (!is_null($slug) && !empty($slug)) {
                foreach ($this->socials as $social) {
                    if ($social['slug'] == $slug) {
                        break;
                    }
                }

                if (!$social) {
                    return;
                    // return if social media setting not found
                }

                $this->widget_index = sanitize_text_field($_POST['widget_index']);
                $hasWooCommerce = 0;
                if(is_plugin_active("woocommerce/woocommerce.php")) {
                    $hasWooCommerce = 1;
                }

                $value = get_option('cht_social'.$this->widget_index.'_'.$social['slug']);
                // get setting for media if already saved
                ob_start();
                if($social['slug'] == 'Chatway') {
                    include CHT_PRO_DIR . DIRECTORY_SEPARATOR . "views" . DIRECTORY_SEPARATOR . "admin" . DIRECTORY_SEPARATOR . "chatway-setting.php";
                } else {
                    include CHT_PRO_DIR . DIRECTORY_SEPARATOR . "views" . DIRECTORY_SEPARATOR . "admin" . DIRECTORY_SEPARATOR . "channel-setting.php";
                }
                $html = ob_get_clean();
                echo wp_json_encode($html);
            }//end if

            wp_die();
        }//end if

    }//end choose_social_handler()


    // function choose_social_handler end
    public function rename_chaty_widget()
    {
        if (current_user_can('manage_options')) {
            $widget_index = sanitize_text_field($_POST['widget_index']);
            $widget_nonce = sanitize_text_field($_POST['widget_nonce']);
            $widget_title = sanitize_text_field($_POST['widget_title']);
            if (isset($widget_index) && !empty($widget_index) && !empty($widget_nonce) && wp_verify_nonce($widget_nonce, "chaty_remove_".$widget_index)) {
                $index = $widget_index;
                $index = trim($index, "_");

                if (empty($index)) {
                    update_option("cht_widget_title", $widget_title);
                } else {
                    update_option("cht_widget_title_".$index, $widget_title);
                }

                echo esc_url(admin_url("admin.php?page=chaty-app"));
                exit;
            }
        }

    }//end rename_chaty_widget()


    public function remove_chaty_widget()
    {
        if (current_user_can('manage_options')) {
            $widget_index = sanitize_text_field($_POST['widget_index']);
            $widget_nonce = sanitize_text_field($_POST['widget_nonce']);
            if (isset($widget_index) && !empty($widget_index) && !empty($widget_nonce) && wp_verify_nonce($widget_nonce, "chaty_remove_".$widget_index)) {
                $index = $widget_index;
                $index = trim($index, "_");

                $deleted_list = get_option("chaty_deleted_settings");
                if (empty($deleted_list) || !is_array($deleted_list)) {
                    $deleted_list = [];
                }

                if (!in_array($index, $deleted_list)) {
                    $deleted_list[] = $index;
                    update_option("chaty_deleted_settings", $deleted_list);
                }

                if ($index == 0) {
                    update_option("cht_is_default_deleted", 1);
                }

                echo esc_url(admin_url("admin.php?page=chaty-app"));
                exit;
            }//end if
        }//end if

    }//end remove_chaty_widget()


    public function change_chaty_widget_status()
    {
        if (current_user_can('manage_options')) {
            $widget_index = sanitize_text_field($_POST['widget_index']);
            $widget_nonce = sanitize_text_field($_POST['widget_nonce']);
            if (isset($widget_index) && !empty($widget_index) && !empty($widget_nonce) && wp_verify_nonce($widget_nonce, "chaty_remove_".$widget_index)) {
                $widget_index = trim($widget_index, "_");
                if (empty($widget_index) || $widget_index == 0) {
                    $widget_index = "";
                } else {
                    $widget_index = "_".$widget_index;
                }

                $status = get_option("cht_active".$widget_index);
                if ($status) {
                    update_option("cht_active".$widget_index, 0);
                } else {
                    update_option("cht_active".$widget_index, 1);
                }
            }
        }

        echo "1";
        exit;

    }//end change_chaty_widget_status()


    function replace_wc_tags($string, $product_id = 0, $separator = "") {
        if(!empty($string)) {
            if(empty($product_id)) {
                $product_id = get_the_ID();
            }
            $wooName = "";
            $wooSKU = "";
            $wooPrice = "";
            $wooRegPrice = "";
            $wooDisc = "";

            if($this->isProductPage) {
                $product = wc_get_product( $product_id );
                if(!empty($product)) {
                    $wooName = $product->get_name();
                    $wooSKU = $product->get_sku();
                    $wooPrice = html_entity_decode(wp_strip_all_tags(wc_price($product->get_price())));
                    $wooRegPrice = html_entity_decode(wp_strip_all_tags(wc_price($product->get_regular_price())));
                    $wooDisc = html_entity_decode(wp_strip_all_tags(wc_price(floatval($product->get_regular_price()) - floatval($product->get_price()))));
                }
            }
            $string = trim(str_replace(["{woo-itemName}", "{woo-sku}", "{woo-price}", "{woo-regular}", "{woo-discount}"],
                [
                    $separator.esc_html__("Product name: ", "chaty").$wooName,
                    $separator.esc_html__("Product SKU: ", "chaty").$wooSKU,
                    $separator.esc_html__("Product price: ", "chaty").$wooPrice,
                    $separator.esc_html__("Product regular price: ", "chaty").$wooRegPrice,
                    $separator.esc_html__("Product discount: ", "chaty").$wooDisc],
                $string));
            return $string;
        }
        return $string;
    }

    public function is_chatway_active($settings)
    {
        if (!function_exists( 'is_plugin_active' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        if (is_plugin_active('chatway-live-chat/chatway.php')) {
            $user_identifier = get_option( 'chatway_user_identifier', '' );
            if(!empty($user_identifier)) {
                $position = isset($settings['chatway_position'])?$settings['chatway_position']:"above-chaty";
                if($position == 'above-chaty' || $position == 'inside-chaty') {
                    $this->hasChatway = true;
                    return $user_identifier;
                }
            }
        }
        return false;
    }


    // get social media list for front end widget
    public function get_social_icon_list($index="")
    {
        if (empty($index)) {
            $index = $this->widget_number;
        }

        $social = get_option('cht_numb_slug'.$index);
        // get saved social media list
        $social = explode(",", $social);

        $arr = [];
        foreach ($social as $number => $key_soc) :
            foreach ($this->socials as $key => $social) :
                // compare with Default Social media list
                if ($social['slug'] != $key_soc) {
                    continue;
                    // return if slug is not equal
                }

                $value = get_option('cht_social'.$index.'_'.$social['slug']);
                // get saved settings for button
                if ($value) {
                    $slug = strtolower($social['slug']);

                    if (!empty($value['value']) || $slug == "contact_us" || (isset($value['is_agent']) && $value['is_agent']) || ($slug == 'chatway' && $this->is_chatway_active($value))) {
                        $url            = "";
                        $mobile_url     = "";
                        $desktop_target = "";
                        $mobile_target  = "";
                        $qr_code_image  = "";
                        $recaptchaV2SiteKey = "";
                        $recaptchaV3SiteKey = "";
                        $enableRecaptcha = 0;
                        $viberURL       = "";


                        $channel_type = $slug;

                        if (!isset($value['value'])) {
                            $value['value'] = "";
                        }

                        if(!isset($value['chatway_position'])) {
                            $value['chatway_position'] = '';
                        }

                        $svg_icon = $social['svg'];
                        if ($slug == "link" || $slug == "custom_link" || $slug == "custom_link_3" || $slug == "custom_link_4" || $slug == "custom_link_5") {
                            if (isset($value['channel_type']) && !empty($value['channel_type'])) {
                                $channel_type = $value['channel_type'];

                                foreach ($this->socials as $icon) {
                                    if ($icon['slug'] == $channel_type) {
                                        $svg_icon = $icon['svg'];
                                    }
                                }
                            }
                        } else if($slug == 'chatway' && isset($value['chatway_icon'])) {
                            $svg_icon = isset($this->chatwayIcons[$value['chatway_icon']])?$this->chatwayIcons[$value['chatway_icon']]:$this->chatwayIcons['icon_1'];
                        }

                        $channel_type    = strtolower($channel_type);
                        $channel_id      = "cht-channel-".$number.$index;
                        $channel_id      = trim($channel_id, "_");
                        $pre_set_message = "";

                        if ($channel_type == "viber") {
                            // Viber change to exclude + from number for desktop
                            $val = $value['value'];
                            if (is_numeric($val)) {
                                $fc = substr($val, 0, 1);
                                if ($fc == "+") {
                                    $length = (-1 * (strlen($val) - 1));
                                    $val    = substr($val, $length);
                                }

                                if (!wp_is_mobile()) {
                                    // Viber change to include + from number for mobile
                                    $val = "+".$val;
                                }
                            }
                        } else if ($channel_type == "whatsapp") {
                            // Whatspp change to exclude + from phone number
                            $val = $value['value'];
                            $val = str_replace("+", "", $val);
                            $val = $this->sanitize_xss($this->cleanStringForNumbers($val));
                        } else if ($channel_type == "facebook_messenger") {
                            // Facebook change to change URL from facebook.com to m.me version 2.1.0 change
                            $val = $value['value'];
                            $val = str_replace("facebook.com", "m.me", $val);
                            // Facebook change to remove www. from URL. version 2.1.0 change
                            $val = str_replace("www.", "", $val);

                            $val        = trim($val, "/");
                            $val_array  = explode("/", $val);
                            $total      = (count($val_array) - 1);
                            $last_value = $val_array[$total];
                            $last_value = explode("-", $last_value);
                            $total_text = (count($last_value) - 1);
                            $total_text = $last_value[$total_text];

                            if (is_numeric($total_text)) {
                                $val_array[$total] = $total_text;
                                $val = implode("/", $val_array);
                            }
                        } else {
                            $val = $value['value'];
                        }//end if

                        if (!isset($value['title'])) {
                            $value['title'] = $social['title'];
                            // Initialize title with default title if not exists. version 2.1.0 change
                        }

                        $image_url = "";

                        // get custom image URL if uploaded. version 2.1.0 change
                        if (isset($value['image_id']) && !empty($value['image_id'])) {
                            $image_id = $value['image_id'];
                            if (!empty($image_id)) {
                                $image_data = wp_get_attachment_image_src($image_id, "full");
                                if (!empty($image_data) && is_array($image_data)) {
                                    $image_url = $image_data[0];
                                }
                            }
                        }

                        $on_click_fn = "";
                        // get custom icon background color if exists. version 2.1.0 change
                        if (!isset($value['bg_color']) || empty($value['bg_color'])) {
                            $value['bg_color'] = '';
                        }

                        if ($channel_type == "whatsapp") {

                            // setting for Whatsapp URL
                            $val = str_replace("+", "", $val);
                            $val = str_replace(" ", "", $val);
                            $val = str_replace("-", "", $val);
                            $val = trim($this->cleanStringForNumbers($val));
                            if (isset($value['use_whatsapp_web']) && $value['use_whatsapp_web'] == "yes") {
                                $url = "https://web.whatsapp.com/send?phone=".esc_attr($val);
                            } else {
                                $url = "https://wa.me/".esc_attr($val);
                            }
                            $url            = esc_url($url);
                            $mobile_url     = "https://wa.me/".esc_attr($val);
                            $desktop_target = "_blank";
                            $mobile_url     = esc_url($mobile_url);

                            $pre_set_message = $this->sanitize_xss(isset($value['pre_set_message']) ? $this->sanitize_xss($value['pre_set_message']) : "");
                            $pre_set_message = $this->replace_wc_tags($pre_set_message, get_the_ID(), "\n");

                        } else if ($channel_type == "phone") {
                            // setting for Phone
                            $val = $this->cleanStringForNumbers($val);
                            $val = str_replace(" ", "", $val);
                            $url = "tel:".esc_attr($val);
                        } else if ($channel_type == "sms") {
                            // setting for SMS
                            $val = $this->cleanStringForNumbers($val);
                            $val = str_replace("+", "", $val);
                            $val = str_replace(" ", "", $val);
                            $val = str_replace("-", "", $val);
                            $val = "+" . $val;
                            $url = "sms:".esc_attr($val);
                            $pre_set_message      = $this->sanitize_xss(isset($value['sms_pre_set_message']) ? $value['sms_pre_set_message'] : "");

                            $pre_set_message = $this->replace_wc_tags($pre_set_message, get_the_ID(), "\n");

                            if(!empty($pre_set_message)) {
                                $url = "sms://".esc_attr($val).";?&body=".$pre_set_message;
                            }

                        } else if ($channel_type == "telegram") {
                            // setting for Telegram
                            $val            = ltrim($val, "@");
                            $url            = "https://telegram.me/".$val;
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "line" || $channel_type == "google_maps" || $channel_type == "poptin" || $channel_type == "waze") {
                            // setting for Line, Google Map, Link, Poptin, Waze, Custom Link
                            $url            = esc_url($val);
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                        } else if ($channel_type == "link" || $channel_type == "custom_link" || $channel_type == "custom_link_3" || $channel_type == "custom_link_4" || $channel_type == "custom_link_5") {
                            $url      = $val;
                            $is_exist = strpos($val, "javascript");
                            $is_viber = strpos($val, "viber");
                            if ($is_viber !== false) {
                                $url = esc_url($url);
                            } else if ($is_exist === false) {
                                $url = esc_url($val);
                                if ($channel_type == "custom_link" || $channel_type == "link" || $channel_type == "custom_link_3" || $channel_type == "custom_link_4" || $channel_type == "custom_link_5") {
                                    $desktop_target = (isset($value['new_window']) && $value['new_window'] == 0) ? "" : "_blank";
                                    $mobile_target  = (isset($value['new_window']) && $value['new_window'] == 0) ? "" : "_blank";
                                }
                            } else {
                                $url            = "javascript:;";
                                $on_click_fn    = str_replace('"', "'", esc_attr($val));
                                $on_click_fn    = str_replace('`', "'", $on_click_fn);
                                $on_click_fn    = urldecode($on_click_fn);
                                $desktop_target = "";
                                $mobile_target  = "";
                            }
                        } else if ($channel_type == "wechat") {
                            // setting for WeChat
                            $url = "javascript:;";
                            if (!empty($value['title'])) {
                                $value['title'] .= ": ".esc_attr($val);
                            } else {
                                $value['title'] = $this->sanitize_xss($val);
                            }

                            $qr_code = isset($value['qr_code']) ? $value['qr_code'] : "";
                            if (!empty($qr_code)) {
                                $image_data = wp_get_attachment_image_src($qr_code, "full");
                                if (!empty($image_data) && is_array($image_data)) {
                                    $qr_code_image = esc_url($image_data[0]);
                                }
                            }
                        } else if ($channel_type == "viber") {
                            // setting for Viber
                            $val = str_replace("+", "", $val);
                            $val = str_replace(" ", "", $val);
                            $val = str_replace("-", "", $val);
                            if(is_numeric($val) && strlen($val) > 6) {
                                $val = "+" . $val;
                            } else {
                                $viberURL = "viber://pa?chatURI=";
                            }
                            $url = esc_attr($val);
                        } else if ($channel_type == "snapchat") {
                            // setting for SnapChat
                            $val           = ltrim($val, "@");
                            $url            = "https://www.snapchat.com/add/".$val;
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "waze") {
                            // setting for Waze
                            $url = "javascript:;";
                            $value['title'] .= ": ".esc_attr($val);
                        } else if ($channel_type == "vkontakte") {
                            // setting for vkontakte
                            $url            = "https://vk.me/".$val;
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "skype") {
                            // setting for Skype
                            $url = "skype:".esc_attr($val)."?chat";
                        } else if ($channel_type == "email") {
                            // setting for Email
                            $url = "mailto:".esc_attr($val);
                        } else if ($channel_type == "facebook_messenger") {
                            // setting for facebook URL
                            $url = esc_url($val);
                            $url = str_replace("http:", "https:", $url);
                            if (wp_is_mobile()) {
                                $mobile_target = "";
                            } else {
                                $desktop_target = "_blank";
                            }

                            $url = esc_url($url);
                        } else if ($channel_type == "twitter") {
                            // setting for Twitter
                            $url            = "https://twitter.com/".$val;
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                            if($value['bg_color'] == "#1ab2e8") {
                                $value['bg_color'] = "#000000";
                            }
                        } else if ($channel_type == "instagram") {
                            // setting for Instagram Page
                            $val = str_replace(["https://www.instagram.com/", "https://ig.me/m/", "@"], ["","", ""], $val);
                            $url            = "https://www.instagram.com/".esc_attr($val);
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "instagram_dm") {
                            // setting for Instagram DM
                            $val = str_replace(["https://www.instagram.com/", "https://ig.me/m/", "@"], ["","", ""], $val);
                            $url            = "https://ig.me/m/".esc_attr($val);
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "linkedin") {
                            // setting for Linkedin
                            $link_type = !isset($value['link_type']) || $value['link_type'] == "company" ? "company" : "personal";
                            if ($link_type == "personal") {
                                $url = "https://www.linkedin.com/in/".$val;
                            } else {
                                $url = "https://www.linkedin.com/company/".$val;
                            }

                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "slack") {
                            // setting for Slack
                            $url            = esc_url($val);
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "discord") {
                            // setting for Discord
                            $url            = esc_url($val);
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "microsoft_teams") {
                            // setting for Microsoft_Teams
                            $url            = esc_url($val);
                            $desktop_target = "_blank";
                            $mobile_target  = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "tiktok") {
                            $val            = $value['value'];
                            $firstCharacter = substr($val, 0, 1);
                            if ($firstCharacter != "@") {
                                $val = "@".$val;
                            }

                            $url            = esc_url("https://www.tiktok.com/".$val);
                            $desktop_target = $mobile_target = "_blank";
                            $url            = esc_url($url);
                        } else if ($channel_type == "chatway") {
                            $url = "javascript:;";
                            $desktop_target = $mobile_target = "";
                        } //end if

                        if(isset($value['is_agent']) && $value['is_agent'] && count($value['agent_data']) > 1) {
                            if($channel_type == 'instagram' || $channel_type == 'instagram_dm') {
                                foreach ($value['agent_data'] as $agentKey => $agent) {
                                    if(!empty($agent['value'])) {
                                        $value['agent_data'][$agentKey]['value'] = str_replace(["https://www.instagram.com/", "https://ig.me/m/", "@"], ["", "", ""], $agent['value']);
                                        if($channel_type == 'instagram') {
                                            $value['agent_data'][$agentKey]['value'] = "https://www.instagram.com/".esc_attr($value['agent_data'][$agentKey]['value']);
                                        } else if($channel_type == 'instagram_dm') {
                                            $value['agent_data'][$agentKey]['value'] = "https://ig.me/m/".esc_attr($value['agent_data'][$agentKey]['value']);
                                        }
                                    }
                                }
                            }
                        }

                        // Instagram checking for custom color
                        if ($channel_type == "instagram" && $value['bg_color'] == "#ffffff") {
                            $value['bg_color'] = "";
                        }
                        if ($channel_type == "instagram_dm" && $value['bg_color'] == "#ffffff") {
                            $value['bg_color'] = "";
                        }

                        $svg = trim(preg_replace('/\s\s+/', '', $svg_icon));

                        $is_mobile  = isset($value['is_mobile']) ? 1 : 0;
                        $is_desktop = isset($value['is_desktop']) ? 1 : 0;

                        if (empty($mobile_url)) {
                            $mobile_url = $url;
                        }

                        $bg_color  = $this->validate_color($value['bg_color'], $social['color']);
                        $rgb_color = $this->getRGBColor($value['bg_color']);
                        $url       = htmlspecialchars($url);

                        $is_agent        = (isset($value['is_agent']) && $value['is_agent']) ? 1 : 0;
                        $agentData       = [];
                        $valid           = 1;
                        $header_text     = "";
                        $header_sub_text = "";
                        $header_bg_color = "";
                        $header_text_color = "";
                        $is_agent_desktop  = 0;
                        $is_agent_mobile   = 0;
                        if ($is_agent) {
                            $valid      = 0;
                            $agent_data = isset($value['agent_data'])&&is_array($value['agent_data'])&&!empty($value['agent_data']) ? $value['agent_data'] : [];
                            if (!empty($agent_data)) {
                                $is_agent_desktop = isset($value['is_agent_desktop']) && $value['is_agent_desktop'] == "checked" ? 1 : 0;
                                $is_agent_mobile  = isset($value['is_agent_mobile']) && $value['is_agent_mobile'] == "checked" ? 1 : 0;
                                foreach ($agent_data as $key => $agent) {
                                    if ($key != "__count__") {
                                        if (isset($agent['value']) && !empty($agent['value'])) {
                                            $valid = 1;
                                            $image_id = isset($agent['image_id']) ? $agent['image_id'] : 0;
                                            $agent_fa_icon = isset($agent['agent_fa_icon']) ? $agent['agent_fa_icon'] : "";
                                            $svg_icon = $svg;
                                            $agent_image_url = "";
                                            if (!empty($agent_fa_icon)) {
                                                $svg_icon = "<span class='chaty-custom-icon'><i class='" . $this->sanitize_xss($agent_fa_icon) . "'></i></span>";
                                                $this->hasFont = true;
                                            } else if (!empty($image_id)) {
                                                $image_data = wp_get_attachment_image_src($image_id, "full");
                                                if (!empty($image_data) && is_array($image_data)) {
                                                    $agent_image_url = esc_sql($image_data[0]);
                                                }
                                            }

                                            $agentViberURL = "";
                                            $agentValue = $agent['value'];
                                            if ($channel_type == "poptin") {
                                                $agentValue = esc_url($agentValue);
                                            } else if ($channel_type == "line") {
                                                $agentValue = esc_url($agentValue);
                                            } else if ($channel_type == "google_maps") {
                                                $agentValue = esc_url($agentValue);
                                            } else if ($channel_type == "waze") {
                                                $agentValue = esc_url($agentValue);
                                            } else if ($channel_type == "slack") {
                                                $agentValue = esc_url($agentValue);
                                            } else if ($channel_type == "discord") {
                                                $agentValue = esc_url($agentValue);
                                            } else if ($channel_type == "microsoft_teams") {
                                                $agentValue = esc_url($agentValue);
                                            } else if ($channel_type == "viber") {
                                                // setting for Viber
                                                $agentValue = str_replace(["+", " ", "-"], ["","",""], $agentValue);
                                                if(is_numeric($agentValue) && strlen($agentValue) > 6) {
                                                    $agentValue = "+" . $agentValue;
                                                } else {
                                                    $agentViberURL = "viber://pa?chatURI=";
                                                }
                                                $url = esc_attr($val);
                                            } else {
                                                $agentValue = esc_html($agent['value']);
                                            }

                                            if ($channel_type == "twitter") {
                                                if ($agent['agent_bg_color'] == "#1ab2e8") {
                                                    $agent['agent_bg_color'] = "#000000";
                                                }
                                            }

                                            $pre_set_message = "";
                                            $use_whatsapp_web = "";
                                            if ($channel_type == "whatsapp") {
                                                $pre_set_message = esc_attr(isset($agent['pre_set_message']) ? $this->sanitize_xss($agent['pre_set_message']) : "");
                                                $pre_set_message = $this->replace_wc_tags($pre_set_message, get_the_ID(), "\n");
                                                $use_whatsapp_web = esc_attr(isset($agent['use_whatsapp_web'])) ? $this->sanitize_xss($agent['use_whatsapp_web']) : "yes";
                                            }

                                            $agentData[] = [
                                                'value' => $agentValue,
                                                'agent_bg_color'    => $this->validate_color(($this->sanitize_xss(isset($agent['agent_bg_color']) ? $agent['agent_bg_color'] : $social['color'])), $social['color']),
                                                'link_type'         => $this->sanitize_xss(isset($agent['link_type']) ? $agent['link_type'] : 'personal'),
                                                'agent_title'       => $this->sanitize_xss(isset($agent['agent_title']) ? $agent['agent_title'] : $social['title']),
                                                'svg_icon'          => $svg_icon,
                                                'agent_image'       => esc_url($agent_image_url),
                                                'pre_set_message'   => $pre_set_message,
                                                'use_whatsapp_web'  => $use_whatsapp_web,
                                                'viber_url'         => $agentViberURL
                                            ];
                                        }//end if
                                    }
                                }//end foreach

                                if ($valid) {
                                    $qr_code_image  = "";
                                    $mobile_target  = "";
                                    $desktop_target = "";
                                    $url            = "javascript:;";
                                    $val            = "";

                                    $image_id      = isset($value['agent_image_id']) ? $value['agent_image_id'] : 0;
                                    $agent_fa_icon = isset($value['agent_fa_icon']) ? $value['agent_fa_icon'] : "";
                                    if (!empty($agent_fa_icon)) {
                                        $svg           = "<span class='chaty-custom-icon'><i class='".esc_attr($agent_fa_icon)."'></i></span>";
                                        $this->hasFont = true;
                                    } else if (!empty($image_id)) {
                                        $image_data = wp_get_attachment_image_src($image_id, "full");
                                        if (!empty($image_data) && is_array($image_data)) {
                                            $image_url = $image_data[0];
                                        }
                                    }

                                    $value['title']    = $this->sanitize_xss(isset($value['agent_title']) ? $value['agent_title'] : $value['title']);
                                    $header_text       = $this->sanitize_xss(isset($value['agent_header_text']) ? $value['agent_header_text'] : $social['title']);
                                    $header_sub_text   = $this->sanitize_xss(isset($value['agent_sub_header_text']) ? $value['agent_sub_header_text'] : "How can we help?");
                                    $header_text_color = $this->validate_color($this->sanitize_xss(isset($value['agent_head_text_color']) ? $value['agent_head_text_color'] : "#ffffff"), "#ffffff");
                                    $header_bg_color   = $this->validate_color($this->sanitize_xss(isset($value['agent_head_bg_color']) ? $value['agent_head_bg_color'] : $social['color']), $social['color']);
                                    $bg_color          = $this->validate_color($this->sanitize_xss(isset($value['agent_bg_color']) ? $value['agent_bg_color'] : $bg_color), $bg_color);
                                    $rgb_color         = $this->validate_color($this->sanitize_xss($this->getRGBColor($bg_color)), $bg_color);
                                }//end if
                            }//end if
                        }//end if

                        $contact_fields        = [];
                        $contact_form_settings = [];
                        $contact_custom_fields = [];

                        if ($channel_type == "contact_us") {
                            $url            = "javascript:;";
                            $desktop_target = "";
                            $mobile_target  = "";

                            if(isset($value['contact_form_field_order']) && !empty($value['contact_form_field_order'])) {
                                $contactFormFieldOrder = explode(",", $value['contact_form_field_order']);
                            }

                            if(!empty($contactFormFieldOrder)) {
                                foreach($contactFormFieldOrder as $form_slug) {
                                    $form_field = $this->get_field_settings($form_slug, $value);
                                    if($form_slug == "Email" || $form_slug == "email") {
                                        $this->hasEmail = true;
                                    }
                                    if($form_field) {
                                        $contact_fields[] = $form_field;
                                    }
                                }
                            }

                            if (!empty($contact_fields)) {
                                $contact_form_settings = [
                                    "button_text_color"  => $this->validate_color($this->sanitize_xss(isset($value['button_text_color']) ? $value['button_text_color'] : "#ffffff"), "#ffffff"),
                                    "button_bg_color"    => $this->validate_color($this->sanitize_xss(isset($value['button_bg_color']) ? $value['button_bg_color'] : "#A886CD"),"#A886CD"),
                                    "button_text"        => $this->sanitize_xss(isset($value['button_text']) ? $value['button_text'] : "Chat"),
                                    "contact_form_title" => $this->sanitize_xss(isset($value['contact_form_title']) ? $value['contact_form_title'] : "Contact Us"),
                                    "contact_form_field_order" => $contactFormFieldOrder
                                ];
                            } else {
                                $valid = false;
                            }

                            if(isset($value['enable_recaptcha']) && $value['enable_recaptcha'] == "yes") {
                                if(isset($value['captcha_type']) && $value['captcha_type'] == "v2" && !empty($value['v2_site_key'])) {
                                    $recaptchaV2SiteKey = $this->sanitize_xss($value['v2_site_key']);
                                    $enableRecaptcha = 1;
                                }else if(isset($value['captcha_type']) && $value['captcha_type'] == "v3" && !empty($value['v3_site_key'])) {
                                    $recaptchaV3SiteKey = $this->sanitize_xss($value['v3_site_key']);
                                    $enableRecaptcha = 1;
                                }
                            }

                        }//end if

                        $hideRecaptchaBadge = "no";
                        if(isset($value['hide_recaptcha_badge'])) {
                            $hideRecaptchaBadge = $value['hide_recaptcha_badge'];
                        }

                        if ($valid) {

                            $is_default_open        = $this->sanitize_xss((isset($value['is_default_open'])&&$value['is_default_open'] == "yes") ? 1 : 0);
                            $has_welcome_message    = $this->sanitize_xss((isset($value['embedded_window'])&&$value['embedded_window'] == "yes") ? 1 : 0);
                            $has_emoji_picker       = $this->sanitize_xss((!isset($value['emoji_picker']) || $value['emoji_picker'] == "yes") ? 1 : 0);
                            $input_placeholder      = $this->sanitize_xss(isset($value['input_placeholder'])?$value['input_placeholder']:esc_html__("Write your message...","chaty"));
                            $embedded_message       = isset($value['embedded_message']) ? $value['embedded_message'] : "";
                            $channel_account_type   = $this->sanitize_xss(isset($value['link_type']) ? $value['link_type'] : "personal");
                            $mail_subject           = $this->sanitize_xss(isset($value['mail_subject']) ? $value['mail_subject'] : "");
                            $is_use_web_version     = $this->sanitize_xss((isset($value['use_whatsapp_web']) && $value['use_whatsapp_web'] == "no") ? 0 : 1);
                            $is_open_new_tab        = $this->sanitize_xss((isset($value['is_open_new_tab']) && $value['is_open_new_tab'] == 0) ? 0 : 1);
                            $channel_type           = $this->sanitize_xss(isset($value['channel_type']) && !empty($value['channel_type']) ? $value['channel_type'] : $social['slug']);
                            $wp_popup_headline      = $this->sanitize_xss((isset($value['wp_popup_headline']) && !empty($value['wp_popup_headline'])) ? $value['wp_popup_headline'] : '');
                            $wp_popup_head_bg_color = $this->validate_color($this->sanitize_xss((isset($value['wp_popup_head_bg_color']) && !empty($value['wp_popup_head_bg_color'])) ? $value['wp_popup_head_bg_color'] : '#4AA485'), '#4AA485');
                            $wp_popup_nickname      = $this->sanitize_xss((isset($value['wp_popup_nickname']) && !empty($value['wp_popup_nickname'])) ? $value['wp_popup_nickname'] : '');
                            $wp_popup_profile       = $this->sanitize_xss((isset($value['wp_popup_profile']) && !empty($value['wp_popup_profile'])) ? $value['wp_popup_profile'] : '');

                            if($has_welcome_message && $has_emoji_picker) {
                                $this->hasEmoji = true;
                            }

                            $widget_token = wp_create_nonce("chaty_widget_nonce".$index);

                            $agent_fa_icon = isset($value['fa_icon']) ? $value['fa_icon'] : "";
                            if (!empty($agent_fa_icon)) {
                                $svg           = "<span class='chaty-custom-channel-icon'><i class='".esc_attr($agent_fa_icon)."'></i></span>";
                                $this->hasFont = true;
                            }

                            $allowedHTML = [
                                'a'      => [
                                    'href'  => [],
                                    'title' => [],
                                ],
                                'br'     => [],
                                'b'      => [],
                                'a'      => [
                                    "href"   => [],
                                    "target" => [],
                                ],
                                'strong' => [],
                                'em'     => [],
                                'span'   => [
                                    "style" => [],
                                ],
                                'i'      => [],
                                'p'      => [],
                            ];

                            $embedded_message = wp_kses($embedded_message, $allowedHTML);

                            $data  = [
                                "channel"               => $this->sanitize_xss($social['slug']),
                                "value"                 => $this->sanitize_xss(wp_unslash($val)),
                                "hover_text"            => $this->sanitize_xss(wp_unslash($value['title'])),
                                "chatway_position"      => $this->sanitize_xss(wp_unslash($value['chatway_position'])),
                                "svg_icon"              => $svg,
                                "is_desktop"            => $is_desktop,
                                "is_mobile"             => $is_mobile,
                                "icon_color"            => $this->sanitize_xss($bg_color),
                                "icon_rgb_color"        => $this->sanitize_xss($rgb_color),
                                "channel_type"          => $this->sanitize_xss($channel_type),
                                "custom_image_url"      => esc_url($image_url),
                                "order"                 => "",
                                "pre_set_message"       => $this->sanitize_xss($pre_set_message),
                                "is_use_web_version"    => $this->sanitize_xss($is_use_web_version),
                                "is_open_new_tab"       => $this->sanitize_xss($is_open_new_tab),
                                "is_default_open"       => $this->sanitize_xss($is_default_open),
                                "has_welcome_message"   => $this->sanitize_xss($has_welcome_message),
                                "emoji_picker"          => $this->sanitize_xss($has_emoji_picker),
                                "input_placeholder"     => $this->sanitize_xss($input_placeholder),
                                "chat_welcome_message"  => $embedded_message,
                                "wp_popup_headline"     => $wp_popup_headline,
                                "wp_popup_nickname"     => $wp_popup_nickname,
                                "wp_popup_profile"      => $wp_popup_profile,
                                "wp_popup_head_bg_color"      => $wp_popup_head_bg_color,
                                "qr_code_image_url"     => esc_url($qr_code_image),
                                "mail_subject"          => $this->sanitize_xss($mail_subject),
                                "channel_account_type"  => $this->sanitize_xss($channel_account_type),
                                "contact_form_settings" => $contact_form_settings,
                                "contact_fields"        => $contact_fields,
                                "contact_custom_fields" => $contact_custom_fields,
                                "url"                   => $url,
                                "mobile_target"         => $this->sanitize_xss($mobile_target),
                                "desktop_target"        => $this->sanitize_xss($desktop_target),
                                "target"                => $this->sanitize_xss($desktop_target),
                                "is_agent"              => $this->sanitize_xss($is_agent),
                                "agent_data"            => $agentData,
                                "header_text"           => $this->sanitize_xss($header_text),
                                "header_sub_text"       => $this->sanitize_xss($header_sub_text),
                                "header_bg_color"       => $this->sanitize_xss($header_bg_color),
                                "header_text_color"     => $this->sanitize_xss($header_text_color),
                                "widget_token"          => $this->sanitize_xss($widget_token),
                                "widget_index"          => $this->sanitize_xss($index),
                                "click_event"           => $on_click_fn,
                                "is_agent_desktop"      => $this->sanitize_xss($is_agent_desktop),
                                "is_agent_mobile"       => $this->sanitize_xss($is_agent_mobile),
                                "v2_site_key"           => $this->sanitize_xss($recaptchaV2SiteKey),
                                "v3_site_key"           => $this->sanitize_xss($recaptchaV3SiteKey),
                                "enable_recaptcha"      => $this->sanitize_xss($enableRecaptcha),
                                "hide_recaptcha_badge"  => $this->sanitize_xss($hideRecaptchaBadge),
                                'viber_url'             => $this->sanitize_xss($viberURL)
                            ];

                            if($channel_type == "WeChat") {
                                if(!empty($qr_code_image)) {
                                    $data['wechat_header']          = $this->sanitize_xss(isset($value['wechat_header'])?esc_attr($value['wechat_header']):esc_html__("WeChat ID", "chaty"));
                                    $data['wechat_header_color']    = $this->validate_color($this->sanitize_xss(isset($value['wechat_header_color'])?esc_attr($value['wechat_header_color']):"#A886CD"), "#A886CD");
                                    $data['wechat_qr_code_title']   = $this->sanitize_xss(isset($value['wechat_qr_code_title'])?esc_attr($value['wechat_qr_code_title']):esc_html__("Scan QR Code", "chaty"));
                                }
                            } else if($channel_type == "Contact_Us") {
                                $data['contact_form_settings']['title_bg_color'] = $this->validate_color($this->sanitize_xss(isset($value['contact_form_title_bg_color'])?esc_attr($value['contact_form_title_bg_color']):"#A886CD"), "#A886CD");
                            }
                            $arr[] = $data;
                        }//end if
                    }//end if
                }//end if
            endforeach;
        endforeach;
        return $arr;

    }//end get_social_icon_list()


    function get_field_settings($slug, $settings)
    {
        $slug = is_numeric($slug)?$slug:strtolower($slug);
        if(isset($settings[$slug]) && $settings[$slug]['is_active'] == "yes") {
            $field_setting = $settings[$slug];
            $default = [
                'name' => [
                    'title' => esc_attr__('Name', 'chaty'),
                    'placeholder' => esc_attr__('Enter your name', 'chaty'),
                    'type' => 'text'
                ],
                'email' => [
                    'title' => esc_attr__('Email', 'chaty'),
                    'placeholder' => esc_attr__('Enter your email', 'chaty'),
                    'type' => 'email'
                ],
                'phone' => [
                    'title' => esc_attr__('Phone', 'chaty'),
                    'placeholder' => esc_attr__('Enter your phone', 'chaty'),
                    'type' => 'tel'
                ],
                'message' => [
                    'title' => esc_attr__('Message', 'chaty'),
                    'placeholder' => esc_attr__('Enter your message', 'chaty'),
                    'type' => 'textarea'
                ]
            ];
            return [
                "is_custom"   => 0,
                "field"       => $slug,
                "title"       => isset($field_setting['field_label'])? $this->sanitize_xss($field_setting['field_label']) : $default[$slug]['title'],
                "is_required" => (isset($field_setting['is_required']) && $field_setting['is_required'] == "yes") ? 1 : 0,
                "placeholder" => isset($field_setting['placeholder']) ? $this->sanitize_xss($field_setting['placeholder']) : $default[$slug]['placeholder'],
                "type"        => $default[$slug]['type'],
            ];
        } elseif (isset($settings['custom_fields'])) {
            return $this->get_custom_fields($slug, $settings['custom_fields']);
        }
        return false;
    }

    function get_custom_fields($slug, $fields) {
        foreach($fields as $field) {
            if($field['unique_id'] == $slug) {
                if($field['is_active'] == "yes") {
                    $field['is_custom']   = 1;
                    $field['is_required'] = ($field['is_required'] == "yes")?1:0;
                    $field['field'] = $field['unique_id'];
                    $field['title'] = $field['field_label'];
                    $field['type'] = $field['field_dropdown'];
                    return $field;
                }
            }
        }
        return false;
    }


    // add widget to fron end
    public function insert_widget()
    {

    }//end insert_widget()


    public function getRGBColor($color)
    {
        if (!empty($color)) {
            if (strpos($color, '#') !== false) {
                $color = $this->hex2rgba($color);
            }

            if (strpos($color, 'rgba(') !== false || strpos($color, 'rgb(') !== false) {
                $color   = explode(",", $color);
                $color   = str_replace(["rgba(", "rgb(", ")"], ["", "", ""], $color);
                $string  = "";
                $string .= ((isset($color[0])) ? trim($color[0]) : "0").",";
                $string .= ((isset($color[1])) ? trim($color[1]) : "0").",";
                $string .= ((isset($color[2])) ? trim($color[2]) : "0");
                return $string;
            }
        }

        return "0,0,0";

    }//end getRGBColor()


    public function hex2rgba($color, $opacity=false)
    {

        $default = 'rgb(0,0,0)';

        // Return default if no color provided
        if (empty($color)) {
            return $default;
        }

        // Sanitize $color if "#" is provided
        if ($color[0] == '#') {
            $color = substr($color, 1);
        }

        // Check if color has 6 or 3 characters and get values
        if (strlen($color) == 6) {
            $hex = [
                $color[0].$color[1],
                $color[2].$color[3],
                $color[4].$color[5],
            ];
        } else if (strlen($color) == 3) {
            $hex = [
                $color[0].$color[0],
                $color[1].$color[1],
                $color[2].$color[2],
            ];
        } else {
            return $default;
        }

        // Convert hexadec to rgb
        $rgb = array_map('hexdec', $hex);

        // Check if opacity is set(rgba or rgb)
        if ($opacity) {
            if (abs($opacity) > 1) {
                $opacity = 1.0;
            }

            $output = 'rgba('.implode(",", $rgb).','.$opacity.')';
        } else {
            $output = 'rgb('.implode(",", $rgb).')';
        }

        // Return rgb(a) color string
        return $output;

    }//end hex2rgba()


    function cleanStringForNumbers($string) {
        if(!empty($string)) {
            $string = trim($string);
            $hasPlus = 0;
            if(isset($string[0]) && $string[0] == "+") {
                $hasPlus = 1;
            }
            $string = str_replace("-", "", $string);
            $string = preg_replace('/[^0-9\-]/', '', $string); // Removes special chars.
            if ($hasPlus) {
                return "+" . $string;
            }
        }
        return $string;
    }


    public function check_for_url($index="")
    {
        if (empty($index)) {
            $index = $this->widget_number;
        }

        $page_options = get_option("cht_page_settings".$index);
        $or_flag      = 1;

        global $sitepress;
        $isWPMLActive = $sitepress !== null && get_class($sitepress) === "SitePress";
        if($isWPMLActive) {
            $wpmlSettings = get_option("icl_sitepress_settings");
            if(isset($wpmlSettings['language_negotiation_type']) && $wpmlSettings['language_negotiation_type'] == 2) {
                $widget_language = get_option("cht_widget_language".$index);
                if(!empty($widget_language)) {
                    $lang = $sitepress->get_current_language();
                    if($widget_language != $lang) {
                        return false;
                    }
                }
            }
        }
        // for page Rule contain
        // checking for page visibility settings
        if (!empty($page_options) && is_array($page_options)) {
            $server = $_SERVER;

            $link = "";
            parse_str( wp_parse_url( $link, PHP_URL_QUERY), $array );
            if(!empty($array)) {
                if(isset($array['nowprocket']) && isset($array['no_optimize'])) {
                    unset($array['nowprocket']);
                    unset($array['no_optimize']);
                }
                $requestURI = $server['REQUEST_URI'];
                if(strpos($requestURI, "?")) {
                    $link = (isset($server['HTTPS']) && $server['HTTPS'] === 'on' ? "https" : "http")."://".$server['HTTP_HOST'].strtok($_SERVER["REQUEST_URI"], '?');
                }
                if(!empty($array)) {
                    $link .= "?".http_build_query($array);
                }
            }

            if(empty($link)) {
                $link = (isset($server['HTTPS']) && $server['HTTPS'] === 'on' ? "https" : "http") . "://" . $server['HTTP_HOST'] . $server['REQUEST_URI'];
            }
            $site_url     = site_url("/");
            $request_url  = substr($link, strlen($site_url));
            $url          = trim($request_url, "/");
            $url          = urldecode(strtolower($url));
            $or_flag      = 0;
            $total_option = count($page_options);
            $options      = 0;
            $emptyRules   = 0;


            // checking for each page options

            foreach ($page_options as $option) {
                $key   = isset($option['option'])?$option['option']:"";
                $value = trim(strtolower($option['value']));

                if (strpos($value, site_url()) !== false) {
                    if (strpos($value, site_url()) === 0) {
                        $length = strlen(site_url("/"));
                        $value  = substr($value, $length);
                        $value  = trim($value, "/");
                    }
                }

                if(!empty($url)) {
                    $url = str_replace("/?", "?", $url);
                }
                if(!empty($value)) {
                    $value = str_replace("/?", "?", $value);
                }

                if ($key != '') {
                    if ($option['shown_on'] == "show_on") {
                        $value = trim($value, "/");
                        if ($key == "home") {
                            if (is_home() || is_front_page()) {
                                $or_flag = 1;
                            }
                        } else {
                            if ($key == "wp_pages") {
                                $value = isset($option['page_ids'])?$option['page_ids']:[];
                            } else if ($key == "wp_posts") {
                                $value = isset($option['post_ids'])?$option['post_ids']:[];
                            } else if ($key == "wp_tags") {
                                $value = isset($option['tag_ids'])?$option['tag_ids']:[];
                            } else if ($key == "wp_categories") {
                                $value = isset($option['category_ids'])?$option['category_ids']:[];
                            } else if ($key == "wc_products") {
                                $value = isset($option['products_ids'])?$option['products_ids']:[];
                            } else if ($key == "wc_products_on_sale") {
                                $value = isset($option['wc_products_ids'])?$option['wc_products_ids']:[];
                            }
                            if (!empty($value)) {
                                switch ($key) {
                                    case 'wp_pages':
                                        if(get_post_type() === 'page') {
                                            $pageId = get_the_ID();
                                            if(in_array("all-items", $value) || in_array($pageId, $value)) {
                                                $or_flag = 1;
                                            }
                                        }
                                        break;
                                    case 'wp_posts':
                                        if(is_single() && get_post_type() === 'post') {
                                            $pageId = get_the_ID();
                                            if(in_array("all-items", $value) || in_array($pageId, $value)) {
                                                $or_flag = 1;
                                            }
                                        }
                                        break;
                                    case 'wc_products':
                                        if(is_single() && get_post_type() === 'product') {
                                            $pageId = get_the_ID();
                                            if(in_array("all-items", $value) || in_array($pageId, $value)) {
                                                $or_flag = 1;
                                            }
                                        }
                                        break;
                                    case 'wc_products_on_sale':
                                        if(is_single() && get_post_type() === 'product' && class_exists("WC_Product")) {
                                            $product_id = get_the_ID();
                                            $product = new \WC_Product( $product_id );
                                            if ((in_array("all-items", $value) && $product->is_on_sale()) || (in_array($product_id, $value) && $product->is_on_sale())) {
                                                $or_flag = 1;
                                            }
                                        }
                                        break;
                                    case 'wp_categories':
                                        if(is_category()) {
                                            $catId = get_query_var('cat');
                                            if(in_array("all-items", $value) || in_array($catId, $value)) {
                                                $or_flag = 1;
                                            }
                                        } else {
                                            if(in_array("all-items", $value) && is_single() && get_post_type() === 'post') {
                                                $pageId = get_the_ID();
                                                $categories = get_the_category($pageId);
                                                if(!empty($categories)) {
                                                    $or_flag = 1;
                                                }
                                            } else if(is_single() && get_post_type() === 'post') {
                                                $pageId = get_the_ID();
                                                $categories = get_the_category($pageId);
                                                if(!empty($categories)) {
                                                    foreach($categories as $category) {
                                                        if(in_array($category->term_id, $value)) {
                                                            $or_flag = 1;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        break;
                                    case 'wp_tags':
                                        if(is_tag()) {
                                            $tagId = get_queried_object()->term_id;
                                            if(in_array("all-items", $value) || ($tagId && in_array($tagId, $value))) {
                                                $or_flag = 1;
                                            }
                                        } else {
                                            if(in_array("all-items", $value) && is_single() && get_post_type() === 'post') {
                                                $pageId = get_the_ID();
                                                $categories = get_the_tags($pageId);
                                                if(!empty($categories)) {
                                                    $or_flag = 1;
                                                }
                                            } else if(is_single() && get_post_type() === 'post') {
                                                $pageId = get_the_ID();
                                                $categories = get_the_tags($pageId);
                                                if(!empty($categories)) {
                                                    foreach($categories as $category) {
                                                        if(in_array($category->term_id, $value)) {
                                                            $or_flag = 1;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        break;
                                    case 'page_contains':
                                        $index = strpos($url, $value);
                                        if ($index !== false) {
                                            $or_flag = 1;
                                        }
                                        break;
                                    case 'page_has_url':
                                        if ($url === $value) {
                                            $or_flag = 1;
                                        }
                                        break;
                                    case 'page_start_with':
                                        $length = strlen($value);
                                        $result = substr($url, 0, $length);
                                        if ($result == $value) {
                                            $or_flag = 1;
                                        }
                                        break;
                                    case 'page_end_with':
                                        $length = strlen($value);
                                        $result = substr($url, ((-1) * $length));
                                        if ($result == $value) {
                                            $or_flag = 1;
                                        }
                                        break;
                                }//end switch
                            } else {
                                if ($key == 'page_has_url') {
                                    if ($request_url == "") {
                                        $or_flag = 1;
                                    }
                                }
                            }//end if
                        }//end if
                    } else {
                        $options++;
                    }//end if
                } else {
                    $emptyRules++;
                }
            }//end foreach

            if ($total_option == $options || $total_option == $emptyRules) {
                $or_flag = 1;
            }

            foreach ($page_options as $option) {
                $key   = isset($option['option'])?$option['option']:"";
                $value = trim(strtolower($option['value']));

                if (strpos($value, site_url()) !== false) {
                    if (strpos($value, site_url()) === 0) {
                        $length = strlen(site_url("/"));
                        $value  = substr($value, $length);
                        $value  = trim($value, "/");
                    }
                }

                if(!empty($url)) {
                    $url = str_replace("/?", "?", $url);
                }
                if(!empty($value)) {
                    $value = str_replace("/?", "?", $value);
                }

                if ($key != '' && $option['shown_on'] == "not_show_on") {
                    $value = trim($value, "/");
                    if ($key == "home") {
                        if (is_home() || is_front_page()) {
                            $or_flag = 0;
                        }
                    } else {
                        if ($key == "wp_pages") {
                            $value = isset($option['page_ids'])?$option['page_ids']:[];
                        } else if ($key == "wp_posts") {
                            $value = isset($option['post_ids'])?$option['post_ids']:[];
                        } else if ($key == "wp_tags") {
                            $value = isset($option['tag_ids'])?$option['tag_ids']:[];
                        } else if ($key == "wp_categories") {
                            $value = isset($option['category_ids'])?$option['category_ids']:[];
                        } else if ($key == "wc_products") {
                            $value = isset($option['products_ids'])?$option['products_ids']:[];
                        } else if ($key == "wc_products_on_sale") {
                            $value = isset($option['wc_products_ids'])?$option['wc_products_ids']:[];
                        }
                        if (!empty($value)) {
                            switch ($key) {
                                case 'wp_pages':
                                    if(get_post_type() === 'page') {
                                        $pageId = get_the_ID();
                                        if(in_array("all-items", $value) || in_array($pageId, $value)) {
                                            $or_flag = 0;
                                        }
                                    }
                                    break;
                                case 'wp_posts':
                                    if(is_single() && get_post_type() === 'post') {
                                        $pageId = get_the_ID();
                                        if(in_array("all-items", $value) || in_array($pageId, $value)) {
                                            $or_flag = 0;
                                        }
                                    }
                                    break;
                                case 'wc_products':
                                    if(is_single() && get_post_type() === 'product') {
                                        $pageId = get_the_ID();
                                        if(in_array("all-items", $value) || in_array($pageId, $value)) {
                                            $or_flag = 0;
                                        }
                                    }
                                    break;
                                case 'wc_products_on_sale':
                                    if(is_single() && get_post_type() === 'product' && class_exists("WC_Product")) {
                                        $product_id = get_the_ID();
                                        $product = new \WC_Product( $product_id );
                                        if ((in_array("all-items", $value) && $product->is_on_sale()) || (in_array($product_id, $value) && $product->is_on_sale())) {
                                            $or_flag = 0;
                                        }
                                    }
                                    break;
                                case 'wp_categories':
                                    if(is_category()) {
                                        $catId = get_query_var('cat');
                                        if(in_array("all-items", $value) || in_array($catId, $value)) {
                                            $or_flag = 0;
                                        }
                                    } else {
                                        if(in_array("all-items", $value) && is_single() && get_post_type() === 'post') {
                                            $pageId = get_the_ID();
                                            $categories = get_the_category($pageId);
                                            if(!empty($categories)) {
                                                $or_flag = 0;
                                            }
                                        } else if(is_single() && get_post_type() === 'post') {
                                            $pageId = get_the_ID();
                                            $categories = get_the_category($pageId);
                                            if(!empty($categories)) {
                                                foreach($categories as $category) {
                                                    if(in_array($category->term_id, $value)) {
                                                        $or_flag = 0    ;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    break;
                                case 'wp_tags':
                                    if(is_tag()) {
                                        $tagId = get_queried_object()->term_id;
                                        if(in_array("all-items", $value) || ($tagId && in_array($tagId, $value))) {
                                            $or_flag = 0;
                                        }
                                    } else {
                                        if(in_array("all-items", $value) && is_single() && get_post_type() === 'post') {
                                            $pageId = get_the_ID();
                                            $categories = get_the_tags($pageId);
                                            if(!empty($categories)) {
                                                $or_flag = 0;
                                            }
                                        } else if(is_single() && get_post_type() === 'post') {
                                            $pageId = get_the_ID();
                                            $categories = get_the_tags($pageId);
                                            if(!empty($categories)) {
                                                foreach($categories as $category) {
                                                    if(in_array($category->term_id, $value)) {
                                                        $or_flag = 0;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    break;
                                case 'page_contains':
                                    $index = strpos($url, $value);
                                    if ($index !== false) {
                                        $or_flag = 0;
                                    }
                                    break;
                                case 'page_has_url':
                                    if ($url === $value) {
                                        $or_flag = 0;
                                    }
                                    break;
                                case 'page_start_with':
                                    $length = strlen($value);
                                    $result = substr($url, 0, $length);
                                    if ($result == $value) {
                                        $or_flag = 0;
                                    }
                                    break;
                                case 'page_end_with':
                                    $length = strlen($value);
                                    $result = substr($url, ((-1) * $length));
                                    if ($result == $value) {
                                        $or_flag = 0;
                                    }
                                    break;
                            }//end switch
                        } else {
                            if ($key == 'page_has_url') {
                                if ($request_url == "") {
                                    $or_flag = 0;
                                }
                            }
                        }//end if
                    }//end if
                }//end if
            }//end foreach
        }//end if
        return $or_flag;

    }//end check_for_url()


    public function get_widget_settings($index="")
    {
        $is_traffic_source = $this->getVisitorTrafficSource($index);
        if (get_option('cht_active'.$index) && $is_traffic_source) {

            $allowedHTML = [
                'a'      => [
                    'href'  => [],
                    'title' => [],
                ],
                'b'      => [],
                'strong' => [],
                'em'     => [],
                'span'   => [
                    "style" => [],
                ],
                'i'      => [],
                'p'      => [],
            ];

            $page_status = $this->check_for_url($index);
            if ($page_status) {
                $social     = $this->get_social_icon_list($index);
                $cht_active = get_option("cht_active".$index);

                $len = count($social);

                if ($len >= 1 && !empty($social)) {
                    $def_color    = get_option('cht_color'.$index);
                    $custom_color = get_option('cht_custom_color'.$index);
                    // checking for custom color
                    if (!empty($custom_color)) {
                        $color = $custom_color;
                        delete_option('cht_custom_color'.$index);
                        update_option('cht_color'.$index, $color);
                    } else {
                        $color = $def_color;
                    }

                    $bg_color = strtoupper($color);

                    $icon_color = get_option('cht_icon_color'.$index);
                    if(empty($icon_color)) {
                        $icon_color = "#ffffff";
                    }

                    // get total active channels
                    $cta = nl2br(get_option('cht_cta'.$index));
                    $cta = str_replace("&amp;#39;", "'", $cta);
                    $cta = str_replace("&#39;", "'", $cta);
                    $cta = esc_attr(wp_unslash($cta));
                    $cta = html_entity_decode($cta);

                    $isPro = get_option('cht_token');
                    // is PRO version
                    $isPro = (empty($isPro) || $isPro == null) ? 0 : 1;

                    $positionSide = get_option('positionSide'.$index);
                    // get widget position
                    $cht_bottom_spacing = get_option('cht_bottom_spacing'.$index);
                    // get widget position from bottom
                    $cht_side_spacing = get_option('cht_side_spacing'.$index);
                    // get widget position from left/Right
                    $cht_widget_size = get_option('cht_widget_size'.$index);
                    // get widget size
                    $positionSide = empty($positionSide) ? 'right' : $positionSide;
                    // Initialize widget position if not exists
                    $cht_side_spacing = ($cht_side_spacing) ? $cht_side_spacing : '25';
                    // Initialize widget from left/Right if not exists
                    $cht_widget_size = ($cht_widget_size) ? $cht_widget_size : '54';
                    // Initialize widget size if not exists
                    $position = get_option('cht_position'.$index);
                    $position = ($position) ? $position : 'right';
                    // Initialize widget position if not exists
                    $total = ($cht_side_spacing + $cht_widget_size + $cht_side_spacing);
                    $cht_bottom_spacing = ($cht_bottom_spacing) ? $cht_bottom_spacing : '25';
                    // Initialize widget bottom position if not exists
                    $cht_side_spacing = ($cht_side_spacing) ? $cht_side_spacing : '25';
                    // Initialize widget left/Right position if not exists
                    $image_id = "";
                    $imageUrl = plugin_dir_url("")."chaty-pro/admin/assets/images/chaty-default.png";
                    // Initialize default image
                    $analytics = get_option("cht_google_analytics".$index);
                    // check for google analytics enable or not
                    $analytics = empty($analytics) ? 0 : $analytics;
                    // Initialize google analytics flag to 0 if not data not exists
                    $text = get_option("cht_close_button_text".$index);
                    // close button settings
                    $close_text = ($text === false) ? "Hide" : $text;

                    $blurEffect = get_option("cht_bg_blur_effect".$index);
                    // check for background blur effect enable or not
                    $blurEffect = empty($blurEffect) ? 0 : $blurEffect;
                    // Initialize background blur effect flag to 0 if not data not exists

                    if ($image_id != "") {
                        $image_data = wp_get_attachment_image_src($image_id, "full");
                        if (!empty($image_data) && is_array($image_data)) {
                            $imageUrl = $image_data[0];
                        }
                    }

                    $font_family = get_option('cht_widget_font'.$index);
                    // add inline css for custom position
                    if ($position != "custom") {
                        $positionSide       = $position;
                        $cht_bottom_spacing = 25;
                        $cht_side_spacing   = 25;
                    } else {
                        $position = $positionSide;
                    }

                    $animation_class = get_option("chaty_attention_effect".$index);
                    $animation_class = empty($animation_class) ? "" : $animation_class;

                    $time_trigger = get_option("chaty_trigger_on_time".$index);
                    $time_trigger = empty($time_trigger) ? "no" : $time_trigger;

                    $trigger_time = get_option("chaty_trigger_time".$index);
                    $trigger_time = (empty($trigger_time) || !is_numeric($trigger_time) || $trigger_time < 0) ? 0 : $trigger_time;
                    if (empty($trigger_time)) {
                        $trigger_time = 0;
                    }

                    $hide_widget = "no";
                    $hide_time   = 0;

                    $exit_intent = get_option("chaty_trigger_on_exit".$index);
                    $exit_intent = empty($exit_intent) ? "no" : $exit_intent;

                    $on_page_scroll = get_option("chaty_trigger_on_scroll".$index);
                    $on_page_scroll = empty($on_page_scroll) ? "no" : $on_page_scroll;

                    $page_scroll = get_option("chaty_trigger_on_page_scroll".$index);
                    $page_scroll = (empty($page_scroll) || !is_numeric($page_scroll) || $page_scroll < 0) ? 0 : $page_scroll;
                    if (empty($page_scroll)) {
                        $on_page_scroll = "no";
                    }

                    $state = get_option("chaty_default_state".$index);
                    $state = empty($state) ? "click" : $state;

                    $mode = get_option("chaty_icons_view".$index);
                    $mode = empty($mode) ? "vertical" : $mode;

                    $has_close_button = get_option("cht_close_button".$index);
                    $has_close_button = empty($has_close_button) ? "yes" : $has_close_button;

                    $countries = get_option("chaty_countries_list".$index);
                    $countries = ($countries === false || empty($countries) || !is_array($countries)) ? [] : $countries;
                    if (count($countries) == 240) {
                        $countries = [];
                    }

                    $display_days  = get_option("cht_date_and_time_settings".$index);
                    $display_rules = [];

                    $gmt = "";
                    if (!empty($display_days)) {
                        $count = 0;
                        foreach ($display_days as $key => $value) {
                            if ($count == 0) {
                                if (isset($value['gmt']) && !empty($value['gmt'])) {
                                    if (is_numeric($value['gmt'])) {
                                        if ($value['gmt'] == 0) {
                                            $difference = "UTC";
                                        } else if ($value['gmt'] > 0) {
                                            $difference = "+".trim($value['gmt'], "+");
                                        } else {
                                            $difference = $value['gmt'];
                                        }
                                    } else {
                                        $difference = $value['gmt'];
                                    }

                                    $gmt = $difference;
                                } else {
                                    $gmt = "UTC";
                                }

                                $count++;
                            }//end if

                            if ($value['end_time'] == "00:00") {
                                $value['end_time'] = "23:59:59";
                            }

                            $start_time = $value['start_time'];
                            $end_time   = $value['end_time'];
                            $start_time = gmdate("H:i", strtotime(gmdate("Y-m-d ".$start_time)));
                            $end_time   = gmdate("H:i", strtotime(gmdate("Y-m-d ".$end_time)));
                            if ($end_time >= $start_time) {
                                $record         = [];
                                $record['days'] = ($value['days'] - 1);
                                $record['start_time']  = $value['start_time'];
                                $record['start_hours'] = intval(gmdate("G", strtotime(gmdate("Y-m-d ".$value['start_time']))));
                                $record['start_min']   = intval(gmdate("i", strtotime(gmdate("Y-m-d ".$value['start_time']))));
                                $record['end_time']    = $value['end_time'];
                                $record['end_hours']   = intval(gmdate("G", strtotime(gmdate("Y-m-d ".$value['end_time']))));
                                $record['end_min']     = intval(gmdate("i", strtotime(gmdate("Y-m-d ".$value['end_time']))));
                                $display_rules[]       = $record;
                            } else {
                                $record         = [];
                                $record['days'] = ($value['days'] - 1);
                                $record['start_time']  = $value['start_time'];
                                $record['start_hours'] = intval(gmdate("G", strtotime(gmdate("Y-m-d ".$value['start_time']))));
                                $record['start_min']   = intval(gmdate("i", strtotime(gmdate("Y-m-d ".$value['start_time']))));
                                $record['end_time']    = "23:59";
                                $record['end_hours']   = 23;
                                $record['end_min']     = 59;
                                $display_rules[]       = $record;
                                $record = [];
                                if ($value['days'] >= 1 && $value['days'] <= 6) {
                                    $value['days'] = ($value['days'] + 1);
                                } else if ($value['days'] == 7) {
                                    $value['days'] = 1;
                                }

                                $record['days']        = ($value['days'] - 1);
                                $record['start_time']  = "00:00";
                                $record['start_hours'] = intval(gmdate("G", strtotime(gmdate("Y-m-d 00:00"))));
                                $record['start_min']   = intval(gmdate("i", strtotime(gmdate("Y-m-d 00:00"))));
                                $record['end_time']    = $value['end_time'];
                                $record['end_hours']   = intval(gmdate("G", strtotime(gmdate("Y-m-d ".$value['end_time']))));
                                $record['end_min']     = intval(gmdate("i", strtotime(gmdate("Y-m-d ".$value['end_time']))));
                                $display_rules[]       = $record;
                            }//end if
                        }//end foreach
                    }//end if

                    $display_conditions = 0;
                    if (!empty($display_rules)) {
                        $display_conditions = 1;
                    }

                    // checking for date and time
                    $cht_date_rules = get_option("cht_date_rules".$index);
                    $date_status    = 0;
                    $start_date     = "";
                    $end_date       = "";
                    $time_diff      = 0;
                    if (isset($cht_date_rules['status']) && $cht_date_rules['status'] == "yes") {
                        $start_date = isset($cht_date_rules['start_date']) ? $cht_date_rules['start_date'] : "";
                        $end_date   = isset($cht_date_rules['end_date']) ? $cht_date_rules['end_date'] : "";
                        $start_time = isset($cht_date_rules['start_time']) ? $cht_date_rules['start_time'] : "";
                        $end_time   = isset($cht_date_rules['end_time']) ? $cht_date_rules['end_time'] : "";
                        if (!empty($start_date)) {
                            $start_date = $this->getYMDDate($start_date);
                            if (!empty($start_time)) {
                                $start_date = $start_date." ".$start_time.":00";
                            } else {
                                $start_date = $start_date." 00:00:00";
                            }
                        }

                        if (!empty($end_date)) {
                            $end_date = $this->getYMDDate($end_date);
                            if (!empty($end_time)) {
                                $end_date = $end_date." ".$end_time.":00";
                            } else {
                                $end_date = $end_date." 23:59:59";
                            }
                        }

                        if (!empty($start_date) || !empty($end_date)) {
                            $date_status = 1;
                            if (isset($cht_date_rules['timezone']) && !empty($cht_date_rules['timezone'])) {
                                $time_zone = $cht_date_rules['timezone'];
                                if (strpos($time_zone, "UTC") == 0) {
                                    $difference = str_replace('UTC', '', $cht_date_rules['timezone']);
                                } else {
                                    $difference = $time_zone;
                                }

                                $time_diff = $difference;
                            } else {
                                $time_diff = "UTC";
                            }
                        }//end if
                    }//end if

                    $custom_css = get_option('chaty_custom_css'.$index);
                    $custom_css = trim(preg_replace('/\s\s+/', '', $custom_css));

                    $pending_messages = get_option("cht_pending_messages".$index);
                    $pending_messages = ($pending_messages === false) ? "off" : $pending_messages;

                    $click_setting = get_option("cht_cta_action".$index);
                    $click_setting = ($click_setting === false) ? "click" : $click_setting;

                    $cht_number_of_messages = get_option("cht_number_of_messages".$index);
                    $cht_number_of_messages = ($cht_number_of_messages === false) ? 0 : $cht_number_of_messages;

                    $number_color = get_option("cht_number_color".$index);
                    $number_color = ($number_color === false) ? "#ffffff" : $number_color;
                    $number_color = $this->validate_color($number_color, "#ffffff");

                    $number_bg_color = get_option("cht_number_bg_color".$index);
                    $number_bg_color = ($number_bg_color === false) ? "#dd0000" : $number_bg_color;
                    $number_bg_color = $this->validate_color($number_bg_color, "#dd0000");

                    $cht_cta_text_color = get_option("cht_cta_text_color".$index);
                    $cht_cta_text_color = ($cht_cta_text_color === false) ? "#333333" : $cht_cta_text_color;
                    $cht_cta_text_color = $this->validate_color($cht_cta_text_color, "#333333");

                    $cht_cta_bg_color = get_option("cht_cta_bg_color".$index);
                    $cht_cta_bg_color = ($cht_cta_bg_color === false) ? "#ffffff" : $cht_cta_bg_color;
                    $cht_cta_bg_color = $this->validate_color($cht_cta_bg_color, "#ffffff");

                    if (empty($cht_number_of_messages)) {
                        $pending_messages = "off";
                    }

                    if (empty($bg_color)) {
                        $bg_color = '#A886CD';
                    }

                    $bg_color = strtolower($bg_color);
                    if (strpos($bg_color, "#") === false && strpos($bg_color, "rgb") === false) {
                        $bg_color = "#".$bg_color;
                    }
                    $bg_color = $this->validate_color($bg_color, "");

                    $state = ($state == "open") ? "open" : $state;
                    if ($state == "open") {
                        $pending_messages = 0;
                        $animation_class = "";
                    }

                    /*
                     * Check for CTA settings
                     * */
                    $cta_type = get_option("cta_type".$index);
                    $cta_head = "";
                    $cta_body = "";
                    $cta_head_bg_color = "";
                    $cta_header_text_color = "";

                    if($cta_type == "chat-view") {
                        $cta_woocommerce_status = get_option("cta_woocommerce_status".$index);

                        if($cta_woocommerce_status == "yes" && $this->isProductPage) {
                            $cta_head = get_option("cta_wc_heading_text".$index);
                            $cta_body = get_option("cta_wc_body_text".$index);
                        } else {
                            $cta_head = get_option("cta_heading_text".$index);
                            $cta_body = get_option("cta_body_text".$index);
                        }
                        $cta_head_bg_color = get_option("cta_header_bg_color".$index);
                        $cta_head_bg_color = $this->validate_color($cta_head_bg_color, "#A886CD");
                        $cta_header_text_color = get_option("cta_header_text_color".$index);
                        $cta_header_text_color = $this->validate_color($cta_header_text_color, "#ffffff");
                    }

                    if(!empty($cta_head)) {
                        $cta_head = $this->sanitize_xss($cta_head);
                    }
                    if(!empty($cta_body)) {
                        $cta_body = wp_kses($cta_body, $allowedHTML);
                    }
                    if(!empty($cta)) {
                        $cta = wp_kses($cta, $allowedHTML);
                    }

                    $wooName = "";
                    $wooSKU = "";
                    $wooPrice = "";
                    $wooRegPrice = "";
                    $wooDisc = "";

                    if($this->isProductPage) {
                        $product_id = get_the_ID();
                        $product = wc_get_product( $product_id );
                        if(!empty($product)) {
                            $wooName = $product->get_name();
                            $wooSKU = $product->get_sku();
                            $wooPrice = wc_price($product->get_price());
                            $wooRegPrice = wc_price($product->get_regular_price());
                            $wooDisc = wc_price(floatval($product->get_regular_price()) - floatval($product->get_price()));
                        }
                    }

                    $cta_head = str_replace(["{woo-itemName}", "{woo-sku}", "{woo-price}", "{woo-regular}", "{woo-discount}"], [$wooName, $wooSKU, $wooPrice, $wooRegPrice, $wooDisc], $cta_head);
                    $cta_body = str_replace(["{woo-itemName}", "{woo-sku}", "{woo-price}", "{woo-regular}", "{woo-discount}"], [$wooName, $wooSKU, $wooPrice, $wooRegPrice, $wooDisc], $cta_body);

                    if($cta_type == "chat-view") {
                        $has_close_button = "yes";
                        $mode = "vertical";
                    }

                    $img_id = get_option('widget-custom-img'.$index);
                    $imageUrl = "";
                    if (!empty($img_id)) {
                        $imageData = wp_get_attachment_image_src($img_id, "full");
                        if (!empty($imageData) && isset($imageData[0])) {
                            $imageUrl   = $imageData[0];
                        }
                    }

                    $faIcon = get_option('widget-fa-icon'.$index);
                    if(!empty($faIcon)) {
                        $this->hasFont = true;
                    }

                    // widget setting array
                    $setting = [];
                    $setting['cta_type']          = $this->sanitize_xss($cta_type);
                    $setting['cta_body']          = $cta_body;
                    $setting['cta_head']          = $cta_head;
                    $setting['cta_head_bg_color'] = $this->sanitize_xss($cta_head_bg_color);
                    $setting['cta_head_text_color'] = $this->sanitize_xss($cta_header_text_color);
                    $setting['show_close_button'] = $this->sanitize_xss($has_close_button);
                    $setting['position']          = $this->sanitize_xss($position);
                    $setting['custom_position']   = 1;
                    $setting['bottom_spacing']    = $this->sanitize_xss($cht_bottom_spacing);
                    $setting['side_spacing']      = $this->sanitize_xss($cht_side_spacing);
                    $setting['icon_view']         = $this->sanitize_xss($mode);
                    $setting['default_state']     = $this->sanitize_xss($state);
                    $setting['cta_text']          = html_entity_decode($cta);
                    $setting['cta_text_color']    = $cht_cta_text_color;
                    $setting['cta_bg_color']      = $cht_cta_bg_color;
                    $setting['show_cta']          = ($click_setting == "click") ? "first_click" : "all_time";
                    $setting['is_pending_mesg_enabled']    = $this->sanitize_xss($pending_messages);
                    $setting['pending_mesg_count']         = $this->sanitize_xss($cht_number_of_messages);
                    $setting['pending_mesg_count_color']   = $this->sanitize_xss($number_color);
                    $setting['pending_mesg_count_bgcolor'] = $this->sanitize_xss($number_bg_color);
                    $setting['widget_icon']        = get_option('widget_icon'.$index);
                    $setting['widget_icon_url']    = $imageUrl;
                    $setting['widget_fa_icon']     = $this->sanitize_xss($faIcon);
                    $setting['font_family']        = $this->sanitize_xss($font_family);
                    $setting['widget_size']        = $this->sanitize_xss($cht_widget_size);
                    $setting['custom_widget_size'] = $this->sanitize_xss($cht_widget_size);
                    $setting['is_google_analytics_enabled'] = $this->sanitize_xss($analytics);
                    $setting['bg_blur_effect']   = $this->sanitize_xss($blurEffect);
                    $setting['close_text']       = wp_strip_all_tags(esc_attr($close_text));
                    $setting['widget_color']     = $bg_color;
                    $setting['widget_icon_color'] = $icon_color;
                    $setting['widget_rgb_color'] = $this->getRGBColor($bg_color);
                    $setting['has_custom_css']   = empty($custom_css) ? 0 : 1;
                    $setting['custom_css']       = $custom_css;
                    $setting['widget_token']     = wp_create_nonce("chaty_widget_nonce".$index);
                    $setting['widget_index']     = $this->sanitize_xss($index);
                    $setting['attention_effect'] = $animation_class;

                    if(!empty($setting['widget_fa_icon']) && empty($setting['widget_icon_url'])) {
                        $this->hasFont = true;
                    }

                    $widgetSetting       = [];
                    $widgetSetting['id'] = empty($index) ? 0 : $index;
                    $widgetSetting['identifier'] = $widgetSetting['id'];
                    $widgetSetting['settings']   = $setting;

                    $trigger = [];
                    $trigger['has_time_delay'] = ($time_trigger == "yes") ? 1 : 0;
                    $trigger['time_delay']     = $trigger_time;
                    $trigger['exit_intent']    = ($exit_intent == "yes") ? 1 : 0;
                    $trigger['has_display_after_page_scroll'] = ($on_page_scroll == "yes") ? 1 : 0;
                    $trigger['display_after_page_scroll']     = $page_scroll;
                    $trigger['auto_hide_widget'] = ($hide_widget == "yes") ? 1 : 0;
                    $trigger['hide_after']       = $hide_time;

                    $trigger['show_on_pages_rules'] = [];

                    $trigger['time_diff'] = $time_diff;
                    $trigger['has_date_scheduling_rules'] = $date_status;
                    $trigger['date_scheduling_rules']     = [
                        'start_date_time' => $start_date,
                        'end_date_time'   => $end_date,

                    ];
                    $trigger['date_scheduling_rules_timezone'] = $time_diff;

                    $trigger['day_hours_scheduling_rules_timezone'] = 0;
                    $trigger['has_day_hours_scheduling_rules']      = $display_conditions;
                    $trigger['day_hours_scheduling_rules']          = $display_rules;
                    $trigger['day_time_diff']        = $gmt;
                    $trigger['show_on_direct_visit'] = 0;
                    $trigger['show_on_referrer_social_network'] = 0;
                    $trigger['show_on_referrer_search_engines'] = 0;
                    $trigger['show_on_referrer_google_ads']     = 0;
                    $trigger['show_on_referrer_urls']           = [];
                    $trigger['has_show_on_specific_referrer_urls'] = 0;
                    $trigger['has_traffic_source'] = 0;
                    $trigger['has_countries']      = count($countries) ? 1 : 0;
                    $trigger['countries']          = $countries;
                    $trigger['has_target_rules']   = 0;

                    $widgetSetting['triggers'] = $trigger;

                    $widgetSetting['channels'] = $social;

                    $this->widget_settings[] = $widgetSetting;
                }//end if
            }//end if
        }//end if

    }//end get_widget_settings()


    public function getYMDDate($date)
    {
        $date       = explode("/", $date);
        $month      = isset($date[0]) ? $date[0] : "00";
        $month_date = isset($date[1]) ? $date[1] : "00";
        $year       = isset($date[2]) ? $date[2] : "0000";
        return $year."-".$month."-".$month_date;

    }//end getYMDDate()


    public function getVisitorTrafficSource($index="")
    {

        $traffic_source = get_option("chaty_traffic_source".$index);
        if ($traffic_source === false || $traffic_source != "yes") {
            return true;
        }

        $origin_landing_page = '';
        $HTTP_REFERER        = ( isset($_SERVER['HTTP_REFERER'])) ? $_SERVER['HTTP_REFERER'] : '';
        if (isset($_COOKIE['CHATY_HTTP_REFERER']) && $_COOKIE['CHATY_HTTP_REFERER'] != '') {
            $HTTP_REFERER = $_COOKIE['CHATY_HTTP_REFERER'];
        }

        if ($HTTP_REFERER != '') {
            @setcookie('CHATY_HTTP_REFERER', $HTTP_REFERER, (time() + (86400 * 30)), "/");
            // 86400 = 1 day
        }

        $chaty_traffic_source = get_option("chaty_traffic_source".$index);
        if ($chaty_traffic_source == "yes") {
            $direct_visit     = get_option("chaty_traffic_source_direct_visit".$index);
            $social_network   = get_option("chaty_traffic_source_social_network".$index);
            $search_engines   = get_option("chaty_traffic_source_search_engine".$index);
            $google_ads       = get_option("chaty_traffic_source_google_ads".$index);
            $other_source_url = get_option("chaty_custom_traffic_rules".$index);
            $other_source_url = !is_array($other_source_url) ? [] : $other_source_url;
            $url_setting      = [];
            foreach ($other_source_url as $setting) {
                if (!empty($setting['url_value'])) {
                    $url_setting[] = $setting;
                }
            }

            if ($direct_visit != "yes" && $social_network != "yes" && $search_engines != "yes" && $google_ads != "yes" && empty($url_setting)) {
                return "no-rule";
            }

            if (isset($_COOKIE['chaty_traffic_source-'.$index]) &&  $_COOKIE['chaty_traffic_source-'.$index] != '') {
                return $_COOKIE['chaty_traffic_source-'.$index];
            }

            $coupon_traffic_source = $this->trafficSource();

            $response        = false;
            $visitor_referel = ( (isset($HTTP_REFERER) && $HTTP_REFERER != '' ) ? wp_parse_url($HTTP_REFERER)['host'] : '' );

            if (( ( empty($visitor_referel) || $_SERVER['HTTP_HOST'] == $visitor_referel || (isset($_SERVER['HTTP_ORIGIN']) && (wp_parse_url($_SERVER['HTTP_ORIGIN'])['host'] == $visitor_referel )) ) ) &&  $direct_visit == "yes") {
                $response = "direct_link";
            }

            if (!$response && $search_engines == "yes") {
                foreach ($coupon_traffic_source['search_engine'] as $source) {
                    if ((strpos($visitor_referel, $source) !== false)) {
                        if ($source == "google." && strpos($visitor_referel, "plus.google") !== false) {
                            break;
                        } else {
                            $response = "search_engine";
                            break;
                        }
                    }
                }
            }

            // if social_media
            if (!$response && $social_network == "yes") {
                foreach ($coupon_traffic_source['social_media'] as $source) {
                    if (strpos($visitor_referel, $source) !== false) {
                        $response = "social_media";
                        break;
                    }
                }
            }

            // if google_ads
            if ($google_ads == "yes" && !$response &&  isset($origin_landing_page) && !empty($origin_landing_page)) {
                if ((strpos($origin_landing_page, 'gclid=') !== false)) {
                    $response = "google_ads";
                }
            }

            if (!empty($url_setting) && !$response) {
                $flag = $this->checkSpecifixUrlInRolesTrafficSource($index);
                if ($flag) {
                    $response = "specific_url";
                } else {
                    $response = false;
                }
            }
        } else {
            $response = "no-rule";
        }//end if

        return $response;

    }//end getVisitorTrafficSource()


    function checkSpecifixUrlInRolesTrafficSource($index)
    {
        $flag       = true;
        $flag_array = [];
        $contain_flag_array     = [];
        $not_contain_flag_array = [];

        $HTTP_REFERER = ( isset($_SERVER['HTTP_REFERER'])) ? $_SERVER['HTTP_REFERER'] : '';
        if (isset($_COOKIE['CHATY_HTTP_REFERER']) && $_COOKIE['CHATY_HTTP_REFERER'] != '') {
            $HTTP_REFERER = $_COOKIE['CHATY_HTTP_REFERER'];
        }

        $referer = (isset($HTTP_REFERER) ? wp_parse_url($HTTP_REFERER) : 'empty' );

        $referer_host  = $this->removeWWW($referer['host']);
        $query         = (isset($referer['query']) && !empty($referer['query']) ? '?'.$referer['query'] : '');
        $referer_path  = $referer['path'].$query;
        $referer_path  = strtolower(str_replace("/", "%2f", $referer_path));
        $contain_array = [];
        $not_contain_array = [];
        $url_settings      = get_option("chaty_custom_traffic_rules".$index);

        if (($referer == 'empty' || !isset($referer['host'])) && empty($url_settings)) {
            return true;
        }

        foreach ($url_settings as $setting) {
            if (!empty($setting['url_value'])) {
                if ($setting['url_option'] == "contain") {
                    $contain_array[] = [
                        $setting['url_option'],
                        $setting['url_value'],
                    ];
                } else {
                    $not_contain_array[] = [
                        $setting['url_option'],
                        $setting['url_value'],
                    ];
                }
            }
        }

        if (empty($contain_array) && empty($not_contain_array)) {
            return true;
        }

        if (!empty($contain_array)) {
            foreach ($contain_array as $key => $value) {
                $role_link = wp_parse_url($value[1]);
                $role_host = $this->removeWWW($role_link['host']);
                $role_path = '';
                if (isset($role_link['path'])) {
                    $role_path = $role_link['path'];
                } else {
                    $role_path = '';
                }

                if (isset($role_link['query'])) {
                    $role_path .= '?'.$role_link['query'];
                }

                $role_path = (preg_match("/\p{Hebrew}/u", $role_path) ? $role_path : str_replace("/", "%2f", $role_path));
                $role_path = strtolower(str_replace("&amp;", "&", $role_path));
                $role_path = trim($role_path);
                if ($role_path == '') {
                    $role_path = '/';
                }

                if ($referer_path == '') {
                    $referer_path = '/';
                }

                if ($role_host != $referer_host) {
                    $flag = false;
                } else if (empty($role_path) && empty($referer_path)) {
                    $flag = true;
                } else if (strtolower(urlencode($role_path)) == strtolower($referer_path) && strtolower($referer_path) == '%2f') {
                    $flag = true;
                } else {
                    switch ($value[0]) {
                        case 'contain':
                            if (empty($role_path) && !empty($referer_path)) {
                                $flag = true;
                            } else if ($role_path == "/" || $role_path == "%2f") {
                                $flag = true;
                            } else if (strpos($referer_path, ( preg_match("/\p{Hebrew}/u", $role_path) ? strtolower(urlencode($role_path)) : strtolower($role_path) )) !== false) {
                                $flag = true;
                            } else if (strpos($referer_path.'/', ( preg_match("/\p{Hebrew}/u", $role_path) ? strtolower(urlencode($role_path)) : strtolower($role_path) )) !== false) {
                                $flag = true;
                            } else if (strpos($referer_path.'%2f', ( preg_match("/\p{Hebrew}/u", $role_path) ? strtolower(urlencode($role_path)) : strtolower($role_path) )) !== false) {
                                $flag = true;
                            } else {
                                $flag = false;
                            }
                            break;
                    }

                    $and = $flag;
                }//end if

                $flag_array[]         = $flag;
                $contain_flag_array[] = $flag;
            }//end foreach
        }//end if

        if (!empty($not_contain_array)) {
            foreach ($not_contain_array as $key => $value) {
                $role_link = wp_parse_url($value[1]);

                $role_host = $this->removeWWW($role_link['host']);

                $role_path = '';
                if (isset($role_link['path'])) {
                    $role_path = $role_link['path'];
                } else {
                    $role_path = '';
                }

                if (isset($role_link['query'])) {
                    $role_path .= '?'.$role_link['query'];
                }

                $role_path = (preg_match("/\p{Hebrew}/u", $role_path) ? $role_path : str_replace("/", "%2f", $role_path));
                $role_path = str_replace("&amp;", "&", $role_path);
                $role_path = trim($role_path);
                if ($role_path == '') {
                    $role_path = '/';
                }

                if ($referer_path == '') {
                    $referer_path = '/';
                }

                if ($role_host == $referer_host && (empty($role_path) || $role_path == "%2f") && (empty($referer_path) || $referer_path == "%2f")) {
                    $flag = false;
                } else {
                    switch ($value[0]) {
                        case 'not_contain':
                            if (isset($referer_path) && strpos(strtolower($referer_path), ((preg_match("/\p{Hebrew}/u", $role_path)) ? strtolower(urlencode($role_path)) : strtolower($role_path))) !== false) {
                                $flag = false;
                            } else if ($role_path == "/" || $role_path == "%2f") {
                                $flag = false;
                            } else {
                                $flag = true;
                            }
                            break;
                    }
                }

                $flag_array[] = $flag;
                $not_contain_flag_array[] = $flag;
            }//end foreach
        }//end if

        if (!empty($not_contain_array) && empty($contain_array)) {
            return (in_array(false, $not_contain_flag_array) ? false : true );
        } else if (!empty($not_contain_array) && !empty($contain_array)) {
            if (in_array(false, $not_contain_flag_array)) {
                return false;
            } else {
                return (in_array(true, $contain_flag_array) ? true : false );
            }
        } else if (empty($not_contain_array) && !empty($contain_array)) {
            return (in_array(true, $contain_flag_array) ? true : false );
        } else {
            return $flag;
        }

    }//end checkSpecifixUrlInRolesTrafficSource()


    function removeWWW($url)
    {
        return str_replace('www.', '', $url);

    }//end removeWWW()


    // returns traffic source list
    public function trafficSource()
    {
        $traffic_source = [
            "search_engine" => [
                'accoona',
                'ansearch',
                'biglobe',
                'daum',
                'egerin	',
                'leit.is',
                'maktoob',
                'miner.hu',
                'najdi.si',
                'najdi.org',
                'naver',
                'rambler',
                'rediff',
                'sapo',
                'search.ch',
                'sesam',
                'seznam',
                'walla',
                'zipLoca',
                'slurp',
                'search.msn.com',
                'nutch',
                'simpy',
                'bot.',
                'aspSeek',
                'crawler.',
                'msnbot',
                'libwww-perl',
                'fast',
                'baidu.',
                'bing.',
                'google.',
                'duckduckgo',
                'ecosia',
                'exalead',
                'giablast',
                'munax',
                'qwant',
                'sogou',
                'soso',
                'yahoo.',
                'yandex.',
                'youdao',
                'aol.',
                'hotbot.',
                'webcrawler.',
                'eniro',
                'naver',
                'lycos',
                'ask',
                'altavista',
                'netscape',
                'about',
                'mamma',
                'alltheweb',
                'voila',
                'live',
                'alice',
                'mama',
                'wp.pl',
                'onecenter',
                'szukacz',
                'yam',
                'kvasir',
                'ozu',
                'terra',
                'pchome',
                'mynet',
                'ekolay',
                'rembler',
            ],
            "social_media"  => [
                "facebook.",
                "instagram.",
                "linkedin.",
                "myspace.",
                "twitter.",
                "t.co",
                "plus.google",
                "disqus.",
                "snapchat.",
                "tumbler.",
                "pinterest.",
                "twoo",
                "mymfb",
                "youtube.",
                "vine",
                "whatsapp",
                "vk.com",
                "secret",
                "medium",
                "bebo",
                "friendster",
                "hi5",
                "habbo",
                "ning",
                "classmates",
                "tagged",
                "myyearbook",
                "meetup",
                "mylife",
                "reunion",
                "flixster",
                "myheritage",
                "multiply",
                "orkut",
                "badoo",
                "gaiaonline",
                "blackplanet",
                "skyrock",
                "perfspot",
                "zorpia",
                "netlog",
                "tuenti",
                "nasza-klasa.pl",
                "irc-gallery",
                "studivz",
                "xing",
                "renren",
                "kaixin001",
                "hyves.nl",
                "MillatFacebook",
                "ibibo",
                "sonico",
                "wer-kennt-wen",
                "cyworld",
                "iwiw",
                "dribbble.",
                "stumbleupon.",
                "flickr.",
                "plaxo.",
                "digg.",
                "del.icio.us",
            ],
        ];
        return $traffic_source;

    }//end trafficSource()


    // returns for widget is active or not
    private function canInsertWidget()
    {

        $flag       = false;
        $status     = get_option('cht_active') && $this->checkChannels() && $this->check_for_url();
        $is_deleted = get_option("cht_is_default_deleted");
        if ($status && $is_deleted === false) {
            $this->get_widget_settings();
            $flag = true;
        }

        $deleted_list = get_option("chaty_deleted_settings");
        if (empty($deleted_list) || !is_array($deleted_list)) {
            $deleted_list = [];
        }

        $chaty_widgets = get_option("chaty_total_settings");
        if (!empty($chaty_widgets) && $chaty_widgets != null && is_numeric($chaty_widgets) && $chaty_widgets > 0) {
            for ($i = 1; $i <= $chaty_widgets; $i++) {
                if (!in_array($i, $deleted_list)) {
                    $this->widget_number = "_".$i;
                    $status = get_option('cht_active_'.$i) && $this->checkChannels() && $this->check_for_url();
                    if ($status) {
                        $this->get_widget_settings("_".$i);
                        $flag = true;
                    }
                }
            }
        }

        return $flag;

    }//end canInsertWidget()


    // checking for social channels
    private function checkChannels()
    {
        $social = explode(",", get_option('cht_numb_slug'.$this->widget_number));
        $res    = false;
        foreach ($social as $name) {
            $value = get_option('cht_social'.$this->widget_number.'_'.strtolower($name));
            $res   = $res || !empty($value['value']) || ($name == "Contact_Us") || (isset($value['is_agent']) && $value['is_agent']);
        }

        return $res;

    }//end checkChannels()

    /**
     * Validates a color value and returns it if it matches the given formats.
     *
     * @param string $color The color value to validate.
     * @param string $default_color (optional) The default color value to return if the given color is invalid.
     * @return string The validated color value, or the default color value if the given color is invalid.
     */
    function validate_color($color, $default_color = "") {
        if( preg_match('/^#[a-f0-9]{6}$/i', $color)) {
            return $color;
        } else {
            // Check if it's a RGB color
            $rgbPattern = "/^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/";
            if(preg_match($rgbPattern, $color)) {
                return $color;
            }

            // Check if it's a RGBA color
            $rgbaPattern = "/^rgba\((\d{1,3}), (\d{1,3}), (\d{1,3}), (0(\.\d{1,2})?|1)\)$/";
            if(preg_match($rgbaPattern, $color)) {
                return $color;
            }
        }
        return $default_color;
    }
}//end class


return new CHT_PRO_Frontend();
