<?php

$imageUrl = CHT_PLUGIN_URL."admin/assets/images/chaty-default.png";
if (empty($value)) {
    // Initialize default values if not found
    $value = [
        'value'      => '',
        'is_mobile'  => 'checked',
        'is_desktop' => 'checked',
        'image_id'   => '',
        'title'      => $social['title'],
        'bg_color'   => "",
    ];
}

$is_pro = $this->is_pro();
$disabled = "";
if(!$is_pro) {
    $disabled = "disabled";
}

if (!isset($value['value'])) {
    $value['value'] = "";
}

if (!isset($value['bg_color']) || empty($value['bg_color'])) {
    $value['bg_color'] = $social['color'];
    // Initialize background color value if not exists. 2.1.0 change
}

if($social['slug'] == "Twitter" && ($value['bg_color'] == "#1ab2e8" || $value['bg_color'] == "rgb(26, 178, 232)") ) {
    $value['bg_color'] = "#000000";
}
$value['bg_color'] = $this->validate_color($value['bg_color'], $social['color']);

if (!isset($value['image_id'])) {
    $value['image_id'] = '';
    // Initialize custom image id if not exists. 2.1.0 change
}

if (!isset($value['title'])) {
    $value['title'] = $social['title'];
    // Initialize title if not exists. 2.1.0 change
}

if (!isset($value['fa_icon'])) {
    $value['fa_icon'] = "";
    // Initialize title if not exists. 2.1.0 change
}

$is_agent = 0;
if (isset($value['is_agent'])) {
    $is_agent = $value['is_agent'];
    // Initialize title if not exists. 2.1.0 change
}

$color = "";
if (!empty($value['bg_color'])) {
    $color = "background-color: ".esc_attr($value['bg_color']);
    // set background color of icon it it is exists
}

if ($social['slug'] == "Whatsapp") {
//    $val            = $value['value'];
//    $val            = str_replace("+", "", $val);
//    $value['value'] = $val;
} else if ($social['slug'] == "Facebook_Messenger") {
    $val = $value['value'];
    $val = str_replace("facebook.com", "m.me", $val);
    // Replace facebook.com with m.me version 2.0.1 change
    $val = str_replace("www.", "", $val);
    // Replace www. with blank version 2.0.1 change
    $value['value'] = $val;

    $val        = trim($val, "/");
    $val_array  = explode("/", $val);
    $total      = (count($val_array) - 1);
    $last_value = $val_array[$total];
    $last_value = explode("-", $last_value);
    $total_text = (count($last_value) - 1);
    $total_text = $last_value[$total_text];

    if (is_numeric($total_text)) {
        $val_array[$total] = $total_text;
        $value['value']    = implode("/", $val_array);
    }
}//end if

$value['value'] = esc_attr(wp_unslash($value['value']));
$value['title'] = esc_attr(wp_unslash($value['title']));

$svg_icon = $social['svg'];

$help_title = "";
$help_text  = "";
$help_link  = "";

if ((isset($social['help']) && !empty($social['help'])) || isset($social['help_link'])) {
    $help_title = isset($social['help_title']) ? $social['help_title'] : "Doesn't work?";
    $help_text  = isset($social['help']) ? $social['help'] : "";
    if (isset($social['help_link']) && !empty($social['help_link'])) {
        $help_link = $social['help_link'];
    }
}

$channel_type = "";
$placeholder  = $social['example'];
if ($social['slug'] == "Link" || $social['slug'] == "Custom_Link" || $social['slug'] == "Custom_Link_3" || $social['slug'] == "Custom_Link_4" || $social['slug'] == "Custom_Link_5") {
    if (isset($value['channel_type'])) {
        $channel_type = esc_attr(wp_unslash($value['channel_type']));
    }

    if (!empty($channel_type)) {
        foreach ($this->socials as $icon) {
            if ($icon['slug'] == $channel_type) {
                $svg_icon = $icon['svg'];

                $placeholder = $icon['example'];

                if ((isset($icon['help']) && !empty($icon['help'])) || isset($icon['help_link'])) {
                    $help_title = isset($icon['help_title']) ? $icon['help_title'] : "Doesn't work?";
                    $help_text  = isset($icon['help']) ? $icon['help'] : "";
                    if (isset($icon['help_link']) && !empty($icon['help_link'])) {
                        $help_link = $icon['help_link'];
                    }
                }
            }
        }
    }
}//end if

if (empty($channel_type)) {
    $channel_type = $social['slug'];
}

$imageId          = $value['image_id'];
$value['fa_icon'] = isset($value['fa_icon']) ? $value['fa_icon'] : "";
$imageUrl         = CHT_PLUGIN_URL."admin/assets/images/chaty-default.png";
$imgClass         = "";
if (!empty($value['fa_icon'])) {
    $imgClass = "icon-active";
} else {
    if (!empty($imageId)) {
        $imageUrl = wp_get_attachment_image_src($imageId, "full")[0];
        // get custom image URL if exists
        if ($imageUrl == "") {
            $imageUrl = CHT_PLUGIN_URL."admin/assets/images/chaty-default.png";
            // Initialize with default image if custom image is not exists
        } else {
            $imgClass = "img-active";
        }
    }
}

