<?php
global $wpdb;
$table_name = $wpdb->prefix.'chaty_contact_form_leads';

$current = isset($_GET['paged'])&&!empty($_GET['paged'])&&is_numeric($_GET['paged'])&&$_GET['paged'] > 0 ? $_GET['paged'] : 1;
$current = intval($current);

$search_for  = "all_time";
$search_list = [
    'today'        => 'Today',
    'yesterday'    => 'Yesterday',
    'last_7_days'  => 'Last 7 Days',
    'last_30_days' => 'Last 30 Days',
    'this_week'    => 'This Week',
    'this_month'   => 'This Month',
    'all_time'     => 'All Time',
    'custom'       => 'Custom Date',
];

if (isset($_GET['search_for']) && !empty($_GET['search_for']) && isset($search_list[$_GET['search_for']])) {
    $search_for = esc_attr($_GET['search_for']);
}

$start_date = "";
$end_date   = "";
if ($search_for == "today") {
    $start_date = gmdate("Y-m-d");
    $end_date   = gmdate("Y-m-d");
} else if ($search_for == "yesterday") {
    $start_date = gmdate("Y-m-d", strtotime("-1 days"));
    $end_date   = gmdate("Y-m-d", strtotime("-1 days"));
} else if ($search_for == "last_7_days") {
    $start_date = gmdate("Y-m-d", strtotime("-7 days"));
    $end_date   = gmdate("Y-m-d");
} else if ($search_for == "last_30_days") {
    $start_date = gmdate("Y-m-d", strtotime("-30 days"));
    $end_date   = gmdate("Y-m-d");
} else if ($search_for == "this_week") {
    $start_date = gmdate("Y-m-d", strtotime('monday this week'));
    $end_date   = gmdate("Y-m-d");
} else if ($search_for == "this_month") {
    $start_date = gmdate("Y-m-01");
    $end_date   = gmdate("Y-m-d");
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

$hasSearch = isset($_GET['search'])&&!empty($_GET['search']) ? $_GET['search'] : false;

$query  = "SELECT count(id) as total_records FROM ".$table_name;
$search = "";

$condition      = "";
$conditionArray = [];
if ($hasSearch !== false) {
    $search           = $hasSearch;
    $hasSearch        = "%".esc_attr($hasSearch)."%";
    $condition       .= " (name LIKE %s OR email LIKE %s OR phone_number LIKE %s OR message LIKE %s)";
    $conditionArray[] = $hasSearch;
    $conditionArray[] = $hasSearch;
    $conditionArray[] = $hasSearch;
    $conditionArray[] = $hasSearch;
}

$start_date = esc_attr($start_date);
$end_date   = esc_attr($end_date);
if (!empty($start_date) && !empty($end_date)) {
    if (!empty($condition)) {
        $condition .= " AND ";
    }

    $c_start_date     = gmdate("Y-m-d 00:00:00", strtotime($start_date));
    $c_end_date       = gmdate("Y-m-d 23:59:59", strtotime($end_date));
    $condition       .= " created_on >= %s AND created_on <= %s";
    $conditionArray[] = $c_start_date;
    $conditionArray[] = $c_end_date;
}

if (!empty($condition)) {
    $query .= " WHERE ".$condition;
}

$query .= " ORDER BY ID DESC";

if (!empty($conditionArray)) {
    $query = $wpdb->prepare($query, $conditionArray);
}

$total_records = $wpdb->get_var($query);
$per_page      = 15;
$total_pages   = ceil($total_records / $per_page);

$query = "SELECT * FROM ".$table_name;
if (!empty($condition)) {
    $query .= " WHERE ".$condition;
}

if ($current > $total_pages) {
    $current = 1;
}

$start_from = (($current - 1) * $per_page);

$query .= " ORDER BY ID DESC";
$query .= " LIMIT $start_from, $per_page";

if (!empty($conditionArray)) {
    $query = $wpdb->prepare($query, $conditionArray);
}
?>
<div class="wrap">
    <?php
    $result = $wpdb->get_results($query);
    ?>
    <div>
        <?php if ($result || !empty($search) || $search_for != 'all_time') : ?>
            <div class="flex flex-wrap justify-between pt-5">
                <a href="<?php echo esc_url( $this->getDashboardUrl() ) ?>">
                    <img class="w-32" src="<?php echo esc_url(plugins_url('../../admin/assets/images/logo-color.svg', __FILE__)); ?>" alt="Chaty" class="logo">
                </a>
                <span class="mt-3 sm:mt-0 font-primary text-3xl text-cht-gray-150"><?php esc_html_e("Contact Form Leads" ,"chaty") ?></span>
            </div>
        <?php endif; ?>

        <div class="flex flex-wrap space-y-3 md:space-y-0 justify-between items-center contact-form-leads-header mt-4 pb-2">
            <?php if ($result) : ?>
                <div class="flex items-center">
                    <select name="action" id="bulk-action-selector-top">
                        <option value=""><?php esc_html_e("Bulk Actions" ,"chaty") ?></option>
                        <option value="delete_message"><?php esc_html_e("Delete" ,"chaty") ?></option>
                    </select>
                    <input type="submit" id="doaction" class="action btn cursor-pointer" value="<?php esc_html_e("Apply", "chaty") ?>" >
                </div>
            <?php endif; ?>

            <?php if ($result || !empty($search) || $search_for != 'all_time') : ?>
                <form class="flex items-center flex-wrap gap-3" action="<?php echo esc_url(admin_url("admin.php")) ?>" method="get">
                    <label class="screen-reader-text" for="post-search-input">Search:</label>
                    <select class="search-input mr-5" name="search_for" id="date-range">
                        <?php foreach ($search_list as $key => $value) { ?>
                            <option <?php selected($key, $search_for) ?> value="<?php echo esc_attr($key) ?>"><?php echo esc_attr($value) ?></option>
                        <?php } ?>
                    </select>
                    <input type="search" class="search-input mr-5" name="search" value="<?php echo esc_attr($search) ?>" class="">
                    <div class="date-range <?php echo ($search_for == "custom" ? "active" : "") ?>">
                        <input type="search" class="search-input mr-5" name="start_date" id="start_date" value="<?php echo esc_attr($start_date) ?>" autocomplete="off" placeholder="<?php esc_html_e("Start date" ,"chaty") ?>">
                        <input type="search" class="search-input" name="end_date" id="end_date" value="<?php echo esc_attr($end_date) ?>" autocomplete="off" placeholder="<?php esc_html_e("End date" ,"chaty") ?>">
                    </div>
                    <input type="submit" id="search-submit" class="cursor-pointer btn" value="Search">
                    <input type="hidden" name="page" value="chaty-contact-form-feed" />

                </form>
            <?php endif; ?>
        </div>

        <form action="" method="post" class="responsive-table contact-form-lead">
            <?php
            if ($result) {
                ?>
                <table id="contact-feed" class="border-separate w-full rounded-lg border border-cht-gray-50 mb-5"  border="0" cellspacing="0" cellpadding="0">
                    <thead>
                        <tr>
                            <th class="rounded-tl-lg text-cht-gray-150 text-sm font-semibold font-primary py-3 px-2 bg-cht-primary-50" style="width:1%"><?php esc_html_e('Bulk', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('ID', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('Widget Name', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('Name', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('Email', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('Phone number', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('Message', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('Custom fields', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('IP Address', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('Date', 'chaty');?></th>
                            <th class="text-center text-cht-gray-150 text-sm font-semibold font-primary py-3 px-5 bg-cht-primary-50"><?php esc_html_e('URL', 'chaty');?></th>
                            <th class="rounded-tr-lg text-cht-gray-150 text-sm font-semibold font-primary py-3 px-2 bg-cht-primary-50"><?php esc_html_e('Delete', 'chaty');?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                            foreach ($result as $res) {
                                if ($res->widget_id == 0) {
                                    $widget_name = "Default";
                                    $socialIcons = get_option('cht_social_Contact_Us');
                                } else {
                                    $widget_name = get_option("cht_widget_title_".$res->widget_id);
                                    if (empty($widget_name)) {
                                        $widget_name = "Widget #".($res->widget_id + 1);
                                    }
                                    $socialIcons = get_option('cht_social_'.$res->widget_id.'_Contact_Us');
                                }
                                ?>
                                <tr data-id="<?php echo esc_attr($res->id)?>">
                                    <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r">
                                        <div class="checkbox">
                                            <label for="checkbox_<?php echo esc_attr($res->id) ?>" class="chaty-checkbox text-cht-gray-150 text-base flex items-center">
                                                <input 
                                                    class="sr-only" 
                                                    type="checkbox" 
                                                    id="checkbox_<?php echo esc_attr($res->id) ?>" 
                                                    name="chaty_leads[]" 
                                                    value="<?php echo esc_attr($res->id) ?>" 
                                                />
                                                <span></span>
                                            </label>
                                        </div>
                                    </td>
                                    <td 
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('ID', 'chaty');?>">
                                            <?php echo esc_attr($res->id) ?>
                                    </td>
                                    <td 
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('Widget Name', 'chaty');?>">
                                            <?php echo esc_attr(stripslashes($widget_name)) ?>
                                    </td>
                                    <td 
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('Name', 'chaty');?>">
                                            <?php
                                                if(!empty($res->name)) {
                                                    echo esc_attr(stripslashes($res->name));
                                                }
                                            ?>
                                    </td>
                                    <td 
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('Email', 'chaty');?>">
                                            <?php echo esc_attr(stripslashes($res->email)) ?>
                                    </td>
                                    <td 
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('Phone number', 'chaty');?>">
                                            <?php
                                                if(!empty($res->phone_number)) {
                                                    echo esc_attr(stripslashes($res->phone_number));
                                                }
                                            ?>
                                    </td>
                                    <td 
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('Message', 'chaty');?>">
                                            <?php echo nl2br(esc_attr(stripslashes($res->message))) ?>
                                    </td>
                                    <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t">
                                        <span class="custom-field-details" data-id="<?php echo esc_attr($res->widget_id); ?>">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M15.5 15H4.5M15.5 11H4.5M1 7H19M5.8 1H14.2C15.8802 1 16.7202 1 17.362 1.32698C17.9265 1.6146 18.3854 2.07354 18.673 2.63803C19 3.27976 19 4.11984 19 5.8V14.2C19 15.8802 19 16.7202 18.673 17.362C18.3854 17.9265 17.9265 18.3854 17.362 18.673C16.7202 19 15.8802 19 14.2 19H5.8C4.11984 19 3.27976 19 2.63803 18.673C2.07354 18.3854 1.6146 17.9265 1.32698 17.362C1 16.7202 1 15.8802 1 14.2V5.8C1 4.11984 1 3.27976 1.32698 2.63803C1.6146 2.07354 2.07354 1.6146 2.63803 1.32698C3.27976 1 4.11984 1 5.8 1Z" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </svg>
                                        </span>
                                        <div class="chaty-ajax-loader" style="display: none"></div>
                                    </td>
                                    <td
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('IP Address', 'chaty');?>">
                                        <?php echo esc_attr(stripslashes($res->ip_address)); ?>
                                    </td>
                                    <td 
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('Date', 'chaty');?>">
                                            <?php echo esc_attr($res->created_on) ?>
                                    </td>
                                    <td 
                                        class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center border-r border-t"
                                        data-title="<?php esc_html_e('URL', 'chaty');?>">
                                            <a class="url" target="_blank" href="<?php echo esc_url($res->ref_page) ?>">
                                                <span class="dashicons dashicons-external"></span>
                                            </a>
                                    </td>
                                    <td class="bg-white py-3.5 px-5 text-cht-gray-150 font-primary text-sm text-center"><a class="remove-record" href="#"><span class="dashicons dashicons-trash"></span></a></td>
                                </tr>
                            <?php }//end foreach
                        ?>
                    </tbody>
                </table>
                <?php
                if ($total_pages > 1) {
                    $baseURL = admin_url("admin.php?paged=%#%&page=chaty-contact-form-feed");
                    if (!empty($search)) {
                        $baseURL .= "&search=".$search;
                    }

                    echo '<div class="custom-pagination">';
                        echo paginate_links(
                            [
                                'base'         => $baseURL,
                                'total'        => $total_pages,
                                'current'      => $current,
                                'format'       => '?paged=%#%',
                                'show_all'     => false,
                                'type'         => 'list',
                                'end_size'     => 3,
                                'mid_size'     => 1,
                                'prev_next'    => true,
                                'prev_text'    => sprintf('%1$s', '<span class="dashicons dashicons-arrow-left-alt2"></span>'),
                                'next_text'    => sprintf('%1$s', '<span class="dashicons dashicons-arrow-right-alt2"></span>'),
                                'add_args'     => false,
                                'add_fragment' => '',
                            ]
                        );
                    echo "</div>";
                }//end if
                ?>
                <div class="leads-buttons flex items-center gap-3 flex-wrap">
                    <a href="<?php echo esc_url(admin_url("?download_chaty_file=chaty_contact_leads&nonce=".wp_create_nonce("download_chaty_contact_leads"))) ?>" class="btn rounded-lg inline-block" id="wpappp_export_to_csv" value="Export to CSV"><?php esc_html_e("Download & Export to CSV", "chaty") ?></a>
                    <input type="button" class="inline-block cursor-pointer rounded-lg bg-transparent border-red-500 text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-500 btn btn-primary" id="chaty_delete_all_leads" value="<?php esc_html_e("Delete All Data", "chaty") ?>" />
                </div>
            <?php } else if (!empty($search) || $search_for != "all_time") { ?>
                <div class="chaty-updates-form pt-7">
                    <div class="testimonial-error-message max-w-screen-sm font-primary mx-auto">
                        <p class="px-5 text-2xl text-center"><?php esc_html_e("No records are found", "chaty") ?></p>
                    </div>
                </div>
            <?php } else { ?>
                <div class="container">
                    <div class="chaty-table no-widgets py-20 bg-cover rounded-lg border border-cht-gray-50">
                        
                        <img class="mx-auto w-60" src="<?php echo esc_url(CHT_PLUGIN_URL) ?>/admin/assets/images/stars-image.png" />
                
                        <div class="text-center">
                            <div class="update-title text-cht-gray-150 text-3xl sm:text-4xl pb-5"><?php esc_html_e("Contact Form Leads", "chaty") ?></div>
                            <p class="font-primary text-base text-cht-gray-150 -mt-2 max-w-screen-sm px-5 mx-auto">
                            <?php esc_html_e("Your contact form leads will appear here once you get some leads. Please make sure you've added the contact form channel to your Chaty channels in order to collect leads", "chaty") ?>
                            </p>
                        </div>
                    </div>
                </div>
                
            <?php }//end if
            ?>
            <input type="hidden" name="remove_chaty_leads" value="<?php echo esc_attr(wp_create_nonce("remove_chaty_leads")) ?>">
            <input type="hidden" name="paged" value="<?php echo esc_attr($current) ?>">
            <input type="hidden" name="search" value="<?php echo esc_attr($search) ?>">
        </form>
    </div>
</div>

<div class="chaty-popup" id="contact_form_custom_field">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-chaty-popup-btn right-2 top-2 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"></path></svg>
                </a>
            </div>
            <div class="a-card a-card--normal custom-field-box">
                <div class="chaty-popup-header text-left font-primary text-cht-gray-150 font-medium p-5 relative">
                    <?php esc_html_e("Custom field", "chaty") ?>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    jQuery(document).ready(function(){

        var selectedURL = '<?php echo esc_url(admin_url())."admin.php?page=chaty-contact-form-feed&remove_chaty_leads=".wp_create_nonce("remove_chaty_leads")."&action=delete_message&paged={$current}&search=".esc_attr($search)."&chaty_leads=" ?>';
        jQuery(document).on("click", ".remove-record", function(e){
            e.preventDefault();
            var redirectRemoveURL = selectedURL+jQuery(this).closest("tr").data("id");
            if(confirm("<?php esc_html_e("Are you sure you want to delete Record with ID#", "chaty") ?> "+jQuery(this).closest("tr").data("id"))) {
                window.location = redirectRemoveURL;
            }
        });
        jQuery(document).on("click", "#chaty_delete_all_leads", function(e){
            e.preventDefault();
            var redirectRemoveURL = selectedURL+"remove-all";
            if(confirm("<?php esc_html_e("Are you sure you want to delete all Record from the database?", "chaty") ?>")) {
                window.location = redirectRemoveURL;
            }
        });
        jQuery(document).on("click", "#doaction", function(e){
            if(jQuery("#bulk-action-selector-top").val() == "delete_message") {
                if(jQuery("#contact-feed input:checked").length) {

                    var selectedIds = [];
                    jQuery("#contact-feed input:checked").each(function(){
                        selectedIds.push(jQuery(this).val());
                    });
                    if(selectedIds.length) {
                        selectedIds = selectedIds.join(",");
                        var redirectRemoveURL = selectedURL+selectedIds;
                        if(confirm("<?php esc_html_e("Are you sure you want to delete selected records?", "chaty") ?>")) {
                            window.location = redirectRemoveURL;
                        }
                    }
                }
            }
        });
        jQuery("#date-range").on("change", function(){
            if(jQuery(this).val() == "custom") {
                jQuery(".date-range").addClass("active");
            } else {
                jQuery(".date-range").removeClass("active");
            }
        });
        if(jQuery("#start_date").length) {
            jQuery("#start_date").datepicker({
                dateFormat: 'yy-mm-dd',
                altFormat: 'yy-mm-dd',
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
                dateFormat: 'yy-mm-dd',
                altFormat: 'yy-mm-dd',
                maxDate: 0,
                minDate: 0,
                onSelect: function(d,i){
                    if(jQuery("#start_date").val() == "") {
                        jQuery("#start_date").val(jQuery("#end_date").val());
                    }
                }
            });
        }

        jQuery(document).on("click", ".custom-field-details", function (){
            jQuery(this).closest("td").find(".chaty-ajax-loader").show();
            jQuery(this).hide();
            jQuery.ajax({
               url: '<?php echo esc_url(admin_url("admin-ajax.php")) ?>',
               data: {
                   action: 'fetch_custom_field',
                   nonce: '<?php echo esc_attr(wp_create_nonce("fetch_custom_field_detail")) ?>',
                   widget_id: jQuery(this).closest("tr").data("id")
               },
                type: 'post',
                dataType: 'json',
                success: function (responseText) {
                    jQuery("#contact_form_custom_field").show();
                    jQuery(".chaty-ajax-loader").hide();
                    jQuery(".custom-field-details").show();
                    jQuery(".custom-field-form").remove();
                    jQuery(".no-field").remove();
                    if(responseText.status == 1) {
                        if(responseText.field_html == "") {
                            jQuery(".custom-field-box").append("<div class='no-field'>No record found</div>");
                        } else {
                            jQuery(".custom-field-box").append(responseText.field_html);
                        }
                    }
                }
            });
        });

        jQuery(document).on("click", ".close-chaty-popup-btn, .chaty-popup-outer", function (){
            jQuery(".chaty-popup").hide();
        });

    });
</script>
