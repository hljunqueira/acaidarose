<?php
if (!defined('ABSPATH')) {
    exit;
}
$days = [
    "0"  => esc_html__("Everyday of week", "chaty"),
    "1"  => esc_html__("Sunday", "chaty"),
    "2"  => esc_html__("Monday", "chaty"),
    "3"  => esc_html__("Tuesday", "chaty"),
    "4"  => esc_html__("Wednesday", "chaty"),
    "5"  => esc_html__("Thursday", "chaty"),
    "6"  => esc_html__("Friday", "chaty"),
    "7"  => esc_html__("Saturday", "chaty"),
    "8"  => esc_html__("Sunday to Thursday", "chaty"),
    "9"  => esc_html__("Monday to Friday", "chaty"),
    "10" => esc_html__("Weekend", "chaty"),
];
$is_pro = $this->is_pro()
?>

<section class="section">
    <div class="form-horizontal space-y-7">
        <div class="form-horizontal__item" id="trigger-setting">
            <label class="form-horizontal__item-label font-primary text-cht-gray-150 text-base block mb-3">
                <?php esc_html_e('Trigger', 'chaty');?>:
            </label>
            <?php
            $cht_active = get_option('cht_active'.$this->widget_index);
            $cht_active = ($cht_active === false) ? 1 : $cht_active;
            ?>
            <!-- button for activiting widget -->
            <div class="flex items-center space-x-2">
                <div>
                    <input type="hidden" name="cht_active" value="0"  >
                    <label class="text-base text-cht-gray-150 font-primary" for="active_widget"><?php esc_html_e('Active', 'chaty') ?></label>
                </div>
                <label class="chaty-switch font-primary text-cht-gray-150 text-base" for="active_widget">
                    <input type="checkbox" id="active_widget" name="cht_active" class="cht_active" name="cht_active" value="1" <?php checked($cht_active, 1) ?>>
                    <div class="chaty-slider round"></div>
                </label>
            </div>
            <!-- end of wiget button button -->

            <!-- show when widget is deactivated -->
            <div class="widget-disable-alert bg-[#f9fafb] text-[#49687E] mt-3 select-none flex items-center space-x-3.5 text-base w-52 justify-center rounded-lg border border-solid border-[#eaeff2] py-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M10.2898 3.86001L1.81978 18C1.64514 18.3024 1.55274 18.6453 1.55177 18.9945C1.55079 19.3437 1.64127 19.6871 1.8142 19.9905C1.98714 20.2939 2.2365 20.5468 2.53748 20.7239C2.83847 20.901 3.18058 20.9962 3.52978 21H20.4698C20.819 20.9962 21.1611 20.901 21.4621 20.7239C21.763 20.5468 22.0124 20.2939 22.1853 19.9905C22.3583 19.6871 22.4488 19.3437 22.4478 18.9945C22.4468 18.6453 22.3544 18.3024 22.1798 18L13.7098 3.86001C13.5315 3.56611 13.2805 3.32313 12.981 3.15449C12.6814 2.98585 12.3435 2.89726 11.9998 2.89726C11.656 2.89726 11.3181 2.98585 11.0186 3.15449C10.7191 3.32313 10.468 3.56611 10.2898 3.86001Z" fill="#FFC700" stroke="#CB9E00" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 9V13" stroke="#092030" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 17H12.01" stroke="#092030" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span><?php esc_html_e('Widget turned off', 'chaty') ?></span>
            </div>

            <div class="trigger-block group-control-wrap trigger-block-wrapper">
                <div class="p-5">
                    <?php $checked = get_option('chaty_trigger_on_time'.$this->widget_index) ?>
                    <?php $time = get_option('chaty_trigger_time'.$this->widget_index); ?>
                    <?php $time = empty($time) ? "0" : $time; ?>
                    <?php $checked = empty($checked) ? "yes" : $checked; ?>
                    <input type="hidden" name="chaty_trigger_on_time" value="no" >
                    <div class="trigger-option-block flex space-x-3">
                        <label class="chaty-switch font-primary text-cht-gray-150 text-base" for="trigger_on_time">
                            <input type="checkbox" name="chaty_trigger_on_time" id="trigger_on_time" value="yes" <?php checked($checked, "yes") ?> >
                            <div class="chaty-slider round"></div>
                        </label>
                        <div class="trigger-block-input text-cht-gray-150 text-base">
                            Display after <input type="number" min="0" id="chaty_trigger_time" name="chaty_trigger_time" value="<?php echo esc_attr($time) ?>"> seconds on the page
                        </div>
                    </div>
                    <?php $checked = get_option('chaty_trigger_on_exit'.$this->widget_index) ?>
                    <?php $time = get_option('chaty_trigger_on_exit'.$this->widget_index); ?>
                    <?php $time = empty($time) ? "0" : $time; ?>
                    <?php $checked = empty($checked) ? "no" : $checked; ?>
                    <div class="trigger-option-block flex items-center py-7">
                        <input type="hidden" name="chaty_trigger_on_exit" value="no" >
                        <label class="chaty-switch font-primary text-cht-gray-150 text-base" for="chaty_trigger_on_exit">
                            <input type="checkbox" name="chaty_trigger_on_exit" id="chaty_trigger_on_exit" value="yes" <?php checked($checked, "yes") ?> >
                            <div class="chaty-slider round"></div>
                        </label>
                        <div class="trigger-block-input text-cht-gray-150 ml-3 text-base">
                            <?php esc_html_e('Display when visitor is about to leave the page', 'chaty') ?>
                        </div>
                    </div>
                    <?php $checked = get_option('chaty_trigger_on_scroll'.$this->widget_index) ?>
                    <?php $time = get_option('chaty_trigger_on_page_scroll'.$this->widget_index); ?>
                    <?php $time = empty($time) ? "0" : $time; ?>
                    <?php $checked = empty($checked) ? "no" : $checked; ?>
                    <div class="trigger-option-block flex items-center">
                        <input type="hidden" name="chaty_trigger_on_scroll" value="no" >
                        <label class="chaty-switch font-primary text-cht-gray-150 text-base" for="chaty_trigger_on_scroll">
                            <input type="checkbox" name="chaty_trigger_on_scroll" id="chaty_trigger_on_scroll" value="yes" <?php checked($checked, "yes") ?> >
                            <div class="chaty-slider round"></div>
                        </label>
                        <div class="trigger-block-input text-base text-cht-gray-150 ml-3">
                            Display after <input type="number" min="0" id="chaty_trigger_on_page_scroll" name="chaty_trigger_on_page_scroll" value="<?php echo esc_attr($time) ?>"> % on page
                        </div>
                    </div>
                </div>
                <!-- tooltip -->
                <div class="trigger-tooltip border-t border-x-0 border-b-0 border-solid border-[#eaeff2] py-3.5 px-5">
                    <span data-target="uid-123456" class="chaty-targeted-collapse flex-inline items-center font-primary text-base space-x-1 text-cht-primary cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span><?php esc_html_e('How triggers works?', 'chaty') ?></span>
                    </span>
                    <p id="uid-123456" class="text-sm text-cht-gray-150 font-primary px-2 pt-2 hidden"><?php esc_html_e("Your Chaty widget will first appear to the user according to the selected trigger. After the widget appeared for the first time, it'll always be visible on-load - once the user is aware of the widget, the user expects it to always appear", 'chaty') ?></p>
                </div> <!-- end trigger tooltip -->
            </div>
        </div>

        <div class="form-horizontal__item" id="custom-rules">
            <label class="form-horizontal__item-label font-primary text-cht-gray-150 text-base block mb-3">
                <?php esc_html_e('Show on pages', 'chaty') ?>
                <span class="header-tooltip">
                    <span class="header-tooltip-text text-center">
                        <?php esc_html_e("Use this feature to show the widget for specific products, posts or on certain posts or pages by excluding or including them in the rules", 'chaty') ?>
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

            <?php
            $page_option = get_option("cht_page_settings".$this->widget_index);
            $page_options_class = "";
            if( !empty( $page_option ) && is_array( $page_option ) && count( $page_option ) != 0 ) {
                $page_options_class = "show-remove-rules-btn";
            }
            ?>
            <div class="chaty-option-box <?php echo esc_attr($page_options_class) ?>">
                <div class="chaty-page-options" id="chaty-page-options">
                    <?php
                    global $sitepress;
                    $isWPMLActive = $sitepress !== null && get_class($sitepress) === "SitePress";
                    $hasWPML = false;
                    if($isWPMLActive) {
                        $wpmlSettings = get_option("icl_sitepress_settings");
                        if(isset($wpmlSettings['language_negotiation_type']) && $wpmlSettings['language_negotiation_type'] == 2) {

                            $widget_language = get_option("cht_widget_language".$this->widget_index);
                            $widget_language = ($widget_language)?$widget_language:$wpmlSettings['default_language'];

                            $language_domains = isset($wpmlSettings['language_domains']) && is_array($wpmlSettings['language_domains'])? $wpmlSettings['language_domains']: [];
                            if(count($language_domains) > 0) {
                                $hasWPML = true; ?>
                                <div class="cht-language-option">
                                    <select class="language chaty-select" id="cht_widget_language" name="cht_widget_language">
                                        <option data-url="<?php echo esc_url($_SERVER['HTTP_HOST']) ?>" <?php selected($widget_language, $wpmlSettings['default_language']) ?> value="<?php echo esc_attr($wpmlSettings['default_language']) ?>" ><?php echo esc_attr($_SERVER['HTTP_HOST']) ?></option>
                                        <?php foreach($language_domains as $key=>$value) { ?>
                                            <option data-url="<?php echo esc_url($value) ?>" <?php selected($widget_language, $key) ?> value="<?php echo esc_attr($key) ?>" ><?php echo esc_attr($value) ?></option>
                                        <?php } ?>
                                    </select>
                                </div>
                            <?php }
                        }
                    }
                    if(!$hasWPML) { ?>
                        <input type="hidden" id="cht_widget_language" value="<?php echo esc_url(site_url("/")) ?>">
                    <?php } ?>
                    <?php $page_option = get_option("cht_page_settings".$this->widget_index);
                    if (!empty($page_option) && is_array($page_option)) {
                        $count = 0;

                        foreach ($page_option as $k => $option) {
                            $count++;
                            if(!isset($option['option'])) {
                                $option['option'] = "";
                            }
                            if(!isset($option['value'])) {
                                $option['value'] = "";
                            }
                            ?>
                            <div class="chaty-page-option group-control-wrap mb-2 py-5 pl-5 pr-7 <?php echo !$is_pro ? 'not-pro': '' ?> relative <?php echo esc_attr($k == count($page_option) ? "last" : ""); ?>">
                                <div class="url-content <?php echo !$is_pro ? 'pointer-events-none': '' ?> <?php echo esc_attr(@($option['option'] == "home") ? "v-hide" : "") ?>">

                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="url-select">
                                            <select class="w-full page-option-list" name="cht_page_settings[<?php echo esc_attr($count)  ?>][shown_on]" id="url_shown_on_<?php echo esc_attr($count)  ?>_option">
                                                <option value="show_on" <?php selected($option['shown_on'], "show_on") ?> ><?php esc_html_e('Show on', 'chaty') ?></option>
                                                <option value="not_show_on" <?php selected($option['shown_on'], "not_show_on") ?>><?php esc_html_e("Don't show on", 'chaty') ?></option>
                                            </select>
                                        </div>
                                        <div class="url-option">
                                            <select class="url-options w-full url-option-list" name="cht_page_settings[<?php echo esc_attr($count)  ?>][option]" id="url_rules_<?php echo esc_attr($count)  ?>_option">
                                                <option value=""><?php esc_html_e("Select Rule", "chaty") ?></option>
                                                <?php foreach ($url_options as $key => $value) {
                                                    $selected = selected($option['option'], $key, false);
                                                    echo '<option '.esc_attr($selected).' value="'.esc_attr($key).'">'.esc_attr($value).'</option>';
                                                } ?>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="sm:flex items-center mt-2 <?php echo esc_attr(!empty($option['option']) && $option['option'] != "home" ? "active" : "") ?>">
                                        <div class="url-box">
                                            <span class='chaty-url url-title page-url-title <?php echo esc_attr(!in_array($option['option'], ["wp_pages", "wp_posts", "wp_categories", "wp_tags", "wc_products_on_sale", "wc_products"])?"active":"") ?>'><?php echo esc_attr(site_url("/")); ?></span>
                                            <span class='chaty-wp_pages url-title <?php echo esc_attr($option['option'] == "wp_pages")?"active":"" ?>'><?php esc_html_e("Pages", "chaty"); ?></span>
                                            <span class='chaty-wp_posts url-title <?php echo esc_attr($option['option'] == "wp_posts")?"active":"" ?>'><?php esc_html_e("Posts", "chaty"); ?></span>
                                            <span class='chaty-wp_categories url-title <?php echo esc_attr($option['option'] == "wp_categories")?"active":"" ?>'><?php esc_html_e("Categories", "chaty"); ?></span>
                                            <span class='chaty-wp_tags url-title <?php echo esc_attr($option['option'] == "wp_tags")?"active":"" ?>'><?php esc_html_e("Tags", "chaty"); ?></span>
                                            <span class='chaty-wc_products url-title <?php echo esc_attr($option['option'] == "wc_products")?"active":"" ?>'><?php esc_html_e("Products", "chaty"); ?></span>
                                            <span class='chaty-wc_products_on_sale url-title <?php echo esc_attr($option['option'] == "wc_products_on_sale")?"active":"" ?>'><?php esc_html_e("Products", "chaty"); ?></span>
                                        </div>
                                        <div class="url-values">
                                            <div class="url-setting-option url-default <?php echo esc_attr(!in_array($option['option'], ["wp_pages", "wp_posts", "wp_categories", "wp_tags", "wc_products_on_sale", "wc_products"])?"active":"") ?>">
                                                <?php
                                                $option['value'] = replaceDomain($option['value']) ?>
                                                <input type="text" class="w-full url-value" value="<?php echo esc_attr($option['value']) ?>" name="cht_page_settings[<?php echo esc_attr($count)  ?>][value]" id="url_rules_<?php echo esc_attr($count)  ?>_value" />
                                            </div>
                                            <div class="url-setting-option wp_pages-option <?php echo esc_attr($option['option'] == "wp_pages")?"active":"" ?>">
                                                <?php
                                                $page_ids = [];
                                                if(isset($option['page_ids'])) {
                                                    $page_ids = $option['page_ids'];
                                                }?>
                                                <select class="pages-options" multiple name="cht_page_settings[<?php echo esc_attr($count)  ?>][page_ids][]" id="url_rules_<?php echo esc_attr($count)  ?>_page_ids">
                                                    <option value="all-data-items"><?php esc_html_e("All Pages", "chaty") ?></option>
                                                    <?php foreach($page_ids as $page_id) {
                                                        if($page_id == "all-items") {?>
                                                            <option value="all-items" selected><?php esc_html_e("All Pages", "chaty"); ?></option>
                                                        <?php } else { ?>
                                                            <option value="<?php echo esc_attr($page_id) ?>" selected><?php echo esc_attr(get_the_title($page_id)) ?></option>
                                                        <?php } ?>
                                                    <?php } ?> } ?>
                                                </select>
                                            </div>
                                            <div class="url-setting-option wp_posts-option <?php echo esc_attr($option['option'] == "wp_posts")?"active":"" ?>">
                                                <?php
                                                $post_ids = [];
                                                if(isset($option['post_ids'])) {
                                                    $post_ids = $option['post_ids'];
                                                }?>
                                                <select class="posts-options" multiple name="cht_page_settings[<?php echo esc_attr($count)  ?>][post_ids][]" id="url_rules_<?php echo esc_attr($count)  ?>_post_ids">
                                                    <?php foreach($post_ids as $post_id) {
                                                        if($post_id == "all-items") {?>
                                                            <option value="all-items" selected><?php esc_html_e("All Posts", "chaty"); ?></option>
                                                        <?php } else { ?>
                                                            <option value="<?php echo esc_attr($post_id) ?>" selected><?php echo esc_attr(get_the_title($post_id)) ?></option>
                                                        <?php } ?>
                                                    <?php } ?>
                                                </select>
                                            </div>
                                            <div class="url-setting-option wp_categories-option <?php echo esc_attr($option['option'] == "wp_categories")?"active":"" ?>">
                                                <?php
                                                $category_ids = [];
                                                if(isset($option['category_ids'])) {
                                                    $category_ids = $option['category_ids'];
                                                } ?>
                                                <select class="wp_categories-options" multiple name="cht_page_settings[<?php echo esc_attr($count)  ?>][category_ids][]" id="url_rules_<?php echo esc_attr($count)  ?>_category_ids">
                                                    <?php foreach($category_ids as $category_id) {
                                                        if($category_id == "all-items") {?>
                                                            <option value="all-items" selected><?php esc_html_e("All Categories", "chaty"); ?></option>
                                                        <?php } else {$term_name = get_term( $category_id )->name;
                                                            if(!empty($term_name)) {?>
                                                                <option value="<?php echo esc_attr($category_id) ?>" selected><?php echo esc_attr($term_name) ?></option>
                                                            <?php } ?>
                                                        <?php } ?>
                                                    <?php } ?>
                                                </select>
                                            </div>
                                            <div class="url-setting-option wp_tags-option <?php echo esc_attr($option['option'] == "wp_tags")?"active":"" ?>">
                                                <?php
                                                $tag_ids = [];
                                                if(isset($option['tag_ids'])) {
                                                    $tag_ids = $option['tag_ids'];
                                                } ?>
                                                <select class="wp_tags-options" multiple name="cht_page_settings[<?php echo esc_attr($count)  ?>][tag_ids][]" id="url_rules_<?php echo esc_attr($count)  ?>_tag_ids">
                                                    <?php foreach($tag_ids as $tag_id) {
                                                        if($tag_id == "all-items") {?>
                                                            <option value="all-items" selected><?php esc_html_e("All Tags", "chaty"); ?></option>
                                                        <?php } else {
                                                            $term_name = get_term( $tag_id )->name;
                                                            if(!empty($term_name)) {?>
                                                                <option value="<?php echo esc_attr($tag_id) ?>" selected><?php echo esc_attr($term_name) ?></option>
                                                            <?php } ?>
                                                        <?php } ?>
                                                    <?php } ?>
                                                </select>
                                            </div>
                                            <?php if($hasWooCommerce) { ?>
                                                <div class="url-setting-option wc_products-option <?php echo esc_attr($option['option'] == "wc_products")?"active":"" ?>">
                                                    <?php
                                                    $products_ids = [];
                                                    if(isset($option['products_ids'])) {
                                                        $products_ids = $option['products_ids'];
                                                    } ?>
                                                    <select class="wc_products-options" multiple name="cht_page_settings[<?php echo esc_attr($count)  ?>][products_ids][]" id="url_rules_<?php echo esc_attr($count)  ?>_products_ids">
                                                        <?php foreach($products_ids as $products_id) {
                                                            if($products_id == "all-items") {?>
                                                                <option value="all-items" selected><?php esc_html_e("All Products", "chaty"); ?></option>
                                                            <?php } else {
                                                                if(get_the_title($products_id)) { ?>
                                                                    <option value="<?php echo esc_attr($products_id) ?>" selected><?php echo esc_attr(get_the_title($products_id)) ?></option>
                                                                <?php } ?>
                                                            <?php } ?>
                                                        <?php } ?>
                                                    </select>
                                                </div>
                                                <div class="url-setting-option wc_products_on_sale-option <?php echo esc_attr($option['option'] == "wc_products_on_sale")?"active":"" ?>">
                                                    <?php
                                                    $products_ids = [];
                                                    if(isset($option['wc_products_ids'])) {
                                                        $products_ids = $option['wc_products_ids'];
                                                    } ?>
                                                    <select class="wc_products_on_sale-options" multiple name="cht_page_settings[<?php echo esc_attr($count)  ?>][wc_products_ids][]" id="url_rules_<?php echo esc_attr($count)  ?>_wc_products_ids">
                                                        <?php foreach($products_ids as $products_id) {
                                                            if($products_id == "all-items") {?>
                                                                <option value="all-items" selected><?php esc_html_e("All Products", "chaty"); ?></option>
                                                            <?php } else {
                                                                if(get_the_title($products_id)) { ?>
                                                                    <option value="<?php echo esc_attr($products_id) ?>" selected><?php echo esc_attr(get_the_title($products_id)) ?></option>
                                                                <?php } ?>
                                                            <?php } ?>
                                                        <?php } ?>
                                                    </select>
                                                </div>
                                            <?php } ?>
                                        </div>
                                    </div>

                                    <div class="url-buttons">
                                        <a class="remove-chaty absolute" href="javascript:;">
                                            <svg class="pointer-events-none" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1">
                                                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.334 1.334 0 01-1.334 1.334H4.667a1.334 1.334 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </a>
                                    </div>
                                </div>

                                <?php if (!$is_pro) { ?>
                                    <div class="chaty-pro-feature">
                                        <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                                            <?php esc_html_e('Activate your license key', 'chaty');?>
                                        </a>
                                    </div>
                                <?php } ?>

                            </div>
                            <?php
                        }//end foreach
                    }//end if
                    ?>

                </div>
                <div class="<?php echo esc_attr($is_pro ? 'is-pro': 'not-pro') ?>">
                    <a href="javascript:;" class="create-rule mr-3 border border-solid border-cht-gray-150/60 text-cht-gray-150 text-base px-3 py-1 rounded-lg inline-block hover:text-cht-primary hover:border-cht-primary" id="create-rule"><?php esc_html_e("Add Rule", "chaty") ?></a>
                    <a href="javascript:;" id="remove-page-rules" class="px-3 py-1 hidden remove-rules rounded-lg bg-transparent  text-red-500 hover:bg-red-500/10  focus:bg-red-500/10 hover:text-red-500 focus:text-red-500 border border-solid border-red-500 text-base"><?php esc_html_e("Remove Rules", 'chaty') ?></a>
                </div>
            </div>
        </div>

        <div class="form-horizontal__item" id="scroll-to-item">
            <label class="form-horizontal__item-label font-primary text-cht-gray-150 text-base block mb-3">
                <?php esc_html_e('Date scheduling', 'chaty');?>
                <span class="header-tooltip">
                    <span class="header-tooltip-text text-center"><?php esc_html_e('Schedule the specific time and date when your Chaty widget appears.', 'chaty');?></span>
                    <span class="ml-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </span>
                </span>
            </label>
            <?php
            $date_rules = get_option('cht_date_rules'.$this->widget_index);
            $timezone   = isset($date_rules['timezone']) ? $date_rules['timezone'] : "";
            $start_date = isset($date_rules['start_date']) ? $date_rules['start_date'] : "";
            $start_time = isset($date_rules['start_time']) ? $date_rules['start_time'] : "";
            $end_date   = isset($date_rules['end_date']) ? $date_rules['end_date'] : "";
            $end_time   = isset($date_rules['end_time']) ? $date_rules['end_time'] : "";
            $status     = isset($date_rules['status']) ? $date_rules['status'] : "no";
            ?>
            <div class="chaty-option-box">
                <div id="date-schedule" class="<?php echo ($status == "yes") ? "active" : "" ?>">
                    <div class="date-schedule-box p-5 group-control-wrap">
                        <div class="date-schedule <?php echo esc_attr($is_pro ? "is-pro" : "not-pro") ?>">
                            <div class="select-box">
                                <label class="font-primary text-cht-gray-150 text-base block mb-2"><?php esc_html_e('Timezone', 'chaty');?></label>
                                <select class="select2-box" name="cht_date_rules[timezone]" id="cht_date_rules_time_zone">
                                    <!-- This will return option list -->
                                    <?php echo chaty_timezone_choice($timezone, true);?>
                                </select>
                            </div>
                            
                            <div class="date-time-box">
                                <div class="date-select-option">
                                    <div class="font-primary text-cht-gray-150 text-base flex my-2">
                                        <?php esc_html_e('Start Date', 'chaty');?>
                                        <label for="date_start_date">
                                            <span class="header-tooltip">
                                                <span class="header-tooltip-text text-center"><?php esc_html_e('Schedule a date from which the Chaty widget will be displayed (the starting date is included)', 'chaty');?></span>
                                                <span class="ml-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                    <input autocomplete="off" type="text" name="cht_date_rules[start_date]" id="date_start_date" value="<?php echo esc_attr($start_date) ?>" >
                                    <?php if (!$is_pro) { ?>
                                        <div class="chaty-pro-feature">
                                            <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                                                <?php esc_html_e('Activate your license key', 'chaty');?>
                                            </a>
                                        </div>
                                    <?php } ?>
                                </div>
                                <div class="time-select-option">
                                    <label for="date_start_time" class="font-primary text-cht-gray-150 text-base flex my-2"><?php esc_html_e('Start Time', 'chaty');?></label>
                                    <input autocomplete="off" type="text" name="cht_date_rules[start_time]" id="date_start_time" value="<?php echo esc_attr($start_time) ?>">
                                </div>
                                <div class="clearfix clear"></div>
                            </div>
                            <div class="date-time-box">
                                <div class="date-select-option">
                                    <div class="font-primary text-cht-gray-150 text-base flex my-2">
                                        <label for="date_end_date"><?php esc_html_e('End Date', 'chaty');?></label>
                                        <label for="date_start_date">
                                            <span class="header-tooltip">
                                            <span class="header-tooltip-text text-center"><?php esc_html_e('Schedule a date from which the Chaty widget will stop being displayed (the end date is included)', 'chaty');?></span>
                                            <span class="ml-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </span>
                                        </span>
                                    </div>
                                    <input type="text" name="cht_date_rules[end_date]" id="date_end_date" value="<?php echo esc_attr($end_date) ?>">
                                </div>
                                <div class="time-select-option">
                                    <label for="date_end_time" class="font-primary text-cht-gray-150 text-base flex my-2"><?php esc_html_e('End Time', 'chaty');?></label>
                                    <input type="text" name="cht_date_rules[end_time]" id="date_end_time" value="<?php echo esc_attr($end_time) ?>">
                                </div>
                                <div class="clearfix clear"></div>
                            </div>
                        </div>
                        <a href="javascript:;" class="create-rule remove-rules rounded-lg bg-transparent border-red-500 text-red-500 hover:bg-red-500/10  focus:bg-red-500/10 hover:text-red-500 btn btn-primary inline-block mt-5" id="remove-date-rule"><?php esc_html_e('Remove Rules', 'chaty');?></a>
                    </div>
                    <div class="date-schedule-button">
                        <a href="javascript:;" class="create-rule border border-solid border-cht-gray-150/60 text-cht-gray-150 text-base px-3 py-1 rounded-lg inline-block hover:text-cht-primary hover:border-cht-primary" id="create-date-rule"><?php esc_html_e('Add Rule', 'chaty');?></a>
                    </div>
                </div>
            </div>
            <input type="hidden" name="cht_date_rules[status]" id="cht_date_rules" value="<?php echo esc_attr($status) ?>" />
        </div>
        <div class="form-horizontal__item">
            <label class="form-horizontal__item-label font-primary text-cht-gray-150 text-base block mb-3">
                <?php esc_html_e('Days and hours', 'chaty');?>
                <span class="header-tooltip">
                    <span class="header-tooltip-text text-center"><?php esc_html_e("Display the widget on specific days and hours based on your opening days and hours", "chaty") ?></span>
                    <span class="ml-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </span>
                </span>
            </label>
            <?php 
                $time_cards = get_option("cht_date_and_time_settings".$this->widget_index);
                $time_card_class = '';
                if( !empty( $time_cards ) && is_array( $time_cards ) ) {
                    $time_card_class = 'show-remove-rules-btn';
                }
            ?>
            <div class="chaty-option-box <?php echo esc_attr($time_card_class) ?>">
                <div class="chaty-data-and-time-rules">
                    <?php
                    $time_options = get_option("cht_date_and_time_settings".$this->widget_index);
                    if (!empty($time_options) && is_array($time_options)) {
                        $count = 0;
                        foreach ($time_options as $k => $option) {
                            $count++;
                            $selected_day = isset($option['days']) ? $option['days'] : 0;
                            $start_time   = isset($option['start_time']) ? $option['start_time'] : 0;
                            $end_time     = isset($option['end_time']) ? $option['end_time'] : 0;
                            $gmt          = isset($option['gmt']) ? $option['gmt'] : 0;
                            if (is_numeric($gmt)) {
                                $gmt = floatval($gmt);
                            }
                            ?>
                            <div class="chaty-date-time-option group-control-wrap mb-2 p-5 relative" data-index="<?php echo esc_attr($count) ?>">
                                <div class="date-time-content grid grid-cols-2 gap-4 <?php echo esc_attr($is_pro ? "is-pro" : "not-pro") ?>">
                                    <div class="day-select col-span-2">
                                        <label class="block font-primary text-cht-gray-150 text-base my-2"><?php esc_html_e('Select day', 'chaty') ?></label>
                                        <select class="w-full" name="cht_date_and_time_settings[<?php echo esc_attr($count) ?>][days]" id="url_shown_on_<?php echo esc_attr($count) ?>_option">
                                            <?php foreach ($days as $key => $value) { ?>
                                                <option <?php selected($key, $selected_day) ?> value="<?php echo esc_attr($key) ?>"><?php echo esc_attr($value) ?></option>
                                            <?php } ?>
                                        </select>
                                    </div>
                                    <div class="day-label">
                                        <label class="block font-primary text-cht-gray-150 text-base my-2"><?php esc_html_e('From', 'chaty') ?></label>
                                        <input type="text" class="cht-required time-picker ui-timepicker-input w-full" autocomplete="off" value="<?php echo esc_attr($start_time) ?>" name="cht_date_and_time_settings[<?php echo esc_attr($count) ?>][start_time]" id="start_time_<?php echo esc_attr($count) ?>" />
                                    </div>
                                    <div class="day-label">
                                        <label class="block font-primary text-cht-gray-150 text-base my-2"><?php esc_html_e('To', 'chaty') ?></label>
                                        <input type="text" class="cht-required time-picker ui-timepicker-input w-full" autocomplete="off"  value="<?php echo esc_attr($end_time) ?>" name="cht_date_and_time_settings[<?php echo esc_attr($count) ?>][end_time]" id="end_time_<?php echo esc_attr($count) ?>" />
                                    </div>
                                    <div class="day-time gtm-select col-span-2">
                                        <label class="gmt-data font-primary text-cht-gray-150 text-base my-2"><?php esc_html_e('GMT', 'chaty') ?></label>
                                        <div class="gmt-data">
                                            <select class="select2-box w-full text-cht-gray-150" name="cht_date_and_time_settings[<?php echo esc_attr($count) ?>][gmt]" id="url_shown_on_<?php echo esc_attr($count) ?>_option">
                                                <!-- This will return option list -->
                                                <?php echo chaty_timezone_choice($gmt, false);?>
                                            </select>
                                        </div>
                                    </div>

                                    <?php if (!$this->is_pro()) { ?>
                                        <div class="chaty-pro-feature">
                                            <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl()) ?>">
                                                <?php esc_html_e('Activate your license key', 'chaty'); ?>
                                            </a>
                                        </div>
                                    <?php } ?>
                                
                                </div>
                                <div class="day-buttons">
                                    <a class="remove-page-option absolute" href="javascript:;">
                                        <svg class="pointer-events-none" data-v-1cf7b632="" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1">
                                            <path data-v-1cf7b632="" d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.334 1.334 0 01-1.334 1.334H4.667a1.334 1.334 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        <?php }//end foreach
                        ?>
                    <?php }//end if
                    ?>
                </div>
                <div class="rule-btns <?php echo esc_attr($is_pro ? 'pro': 'not-pro') ?>">
                    <a href="javascript:;" class="create-rule border mr-3 border-solid border-cht-gray-150/60 text-cht-gray-150 text-base px-3 py-1 rounded-lg inline-block hover:text-cht-primary hover:border-cht-primary" id="create-data-and-time-rule"><?php esc_html_e("Add Rule", "chaty") ?></a>
                    <a href="javascript:;" class="px-3 py-1 hidden remove-day-time-rules remove-rules rounded-lg bg-transparent  text-red-500 hover:bg-red-500/10  focus:bg-red-500/10 hover:text-red-500 focus:text-red-500 border border-solid border-red-500 text-base"><?php esc_html_e("Remove Rules", "chaty") ?></a>
                </div>
            </div>
        </div>

        <?php
        function removeHttp($url)
        {
            $disallowed = [
                'http://',
                'https://',
            ];
            foreach ($disallowed as $d) {
                if (strpos($url, $d) === 0) {
                    return str_replace($d, '', $url);
                }
            }

            return $url;

        }//end removeHttp()

        function replaceDomain($string)
        {
            $string     = removeHttp($string);
            $siteURL    = removeHttp(site_url("/"));
            $length     = strlen($siteURL);
            $str_length = strlen($string);
            if ($str_length > $length) {
                $result = substr($string, 0, $length);
                if ($result == ($siteURL)) {
                    return substr($string, $length);
                }
            }

            return $string;

        }//end replaceDomain()


        ?>

        <div class="form-horizontal__item" id="custom-rules">
            <label class="form-horizontal__item-label font-primary text-cht-gray-150 text-base block mb-3">
                <?php esc_html_e('Traffic source', 'chaty') ?>
                <span class="header-tooltip">
                    <span class="header-tooltip-text text-center"><?php esc_html_e("Show the widget only to visitors who come from specific traffic sources including direct traffic, social networks, search engines, Google Ads, or any other traffic source.", "chaty") ?></span>
                    <span class="ml-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </span>
                </span>
            </label>
            <?php
            $checked = get_option('chaty_traffic_source'.$this->widget_index);
            $checked = empty($checked) ? "no" : $checked;
            ?>
            <div class="chaty-option-box traffic-options-box <?php echo ($checked == "yes") ? "active" : "" ?>">
                <div class="traffic-default">
                    <a href="javascript:;" class="create-rule border border-solid border-cht-gray-150/60 text-cht-gray-150 text-base px-3 py-1 rounded-lg inline-block hover:text-cht-primary hover:border-cht-primary" id="update-chaty-traffic-source-rule">Add Rule</a>
                    <input type="hidden" name="chaty_traffic_source" id="chaty_traffic_source" value="<?php echo esc_attr($checked) ?>">
                </div>
                <div class="traffic-active">
                    <div class="trigger-block mt-4 space-y-3">
                        <div class="traffic-rules <?php echo esc_attr($is_pro ? "is-pro" : "not-pro") ?>">
                            <?php
                            $checked = get_option('chaty_traffic_source_direct_visit'.$this->widget_index);
                            $checked = empty($checked) ? "no" : $checked;
                            ?>
                            <input type="hidden" name="chaty_traffic_source_direct_visit" value="no">
                            <div class="trigger-option-block">
                                <label class="chaty-switch text-base font-primary text-cht-gray-150" for="chaty_traffic_source_direct_visit">
                                    <input type="checkbox" name="chaty_traffic_source_direct_visit" id="chaty_traffic_source_direct_visit" value="yes" <?php checked($checked, "yes") ?> >
                                    <div class="chaty-slider round"></div>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center"><?php esc_html_e("Show the Chaty to visitors who arrived to your website from direct traffic", "chaty") ?></span>
                                        <span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                    <?php esc_html_e("Direct visit", "chaty") ?>
                                </label>
                            </div>
                            <?php
                            $checked = get_option('chaty_traffic_source_social_network'.$this->widget_index);
                            $checked = empty($checked) ? "no" : $checked;
                            ?>
                            <div class="trigger-option-block">
                                <input type="hidden" name="chaty_traffic_source_social_network" value="no">
                                <label class="chaty-switch text-base font-primary text-cht-gray-150" for="chaty_traffic_source_social_network">
                                    <input type="checkbox" name="chaty_traffic_source_social_network" id="chaty_traffic_source_social_network" value="yes" <?php checked($checked, "yes") ?>>
                                    <div class="chaty-slider round"></div>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center">Show the Chaty to visitors who arrived to your website from social networks including: Facebook, Twitter, Pinterest, Instagram, Google+, LinkedIn, Delicious, Tumblr, Dribbble, StumbleUpon, Flickr, Plaxo, Digg and more</span>
                                        <span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                    <?php esc_html_e("Social networks", "chaty") ?>
                                </label>
                            </div>
                            <?php
                            $checked = get_option('chaty_traffic_source_search_engine'.$this->widget_index);
                            $checked = empty($checked) ? "no" : $checked;
                            ?>
                            <div class="trigger-option-block">
                                <input type="hidden" name="chaty_traffic_source_search_engine" value="no">
                                <label class="chaty-switch text-base font-primary text-cht-gray-150" for="chaty_traffic_source_search_engine">
                                    <input type="checkbox" name="chaty_traffic_source_search_engine" id="chaty_traffic_source_search_engine" value="yes" <?php checked($checked, "yes") ?>>
                                    <div class="chaty-slider round"></div>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center">Show the Chaty to visitors who arrived from search engines including: Google, Bing, Yahoo!, Yandex, AOL, Ask, WOW,  WebCrawler, Baidu and more</span>
                                        <span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                    <?php esc_html_e("Search engines", "chaty") ?>
                                </label>
                            </div>
                            <?php
                            $checked = get_option('chaty_traffic_source_google_ads'.$this->widget_index);
                            $checked = empty($checked) ? "no" : $checked;
                            ?>
                            <div class="trigger-option-block">
                                <input type="hidden" name="chaty_traffic_source_google_ads" value="no">
                                <label class="chaty-switch text-base font-primary text-cht-gray-150" for="chaty_traffic_source_google_ads">
                                    <input type="checkbox" name="chaty_traffic_source_google_ads" id="chaty_traffic_source_google_ads" value="yes" <?php checked($checked, "yes") ?>>
                                    <div class="chaty-slider round"></div>
                                    <span class="header-tooltip">
                                        <span class="header-tooltip-text text-center">Show the Chaty to visitors who arrived from search engines including: Google, Bing, Yahoo!, Yandex, AOL, Ask, WOW,  WebCrawler, Baidu and more</span>
                                        <span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </span>
                                    </span>
                                    <?php esc_html_e("Google Ads", "chaty") ?>
                                </label>
                            </div>
                            <div class="clear clearfix"></div>
                            <?php
                            $custom_rules = get_option("chaty_custom_traffic_rules".$this->widget_index)
                            ?>
                            <div class="traffic-custom-rules">
                                <div class="custom-rule-title font-primary text-cht-gray-150 text-base block my-2"><?php esc_html_e("Specific URL", "chaty") ?></div>
                                <div class="traffic-custom-rules-box">
                                    <?php if (!empty($custom_rules) && is_array($custom_rules) && count($custom_rules) > 0) {
                                        foreach ($custom_rules as $key => $rule) { ?>
                                            <div class="custom-traffic-rule">
                                                <div class="traffic-option">
                                                    <select name="chaty_custom_traffic_rules[<?php echo esc_attr($key) ?>][url_option]" class="traffic-url-options">
                                                        <option value="contain" <?php selected($rule['url_option'], "contain") ?>><?php esc_html_e("Contains", "chaty") ?></option>
                                                        <option value="not_contain" <?php selected($rule['url_option'], "not_contain") ?>><?php esc_html_e("Not contains", "chaty") ?></option>
                                                    </select>
                                                </div>
                                                <div class="traffic-url">
                                                    <input type="text" name="chaty_custom_traffic_rules[<?php echo esc_attr($key) ?>][url_value]" value="<?php echo esc_attr($rule['url_value']) ?>" placeholder="https://www.example.com" />
                                                </div>
                                                <div class="traffic-action">
                                                    <a class="remove-traffic-option" href="javascript:;">
                                                        <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <rect width="15.6301" height="2.24494" rx="1.12247" transform="translate(2.26764 0.0615997) rotate(45)" fill="white"></rect>
                                                            <rect width="15.6301" height="2.24494" rx="1.12247" transform="translate(13.3198 1.649) rotate(135)" fill="white"></rect>
                                                        </svg>
                                                    </a>
                                                </div>
                                            </div>
                                        <?php }//end foreach
                                    } else { ?>
                                        <div class="custom-traffic-rule">
                                            <div class="traffic-option">
                                                <select name="chaty_custom_traffic_rules[0][url_option]">
                                                    <option value="contain"><?php esc_html_e("Contains", "chaty") ?></option>
                                                    <option value="not_contain"><?php esc_html_e("Not contains", "chaty") ?></option>
                                                </select>
                                            </div>
                                            <div class="traffic-url">
                                                <input type="text" name="chaty_custom_traffic_rules[0][url_value]" />
                                            </div>
                                            <div class="traffic-action">
                                                <a class="remove-traffic-option" href="javascript:;">
                                                    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect width="15.6301" height="2.24494" rx="1.12247" transform="translate(2.26764 0.0615997) rotate(45)" fill="white"></rect>
                                                        <rect width="15.6301" height="2.24494" rx="1.12247" transform="translate(13.3198 1.649) rotate(135)" fill="white"></rect>
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    <?php }//end if
                                    ?>
                                </div>
                            </div>
                            <div class="clear clearfix"></div>
                            <?php if (!$is_pro) { ?>
                                <div class="chaty-pro-feature">
                                    <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                                        <?php esc_html_e('Activate your license key', 'chaty');?>
                                    </a>
                                </div>
                            <?php } ?>
                        </div>
                        <div class="traffic-rule-actions">
                            <?php if($is_pro) { ?>
                                <a href="javascript:;" class="create-rule border border-solid border-cht-gray-150/60 text-cht-gray-150 text-base px-3 py-1 rounded-lg inline-block hover:text-cht-primary hover:border-cht-primary" id="add-traffic-rule"><?php esc_html_e("Add Rule", "chaty") ?> </a>
                            <?php } ?>
                            <a href="javascript:;" class="create-rule remove-rules rounded-lg bg-transparent border-red-500/50 text-base text-red-500 hover:bg-red-500/10  focus:bg-red-500/10 hover:text-red-500 btn btn-primary inline-block ml-2 px-3 py-1" id="remove-traffic-rules"><?php esc_html_e("Remove Rules", "chaty") ?></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <?php $countries = [
        [
        "short_name"   => "AF",
        "country_name" => "Afghanistan",
        ],[
        "short_name"   => "AL",
        "country_name" => "Albania",
        ],[
        "short_name"   => "DZ",
        "country_name" => "Algeria",
        ],[
        "short_name"   => "AD",
        "country_name" => "Andorra",
        ],[
        "short_name"   => "AO",
        "country_name" => "Angola",
        ],[
        "short_name"   => "AI",
        "country_name" => "Anguilla",
        ],[
        "short_name"   => "AG",
        "country_name" => "Antigua and Barbuda",
        ],[
        "short_name"   => "AR",
        "country_name" => "Argentina",
        ],[
        "short_name"   => "AM",
        "country_name" => "Armenia",
        ],[
        "short_name"   => "AW",
        "country_name" => "Aruba",
        ],[
        "short_name"   => "AU",
        "country_name" => "Australia",
        ],[
        "short_name"   => "AT",
        "country_name" => "Austria",
        ],[
        "short_name"   => "AZ",
        "country_name" => "Azerbaijan",
        ],[
        "short_name"   => "BS",
        "country_name" => "Bahamas",
        ],[
        "short_name"   => "BH",
        "country_name" => "Bahrain",
        ],[
        "short_name"   => "BD",
        "country_name" => "Bangladesh",
        ],[
        "short_name"   => "BB",
        "country_name" => "Barbados",
        ],[
        "short_name"   => "BY",
        "country_name" => "Belarus",
        ],[
        "short_name"   => "BE",
        "country_name" => "Belgium",
        ],[
        "short_name"   => "BZ",
        "country_name" => "Belize",
        ],[
        "short_name"   => "BJ",
        "country_name" => "Benin",
        ],[
        "short_name"   => "BM",
        "country_name" => "Bermuda",
        ],[
        "short_name"   => "BT",
        "country_name" => "Bhutan",
        ],[
        "short_name"   => "BO",
        "country_name" => "Bolivia",
        ],[
        "short_name"   => "BA",
        "country_name" => "Bosnia and Herzegowina",
        ],[
        "short_name"   => "BW",
        "country_name" => "Botswana",
        ],[
        "short_name"   => "BV",
        "country_name" => "Bouvet Island",
        ],[
        "short_name"   => "BR",
        "country_name" => "Brazil",
        ],[
        "short_name"   => "IO",
        "country_name" => "British Indian Ocean Territory",
        ],[
        "short_name"   => "BN",
        "country_name" => "Brunei Darussalam",
        ],[
        "short_name"   => "BG",
        "country_name" => "Bulgaria",
        ],[
        "short_name"   => "BF",
        "country_name" => "Burkina Faso",
        ],[
        "short_name"   => "BI",
        "country_name" => "Burundi",
        ],[
        "short_name"   => "KH",
        "country_name" => "Cambodia",
        ],[
        "short_name"   => "CM",
        "country_name" => "Cameroon (Republic of Cameroon)",
        ],[
        "short_name"   => "CA",
        "country_name" => "Canada",
        ],[
        "short_name"   => "CV",
        "country_name" => "Cape Verde",
        ],[
        "short_name"   => "KY",
        "country_name" => "Cayman Islands",
        ],[
        "short_name"   => "CF",
        "country_name" => "Central African Republic",
        ],[
        "short_name"   => "TD",
        "country_name" => "Chad",
        ],[
        "short_name"   => "CL",
        "country_name" => "Chile",
        ],[
        "short_name"   => "CN",
        "country_name" => "China",
        ],[
        "short_name"   => "CX",
        "country_name" => "Christmas Island",
        ],[
        "short_name"   => "CC",
        "country_name" => "Cocos (Keeling) Islands",
        ],[
        "short_name"   => "CO",
        "country_name" => "Colombia",
        ],[
        "short_name"   => "KM",
        "country_name" => "Comoros",
        ],[
        "short_name"   => "CG",
        "country_name" => "Congo",
        ],[
        "short_name"   => "CK",
        "country_name" => "Cook Islands",
        ],[
        "short_name"   => "CR",
        "country_name" => "Costa Rica",
        ],[
        "short_name"   => "CI",
        "country_name" => "Cote D\Ivoire",
        ],[
        "short_name"   => "HR",
        "country_name" => "Croatia",
        ],[
        "short_name"   => "CU",
        "country_name" => "Cuba",
        ],[
        "short_name"   => "CY",
        "country_name" => "Cyprus",
        ],[
        "short_name"   => "CZ",
        "country_name" => "Czech Republic",
        ],[
        "short_name"   => "DK",
        "country_name" => "Denmark",
        ],[
        "short_name"   => "DJ",
        "country_name" => "Djibouti",
        ],[
        "short_name"   => "DM",
        "country_name" => "Dominica",
        ],[
        "short_name"   => "DO",
        "country_name" => "Dominican Republic",
        ],[
        "short_name"   => "EC",
        "country_name" => "Ecuador",
        ],[
        "short_name"   => "EG",
        "country_name" => "Egypt",
        ],[
        "short_name"   => "SV",
        "country_name" => "El Salvador",
        ],[
        "short_name"   => "GQ",
        "country_name" => "Equatorial Guinea",
        ],[
        "short_name"   => "ER",
        "country_name" => "Eritrea",
        ],[
        "short_name"   => "EE",
        "country_name" => "Estonia",
        ],[
        "short_name"   => "ET",
        "country_name" => "Ethiopia",
        ],[
        "short_name"   => "FK",
        "country_name" => "Falkland Islands (Malvinas)",
        ],[
        "short_name"   => "FO",
        "country_name" => "Faroe Islands",
        ],[
        "short_name"   => "FJ",
        "country_name" => "Fiji",
        ],[
        "short_name"   => "FI",
        "country_name" => "Finland",
        ],[
        "short_name"   => "FR",
        "country_name" => "France",
        ],[
        "short_name"   => "Me",
        "country_name" => "Montenegro",
        ],[
        "short_name"   => "GF",
        "country_name" => "French Guiana",
        ],[
        "short_name"   => "PF",
        "country_name" => "French Polynesia",
        ],[
        "short_name"   => "TF",
        "country_name" => "French Southern Territories",
        ],[
        "short_name"   => "GA",
        "country_name" => "Gabon",
        ],[
        "short_name"   => "GM",
        "country_name" => "Gambia",
        ],[
        "short_name"   => "GE",
        "country_name" => "Georgia",
        ],[
        "short_name"   => "DE",
        "country_name" => "Germany",
        ],[
        "short_name"   => "GH",
        "country_name" => "Ghana",
        ],[
        "short_name"   => "GI",
        "country_name" => "Gibraltar",
        ],[
        "short_name"   => "GR",
        "country_name" => "Greece",
        ],[
        "short_name"   => "GL",
        "country_name" => "Greenland",
        ],[
        "short_name"   => "GD",
        "country_name" => "Grenada",
        ],[
        "short_name"   => "GP",
        "country_name" => "Guadeloupe",
        ],[
        "short_name"   => "GT",
        "country_name" => "Guatemala",
        ],[
        "short_name"   => "GN",
        "country_name" => "Guinea",
        ],[
        "short_name"   => "GW",
        "country_name" => "Guinea bissau",
        ],[
        "short_name"   => "GY",
        "country_name" => "Guyana",
        ],[
        "short_name"   => "HT",
        "country_name" => "Haiti",
        ],[
        "short_name"   => "HM",
        "country_name" => "Heard Island And Mcdonald Islands",
        ],[
        "short_name"   => "HN",
        "country_name" => "Honduras",
        ],[
        "short_name"   => "HK",
        "country_name" => "Hong Kong",
        ],[
        "short_name"   => "HU",
        "country_name" => "Hungary",
        ],[
        "short_name"   => "IS",
        "country_name" => "Iceland",
        ],[
        "short_name"   => "IN",
        "country_name" => "India",
        ],[
        "short_name"   => "ID",
        "country_name" => "Indonesia",
        ],[
        "short_name"   => "IR",
        "country_name" => "Iran, Islamic Republic Of",
        ],[
        "short_name"   => "IQ",
        "country_name" => "Iraq",
        ],[
        "short_name"   => "IE",
        "country_name" => "Ireland",
        ],[
        "short_name"   => "IL",
        "country_name" => "Israel",
        ],[
        "short_name"   => "IT",
        "country_name" => "Italy",
        ],[
        "short_name"   => "JM",
        "country_name" => "Jamaica",
        ],[
        "short_name"   => "JP",
        "country_name" => "Japan",
        ],[
        "short_name"   => "JO",
        "country_name" => "Jordan",
        ],[
        "short_name"   => "KZ",
        "country_name" => "Kazakhstan",
        ],[
        "short_name"   => "KE",
        "country_name" => "Kenya",
        ],[
        "short_name"   => "KI",
        "country_name" => "Kiribati",
        ],[
        "short_name"   => "KP",
        "country_name" => "Korea, Democratic People's Republic Of",
        ],[
        "short_name"   => "KR",
        "country_name" => "South Korea",
        ],[
        "short_name"   => "KW",
        "country_name" => "Kuwait",
        ],[
        "short_name"   => "KG",
        "country_name" => "Kyrgyzstan",
        ],[
        "short_name"   => "LA",
        "country_name" => "Lao People\s Democratic Republic",
        ],[
        "short_name"   => "LV",
        "country_name" => "Latvia",
        ],[
        "short_name"   => "LB",
        "country_name" => "Lebanon",
        ],[
        "short_name"   => "LS",
        "country_name" => "Lesotho",
        ],[
        "short_name"   => "LR",
        "country_name" => "Liberia",
        ],[
        "short_name"   => "LY",
        "country_name" => "Libyan Arab Jamahiriya",
        ],[
        "short_name"   => "LI",
        "country_name" => "Liechtenstein",
        ],[
        "short_name"   => "LT",
        "country_name" => "Lithuania",
        ],[
        "short_name"   => "LU",
        "country_name" => "Luxembourg",
        ],[
        "short_name"   => "MO",
        "country_name" => "Macao",
        ],[
        "short_name"   => "MK",
        "country_name" => "Macedonia",
        ],[
        "short_name"   => "MG",
        "country_name" => "Madagascar",
        ],[
        "short_name"   => "MW",
        "country_name" => "Malawi",
        ],[
        "short_name"   => "MY",
        "country_name" => "Malaysia",
        ],[
        "short_name"   => "MV",
        "country_name" => "Maldives",
        ],[
        "short_name"   => "ML",
        "country_name" => "Mali",
        ],[
        "short_name"   => "MT",
        "country_name" => "Malta",
        ],[
        "short_name"   => "MQ",
        "country_name" => "Martinique",
        ],[
        "short_name"   => "MR",
        "country_name" => "Mauritania",
        ],[
        "short_name"   => "MU",
        "country_name" => "Mauritius",
        ],[
        "short_name"   => "YT",
        "country_name" => "Mayotte",
        ],[
        "short_name"   => "MD",
        "country_name" => "Moldova",
        ],[
        "short_name"   => "MC",
        "country_name" => "Monaco",
        ],[
        "short_name"   => "MN",
        "country_name" => "Mongolia",
        ],[
        "short_name"   => "MS",
        "country_name" => "Montserrat",
        ],[
        "short_name"   => "MA",
        "country_name" => "Morocco",
        ],[
        "short_name"   => "MZ",
        "country_name" => "Mozambique",
        ],[
        "short_name"   => "MM",
        "country_name" => "Myanmar",
        ],[
        "short_name"   => "NA",
        "country_name" => "Namibia",
        ],[
        "short_name"   => "NR",
        "country_name" => "Nauru",
        ],[
        "short_name"   => "NP",
        "country_name" => "Nepal",
        ],[
        "short_name"   => "NL",
        "country_name" => "Netherlands",
        ],[
        "short_name"   => "AN",
        "country_name" => "Netherlands Antilles",
        ],[
        "short_name"   => "NC",
        "country_name" => "New Caledonia",
        ],[
        "short_name"   => "NZ",
        "country_name" => "New Zealand",
        ],[
        "short_name"   => "NI",
        "country_name" => "Nicaragua",
        ],[
        "short_name"   => "NE",
        "country_name" => "Niger",
        ],[
        "short_name"   => "NG",
        "country_name" => "Nigeria",
        ],[
        "short_name"   => "NU",
        "country_name" => "Niue",
        ],[
        "short_name"   => "NF",
        "country_name" => "Norfolk Island",
        ],[
        "short_name"   => "NO",
        "country_name" => "Norway",
        ],[
        "short_name"   => "OM",
        "country_name" => "Oman",
        ],[
        "short_name"   => "PK",
        "country_name" => "Pakistan",
        ],[
        "short_name"   => "PA",
        "country_name" => "Panama",
        ],[
        "short_name"   => "PG",
        "country_name" => "Papua New Guinea",
        ],[
        "short_name"   => "PY",
        "country_name" => "Paraguay",
        ],[
        "short_name"   => "PE",
        "country_name" => "Peru",
        ],[
        "short_name"   => "PH",
        "country_name" => "Philippines",
        ],[
        "short_name"   => "PN",
        "country_name" => "Pitcairn",
        ],[
        "short_name"   => "PL",
        "country_name" => "Poland",
        ],[
        "short_name"   => "PT",
        "country_name" => "Portugal",
        ],[
        "short_name"   => "QA",
        "country_name" => "Qatar",
        ],[
        "short_name"   => "RE",
        "country_name" => "Reunion",
        ],[
        "short_name"   => "RO",
        "country_name" => "Romania",
        ],[
        "short_name"   => "RU",
        "country_name" => "Russia",
        ],[
        "short_name"   => "RW",
        "country_name" => "Rwanda",
        ],[
        "short_name"   => "KN",
        "country_name" => "Saint Kitts and Nevis",
        ],[
        "short_name"   => "LC",
        "country_name" => "Saint Lucia",
        ],[
        "short_name"   => "VC",
        "country_name" => "St. Vincent",
        ],[
        "short_name"   => "WS",
        "country_name" => "Samoa",
        ],[
        "short_name"   => "SM",
        "country_name" => "San Marino",
        ],[
        "short_name"   => "ST",
        "country_name" => "Sao Tome and Principe",
        ],[
        "short_name"   => "SA",
        "country_name" => "Saudi Arabia",
        ],[
        "short_name"   => "SN",
        "country_name" => "Senegal",
        ],[
        "short_name"   => "SC",
        "country_name" => "Seychelles",
        ],[
        "short_name"   => "SL",
        "country_name" => "Sierra Leone",
        ],[
        "short_name"   => "SG",
        "country_name" => "Singapore",
        ],[
        "short_name"   => "SK",
        "country_name" => "Slovakia",
        ],[
        "short_name"   => "SI",
        "country_name" => "Slovenia",
        ],[
        "short_name"   => "SB",
        "country_name" => "Solomon Islands",
        ],[
        "short_name"   => "SO",
        "country_name" => "Somalia",
        ],[
        "short_name"   => "ZA",
        "country_name" => "South Africa",
        ],[
        "short_name"   => "GS",
        "country_name" => "South Georgia & South Sandwich Islands",
        ],[
        "short_name"   => "ES",
        "country_name" => "Spain",
        ],[
        "short_name"   => "LK",
        "country_name" => "Sri Lanka",
        ],[
        "short_name"   => "SH",
        "country_name" => "Saint Helena",
        ],[
        "short_name"   => "PM",
        "country_name" => "Saint Pierre And Miquelon",
        ],[
        "short_name"   => "SD",
        "country_name" => "Sudan",
        ],[
        "short_name"   => "SR",
        "country_name" => "Suriname",
        ],[
        "short_name"   => "SJ",
        "country_name" => "Svalbard And Jan Mayen",
        ],[
        "short_name"   => "SZ",
        "country_name" => "Swaziland",
        ],[
        "short_name"   => "SE",
        "country_name" => "Sweden",
        ],[
        "short_name"   => "CH",
        "country_name" => "Switzerland",
        ],[
        "short_name"   => "SY",
        "country_name" => "Syria",
        ],[
        "short_name"   => "TW",
        "country_name" => "Taiwan",
        ],[
        "short_name"   => "TJ",
        "country_name" => "Tajikistan",
        ],[
        "short_name"   => "TZ",
        "country_name" => "Tanzania, United Republic Of",
        ],[
        "short_name"   => "TH",
        "country_name" => "Thailand",
        ],[
        "short_name"   => "TG",
        "country_name" => "Togo",
        ],[
        "short_name"   => "TK",
        "country_name" => "Tokelau",
        ],[
        "short_name"   => "TO",
        "country_name" => "Tonga",
        ],[
        "short_name"   => "TT",
        "country_name" => "Trinidad and Tobago",
        ],[
        "short_name"   => "TN",
        "country_name" => "Tunisia",
        ],[
        "short_name"   => "TR",
        "country_name" => "Turkey",
        ],[
        "short_name"   => "TM",
        "country_name" => "Turkmenistan",
        ],[
        "short_name"   => "TC",
        "country_name" => "Turks and Caicos Islands",
        ],[
        "short_name"   => "TV",
        "country_name" => "Tuvalu",
        ],[
        "short_name"   => "UG",
        "country_name" => "Uganda",
        ],[
        "short_name"   => "UA",
        "country_name" => "Ukraine",
        ],[
        "short_name"   => "AE",
        "country_name" => "United Arab Emirates",
        ],[
        "short_name"   => "GB",
        "country_name" => "United Kingdom",
        ],[
        "short_name"   => "US",
        "country_name" => "United States",
        ],[
        "short_name"   => "UM",
        "country_name" => "United States Minor Outlying Islands",
        ],[
        "short_name"   => "UY",
        "country_name" => "Uruguay",
        ],[
        "short_name"   => "UZ",
        "country_name" => "Uzbekistan",
        ],[
        "short_name"   => "VU",
        "country_name" => "Vanuatu",
        ],[
        "short_name"   => "VA",
        "country_name" => "Holy See (Vatican City State)",
        ],[
        "short_name"   => "VE",
        "country_name" => "Venezuela",
        ],[
        "short_name"   => "VN",
        "country_name" => "Vietnam",
        ],[
        "short_name"   => "VG",
        "country_name" => "Virgin Islands (British)",
        ],[
        "short_name"   => "WF",
        "country_name" => "Wallis and Futuna Islands",
        ],[
        "short_name"   => "EH",
        "country_name" => "Western Sahara",
        ],[
        "short_name"   => "YE",
        "country_name" => "Yemen",
        ],[
        "short_name"   => "ZM",
        "country_name" => "Zambia",
        ],[
        "short_name"   => "ZW",
        "country_name" => "Zimbabwe",
        ],[
        "short_name"   => "AX",
        "country_name" => "Aland Islands",
        ],[
        "short_name"   => "CD",
        "country_name" => "Congo, The Democratic Republic Of The",
        ],[
        "short_name"   => "CW",
        "country_name" => "Curaçao",
        ],[
        "short_name"   => "GG",
        "country_name" => "Guernsey",
        ],[
        "short_name"   => "IM",
        "country_name" => "Isle Of Man",
        ],[
        "short_name"   => "JE",
        "country_name" => "Jersey",
        ],[
        "short_name"   => "KV",
        "country_name" => "Kosovo",
        ],[
        "short_name"   => "PS",
        "country_name" => "Palestinian Territory",
        ],[
        "short_name"   => "BL",
        "country_name" => "Saint Barthélemy",
        ],[
        "short_name"   => "MF",
        "country_name" => "Saint Martin",
        ],[
        "short_name"   => "RS",
        "country_name" => "Serbia",
        ],[
        "short_name"   => "SX",
        "country_name" => "Sint Maarten",
        ],[
        "short_name"   => "TL",
        "country_name" => "Timor Leste",
        ],[
        "short_name"   => "MX",
        "country_name" => "Mexico",
    ],
] ?>

        <?php
        $selected_countries = get_option("chaty_countries_list".$this->widget_index);
        $selected_countries = ($selected_countries === false || empty($selected_countries) || !is_array($selected_countries)) ? [] : $selected_countries;
        $count   = count($selected_countries);
        $message = esc_html__("All countries", "chaty");
        if ($count == 1) {
            $message = esc_html__("1 country selected", "chaty");
        } else if ($count > 1) {
            $message = $count.esc_html__(" countries selected", "chaty");
        }
        ?>

        <div class="form-horizontal__item">
            <label class="form-horizontal__item-label font-primary text-cht-gray-150 text-base block mb-3">
                <?php esc_html_e('Country targeting', 'chaty') ?>
                <span class="header-tooltip ml-1">
                    <span class="header-tooltip-text text-center"><?php esc_html_e("Target your widget to specific countries. You can create different widgets for different countries", "chaty") ?> </span>
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </span>
                </span>
            </label>
            <div class="country-option-box <?php echo esc_attr($count?"show-remove-rules-btn":"") ?>">
                <div class="country-list-box <?php echo esc_attr($count?"":"hidden") ?> mb-3 <?php echo esc_attr($is_pro ? "is-pro" : "not-pro") ?>">
                    <select name="chaty_countries_list[]" multiple placeholder="Select Country" class="country-list chaty-select <?php echo esc_attr($is_pro ? "is-pro" : "not-pro") ?>">
                        <?php foreach ($countries as $country) {
                            $selected = in_array($country["short_name"], $selected_countries) ? "selected" : "";
                            ?>
                            <option <?php echo esc_attr($selected) ?> value="<?php echo esc_attr($country["short_name"]) ?>"><?php echo esc_attr($country["country_name"]) ?></option>
                        <?php } ?>
                    </select>
                    <?php if (!$is_pro): ?>
                    <div class="chaty-pro-feature">
                        <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                            <?php esc_html_e('Activate your license key', 'chaty');?>
                        </a>
                    </div>
                    <?php endif; ?>
                </div>
                <div class="z-10">
                    <a href="javascript:;" class="create-rule mr-3 border border-solid border-cht-gray-150/60 text-cht-gray-150 text-base px-3 py-1 rounded-lg inline-block hover:text-cht-primary hover:border-cht-primary" id="create-country-rule"><?php esc_html_e("Add Rule", "chaty") ?></a>
                    <a href="javascript:;" class="px-3 py-1 hidden remove-rules rounded-lg bg-transparent  text-red-500 hover:bg-red-500/10  focus:bg-red-500/10 hover:text-red-500 focus:text-red-500 border border-solid border-red-500 text-base" id="remove-country-rules"><?php esc_html_e("Remove Rules", "chaty") ?></a>
                </div>
            </div>
        </div>

        <div class="form-horizontal__item">
            <label class="form-horizontal__item-label font-primary text-cht-gray-150 text-base block mb-3">Custom CSS
            <span class="header-tooltip">
                <span class="header-tooltip-text text-center"><?php esc_html_e("Use this option if you wish to modify your widget additionally. This step is optional.", 'chaty');?></span>
                <span class="ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </span>
            </span>
            </label>
            <?php $custom_css = get_option("chaty_custom_css".$this->widget_index); ?>
            <div class="country-option-box <?php echo esc_attr($is_pro ? "is-pro" : "not-pro") ?>">
                <div class="css-option-box">
                    <textarea name="chaty_custom_css" id="chaty_custom_css" class="custom-css"><?php echo esc_attr($custom_css) ?></textarea>
                </div>
                <?php if (!$is_pro) { ?>
                <div class="chaty-pro-feature">
                    <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl());?>">
                        <?php esc_html_e('Activate your license key', 'chaty');?>
                    </a>
                </div>
                <?php } ?>
            </div>
        </div>
    </div>