// Check if the 'value' field is not empty
if (!empty($value['value'])) {

    // Extract the social slug for readability
    $socialSlug = $social['slug'];

    // Check if the social slug is one of the specified values
    if ($socialSlug == "Whatsapp" || $socialSlug == "Phone" || $socialSlug == "SMS") {
        // Clean the 'value' field for numbers
        $value['value'] = $this->cleanStringForNumbers($value['value']);
    }

    // Check if the social slug is "Whatsapp"
    if ($socialSlug == "Whatsapp") {
        // Remove leading '+' and then prepend '+'
        $value['value'] = "+" . ltrim($value['value'], "+");
    }

    // Social slugs that require numeric formatting
    $numericSocials = ["Whatsapp", "SMS", "Viber"];

    // Social slugs that require username formatting
    $usernameSocials = ["Telegram", "Snapchat", "TikTok"];

    // Check if the current social slug requires numeric formatting
    if (in_array($socialSlug, $numericSocials)) {
        // Remove unwanted characters and prepend '+'
        $val = str_replace(["+", "-", " "], "", $value['value']);

        if(is_numeric($val)) {
            $value['value'] = "+" . $val;
        }
    }
    // Check if the current social slug requires username formatting
    elseif (in_array($socialSlug, $usernameSocials)) {
        // Remove '@' if present and prepend '@'
        $value['value'] = "@" . trim($value['value'], "@");
    }
    // No special formatting required for other social slugs
}
?>
<!-- Social media setting box: start -->
<li data-id="<?php echo esc_attr($social['slug']) ?>" class="chaty-channel group <?php echo ($is_agent == 1) ? "has-agent-view" : "" ?>" data-type="<?php echo esc_attr($social['slug']) ?>" data-channel="<?php echo esc_attr($channel_type) ?>" id="chaty-social-<?php echo esc_attr($social['slug']) ?>">
    <!-- channel visual fields start -->
    <div class="channels-selected__item <?php echo esc_attr(($this->is_pro()) ? 'pro' : 'free'); ?> 1 available">
        <div class="chaty-default-settings flex gap-3">
            <div class="flex relative">
                <!-- draggable element -->
                <div class="move-icon mt-2 mr-1 transition duration-200 self-start opacity-0 group-hover:opacity-100">
                    <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/move-icon.png") ?>">
                </div>

                <div class="icon chaty-icon icon-md active <?php echo esc_attr($imgClass) ?>" data-title="<?php echo esc_attr($social['title']); ?>" id="chaty_image_<?php echo esc_attr($social['slug']) ?>">
                    <span style="" class="custom-chaty-image custom-image-<?php echo esc_attr($social['slug']) ?>" id="image_data_<?php echo esc_attr($social['slug']) ?>">
                        <img src="<?php echo esc_url($imageUrl) ?>" />
                    </span>
                    <span class="default-chaty-icon chaty-main-svg" >
                        <?php echo $svg_icon; ?>
                    </span>
                    <span class="facustom-icon flex items-center justify-center" style="background-color: <?php echo esc_attr($value['bg_color']) ?>">
                        <i class="<?php echo esc_attr($value['fa_icon']) ?>"></i>
                    </span>
                    <span onclick="remove_chaty_image('<?php echo esc_attr($social['slug']) ?>')" class="remove-icon-img"></span>
                    <input class="fa-icon" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[fa_icon]" value="<?php echo esc_attr($value['fa_icon']) ?>">
                </div>

                <?php if(isset($social['header_help']) && !empty($social['header_help'])) { ?>
                    <span class="header-tooltip header-icon-tooltip">
                        <span class="header-tooltip-text text-center"><?php echo esc_attr($social['header_help']) ?></span>
                        <span class="ml-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </span>
                    </span>
                <?php } ?>
            </div>

            <div class="flex-auto space-y-1">
                <?php if ($social['slug'] != 'Contact_Us') { ?>
                    <?php if (($social['slug'] == "Whatsapp" || $channel_type == "Whatsapp") && !empty($value['value'])) {
//                        $value['value'] = trim($value['value'], "+");
//                        $value['value'] = "+".$value['value'];
                        if($value['value'][1] == "0") {
                            $value['value'][1] = " ";
                            $value['value'] = str_replace(' ', '', $value['value']);
                        }
                    } ?>
                    <!-- Social Media input  -->
                    <div class="channels__input-box mb-1">
                        <div class="p-relative test-btn">
                            <input data-label="<?php echo esc_attr($social['title']) ?>" placeholder="<?php echo esc_attr($placeholder); ?>" type="text" class="w-11/12 channels__input custom-channel-<?php echo esc_attr($channel_type) ?> <?php echo isset($social['attr']) ? esc_attr($social['attr']) : "" ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[value]" value="<?php echo esc_attr(wp_unslash($value['value'])); ?>" data-gramm_editor="false" id="channel_input_<?php echo esc_attr($social['slug']); ?>" />
                            <?php if($social['slug'] == "Whatsapp") { ?>
                                <span class="header-tooltip-text text-center leading-zero-msg">
                                    <span class="close-msg-box">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 1L1 11M1 1L11 11" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </span>
                                    You entered the phone number with a leading zero. We've fixed it for you
                                </span>
                            <?php } ?>
                            <?php if($social['slug'] == 'Whatsapp' || $social['slug'] == 'Facebook_Messenger') { ?>
                                <button type="button" class="wf-test-button <?php echo !empty($value['value']) ? "active" : "" ?>" data-slug="<?php echo esc_attr($social['slug']) ?>"><?php esc_html_e('Test', 'chaty') ?></button>
                            <?php } ?>
                        </div>
                    </div>
                    <?php } ?>


                    <?php if ($social['slug'] != 'Contact_Us') { ?>
                    <!-- checking for extra help message for social media -->
                    
                        <?php if ((isset($social['help']) && !empty($social['help'])) || isset($social['help_link'])) { ?>
                        <div class="help-section inline-block relative">
                            <div class="viber-help">
                                <?php if (isset($help_link) && !empty($help_link)) { ?>
                                    <a class="help-link" href="<?php echo esc_url($help_link) ?>" target="_blank"><?php echo esc_attr($help_title); ?></a>
                                <?php } else if (isset($help_text) && !empty($help_text)) { ?>
                                    <span class="help-text"><?php echo esc_attr($help_text); ?></span>
                                    <span class="help-title"><?php echo esc_attr($help_title); ?></span>
                                <?php } ?>
                            </div>
                        </div>
                        <?php } ?>
                    

                    <?php }//end if
                    ?>

                <?php if ($social['slug'] == 'Contact_Us') {
                    $contactFormOrder = isset($value['contact_form_field_order']) ? $value['contact_form_field_order'] : ""; ?>
                    <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[contact_form_field_order]" id="contact_form_field_order" value="<?php echo esc_attr($contactFormOrder) ?>">
                <?php $fields = [
                    'name'    => [
                        'title'       => esc_html__("Name", "chaty"),
                        'placeholder' => esc_html__("Enter your name", "chaty"),
                        'is_required' => 1,
                        'type'        => 'input',
                        'is_enabled'  => 1,
                    ],
                    'email'   => [
                        'title'       => esc_html__("Email", "chaty"),
                        'placeholder' => esc_html__("Enter your email address", "chaty"),
                        'is_required' => 1,
                        'type'        => 'email',
                        'is_enabled'  => 1,
                    ],
                    'phone'   => [
                        'title'       => esc_html__("Phone", "chaty"),
                        'placeholder' => esc_html__("Enter your phone number", "chaty"),
                        'is_required' => 1,
                        'type'        => 'input',
                        'is_enabled'  => 1,
                    ],
                    'message' => [
                        'title'       => esc_html__("Message", "chaty"),
                        'placeholder' => esc_html__("Enter your message", "chaty"),
                        'is_required' => 1,
                        'type'        => 'textarea',
                        'is_enabled'  => 1,
                    ],
                ];
                echo '<div class="form-field-setting-col">';
                // echo "<pre>";print_r($value);echo "</pre>";die;
                    if(empty($contactFormOrder)) {
                        foreach ($fields as $label => $field) {
                            $saved_value = isset($value[$label]) ? $value[$label] : [];
                            $field_value = [
                                'is_active'   => (isset($saved_value['is_active'])) ? $saved_value['is_active'] : 'yes',
                                'is_required' => (isset($saved_value['is_required'])) ? $saved_value['is_required'] : 'yes',
                                'placeholder' => (isset($saved_value['placeholder'])) ? $saved_value['placeholder'] : $field['placeholder'],
                                'field_label' => (isset($saved_value['field_label'])) ? $saved_value['field_label'] : $field['title'],
                            ];
                            ?>
                            <div class="field-setting-col mt-2.5 <?php echo ($field_value['is_active'] == "yes") ? "" : "hide-label-setting" ?>" data-title="<?php echo esc_attr($field['title']) ?>" data-order="<?php echo esc_attr($field_value['field_label']) ?>">
                                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][is_active]" value="no">
                                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][is_required]" value="no">

                                <div class="label-flex mb-4">
                                    <label class="chaty-switch chaty-switch-toggle text-cht-gray-150 text-base" for="field_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>">
                                        <input type="checkbox" class="chaty-field-setting" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][is_active]" id="field_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" value="yes" <?php checked($field_value['is_active'], "yes") ?>>
                                        <div class="chaty-slider round"></div>
                                        <span class="field-label"><?php echo esc_attr($field_value['field_label']) ?>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_8719_30645)">
                                                    <path d="M7.33398 2.66699H2.66732C2.3137 2.66699 1.97456 2.80747 1.72451 3.05752C1.47446 3.30756 1.33398 3.6467 1.33398 4.00033V13.3337C1.33398 13.6873 1.47446 14.0264 1.72451 14.2765C1.97456 14.5265 2.3137 14.667 2.66732 14.667H12.0006C12.3543 14.667 12.6934 14.5265 12.9435 14.2765C13.1935 14.0264 13.334 13.6873 13.334 13.3337V8.66699" stroke="#C6D7E3" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M12.334 1.66617C12.5992 1.40095 12.9589 1.25195 13.334 1.25195C13.7091 1.25195 14.0688 1.40095 14.334 1.66617C14.5992 1.93138 14.7482 2.29109 14.7482 2.66617C14.7482 3.04124 14.5992 3.40095 14.334 3.66617L8.00065 9.9995L5.33398 10.6662L6.00065 7.9995L12.334 1.66617Z" stroke="#C6D7E3" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_8719_30645">
                                                        <rect width="16" height="16" fill="white"/>
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        </span>
                                    </label>
                                    <div class="label-input">
                                        <input type="text" class="label-input-field chaty-input-text contact-form-field-text" value="<?php echo esc_attr($field_value['field_label']) ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][field_label]" />
                                    </div>
                                    <div class="sort-contact-form-field"><img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/move-icon.png") ?>" alt="Move Icon"/></div>
                                </div>
                                <div class="field-settings <?php echo ($field_value['is_active'] == "yes") ? "active" : "" ?>">
                                    <div class="chaty-setting-col sm:grid grid-cols-2 items-center gap-3">
                                        <div>
                                            <input class="rounded-lg w-full chaty-input-text contact_form_custom_value" data-type="<?php echo esc_attr($field['type']) ?>" id="placeholder_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][placeholder]" value="<?php echo esc_attr($field_value['placeholder']) ?>" >
                                        </div>
                                        <div class="flex items-center space-x-3">
                                            <div class="checkbox">
                                                <label for="field_required_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" class="chaty-checkbox text-cht-gray-150 text-base flex items-center">
                                                    <input class="sr-only" type="checkbox" id="field_required_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][is_required]" value="yes" <?php checked($field_value['is_required'], "yes") ?> />
                                                    <span class="mr-2"></span>
                                                    <?php esc_html_e("Required?", "chaty") ?>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php if ($label != 'message') { ?>
                                <!--                    <div class="chaty-separator mt-2.5"></div>-->
                            <?php } ?>
                        <?php }//end foreach
                    } else {
                        $orderField = explode(",", $contactFormOrder);
                        foreach ($orderField as $orderKey => $orderValue) {
                            $custom_fields = [];
                            if ( isset($value['custom_fields']) && is_array($value['custom_fields']) ) {
                                foreach ($value['custom_fields'] as $key => $val) {
                                    $custom_fields[] = $key;
                                }
                            }
                            if(!empty($custom_fields)) {
                                $custom_fields = max($custom_fields) + 1;
                            } else {
                                $custom_fields = 1;
                            }
//                            echo "<pre>";print_r($value);echo "</pre>";die;
                            ?>
                            <input type="hidden" id="chaty-custom-fields-length" value="<?php echo esc_attr($custom_fields); ?>" />
                            <?php if(isset($value['custom_fields']) && is_array($value['custom_fields'])) {
                                foreach ($value['custom_fields'] as $label => $field) {
                                    if($field['unique_id'] == $orderValue) {
                                        $uniqueId = isset($field['unique_id']) ? $field['unique_id'] : ''
                                        ?>
                                    <div class="field-setting-col mt-2.5 chaty-custom-field <?php echo ($field['is_active'] == "yes") ? "" : "hide-label-setting" ?> custom-<?php echo esc_attr($field['field_dropdown']) ?>" data-order="<?php echo esc_attr($uniqueId); ?>">
                                        <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label) ?>][is_active]" value="no">
                                        <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label) ?>][is_required]" value="no">
                                        <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label) ?>][unique_id]" value="<?php echo esc_attr($uniqueId) ?>">
                                        <div class="label-flex mb-4">
                                            <label class="chaty-switch chaty-switch-toggle text-cht-gray-150 text-base" for="field_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>">
                                                <input type="checkbox" class="chaty-field-setting" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label) ?>][is_active]" id="field_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" value="yes" <?php checked($field['is_active'], "yes") ?>>
                                                <div class="chaty-slider round"></div>
                                                <span class="field-label"><?php echo esc_attr($field['field_label']) ?>
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <g clip-path="url(#clip0_8719_30645)">
                                                            <path d="M7.33398 2.66699H2.66732C2.3137 2.66699 1.97456 2.80747 1.72451 3.05752C1.47446 3.30756 1.33398 3.6467 1.33398 4.00033V13.3337C1.33398 13.6873 1.47446 14.0264 1.72451 14.2765C1.97456 14.5265 2.3137 14.667 2.66732 14.667H12.0006C12.3543 14.667 12.6934 14.5265 12.9435 14.2765C13.1935 14.0264 13.334 13.6873 13.334 13.3337V8.66699" stroke="#C6D7E3" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path d="M12.334 1.66617C12.5992 1.40095 12.9589 1.25195 13.334 1.25195C13.7091 1.25195 14.0688 1.40095 14.334 1.66617C14.5992 1.93138 14.7482 2.29109 14.7482 2.66617C14.7482 3.04124 14.5992 3.40095 14.334 3.66617L8.00065 9.9995L5.33398 10.6662L6.00065 7.9995L12.334 1.66617Z" stroke="#C6D7E3" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </g>
                                                        <defs>
                                                            <clipPath id="clip0_8719_30645">
                                                                <rect width="16" height="16" fill="white"/>
                                                            </clipPath>
                                                        </defs>
                                                    </svg>
                                                </span>
                                            </label>
                                            <div class="label-input">
                                                <input type="text" class="label-input-field chaty-input-text contact-form-field-text" value="<?php echo esc_attr($field['field_label']) ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label) ?>][field_label]" />
                                            </div>
                                            <div class="sort-contact-form-field"><img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/move-icon.png") ?>" alt="Move Icon"/></div>
                                        </div>
                                        <div class="field-settings <?php echo ($field['is_active'] == "yes") ? "active" : "" ?>">
                                            <?php
                                            $field_dropdown = ( isset($field['field_dropdown']) && $field['field_dropdown'] != '' ) ? $field['field_dropdown'] : 'text';
                                            ?>
                                            <div class="chaty-setting-col sm:grid <?php echo ($field_dropdown == 'textblock') ? "has-field-flex" : "grid-cols-2" ?> items-center gap-3">
                                                <div class="flex-first">
                                                    <!--                                        <input class="rounded-lg w-full chaty-input-text" id="placeholder_for_--><?php //echo esc_attr($social['slug']); ?><!--_--><?php //echo esc_attr($label) ?><!--" type="text" name="cht_social_--><?php //echo esc_attr($social['slug']); ?><!--[--><?php //echo esc_attr($label) ?><!--][placeholder]" value="--><?php //echo esc_attr($field_value['placeholder']) ?><!--" >-->
                                                    <?php

                                                    $cutom_field_val = ( isset ($field['placeholder']) && $field['placeholder'] != '') ? stripslashes($field['placeholder']): '';

                                                    if( $field_dropdown != 'textarea' && $field_dropdown != 'dropdown' && $field_dropdown != 'textblock' ){
                                                        if ( $field_dropdown == 'text' ){
                                                            $custom_field_dropdown = "Enter your message";
                                                        } elseif ( $field_dropdown == 'number' ) {
                                                            $custom_field_dropdown = "Enter a number";
                                                        } elseif ( $field_dropdown == 'url' ) {
                                                            $custom_field_dropdown = "Enter your website";
                                                        } elseif ( $field_dropdown == 'date' ) {
                                                            $custom_field_dropdown = "mm/dd/yyyy";
                                                        }
                                                        if( $field_dropdown == 'file' ){ ?>
                                                            <input type="file" data-type="file" class="contact_form_custom_value" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label);?>][placeholder]" value="<?php echo esc_attr($cutom_field_val);?>" data-id="<?php echo esc_attr($label);?>" style="pointer-events: none;" />

                                                        <?php } else {
                                                            ?>
                                                            <input type="text" data-type="text" class="contact_form_custom_value" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label);?>][placeholder]" value="<?php echo esc_attr($cutom_field_val);?>"
                                                                   data-id="<?php echo esc_attr($label);?>" />
                                                        <?php }
                                                        ?>
                                                        <?php
                                                    }elseif( $field_dropdown == 'textarea' ) { ?>
                                                        <textarea name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label);?>][placeholder]" data-type="textarea" class="contact_form_custom_value" rows="5" cols="50" data-id="<?php echo esc_attr($label);?>" placeholder="<?php esc_html_e('Enter your Message','chaty');?>" ><?php echo esc_attr($cutom_field_val);?></textarea>
                                                        <?php
                                                    }elseif ($field_dropdown == 'textblock'){

//                                                        $settings = array(
//                                                            'media_buttons' => false,
//                                                            'wpautop' => false,
//                                                            'drag_drop_upload' => false,
//                                                            'textarea_name' => 'cht_social_Contact_Us[custom_fields]['.$label.'][placeholder]',
//                                                            'textarea_rows' => 4,
//                                                            'quicktags' => false,
//                                                            'editor_class' => 'contact_form_custom_value textblock_custom_editor',
//                                                            'tinymce' => array(
//                                                                'toolbar1' => 'bold, italic, underline, link, numlist bullist, forecolor, fontsizeselect',
//                                                                'toolbar2' => '',
//                                                                'toolbar3' => ''
//                                                            )
//                                                        );
//                                                        wp_editor(stripslashes($field['placeholder']), 'textblock_editor', $settings);
                                                        ?>
                                                        <textarea id="textblock_editor" class="contact_form_custom_value textblock_custom_editor" name="cht_social_Contact_Us[custom_fields][<?php echo esc_attr($label) ?>][placeholder]"><?php echo stripslashes($field['placeholder']) ?></textarea>
                                                        <?php
                                                    }else { ?>
                                                        <select name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label);?>][placeholder]" data-type="select" class="contact_form_custom_value" data-id="<?php echo esc_attr($label);?>">
                                                            <?php if(!empty($field['dropdown_placeholder'])) { ?>
                                                                <option value=""><?php echo esc_attr($field['dropdown_placeholder']); ?></option>
                                                            <?php } ?>
                                                            <?php if ( isset( $field['dropdown_option'] ) && !empty($field['dropdown_option']) ) :
                                                                foreach ( $field['dropdown_option'] as $option) :
                                                                    if ( $option == '' ) {
                                                                        continue;
                                                                    }
                                                                    echo "<option value=" . esc_html($option) . " >" . esc_html($option) . "</option>";
                                                                endforeach;
                                                            endif;
                                                            ?>
                                                        </select>
                                                        <?php
                                                    }
                                                    ?>
                                                    <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label) ?>][field_dropdown]" value="<?php echo esc_attr($field['field_dropdown']) ?>">
                                                </div>
                                                <div class="flex items-center space-x-3 flex-second">
                                                    <?php if($field_dropdown != 'textblock') { ?>
                                                    <div class="checkbox">
                                                        <label for="field_required_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" class="chaty-checkbox text-cht-gray-150 text-base flex items-center">
                                                            <input class="sr-only" type="checkbox" id="field_required_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[custom_fields][<?php echo esc_attr($label) ?>][is_required]" value="yes" <?php checked($field['is_required'], "yes") ?> />
                                                            <span class="mr-2"></span>
                                                            <?php esc_html_e("Required?", "chaty") ?>
                                                        </label>
                                                    </div>
                                                    <?php } ?>
                                                    <div id="setting_label<?php echo esc_attr($label) ?>" class="dropdown-setting-label" style="<?php echo ($field['field_dropdown'] != 'dropdown') ? "display: none" : "" ?>;">
                                                        <a class="flex items-center space-x-1.5 contact-form-dropdown-popup" href="javascript:;">
                                                <span>
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"> <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12.9332 9.99984C12.8444 10.2009 12.818 10.424 12.8572 10.6402C12.8964 10.8565 12.9995 11.056 13.1532 11.2132L13.1932 11.2532C13.3171 11.377 13.4155 11.5241 13.4826 11.6859C13.5497 11.8478 13.5842 12.0213 13.5842 12.1965C13.5842 12.3717 13.5497 12.5452 13.4826 12.7071C13.4155 12.869 13.3171 13.016 13.1932 13.1398C13.0693 13.2638 12.9223 13.3621 12.7604 13.4292C12.5986 13.4963 12.4251 13.5309 12.2498 13.5309C12.0746 13.5309 11.9011 13.4963 11.7392 13.4292C11.5774 13.3621 11.4303 13.2638 11.3065 13.1398L11.2665 13.0998C11.1094 12.9461 10.9098 12.843 10.6936 12.8038C10.4773 12.7646 10.2542 12.7911 10.0532 12.8798C9.85599 12.9643 9.68782 13.1047 9.56937 13.2835C9.45092 13.4624 9.38736 13.672 9.3865 13.8865V13.9998C9.3865 14.3535 9.24603 14.6926 8.99598 14.9426C8.74593 15.1927 8.40679 15.3332 8.05317 15.3332C7.69955 15.3332 7.36041 15.1927 7.11036 14.9426C6.86031 14.6926 6.71984 14.3535 6.71984 13.9998V13.9398C6.71467 13.7192 6.64325 13.5052 6.51484 13.3256C6.38644 13.1461 6.20699 13.0094 5.99984 12.9332C5.79876 12.8444 5.57571 12.818 5.35944 12.8572C5.14318 12.8964 4.94362 12.9995 4.7865 13.1532L4.7465 13.1932C4.62267 13.3171 4.47562 13.4155 4.31376 13.4826C4.15189 13.5497 3.97839 13.5842 3.80317 13.5842C3.62795 13.5842 3.45445 13.5497 3.29258 13.4826C3.13072 13.4155 2.98367 13.3171 2.85984 13.1932C2.73587 13.0693 2.63752 12.9223 2.57042 12.7604C2.50332 12.5986 2.46879 12.4251 2.46879 12.2498C2.46879 12.0746 2.50332 11.9011 2.57042 11.7392C2.63752 11.5774 2.73587 11.4303 2.85984 11.3065L2.89984 11.2665C3.05353 11.1094 3.15663 10.9098 3.19584 10.6936C3.23505 10.4773 3.20858 10.2542 3.11984 10.0532C3.03533 9.85599 2.89501 9.68782 2.71615 9.56937C2.53729 9.45092 2.32769 9.38736 2.11317 9.3865H1.99984C1.64622 9.3865 1.30708 9.24603 1.05703 8.99598C0.80698 8.74593 0.666504 8.40679 0.666504 8.05317C0.666504 7.69955 0.80698 7.36041 1.05703 7.11036C1.30708 6.86031 1.64622 6.71984 1.99984 6.71984H2.05984C2.2805 6.71467 2.49451 6.64325 2.67404 6.51484C2.85357 6.38644 2.99031 6.20699 3.0665 5.99984C3.15525 5.79876 3.18172 5.57571 3.14251 5.35944C3.10329 5.14318 3.00019 4.94362 2.8465 4.7865L2.8065 4.7465C2.68254 4.62267 2.58419 4.47562 2.51709 4.31376C2.44999 4.15189 2.41545 3.97839 2.41545 3.80317C2.41545 3.62795 2.44999 3.45445 2.51709 3.29258C2.58419 3.13072 2.68254 2.98367 2.8065 2.85984C2.93033 2.73587 3.07739 2.63752 3.23925 2.57042C3.40111 2.50332 3.57462 2.46879 3.74984 2.46879C3.92506 2.46879 4.09856 2.50332 4.26042 2.57042C4.42229 2.63752 4.56934 2.73587 4.69317 2.85984L4.73317 2.89984C4.89029 3.05353 5.08985 3.15663 5.30611 3.19584C5.52237 3.23505 5.74543 3.20858 5.9465 3.11984H5.99984C6.19702 3.03533 6.36518 2.89501 6.48363 2.71615C6.60208 2.53729 6.66565 2.32769 6.6665 2.11317V1.99984C6.6665 1.64622 6.80698 1.30708 7.05703 1.05703C7.30708 0.80698 7.64621 0.666504 7.99984 0.666504C8.35346 0.666504 8.6926 0.80698 8.94264 1.05703C9.19269 1.30708 9.33317 1.64622 9.33317 1.99984V2.05984C9.33402 2.27436 9.39759 2.48395 9.51604 2.66281C9.63449 2.84167 9.80266 2.98199 9.99984 3.0665C10.2009 3.15525 10.424 3.18172 10.6402 3.14251C10.8565 3.10329 11.056 3.00019 11.2132 2.8465L11.2532 2.8065C11.377 2.68254 11.5241 2.58419 11.6859 2.51709C11.8478 2.44999 12.0213 2.41545 12.1965 2.41545C12.3717 2.41545 12.5452 2.44999 12.7071 2.51709C12.869 2.58419 13.016 2.68254 13.1398 2.8065C13.2638 2.93033 13.3621 3.07739 13.4292 3.23925C13.4963 3.40111 13.5309 3.57462 13.5309 3.74984C13.5309 3.92506 13.4963 4.09856 13.4292 4.26042C13.3621 4.42229 13.2638 4.56934 13.1398 4.69317L13.0998 4.73317C12.9461 4.89029 12.843 5.08985 12.8038 5.30611C12.7646 5.52237 12.7911 5.74543 12.8798 5.9465V5.99984C12.9643 6.19702 13.1047 6.36518 13.2835 6.48363C13.4624 6.60208 13.672 6.66565 13.8865 6.6665H13.9998C14.3535 6.6665 14.6926 6.80698 14.9426 7.05703C15.1927 7.30708 15.3332 7.64621 15.3332 7.99984C15.3332 8.35346 15.1927 8.6926 14.9426 8.94264C14.6926 9.19269 14.3535 9.33317 13.9998 9.33317H13.9398C13.7253 9.33402 13.5157 9.39759 13.3369 9.51604C13.158 9.63449 13.0177 9.80266 12.9332 9.99984V9.99984Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path> </svg>
                                                </span>
                                                            <span>Settings</span>
                                                        </a>
                                                    </div>
                                                    <div class="custom-field-remove">
                                            <span class="custom-stickyelement-delete" delete-id="<?php echo esc_attr($label) ?>">
                                                <i class="fas fa-trash-alt stickyelement-delete"></i>
                                            </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <?php if($field['field_dropdown'] == 'dropdown') { ?>
                                            <div class="chaty-popup contact-form-dropdown-open contact-form-setting-popup-open">
                                                <div class="chaty-popup-outer"></div>
                                                <div class="chaty-popup-inner popup-pos-bottom">
                                                    <div class="chaty-popup-content">
                                                        <div class="chaty-popup-close">
                                                            <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn right-2 top-2 relative">
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                                                            </a>
                                                        </div>
                                                        <div class="a-card a-card--normal">
                                                            <div class="chaty-popup-header text-left font-primary text-cht-gray-150 font-medium p-5 relative">Add Option</div>
                                                            <div class="chaty-popup-body text-cht-gray-150 text-base px-5 py-6">
                                                                <div class="contact-form-dropdown-main">
                                                                    <input type="text" name="cht_social_Contact_Us[custom_fields][<?php echo esc_attr($label) ?>][dropdown_placeholder]" class="contact-form-dropdown-select" value="<?php echo esc_attr($field['dropdown_placeholder']) ?>" placeholder="Select...">
                                                                    <div class="contact-form-dropdown-option ui-sortable">
                                                                        <div class="option-value-field ui-sortable-handle">
                                                                            <input type="text" data-id="<?php echo esc_attr($label) ?>" name="cht_social_Contact_Us[custom_fields][<?php echo esc_attr($label) ?>][dropdown_option][]" value="">
                                                                            <span class="add-customfield-dropdown-option" data-field="<?php echo esc_attr($label) ?>">Add</span>
                                                                        </div>
                                                                        <?php if ( isset( $field['dropdown_option'] ) && !empty($field['dropdown_option']) ) :
                                                                            foreach ( $field['dropdown_option'] as $option) :
                                                                                if ( $option == '' ) {
                                                                                    continue;
                                                                                }
                                                                                ?>
                                                                                <div class="option-value-field">
                                                                                    <span class="move-icon"></span>
                                                                                    <input type="text" data-id="<?php echo esc_attr($label) ?>" name="cht_social_Contact_Us[custom_fields][<?php echo esc_attr($label);?>][dropdown_option][]" value="<?php echo esc_attr( $option );?>"/>
                                                                                    <span class="delete-dropdown-option"><i class="fas fa-times"></i></span>
                                                                                </div>
                                                                            <?php
                                                                            endforeach;
                                                                        endif;?>
                                                                    </div>
                                                                </div>
                                                                <span class="contact-form-dropdfown-close"><i class="fas fa-times"></i></span>
                                                            </div>
                                                            <div class="chaty-popup-footer flex px-5">
                                                                <button type="button" class="btn rounded-lg btn-dropdown-save">Save</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        <?php } ?>
                                    </div>

                                    <?php
                                }
                            }
                        }
                        foreach ($fields as $label => $field) {
                            $fieldLabel = isset($value[$label]['field_label']) && !empty($value[$label]['field_label']) ? $value[$label]['field_label'] : $field['title'];
                            if($field['title'] == $orderValue) {
                            $saved_value = isset($value[$label]) ? $value[$label] : [];
                            $field_value = [
                                'is_active'   => (isset($saved_value['is_active'])) ? $saved_value['is_active'] : 'yes',
                                'is_required' => (isset($saved_value['is_required'])) ? $saved_value['is_required'] : 'yes',
                                'placeholder' => (isset($saved_value['placeholder'])) ? $saved_value['placeholder'] : $field['placeholder'],
                                'field_label' => (isset($saved_value['field_label'])) ? $saved_value['field_label'] : $field['title'],
                            ];
                            ?>
                            <div class="field-setting-col mt-2.5 <?php echo ($field_value['is_active'] == "yes") ? "" : "hide-label-setting" ?>" data-title="<?php echo esc_attr($field['title']) ?>" data-order="<?php echo esc_attr($orderValue) ?>">
                                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][is_active]" value="no">
                                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][is_required]" value="no">

                                <div class="label-flex mb-4">
                                    <label class="chaty-switch chaty-switch-toggle text-cht-gray-150 text-base" for="field_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>">
                                        <input type="checkbox" class="chaty-field-setting" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][is_active]" id="field_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" value="yes" <?php checked($field_value['is_active'], "yes") ?>>
                                        <div class="chaty-slider round"></div>
                                        <span class="field-label"><?php echo esc_attr($field_value['field_label']) ?>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_8719_30645)">
                                                    <path d="M7.33398 2.66699H2.66732C2.3137 2.66699 1.97456 2.80747 1.72451 3.05752C1.47446 3.30756 1.33398 3.6467 1.33398 4.00033V13.3337C1.33398 13.6873 1.47446 14.0264 1.72451 14.2765C1.97456 14.5265 2.3137 14.667 2.66732 14.667H12.0006C12.3543 14.667 12.6934 14.5265 12.9435 14.2765C13.1935 14.0264 13.334 13.6873 13.334 13.3337V8.66699" stroke="#C6D7E3" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M12.334 1.66617C12.5992 1.40095 12.9589 1.25195 13.334 1.25195C13.7091 1.25195 14.0688 1.40095 14.334 1.66617C14.5992 1.93138 14.7482 2.29109 14.7482 2.66617C14.7482 3.04124 14.5992 3.40095 14.334 3.66617L8.00065 9.9995L5.33398 10.6662L6.00065 7.9995L12.334 1.66617Z" stroke="#C6D7E3" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_8719_30645">
                                                        <rect width="16" height="16" fill="white"/>
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        </span>
                                    </label>
                                    <div class="label-input">
                                        <input type="text" class="label-input-field chaty-input-text contact-form-field-text" value="<?php echo esc_attr($field_value['field_label']) ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][field_label]" />
                                    </div>
                                    <div class="sort-contact-form-field"><img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/move-icon.png") ?>" alt="Move Icon"/></div>
                                </div>
                                <div class="field-settings <?php echo ($field_value['is_active'] == "yes") ? "active" : "" ?>">
                                    <div class="chaty-setting-col sm:grid grid-cols-2 items-center gap-3">
                                        <div>
                                            <input class="rounded-lg w-full chaty-input-text contact_form_custom_value" data-type="<?php echo esc_attr($field['type']) ?>" id="placeholder_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][placeholder]" value="<?php echo esc_attr($field_value['placeholder']) ?>" >
                                        </div>
                                        <div class="flex items-center space-x-3">
                                            <div class="checkbox">
                                                <label for="field_required_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" class="chaty-checkbox text-cht-gray-150 text-base flex items-center">
                                                    <input class="sr-only" type="checkbox" id="field_required_for_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($label) ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[<?php echo esc_attr($label) ?>][is_required]" value="yes" <?php checked($field_value['is_required'], "yes") ?> />
                                                    <span class="mr-2"></span>
                                                    <?php esc_html_e("Required?", "chaty") ?>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php if ($label != 'message') { ?>
                                <!--                    <div class="chaty-separator mt-2.5"></div>-->
                            <?php } ?>
                        <?php } }//end foreach
                    }
                    }
                    echo '</div>'; ?>
                <?php } ?>
            </div>

        </div>
        <?php if ($social['slug'] == 'Contact_Us') { ?>
            <div class="custom-field-setting chaty-contact-form-field-option">
                <a class="flex items-center space-x-1.5 add-custom-field" href="javascript:;" data-isactive="<?php echo ( !$is_pro ) ? "0" : "1" ; ?>" data-active-page-url = "<?php echo ( !$is_pro ) ? esc_url($this->getUpgradeMenuItemUrl()) : '' ; ?>">
                    <span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M10 6V14M6 10H14M5.8 19H14.2C15.8802 19 16.7202 19 17.362 18.673C17.9265 18.3854 18.3854 17.9265 18.673 17.362C19 16.7202 19 15.8802 19 14.2V5.8C19 4.11984 19 3.27976 18.673 2.63803C18.3854 2.07354 17.9265 1.6146 17.362 1.32698C16.7202 1 15.8802 1 14.2 1H5.8C4.11984 1 3.27976 1 2.63803 1.32698C2.07354 1.6146 1.6146 2.07354 1.32698 2.63803C1 3.27976 1 4.11984 1 5.8V14.2C1 15.8802 1 16.7202 1.32698 17.362C1.6146 17.9265 2.07354 18.3854 2.63803 18.673C3.27976 19 4.11984 19 5.8 19Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>
                    </span>
                    <span>Add Custom Field</span>
                </a>
            </div>
        <?php } ?>

        <?php if ($social['slug'] == "Whatsapp" || $social['slug'] == "Link" || $social['slug'] == "Custom_Link" || $social['slug'] == "Custom_Link_3" || $social['slug'] == "Custom_Link_4" || $social['slug'] == "Custom_Link_5") { ?>
            <div class="Whatsapp-settings advanced-settings extra-chaty-settings">
                <?php $embedded_window = isset($value['embedded_window']) ? $value['embedded_window'] : "no"; ?>
                <div class="chaty-setting-col">
                    <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[embedded_window]" value="no" >
                    <label class="chaty-switch chaty-embedded-window font-primary text-cht-gray-150 mt-2" for="whatsapp_embedded_window_<?php echo esc_attr($social['slug']); ?>">
                        <input type="checkbox" class="embedded_window-checkbox" name="cht_social_<?php echo esc_attr($social['slug']); ?>[embedded_window]" id="whatsapp_embedded_window_<?php echo esc_attr($social['slug']); ?>" value="yes" <?php checked($embedded_window, "yes") ?> >
                        <div class="chaty-slider round"></div>
                        <?php esc_html_e("Enable WhatsApp Chat Widget &#128172;", "chaty") ?>
                        <div class="html-tooltip top">
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                            <span class="tooltip-text top">
                                <?php esc_html_e("Engage visitors with a WhatsApp-style chat window with a welcome message. Visitors can start conversations by typing messages and  clicking on 'Send' will redirect them to WhatsApp.", "chaty") ?>
                                <img alt="chaty" src="<?php echo esc_url(CHT_PLUGIN_URL) ?>/admin/assets/images/chaty-wa-widget-ez.gif" loading="lazy"/>
                            </span>
                        </div>
                    </label>
                </div>
                <!-- advance setting for Whatsapp -->
                <div class="whatsapp-welcome-message mt-4 <?php echo ($embedded_window == "yes") ? "active" : "" ?>">
                    <div class="chaty-setting-col">
                        <label class="text-base text-cht-gray-150" style="display: block; width: 100%" for="cht_social_embedded_message_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Welcome message", "chaty") ?></label>
                        <div class="w-full">
                            <div class="w-full">
                                <?php $unique_id = uniqid(); ?>
                                <?php $embedded_message = isset($value['embedded_message']) ? $value['embedded_message'] : esc_html__("How can I help you? :)", "chaty"); ?>
                                <textarea class="chaty-setting-textarea chaty-whatsapp-setting-textarea" data-id="<?php echo esc_attr($unique_id) ?>" id="cht_social_embedded_message_<?php echo esc_attr($unique_id) ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[embedded_message]" ><?php echo esc_textarea($embedded_message) ?></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="chaty-setting-col mt-4 hide-prefilled-setting">
                        <?php $is_default_open = isset($value['is_default_open']) ? $value['is_default_open'] : "no"; ?>
                        <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_default_open]" value="no" >
                        <label class="chaty-switch text-base font-primary text-cht-gray-150" for="whatsapp_default_open_embedded_window_<?php echo esc_attr($social['slug']); ?>">
                            <input type="checkbox" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_default_open]" id="whatsapp_default_open_embedded_window_<?php echo esc_attr($social['slug']); ?>" value="yes" <?php checked($is_default_open, "yes") ?> >
                            <div class="chaty-slider round"></div>
                            <span class="text-cht-gray-150">
                                <?php esc_html_e("Open the chat widget on page load", "chaty") ?>
                            </span>
                            <span class="icon label-tooltip" data-title="<?php esc_html_e("Open the WhatsApp chat popup on page load, after the user sends a message or closes the window, the window will stay closed to avoid disruption", "chaty") ?>">
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                            </span>
                        </label>
                    </div>
                    <div class="sm:flex sm:items-center sm:space-x-3 mt-4">
                        <?php $wp_popup_headline = isset($value['wp_popup_headline']) ? $value['wp_popup_headline'] : esc_html__("Let's chat on WhatsApp","chaty") ?>
                        <div class="chaty-setting-col inline-options">
                            <label class="font-primary text-base text-cht-gray-150 sm:w-44">
                                <?php esc_html_e("Headline", "chaty") ?>
                            </label>
                            <div>
                                <input type="text" id="wp_popup_headline" name="cht_social_<?php echo esc_attr($social['slug']); ?>[wp_popup_headline]" value="<?php echo esc_attr($wp_popup_headline) ?>">
                            </div>
                        </div>
                        <div class="chaty-setting-col inline-options">
                            <?php
                            $wp_popup_head_bg_color = isset($value['wp_popup_head_bg_color']) ? $value['wp_popup_head_bg_color'] : "#4AA485";
                            $wp_popup_head_bg_color = $this->validate_color($wp_popup_head_bg_color, "#4AA485");
                            ?>
                            <label class="font-primary text-base text-cht-gray-150 sm:w-44">
                                <?php esc_html_e("Header Background", "chaty") ?>
                            </label>
                            <div>
                                <input type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[wp_popup_head_bg_color]" class="chaty-color-field button-color" value="<?php echo esc_attr($wp_popup_head_bg_color) ?>" />
                            </div>
                        </div>
                    </div>

                    <div class="hide-prefilled-setting">
                        <?php $wp_popup_nickname = isset($value['wp_popup_nickname']) ? $value['wp_popup_nickname'] : "" ?>
                        <div class="sm:flex sm:items-center sm:space-x-3 mt-4">
                            <div class="chaty-setting-col inline-options">
                                <label class="font-primary text-base text-cht-gray-150 sm:w-44">
                                    <?php esc_html_e("Nickname", "chaty") ?>
                                </label>
                                <div>
                                    <input type="text" id="wp_popup_nickname" placeholder="Micheal" name="cht_social_<?php echo esc_attr($social['slug']); ?>[wp_popup_nickname]" value="<?php echo esc_attr($wp_popup_nickname) ?>">
                                </div>
                            </div>
                        </div>
                        <?php $wp_popup_profile = isset($value['wp_popup_profile']) ? $value['wp_popup_profile'] : "" ?>
                        <div class="chaty-setting-col sm:flex sm:items-center sm:space-x-3 mt-4">
                            <div class="chaty-setting-col">
                                <label class="font-primary text-base text-cht-gray-150 sm:w-44">
                                    <?php esc_html_e("Add a profile image", "chaty") ?>
                                </label>
                                <div class="sm:flex sm:items-center custom-img-upload <?php echo esc_attr(!empty($wp_popup_profile)?"active":"") ?>" id="<?php echo esc_attr($social['slug']); ?>-custom-image-upload">
                                    <div class="image-info">
                                        <?php if(!empty($wp_popup_profile)) { ?>
                                            <img src="<?php echo esc_url($wp_popup_profile) ?>" alt="<?php esc_html_e("Profile image", "chaty"); ?>" />
                                        <?php } ?>
                                    </div>
                                    <a href="javascript:;" class="upload-chaty-icon flex items-center px-2 upload-wp-profile bg-white img-upload-btn" data-for="<?php echo esc_attr($social['slug']); ?>">
                                        <?php esc_html_e('Upload Image', 'chaty') ?>
                                    </a>
                                    <a href="javascript:;" class="remove-custom-img bg-white" data-for="<?php echo esc_attr($social['slug']); ?>">
                                        <?php esc_html_e('Remove', 'chaty') ?>
                                    </a>
                                    <input class="img-value" type="hidden" id="wp_popup_profile" name="cht_social_<?php echo esc_attr($social['slug']); ?>[wp_popup_profile]" value="<?php echo esc_attr($wp_popup_profile) ?>">
                                </div>
                            </div>
                        </div>
                        <?php $input_placeholder = isset($value['input_placeholder']) ? $value['input_placeholder'] : esc_html__("Write your message...","chaty") ?>
                        <div class="sm:flex sm:items-center sm:space-x-3 mt-4">
                            <div class="chaty-setting-col inline-options">
                                <label class="font-primary text-base text-cht-gray-150 sm:w-44">
                                    <?php esc_html_e("Text input placeholder", "chaty") ?>
                                </label>
                                <div>
                                    <input type="text" class="whatsapp-placeholder" id="input_placeholder_<?php echo esc_attr($social['slug']); ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[input_placeholder]" value="<?php echo esc_attr($input_placeholder) ?>">
                                </div>
                            </div>
                        </div>
                        <div class="chaty-setting-col mt-4">
                            <?php $emoji_picker= isset($value['emoji_picker']) ? $value['emoji_picker'] : "yes"; ?>
                            <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[emoji_picker]" value="no" >
                            <label class="chaty-switch text-base font-primary text-cht-gray-150" for="whatsapp_emoji_picker_<?php echo esc_attr($social['slug']); ?>">
                                <input type="checkbox" class="whatsapp-emoji" name="cht_social_<?php echo esc_attr($social['slug']); ?>[emoji_picker]" id="whatsapp_emoji_picker_<?php echo esc_attr($social['slug']); ?>" value="yes" <?php checked($emoji_picker, "yes") ?> >
                                <div class="chaty-slider round"></div>
                                <span class="text-cht-gray-150">
                                    <?php esc_html_e("Enable emoji picker", "chaty") ?>
                                </span>

                                <div class="html-tooltip top">
                                    <span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </span>
                                    <span class="tooltip-text top">
                                        <?php esc_html_e("Allow visitors to pick emoji from the emoji picker and enter them into the message input field", "chaty") ?>
                                        <img alt="chaty" src="<?php echo esc_url(CHT_PLUGIN_URL) ?>/admin/assets/images/chaty-emoji.png" loading="lazy"/>
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        <?php }//end if
        ?>

        <!-- device/agent/settings -->
        <div class="device-agent-settings mt-2">
            <div class="channels__device-box ml-2 chaty-setting-col sm:flex items-center space-y-2 sm:space-y-0 sm:space-x-3 mr-2">
                <label class="font-primary text-base text-cht-gray-150"><?php esc_html_e("Show on", "chaty") ?></label>
                <div class="device-box">
                    <?php
                    $slug       = esc_attr($this->del_space($social['slug']));
                    $slug       = str_replace(' ', '_', $slug);
                    $is_desktop = isset($value['is_desktop']) && $value['is_desktop'] == "checked" ? "checked" : '';
                    $is_mobile  = isset($value['is_mobile']) && $value['is_mobile'] == "checked" ? "checked" : '';
                    ?>
                    <!-- setting for desktop -->
                    <label class="device_view cursor-pointer" for="<?php echo esc_attr($slug); ?>Desktop">
                        <input type="checkbox" id="<?php echo esc_attr($slug); ?>Desktop" class="channels__view-check sr-only js-chanel-icon js-chanel-desktop" data-type="<?php echo esc_attr(str_replace(' ', '_', strtolower(esc_attr($this->del_space($social['slug']))))); ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_desktop]" value="checked" data-gramm_editor="false" <?php echo esc_attr($is_desktop) ?> />
                        <span class="device-view-txt">
                            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.3333 10.0001C14.0667 10.0001 14.6667 9.40008 14.6667 8.66675V2.00008C14.6667 1.26675 14.0667 0.666748 13.3333 0.666748H2.66667C1.93333 0.666748 1.33333 1.26675 1.33333 2.00008V8.66675C1.33333 9.40008 1.93333 10.0001 2.66667 10.0001H0.666667C0.3 10.0001 0 10.3001 0 10.6667C0 11.0334 0.3 11.3334 0.666667 11.3334H15.3333C15.7 11.3334 16 11.0334 16 10.6667C16 10.3001 15.7 10.0001 15.3333 10.0001H13.3333ZM3.33333 2.00008H12.6667C13.0333 2.00008 13.3333 2.30008 13.3333 2.66675V8.00008C13.3333 8.36675 13.0333 8.66675 12.6667 8.66675H3.33333C2.96667 8.66675 2.66667 8.36675 2.66667 8.00008V2.66675C2.66667 2.30008 2.96667 2.00008 3.33333 2.00008Z" />
                            </svg>
                        </span>
                        <span class="device-tooltip">
                            <span class="on"><?php esc_html_e("Hide on desktop", "chaty") ?></span>
                            <span class="off"><?php esc_html_e("Show on desktop", "chaty") ?></span>
                        </span>
                    </label>

                    <!-- setting for mobile -->
                    <label class="device_view cursor-pointer" for="<?php echo esc_attr($slug); ?>Mobile">
                        <input type="checkbox" id="<?php echo esc_attr($slug); ?>Mobile" class="channels__view-check sr-only js-chanel-icon js-chanel-mobile" data-type="<?php echo esc_attr(str_replace(' ', '_', strtolower(esc_attr($this->del_space($social['slug']))))); ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_mobile]" value="checked" data-gramm_editor="false" <?php echo esc_attr($is_mobile) ?> >
                        <span class="device-view-txt">
                            <svg width="9" height="16" viewBox="0 0 9 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.33301 0.666748H1.99967C1.07967 0.666748 0.333008 1.41341 0.333008 2.33341V13.6667C0.333008 14.5867 1.07967 15.3334 1.99967 15.3334H7.33301C8.25301 15.3334 8.99967 14.5867 8.99967 13.6667V2.33341C8.99967 1.41341 8.25301 0.666748 7.33301 0.666748ZM4.66634 14.6667C4.11301 14.6667 3.66634 14.2201 3.66634 13.6667C3.66634 13.1134 4.11301 12.6667 4.66634 12.6667C5.21967 12.6667 5.66634 13.1134 5.66634 13.6667C5.66634 14.2201 5.21967 14.6667 4.66634 14.6667ZM7.66634 12.0001H1.66634V2.66675H7.66634V12.0001Z" />
                            </svg>
                        </span>
                        <span class="device-tooltip">
                            <span class="on"><?php esc_html_e("Hide on mobile", "chaty") ?></span>
                            <span class="off"><?php esc_html_e("Show on mobile", "chaty") ?></span>
                        </span>
                    </label>
                </div>
            </div>

            <?php if ($this->is_pro()) { ?>
                <?php if ($slug != 'Custom_Link' && $slug != 'Custom_Link_3' && $slug != 'Custom_Link_4' && $slug != 'Custom_Link_5' && $slug != 'Contact_Us' && $slug != 'Link') { ?>
                    <div class="channels__agent-box header-tooltip-show">
                        <a href="#" class="agent-button-action">
                            <svg class="inline" width="14" height="12" viewBox="0 0 14 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.25 5.14286C6.69975 5.14286 7.875 3.99159 7.875 2.57143C7.875 1.15127 6.69975 0 5.25 0C3.80025 0 2.625 1.15127 2.625 2.57143C2.625 3.99159 3.80025 5.14286 5.25 5.14286Z" fill="currentColor"/>
                                <path d="M5.25 6.85714C8.1495 6.85714 10.5 9.15968 10.5 12H0C0 9.15968 2.35051 6.85714 5.25 6.85714Z" fill="currentColor"/>
                                <path d="M12.25 3.42857C12.25 2.95518 11.8582 2.57143 11.375 2.57143C10.8918 2.57143 10.5 2.95518 10.5 3.42857V4.28571H9.625C9.14175 4.28571 8.75 4.66947 8.75 5.14286C8.75 5.61624 9.14175 6 9.625 6H10.5V6.85714C10.5 7.33053 10.8918 7.71429 11.375 7.71429C11.8582 7.71429 12.25 7.33053 12.25 6.85714V6H13.125C13.6082 6 14 5.61624 14 5.14286C14 4.66947 13.6082 4.28571 13.125 4.28571H12.25V3.42857Z" fill="currentColor"/>
                            </svg> <?php esc_html_e("Add Agents", "chaty"); ?>
                        </a>
                        <span class="header-tooltip">
                            <span class="header-tooltip-text text-center"><a target='_blank' class='infotip-link' href='https://premio.io/help/chaty/how-to-use-chaty-with-different-agents/'><?php esc_html_e("Interesting ways to use Agents functionality", "chaty") ?></a></span>
                            <span class="ml-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </span>
                        </span>
                    </div>
                <?php } else { ?>
                    <div class="channels__agent-box transparent hidden header-tooltip-show">
                        <a href="#" class="agent-button-action">
                            <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.25 5.14286C6.69975 5.14286 7.875 3.99159 7.875 2.57143C7.875 1.15127 6.69975 0 5.25 0C3.80025 0 2.625 1.15127 2.625 2.57143C2.625 3.99159 3.80025 5.14286 5.25 5.14286Z" fill="currentColor"/>
                                <path d="M5.25 6.85714C8.1495 6.85714 10.5 9.15968 10.5 12H0C0 9.15968 2.35051 6.85714 5.25 6.85714Z" fill="currentColor"/>
                                <path d="M12.25 3.42857C12.25 2.95518 11.8582 2.57143 11.375 2.57143C10.8918 2.57143 10.5 2.95518 10.5 3.42857V4.28571H9.625C9.14175 4.28571 8.75 4.66947 8.75 5.14286C8.75 5.61624 9.14175 6 9.625 6H10.5V6.85714C10.5 7.33053 10.8918 7.71429 11.375 7.71429C11.8582 7.71429 12.25 7.33053 12.25 6.85714V6H13.125C13.6082 6 14 5.61624 14 5.14286C14 4.66947 13.6082 4.28571 13.125 4.28571H12.25V3.42857Z" fill="currentColor"/>
                            </svg> <?php esc_html_e("Add Agents", "chaty"); ?>
                        </a>
                        <span class="header-tooltip">
                            <span class="header-tooltip-text text-center"><a target='_blank' class='infotip-link' href='https://premio.io/help/chaty/how-to-use-chaty-with-different-agents/'><?php esc_html_e("Interesting ways to use Agents functionality", "chaty") ?></a></span>
                            <span class="ml-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </span>
                        </span>
                    </div>
                <?php }//end if
                ?>
            <?php } else { ?>
                <?php if ($slug != 'Custom_Link' && $slug != 'Custom_Link_3' && $slug != 'Custom_Link_4' && $slug != 'Custom_Link_5' && $slug != 'Contact_Us' && $slug != 'Link') { ?>
                    <div class="channels__agent-box relative mr-2">
                        <a class="pro-button-wrap px-2" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                            <svg class="mr-1" width="14" height="12" viewBox="0 0 14 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.25 5.14286C6.69975 5.14286 7.875 3.99159 7.875 2.57143C7.875 1.15127 6.69975 0 5.25 0C3.80025 0 2.625 1.15127 2.625 2.57143C2.625 3.99159 3.80025 5.14286 5.25 5.14286Z" fill="currentColor"/>
                                <path d="M5.25 6.85714C8.1495 6.85714 10.5 9.15968 10.5 12H0C0 9.15968 2.35051 6.85714 5.25 6.85714Z" fill="currentColor"/>
                                <path d="M12.25 3.42857C12.25 2.95518 11.8582 2.57143 11.375 2.57143C10.8918 2.57143 10.5 2.95518 10.5 3.42857V4.28571H9.625C9.14175 4.28571 8.75 4.66947 8.75 5.14286C8.75 5.61624 9.14175 6 9.625 6H10.5V6.85714C10.5 7.33053 10.8918 7.71429 11.375 7.71429C11.8582 7.71429 12.25 7.33053 12.25 6.85714V6H13.125C13.6082 6 14 5.61624 14 5.14286C14 4.66947 13.6082 4.28571 13.125 4.28571H12.25V3.42857Z" fill="currentColor"/>
                            </svg>
                            <?php esc_html_e("Add Agents", "chaty"); ?>
                            <div class="pro-button">
                                <span class="pro-btn bg-cht-primary text-white hover:text-white h-full w-full rounded-md">
                                    <?php esc_html_e('Activate your key', 'chaty');?>
                                </span>
                            </div>
                        </a>
                    </div>
                <?php } else { ?>
                    <div class="channels__agent-box relative transparent hidden">
                        <a class="pro-button-wrap" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>" class="agent-button-action">
                            <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.25 5.14286C6.69975 5.14286 7.875 3.99159 7.875 2.57143C7.875 1.15127 6.69975 0 5.25 0C3.80025 0 2.625 1.15127 2.625 2.57143C2.625 3.99159 3.80025 5.14286 5.25 5.14286Z" fill="currentColor"/>
                                <path d="M5.25 6.85714C8.1495 6.85714 10.5 9.15968 10.5 12H0C0 9.15968 2.35051 6.85714 5.25 6.85714Z" fill="currentColor"/>
                                <path d="M12.25 3.42857C12.25 2.95518 11.8582 2.57143 11.375 2.57143C10.8918 2.57143 10.5 2.95518 10.5 3.42857V4.28571H9.625C9.14175 4.28571 8.75 4.66947 8.75 5.14286C8.75 5.61624 9.14175 6 9.625 6H10.5V6.85714C10.5 7.33053 10.8918 7.71429 11.375 7.71429C11.8582 7.71429 12.25 7.33053 12.25 6.85714V6H13.125C13.6082 6 14 5.61624 14 5.14286C14 4.66947 13.6082 4.28571 13.125 4.28571H12.25V3.42857Z" fill="currentColor"/>
                            </svg> <?php esc_html_e("Add Agents", "chaty"); ?>
                            <div class="pro-button">
                                <span class="pro-btn bg-cht-primary text-white hover:text-white h-full w-full rounded-md">
                                    <?php esc_html_e('Activate your key', 'chaty');?>
                                </span>
                            </div>
                        </a>
                    </div>
                <?php }//end if
                ?>
            <?php }//end if
            ?>

            <?php
            $close_class = "active";
            if ($social['slug'] == 'Contact_Us') {
                $setting_status = get_option("chaty_contact_us_setting");
                if ($setting_status === false) {
                    $close_class = "";
                }
            }
            ?>

            <!-- button for advance setting -->
            <div class="chaty-settings <?php echo esc_attr($close_class) ?>" data-nonce="<?php echo esc_attr(wp_create_nonce($social['slug']."-settings")) ?>" id="<?php echo esc_attr($social['slug']); ?>-close-btn" onclick="toggle_chaty_setting('<?php echo esc_attr($social['slug']); ?>')">
                <a class="flex items-center space-x-1.5" href="javascript:;">
                    <span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12.9332 9.99984C12.8444 10.2009 12.818 10.424 12.8572 10.6402C12.8964 10.8565 12.9995 11.056 13.1532 11.2132L13.1932 11.2532C13.3171 11.377 13.4155 11.5241 13.4826 11.6859C13.5497 11.8478 13.5842 12.0213 13.5842 12.1965C13.5842 12.3717 13.5497 12.5452 13.4826 12.7071C13.4155 12.869 13.3171 13.016 13.1932 13.1398C13.0693 13.2638 12.9223 13.3621 12.7604 13.4292C12.5986 13.4963 12.4251 13.5309 12.2498 13.5309C12.0746 13.5309 11.9011 13.4963 11.7392 13.4292C11.5774 13.3621 11.4303 13.2638 11.3065 13.1398L11.2665 13.0998C11.1094 12.9461 10.9098 12.843 10.6936 12.8038C10.4773 12.7646 10.2542 12.7911 10.0532 12.8798C9.85599 12.9643 9.68782 13.1047 9.56937 13.2835C9.45092 13.4624 9.38736 13.672 9.3865 13.8865V13.9998C9.3865 14.3535 9.24603 14.6926 8.99598 14.9426C8.74593 15.1927 8.40679 15.3332 8.05317 15.3332C7.69955 15.3332 7.36041 15.1927 7.11036 14.9426C6.86031 14.6926 6.71984 14.3535 6.71984 13.9998V13.9398C6.71467 13.7192 6.64325 13.5052 6.51484 13.3256C6.38644 13.1461 6.20699 13.0094 5.99984 12.9332C5.79876 12.8444 5.57571 12.818 5.35944 12.8572C5.14318 12.8964 4.94362 12.9995 4.7865 13.1532L4.7465 13.1932C4.62267 13.3171 4.47562 13.4155 4.31376 13.4826C4.15189 13.5497 3.97839 13.5842 3.80317 13.5842C3.62795 13.5842 3.45445 13.5497 3.29258 13.4826C3.13072 13.4155 2.98367 13.3171 2.85984 13.1932C2.73587 13.0693 2.63752 12.9223 2.57042 12.7604C2.50332 12.5986 2.46879 12.4251 2.46879 12.2498C2.46879 12.0746 2.50332 11.9011 2.57042 11.7392C2.63752 11.5774 2.73587 11.4303 2.85984 11.3065L2.89984 11.2665C3.05353 11.1094 3.15663 10.9098 3.19584 10.6936C3.23505 10.4773 3.20858 10.2542 3.11984 10.0532C3.03533 9.85599 2.89501 9.68782 2.71615 9.56937C2.53729 9.45092 2.32769 9.38736 2.11317 9.3865H1.99984C1.64622 9.3865 1.30708 9.24603 1.05703 8.99598C0.80698 8.74593 0.666504 8.40679 0.666504 8.05317C0.666504 7.69955 0.80698 7.36041 1.05703 7.11036C1.30708 6.86031 1.64622 6.71984 1.99984 6.71984H2.05984C2.2805 6.71467 2.49451 6.64325 2.67404 6.51484C2.85357 6.38644 2.99031 6.20699 3.0665 5.99984C3.15525 5.79876 3.18172 5.57571 3.14251 5.35944C3.10329 5.14318 3.00019 4.94362 2.8465 4.7865L2.8065 4.7465C2.68254 4.62267 2.58419 4.47562 2.51709 4.31376C2.44999 4.15189 2.41545 3.97839 2.41545 3.80317C2.41545 3.62795 2.44999 3.45445 2.51709 3.29258C2.58419 3.13072 2.68254 2.98367 2.8065 2.85984C2.93033 2.73587 3.07739 2.63752 3.23925 2.57042C3.40111 2.50332 3.57462 2.46879 3.74984 2.46879C3.92506 2.46879 4.09856 2.50332 4.26042 2.57042C4.42229 2.63752 4.56934 2.73587 4.69317 2.85984L4.73317 2.89984C4.89029 3.05353 5.08985 3.15663 5.30611 3.19584C5.52237 3.23505 5.74543 3.20858 5.9465 3.11984H5.99984C6.19702 3.03533 6.36518 2.89501 6.48363 2.71615C6.60208 2.53729 6.66565 2.32769 6.6665 2.11317V1.99984C6.6665 1.64622 6.80698 1.30708 7.05703 1.05703C7.30708 0.80698 7.64621 0.666504 7.99984 0.666504C8.35346 0.666504 8.6926 0.80698 8.94264 1.05703C9.19269 1.30708 9.33317 1.64622 9.33317 1.99984V2.05984C9.33402 2.27436 9.39759 2.48395 9.51604 2.66281C9.63449 2.84167 9.80266 2.98199 9.99984 3.0665C10.2009 3.15525 10.424 3.18172 10.6402 3.14251C10.8565 3.10329 11.056 3.00019 11.2132 2.8465L11.2532 2.8065C11.377 2.68254 11.5241 2.58419 11.6859 2.51709C11.8478 2.44999 12.0213 2.41545 12.1965 2.41545C12.3717 2.41545 12.5452 2.44999 12.7071 2.51709C12.869 2.58419 13.016 2.68254 13.1398 2.8065C13.2638 2.93033 13.3621 3.07739 13.4292 3.23925C13.4963 3.40111 13.5309 3.57462 13.5309 3.74984C13.5309 3.92506 13.4963 4.09856 13.4292 4.26042C13.3621 4.42229 13.2638 4.56934 13.1398 4.69317L13.0998 4.73317C12.9461 4.89029 12.843 5.08985 12.8038 5.30611C12.7646 5.52237 12.7911 5.74543 12.8798 5.9465V5.99984C12.9643 6.19702 13.1047 6.36518 13.2835 6.48363C13.4624 6.60208 13.672 6.66565 13.8865 6.6665H13.9998C14.3535 6.6665 14.6926 6.80698 14.9426 7.05703C15.1927 7.30708 15.3332 7.64621 15.3332 7.99984C15.3332 8.35346 15.1927 8.6926 14.9426 8.94264C14.6926 9.19269 14.3535 9.33317 13.9998 9.33317H13.9398C13.7253 9.33402 13.5157 9.39759 13.3369 9.51604C13.158 9.63449 13.0177 9.80266 12.9332 9.99984V9.99984Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span> 
                    <span><?php esc_html_e("Settings", "chaty") ?></span>
                </a>
            </div>
        </div>

        <!-- advance setting fields: start -->
        <?php $class_name = !$this->is_pro() ? "not-is-pro" : ""; ?>
        <div class="chaty-advance-settings <?php echo esc_attr($class_name); ?>" style="<?php echo (empty($close_class) && $social['slug'] == 'Contact_Us') ? "display:block" : ""; ?>">
            <div class="chaty-channel-setting space-y-4">
                <!-- Settings for custom icon and color -->
                <div class="chaty-setting-col sm:flex items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("Icon Appearance", "chaty") ?></label>
                    <div class="flex items-center">
                        <!-- input for custom color -->
                        <input type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[bg_color]" class="chaty-color-field chaty-bg-color" value="<?php echo esc_attr($value['bg_color']) ?>" />

                        <div class="flex items-center space-x-2">
                            <!-- button to upload custom image -->
                            <?php if ($this->is_pro()) { ?>
                                <!-- hidden input value for image -->
                                <input id="cht_social_image_<?php echo esc_attr($social['slug']); ?>" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[image_id]" value="<?php echo esc_attr($imageId) ?>" />

                                <a onclick="upload_chaty_image('<?php echo esc_attr($social['slug']); ?>')" href="javascript:;" class="upload-chaty-icon flex items-center px-2"><span class="dashicons dashicons-upload"></span> <span class="hidden sm:inline-block ml-1"><?php esc_html_e("Custom Image" ,"chaty") ?></span></a>

                                <div class="icon-picker-wrap" id="icon-picker-<?php echo esc_attr($social['slug']); ?>" data-slug="<?php echo esc_attr($social['slug']); ?>">
                                    <div id='select-icon-<?php echo esc_attr($social['slug']); ?>' class="select-icon">
                                        <span class="custom-icon">Change Icon</span>
                                    </div>
                                </div>
                            <?php } else { ?>
                                <div class="pro-features ml-2">
                                    <div class="pro-item">
                                        <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>" class="upload-chaty-icon flex items-center px-2"><span class="dashicons dashicons-upload"></span> <span class="hidden sm:inline-block ml-1"><?php esc_html_e("Custom Image" ,"chaty") ?></span></a>
                                    </div>
                                    <div class="pro-button">
                                        <a class="pro-btn bg-cht-primary text-white hover:text-white h-full w-full rounded-md" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>"><?php esc_html_e('Activate your key', 'chaty');?></a>
                                    </div>
                                </div>
                                <div class="pro-features">
                                    <div class="pro-item">
                                        <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>" class="upload-chaty-icon upload-icon inline-block px-2"><?php esc_html_e("Change Icon" ,"chaty") ?></a>
                                    </div>
                                    <div class="pro-button">
                                        <a target="_blank" class="pro-btn bg-cht-primary text-white hover:text-white h-full w-full rounded-md" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>"><?php esc_html_e('Activate your key', 'chaty');?></a>
                                    </div>
                                </div>
                            <?php }//end if
                            ?>
                        </div>

                    </div>
                </div>
                <div class="clear clearfix"></div>

                <?php if ($social['slug'] == "Link" || $social['slug'] == "Custom_Link" || $social['slug'] == "Custom_Link_3" || $social['slug'] == "Custom_Link_4" || $social['slug'] == "Custom_Link_5") {
                    $channel_type = "";
                    if (isset($value['channel_type'])) {
                        $channel_type = esc_attr(wp_unslash($value['channel_type']));
                    } else {
                        $channel_type = $social['slug'];
                    }

                    $socials = $this->socials;
                    ?>
                    <div class="chaty-setting-col sm:flex items-center sm:space-x-3">
                        <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("Channel type", "chaty") ?></label>
                        <div>
                            <!-- input for custom title -->
                            <select class="channel-select-input" name="cht_social_<?php echo esc_attr($social['slug']); ?>[channel_type]" value="<?php echo esc_attr($value['channel_type']) ?>">
                                <option value="<?php echo esc_attr($social['slug']) ?>"><?php esc_html_e("Custom channel" ,"chaty") ?></option>
                                <?php foreach ($socials as $social_icon) {
                                    $selected = ($social_icon['slug'] == $channel_type) ? "selected" : "";
                                    if ($social_icon['slug'] != 'Custom_Link' && $social_icon['slug'] != 'Link' && $social_icon['slug'] != 'Custom_Link_3' && $social_icon['slug'] != 'Custom_Link_4' && $social_icon['slug'] != 'Custom_Link_5' && $social_icon['slug'] != 'Contact_Us' && $social_icon['slug'] != 'Chatway') { ?>
                                        <option <?php echo esc_attr($selected) ?> value="<?php echo esc_attr($social_icon['slug']) ?>"><?php echo esc_attr($social_icon['title']) ?></option>
                                    <?php }
                                }?>
                            </select>
                        </div>
                    </div>
                    <div class="clear clearfix"></div>
                <?php }//end if
                ?>

                <!-- Settings for custom title -->
                <?php if ($social['slug'] != "WeChat") { ?>
                    <div class="chaty-setting-col sm:flex sm:items-center sm:space-x-3">
                        <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("On Hover Text", "chaty") ?>
                        <span class="header-tooltip">
                            <span class="header-tooltip-text text-center"><?php esc_html_e('The text that will appear next to your channel when a visitor hovers over it', 'chaty');?></span>
                            <span class="ml-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </span>
                        </span>
                        </label>
                        <div>
                            <!-- input for custom title -->
                            <input type="text" class="chaty-title" name="cht_social_<?php echo esc_attr($social['slug']); ?>[title]" value="<?php echo esc_attr($value['title']) ?>">
                        </div>
                    </div>
                <?php } ?>
                <?php $embedded_window = isset($value['embedded_window']) ? $value['embedded_window'] : "no"; ?>
                <div class="Whatsapp-settings advanced-settings">
                    <div class="chaty-setting-col sm:flex items-start space-y-2 sm:space-y-0 sm:space-x-3 hide-prefilled-setting <?php echo ($embedded_window == "yes") ? "" : "active"  ?>">
                        <label class="font-primary text-base text-cht-gray-150 sm:w-44" style="flex: 0 0 175px;">
                            <span><?php esc_html_e("Pre Set Message", "chaty") ?></span>
                            <span class="icon label-tooltip inline-tooltip" data-title="Add your own pre-set message that's automatically added to the user's message. You can also use merge tags and add the URL or the title of the current visitor's page. E.g. you can add the current URL of a product to the message so you know which product the visitor is talking about when the visitor messages you">
                                <span> 
                                    <svg xmlns="http://www.w3.org/2000/svg" class="inline-block" width="20" height="27" viewBox="0 0 20 20" fill="none">
                                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                            </span>
                        </label>
                        <div class="group-custom custom-input-tags relative">
                            <div class="pre-message-whatsapp">
                                <?php $pre_set_message = isset($value['pre_set_message']) ? $value['pre_set_message'] : ""; ?>
                                <input
                                    id="cht_social_message_<?php echo esc_attr($social['slug']); ?>_pre_set_message"
                                    type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[pre_set_message]"
                                    class="pre-set-message-whatsapp add-custom-tags chaty-input-text <?php echo esc_attr(!$this->is_pro() ? 'pointer-events-none': '') ?>"
                                    value="<?php echo esc_attr($pre_set_message) ?>"
                                    <?php echo esc_attr(!$this->is_pro() ? 'disabled': '') ?>
                                >
                                <button data-button="cht_social_message_<?php echo esc_attr($social['slug']); ?>" class="wp-pre-set-emoji" id="wp_pre_set_emoji" type="button">
                                    <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/icon-picker.png"); ?>" alt="icon picker">
                                </button>
                            </div>

                            <?php include "custom-tags.php" ?>
                            <?php if (!$this->is_pro()) : ?>
                                <div class="backdrop-blur-sm absolute left-0 top-0 w-full h-full opacity-0 group-custom-hover:opacity-100">
                                    <a
                                        class="bg-cht-primary focus:text-white text-base py-1.5 px-2 rounded-[4px] text-white hover:text-white text-center w-[208px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                        target="_blank"
                                        href="<?php echo esc_url($this->getUpgradeMenuItemUrl()); ?>">
                                        <?php esc_html_e('Activate your license key', 'chaty'); ?>
                                    </a>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <div class="SMS-settings advanced-settings">
                    <div class="chaty-setting-col sm:flex items-start space-y-2 sm:space-y-0 sm:space-x-3">
                        <label class="font-primary text-base text-cht-gray-150 sm:w-44" style="flex: 0 0 175px;">
                            <span><?php esc_html_e("Pre Set Message" ,"chaty") ?></span>
                            <span class="icon label-tooltip inline-tooltip" data-title="Add your own pre-set message that's automatically added to the user's message. You can also use merge tags and add the URL or the title of the current visitor's page. E.g. you can add the current URL of a product to the message so you know which product the visitor is talking about when the visitor messages you">
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="inline-block" width="20" height="27" viewBox="0 0 20 20" fill="none">
                                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                            </span>
                        </label>
                        <div class="group-custom custom-input-tags relative">
                            <div class="pre-message-whatsapp">
                                <?php $sms_pre_set_message = isset($value['sms_pre_set_message']) ? $value['sms_pre_set_message'] : ""; ?>
                                <input
                                        id="cht_social_message_<?php echo esc_attr($social['slug']); ?>_sms_pre_set_message"
                                        type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[sms_pre_set_message]"
                                        class="pre-set-message-whatsapp add-custom-tags <?php echo esc_attr(!$this->is_pro() ? 'pointer-events-none': '') ?>"
                                        value="<?php echo esc_attr($sms_pre_set_message) ?>"
                                    <?php echo esc_attr(!$this->is_pro() ? 'disabled': '') ?>
                                >
