<?php
/**
 * MSE Mailpoet Integration
 *
 * @author  : Premio <contact@premio.io>
 * @license : GPL2
 * */

if (defined('ABSPATH') === false) {
    exit;
}

if (class_exists('\MailPoet\API\API')) :
    $mailpoet_list = ( isset($value['mailpoet_list'])) ? $value['mailpoet_list'] : '';
    ?>

    <div class="mailpoet-settings <?php echo ($mailpoet_enable == "yes") ? "active" : "" ?>">
        <div class="chaty-setting-col">
            <label class="font-primary text-cht-gray-150" for="sfba_mailchimp_lists">
                <span><?php esc_html_e('Select a MailPoet list', 'chaty');?></span>
            </label>
            <div class="">
                <select class="w-full" id="sfba_mailchimp_lists" name="cht_social_<?php echo esc_attr($social['slug']); ?>[mailpoet_list]">
                    <option value="">Select a list</option>
                    <?php
                    if (!empty($mailpoet_lists)) :
                        foreach ($mailpoet_lists as $lists) :
                            if ($lists['id'] != '' && $lists['name'] != '') {
                                ?>
                                <option value="<?php echo esc_attr($lists['id'])?>" <?php selected($lists['id'], @$mailpoet_list, true);?>><?php echo esc_html($lists['name'])?></option>
                            <?php }
                        endforeach;
                    endif;
                    ?>
                </select>
            </div>
        </div>
    </div>

<?php endif;
