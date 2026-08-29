<?php
/**
 * MSE Mailchimp Integration
 *
 * @author  : Premio <contact@premio.io>
 * @license : GPL2
 * */


if (!defined('ABSPATH')) {
    exit;
}

$mailchimp_list       = ( isset($value['mailchimp_list'])) ? $value['mailchimp_list'] : '';
$mailchimp_enable_tag = ( isset($value['mailchimp_enable_tag'])) ? $value['mailchimp_enable_tag'] : '';
$mailchimp_tags       = ( isset($value['mailchimp_tags'])) ? $value['mailchimp_tags'] : '';

$mailchimp_enable_group  = ( isset($value['mailchimp-enable-group'])) ? $value['mailchimp-enable-group'] : '';
$mailchimp_group         = ( isset($value['mailchimp-group'])) ? $value['mailchimp-group'] : [];
$mailchimp_field_mapping = ( isset($value['mailchimp-field-mapping'])) ? $value['mailchimp-field-mapping'] : array();


$mc_fields = \CHT\admin\CHT_PRO_Social_Icons::chaty_get_mailchimp_lists_fields($mailchimp_list);
$element_mc_lists = \CHT\admin\CHT_PRO_Social_Icons::chaty_get_mailchimp_lists($mailchimp_list);
?>
<div id="" class="mailchimp-settings <?php echo ($mailchimp_enable == "yes") ? "active" : "" ?>">
    <h3 class="mailchimp-header">Mailchimp integration settings</h3>
    <div class="chaty-setting-col">
        <label class="font-primary text-cht-gray-150" for="chaty_mailchimp_lists">
            <span><?php esc_html_e('Select a Mailchimp list', 'chaty');?></span>
        </label>
        <div class="">
            <select class="w-full" id="chaty_mailchimp_lists" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailchimp_list]">
                <option value="">Select a list</option>
                <?php
                if (!empty($element_mc_lists)) :
                    foreach ($element_mc_lists as $lists) :?>
                        <option value="<?php echo esc_attr($lists['id'])?>" <?php selected($lists['id'], @$mailchimp_list, true);?>><?php echo esc_attr($lists['name'])?></option>
                    <?php endforeach;
                endif;
                ?>
            </select>
        </div>
    </div>
    <div class="chaty-setting-col mt-5">
        <label for="mailchimp-enable-tag" class="full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
            <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailchimp_enable_tag]" value="no">
            <input class="email-content-switch" type="checkbox" id="mailchimp-enable-tag" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailchimp_enable_tag]" <?php checked(@$mailchimp_enable_tag, 'yes'); ?>>
            <div class="chaty-slider round"></div>
            <?php esc_html_e('Enable tags', 'chaty');?>
            <span class="icon label-tooltip email-tooltip" data-title="Tag your leads with custom tags and find them with the tags in MailChimp">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </span>
        </label>
    </div>
    <div class="chaty-mailchimp-tags-info chaty-setting-col mt-5" <?php if (@$mailchimp_enable_tag != 'yes') : ?>style="display:none" <?php endif;?>>
        <input type="text" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailchimp_tags]" class="w-full" value="<?php echo esc_attr($mailchimp_tags);?>" placeholder="Example: WP tag, Another tag" style="float: none; width: 100%"/>
        <p class="description">The listed tags will be applied to all subscribers added by this form. Separate multiple values with a comma. </p>
    </div>
    <?php $mailchimp_groups = \CHT\admin\CHT_PRO_Social_Icons::chaty_get_mailchimp_groups($mailchimp_list); ?>
    <div class="chaty-mailchimp-groups" <?php if (empty($mailchimp_groups)) :?> style="display:none;" <?php endif;?>>
        <div class="chaty-setting-col mt-5">
            <label for="mailchimp-enable-group" class="full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
                <input type="hidden" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailchimp-enable-group]" value="no">
                <input class="email-content-switch" type="checkbox" id="mailchimp-enable-group" value="yes" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailchimp-enable-group]" <?php checked($mailchimp_enable_group, 'yes'); ?>>
                <div class="chaty-slider round"></div>
                <?php esc_html_e('Enable groups', 'chaty');?>
                <span class="icon label-tooltip email-tooltip" data-title="Sort your contacts based on their interests and preferences by using groups">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </span>
            </label>
        </div>
        <div class="chaty-setting-col mailchimp-group-info" <?php if ($mailchimp_enable_group != 'yes') : ?>style="display:none" <?php endif;?>>
            <div class="mt-5">
                <select class="w-full" id="mailchimp-group" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailchimp-group][]" multiple>
                    <option value="">Select Groups</option>
                    <?php if (!empty($mailchimp_groups)) :?>
                        <?php foreach ($mailchimp_groups as $key => $groups) :?>
                            <optgroup label="<?php echo esc_html($key);?>">
                                <?php foreach ($groups as $group) {
                                    $selected = in_array($group['id'], $mailchimp_group) ? "selected" : "";
                                    ?>
                                    <option value="<?php echo esc_html($group['id']);?>" <?php echo esc_attr($selected) ?> >
                                        <?php echo esc_html($group['name']);?>
                                    </option>
                                <?php } ?>
                            </optgroup>
                        <?php endforeach;?>
                    <?php endif;?>
                </select>
            </div>
        </div>
    </div>
    <div class="chaty-mailchimp-field-mapping chaty-setting-wrap-list" <?php if(!isset($value['custom_fields']) && empty($value['custom_fields']) || $mailchimp_list == '' ) :?> style="display:none;" <?php
    endif;?>>
        <div class="chaty-setting-col mt-5">
            <label for="mailchimp-enable-group" class="full-width chaty-switch text-base text-cht-gray-150 flex items-center group-custom">
                <?php esc_html_e('Field mapping', 'chaty');?>
                <span class="icon label-tooltip email-tooltip" data-title="Your default fields (email, name, etc) will be automatically synced. Use the field mapping option to decide which Chaty fields are pushed to your integration's fields.">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </span>
            </label>
        </div>
        <div class="chaty-mailchimp-field-lists">
            <?php if(isset($value['custom_fields']) && !empty($value['custom_fields'])) :?>
                <?php foreach( $value['custom_fields'] as $key => $fields ):
            $custom_field_name = sanitize_title($fields['field_label']);
            ?>
            <div class="chaty-setting-col mapping-field-<?php echo esc_attr($key); ?>">
                <label class="font-primary text-cht-gray-150" for="<?php echo esc_html($fields['field_label'])?>">
                    <span><?php echo esc_html($fields['field_label'])?></span>
                </label>
                <div class="">
                    <select class="w-full" id="<?php echo esc_html($fields['field_label'])?>" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailchimp-field-mapping][<?php echo esc_attr($fields['field_label']);?>]">
                        <option value="">Select fields</option>
                        <?php foreach( $mc_fields as $field):
                        if($field['field_label'] != "Address") {
                            ?>
                            <option value="<?php echo esc_attr($field['field_id']);?>" <?php if(isset($mailchimp_field_mapping[$fields['field_label']]) && $mailchimp_field_mapping[$fields['field_label']] == $field['field_id'] ) :?> selected <?php
                            endif;?>><?php echo esc_html($field['field_label']);?></option>
                        <?php } endforeach;?>
                    </select>
                </div>
            </div>
                <?php endforeach;?>
            <?php endif;?>
        </div>
    </div>
</div>