<!--                                <button data-button="cht_social_message_--><?php //echo esc_attr($social['slug']); ?><!--" type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10"></path><path d="M8 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 8 7M16 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 16 7M15.232 15c-.693 1.195-1.87 2-3.349 2-1.477 0-2.655-.805-3.347-2H15m3-2H6a6 6 0 1 0 12 0"></path></svg></button>-->
                            </div>

                            <?php include "custom-tags.php" ?>
                            <?php if (!$this->is_pro()) : ?>
                                <div class="backdrop-blur-sm absolute left-0 top-0 w-full h-full opacity-0 group-custom-hover:opacity-100">
                                    <a
                                            class="bg-cht-primary focus:text-white text-base py-1.5 px-2 rounded-[4px] text-white hover:text-white text-center w-[208px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                            target="_blank"
                                            href="<?php echo esc_url($this->getUpgradeMenuItemUrl()); ?>">
                                        <?php esc_html_e('Activate your license key', 'chaty'); ?>
                                    </a>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                <?php $use_whatsapp_web = isset($value['use_whatsapp_web']) ? $value['use_whatsapp_web'] : "yes"; ?>
                <?php $embedded_window = isset($value['embedded_window']) ? $value['embedded_window'] : "no"; ?>
                <div class="Whatsapp-settings advanced-settings use_whatsapp_web">
                    <div class="chaty-setting-col sm:flex items-center space-y-2 sm:space-y-0 sm:space-x-3 hide-prefilled-setting <?php echo ($embedded_window == "yes") ? "" : "active" ?>">
                        <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("Whatsapp Web" ,"chaty") ?>
                        <span class="header-tooltip">
                            <span class="header-tooltip-text text-center"><?php esc_html_e("If unchecked, visitors will be redirected to chat with you via the WhatsApp desktop app. Please note if they don't have it installed, they'll be redirected to WhatsApp Web", 'chaty');?></span>
                            <span class="ml-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </span>
                        </span>
                        </label>
                        <div>
                            <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[use_whatsapp_web]" value="no" />
                            <div class="flex items-center space-x-2">
                                <div class="checkbox">
                                    <label for="cht_social_<?php echo esc_attr($social['slug']); ?>_use_whatsapp_web" class="chaty-checkbox text-cht-gray-150 text-base">
                                        <input class="sr-only" type="checkbox" id="cht_social_<?php echo esc_attr($social['slug']); ?>_use_whatsapp_web" name="cht_social_<?php echo esc_attr($social['slug']); ?>[use_whatsapp_web]" value="yes" <?php echo checked($use_whatsapp_web, "yes") ?> />
                                        <span></span>
                                        <?php esc_html_e("Use Whatsapp Web directly on desktop", "chaty") ?>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <?php if ($social['slug'] == "Contact_Us") { ?>
                    <div class="Contact_Us-settings advanced-settings">
                        <div class="clear clearfix"></div>
                        <div class="form-field-setting-col my-3 space-y-4">
                            <div class="chaty-setting-col sm:flex sm:items-center sm:space-x-3">
                                <label class="font-primary text-cht-gray-150 text-base w-44"><?php esc_html_e("Contact Form Title", "chaty") ?></label>
                                <div>
                                    <?php $contact_form_title = isset($value['contact_form_title']) ? $value['contact_form_title'] : esc_html__("Contact Us", "chaty"); ?>
                                    <input class="chaty-input-text" id="cht_social_message_<?php echo esc_attr($social['slug']); ?>_form_title" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[contact_form_title]" value="<?php echo esc_attr($contact_form_title) ?>" >
                                </div>
                            </div>
                            <?php
                            $field_value = isset($value['contact_form_title_bg_color']) ? $value['contact_form_title_bg_color'] : "#A886CD";
                            $field_value = $this->validate_color($field_value, "#A886CD");
                            ?>
                            <div class="chaty-setting-col sm:flex sm:items-center sm:space-x-3">
                                <label class="font-primary text-base text-cht-gray-150 sm:w-44" for="title_bg_color_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Title background color", "chaty") ?></label>
                                <div>
                                    <input id="title_bg_color_for_<?php echo esc_attr($social['slug']); ?>" class="chaty-color-field button-color" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[contact_form_title_bg_color]" value="<?php echo esc_attr($field_value); ?>" >
                                </div>
                            </div>
                        </div>


                        <div class="form-field-setting-col my-3 space-y-4">
                            <div class="form-field-title"><?php esc_html_e("Submit Button", "chaty") ?></div>
                            <div class="color-box space-y-4">
                                <div class="clr-setting">
                                    <?php
                                    $field_value = isset($value['button_text_color']) ? $value['button_text_color'] : "#ffffff";
                                    $field_value = $this->validate_color($field_value, "#ffffff");
                                    ?>
                                    <div class="chaty-setting-col flex items-center space-x-3">
                                        <label class="font-primary text-base text-cht-gray-150 sm:w-44" for="button_text_color_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Text color", "chaty") ?></label>
                                        <div>
                                            <input id="button_text_color_for_<?php echo esc_attr($social['slug']); ?>" class="chaty-color-field button-color" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[button_text_color]" value="<?php echo esc_attr($field_value); ?>" >
                                        </div>
                                    </div>
                                </div>
                                <?php
                                $field_value = isset($value['button_bg_color']) ? $value['button_bg_color'] : "#A886CD";
                                $field_value = $this->validate_color($field_value, "#A886CD");
                                ?>
                                <div class="clr-setting">
                                    <div class="chaty-setting-col flex items-center space-x-3">
                                        <label class="font-primary text-base text-cht-gray-150 sm:w-44" for="button_bg_color_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Background color", "chaty") ?></label>
                                        <div>
                                            <input id="button_bg_color_for_<?php echo esc_attr($social['slug']); ?>" class="chaty-color-field button-color" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[button_bg_color]" value="<?php echo esc_attr($field_value); ?>" >
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php $field_value = isset($value['button_text']) ? $value['button_text'] : "Chat" ?>
                            <div class="chaty-setting-col sm:flex sm:items-center sm:space-x-3">
                                <label class="font-primary text-cht-gray-150 text-base w-44" for="button_text_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Button text", "chaty") ?></label>
                                <div>
                                    <input class="chaty-input-text" id="button_text_for_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[button_text]" value="<?php echo esc_attr($field_value); ?>" >
                                </div>
                            </div>
                            <?php $field_value = isset($value['thanks_message']) ? $value['thanks_message'] : "Your message was sent successfully" ?>
                            <div class="chaty-setting-col sm:flex sm:items-center sm:space-x-3">
                                <label class="font-primary text-cht-gray-150 text-base w-44" for="thanks_message_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Thank you message", "chaty") ?></label>
                                <div>
                                    <input class="chaty-input-text" id="thanks_message_for_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[thanks_message]" value="<?php echo esc_attr($field_value); ?>" >
                                </div>
                            </div>
                            <div class="chaty-separator"></div>
                            <?php $field_value = isset($value['redirect_action']) ? $value['redirect_action'] : "no" ?>
                            <div class="chaty-setting-col">
                                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[redirect_action]" value="no" >
                                <label class="chaty-switch flex items-center" for="redirect_action_<?php echo esc_attr($social['slug']); ?>">
                                    <input type="checkbox" class="chaty-redirect-setting" name="cht_social_<?php echo esc_attr($social['slug']); ?>[redirect_action]" id="redirect_action_<?php echo esc_attr($social['slug']); ?>" value="yes" <?php checked($field_value, "yes") ?> >
                                    <div class="chaty-slider round"></div>
                                    <span class="font-primary text-cht-gray-150 text-base"><?php esc_html_e("Redirect visitors after submission", "chaty") ?></span>
                                </label>
                            </div>
                            <div class="redirect_action-settings <?php echo ($field_value == "yes") ? "active" : "" ?>">
                                <?php $field_value = isset($value['redirect_link']) ? $value['redirect_link'] : "" ?>
                                <div class="chaty-setting-col">
                                    <label class="font-primary text-cht-gray-150" for="redirect_link_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Redirect link", "chaty") ?></label>
                                    <div class="mb-2">
                                        <input class="w-full" id="redirect_link_for_<?php echo esc_attr($social['slug']); ?>" placeholder="<?php echo esc_url(site_url("/")) ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[redirect_link]" value="<?php echo esc_attr($field_value); ?>" >
                                    </div>
                                </div>
                                <?php $field_value = isset($value['link_in_new_tab']) ? $value['link_in_new_tab'] : "no" ?>
                                <div class="chaty-setting-col">
                                    <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[link_in_new_tab]" value="no" >
                                    <label class="chaty-switch text-base text-cht-gray-150" for="link_in_new_tab_<?php echo esc_attr($social['slug']); ?>">
                                        <input type="checkbox" class="chaty-field-setting" name="cht_social_<?php echo esc_attr($social['slug']); ?>[link_in_new_tab]" id="link_in_new_tab_<?php echo esc_attr($social['slug']); ?>" value="yes" <?php checked($field_value, "yes") ?> >
                                        <div class="chaty-slider round"></div>
                                        <?php esc_html_e("Open in a new tab", "chaty") ?>
                                    </label>
                                </div>
                            </div>
                            <div class="chaty-separator"></div>
                            <?php $field_value = isset($value['close_form_after']) ? $value['close_form_after'] : "no" ?>
                            <div class="chaty-setting-col">
                                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[close_form_after]" value="no" >
                                <label class="chaty-switch flex items-center" for="close_form_after_<?php echo esc_attr($social['slug']); ?>">
                                    <input type="checkbox" class="chaty-close_form_after-setting" name="cht_social_<?php echo esc_attr($social['slug']); ?>[close_form_after]" id="close_form_after_<?php echo esc_attr($social['slug']); ?>" value="yes" <?php checked($field_value, "yes") ?> >
                                    <div class="chaty-slider round"></div>
                                    <span class="font-primary text-cht-gray-150 text-base"><?php esc_html_e("Close form automatically after submission", "chaty") ?></span>
                                    <span class="icon label-tooltip inline-message" data-title="<?php esc_html_e("Close the form automatically after a few seconds based on your choice", "chaty") ?>">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </span>
                                </label>
                            </div>
                            <div class="close_form_after-settings <?php echo ($field_value == "yes") ? "active" : "" ?>">
                                <?php $field_value = isset($value['close_form_after_seconds']) ? $value['close_form_after_seconds'] : "3" ?>
                                <div class="chaty-setting-col">
                                    <label class="font-primary text-cht-gray-150" for="close_form_after_seconds_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Close after (Seconds)", "chaty") ?></label>
                                    <div>
                                        <input class="w-full" id="close_form_after_seconds_<?php echo esc_attr($social['slug']); ?>" type="number" name="cht_social_<?php echo esc_attr($social['slug']); ?>[close_form_after_seconds]" value="<?php echo esc_attr($field_value); ?>" >
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-field-setting-col no-margin">
                            <input type="hidden" value="no" name="cht_social_<?php echo esc_attr($social['slug']); ?>[send_leads_in_email]" >
                            <input type="hidden" value="no" name="cht_social_<?php echo esc_attr($social['slug']); ?>[save_leads_locally]" >
                            <?php $field_value = isset($value['save_leads_locally']) ? $value['save_leads_locally'] : "yes" ?>
                            <div class="chaty-setting-col">
                                <label for="save_leads_locally_<?php echo esc_attr($social['slug']); ?>" class="full-width chaty-switch flex items-center text-cht-gray-150 text-base">
                                    <input type="checkbox" id="save_leads_locally_<?php echo esc_attr($social['slug']); ?>" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[save_leads_locally]" <?php checked($field_value, "yes") ?> >
                                    <div class="chaty-slider round"></div>
                                    Save leads to <a class="text-cht-primary underline" href="<?php echo esc_url(admin_url("admin.php?page=chaty-contact-form-feed")) ?>" target="_blank">this site</a>
                                    <div class="html-tooltip top no-position">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                        <span class="tooltip-text top">Your leads will be saved in your local database, you'll be able to find them <a target="_blank" href="<?php echo esc_url(admin_url("admin.php?page=chaty-contact-form-feed")) ?>">here</a></span>
                                    </div>
                                </label>
                            </div>
                            <?php $field_value = isset($value['send_leads_in_email']) ? $value['send_leads_in_email'] : "no" ?>
                            <div class="chaty-setting-col mt-3">
                                <label for="save_leads_to_email_<?php echo esc_attr($social['slug']); ?>" class="email-setting full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
                                    <input class="email-setting-field" type="checkbox" id="save_leads_to_email_<?php echo esc_attr($social['slug']); ?>" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[send_leads_in_email]" <?php checked($field_value, "yes") ?> <?php echo esc_attr($disabled) ?>>
                                    <div class="chaty-slider round"></div>
                                    <?php esc_html_e("Send leads to your email", "chaty") ?>
                                    <span class="icon label-tooltip email-tooltip" data-title="Get your leads by email, whenever you get a new email you'll get an email notification">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </span>
                                    <?php if(!$is_pro){ ?>
                                    <a class="opacity-0 px-5 py-1.5 group-custom-hover:opacity-100 ml-4 pro-btn bg-cht-primary inline-block rounded-[6px] text-white hover:text-white" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                                        <?php esc_html_e('Activate your license key', 'chaty');?>
                                    </a>
                                    <?php } ?>
                                </label>
                            </div>
                            <div class="email-settings <?php echo ($field_value == "yes") ? "active" : "" ?>">
                                <div class="chaty-setting-col">
                                    <label class="font-primary text-cht-gray-150" for="email_for_<?php echo esc_attr($social['slug']); ?>">
                                        <span><?php esc_html_e("Email address", "chaty") ?></span>
                                        <span class="icon label-tooltip email-tooltip -mt-[9px]" data-title="<?php esc_html_e("If you want to send leads to more than one email address, please add your email addresses separated by commas", "chaty") ?>">
                                            <span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </span>
                                        </span>
                                    </label>
                                    <div class="pos-relative">
                                        <?php $field_value = isset($value['email_address']) ? $value['email_address'] : "" ?>
                                        <input class="w-full" id="email_for_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[email_address]" value="<?php echo esc_attr($field_value); ?>" <?php echo esc_attr($disabled) ?>>
                                        <button type="button" class="more-btn" <?php echo esc_attr($disabled) ?>>CC/BCC <i class='fas fa-arrow-down up-down-arrow'></i></button>
                                    </div>
                                </div>
                                <div class="cc-bcc-field <?php echo ((!empty($value['cc_email_address']) || !empty($value['bcc_email_address'])) ? "active" : "" ) ?>">
                                    <?php $field_value = isset($value['cc_email_address']) ? $value['cc_email_address'] : "" ?>
                                    <div class="chaty-setting-col cc-field">
                                        <label class="font-primary text-cht-gray-150" for="cc_email_for_<?php echo esc_attr($social['slug']); ?>">
                                            <span><?php esc_html_e("Email address (CC)", "chaty") ?></span>
                                            <span class="icon label-tooltip email-tooltip -mt-[9px]" data-title="<?php esc_html_e("Add emails (comma separated)  to whom you want to send the emails as CC", "chaty") ?>">
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                </span>
                                            </span>
                                        </label>
                                        <div>
                                            <input class="w-full" id="cc_email_for_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[cc_email_address]" value="<?php echo esc_attr($field_value); ?>" <?php echo esc_attr($disabled) ?>>
                                        </div>
                                    </div>
                                    <?php $field_value = isset($value['bcc_email_address']) ? $value['bcc_email_address'] : "" ?>
                                    <div class="chaty-setting-col bcc-field">
                                        <label class="font-primary text-cht-gray-150" for="bcc_email_for_<?php echo esc_attr($social['slug']); ?>">
                                            <span><?php esc_html_e("Email address (BCC)", "chaty") ?></span>
                                    <span class="icon label-tooltip email-tooltip -mt-[9px]" data-title="<?php esc_html_e("Add emails (comma separated) to whom you want to send the emails as BCC", "chaty") ?>">
                                        <span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                        </label>
                                        <div>
                                            <input class="w-full" id="bcc_email_for_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[bcc_email_address]" value="<?php echo esc_attr($field_value); ?>" <?php echo esc_attr($disabled) ?>>
                                        </div>
                                    </div>
                                </div>
                                <div class="chaty-setting-col">
                                    <label class="font-primary text-cht-gray-150" for="sender_email_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Sender's email", "chaty") ?> <span class="icon label-tooltip email-tooltip -mt-[9px]" data-title="<?php esc_html_e("This is the email address from which you will receive each contact form submission email. By default, it is sent from the user's email address. To avoid email rejection, change it to an email address that includes your website domain.", "chaty") ?>"><span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span></span>
                                    </label>
                                    <div>
                                        <?php $field_value = isset($value['sender_email']) ? $value['sender_email'] : "{email}" ?>
                                        <input class="w-full" id="sender_email_for_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[sender_email]" value="<?php echo esc_attr($field_value); ?>" <?php echo esc_attr($disabled) ?>>
                                    </div>
                                </div>
                                <div class="chaty-setting-col">
                                    <label class="font-primary text-cht-gray-150" for="sender_name_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Sender's name", "chaty") ?> <span class="icon label-tooltip email-tooltip -mt-[9px]" data-title="<?php esc_html_e("The name that will appear as the sender name in your email. Use {name} to dynamically use the name from form submission.", "chaty") ?>"><span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span></span>
                                    </label>
                                    <div>
                                        <?php $field_value = isset($value['sender_name']) ? $value['sender_name'] : "" ?>
                                        <input class="w-full" id="sender_name_for_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[sender_name]" value="<?php echo esc_attr($field_value); ?>" <?php echo esc_attr($disabled) ?>>
                                    </div>
                                </div>
                                <div class="chaty-setting-col">
                                    <label class="font-primary text-cht-gray-150" for="email_subject_for_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Email subject", "chaty") ?> <span class="icon label-tooltip email-tooltip -mt-[9px]" data-title="<?php esc_html_e("The subject line of the emails that you'll receive from each contact form submission. You can use dynamic tags", "chaty") ?>">
                                        <span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span></label>
                                    <div>
                                        <?php $field_value = isset($value['email_subject']) ? $value['email_subject'] : "New lead from Chaty - {name} - {date} {hour}" ?>
                                        <input class="w-full" id=email_subject_for_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[email_subject]" value="<?php echo esc_attr($field_value); ?>" <?php echo esc_attr($disabled) ?>>
                                        <div class="mail-merge-tags mt-2"><span>{name}</span><span>{phone}</span><span>{email}</span><span>{date}</span><span>{hour}</span></div>
                                    </div>
                                </div>
                                <div class="chaty-setting-col mt-5">
                                    <?php $field_value = isset($value['has_custom_mail_content']) ? $value['has_custom_mail_content'] : "no" ?>
                                    <label for="has_custom_mail_content_<?php echo esc_attr($social['slug']); ?>" class="full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
                                        <input class="email-content-switch" type="checkbox" id="has_custom_mail_content_<?php echo esc_attr($social['slug']); ?>" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[has_custom_mail_content]" <?php checked($field_value, "yes") ?> <?php echo esc_attr($disabled) ?>>
                                        <div class="chaty-slider round"></div>
                                        <?php esc_html_e("Add more info to the body ✉️", "chaty"); ?>
                                        <span class="icon label-tooltip email-tooltip" data-title="Add dynamic information to the beginning of the email body automatically for more convenience">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </label>
                                    <div class="email-body-content <?php echo ($field_value == "yes")?"active":"" ?>">
                                        <?php $field_value = isset($value['mail_content']) ? $value['mail_content'] : "{title}\n{url}" ?>
                                        <textarea class="custom-email-body" id="email_body_<?php echo esc_attr($social['slug']); ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mail_content]" ><?php echo esc_attr($field_value) ?></textarea>
                                        <div class="mt-3">
                                            <?php include "custom-tags.php" ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php $field_value = isset($value['enable_recaptcha']) ? $value['enable_recaptcha'] : "no" ?>
                            <input type="hidden" value="no" name="cht_social_<?php echo esc_attr($social['slug']); ?>[enable_recaptcha]" >
                            <div class="chaty-setting-col mt-3">
                                <label for="enable_recaptcha_<?php echo esc_attr($social['slug']); ?>" class="email-setting full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
                                    <input class="captcha-setting-field" type="checkbox" id="enable_recaptcha_<?php echo esc_attr($social['slug']); ?>" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[enable_recaptcha]" <?php checked($field_value, "yes") ?> <?php echo esc_attr($disabled) ?>>
                                    <div class="chaty-slider round"></div>
                                    <?php esc_html_e("Enable reCAPTCHA", "chaty") ?>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center">
                                            <?php printf(esc_html__("Click %1\$s to add your website. (please make sure you select V3). After adding your website you'll get your site Key and secret key.", "chaty"), "<a target='_blank' class='infotip-link' href='https://www.google.com/recaptcha/admin/create'>".esc_html__("here", "chaty")."</a>") ?>
                                        </span>
                                        <span class="ml-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                    <?php if(!$is_pro){ ?>
                                        <a class="opacity-0 px-5 py-1.5 group-custom-hover:opacity-100 ml-4 pro-btn bg-cht-primary inline-block rounded-[6px] text-white hover:text-white" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                                            <?php esc_html_e('Activate your license key', 'chaty');?>
                                        </a>
                                    <?php } ?>
                                </label>
                            </div>
                            <div class="captcha-settings <?php echo ($field_value == "yes") ? "active" : "" ?>">
                                <?php $captcha_type = isset($value['captcha_type']) ? $value['captcha_type'] : "v3" ?>
                                <div class="form-horizontal__item">
                                    <label class="align-top form-horizontal__item-label font-primary text-cht-gray-150 block mb-3"><?php esc_html_e('reCAPTCHA type', 'chaty'); ?></label>
                                    <div>
                                        <div class="tab-tab-select bg-cht-gray-50 rounded-md p-1 inline-flex flex-wrap items-center">
                                            <label class="custom-control custom-radio" for="captcha_type-v3">
                                                <input type="radio" id="captcha_type-v3" name="cht_social_<?php echo esc_attr($social['slug']); ?>[captcha_type]" class="custom-control-input recaptcha-type" <?php checked($captcha_type, "v3") ?> value="v3" <?php echo esc_attr($disabled) ?> />
                                                <span class="custom-control-label"><?php esc_html_e('reCAPTCHA v3', 'chaty'); ?></span>
                                            </label>

                                            <label class="custom-control custom-radio" for="captcha_type-v2">
                                                <input type="radio" id="captcha_type-v2" name="cht_social_<?php echo esc_attr($social['slug']); ?>[captcha_type]" class="custom-control-input recaptcha-type" <?php checked($captcha_type, "v2") ?> value="v2" <?php echo esc_attr($disabled) ?> />
                                                <span class="custom-control-label"><?php esc_html_e('reCAPTCHA v2', 'chaty'); ?></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="chaty-setting-col">
                                    <label class="font-primary text-cht-gray-150" for="site_key_<?php echo esc_attr($social['slug']); ?>">
                                        <span><?php esc_html_e("Site Key", "chaty") ?></span>
                                        <span class="header-tooltip recaptcha-tooltip">
                                            <span class="header-tooltip-text text-center">
                                                <?php esc_html_e("Click COPY SITE KEY from Google reCAPTCHA and paste it here.", "chaty"); ?>
                                                <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/google-site-key.png") ?>" alt="<?php esc_html_e("Google Site Key", "chaty"); ?>" />
                                            </span>
                                            <span class="ml-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </span>
                                        </span>
                                    </label>
                                    <div class="<?php echo esc_attr($captcha_type) ?>-key recaptcha-input">
                                        <?php $v2_site_key = isset($value['v2_site_key']) ? $value['v2_site_key'] : "" ?>
                                        <?php $v3_site_key = isset($value['v3_site_key']) ? $value['v3_site_key'] : "" ?>
                                        <input class="w-full v2-input" id="v2_site_key_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[v2_site_key]" value="<?php echo esc_attr($v2_site_key); ?>" <?php echo esc_attr($disabled) ?> >
                                        <input class="w-full v3-input" id="v3_site_key_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[v3_site_key]" value="<?php echo esc_attr($v3_site_key); ?>" <?php echo esc_attr($disabled) ?> >
                                    </div>
                                </div>
                                <div class="chaty-setting-col">
                                    <label class="font-primary text-cht-gray-150" for="secret_key_<?php echo esc_attr($social['slug']); ?>">
                                        <span><?php esc_html_e("Secret Key", "chaty") ?></span>
                                        <span class="header-tooltip recaptcha-tooltip">
                                            <span class="header-tooltip-text text-center">
                                                <?php esc_html_e("Click the COPY SECRET KEY from Google reCAPTCHA and paste it here.", "chaty"); ?>
                                                <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/google-secret-key.png") ?>" alt="<?php esc_html_e("Google Secret Key", "chaty"); ?>" />
                                            </span>
                                            <span class="ml-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </span>
                                        </span>
                                    </label>
                                    <div class="<?php echo esc_attr($captcha_type) ?>-key recaptcha-input">
                                        <?php $v2_secret_key = isset($value['v2_secret_key']) ? $value['v2_secret_key'] : "" ?>
                                        <?php $v3_secret_key = isset($value['v3_secret_key']) ? $value['v3_secret_key'] : "" ?>
                                        <input class="w-full v2-input" id="v2_secret_key_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[v2_secret_key]" value="<?php echo esc_attr($v2_secret_key); ?>" <?php echo esc_attr($disabled) ?> >
                                        <input class="w-full v3-input" id="v3_secret_key_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[v3_secret_key]" value="<?php echo esc_attr($v3_secret_key); ?>" <?php echo esc_attr($disabled) ?> >
                                    </div>
                                </div>
                                <div class="recaptcha-badge">
                                    <?php $field_value = isset($value['hide_recaptcha_badge']) ? $value['hide_recaptcha_badge'] : "no" ?>
                                    <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[hide_recaptcha_badge]" value="no" />
                                    <div class="flex items-center space-x-2">
                                        <div class="checkbox">
                                            <label for="cht_social_<?php echo esc_attr($social['slug']); ?>_hide_recaptcha_badge" class="chaty-checkbox text-cht-gray-150 text-base">
                                                <input class="sr-only" type="checkbox" id="cht_social_<?php echo esc_attr($social['slug']); ?>_hide_recaptcha_badge" name="cht_social_<?php echo esc_attr($social['slug']); ?>[hide_recaptcha_badge]" value="yes" <?php checked($value['hide_recaptcha_badge'],"yes") ?> <?php echo esc_attr($disabled) ?> />
                                                <span></span>
                                                <?php esc_html_e("Hide reCAPTCHA badge","chaty") ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php $field_value = isset($value['capture_ip_address']) ? $value['capture_ip_address'] : "no" ?>
                            <input type="hidden" value="no" name="cht_social_<?php echo esc_attr($social['slug']); ?>[capture_ip_address]" >
                            <div class="chaty-setting-col mt-3">
                                <label for="capture_ip_address_<?php echo esc_attr($social['slug']); ?>" class="full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
                                    <input class="capture-ip-address-field" type="checkbox" id="capture_ip_address_<?php echo esc_attr($social['slug']); ?>" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[capture_ip_address]" <?php checked($field_value, "yes") ?> <?php echo esc_attr($disabled) ?>>
                                    <div class="chaty-slider round"></div>
                                    <?php esc_html_e("Capture IP address", "chaty") ?>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center">
                                            <?php printf(esc_html__("Capture the visitor's IP address when they submit the form.", 'chaty')) ?>
                                        </span>
                                        <span class="ml-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                    <?php if(!$is_pro){ ?>
                                        <a class="opacity-0 px-5 py-1.5 group-custom-hover:opacity-100 ml-4 pro-btn bg-cht-primary inline-block rounded-[6px] text-white hover:text-white" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                                            <?php esc_html_e('Activate your license key', 'chaty');?>
                                        </a>
                                    <?php } ?>
                                </label>
                            </div>
                            <?php
                            $mailchimp_enable = isset($value['send_leads_mailchimp']) ? $value['send_leads_mailchimp'] : "no";
                            $chaty_mc_api_key = get_option( 'chaty_mc_api_key');
                            ?>
                            <div class="chaty-setting-col mt-3">
                                <label for="send_leads_mailchimp" class="email-setting full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
                                    <input type="hidden" value="no" name="cht_social_<?php echo esc_attr($social['slug']); ?>[send_leads_mailchimp]" >
                                    <input class="<?php echo (isset($chaty_mc_api_key) && $chaty_mc_api_key != '') ? "" : "has-mailchimp-integration"; ?>" type="checkbox" id="send_leads_mailchimp" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[send_leads_mailchimp]" <?php checked($mailchimp_enable, "yes") ?> <?php echo esc_attr($disabled) ?>>
                                    <div class="chaty-slider round"></div>
                                    <?php esc_html_e("Send leads to Mailchimp", "chaty") ?>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center">
                                            <?php printf(esc_html__("Integrate Mailchimp to directly sync email leads on Mailchimp",  "chaty")) ?>
                                        </span>
                                        <span class="ml-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                    <?php if(!$is_pro){ ?>
                                        <a class="opacity-0 px-5 py-1.5 group-custom-hover:opacity-100 ml-4 pro-btn bg-cht-primary inline-block rounded-[6px] text-white hover:text-white" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                                            <?php esc_html_e('Activate your license key', 'chaty');?>
                                        </a>
                                    <?php } ?>
                                </label>
                            </div>
                            <?php
                            if ( isset($chaty_mc_api_key) && $chaty_mc_api_key != '' ){
                                include('mailchimp-integration.php');
                            }
                            ?>
                            <?php $klaviyo_enable = isset($value['send_leads_klaviyo']) ? $value['send_leads_klaviyo'] : "no";
                            $elements_klaviyo_connect = get_option('chaty_klaviyo_detail');
                            $status = 0;
                            $list = '';
                            if (!empty($elements_klaviyo_connect)) {
                                $status = (int) $elements_klaviyo_connect['status'];
                                $list = $elements_klaviyo_connect['list'];
                            }
                            ?>
                            <div class="chaty-setting-col mt-3">
                                <label for="send_leads_klaviyo" class="email-setting full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
                                    <input type="hidden" value="no" name="cht_social_<?php echo esc_attr($social['slug']); ?>[send_leads_klaviyo]" >
                                    <input type="checkbox" id="send_leads_klaviyo" class="<?php echo ($status == 1) ? "" : "has-klaviyo-integration"; ?>" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[send_leads_klaviyo]" <?php checked($klaviyo_enable, "yes") ?> <?php echo esc_attr($disabled) ?>>
                                    <div class="chaty-slider round"></div>
                                    <?php esc_html_e("Send leads to Klaviyo", "chaty") ?>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center">
                                            <?php printf(esc_html__("Integrate Klaviyo to directly sync email leads on Klaviyo",  "chaty")) ?>
                                        </span>
                                        <span class="ml-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                    <?php if(!$is_pro){ ?>
                                        <a class="opacity-0 px-5 py-1.5 group-custom-hover:opacity-100 ml-4 pro-btn bg-cht-primary inline-block rounded-[6px] text-white hover:text-white" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                                            <?php esc_html_e('Activate your license key', 'chaty');?>
                                        </a>
                                    <?php } ?>
                                </label>
                            </div>
                            <?php
                            if ( isset($elements_klaviyo_connect) && $status == 1){
                                include('klaviyo-integration.php');
                            }
                            ?>
                        </div>
                    </div>
                <?php }//end if
                ?>
                <?php if ($this->is_pro()) { ?>
                    <div class="Email-settings advanced-settings">
                        <!-- advance setting for Email -->
                        <div class="chaty-setting-col sm:flex items-start sm:space-x-3">
                            <label class="font-primary text-base text-cht-gray-150 sm:w-44 flex"><?php esc_html_e("Mail Subject" ,"chaty") ?>
                                <span class="icon label-tooltip inline-tooltip" data-title="<?php esc_html_e("Add your own pre-set message that's automatically added to the user's message. You can also use merge tags and add the URL or the title of the current visitor's page. E.g. you can add the current URL of a product to the message so you know which product the visitor is talking about when the visitor messages you", "chaty") ?>">
                                    <span class="ml-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </span>
                                </span>
                            </label>
                            <div>
                                <?php $mail_subject = isset($value['mail_subject']) ? $value['mail_subject'] : ""; ?>
                                <input class="w-full" id="cht_social_message_<?php echo esc_attr($social['slug']); ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mail_subject]" value="<?php echo esc_attr($mail_subject) ?>" >
                                <span class="supported-tags"><span class="icon label-tooltip support-tooltip" data-title="{title} tag grabs the page title of the webpage">{title}</span> and  <span class="icon label-tooltip support-tooltip" data-title="{url} tag grabs the URL of the page">{url}</span> tags are supported</span>
                            </div>
                        </div>
                    </div>
                    <div class="WeChat-settings advanced-settings">
                        <!-- advance setting for WeChat -->
                        <?php
                        $qr_code = isset($value['qr_code']) ? $value['qr_code'] : "";
                        // Initialize QR code value if not exists. 2.1.0 change
                        $imageUrl = "";
                        $status   = 0;
                        if ($qr_code != "") {
                            $imageUrl = wp_get_attachment_image_src($qr_code, "full")[0];
                            // get custom Image URL if exists
                        }

                        if ($imageUrl == "") {
                            $value['qr_code'] = "";
                            // Initialize with default image URL if URL is not exists
                        } else {
                            $status = 1;
                        }
                        ?>
                        <div class="clear clearfix"></div>
                        <div class="sm:flex sm:items-center sm:space-x-3 mt-4">
                            <?php $wechat_header = isset($value['wechat_header']) ? $value['wechat_header'] : esc_html__("WeChat ID","chaty") ?>
                            <div class="chaty-setting-col inline-options">
                                <label class="font-primary text-base text-cht-gray-150 sm:w-44">
                                    <?php esc_html_e("Heading", "chaty") ?>
                                </label>
                                <div>
                                    <input type="text" class="qr-header-title" id="<?php echo esc_attr($social['slug']); ?>_header_title" name="cht_social_<?php echo esc_attr($social['slug']); ?>[wechat_header]" value="<?php echo esc_attr($wechat_header) ?>">
                                </div>
                            </div>
                            <div class="chaty-setting-col inline-options">
                                <?php
                                $wechat_header_color = isset($value['wechat_header_color']) ? $value['wechat_header_color'] : "#A886CD";
                                $wechat_header_color = $this->validate_color($wechat_header_color, "#A886CD");
                                ?>
                                <label class="font-primary text-base text-cht-gray-150 sm:w-44">
                                    <?php esc_html_e("Header Background", "chaty") ?>
                                </label>
                                <div>
                                    <input type="text" id="<?php echo esc_attr($social['slug']); ?>_header_color" name="cht_social_<?php echo esc_attr($social['slug']); ?>[wechat_header_color]" class="chaty-color-field button-color wechat-header-color" value="<?php echo esc_attr($wechat_header_color) ?>" />
                                </div>
                            </div>
                        </div>
                        <div class="sm:flex sm:items-center sm:space-x-3 mt-4">
                            <?php $wechat_qr_code_title = isset($value['wechat_qr_code_title']) ? $value['wechat_qr_code_title'] : esc_html__("Scan QR Code","chaty") ?>
                            <div class="chaty-setting-col inline-options">
                                <label class="font-primary text-base text-cht-gray-150 sm:w-44">
                                    <?php esc_html_e("QR code heading", "chaty") ?>
                                </label>
                                <div>
                                    <input type="text" class="qr-code-header-title" id="<?php echo esc_attr($social['slug']); ?>_qr_code_title" name="cht_social_<?php echo esc_attr($social['slug']); ?>[wechat_qr_code_title]" value="<?php echo esc_attr($wechat_qr_code_title) ?>">
                                </div>
                            </div>
                        </div>
                        <div class="sm:flex sm:items-center sm:space-x-3 mt-4">
                            <div class="chaty-setting-col ">
                                <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("Upload QR Code", "chaty") ?></label>
                                <div class="relative qr-code-setting <?php echo esc_attr($social['slug']); ?>-qr-code-setting <?php echo esc_attr($status?"active":"") ?>">
                                    <span class="qr-code-img" id="<?php echo esc_attr($social['slug']); ?>-qr-code-image">
                                        <?php if($status){ ?>
                                            <img src="<?php echo esc_url($imageUrl) ?>" />
                                        <?php } ?>
                                    </span>
                                    <!-- Button to upload QR Code image -->
                                    <a class="cht-upload-image" id="upload_qr_code" href="javascript:;" onclick="upload_qr_code('<?php echo esc_attr($social['slug']); ?>')">
                                        <?php esc_html_e("Upload", "chaty") ?>
                                    </a>

                                    <!-- Button to remove QR Code image -->
                                    <a href="javascript:;" class="remove-qr-code remove-setting-btn remove-qr-code-<?php echo esc_attr($social['slug']); ?>" onclick="remove_qr_code('<?php echo esc_attr($social['slug']); ?>')">
                                        <?php esc_html_e("Remove", "chaty") ?>
                                    </a>

                                    <!-- input hidden field for QR Code -->
                                    <input id="upload_qr_code_val-<?php echo esc_attr($social['slug']); ?>" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[qr_code]" value="<?php echo esc_attr($qr_code) ?>" >
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="Link-settings Custom_Link-settings Custom_Link_3-settings Custom_Link_4-settings Custom_Link_5-settings advanced-settings">
                        <?php $is_checked = (!isset($value['new_window']) || $value['new_window'] == 1) ? 1 : 0; ?>
                        <!-- Advance setting for Custom Link -->
                        <div class="clear clearfix"></div>
                        <div class="chaty-setting-col flex items-center space-x-3">
                            <label class="font-primary text-cht-gray-150 sm:w-44 text-base" for="cht_social_window_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Open In a New Tab" ,"chaty") ?></label>
                            <div class="l-height">
                                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[new_window]" value="0" >
                                <label class="channels__view" for="cht_social_window_<?php echo esc_attr($social['slug']); ?>">
                                    <input id="cht_social_window_<?php echo esc_attr($social['slug']); ?>" type="checkbox" class="channels__view-check" name="cht_social_<?php echo esc_attr($social['slug']); ?>[new_window]" value="1" <?php checked($is_checked, 1) ?> >
                                    <span class="chaty-slider round"></span>
                                    <!-- <span class="channels__view-txt">&nbsp;</span> -->
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="Linkedin-settings advanced-settings">
                        <?php $is_checked = isset($value['link_type']) ? $value['link_type'] : "personal"; ?>
                        <!-- Advance setting for Custom Link -->
                        <div class="chaty-setting-col sm:flex sm:items-center sm:space-x-3">
                            <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("LinkedIn", "chaty") ?></label>
                            <div class="cta-action-radio tab-tab-select bg-cht-gray-50 inline-block rounded-md p-1">
                                <div class="i-block" for="all_time-cht_cta_action">
                                    <label class="custom-control custom-radio">
                                        <input type="radio" name="cht_social_<?php echo esc_attr($social['slug']); ?>[link_type]" class="custom-control-input" <?php checked($is_checked, "personal") ?> value="personal" />
                                        <span class="custom-control-label px-2 py-1 inline-block text-cht-gray-150 rounded-[3px]"><?php esc_html_e("Personal", "chaty") ?></span>
                                    </label>
                                </div>
                                <div class="i-block" for="all_time-cht_cta_action">
                                    <label class="custom-control custom-radio">
                                        <input type="radio" name="cht_social_<?php echo esc_attr($social['slug']); ?>[link_type]" class="custom-control-input" <?php checked($is_checked, "company") ?> value="company" />
                                        <span class="custom-control-label px-2 py-1 inline-block text-cht-gray-150 rounded-[3px]"><?php esc_html_e("Company", "chaty") ?></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php } else { ?>
                    <div class="clear clearfix"></div>
                    <div class="Email-settings advanced-settings">
                        <div class="clear clearfix"></div>
                        <div class="chaty-setting-col flex items-start space-x-3">
                            <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("Mail Subject", "chaty") ?>
                                <span class="icon label-tooltip inline-tooltip" data-title="<?php esc_html_e("Add your own pre-set message that's automatically added to the user's message. You can also use merge tags and add the URL or the title of the current visitor's page. E.g. you can add the current URL of a product to the message so you know which product the visitor is talking about when the visitor messages you", "chaty") ?>" >
                                    <span class="dashicons dashicons-editor-help"></span>
                                </span>
                            </label>
                            <div>
                                <div class="pro-features">
                                    <div class="pro-item">
                                        <input disabled id="cht_social_message_<?php echo esc_attr($social['slug']); ?>" type="text" name="" value="" >
                                        <span class="supported-tags"><span class="icon label-tooltip support-tooltip" data-title="{title} tag grabs the page title of the webpage">{title}</span> and  <span class="icon label-tooltip support-tooltip" data-title="{url} tag grabs the URL of the page">{url}</span> tags are supported</span>
                                    </div>
                                    <div class="pro-button">
                                        <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>"><?php esc_html_e('Activate your license key', 'chaty');?></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="WeChat-settings advanced-settings">
                        <div class="clear clearfix"></div>
                        <div class="chaty-setting-col flex items-center space-x-3">
                            <label class="font-primary text-cht-gray-150 text-base w-44"><?php esc_html_e("Upload QR Code" ,"chaty") ?></label>
                            <div>
                                <a target="_blank" class="cht-upload-image-pro text-base" id="upload_qr_code" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>" >
                                    <span class="dashicons dashicons-upload"></span>
                                </a>
                                <a class="text-base text-cht-gray-150 ml-2" target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>"><?php esc_html_e('Activate your license key', 'chaty');?></a>
                            </div>
                        </div>
                    </div>
                    <div class="Link-settings Custom_Link-settings Custom_Link_3-settings Custom_Link_4-settings Custom_Link_5-settings advanced-settings">
                        <?php $is_checked = 1; ?>
                        <div class="clear clearfix"></div>
                        <div class="chaty-setting-col flex items-center space-x-3">
                            <label class="font-primary text-cht-gray-150 text-base sm:w-44" for="cht_social_window_<?php echo esc_attr($social['slug']); ?>"><?php esc_html_e("Open In a New Tab", "chaty") ?></label>
                            <div class="l-height">
                                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[new_window]" value="0" >
                                <label class="channels__view" for="cht_social_window_<?php echo esc_attr($social['slug']); ?>">
                                    <input id="cht_social_window_<?php echo esc_attr($social['slug']); ?>" type="checkbox" class="channels__view-check" name="cht_social_<?php echo esc_attr($social['slug']); ?>[new_window]" value="1" checked >
                                    <span class="channels__view-txt">&nbsp;</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="Linkedin-settings advanced-settings">
                        <?php $is_checked = "personal"; ?>
                        <!-- Advance setting for Custom Link -->
                        <div class="chaty-setting-col sm:flex sm:items-center sm:space-x-3">
                            <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("LinkedIn", "chaty") ?></label>
                            <div class="cta-action-radio tab-tab-select bg-cht-gray-50 inline-block rounded-md p-1">
                                <div for="all_time-cht_cta_action">
                                    <label class="custom-control custom-radio">
                                        <input type="radio" name="cht_social_<?php echo esc_attr($social['slug']); ?>[link_type]" class="custom-control-input" <?php checked($is_checked, "personal") ?> value="personal" />
                                        <span class="custom-control-label px-2 py-1 inline-block text-cht-gray-150 rounded-[3px]"><?php esc_html_e("Personal", "chaty") ?></span>
                                    </label>
                                </div>
                                <div>
                                    <label class="custom-control custom-radio">
                                        <input type="radio" name="cht_social_<?php echo esc_attr($social['slug']); ?>[link_type]" class="custom-control-input" <?php checked($is_checked, "company") ?> value="company" />
                                        <span class="custom-control-label px-2 py-1 inline-block text-cht-gray-150 rounded-[3px]"><?php esc_html_e("Compnay", "chaty") ?></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php }//end if
                ?>
            </div>
            <!-- advance setting fields: end -->

            <input type="hidden" class="is-agent-active" id="<?php echo esc_attr($social['slug']); ?>_agent" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_agent]" value="<?php echo esc_attr($is_agent) ?>"  >
            <!-- remove social media setting button: start -->
        </div>
    </div> 
    <!-- channel visual fields end -->
    
    <!-- channel settings fields -->
    <?php if (!in_array($social['slug'], ["Contact_Us", "Link", "Custom_Link", "Custom_Link_3", "Custom_Link_4", "Custom_Link_5", "Custom_Link_6"])) { ?>
        <?php
        $imgClass = "";
        $value['agent_fa_icon']  = isset($value['agent_fa_icon']) ? $value['agent_fa_icon'] : "";
        $value['agent_image_id'] = isset($value['agent_image_id']) ? $value['agent_image_id'] : "";
        if (!empty($value['agent_fa_icon'])) {
            $imgClass = "icon-active";
        } else {
            if (!empty($value['agent_image_id'])) {
                $imageUrl = wp_get_attachment_image_src($value['agent_image_id'], "full")[0];
                // get custom image URL if exists
                if ($imageUrl == "") {
                    $imageUrl = CHT_PLUGIN_URL."admin/assets/images/chaty-default.png";
                    // Initialize with default image if custom image is not exists
                } else {
                    $imgClass = "img-active";
                }
            }
        }

        if (!isset($value['agent_bg_color'])) {
            $value['agent_bg_color'] = $social['color'];
        }

        if($social['slug'] == "Twitter" && ($value['agent_bg_color'] == "#1ab2e8" || $value['agent_bg_color'] == "rgb(26, 178, 232)") ) {
            $value['agent_bg_color'] = "#000000";
        }
        $value['agent_bg_color'] = $this->validate_color($value['agent_bg_color'], $social['color']);

        if (!isset($value['agent_head_bg_color'])) {
            $value['agent_head_bg_color'] = $social['color'];
        }

        if ($social['slug'] == "Instagram" && $value['agent_head_bg_color'] == "#ffffff") {
            $value['agent_head_bg_color'] = "#704DC9";
        }
        $value['agent_head_bg_color'] = $this->validate_color($value['agent_head_bg_color'], $social['color']);

        if (!isset($value['agent_head_text_color'])) {
            $value['agent_head_text_color'] = "#ffffff";
        }
        $value['agent_head_text_color'] = $this->validate_color($value['agent_head_text_color'], "#ffffff");

        if (!isset($value['agent_title'])) {
            $value['agent_title'] = $social['title'];
        }

        if (!isset($value['agent_header_text'])) {
            $value['agent_header_text'] = "Hello";
        }

        if (!isset($value['agent_sub_header_text'])) {
            $value['agent_sub_header_text'] = "How can we help?";
        }

        if (!isset($value['is_agent_desktop'])) {
            $value['is_agent_desktop'] = "checked";
        }

        if (!isset($value['is_agent_mobile'])) {
            $value['is_agent_mobile'] = "checked";
        }

        if (false) {
            ?>
            <style>.custom-agent-icon-<?php echo esc_attr($social['slug']) ?> .color-element { fill: <?php echo esc_attr($value['agent_bg_color']) ?>}</style>
        <?php }

        ?>
        <div class="chaty-agent-form">
            <!-- agent settings start -->
            <div class="chaty-agent-setting">
                <div class="border border-solid border-cht-primary rounded-lg" style="background-color: #F7F2FD">
                    <header class="flex items-center gap-2 sm:gap-0 px-2 sm:pr-5 sm:pl-3 py-6 flex-wrap">
                        <!-- header left with move icon and agent image -->
                        <div class="flex items-center space-x-1 mr-4">
                            <div class="move-icon">
                                <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/move-icon.png") ?>" />
                            </div>
                            <div class="agent-icon inline-flex <?php echo esc_attr($imgClass) ?>"  id="image_agent_data_agent-<?php echo esc_attr($social['slug']) ?>">
                                <span style="background-color: <?php echo esc_attr($value['agent_bg_color']) ?>" class="custom-agent-image overflow-hidden rounded-full custom-agent-image-<?php echo esc_attr($social['slug']) ?>">
                                    <img class="agent-image h-full object-cover w-full" src="<?php echo esc_url($imageUrl) ?>" />
                                    <span class="remove-agent-img"></span>
                                    <input class="image-id" id="cht_social_agent_image_agent-<?php echo esc_attr($social['slug']); ?>" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_image_id]" value="<?php echo esc_attr($value['agent_image_id']) ?>" />
                                </span>
                                <span class="default-agent-icon <?php echo (isset($value['fa_icon'])&&!empty($value['fa_icon'])) ? "has-fa-icon" : "" ?> custom-agent-icon-<?php echo esc_attr($social['slug']) ?> default_agent_image_<?php echo esc_attr($social['slug']) ?>" >
                                    <?php echo $svg_icon; ?>
                                </span>
                                <span style="background-color: <?php echo esc_attr($value['agent_bg_color']) ?>" class="facustom-icon flex items-center justify-center">
                                    <i class="<?php echo esc_attr($value['agent_fa_icon']) ?>"></i>
                                </span>
                                <input class="fa-icon" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_fa_icon]" value="<?php echo esc_attr($value['agent_fa_icon']) ?>">
                                <span class="remove-icon-img remove-img-icon" data-slug="agent-<?php echo esc_attr($social['slug']) ?>"></span>
                            </div>
                        </div>
                        <!-- header middle with device and customizer button -->
                        <div class="agent-header-info flex flex-wrap sm:items-center gap-2 sm:gap-4">
                            <div class="agent-head-top text-base font-primary text-cht-gray-150">
                                <?php esc_html_e("Agent launcher", "chaty") ?>
                            </div>
                            <div class="flex items-center">
                                <div class="agent-devices flex items-center space-x-1">
                                    <label class="text-sm font-primary text-cht-gray-150/60"><?php esc_html_e('Show on', 'chaty') ?></label>
                                    <div class="device-box">
                                        <!-- setting for desktop -->
                                        <label class="device_view cursor-pointer" for="<?php echo esc_attr($slug); ?>Desktop-agent">
                                            <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_agent_desktop]" value=""  />
                                            <input type="checkbox" id="<?php echo esc_attr($slug); ?>Desktop-agent" class="channels__view-check agent-desktop-device" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_agent_desktop]" value="checked" <?php echo esc_attr($value['is_agent_desktop']) ?> />
                                            <span class="device-view-txt">
                                                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M13.3333 10.0001C14.0667 10.0001 14.6667 9.40008 14.6667 8.66675V2.00008C14.6667 1.26675 14.0667 0.666748 13.3333 0.666748H2.66667C1.93333 0.666748 1.33333 1.26675 1.33333 2.00008V8.66675C1.33333 9.40008 1.93333 10.0001 2.66667 10.0001H0.666667C0.3 10.0001 0 10.3001 0 10.6667C0 11.0334 0.3 11.3334 0.666667 11.3334H15.3333C15.7 11.3334 16 11.0334 16 10.6667C16 10.3001 15.7 10.0001 15.3333 10.0001H13.3333ZM3.33333 2.00008H12.6667C13.0333 2.00008 13.3333 2.30008 13.3333 2.66675V8.00008C13.3333 8.36675 13.0333 8.66675 12.6667 8.66675H3.33333C2.96667 8.66675 2.66667 8.36675 2.66667 8.00008V2.66675C2.66667 2.30008 2.96667 2.00008 3.33333 2.00008Z" />
                                                </svg>
                                            </span>
                                            <span class="device-tooltip">
                                                <span class="on"><?php esc_html_e("Hide on desktop", "chaty") ?></span>
                                                <span class="off"><?php esc_html_e("Show on desktop", "chaty") ?></span>
                                            </span>
                                        </label>

                                        <!-- setting for mobile -->
                                        <label class="device_view cursor-pointer" for="<?php echo esc_attr($slug); ?>Mobile-agent">
                                            <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_agent_mobile]" value=""  />
                                            <input type="checkbox" id="<?php echo esc_attr($slug); ?>Mobile-agent" class="channels__view-check agent-mobile-device" name="cht_social_<?php echo esc_attr($social['slug']); ?>[is_agent_mobile]" value="checked" <?php echo esc_attr($value['is_agent_mobile']) ?> />
                                            <span class="device-view-txt">
                                                <svg width="9" height="16" viewBox="0 0 9 16" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.33301 0.666748H1.99967C1.07967 0.666748 0.333008 1.41341 0.333008 2.33341V13.6667C0.333008 14.5867 1.07967 15.3334 1.99967 15.3334H7.33301C8.25301 15.3334 8.99967 14.5867 8.99967 13.6667V2.33341C8.99967 1.41341 8.25301 0.666748 7.33301 0.666748ZM4.66634 14.6667C4.11301 14.6667 3.66634 14.2201 3.66634 13.6667C3.66634 13.1134 4.11301 12.6667 4.66634 12.6667C5.21967 12.6667 5.66634 13.1134 5.66634 13.6667C5.66634 14.2201 5.21967 14.6667 4.66634 14.6667ZM7.66634 12.0001H1.66634V2.66675H7.66634V12.0001Z"></path> </svg>
                                            </span>
                                            <span class="device-tooltip">
                                                <span class="on"><?php esc_html_e("Hide on mobile", "chaty") ?></span>
                                                <span class="off"><?php esc_html_e("Show on mobile", "chaty") ?></span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <!-- customize button for agent -->
                                <div class="agent-customize-button ml-2">
                                    <button type="button" class="customize-agent-button bg-white">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M12.9327 9.99999C12.8439 10.2011 12.8175 10.4241 12.8567 10.6404C12.8959 10.8566 12.999 11.0562 13.1527 11.2133L13.1927 11.2533C13.3166 11.3772 13.415 11.5242 13.4821 11.6861C13.5492 11.8479 13.5837 12.0214 13.5837 12.1967C13.5837 12.3719 13.5492 12.5454 13.4821 12.7072C13.415 12.8691 13.3166 13.0162 13.1927 13.14C13.0689 13.264 12.9218 13.3623 12.7599 13.4294C12.5981 13.4965 12.4246 13.531 12.2493 13.531C12.0741 13.531 11.9006 13.4965 11.7388 13.4294C11.5769 13.3623 11.4298 13.264 11.306 13.14L11.266 13.1C11.1089 12.9463 10.9093 12.8432 10.6931 12.804C10.4768 12.7648 10.2538 12.7912 10.0527 12.88C9.8555 12.9645 9.68734 13.1048 9.56889 13.2837C9.45044 13.4625 9.38687 13.6721 9.38601 13.8867V14C9.38601 14.3536 9.24554 14.6927 8.99549 14.9428C8.74544 15.1928 8.4063 15.3333 8.05268 15.3333C7.69906 15.3333 7.35992 15.1928 7.10987 14.9428C6.85982 14.6927 6.71935 14.3536 6.71935 14V13.94C6.71419 13.7193 6.64276 13.5053 6.51436 13.3258C6.38595 13.1463 6.2065 13.0095 5.99935 12.9333C5.79827 12.8446 5.57522 12.8181 5.35896 12.8573C5.14269 12.8965 4.94313 12.9996 4.78601 13.1533L4.74601 13.1933C4.62218 13.3173 4.47513 13.4156 4.31327 13.4827C4.1514 13.5498 3.9779 13.5844 3.80268 13.5844C3.62746 13.5844 3.45396 13.5498 3.29209 13.4827C3.13023 13.4156 2.98318 13.3173 2.85935 13.1933C2.73538 13.0695 2.63703 12.9224 2.56994 12.7606C2.50284 12.5987 2.4683 12.4252 2.4683 12.25C2.4683 12.0748 2.50284 11.9013 2.56994 11.7394C2.63703 11.5775 2.73538 11.4305 2.85935 11.3067L2.89935 11.2667C3.05304 11.1095 3.15614 10.91 3.19535 10.6937C3.23456 10.4775 3.20809 10.2544 3.11935 10.0533C3.03484 9.85614 2.89452 9.68798 2.71566 9.56953C2.5368 9.45108 2.32721 9.38751 2.11268 9.38666H1.99935C1.64573 9.38666 1.30659 9.24618 1.05654 8.99613C0.806491 8.74608 0.666016 8.40694 0.666016 8.05332C0.666016 7.6997 0.806491 7.36056 1.05654 7.11051C1.30659 6.86046 1.64573 6.71999 1.99935 6.71999H2.05935C2.28001 6.71483 2.49402 6.6434 2.67355 6.515C2.85308 6.38659 2.98983 6.20715 3.06602 5.99999C3.15476 5.79891 3.18123 5.57586 3.14202 5.3596C3.10281 5.14333 2.99971 4.94378 2.84602 4.78666L2.80602 4.74666C2.68205 4.62283 2.5837 4.47577 2.5166 4.31391C2.4495 4.15205 2.41497 3.97854 2.41497 3.80332C2.41497 3.6281 2.4495 3.4546 2.5166 3.29274C2.5837 3.13087 2.68205 2.98382 2.80602 2.85999C2.92985 2.73602 3.0769 2.63768 3.23876 2.57058C3.40063 2.50348 3.57413 2.46894 3.74935 2.46894C3.92457 2.46894 4.09807 2.50348 4.25994 2.57058C4.4218 2.63768 4.56885 2.73602 4.69268 2.85999L4.73268 2.89999C4.8898 3.05368 5.08936 3.15678 5.30562 3.19599C5.52189 3.23521 5.74494 3.20873 5.94601 3.11999H5.99935C6.19653 3.03548 6.36469 2.89516 6.48314 2.7163C6.60159 2.53744 6.66516 2.32785 6.66601 2.11332V1.99999C6.66601 1.64637 6.80649 1.30723 7.05654 1.05718C7.30659 0.807132 7.64573 0.666656 7.99935 0.666656C8.35297 0.666656 8.69211 0.807132 8.94216 1.05718C9.1922 1.30723 9.33268 1.64637 9.33268 1.99999V2.05999C9.33354 2.27451 9.3971 2.48411 9.51555 2.66297C9.634 2.84183 9.80217 2.98215 9.99935 3.06666C10.2004 3.1554 10.4235 3.18187 10.6397 3.14266C10.856 3.10345 11.0556 3.00035 11.2127 2.84666L11.2527 2.80666C11.3765 2.68269 11.5236 2.58434 11.6854 2.51724C11.8473 2.45014 12.0208 2.41561 12.196 2.41561C12.3712 2.41561 12.5447 2.45014 12.7066 2.51724C12.8685 2.58434 13.0155 2.68269 13.1393 2.80666C13.2633 2.93049 13.3617 3.07754 13.4288 3.2394C13.4959 3.40127 13.5304 3.57477 13.5304 3.74999C13.5304 3.92521 13.4959 4.09871 13.4288 4.26058C13.3617 4.42244 13.2633 4.56949 13.1393 4.69332L13.0993 4.73332C12.9457 4.89044 12.8426 5.09 12.8033 5.30626C12.7641 5.52253 12.7906 5.74558 12.8793 5.94666V5.99999C12.9639 6.19717 13.1042 6.36533 13.283 6.48378C13.4619 6.60223 13.6715 6.6658 13.886 6.66666H13.9993C14.353 6.66666 14.6921 6.80713 14.9422 7.05718C15.1922 7.30723 15.3327 7.64637 15.3327 7.99999C15.3327 8.35361 15.1922 8.69275 14.9422 8.9428C14.6921 9.19285 14.353 9.33332 13.9993 9.33332H13.9393C13.7248 9.33418 13.5152 9.39774 13.3364 9.51619C13.1575 9.63464 13.0172 9.80281 12.9327 9.99999V9.99999Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <?php esc_html_e("Customize", 'chaty') ?>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <!-- header right with remoave all agent button -->
                        <button data-id="<?php echo esc_attr($social['slug']); ?>" type="button" class="remove-agents-button flex items-center text-xs font-primary text-cht-gray-150 space-x-1 bg-white border border-solid border-cht-gray-150/40 rounded-md px-2 py-1 hover:bg-cht-red/10 hover:text-cht-red hover:border-cht-red self-center sm:ml-auto" data-social="<?php echo esc_attr($social['slug']); ?>">
                            <svg width="16" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M5.5 7.5H10.5C10.6326 7.5 10.7598 7.55268 10.8536 7.64645C10.9473 7.74021 11 7.86739 11 8C11 8.13261 10.9473 8.25979 10.8536 8.35355C10.7598 8.44732 10.6326 8.5 10.5 8.5H5.5C5.36739 8.5 5.24021 8.44732 5.14645 8.35355C5.05268 8.25979 5 8.13261 5 8C5 7.86739 5.05268 7.74021 5.14645 7.64645C5.24021 7.55268 5.36739 7.5 5.5 7.5Z" fill="currentColor"/>
                                <path d="M8 14C8.78793 14 9.56815 13.8448 10.2961 13.5433C11.0241 13.2417 11.6855 12.7998 12.2426 12.2426C12.7998 11.6855 13.2417 11.0241 13.5433 10.2961C13.8448 9.56815 14 8.78793 14 8C14 7.21207 13.8448 6.43185 13.5433 5.7039C13.2417 4.97595 12.7998 4.31451 12.2426 3.75736C11.6855 3.20021 11.0241 2.75825 10.2961 2.45672C9.56815 2.15519 8.78793 2 8 2C6.4087 2 4.88258 2.63214 3.75736 3.75736C2.63214 4.88258 2 6.4087 2 8C2 9.5913 2.63214 11.1174 3.75736 12.2426C4.88258 13.3679 6.4087 14 8 14ZM8 15C6.14348 15 4.36301 14.2625 3.05025 12.9497C1.7375 11.637 1 9.85652 1 8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8C15 9.85652 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85652 15 8 15Z" fill="currentColor"/>
                            </svg>
                            <span><?php esc_html_e('Remove All Agent', 'chaty') ?></span>
                        </button>
                    </header>
                    <!-- agent customizer field start -->
                    <main class="chaty-channel-setting hidden chaty-channel-main-settings space-y-4 px-5 md:px-24 border-t border-solid border-cht-gray-150/10 py-5">
                        
                        <!-- hover text and icon background -->
                        <div class="grid grid-cols-2 gap-5">
                            <div>
                                <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("On Hover Text", "chaty"); ?>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center"><?php esc_html_e('The text that will appear next to your channel when a visitor hovers over it', 'chaty');?></span>
                                        <span class="ml-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                </label>
                                <input type="text" id="cht_social_agent_text_<?php echo esc_attr($social['slug']); ?>" class="chaty-agent-title" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_title]" value="<?php echo esc_attr($value['agent_title']) ?>">
                            </div>
                            <div>
                                <label class="ont-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Icon Appearance", "chaty"); ?></label>
                                <input type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_bg_color]" class="chaty-color-field agent-bg-color" value="<?php echo esc_attr($value['agent_bg_color']) ?>" />
                            </div>
                        </div>

                        <!-- custom image and custom icon -->
                        <div class="flex items-start space-x-5 mt-6">
                            <div>
                                <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Custom Image", "chaty"); ?></label>
                                <a onclick="upload_chaty_agent_image('agent-<?php echo esc_attr($social['slug']); ?>')" href="javascript:;" 
                                    class="upload-chaty-icon bg-white border border-solid border-gray-150 inline-block py-1 px-3 rounded-md text-sm text-cht-gray-150 cursor-pointer hover:border-cht-gray-150/60">
                                    <?php esc_html_e('Upload Image', 'chaty') ?>
                                </a>
                            </div>
                            <div>
                                <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Change Icon", "chaty"); ?></label>
                                <div class="icon-picker-wrap bg-white border border-solid border-gray-150 py-1 px-3 rounded-md text-sm text-cht-gray-150 cursor-pointer hover:border-cht-gray-150/60" id="icon-picker-agent-<?php echo esc_attr($social['slug']); ?>" data-slug="agent-<?php echo esc_attr($social['slug']); ?>">
                                    <div id='select-icon-agent-<?php echo esc_attr($social['slug']); ?>' class="select-icon">
                                        <span class="custom-icon"><?php esc_html_e('Select Icon', 'chaty') ?></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- headers area -->
                        <div>
                            <label class="font-priamry text-cht-gray-150/70 text-base mb-2 mt-6 block"><?php esc_html_e('Header Area', 'chaty') ?></label>
                            <div class="p-4 sm:p-6 rounded-lg border border-solid border-cht-primary/50" style="background-color: #FAF6FE">
                                <!-- header color and text appearance -->
                                <div class="grid grid-cols-2 gap-5">
                                    <!-- header color -->
                                    <div>
                                        <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block">
                                            <?php esc_html_e("Header Color", "chaty"); ?>
                                            <div class="html-tooltip small top">
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 10.6667V8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 5.33203H8.00667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                </span>
                                                <span class="tooltip-text top">
                                                    <?php esc_html_e("Clicking the agent launcher shows a popup with all the agents. Change the popup's header color", "chaty"); ?>
                                                    <img src="<?php echo esc_url(CHT_PLUGIN_URL) ?>/admin/assets/images/agent-section.jpeg" />
                                                </span>
                                            </div>
                                        </label>
                                        <input type="text" class="chaty-color-field" id="agent_head_bg_color_<?php echo esc_attr($social['slug']); ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_head_bg_color]" value="<?php echo esc_attr($value['agent_head_bg_color']) ?>">
                                    </div>
                                    <!-- text appearance -->
                                    <div>
                                        <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block">
                                            <?php esc_html_e("Text Appearance", "chaty"); ?>
                                            <div class="html-tooltip small top">
                                                <span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 10.6667V8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 5.33203H8.00667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                </span>
                                                <span class="tooltip-text top">
                                                    <?php esc_html_e("Clicking the agent launcher shows a popup with all the agents. Change the popup's header text color", "chaty"); ?>
                                                    <img src="<?php echo esc_url(CHT_PLUGIN_URL) ?>/admin/assets/images/agent-section.jpeg" />
                                                </span>
                                            </div>
                                        </label>
                                        <input type="text" class="chaty-color-field" id="agent_head_text_color_<?php echo esc_attr($social['slug']); ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_head_text_color]" value="<?php echo esc_attr($value['agent_head_text_color']) ?>">
                                    </div>
                                </div>

                                <!-- header text -->
                                <div class="mt-6">
                                    <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Header Text", "chaty"); ?>
                                        <div class="html-tooltip small top">
                                            <span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 10.6667V8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 5.33203H8.00667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </span>
                                            <span class="tooltip-text top">
                                                <?php esc_html_e("Add the header text which will be displayed as the heading of the agent launcher popup", "chaty"); ?>
                                                <img src="<?php echo esc_url(CHT_PLUGIN_URL) ?>/admin/assets/images/agent-section.jpeg" />
                                            </span>
                                        </div>
                                    </label>
                                    <input type="text" id="cht_social_agent_title_<?php echo esc_attr($social['slug']); ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_header_text]" value="<?php echo esc_attr($value['agent_header_text']) ?>">
                                </div>
                                <!-- sub header text -->
                                <div class="mt-6">
                                    <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Sub-Header Text", "chaty"); ?>
                                        <div class="html-tooltip small top">
                                            <span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 10.6667V8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 5.33203H8.00667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </span>
                                            <span class="tooltip-text small top">
                                                <?php esc_html_e("Add the sub-header text which will be displayed as the heading of the agent launcher popup", "chaty"); ?>
                                                <img src="<?php echo esc_url(CHT_PLUGIN_URL) ?>/admin/assets/images/agent-section.jpeg" />
                                            </span>
                                        </div>
                                    </label>
                                    <input type="text" id="cht_social_agent_sub_title_<?php echo esc_attr($social['slug']); ?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_sub_header_text]" value="<?php echo esc_attr($value['agent_sub_header_text']) ?>">
                                </div>
                            </div>
                        </div>
                        <!-- header area end -->
                    </main>
                    <!-- agent customizer field end -->
                </div>
            </div>
            <!-- agent settings end -->


            <div class="chaty-agent-advance-setting">
                
                <?php $agentData = isset($value['agent_data'])&&is_array($value['agent_data'])&&count($value['agent_data']) > 0 ? $value['agent_data'] : []; ?>
                <div class="chaty-agents" data-count="<?php echo (count($agentData) + 1) ?>">
                    <div class="chaty-agent-list">
                        <ul class="agent-list" id="agent-list-<?php echo esc_attr($slug) ?>">
                            <?php
                            if (!empty($agentData)) {
                                $count = 1;
                                foreach ($agentData as $key => $agent) {
                                    if (is_numeric($key) && $key != "<?php echo esc_attr($count) ?>") {
                                        $image_id       = isset($agent['image_id']) ? $agent['image_id'] : 0;
                                        $value          = isset($agent['value']) ? $agent['value'] : '';
                                        $is_desktop     = isset($agent['is_desktop']) ? $agent['is_desktop'] : "";
                                        $is_mobile      = isset($agent['is_mobile']) ? $agent['is_mobile'] : "";
                                        $agent_bg_color = $this->validate_color((isset($agent['agent_bg_color']) ? $agent['agent_bg_color'] : $social['color']), $social['color']);
                                        $agent_fa_icon  = isset($agent['agent_fa_icon']) ? $agent['agent_fa_icon'] : '';
                                        $agent_title    = isset($agent['agent_title']) ? $agent['agent_title'] : '';

                                        $imgClass = "";
                                        $imageUrl = CHT_PLUGIN_URL."admin/assets/images/chaty-default.png";
                                        // Initialize with default image if custom image is not exists
                                        if (!empty($agent_fa_icon)) {
                                            $imgClass = "icon-active";
                                        } else {
                                            if (!empty($image_id)) {
                                                $imageUrl = wp_get_attachment_image_src($image_id, "full")[0];
                                                // get custom image URL if exists
                                                if ($imageUrl == "") {
                                                    $imageUrl = CHT_PLUGIN_URL."admin/assets/images/chaty-default.png";
                                                    // Initialize with default image if custom image is not exists
                                                } else {
                                                    $imgClass = "img-active";
                                                }
                                            }
                                        }

                                        if (($social['slug'] == "Whatsapp") && !empty($value)) {
                                            if ($value[1] == "0") {
                                                $value[1] = " ";
                                                $value = str_replace(' ', '', $value);
                                            }
                                        }
                                        ?>
                                        <li class="agent-info">
                                            <div class="agent-channel-setting" id="agent-<?php echo esc_attr($slug) ?>-<?php echo esc_attr($count) ?>" data-item="<?php echo esc_attr($count) ?>">
                                                <div class="agent-channel-setting-top px-2 sm:pl-3 sm:pr-5">
                                                    <div class="flex items-center">
                                                        <div class="move-channel-icon transition duration-200 opacity-0 ">
                                                            <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/move-icon.png") ?>" />
                                                        </div>
                                                        <div class="agent-icon <?php echo esc_attr($imgClass) ?>" id="image_agent_data_<?php echo esc_attr($social['slug']) ?>-<?php echo esc_attr($count) ?>">
                                                            <span style="" class="custom-agent-image overflow-hidden rounded-full custom-agent-image-<?php echo esc_attr($social['slug']) ?>-<?php echo esc_attr($count) ?>">
                                                                <img class="agent-image w-full h-full object-cover" src="<?php echo esc_url($imageUrl) ?>" />
                                                                <span class="remove-agent-img"></span>
                                                                <input class="image-id" id="cht_social_agent_image_<?php echo esc_attr($social['slug']); ?>-<?php echo esc_attr($count) ?>" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][image_id]" value="<?php echo esc_attr($image_id) ?>" />
                                                            </span>
                                                            <span class="default-agent-icon custom-agent-icon-<?php echo esc_attr($social['slug']) ?>-<?php echo esc_attr($count) ?> default_agent_image_<?php echo esc_attr($social['slug']) ?>-<?php echo esc_attr($count) ?>" >
                                                                <?php echo $svg_icon; ?>
                                                            </span>
                                                            <span class="facustom-icon flex items-center justify-center" style="background-color: <?php echo esc_attr($agent_bg_color) ?>">
                                                                <i class="<?php echo esc_attr($agent_fa_icon) ?>"></i>
                                                            </span>
                                                            <span class="agent-info-image header-tooltip">
                                                                <span class="header-tooltip-text text-center">
                                                                    <?php if(isset($social['header_help'])) {
                                                                        echo "<span class='agent-viber-note'>".esc_attr($social['header_help'])."</span>";
                                                                    } ?>
                                                                    <?php esc_html_e("This channel is an instance of the main channel", "chaty") ?>
                                                                </span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                                </svg>
                                                            </span>
                                                            <span class="remove-icon-img remove-img-icon" data-slug="<?php echo esc_attr($social['slug']) ?>-<?php echo esc_attr($count) ?>"></span>
                                                            <input class="fa-icon" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][agent_fa_icon]" value="<?php echo esc_attr($agent_fa_icon) ?>">
                                                        </div>
                                                    </div>

                                                    <div class="flex-auto">
                                                        <div class="agent-channel-input">
                                                            <div class="p-relative agent-<?php echo esc_attr($social['slug']) ?>-btn test-btn">
                                                                <input placeholder="<?php echo esc_attr($placeholder); ?>" class="agent-input-value <?php echo ($social['slug'] == "") ? "chaty-whatsapp-phone" : "" ?> custom-agent-channel-<?php echo esc_attr($social['slug']) ?>" id="cht_social_agent_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($count) ?>" data-id="<?php echo esc_attr($count) ?>" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][value]" value="<?php echo esc_attr($value) ?>">
                                                                <?php if($social['slug'] == 'Whatsapp') { ?>
                                                                    <span class="header-tooltip-text text-center leading-zero-msg">
                                                                        <span class="close-msg-box">
                                                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 1L1 11M1 1L11 11" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                                        </span>
                                                                        You entered the phone number with a leading zero. We've fixed it for you
                                                                    </span>
                                                                 <?php } ?>
                                                                <?php if($social['slug'] == 'Whatsapp' || $social['slug'] == 'Facebook_Messenger') { ?>
                                                                    <button type="button" class="wf-test-button <?php echo !empty($value) ? "active" : "" ?>" data-slug="<?php echo esc_attr($social['slug']) ?>"><?php esc_html_e('Test', 'chaty') ?></button>
                                                                <?php } ?>
                                                            </div>
                                                            <div class="chaty-agent-setting-col">
                                                                <div>
                                                                    <!-- input for custom title -->
                                                                    <input type="text" placeholder="Agent name & title" class="chaty-agent-name" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][agent_title]"  value="<?php echo esc_attr($agent_title) ?>">
                                                                </div>
                                                            </div>
                                                            <div class="clear clearfix"></div>
                                                        </div>
                                                        <div class="agent-channel-setting-btn mt-2 inline-block">
                                                            <button type="button" class="agent-channel-setting-button"><span class="dashicons dashicons-admin-generic"></span> <?php esc_html_e("Settings", 'chaty') ?></button>
                                                        </div>
                                                    </div>
                                                    
                                                    <button type="button" class="remove-agent-btn absolute -top-1 right-2 text-cht-gray-150 hover:text-cht-red">
                                                        <svg class="pointer-events-none" data-v-1cf7b632="" width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1">
                                                            <path data-v-1cf7b632="" d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.334 1.334 0 01-1.334 1.334H4.667a1.334 1.334 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div class="agent-channel-setting-advance hidden">
                                                    <div class="grid grid-cols-2 gap-5">

                                                        <div>
                                                            <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Custom Image", "chaty") ?></label>
                                                            <a onclick="upload_chaty_agent_image('<?php echo esc_attr($social['slug']); ?>-<?php echo esc_attr($count) ?>')" href="javascript:;" class="upload-chaty-icon bg-white border border-solid border-gray-150 py-1 px-3 inline-block rounded-md text-sm text-cht-gray-150 cursor-pointer hover:border-cht-gray-150/60">Upload Image</a>
                                                        </div>

                                                        <!-- input for custom color -->
                                                        <div>
                                                            <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Icon Appearance", "chaty") ?></label>
                                                            <input type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][agent_bg_color]" class="chaty-color-field agent-icon-color" value="<?php echo esc_attr($agent_bg_color) ?>" />
                                                        </div>

                                                        <div>
                                                            <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Change Icon", "chaty") ?></label>
                                                            <div class="icon-picker-wrap bg-white border border-solid border-gray-150 py-1 px-3 rounded-md text-sm text-cht-gray-150 cursor-pointer hover:border-cht-gray-150/60 inline-block" id="icon-picker-<?php echo esc_attr($social['slug']); ?>-<?php echo esc_attr($count) ?>" data-slug="<?php echo esc_attr($social['slug']); ?>-<?php echo esc_attr($count) ?>">
                                                                <div id='select-icon-<?php echo esc_attr($social['slug']); ?>-<?php echo esc_attr($count) ?>' class="select-icon">
                                                                    <span class="custom-icon">Select Icon</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <!-- linkedin options -->
                                                        <?php if ($social['slug'] == "Linkedin") { ?>
                                                            <?php $is_checked = isset($agent['link_type']) ? $agent['link_type'] : "personal"; ?>
                                                            <!-- Advance setting for Custom Link -->
                                                            <div>
                                                                <label class="font-primary text-base text-cht-gray-150 sm:w-44" ><?php esc_html_e("LinkedIn", "chaty") ?></label>
                                                                <div class="linkedIn-setting sm:flex space-x-0 sm:space-x-3 space-y-3 sm:space-y-0 items-center">
                                                                    <label class="flex items-center font-primary text-cht-gray-150">
                                                                        <input type="radio" <?php checked($is_checked, "personal") ?> name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][link_type]" value="personal">
                                                                        <?php esc_html_e("Personal", "chaty") ?>
                                                                    </label>
                                                                    <label class="flex items-center font-primary text-cht-gray-150">
                                                                        <input type="radio" <?php checked($is_checked, "company") ?> name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][link_type]" value="company">
                                                                        <?php esc_html_e("Company", "chaty") ?>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        <?php } ?>

                                                    </div>
                                                    <?php if($social['slug'] == "Whatsapp") { ?>
                                                        <div class="Whatsapp-settings advanced-settings">
                                                            <div class="chaty-setting-col sm:flex items-start space-y-2 sm:space-y-0 sm:space-x-3">
                                                                <label class="font-primary text-base text-cht-gray-150 sm:w-44" style="flex: 0 0 175px;">
                                                                    <span><?php esc_html_e("Pre Set Message", "chaty") ?></span>
                                                                    <span class="icon label-tooltip inline-tooltip" data-title="Add your own pre-set message that's automatically added to the user's message.You can also use merge tags and add the URL or the title of the current visitor's page.E.g. you can add the current URL of a product to the message so you know which product the visitor is talking about when the visitor messages you">
                                                                    <span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" class="inline-block" width="20" height="27" viewBox="0 0 20 20" fill="none">
                                                                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                                        </svg>
                                                                    </span>
                                                                </span>
                                                                </label>
                                                                <div class="group-custom custom-input-tags relative">
                                                                    <div class="pre-message-whatsapp">
                                                                        <?php $pre_set_message = isset($agent['pre_set_message']) ? $agent['pre_set_message'] : ""; ?>
                                                                        <input
                                                                                id="cht_social_message_<?php echo esc_attr($social['slug']); ?>_pre_set_message_agent<?php echo esc_attr($count) ?>"
                                                                                type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][pre_set_message]"
                                                                                class="pre-set-message-whatsapp add-custom-tags chaty-input-text <?php echo esc_attr(!$this->is_pro() ? 'pointer-events-none': '') ?>"
                                                                                value="<?php echo esc_attr($pre_set_message) ?>"
                                                                            <?php echo esc_attr(!$this->is_pro() ? 'disabled': '') ?>
                                                                        >
                                                                        <button data-button="cht_social_message_<?php echo esc_attr($social['slug']); ?>" class="wp-pre-set-emoji-agent" id="wp_pre_set_emoji_agent" type="button">
                                                                            <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/icon-picker.png"); ?>" alt="icon picker">
                                                                        </button>
                                                                    </div>

                                                                    <?php include "custom-tags.php" ?>
                                                                    <?php if (!$this->is_pro()) : ?>
                                                                        <div class="backdrop-blur-sm absolute left-0 top-0 w-full h-full opacity-0 group-custom-hover:opacity-100">
                                                                            <a
                                                                                    class="bg-cht-primary focus:text-white text-base py-1.5 px-2 rounded-[4px] text-white hover:text-white text-center w-[208px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                                                                    target="_blank"
                                                                                    href="<?php echo esc_url($this->getUpgradeMenuItemUrl()); ?>">
                                                                                <?php esc_html_e('Activate your license key', 'chaty'); ?>
                                                                            </a>
                                                                        </div>
                                                                    <?php endif; ?>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <?php $use_whatsapp_web = isset($agent['use_whatsapp_web']) ? $agent['use_whatsapp_web'] : "yes"; ?>
                                                        <div class="Whatsapp-settings advanced-settings">
                                                            <div class="chaty-setting-col sm:flex items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                                                <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("Whatsapp Web" ,"chaty") ?>
                                                                    <span class="header-tooltip">
                                                                        <span class="header-tooltip-text text-center"><?php esc_html_e("If unchecked, visitors will be redirected to chat with you via the WhatsApp desktop app. Please note if they don't have it installed, they'll be redirected to WhatsApp Web", 'chaty');?></span>
                                                                        <span class="ml-1">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                                            </svg>
                                                                        </span>
                                                                    </span>
                                                                </label>
                                                                <div>
                                                                    <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][use_whatsapp_web]" value="no" />
                                                                    <div class="flex items-center space-x-2">
                                                                        <div class="checkbox">
                                                                            <label for="cht_social_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($count) ?>_use_whatsapp_web_agent" class="chaty-checkbox text-cht-gray-150 text-base">
                                                                                <input class="sr-only" type="checkbox" id="cht_social_<?php echo esc_attr($social['slug']); ?>_<?php echo esc_attr($count) ?>_use_whatsapp_web_agent" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][<?php echo esc_attr($count) ?>][use_whatsapp_web]" value="yes" <?php echo checked($use_whatsapp_web, "yes") ?> />
                                                                                <span></span>
                                                                                <?php esc_html_e("Use Whatsapp Web directly on desktop", "chaty") ?>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    <?php } ?>
                                                </div>
                                            </div>
                                        </li>
                                        <?php
                                        $count++;
                                    }//end if
                                }//end foreach
                            }//end if
                            ?>
                        </ul>
                    </div>
                    <div class="add-agent-button">
                        <button type="button" class="add-new-button space-x-2 flex items-center bg-white border border-solid border-gray-150 py-2.5 px-3.5 rounded-lg text-sm text-cht-gray-150 cursor-pointer hover:border-cht-gray-150/60" data-slug="<?php echo esc_attr($social['slug']) ?>">
                            <svg width="20" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M7 2C5.073 2 3.5 3.573 3.5 5.5C3.5 6.705 4.115 7.776 5.047 8.4065C3.2635 9.1715 2 10.94 2 13H3C3 10.785 4.785 9 7 9C7.688 9 8.327 9.179 8.89 9.485C8.31402 10.1966 7.99984 11.0845 8 12C8 14.203 9.797 16 12 16C14.203 16 16 14.203 16 12C16 9.797 14.203 8 12 8C11.1575 8.00113 10.337 8.26892 9.656 8.765C9.435 8.6265 9.196 8.51 8.953 8.406C9.42886 8.08508 9.81873 7.65233 10.0884 7.14568C10.3582 6.63904 10.4995 6.07396 10.5 5.5C10.5 3.573 8.927 2 7 2ZM7 3C8.3865 3 9.5 4.1135 9.5 5.5C9.5 6.8865 8.3865 8 7 8C5.6135 8 4.5 6.8865 4.5 5.5C4.5 4.1135 5.6135 3 7 3ZM12 9C13.663 9 15 10.337 15 12C15 13.663 13.663 15 12 15C10.337 15 9 13.663 9 12C9 10.337 10.337 9 12 9ZM11.5 10V11.5H10V12.5H11.5V14H12.5V12.5H14V11.5H12.5V10H11.5Z" fill="currentColor"/>
                            </svg>
                            <span>
                                <?php esc_html_e("Add new Agent", "chaty") ?>
                            </span>
                        </button>
                    </div>
                </div>
                <div style="display: none" class="default-agent-setting">
                    <div class="agent-channel-setting"  id="agent-<?php echo esc_attr($slug) ?>-__count__" data-item="__count__">
                        <div class="agent-channel-setting-top px-2 sm:pl-3 sm:pr-5">
                            
                            <div class="flex items-center">
                                <div class="move-channel-icon transition duration-200">
                                    <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/move-icon.png") ?>" />
                                </div>
                                <div class="agent-icon" id="image_agent_data_<?php echo esc_attr($social['slug']) ?>-__count__">
                                    <span style="" class="custom-agent-image rounded-full overflow-hidden custom-agent-image-<?php echo esc_attr($social['slug']) ?>-__count__">
                                        <img class="agent-image w-full h-full object-cover" src="<?php echo esc_url($imageUrl) ?>" />
                                        <span class="remove-agent-img"></span>
                                        <input class="image-id" id="cht_social_agent_image_<?php echo esc_attr($social['slug']); ?>-__count__" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][image_id]" value="" />
                                    </span>
                                    <span class="default-agent-icon custom-agent-icon-<?php echo esc_attr($social['slug']) ?>-__count__ default_agent_image_<?php echo esc_attr($social['slug']) ?>-__count__" >
                                        <?php echo $svg_icon; ?>
                                    </span>
                                    <span class="facustom-icon flex items-center justify-center" style="background-color: <?php echo esc_attr($social['color']) ?>"></span>
                                    <span class="agent-info-image header-tooltip">
                                        <span class="header-tooltip-text text-center">
                                            <?php if(isset($social['header_help'])) {
                                                echo "<span class='agent-viber-note'>".esc_attr($social['header_help'])."</span>";
                                            } ?>
                                            <?php esc_html_e("This channel is an instance of the main channel", "chaty") ?>
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </span>
                                    <input class="fa-icon" type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][agent_fa_icon]" value="">
                                    <span class="remove-icon-img remove-img-icon" data-slug="<?php echo esc_attr($social['slug']) ?>-__count__"></span>
                                </div>
                            </div>
                            
                            <div class="flex-auto">
                                <div class="agent-channel-input">
                                    <div class="p-relative agent-<?php echo esc_attr($social['slug']) ?>-btn test-btn">
                                        <input placeholder="<?php echo esc_attr($placeholder); ?>" class="agent-input-value <?php echo ($social['slug'] == "") ? "chaty-whatsapp-phone-alt" : "" ?> custom-agent-channel-<?php echo esc_attr($social['slug']) ?>"  id="cht_social_agent_<?php echo esc_attr($social['slug']); ?>___count__" data-id="__count__" type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][value]">
                                        <?php if($social['slug'] == 'Whatsapp') { ?>
                                            <span class="header-tooltip-text text-center leading-zero-msg">
                                                <span class="close-msg-box">
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 1L1 11M1 1L11 11" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                </span>
                                                You entered the phone number with a leading zero. We've fixed it for you
                                            </span>
                                        <?php } ?>
                                        <?php if($social['slug'] == 'Whatsapp' || $social['slug'] == 'Facebook_Messenger') { ?>
                                            <button type="button" class="wf-test-button" data-slug="<?php echo esc_attr($social['slug']) ?>"><?php esc_html_e('Test', 'chaty') ?></button>
                                        <?php } ?>
                                    </div>
                                    <div class="chaty-agent-setting-col">
                                        <div>
                                            <!-- input for custom title -->
                                            <input placeholder="Agent name & title" type="text" class="chaty-agent-name" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][agent_title]" value="">
                                        </div>
                                    </div>
                                    <div class="clear clearfix"></div>
                                </div>
                                <div class="agent-channel-setting-btn mt-2 inline-block">
                                    <button type="button" class="agent-channel-setting-button"><span class="dashicons dashicons-admin-generic"></span> <?php esc_html_e("Settings", 'chaty') ?></button>
                                </div>
                            </div>
                            
                            <button type="button" class="remove-agent-btn absolute right-2 -top-1 text-cht-gray-150 hover:text-cht-red" >
                                <svg class="pointer-events-none" data-v-1cf7b632="" width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1">
                                    <path data-v-1cf7b632="" d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.334 1.334 0 01-1.334 1.334H4.667a1.334 1.334 0 01-1.334-1.334V4h9.334z" stroke="#49687E" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="agent-channel-setting-advance hidden">
                            <div class="grid grid-cols-2 gap-5">
                                
                                <div>
                                    <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Custom Image", "chaty") ?></label>
                                    <a onclick="upload_chaty_agent_image('<?php echo esc_attr($social['slug']); ?>-__count__')" href="javascript:;" class="upload-chaty-icon bg-white border border-solid border-gray-150 py-1 px-3 rounded-md text-sm text-cht-gray-150 cursor-pointer inline-block hover:border-cht-gray-150/60">Upload Image</a>
                                </div>

                                <div>
                                    <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Icon Appearance", "chaty") ?></label>
                                    <input type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][agent_bg_color]" class="chaty-color-field-agent agent-icon-color" value="<?php echo esc_attr($social['color']) ?>" />
                                </div>

                                <div>
                                    <label class="font-priamry text-cht-gray-150/70 text-base mb-2 block"><?php esc_html_e("Change Icon", "chaty") ?></label>
                                    <div class="icon-picker-wrap-agent bg-white border border-solid border-gray-150 py-1 px-3 rounded-md text-sm text-cht-gray-150 cursor-pointer hover:border-cht-gray-150/60 inline-block" id="agent-icon-picker-<?php echo esc_attr($social['slug']); ?>-__count__" data-slug="<?php echo esc_attr($social['slug']); ?>-__count__">
                                        <div id='select-agent-icon-<?php echo esc_attr($social['slug']); ?>-__count__' class="select-icon">
                                            <span class="custom-icon">Select Icon</span>
                                        </div>
                                    </div>
                                </div>

                                <?php if ($social['slug'] == "Linkedin") { ?>
                                <div>
                                    <label class="font-primary text-base text-cht-gray-150 sm:w-44" ><?php esc_html_e("LinkedIn", "chaty") ?></label>
                                    <div class="linkedIn-setting sm:flex space-x-0 sm:space-x-3 space-y-3 sm:space-y-0">
                                        <label class="flex items-center font-primary text-cht-gray-150">
                                            <input type="radio" checked name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][link_type]" value="personal">
                                            <?php esc_html_e("Personal", "chaty") ?>
                                        </label>
                                        <label class="flex items-center font-primary text-cht-gray-150">
                                            <input type="radio" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][link_type]" value="company">
                                            <?php esc_html_e("Company", "chaty") ?>
                                        </label>
                                    </div>
                                </div>
                                <?php } ?>

                            </div>
                            <?php if($social['slug'] == "Whatsapp") { ?>
                                <div class="Whatsapp-settings advanced-settings">
                                    <div class="chaty-setting-col sm:flex items-start space-y-2 sm:space-y-0 sm:space-x-3">
                                        <label class="font-primary text-base text-cht-gray-150 sm:w-44" style="flex: 0 0 175px;">
                                            <span><?php esc_html_e("Pre Set Message", "chaty") ?></span>
                                            <span class="icon label-tooltip inline-tooltip" data-title="Add your own pre-set message that's automatically added to the user's message.You can also use merge tags and add the URL or the title of the current visitor's page.E.g. you can add the current URL of a product to the message so you know which product the visitor is talking about when the visitor messages you">
                                            <span>
                                                <svg xmlns="http://www.w3.org/2000/svg" class="inline-block" width="20" height="27" viewBox="0 0 20 20" fill="none">
                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </span>
                                        </span>
                                        </label>
                                        <div class="group-custom custom-input-tags relative">
                                            <div class="pre-message-whatsapp">
                                                <input
                                                        id="cht_social_message_<?php echo esc_attr($social['slug']); ?>_pre_set_message_agent__count__"
                                                        type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][pre_set_message]"
                                                        class="pre-set-message-whatsapp add-custom-tags chaty-input-text <?php echo esc_attr(!$this->is_pro() ? 'pointer-events-none': '') ?>"
                                                        value=""
                                                    <?php echo esc_attr(!$this->is_pro() ? 'disabled': '') ?>
                                                >
                                                <button data-button="cht_social_message_<?php echo esc_attr($social['slug']); ?>" class="wp-pre-set-emoji-agent" id="wp_pre_set_emoji_agent" type="button">
                                                    <img src="<?php echo esc_url(CHT_PLUGIN_URL."admin/assets/images/icon-picker.png"); ?>" alt="icon picker">
                                                </button>
                                            </div>

                                            <?php include "custom-tags.php" ?>
                                            <?php if (!$this->is_pro()) : ?>
                                                <div class="backdrop-blur-sm absolute left-0 top-0 w-full h-full opacity-0 group-custom-hover:opacity-100">
                                                    <a
                                                            class="bg-cht-primary focus:text-white text-base py-1.5 px-2 rounded-[4px] text-white hover:text-white text-center w-[208px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                                            target="_blank"
                                                            href="<?php echo esc_url($this->getUpgradeMenuItemUrl()); ?>">
                                                        <?php esc_html_e('Activate your license key', 'chaty'); ?>
                                                    </a>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                                <div class="Whatsapp-settings advanced-settings">
                                    <div class="chaty-setting-col sm:flex items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                        <label class="font-primary text-base text-cht-gray-150 sm:w-44"><?php esc_html_e("Whatsapp Web" ,"chaty") ?>
                                            <span class="header-tooltip">
                                                <span class="header-tooltip-text text-center"><?php esc_html_e("If unchecked, visitors will be redirected to chat with you via the WhatsApp desktop app. Please note if they don't have it installed, they'll be redirected to WhatsApp Web", 'chaty');?></span>
                                                <span class="ml-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                </span>
                                            </span>
                                        </label>
                                        <div>
                                            <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][use_whatsapp_web]" value="no" />
                                            <div class="flex items-center space-x-2">
                                                <div class="checkbox">
                                                    <label for="cht_social_<?php echo esc_attr($social['slug']); ?>___count___use_whatsapp_web_agent" class="chaty-checkbox text-cht-gray-150 text-base">
                                                        <input class="sr-only" type="checkbox" id="cht_social_<?php echo esc_attr($social['slug']); ?>___count___use_whatsapp_web_agent" name="cht_social_<?php echo esc_attr($social['slug']); ?>[agent_data][__count__][use_whatsapp_web]" value="yes" checked/>
                                                        <span></span>
                                                        <?php esc_html_e("Use Whatsapp Web directly on desktop", "chaty") ?>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            <?php } ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <?php }//end if
    ?>
    <!-- remove button start -->
    <button type="button" class="btn-cancel" data-social="<?php echo esc_attr($social['slug']); ?>">
        <svg class="pointer-events-none" data-v-1cf7b632="" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1"><path data-v-1cf7b632="" d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.334 1.334 0 01-1.334 1.334H4.667a1.334 1.334 0 01-1.334-1.334V4h9.334z" stroke="#49687E" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    </button>
    <!-- remove button end -->