</section>

<div class="chaty-date-and-time-options-html" style="display: none">
    <div class="chaty-date-time-option group-control-wrap mb-2 p-5 relative" data-index="__count__">
        <div class="date-time-content grid grid-cols-2 gap-4 <?php echo esc_attr($is_pro ? "is-pro" : "not-pro") ?>">
            <div class="day-select col-span-2">
                <label class="block font-primary text-cht-gray-150 text-base my-2"><?php esc_html_e('Select day', 'chaty') ?></label>
                <select class="w-full" name="cht_date_and_time_settings[__count__][days]" id="url_shown_on___count___option">
                    <?php foreach ($days as $key => $value) { ?>
                        <option value="<?php echo esc_attr($key) ?>"><?php echo esc_attr($value) ?></option>
                    <?php } ?>
                </select>
            </div>
            <div class="day-label">
                <label class="block font-primary text-cht-gray-150 text-base my-2"><?php esc_html_e('From', 'chaty') ?></label>
                <input type="text" class="cht-required time-picker w-full" value="" autocomplete="off" name="cht_date_and_time_settings[__count__][start_time]" id="start_time___count__" />
            </div>
            <div class="day-label">
                <label class="block font-primary text-cht-gray-150 text-base my-2"><?php esc_html_e('To', 'chaty') ?></label>
                <input type="text" class="cht-required time-picker w-full" value="" autocomplete="off" name="cht_date_and_time_settings[__count__][end_time]" id="end_time___count__" />
            </div>
            <div class="day-time time-data gtm-select col-span-2">
                <label class="gmt-data font-primary text-cht-gray-150 text-base my-2"><?php esc_html_e('GMT', 'chaty') ?></label>
                <div class="gmt-data">
                    <select class="select2-pending w-full" name="cht_date_and_time_settings[__count__][gmt]" id="gmt___count___option">
                        <!-- This will return option list -->
                        <?php echo chaty_timezone_choice("", false);?>
                    </select>
                </div>
            </div>

            <?php if (!$this->is_pro()) { ?>
                <div class="chaty-pro-feature">
                    <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl()) ?>">
                        <?php esc_html_e('Activate your license key', 'chaty'); ?>
                    </a>
                </div>
            <?php } ?>
        </div>

        <div class="day-buttons">
            <a class="remove-page-option absolute" href="javascript:;">
                <svg class="pointer-events-none" data-v-1cf7b632="" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1">
                    <path data-v-1cf7b632="" d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.334 1.334 0 01-1.334 1.334H4.667a1.334 1.334 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </a>
        </div>
    </div>
