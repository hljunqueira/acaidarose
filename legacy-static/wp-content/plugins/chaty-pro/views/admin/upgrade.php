<?php
if (!defined('ABSPATH')) {
    exit;
}
$allowedTags = array(
    'span'       => array(
        'class'   => array(),
        'style'  => array(),
    )
);
?>
<div class="container">

    <div class="flex items-center justify-between py-5">
        <a href="<?php echo esc_url( $this->getDashboardUrl() ) ?>">
            <img src="<?php echo esc_url(plugins_url('../../admin/assets/images/logo-color.svg', __FILE__)); ?>" alt="Chaty" class="logo" />
        </a>
        <div>
            <?php if($planStatus != "yes") { ?>
                <?php if(isset($_GET['screen']) && $_GET['screen'] == "deactivate") { ?>
                    <a class="get-license-key manage-plan-button" href="<?php echo esc_url(admin_url("admin.php?page=chaty-app-upgrade")) ?>">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" tabindex="-1">
                            <path d="M0 0h20v20H0z"></path>
                            <rect x="7" y="3" width="6" height="14" rx="1" stroke="#b78deb" class="stroke" stroke-width="1.67"></rect>
                            <path d="M13 7a1 1 0 011-1h3a1 1 0 011 1v9a1 1 0 01-1 1h-4V7zM7 7a1 1 0 00-1-1H3a1 1 0 00-1 1v9a1 1 0 001 1h4V7z" class="stroke" stroke="#b78deb" stroke-width="1.67"></path>
                        </svg>
                        <?php esc_html_e("Manage your plan", "chaty"); ?>
                        <?php esc_html_e("Manage your plan", "chaty"); ?>
                    </a>
                <?php } else { ?>
                    <a href="https://premio.io/downloads/chaty/" target="_blank"
                       class="text-cht-primary border border-solid border-cht-primary px-5 py-2.5 text-base rounded-lg flex items-center space-x-2 transition duration-200 hover:text-white hover:bg-cht-primary hover:drop-shadow-3xl">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M11.9169 5.25008L14.8336 2.33341M16.5002 0.666748L14.8336 2.33341L16.5002 0.666748ZM8.4919 8.67508C8.92218 9.09964 9.26423 9.60511 9.49836 10.1624C9.73248 10.7197 9.85406 11.3178 9.85609 11.9223C9.85811 12.5267 9.74054 13.1257 9.51016 13.6845C9.27977 14.2434 8.94111 14.7511 8.51368 15.1785C8.08625 15.606 7.5785 15.9446 7.01965 16.175C6.4608 16.4054 5.8619 16.523 5.25742 16.5209C4.65295 16.5189 4.05485 16.3973 3.49755 16.1632C2.94026 15.9291 2.43478 15.587 2.01023 15.1568C1.17534 14.2923 0.713363 13.1346 0.723806 11.9328C0.734249 10.7311 1.21627 9.58153 2.06606 8.73175C2.91585 7.88196 4.0654 7.39994 5.26714 7.38949C6.46888 7.37905 7.62664 7.84102 8.49106 8.67592L8.4919 8.67508ZM8.4919 8.67508L11.9169 5.25008L8.4919 8.67508ZM11.9169 5.25008L14.4169 7.75008L17.3336 4.83342L14.8336 2.33341L11.9169 5.25008Z" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span><?php esc_html_e('Get License Key', 'chaty'); ?></span>
                    </a>
                <?php } ?>
            <?php } ?>
        </div>
    </div>


    <div class="mt-3" id="upgrade-modal">
        <div class="easy-modal-inner flex items-center shadow-lg shadow-cht-gray-150/10 rounded-lg bg-white py-14 md:py-0">
                <div class="px-5 xl:px-20 flex-1">
                    <div class="wrap m-0">
                    <?php
                    $class_name = "";
                    $message    = "";
                    $m          = filter_input(INPUT_GET, 'm');
                    if (isset($m) && !empty($m)) {
                        switch ($m) {
                        case "error":
                            $class_name = "error";
                            $message    = esc_attr__("Your license key is not valid", 'chaty');
                            break;
                        case "valid":
                            $class_name = "success";
                            $message    = esc_attr__("Your license key is activated successfully", 'chaty');
                            break;
                        case "unactivated":
                            $class_name = "success";
                            $message    = esc_attr__("Your license key is deactivated successfully", 'chaty');
                            break;
                        case "expired":
                            $class_name = "error";
                            $message    = esc_attr__("Your license has been expired", 'chaty');
                            break;
                        case "invalid":
                            $class_name = "error";
                            $message    = "<span class='dashicons dashicons-no-alt bg-[#FF424D] rounded-full text-white'></span> <span>".sprintf(esc_html__("Your license is invalid. Please get a %1\$s to activate the product", "chaty"), "<a href='https://premio.io/downloads/chaty/' class='underline' target='_blank'>".esc_html__("valid license", "chaty")."</a>")."</span>";
                            break;
                        case "no_activations":
                            $class_name = "error";
                            $message    = "<span class='dashicons dashicons-no-alt bg-[#FF424D] rounded-full text-white'></span> <span>".sprintf(esc_html__("Your license was activated for another domain, please visit your %1\$s", "chaty"), "<a href='https://premio.io/downloads/chaty/' class='underline' target='_blank'>".esc_html__("Premio account", "chaty")."</a>")."</span>";
                            break;
                        }//end switch
                        ?>

                    <?php }//end if
                    ?>
                        <form action="" method="post" id="license_action_form" class="max-w-screen-sm mx-auto text-center">
                            <?php
                            delete_transient("cht_token_data");
                            $licenseKey      = get_option("cht_token");
                            $licenseData     = $this->getLicenseKeyInformation($licenseKey);
                            $isLicenseActive = 0;
                            if (!empty($licenseData)) {
                                if ($licenseData['license'] == "site_inactive") {
                                    $licenseKey = "";
                                    delete_option("cht_token");
                                } else if ($licenseData['license'] == "valid") {
                                    $isLicenseActive = 1;
                                } else if ($licenseData['license'] == "expired") {
                                    $isLicenseActive = 2;
                                }
                            }

                            $newVersion    = "";
                            $encLicenseKey = $licenseKey;
                            if (!empty($licenseKey)) {
                                $encLicenseKey = substr_replace($licenseKey, "**************", 6, 20);
                            }
                            ?>
                            <div>
                                <div class="font-primary text-2xl md:text-3xl text-cht-gray-150 mb-4">
                                    <?php esc_html_e("Enter Your License Key", 'chaty') ?>
                                </div>

                                <div class="font-primary text-base text-cht-gray-150 pb-6 mx-auto">
                                    <?php
                                    if (!$isLicenseActive) {
                                        esc_html_e("To receive updates, please enter your valid Software Licensing license key.", 'chaty');
                                    } else if ($isLicenseActive == 1 && $licenseData['expires'] == "lifetime") {
                                        esc_html_e("You have a lifetime license", 'chaty');
                                    } else if ($isLicenseActive == 1) {
                                        echo sprintf(esc_html__("Your license will expire on %1\$s", "chaty"), esc_attr(gmdate("d M, Y", strtotime($licenseData['expires']))));
                                    } else if ($isLicenseActive == 2) {
                                        ?> <span class='error-message'> <?php
                                            echo sprintf(esc_html__("Your license has been expired on %1\$s", "chaty"), esc_attr(gmdate("d M, Y", strtotime($licenseData['expires']))));
                                        ?> </span> <?php
                                    }
                                    ?>
                                </div>

                                <div class='mb-5 items-start space-x-2 testimonial-<?php echo esc_attr($class_name) ?>-message'>
                                    <?php echo wp_kses($message, $allowedTags); ?>
                                </div>
                            </div>

                            <div class="license-key-content">
                                <?php if (!empty($licenseKey)) { ?>
                                <input type="text" class="py-[13px_!important] text-base" value="<?php echo esc_attr($encLicenseKey) ?>" disabled>
                                <input type="hidden" value="" name="license_key">
                                <?php } else { ?>
                                <input class="py-[13px_!important] text-base" type="text" placeholder="Type your key" value="<?php echo esc_attr($licenseKey) ?>" name="license_key">
                                <?php } ?>
                                <div class="license-key-message">
                                    <?php if (!empty($licenseKey)) { ?>
                                    <button type="submit"
                                        class="btn text-base bg-cht-red/90 hover:bg-cht-red py-4 justify-center rounded-lg mt-5 w-full font-semibold font-primary border-cht-red shadow-2xl shadow-cht-red/60 remove-testimonial-license-key flex items-center">
                                        <img style="filter: brightness(0.5)" class="mr-2 hidden spinner-loading" src="<?php echo esc_url(plugins_url('../../admin/assets/images/spinner.gif', __FILE__)); ?>" alt="Spinner">
                                        <?php esc_html_e("Deactivate License", 'chaty') ?>
                                    </button>
                                    <?php } ?>
                                    <input type="hidden" name="action" value="activate_deactivate_chaty_license_key">
                                    <input type="hidden" id="license_action_type" name="chaty_license_action" value="">
                                </div>
                            </div>
                            <?php if (empty($licenseKey)) { ?>
                                <button type="submit" id="submit" class="btn text-base py-4 justify-center rounded-lg mt-5 w-full font-semibold font-primary drop-shadow-3xl save-testimonial-license-key flex items-center mx-auto">
                                    <img style="filter: brightness(0.5)" class="mr-2 hidden spinner-loading" src="<?php echo esc_url(plugins_url('../../admin/assets/images/spinner.gif', __FILE__)); ?>" alt="Spinner">
                                    <?php esc_html_e("Activate", 'chaty') ?>
                                </button>
                            <?php } ?>
                            <?php if ($isLicenseActive == 2) { ?>
                                <a target="_blank" href="<?php echo esc_url(CHT_CHATY_PLUGIN_URL."/checkout/?edd_license_key=".$licenseKey."&download_id=".CHT_CHATY_PLUGIN_ID) ?>" class="button button-primary renew-form-btn"><?php esc_html_e("Renew Now", 'chaty') ?></a>
                            <?php } ?>
                            <input type="hidden" name="activate_token" value="<?php echo esc_attr(wp_create_nonce("chaty_activate_nonce")) ?>">
                            <input type="hidden" name="deactivate_token" value="<?php echo esc_attr(wp_create_nonce("chaty_deactivate_nonce")) ?>">
                        </form>
                    </div>
                </div>
                <!-- right content -->
                <div class="hidden md:inline-block w-[480px] mt-5">
                    <img src="<?php echo esc_url(plugins_url('../../admin/assets/images/license-image.png', __FILE__)); ?>" alt="Chaty" class="logo">
                </div>
            </div>
        </div>
    </div>
</div>
<script>
jQuery(document).ready(function($) {

    const $form_type = $("#license_action_type");
    const $form = $("#license_action_form");
    const $activeBtn = $(".save-testimonial-license-key");
    const $removeBtn = $(".remove-testimonial-license-key");

    $form.submit(function() {
        return false;
    });

    $activeBtn.on("click", function() {
        const $target = $(this);
        $form_type.val("save");
        $target.attr("disabled", true);
        submitChatyLicenceForm($target);
    });

    $removeBtn.on("click", function() {
        const $target = $(this);
        $form_type.val("remove");
        $target.attr("disabled", true);
        submitChatyLicenceForm($target);
    });


    function submitChatyLicenceForm($element) {
        // add spinner to the button
        $element.find('.spinner-loading').removeClass('hidden');

        //send request to server
        const formData = $("#license_action_form").serialize();
        $.ajax({
            url: "<?php echo esc_url(admin_url('admin-ajax.php')); ?>",
            data: formData,
            type: "post",
            success: function(response) {
                response = response.slice(0, -1);
                window.location = "<?php echo esc_url(admin_url("admin.php?page=chaty-app-upgrade&m=")) ?>" +
                    response;
            }
        })
    }

});
</script>
