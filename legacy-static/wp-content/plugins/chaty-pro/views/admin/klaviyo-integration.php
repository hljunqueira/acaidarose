<?php
/**
 * MSE Klaviyo Integration
 *
 * @author  : Premio <contact@premio.io>
 * @license : GPL2
 * */

if (defined('ABSPATH') === false) {
    exit;
}
$mailpoet_list = ( isset($value['klaviyo_list'])) ? $value['klaviyo_list'] : '';
?>

<div class='klaviyo-settings <?php echo esc_attr($klaviyo_enable == "yes" && $status == 1 ? 'active' : ''); ?>'>
    <div class='chaty-setting-col'>
        <label class="font-primary text-cht-gray-150" for="chaty_klaviyo_list">
            <span><?php esc_html_e('Klaviyo integration settings', 'chaty');?></span>
        </label>
        <div class="">
            <select name='cht_social_<?php echo esc_attr($social['slug']); ?>[klaviyo_list]' id="chaty_klaviyo_list" class="w-full">
                <option value=''>Select a list</option>
                <?php
                if (1 === $status && count($list) > 0) {
                    foreach ($list as $lst) {
                        ?>
                        <option value='<?php echo esc_attr($lst['list_id']); ?>' <?php echo selected($lst['list_id'], $mailpoet_list, false); ?>>
                            <?php echo esc_html($lst['list_name']); ?>
                        </option>
                        <?php
                    }
                }
                ?>
            </select>
        </div>
    </div>
</div>