</li>
<!-- Social media setting box: end -->


<div class="test-popup" id="Whatsapp_popup" data-label="Whatsapp">
    <div class="test-popup-bg"></div>
    <div class="test-popup-content">
        <button class="test-popup-close-btn" type="button">
            <span class="svg-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"></path></svg>
            </span>
        </button>
        <div class="test-popup-header">
            <span class="divider"></span>
            <span class="title"><?php esc_html_e('WhatsApp test', 'chaty') ?></span>
        </div>
        <div class="test-popup-body">
            <div class="title"><?php esc_html_e('Did we redirect you to the correct Whatsapp link for this number?', 'chaty') ?></div>
            <div class="phone-value"><?php esc_html_e('+91-7485963214', 'chaty') ?></div>
            <div class="popup-btn">
                <button type="button" class="edit-number"><?php esc_html_e('Edit Number', 'chaty') ?></button>
                <button type="button" class="save-btn"><?php esc_html_e('Yes, Correct', 'chaty') ?></button>
            </div>
            <div class="contact-link"><?php esc_html_e('Having trouble? Contact ', 'chaty') ?><a href="javascript:;"><?php esc_html_e('Support', 'chaty') ?></a></div>
        </div>
    </div>
</div>

<div class="test-popup" id="Facebook_Messenger_popup" data-label="Facebook_Messenger">
    <div class="test-popup-bg"></div>
    <div class="test-popup-content">
        <button class="test-popup-close-btn" type="button">
            <span class="svg-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"></path></svg>
            </span>
        </button>
        <div class="test-popup-header">
            <span class="divider"></span>
            <span class="title"><?php esc_html_e('Facebook Messenger test', 'chaty') ?></span>
        </div>
        <div class="test-popup-body">
            <div class="title"><?php esc_html_e('Did we redirect you to the correct Facebook Messenger link?', 'chaty') ?></div>
            <div class="phone-value"><?php esc_html_e('m.me/coca-cola', 'chaty') ?></div>
            <div class="popup-btn">
                <button type="button" class="edit-number"><?php esc_html_e('Edit Link', 'chaty') ?></button>
                <button type="button" class="save-btn"><?php esc_html_e('Yes, Correct', 'chaty') ?></button>
            </div>
            <div class="contact-link"><?php esc_html_e('Having trouble? Contact ', 'chaty') ?><a href="javascript:;"><?php esc_html_e('Support', 'chaty') ?></a></div>
        </div>
    </div>
</div>
