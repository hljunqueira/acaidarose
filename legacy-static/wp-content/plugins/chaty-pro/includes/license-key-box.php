<?php if (! defined('ABSPATH')) {
    exit;
} ?>
<?php
class Chaty_license_key_box
{

    public $plugin_name = "Chaty";

    public $plugin_slug = "chaty";


    public function __construct()
    {

        add_action("wp_ajax_".$this->plugin_slug."_license_key_box", [$this, "form_license_key_box"]);

        add_action('admin_notices', [$this, 'admin_notices']);

    }//end __construct()


    public function form_license_key_box()
    {
        if (current_user_can('manage_options')) {
            $nonce = filter_input(INPUT_POST, 'nonce');
            $days  = filter_input(INPUT_POST, 'days');
            if (!empty($nonce) && wp_verify_nonce($nonce, $this->plugin_slug."_license_key_box")) {
                if ($days == -1) {
                    add_option($this->plugin_slug."_hide_license_key_box", "1");
                } else {
                    $date = gmdate("Y-m-d", strtotime("+".$days." days"));
                    update_option($this->plugin_slug."_show_license_key_box_after", $date);
                }
            }

            die;
        }

    }//end form_license_key_box()


    public function admin_notices()
    {
        if (current_user_can('manage_options')) {
            $licenseKey = get_option("cht_token");
            if (empty($licenseKey)) {
                return;
            }

            $license_data = get_transient("cht_token_data");
            if (!empty($license_data)) {
                if (isset($license_data['license']) && $license_data['license'] == "valid") {
                    if ($license_data['expires'] == "lifetime") {
                        return;
                    }

                    $date = gmdate("Y-m-d", strtotime("+30 days"))." 23:59:59";
                    if ($date < $license_data['expires']) {
                        return;
                    }
                } else if (!isset($license_data['license']) || $license_data['license'] != 'expired') {
                    return;
                }
            } else {
                return;
            }

            $is_hidden = get_option($this->plugin_slug."_hide_license_key_box");
            if ($is_hidden !== false) {
                return;
            }

            $date_to_show = get_option($this->plugin_slug."_show_license_key_box_after");
            if ($date_to_show !== false) {
                $current_date = gmdate("Y-m-d");
                if ($current_date < $date_to_show) {
                    return;
                }
            }

            $renewal_link = CHT_CHATY_PLUGIN_URL."checkout/?edd_license_key=".$licenseKey."&download_id=".CHT_CHATY_PLUGIN_ID;
            ?>
            <style>
                .<?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box p a.close-license-notification {
                    display: inline-block;
                    float: right;
                    text-decoration: none;
                    color: #999999;
                    position: absolute;
                    right: 12px;
                    top: 12px;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box p a:hover, .<?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box p a:focus {
                    color: #333333;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box .button span {
                    display: inline-block;
                    line-height: 27px;
                    font-size: 16px;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-popup {
                    position: fixed;
                    width: 100%;
                    height: 100%;
                    z-index: 10001;
                    background: rgba(0, 0, 0, 0.65);
                    top: 0;
                    left: 0;
                    display: none;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-popup-content {
                    background: #ffffff;
                    padding: 20px;
                    position: absolute;
                    max-width: 450px;
                    width: 100%;
                    margin: 0 auto;
                    top: 45%;
                    left: 0;
                    right: 0;
                    -webkit-border-radius: 5px;
                    -moz-border-radius: 5px;
                    border-radius: 5px;
                :;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-title {
                    padding: 0 0 10px 0;
                    font-weight: bold;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-options a {
                    display: block;
                    margin: 5px 0 5px 0;
                    color: #333;
                    text-decoration: none;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-options a.dismiss {
                    color: #999;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-options a:hover, .affiliate-options a:focus {
                    color: #0073aa;
                }

                button.<?php echo esc_attr($this->plugin_slug) ?>-close-license-key-box-popup {
                    position: absolute;
                    top: 5px;
                    right: 0;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                }

                a.button.button-primary.<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-btn {
                    font-size: 14px;
                    background: #F51366;
                    color: #fff;
                    border: solid 1px #F51366;
                    border-radius: 3px;
                    line-height: 24px;
                    -webkit-box-shadow: 0 3px 5px -3px #333333;
                    -moz-box-shadow: 0 3px 5px -3px #333333;
                    box-shadow: 0 3px 5px -3px #333333;
                    text-shadow: none;
                }

                .notice.notice-info.premio-notice {
                    position: relative;
                    padding: 1px 30px 1px 12px;
                }

                .notice.notice-info.premio-notice ul li {
                    margin: 0;
                }

                .license-key-box-default {
                    padding: 0 0 10px 0;
                }
                .<?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box p {
                    display: inline-block;
                    line-height: 30px;
                    vertical-align: middle;
                    padding: 0 10px 0 0;
                }

                .<?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box p img {
                    width: 30px;
                    height: 30px;
                    display: inline-block;
                    margin: 0 10px;
                    vertical-align: middle;
                    border-radius: 15px;
                }
                .<?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box ul {
                    margin: 0 0 10px 0;
                    padding: 0;
                }
            </style>
            <div
                class="notice notice-info premio-notice <?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box <?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box">
                <div class="license-key-box-default" id="default-license-key-box-<?php echo esc_attr($this->plugin_slug)  ?>">
                    <p>
                        <?php if (isset($license_data['license']) && $license_data['license'] == 'expired') { ?>
                            Your <?php echo esc_attr($this->plugin_name) ?> license key has expired. <a href="<?php echo esc_url($renewal_link) ?>" target="_blank"><b>Renew now</b></a> to enjoy our powerful feature updates.
                        <?php } else if (isset($license_data['license']) && $license_data['license'] == "valid") {
                            $diff    = (strtotime(gmdate("Y-m-d 23:59:59")) - strtotime($license_data['expires']));
                            $days    = abs(round($diff / 86400));
                            $message = "in ".$days." days";
                            if ($days == 1) {
                                $message = "in 1 day";
                            } else if ($days == 0) {
                                $message = "today";
                            }
                            ?>
                            Your <?php echo esc_attr($this->plugin_name) ?> license key is about to expire <?php echo esc_attr($message) ?>. <a href="<?php echo esc_url($renewal_link) ?>" target="_blank"><b>Renew now</b></a> to enjoy our powerful feature updates.
                        <?php } ?>
                        <a href="javascript:;" class="dismiss-btn close-license-notification <?php echo esc_attr($this->plugin_slug) ?>-premio-review-dismiss-btn"><span class="dashicons dashicons-no-alt"></span></a>
                    </p>

                    <div class="clear clearfix"></div>
                    <a class="<?php echo esc_attr($this->plugin_slug) ?>-premio-license-key-box-future-btn button button-primary" href="javascript:;">Dismiss</a>
                </div>
            </div>
            <div class="<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-popup">
                <div class="<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-popup-content">
                    <button class="<?php echo esc_attr($this->plugin_slug) ?>-close-license-key-box-popup"><span class="dashicons dashicons-no-alt"></span></button>
                    <div class="<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-title">Would you like us to remind you about this later? </div>
                    <div class="<?php echo esc_attr($this->plugin_slug) ?>-license-key-box-options">
                        <a href="javascript:;" data-days="3">Remind me in 3 days</a>
                        <a href="javascript:;" data-days="10">Remind me in 10 days</a>
                        <a href="javascript:;" data-days="-1" class="dismiss">Don't remind me about this</a>
                    </div>
                </div>
            </div>
            <script>
                jQuery(document).ready(function () {
                    jQuery("body").addClass("has-premio-box");
                    jQuery(document).on("click", ".<?php echo esc_attr($this->plugin_slug)  ?>-premio-review-dismiss-btn, .<?php echo esc_attr($this->plugin_slug)  ?>-premio-license-key-box-future-btn", function () {
                        jQuery(".<?php echo esc_attr($this->plugin_slug)  ?>-license-key-box-popup").show();
                    });
                    jQuery(document).on("click", ".<?php echo esc_attr($this->plugin_slug)  ?>-close-license-key-box-popup", function () {
                        jQuery(".<?php echo esc_attr($this->plugin_slug)  ?>-license-key-box-popup").hide();
                    });
                    jQuery(document).on("click", ".<?php echo esc_attr($this->plugin_slug)  ?>-close-thanks-btn", function () {
                        jQuery(".<?php echo esc_attr($this->plugin_slug)  ?>-license-key-box-popup").remove();
                        jQuery(".<?php echo esc_attr($this->plugin_slug)  ?>-premio-license-key-box").remove();
                    });
                    jQuery(document).on("click", ".<?php echo esc_attr($this->plugin_slug)  ?>-premio-license-key-box-hide-btn", function () {
                        jQuery("#default-license-key-box-<?php echo esc_attr($this->plugin_slug)  ?>").hide();
                        jQuery("#review-thanks-<?php echo esc_attr($this->plugin_slug)  ?>").show();
                        jQuery.ajax({
                            url: "<?php echo esc_url(admin_url("admin-ajax.php")) ?>",
                            data: "action=<?php echo esc_attr($this->plugin_slug) ?>_license_key_box&days=-1&nonce=<?php echo esc_attr(wp_create_nonce($this->plugin_slug."_license_key_box")) ?>",
                            type: "post",
                            success: function () {

                            }
                        });
                    });
                    jQuery(document).on("click", ".<?php echo esc_attr($this->plugin_slug)  ?>-license-key-box-options a", function () {
                        var dataDays = jQuery(this).attr("data-days");
                        jQuery(".<?php echo esc_attr($this->plugin_slug)  ?>-license-key-box-popup").remove();
                        jQuery(".<?php echo esc_attr($this->plugin_slug)  ?>-premio-license-key-box").remove();
                        jQuery("body").removeClass("has-premio-box");
                        jQuery.ajax({
                            url: "<?php echo esc_url(admin_url("admin-ajax.php")) ?>",
                            data: "action=<?php echo esc_attr($this->plugin_slug) ?>_license_key_box&days=" + dataDays + "&nonce=<?php echo esc_attr(wp_create_nonce($this->plugin_slug."_license_key_box")) ?>",
                            type: "post",
                            success: function () {
                                jQuery(".<?php echo esc_attr($this->plugin_slug)  ?>-license-key-box-popup").remove();
                                jQuery(".<?php echo esc_attr($this->plugin_slug)  ?>-premio-license-key-box").remove();
                            }
                        });
                    });
                });
            </script>
            <?php
        }//end if

    }//end admin_notices()


}//end class

$Chaty_license_key_box = new Chaty_license_key_box();
