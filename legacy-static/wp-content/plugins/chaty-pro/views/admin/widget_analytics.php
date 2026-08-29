<?php
if (!defined('ABSPATH')) {
    exit;
}
$allowedTags = array(
    'span'       => array(
        'class'   => array(),
        'style'  => array(),
    ),
    'b'         => [],
    'strong'    => []
);
?>
<h1></h1>
<div class="container">

    <header class="flex items-center justify-between flex-wrap py-5 space-y-3 sm:space-y-0">
        <a href="<?php echo esc_url( $this->getDashboardUrl() ) ?>">
            <img src="<?php echo esc_url(plugins_url('../../admin/assets/images/logo-color.svg', __FILE__)); ?>" alt="Chaty" class="logo">
        </a>
        <h2 class="text-3xl font-primary text-cht-gray-150 font-semibold"><?php esc_html_e('Widget Analytics', 'chaty') ?></h2>
    </header>
    <div class="flex items-center justify-between flex-wrap space-y-4 sm:space-y-0">
        <div class="date-section">
            <?php
            $search_list = [
                'today'        => esc_html__('Today', "chaty"),
                'yesterday'    => esc_html__('Yesterday', "chaty"),
                'last_7_days'  => esc_html__('Last 7 Days', "chaty"),
                'last_30_days' => esc_html__('Last 30 Days', "chaty"),
                'this_week'    => esc_html__('This Week', "chaty"),
                'this_month'   => esc_html__('This Month', "chaty"),
                'all_time'     => esc_html__('All Time', "chaty"),
                'custom'       => esc_html__('Custom Date', "chaty"),
            ];

            $search_for = "all_time";
            if (isset($_GET['search_for']) && !empty($_GET['search_for']) && isset($search_list[$_GET['search_for']])) {
                $search_for = $_GET['search_for'];
            }

            if ($search_for == "today") {
                $start_date = gmdate("m/d/Y");
                $end_date   = gmdate("m/d/Y");
            } else if ($search_for == "yesterday") {
                $start_date = gmdate("m/d/Y", strtotime("-1 days"));
                $end_date   = gmdate("m/d/Y", strtotime("-1 days"));
            } else if ($search_for == "last_7_days") {
                $start_date = gmdate("m/d/Y", strtotime("-7 days"));
                $end_date   = gmdate("m/d/Y");
            } else if ($search_for == "last_30_days") {
                $start_date = gmdate("m/d/Y", strtotime("-30 days"));
                $end_date   = gmdate("m/d/Y");
            } else if ($search_for == "this_week") {
                $start_date = gmdate("m/d/Y", strtotime('monday this week'));
                $end_date   = gmdate("m/d/Y");
            } else if ($search_for == "this_month") {
                $start_date = gmdate("m/01/Y");
                $end_date   = gmdate("m/d/Y");
            } else if ($search_for == "custom") {
                if (isset($_GET['start_date']) && !empty($_GET['start_date'])) {
                    $start_date = $_GET['start_date'];
                }

                if (isset($_GET['end_date']) && !empty($_GET['end_date'])) {
                    $end_date = $_GET['end_date'];
                }
            } else if ($search_for == "all_time") {
                $start_date = "";
                $end_date   = "";
            }//end if
            ?>
            <form action="<?php echo esc_url(admin_url("admin.php")) ?>" method="get" id="analytics_form">
                <input type="hidden" name="page" value="widget-analytics"/>
                <div class="custom-search-box">
                    <select name="search_for" id="search_for">
                        <?php foreach ($search_list as $key => $value) { ?>
                            <option <?php selected($key, $search_for) ?> value="<?php echo esc_attr($key) ?>"><?php echo esc_attr($value) ?></option>
                        <?php } ?>
                    </select>
                </div>
                <div class="date-options mt-5" id="date_options" style="display: <?php echo ($search_for == "custom") ? "block" : "none" ?>">
                    <div class="date-option">
                        <label class="font-primary text-cht-gray-150 text-base" for="start_date"><?php esc_html_e('Start Date', 'chaty') ?></label>
                        <input type="text" name="start_date" id="start_date" readonly value="<?php echo esc_attr($start_date) ?>" />
                    </div>
                    <div class="date-option">
                        <label class="font-primary text-cht-gray-150 text-base" for="end_date"><?php esc_html_e('End Date', 'chaty') ?></label>
                        <input type="text" name="end_date" id="end_date" readonly value="<?php echo esc_attr($end_date) ?>" />
                    </div>
                    <div class="date-option">
                        <button type="submit" class="btn py-3 search-btn rounded-sm mt-3 lg:mt-0 "><?php esc_html_e('Search', 'chaty') ?></button>
                    </div>
                </div>
            </form>
        </div>

        <?php if (!empty($start_date) && !empty($end_date)) {
            $res_string = ($start_date == $end_date) ? "for <b>".esc_attr($end_date)."</b>" : "from <b>".esc_attr($start_date)."</b> to <b>".esc_attr($end_date)."</b>";
        } else if (empty($start_date) && empty($end_date)) {
            $res_string = "for <b>All time</b>";
        } ?>
        <div class="result-data text-base font-primary font-semibold">
            Showing results <span class="text-cht-primary"> <?php echo wp_kses($res_string, $allowedTags) ?> </span>
        </div>
    </div>
    
    <div class="analytics-records">
        
        <?php
        if (!empty($start_date) && !empty($end_date)) {
            $start_date = strtotime($start_date);
            $end_date   = strtotime($end_date);
        } else {
            $start_date = "";
            $end_date   = "";
        }

        $records = get_analytics_records($start_date, $end_date);
        $i       = 0;
        $i_count = 0;
        if (!empty($records)) {
            foreach ($records as $record) {
                $channel_record = [];
                ?>
                <?php
                $i_count++;
                $widget_id = $record['id'];
                if (!empty($widget_id)) {
                    $widget_id = "_".$widget_id;
                }

                $widget_name = get_option("cht_widget_title".$widget_id);
                if (empty($widget_name)) {
                    if (!empty($widget_id)) {
                        $widget_name = "Widget #".(trim($widget_id, "_") + 1);
                    } else {
                        $widget_name = "Widget #1";
                    }
                }

                $state    = get_option("chaty_default_state".$widget_id);
                $button   = get_option("cht_close_button".$widget_id);
                $has_icon = true;
                if ($state == "open" && $button == "no") {
                    $has_icon = false;
                }

                $has_image = false;
                $image_url = "";
                if ($has_icon) {
                    $social = get_option('cht_numb_slug'.$widget_id);
                    $social = trim($social, ",");
                    if (!empty($social)) {
                        $social = explode(",", $social);
                        if (count($social) == 1) {
                            $channel     = $social[0];
                            $def_channel = $socials[strtolower($channel)];
                            $title       = $def_channel['title'];
                            $color       = $def_channel['color'];
                            $icon        = $def_channel['svg'];
                            $slug        = $def_channel['slug'];
                            $settings    = get_option('cht_social'.$widget_id.'_'.$slug);
                            $color       = isset($settings['bg_color']) ? $settings['bg_color'] : $color;
                            $title       = isset($settings['title']) ? $settings['title'] : $title;
                            $image_id    = isset($settings['image_id']) ? $settings['image_id'] : "";

                            if (!empty($image_id)) {
                                $image_url = wp_get_attachment_url($image_id);
                                if (!empty($image_url)) {
                                    $has_image = true;
                                }
                            }

                            if (!empty($color)) {
                                if (strtolower($channel) != 'instagram' || $color != '#ffffff') {
                                    echo "<style>.svg-main-icon-".esc_attr($i_count)." svg circle {fill: ".esc_attr($color)." !important;}</style>";
                                }
                            }
                        } else {
                            $icon = get_option("widget_icon".$widget_id);
                            if ($icon == "chat-image") {
                                $image_data = get_option("cht_widget_img".$widget_id);
                                if (isset($image_data['url']) && !empty($image_data['url'])) {
                                    $image_url = $image_data['url'];
                                    $has_image = true;
                                }
                            }

                            if ($icon == "chat-base") {
                                $icon = '<svg version="1.1" id="ch" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="-496 507.7 54 54" style="enable-background:new -496 507.7 54 54;" xml:space="preserve"> <style type="text/css">.st1 { fill: #FFFFFF; } .st0 { fill: #808080; } </style> <g><circle cx="-469" cy="534.7" r="27" fill="#a886cd"/></g><path class="st1" d="M-459.9,523.7h-20.3c-1.9,0-3.4,1.5-3.4,3.4v15.3c0,1.9,1.5,3.4,3.4,3.4h11.4l5.9,4.9c0.2,0.2,0.3,0.2,0.5,0.2 h0.3c0.3-0.2,0.5-0.5,0.5-0.8v-4.2h1.7c1.9,0,3.4-1.5,3.4-3.4v-15.3C-456.5,525.2-458,523.7-459.9,523.7z"/><path class="st0" d="M-477.7,530.5h11.9c0.5,0,0.8,0.4,0.8,0.8l0,0c0,0.5-0.4,0.8-0.8,0.8h-11.9c-0.5,0-0.8-0.4-0.8-0.8l0,0C-478.6,530.8-478.2,530.5-477.7,530.5z"/><path class="st0" d="M-477.7,533.5h7.9c0.5,0,0.8,0.4,0.8,0.8l0,0c0,0.5-0.4,0.8-0.8,0.8h-7.9c-0.5,0-0.8-0.4-0.8-0.8l0,0C-478.6,533.9-478.2,533.5-477.7,533.5z"/></svg>';
                            } else if ($icon == "chat-smile") {
                                $icon = '<svg version="1.1" id="smile" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="-496.8 507.1 54 54" style="enable-background:new -496.8 507.1 54 54;" xml:space="preserve"><style type="text/css">.st1 { fill: #FFFFFF; }.st2 { fill: none; stroke: #808080; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }</style><g><circle cx="-469.8" cy="534.1" r="27" fill="#a886cd"/></g><path class="st1" d="M-459.5,523.5H-482c-2.1,0-3.7,1.7-3.7,3.7v13.1c0,2.1,1.7,3.7,3.7,3.7h19.3l5.4,5.4c0.2,0.2,0.4,0.2,0.7,0.2c0.2,0,0.2,0,0.4,0c0.4-0.2,0.6-0.6,0.6-0.9v-21.5C-455.8,525.2-457.5,523.5-459.5,523.5z"/><path class="st2" d="M-476.5,537.3c2.5,1.1,8.5,2.1,13-2.7"/><path class="st2" d="M-460.8,534.5c-0.1-1.2-0.8-3.4-3.3-2.8"/></svg>';
                            } else if ($icon == "chat-bubble") {
                                $icon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="-496.9 507.1 54 54" style="enable-background:new -496.9 507.1 54 54;" xml:space="preserve"><style type="text/css">.st1 { fill: #FFFFFF; }</style><g><circle cx="-469.9" cy="534.1" r="27" fill="#a886cd"/></g><path class="st1" d="M-472.6,522.1h5.3c3,0,6,1.2,8.1,3.4c2.1,2.1,3.4,5.1,3.4,8.1c0,6-4.6,11-10.6,11.5v4.4c0,0.4-0.2,0.7-0.5,0.9 c-0.2,0-0.2,0-0.4,0c-0.2,0-0.5-0.2-0.7-0.4l-4.6-5c-3,0-6-1.2-8.1-3.4s-3.4-5.1-3.4-8.1C-484.1,527.2-478.9,522.1-472.6,522.1z M-462.9,535.3c1.1,0,1.8-0.7,1.8-1.8c0-1.1-0.7-1.8-1.8-1.8c-1.1,0-1.8,0.7-1.8,1.8C-464.6,534.6-463.9,535.3-462.9,535.3z M-469.9,535.3c1.1,0,1.8-0.7,1.8-1.8c0-1.1-0.7-1.8-1.8-1.8c-1.1,0-1.8,0.7-1.8,1.8C-471.7,534.6-471,535.3-469.9,535.3z M-477,535.3c1.1,0,1.8-0.7,1.8-1.8c0-1.1-0.7-1.8-1.8-1.8c-1.1,0-1.8,0.7-1.8,1.8C-478.8,534.6-478.1,535.3-477,535.3z"/>';
                            } else if ($icon == "chat-db") {
                                $icon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="-496 507.1 54 54" style="enable-background:new -496 507.1 54 54;" xml:space="preserve"><style type="text/css">.st1 {fill: #FFFFFF;}</style><g><circle cx="-469" cy="534.1" r="27" fill="#a886cd"/></g><path class="st1" d="M-464.6,527.7h-15.6c-1.9,0-3.5,1.6-3.5,3.5v10.4c0,1.9,1.6,3.5,3.5,3.5h12.6l5,5c0.2,0.2,0.3,0.2,0.7,0.2 c0.2,0,0.2,0,0.3,0c0.3-0.2,0.5-0.5,0.5-0.9v-18.2C-461.1,529.3-462.7,527.7-464.6,527.7z"/><path class="st1" d="M-459.4,522.5H-475c-1.9,0-3.5,1.6-3.5,3.5h13.9c2.9,0,5.2,2.3,5.2,5.2v11.6l1.9,1.9c0.2,0.2,0.3,0.2,0.7,0.2 c0.2,0,0.2,0,0.3,0c0.3-0.2,0.5-0.5,0.5-0.9v-18C-455.9,524.1-457.5,522.5-459.4,522.5z"/></svg>';
                            } else {
                                $icon = '<svg version="1.1" id="ch" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="-496 507.7 54 54" style="enable-background:new -496 507.7 54 54;" xml:space="preserve"> <style type="text/css">.st1 { fill: #FFFFFF; } .st0 { fill: #808080; } </style> <g><circle cx="-469" cy="534.7" r="27" fill="#a886cd"/></g><path class="st1" d="M-459.9,523.7h-20.3c-1.9,0-3.4,1.5-3.4,3.4v15.3c0,1.9,1.5,3.4,3.4,3.4h11.4l5.9,4.9c0.2,0.2,0.3,0.2,0.5,0.2 h0.3c0.3-0.2,0.5-0.5,0.5-0.8v-4.2h1.7c1.9,0,3.4-1.5,3.4-3.4v-15.3C-456.5,525.2-458,523.7-459.9,523.7z"/><path class="st0" d="M-477.7,530.5h11.9c0.5,0,0.8,0.4,0.8,0.8l0,0c0,0.5-0.4,0.8-0.8,0.8h-11.9c-0.5,0-0.8-0.4-0.8-0.8l0,0C-478.6,530.8-478.2,530.5-477.7,530.5z"/><path class="st0" d="M-477.7,533.5h7.9c0.5,0,0.8,0.4,0.8,0.8l0,0c0,0.5-0.4,0.8-0.8,0.8h-7.9c-0.5,0-0.8-0.4-0.8-0.8l0,0C-478.6,533.9-478.2,533.5-477.7,533.5z"/></svg>';
                            }

                            $color        = get_option("cht_color".$widget_id);
                            $custom_color = get_option("cht_custom_color".$widget_id);
                            if (!empty($custom_color)) {
                                $color = $custom_color;
                            }

                            if (!empty($color)) {
                                echo "<style>.svg-main-icon-".esc_attr($i_count)." svg circle {fill: ".esc_attr($color)." !important;}</style>";
                            }
                        }//end if
                    }//end if
                }//end if

                $no_of_views  = isset($record['setting']['no_of_views']) ? $record['setting']['no_of_views'] : 0;
                $no_of_clicks = isset($record['setting']['no_of_clicks']) ? $record['setting']['no_of_clicks'] : 0;
                ?>
                <div class="analytics-record">
                    <div class="analytics-head text-xl font-primary text-cht-gray-150 mb-2">
                        <?php if ($has_icon) { ?>
                            <span class="img-icon svg-main-icon-<?php echo esc_attr($i_count); ?>">
                                <?php if ($has_image) { ?>
                                    <img src="<?php echo esc_url($image_url) ?>" />
                                <?php } else { ?>
                                    <span class="svg-main-icon-<?php echo esc_attr($i_count) ?>">
                                        <?php echo isset($icon) ? $icon : "" ?>
                                    </span>
                                <?php } ?>
                            </span>
                        <?php } ?>
                        <?php echo esc_attr($widget_name) ?>
                    </div>
                    <div class="analytics-table">
                        <table class="border-separate w-full rounded-lg border border-cht-gray-50" cellspacing="0" cellpadding="0">
                            <thead>
                                <tr>
                                    <th class="rounded-tl-lg text-cht-gray-150 text-sm font-semibold font-primary py-3 px-8 bg-cht-primary-50 text-left" width="34%"><?php esc_html_e('Channel', 'chaty') ?></th>
                                    <th class="text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50" width="22%"><?php esc_html_e('Visitors', 'chaty') ?></th>
                                    <th class="text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50" width="24%"><?php esc_html_e('Unique Clicks', 'chaty') ?>
                                        <span class="icon label-tooltip cursor-pointer" data-title="If a visitor clicked twice on the same channel(E.g. WhatsApp), it'll count as 1 click. Please keep in mind that the unique clicks aren't the number of visitors that contacted you - in some cases, a visitor will click on your chat channels but won't actually send you a message.">
                                            <span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M8.00004 14.6654C11.6819 14.6654 14.6667 11.6806 14.6667 7.9987C14.6667 4.3168 11.6819 1.33203 8.00004 1.33203C4.31814 1.33203 1.33337 4.3168 1.33337 7.9987C1.33337 11.6806 4.31814 14.6654 8.00004 14.6654Z" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 10.6667V8" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    <path d="M8 5.33203H8.00667" stroke="#72777c" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </span>
                                        </span>
                                    </th>
                                    <th class="rounded-tr-lg text-cht-gray-150 text-sm font-semibold font-primary py-3 px-2 bg-cht-primary-50" width="20%"><?php esc_html_e('Click-rate', 'chaty') ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="bg-white py-3.5 px-8 text-cht-gray-150 font-primary text-sm text-left border-t border-r" data-title="<?php esc_html_e('Channel', 'chaty') ?>">
                                        <?php if ($has_icon) { ?>
                                            <span class="img-icon svg-main-icon-<?php echo esc_attr($i_count); ?>">
                                                <?php if ($has_image) { ?>
                                                    <img src="<?php echo esc_url($image_url) ?>" />
                                                <?php } else { ?>
                                                    <span class="svg-main-icon-<?php echo esc_attr($i_count) ?>" >
                                                        <?php echo (isset($icon) ? $icon : "") ?>
                                                    </span>
                                                <?php } ?>
                                            </span>
                                        <?php } ?>
                                        <?php echo esc_attr($widget_name) ?>
                                    </td>
                                    <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-t border-r" data-title="<?php esc_html_e('Visitors', 'chaty') ?>"><?php echo esc_attr($no_of_views) ?></td>
                                    <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-t border-r" data-title="<?php esc_html_e('Unique Clicks', 'chaty') ?>"><?php echo esc_attr($no_of_clicks) ?></td>
                                    <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-t" data-title="<?php esc_html_e('Click-rate', 'chaty') ?>"><?php echo (!empty($no_of_views)) ? number_format(($no_of_clicks * 100 / $no_of_views), 2, ".", ",")."%" : "-"; ?></td>
                                </tr>
                                <?php foreach ($record['channels'] as $channel) {
                                    if (isset($socials[$channel['channel_slug']])) {
                                        $def_channel = $socials[$channel['channel_slug']];
                                        $title       = $def_channel['title'];
                                        $color       = $def_channel['color'];
                                        $icon        = $def_channel['svg'];
                                        $has_image   = false;
                                        $slug        = $def_channel['slug'];
                                        $settings    = get_option('cht_social'.$widget_id.'_'.$slug);
                                        $color       = isset($settings['bg_color']) ? $settings['bg_color'] : $color;
                                        $title       = isset($settings['title']) ? $settings['title'] : $title;
                                        $image_id    = isset($settings['image_id']) ? $settings['image_id'] : "";
                                        $image_url   = "";
                                        if (!empty($image_id)) {
                                            $image_url = wp_get_attachment_url($image_id);
                                            if (!empty($image_url)) {
                                                $has_image = true;
                                            }
                                        }
                                        ?>
                                        <tr>
                                            <td class="bg-white py-3.5 px-8 text-cht-gray-150 font-primary text-sm text-left border-t border-r" data-title="<?php esc_html_e('Channel', 'chaty') ?>">
                                                <span class="img-icon">
                                                    <?php if ($has_image) { ?>
                                                        <img src="<?php echo esc_url($image_url) ?>" />
                                                    <?php } else { ?>
                                                        <?php if ($channel['channel_slug'] != "instagram" || $color != "#ffffff") { ?>
                                                            <style>.svg-icon-<?php echo esc_attr($i) ?> .color-element {fill: <?php echo esc_attr($color) ?>}</style>
                                                        <?php } ?>
                                                        <span class="svg-icon-<?php echo esc_attr($i) ?>" >
                                                            <?php echo ($icon) ?>
                                                        </span>
                                                    <?php } ?>
                                                </span>
                                                <?php echo esc_attr($title) ?>
                                            </td>
                                            <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-t border-r" data-title="<?php esc_html_e('Visitors', 'chaty') ?>"><?php echo esc_attr($channel['no_of_views']) ?></td>
                                            <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-t border-r" data-title="<?php esc_html_e('Unique Clicks', 'chaty') ?>"><?php echo esc_attr($channel['no_of_clicks']) ?></td>
                                            <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-t" data-title="<?php esc_html_e('Click-rate', 'chaty') ?>"><?php echo (!empty($channel['no_of_views'])) ? number_format(($channel['no_of_clicks'] * 100 / $channel['no_of_views']), 2, ".", ",")."%" : "-"; ?></td>
                                        </tr>
                                        <?php
                                        $i++;
                                    }//end if
                                }//end foreach
                                ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            <?php }//end foreach
            ?>
        <?php } else {
            echo "<div class='no-records'>".esc_html__("Your analytics data will appear once your Chaty widgets are displayed to your website's visitors.", "chaty")."</div>";
        }//end if
        ?>
        <div class="trigger-option-block">
            <div class="reset-analytics-btn">
                <?php
                $checked = get_option("cht_data_analytics_status");
                $checked = ($checked === false) ? "on" : $checked;
                ?>
                <input type="hidden" name="collect_analytics_data" value="no">
                <label class="chaty-switch" for="collect_analytics_data">
                    <input type="checkbox" name="collect_analytics_data" id="collect_analytics_data" value="on" <?php checked("on", $checked) ?>>
                    <div class="chaty-slider round"></div>
                    <span class="font-primary text-cht-gray-150"><?php esc_html_e("Collect Analytics Data", "chaty") ?></span>
                </label>
                <div class="clearfix"></div>
                <?php if (!empty($records)) { ?>
                    <a class="btn text-base bg-cht-red/90 hover:bg-cht-red py-2.5 justify-center rounded-lg mt-5 font-primary border-cht-red shadow-2xl shadow-cht-red/60 w-64" href="javascript:;"><?php esc_html_e("Reset Data", "chaty") ?></a>
                <?php } ?>
            </div>
        </div>
    </div>
</div>

<div class="chaty-popup-form" id="clear-data" style="display: none;">
    <div class="chaty-popup-overlay"></div>
    <div class="chaty-popup-content py-8">
        <div class="popup-description text-center font-primary text-base text-cht-gray-150 pb-7"><?php esc_html_e("Are you sure you want to reset all data?", "chaty") ?><br/><?php esc_html_e("All your analytics data will be deleted", "chaty") ?></div>
        <form action="<?php echo esc_url(admin_url("admin.php?page=")) ?>" method="get">
            <div class="select-field-btn chaty-popup-btns text-center flex items-center space-x-3">
                <input type="hidden" name="page" value="widget-analytics">
                <input type="hidden" name="nonce" value="<?php echo esc_attr(wp_create_nonce("chaty_remove_analytics")) ?>">
                <input type="hidden" name="task" value="remove-data">
                <button type="submit" class="btn w-full text-base bg-cht-red/90 hover:bg-cht-red py-2.5 justify-center rounded-lg font-primary border-cht-red shadow-2xl shadow-cht-red/60 popup-form-reset-btn"><?php esc_html_e("Reset", "chaty") ?></button>
                <a href="javascript:;" class="btn w-full justify-center text-base rounded-lg py-2.5 popup-form-cancel-btn">Cancel</a>
            </div>
        </form>
    </div>
</div>

<div class="chaty-popup-form" id="analytics-popup" style="display: none;">
    <div class="chaty-popup-overlay"></div>
    <div class="chaty-popup-content py-10">
        <div class="popup-description text-center font-primary text-cht-gray-150 text-xl"><?php esc_html_e("Chaty Analytics was turned off", "chaty") ?></div>
        <div class="select-field-btn chaty-popup-btns text-center">
            <a href="javascript:;" class="popup-form-cancel-btn btn text-base bg-cht-red/90 hover:bg-cht-red py-2.5 justify-center mt-3 rounded-lg mx-auto font-primary border-cht-red shadow-2xl shadow-cht-red/60 w-40"><?php esc_html_e("Close", "chaty") ?></a>
        </div>
    </div>
</div>

<?php
function get_analytics_records($start_date, $end_date)
{
    global $wpdb;
    $chaty_table = $wpdb->prefix.'chaty_widget_analysis';
    if ($wpdb->get_var("show tables like '{$chaty_table}'") == $chaty_table) {
        if (!empty($start_date) && !empty($end_date)) {
            $query = "SELECT id, widget_id, channel_slug, SUM(no_of_views) AS no_of_views, SUM(no_of_clicks) as no_of_clicks, is_widget
                FROM {$chaty_table}
                WHERE analysis_date >= '%s' AND analysis_date <= '%s'
                GROUP BY widget_id, is_widget, channel_slug
                ORDER BY is_widget DESC, widget_id ASC, channel_slug ASC";
            $query = $wpdb->prepare($query, [$start_date, $end_date]);
        } else {
            $query = "SELECT id, widget_id, channel_slug, SUM(no_of_views) AS no_of_views, SUM(no_of_clicks) as no_of_clicks, is_widget
                FROM {$chaty_table}
                GROUP BY widget_id, is_widget, channel_slug
                ORDER BY is_widget DESC, widget_id ASC, channel_slug ASC";
        }

        $deleted_list = get_option("chaty_deleted_settings");
        $deleted_list = empty($deleted_list) || !is_array($deleted_list) ? [] : $deleted_list;

        $chaty_widgets = get_option("chaty_total_settings");
        $chaty_widgets = empty($chaty_widgets) ? 1 : $chaty_widgets;

        $records = $wpdb->get_results($query, ARRAY_A);
        $widgets = [];
        if (!empty($records)) {
            foreach ($records as $record) {
                if ($record['is_widget'] == 1) {
                    $widget_id = $record['widget_id'];
                } else {
                    $widget_id = $record['widget_id'];
                }
                if(!in_array($widget_id, $deleted_list) && $widget_id <= $chaty_widgets) {
                    if ($widget_id == 0) {
                        $widget_id = "";
                    }
                    if ($record['is_widget'] == 1) {
                        $widget = [];
                        $widget['id'] = $widget_id;
                        $widget['setting'] = $record;
                        $widget['channels'] = [];
                        $widgets[$record['widget_id']] = $widget;
                    } else {
                        if (!isset($widgets[$record['widget_id']])) {
                            $widget = [];
                            $widget['id'] = $widget_id;
                            $widget['channels'] = [];
                            $widgets[$record['widget_id']] = $widget;
                        }

                        $widgets[$record['widget_id']]['channels'][] = $record;
                    }//end if
                }//end if
            }//end foreach
        }//end if
    }//end if

    if (!empty($widgets)) {
        $deleted_list = get_option("chaty_deleted_settings");
        if (empty($deleted_list) || !is_array($deleted_list)) {
            $deleted_list = [];
        }

        foreach ($widgets as $key => $widget) {
            if (in_array($key, $deleted_list)) {
                unset($widgets[$key]);
            }
        }
    }

    return $widgets;

}//end get_analytics_records()

?>
<script>
    jQuery(document).ready(function(){
        jQuery(document).on("change", "input[name='collect_analytics_data']", function(){
            var dataStatus = "off";
            if(jQuery("#collect_analytics_data").is(":checked")) {
                dataStatus = "on"
            } else {
                jQuery("#analytics-popup").show();
            }
            jQuery.ajax({
                url: "<?php echo esc_url(admin_url("admin-ajax.php")); ?>",
                data: "status="+dataStatus+"&action=cht_save_analytics_status&nonce=<?php echo esc_attr(wp_create_nonce("cht_analytics_status")) ?>",
                type: 'post'
            })
        });
        if(jQuery("#start_date").length) {
            jQuery("#start_date").datepicker({
                dateFormat: 'mm/dd/yy',
                altFormat: 'mm/dd/yy',
                maxDate: 0,
                onSelect: function(d,i){
                    var minDate = jQuery("#start_date").datepicker('getDate');
                    minDate.setDate(minDate.getDate()); //add two days
                    jQuery("#end_date").datepicker("option", "minDate", minDate);
                    if(jQuery("#end_date").val() <= jQuery("#start_date").val()) {
                        jQuery("#end_date").val(jQuery("#start_date").val());
                    }

                    if(jQuery("#end_date").val() == "") {
                        jQuery("#end_date").val(jQuery("#start_date").val());
                    }
                }
            });
        }
        if(jQuery("#end_date").length) {
            jQuery("#end_date").datepicker({
                dateFormat: 'mm/dd/yy',
                altFormat: 'mm/dd/yy',
                maxDate: 0,
                minDate: 0,
                onSelect: function(d,i){
                    if(jQuery("#start_date").val() == "") {
                        jQuery("#start_date").val(jQuery("#end_date").val());
                    }
                }
            });
        }
        if(jQuery("#start_date").length) {
            if(jQuery("#start_date").val() != "") {
                var minDate = jQuery("#start_date").datepicker('getDate');
                minDate.setDate(minDate.getDate()); //add two days
                jQuery("#end_date").datepicker("option", "minDate", minDate);
                if(jQuery("#end_date").val() <= jQuery("#start_date").val()) {
                    jQuery("#end_date").val(jQuery("#start_date").val());
                }
            }
        }
        jQuery(".custom-search-title").on("click", function(e){
            e.stopPropagation();
            jQuery(".custom-search-options").toggle();
        });

        jQuery("#search_for").on("change", function(e){
            var selValue = jQuery(this).val();
            if(selValue != "custom") {
                jQuery("#analytics_form").submit();
            } else {
                jQuery("#date_options").show();
            }
        });

        jQuery(document).on("click", ".reset-analytics-btn a", function(e){
            e.preventDefault();
            jQuery("#clear-data").show();
        });
        jQuery(document).on("click", ".popup-form-cancel-btn", function(e){
            e.preventDefault();
            jQuery(".chaty-popup-form").hide();
        });
        jQuery(document).on("click", "body, html", function(){
            jQuery(".custom-search-options").hide();
        });

    });
</script>