</div>

<div class="chaty-page-options-html" style="display: none">
    <div class="chaty-page-option group-control-wrap mb-2 py-5 pl-5 pr-7 relative  <?php echo esc_attr($is_pro ? "is-pro" : "not-pro") ?>">
        <div class="url-content">

            <div class="grid grid-cols-2 gap-4">
                <div class="url-select">
                    <select class="w-full" name="cht_page_settings[__count__][shown_on]" id="url___count___option">
                        <option value="show_on"><?php esc_html_e("Show on", "chaty") ?></option>
                        <option value="not_show_on"><?php esc_html_e("Don't show on", "chaty") ?></option>
                    </select>
                </div>
                <div class="url-option">
                    <select class="url-options w-full" name="cht_page_settings[__count__][option]" id="url_rules___count___option">
                        <option selected="selected" disabled value=""><?php esc_html_e("Select Rule", "chaty") ?></option>
                        <?php foreach ($url_options as $key => $value) { ?>
                            <option value="<?php echo esc_attr($key) ?>"><?php echo esc_attr($value) ?></option>';
                            <?php
                        } ?>
                    </select>
                </div>
            </div>

            <div class="sm:flex items-center mt-2">
                <div class="url-box">
                    <span class='chaty-url url-title page-url-title active'><?php echo esc_attr(site_url("/")); ?></span>
                    <span class='chaty-wp_pages url-title'><?php esc_html_e("Pages", "chaty"); ?></span>
                    <span class='chaty-wp_posts url-title'><?php esc_html_e("Posts", "chaty"); ?></span>
                    <span class='chaty-wp_categories url-title'><?php esc_html_e("Categories", "chaty"); ?></span>
                    <span class='chaty-wp_tags url-title'><?php esc_html_e("Tags", "chaty"); ?></span>
                </div>
                <div class="url-values">
                    <div class="url-setting-option url-default active">
                        <input type="text" class="url-value w-full" value="" name="cht_page_settings[__count__][value]" id="url_rules___count___value" />
                    </div>
                    <div class="url-setting-option wp_pages-option">
                        <select class="pages-options" multiple name="cht_page_settings[__count__][page_ids][]" id="url_rules___count___page_ids">
                        </select>
                    </div>
                    <div class="url-setting-option wp_posts-option">
                        <select class="posts-options" multiple name="cht_page_settings[__count__][post_ids][]" id="url_rules___count___post_ids">
                        </select>
                    </div>
                    <div class="url-setting-option wp_categories-option">
                        <select class="wp_categories-options" multiple name="cht_page_settings[__count__][category_ids][]" id="url_rules___count___category_ids">
                        </select>
                    </div>
                    <div class="url-setting-option wp_tags-option">
                        <select class="wp_tags-options" multiple name="cht_page_settings[__count__][tag_ids][]" id="url_rules___count___tag_ids">
                        </select>
                    </div>
                    <div class="url-setting-option wc_products-option">
                        <select class="wc_products-options" multiple name="cht_page_settings[__count__][products_ids][]" id="url_rules___count___products_ids">
                        </select>
                    </div>
                    <div class="url-setting-option wc_products_on_sale-option">
                        <select class="wc_products_on_sale-options" multiple name="cht_page_settings[__count__][wc_products_ids][]" id="url_rules___count___wc_products_ids">
                        </select>
                    </div>
                </div>
            </div>

            <div class="url-buttons">
                <a class="remove-chaty absolute" href="javascript:;">
                    <svg class="pointer-events-none" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1">
                        <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.334 1.334 0 01-1.334 1.334H4.667a1.334 1.334 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </a>
            </div>
        </div>
        <?php if (!$this->is_pro()) { ?>
            <div class="chaty-pro-feature">
                <a target="_blank" href="<?php echo esc_url($this->getUpgradeMenuItemUrl()) ?>">
                    <?php esc_html_e('Activate your license key', 'chaty'); ?>
                </a>
            </div>
        <?php } ?>
    </div>
</div>


<div class="custom-traffic-rules-html" style="display: none">
    <div class="custom-traffic-rule" data-id="__count__">
        <div class="traffic-option">
            <select name="chaty_custom_traffic_rules[__count__][url_option]" id="url_option___count__">
                <option value="contain"><?php esc_html__("Contains", "chaty") ?></option>
                <option value="not_contain"><?php esc_html__("Not contains", "chaty") ?></option>
            </select>
        </div>
        <div class="traffic-url">
            <input type="text" name="chaty_custom_traffic_rules[__count__][url_value]" placeholder="https://www.example.com" />
        </div>
        <div class="traffic-action">
            <a class="remove-traffic-option" href="javascript:;">
                <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="15.6301" height="2.24494" rx="1.12247" transform="translate(2.26764 0.0615997) rotate(45)" fill="white"></rect>
                    <rect width="15.6301" height="2.24494" rx="1.12247" transform="translate(13.3198 1.649) rotate(135)" fill="white"></rect>
                </svg>
            </a>
        </div>
    </div>
</div>
