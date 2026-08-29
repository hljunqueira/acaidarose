<?php
if (!defined('ABSPATH')) {
    exit;
}

// echo $widget_index = $this->widget_index; die;
if (isset($_GET['copy-from']) && is_numeric($_GET['copy-from']) && $_GET['copy-from'] >= 0) {
    if ($_GET['copy-from'] == 0) {
        $this->widget_index = "";
    } else {
        $this->widget_index = "_".$_GET['copy-from'];
    }
}

$is_pro    = $this->is_pro();
$cht_token = get_option("cht_token");
$pro_class = (!$is_pro && $cht_token != '') ? 'none_pro' : '';
?>
<div class="container <?php echo esc_attr($pro_class) ?>" dir="ltr" id="chaty-container">
    <main class="main">
        <svg class="sr-only" aria-hidden="true" width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="linear-gradient" x1="0.892" y1="0.192" x2="0.128" y2="0.85" gradientUnits="objectBoundingBox">
                    <stop offset="0" stop-color="#4a64d5"></stop>
                    <stop offset="0.322" stop-color="#9737bd"></stop>
                    <stop offset="0.636" stop-color="#f15540"></stop>
                    <stop offset="1" stop-color="#fecc69"></stop>
                </linearGradient>
            </defs>
            <circle class="color-element" cx="19.5" cy="19.5" r="19.5" fill="url(#linear-gradient)"></circle>
            <path id="Path_1923" data-name="Path 1923" d="M13.177,0H5.022A5.028,5.028,0,0,0,0,5.022v8.155A5.028,5.028,0,0,0,5.022,18.2h8.155A5.028,5.028,0,0,0,18.2,13.177V5.022A5.028,5.028,0,0,0,13.177,0Zm3.408,13.177a3.412,3.412,0,0,1-3.408,3.408H5.022a3.411,3.411,0,0,1-3.408-3.408V5.022A3.412,3.412,0,0,1,5.022,1.615h8.155a3.412,3.412,0,0,1,3.408,3.408v8.155Z" transform="translate(10 10.4)" fill="#fff"></path>
            <path id="Path_1924" data-name="Path 1924" d="M45.658,40.97a4.689,4.689,0,1,0,4.69,4.69A4.695,4.695,0,0,0,45.658,40.97Zm0,7.764a3.075,3.075,0,1,1,3.075-3.075A3.078,3.078,0,0,1,45.658,48.734Z" transform="translate(-26.558 -26.159)" fill="#fff"></path>
            <path id="Path_1925" data-name="Path 1925" d="M120.105,28.251a1.183,1.183,0,1,0,.838.347A1.189,1.189,0,0,0,120.105,28.251Z" transform="translate(-96.119 -14.809)" fill="#fff"></path>
        </svg>
        <svg aria-hidden="true" class="ico_d sr-only" width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(0deg);"> <defs> <linearGradient id="linear-gradient-insta-dm" x1="0.892" y1="0.192" x2="0.128" y2="0.85" gradientUnits="objectBoundingBox"> <stop offset="0" stop-color="#4A64D5"></stop> <stop offset="0.322" stop-color="#9737BD"></stop> <stop offset="0.636" stop-color="#F15540"></stop> <stop offset="1" stop-color="#FECC69"></stop> </linearGradient> </defs> <circle class="color-element" cx="19.5" cy="19.5" r="19.5" fill="url(#linear-gradient-insta-dm)"></circle> <path xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" d="M18.3682 12.0225H14.7069L14.7072 12.0146H8.34406C7.68102 12.0146 7.37264 12.8369 7.87214 13.2729L12.3314 17.1655L12.3349 17.1575L14.2487 18.8409L15.5297 20.0303L15.8136 30.1568C15.8335 30.8679 16.7223 31.1766 17.1788 30.6311L18.1515 29.4688L18.1501 29.4639L23.0436 23.4746L23.042 23.4662L27.0348 18.6748L27.0342 18.6702L31.5963 13.1853C31.9852 12.7178 31.6527 12.0088 31.0446 12.0088H26.8826L26.8812 12.0117H22.4407C22.4384 12.0117 22.4361 12.0154 22.4339 12.0225H22.4305L22.4307 12.0166H18.3682V12.0225ZM22.144 22.3959L22.1417 22.3907L26.4497 17.1663L26.4485 17.1572C26.8174 16.7145 28.1257 14.9555 28.2462 14.748L26.9385 15.4023L26.9341 15.4013L22.3595 17.6036L22.3592 17.6022L18.7611 19.3095L18.7628 19.3125L18.5032 19.4318L18.2248 19.5631L17.9411 19.6897C17.6515 19.764 17.0784 20.0395 17.0784 20.5547C17.0784 21.0538 17.192 25.532 17.2547 27.9372C17.2572 28.0334 17.373 28.0799 17.442 28.0129L17.6881 27.7738L22.144 22.3959ZM26.5753 14.0135L26.5753 14.0117L27.625 13.4429H27.3214H14.6612L14.6611 13.445H10.3521L12.4872 15.351L12.487 15.3582L16.0313 18.4673C16.3197 18.7229 16.6615 18.7989 16.9921 18.6007L17.5635 18.2922L22.2794 16.0459L22.2799 16.048L26.5753 14.0135Z" fill="white"></path> </svg>
        <form id="cht-form" action="options.php" method="POST" enctype="multipart/form-data">
            <!-- ---------------------
            Header Step (choose your chat channel | customize social widget launcher | triggers and targeting)
            ---------------------- -->
            <div class="chaty-header chaty-logo z-50 flex gap-3 items-center justify-between bg-white p-1.5 fixed top-0 left-0 w-full" id="chaty-header-tab-label">
                <a href="<?php echo esc_url( $this->getDashboardUrl() ) ?>">
                    <img class="max-w-[100px]" src="<?php echo esc_url(CHT_PLUGIN_URL.'admin/assets/images/logo-color.svg'); ?>" alt="Chaty" class="logo">
                    <img class="w-8 small-logo" src="<?php echo esc_url(CHT_PLUGIN_URL.'admin/assets/images/logo-small.svg'); ?>" alt="Chaty" class="logo">
                </a>

                <div class="header-items flex-1">
                    <ul class="chaty-app-tabs flex items-start justify-between">
                        <li class="m-0">
                            <a href="javascript:;" class="chaty-tab <?php echo ($step == 0) ? "active" : "completed" ?>" data-tab-id="chaty-tab-social-channel" id="chaty-social-channel" data-tab="first" data-tab-index="">
                                <span class="chaty-tabs-heading"></span>
                                <span class="lg:inline hidden chaty-tabs-subheading"><?php esc_html_e("1. Select channels", "chaty") ?></span>
                                <span class="inline lg:hidden chaty-tabs-subheading"><?php esc_html_e("1. Channels", "chaty") ?></span>
                            </a>
                        </li>
                        <li class="my-0">
                            <a href="javascript:;" class="chaty-tab <?php echo ($step == 1) ? "active" : (($step == 2) ? "completed" : "") ?>" data-tab-id="chaty-tab-customize-widget" id="chaty-app-customize-widget" data-tab-index="" data-tab="middle" data-forced-save="yes">
                                <span class="chaty-tabs-heading"></span>
                                <span class="lg:inline hidden chaty-tabs-subheading"><?php esc_html_e("2. Widget customization ", "chaty") ?></span>
                                <span class="inline lg:hidden chaty-tabs-subheading"><?php esc_html_e("2. Customization", "chaty") ?></span>
                            </a>
                        </li>
                        <li class="m-0">
                            <a href="javascript:;" class="chaty-tab <?php echo ($step == 2) ? "active" : "" ?>" data-tab-id="chaty-tab-triger-targeting" id="chaty-triger-targeting" data-tab-index="middle" data-forced-save="yes">
                                <span class="chaty-tabs-heading"></span>
                                <span class="lg:inline hidden chaty-tabs-subheading"><?php esc_html_e("3. Triggers and targeting", "chaty") ?></span>
                                <span class="inline lg:hidden chaty-tabs-subheading"><?php esc_html_e("2. Triggers & targeting", "chaty") ?></span>
                            </a>
                        </li>
                        <li class="m-0">
                            <a href="javascript:;" class="chaty-tab <?php echo ($step == 3) ? "active" : "" ?>" data-tab-id="chaty-tab-chatway" id="chaty-chatway" data-tab="last" data-tab-index="" data-forced-save="yes">
                                <span class="chaty-tabs-heading"></span>
                                <span class="lg:inline chaty-tabs-subheading"><?php esc_html_e("4. Add live chat", "chaty") ?></span>
                            </a>
                        </li>
                    </ul>
                    <div class="chaty-app-steps">
                        <div class="progress-stat">
                            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="whirlPath">
                                <circle cx="50" cy="50" r="46.5" stroke-linecap="round" fill="none" stroke-width="4.5"></circle>
                            </svg>
                            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="svg-progress">
                                <circle cx="50" cy="50" r="46.5" stroke-linecap="round" fill="none" stroke-width="4.5" id="step-progress" style="stroke-dashoffset: 0;"></circle>
                            </svg>
                            <span class="current-step" id="current-step">4/4</span>
                        </div>
                        <div class="process-step" id="process-step"> Add live chat </div>
                    </div>
                </div>

                <!-- footer start -->
                <footer class="footer-buttons relative space-x-2 step-<?php echo esc_attr($step) ?>">
                
                    <div class="flex items-center justify-center gap-3">
                        <div class="flex items-center gap-2 next-prev-buttons">
                            <button type="button" class="flex back-button" id="back-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M15.8333 10H4.16668" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M10 15.8333L4.16668 9.99996L10 4.16663" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span><?php esc_html_e("Back", "chaty") ?></span>
                            </button>
                            <button type="button" class="flex next-button" id="next-button">
                                <span><?php esc_html_e("Next", "chaty") ?></span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4.16677 10H15.8334" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M10.0001 4.16663L15.8334 9.99996L10.0001 15.8333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <span class="save-button-container">
                            <button type="submit" class="save-button whitespace-nowrap" id="save-button" name="save_button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H13.3333L17.5 6.66667V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5Z" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14.1666 17.5V10.8334H5.83331V17.5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M5.83331 2.5V6.66667H12.5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span><?php esc_html_e("Save Widget", "chaty") ?></span>
                                <span class="mobile-text"><?php esc_html_e("Save", "chaty") ?></span>
                            </button>
                            <button class="arrow-btn !px-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        <span>
                    </div>

                    <input type="submit" class="save-dashboard-button hidden" id="save-dashboard-button" name="save_and_view_dashboard" value="<?php esc_html_e('Save & View Dashboard', 'chaty'); ?>" />
                    <input type="hidden" name="current_step" value="<?php echo esc_attr($step) ?>" id="current_step">
                </footer>
                <!-- footer ends -->
            </div>
            <!-- end of header step -->

            <!-- settings and preview start -->
            <div class="js-error-message">

            </div>

            <?php settings_fields($this->plugin_slug); ?>

            <?php
            $chatwayStatus = apply_filters('check_for_chatway_status', 'not-installed');
            $pluginClass = ($chatwayStatus != 'not-installed' && $chatwayStatus != 'not-activated')?'chatway--active':'';
            ?>
            <!-- settings and preview section -->
            <section class="chaty-widget-tab <?php echo esc_attr($pluginClass) ?> grid grid-cols-1 lg:grid-cols-3 overflow-x-hidden sm:overflow-visible rounded-lg border border-gray-150/40 bg-white step-<?php echo esc_attr($step) ?>" id="chaty-widget-body-tab" data-step="<?php echo esc_attr($step) ?>">
                <!-- tabs and settings -->
                <div class="settings-column col-span-2 border-r border-gray-150/40">
                    <!--/* Social channel list section */-->
                    <div id="chaty-tab-social-channel" class="social-channel-tabs <?php echo ($step == 0) ? "active" : "" ?>">
                        <h1 class="section-title font-primary text-cht-gray-150 text-2xl border-b border-gray-150/40 px-8 py-5">
                            <strong><?php esc_html_e('Step', 'chaty'); ?> <?php esc_html_e('1', 'chaty'); ?>:</strong> <?php esc_html_e('Choose your channels', 'chaty'); ?>
                        </h1>
                        <div class="p-3 sm:p-5 md:p-8">
                            <?php require_once 'channels-section.php'; ?>
                        </div>
                    </div>

                    <!--/* Customize widget section */-->
                    <div id="chaty-tab-customize-widget" class="social-channel-tabs <?php echo ($step == 1) ? "active" : "" ?>">
                        <h1 class="section-title font-primary text-cht-gray-150 text-2xl border-b border-gray-150/40 px-8 py-5">
                            <strong><?php esc_html_e('Step', 'chaty'); ?> <?php esc_html_e('2', 'chaty'); ?>:</strong> <?php esc_html_e('Customize your widget', 'chaty'); ?>
                        </h1>
                        <div class="p-3 sm:p-5 md:p-8">
                            <?php require_once 'customize-widget-section.php'; ?>
                        </div>
                    </div>

                    <!--/* Customize widget section */-->
                    <div id="chaty-tab-triger-targeting" class="social-channel-tabs <?php echo ($step == 2) ? "active" : "" ?>">
                        <h1 class="section-title font-primary text-cht-gray-150 text-2xl border-b border-gray-150/40 px-8 py-5">
                            <strong><?php esc_html_e('Step', 'chaty');?> <?php esc_html_e('3', 'chaty'); ?>:</strong> <?php esc_html_e('Triggers and targeting', 'chaty');?>
                        </h1>
                        <div class="p-3 sm:p-5 md:p-8">
                            <?php require_once 'trigger-and-target.php'; ?>
                             <!--/* form submit button */-->
                            <input type="hidden" name="nonce" value="<?php echo esc_attr(wp_create_nonce("chaty_plugin_nonce")) ?>">
                            <input type="hidden" name="cht_token" value="<?php echo esc_attr(get_option("cht_token")); ?>">
                            <?php
                            $created_on = get_option('cht_created_on'.$this->widget_index);
                            if ($created_on === false) {
                                $created_on = gmdate("Y-m-d");
                            }
                            ?>
                            <input type="hidden" name="cht_created_on" value="<?php echo esc_attr($created_on) ?>" />
                            <input type="hidden" name="button_type" value="" id="button_type" />
                        </div>
                    </div>

                    <!--/* Chatway */-->
                    <div id="chaty-tab-chatway" class="social-channel-tabs <?php echo ($step == 3) ? "active" : "" ?>">
                        <h1 class="section-title font-primary text-cht-gray-150 text-2xl border-b border-gray-150/40 px-4 sm:px-8 py-5">
                            <strong><?php esc_html_e("Step 4:", "chaty") ?></strong> <?php esc_html_e("Add live chat", "chaty") ?>
                        </h1>
                        <div class="p-5 md:p-8 pl-0 md:pl-0">
                            <?php require_once 'chatway.php'; ?>
                        </div>
                    </div>
                </div>
                <!-- preview -->
                <aside class="preview-section-chaty pb-20 z-0">
                    <div class="preview sticky top-28 ease-linear duration-300" id="admin-preview">
                        <h2 class="text-white">&nbsp;</h2>
                        <div class="page border rounded-md">
                            <div class="page-header bg-cht-gray-150/10">
                                <svg width="40" height="8" viewBox="0 0 40 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="4" cy="4" r="4" fill="#C6D7E3"></circle>
                                    <circle cx="20" cy="4" r="4" fill="#C6D7E3"></circle>
                                    <circle cx="36" cy="4" r="4" fill="#C6D7E3"></circle>
                                </svg>
                            </div>
                            <div class="page-body">
                                <div class="chaty-preview border-t rounded-bl-md rounded-br-md">
                                    <div class="chaty-preview-channels">
                                    </div>
                                    <div class="chaty-preview-cta">
                                        <div class="chaty-main-cta"></div>
                                        <div class="chaty-close-cta">
                                            <div class="chaty-channel">
                                                <div class="chaty-cta">
                                                    <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="26" cy="26" rx="26" ry="26" fill="#A886CD" style="fill: rgb(168, 134, 205);"></ellipse><rect width="27.1433" height="3.89857" rx="1.94928" transform="translate(18.35 15.6599) scale(0.998038 1.00196) rotate(45)" fill="white"></rect><rect width="27.1433" height="3.89857" rx="1.94928" transform="translate(37.5056 18.422) scale(0.998038 1.00196) rotate(135)" fill="white"></rect></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="switch-preview">
                            <input data-gramm_editor="false" type="radio" id="previewDesktop" name="switchPreview" class="js-switch-preview switch-preview__input" checked="checked">
                            <label for="previewDesktop" class="switch-preview__label switch-preview__desktop">
                                <svg class="pointer-events-none" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1"><path d="M16.667 15c.916 0 1.666-.75 1.666-1.667V5c0-.917-.75-1.667-1.666-1.667H3.333c-.916 0-1.666.75-1.666 1.667v8.333c0 .917.75 1.667 1.666 1.667h-2.5a.836.836 0 00-.833.833c0 .459.375.834.833.834h18.334a.836.836 0 00.833-.834.836.836 0 00-.833-.833h-2.5zM4.167 5h11.666c.459 0 .834.375.834.833V12.5a.836.836 0 01-.834.833H4.167a.836.836 0 01-.834-.833V5.833c0-.458.375-.833.834-.833z" fill="#83A1B7"></path></svg>
                            </label>
                            <input data-gramm_editor="false" type="radio" id="previewMobile" name="switchPreview" class="js-switch-preview switch-preview__input">
                            <label for="previewMobile" class="switch-preview__label switch-preview__mobile">
                                <svg class="pointer-events-none" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" svg-inline="" focusable="false" tabindex="-1"><path d="M12.916.833H6.25c-1.15 0-2.083.934-2.083 2.084v14.166c0 1.15.933 2.084 2.083 2.084h6.666c1.15 0 2.084-.934 2.084-2.084V2.917c0-1.15-.934-2.084-2.084-2.084zm-3.333 17.5c-.691 0-1.25-.558-1.25-1.25 0-.691.559-1.25 1.25-1.25.692 0 1.25.559 1.25 1.25 0 .692-.558 1.25-1.25 1.25zM13.333 15h-7.5V3.333h7.5V15z" fill="#83A1B7"></path></svg>
                            </label>
                        </div>
                        <div id="custom-css"></div>
                    </div>
                </aside>
                <div class="chaty-sticky-buttons">

                    <a href="#" class="preview-help-btn"><?php esc_html_e('Preview', 'chaty'); ?></a>

                    <?php if (!empty($this->widget_index) && $this->widget_index != '_new_widget' && false) { ?>
                        <a href="javascript:;" data-nonce="<?php echo esc_attr(wp_create_nonce("chaty_remove_".$this->widget_index)) ?>" class="remove-chaty-widget-sticky remove-chaty-options"><?php esc_html_e("Remove", "chaty") ?></a>
                    <?php } ?>
                </div>
            </section>
        </form>

        <input type="hidden" id="widget_index" value="<?php echo esc_attr($this->widget_index) ?>" />
    </main>
</div>
<input type="hidden" id="select_channel_icon_slug" />
<?php require_once 'popup.php'; ?>
<?php if (0 && isset($_GET['page']) && $_GET['page'] == "chaty-widget-settings" && !isset($_GET['copy-from'])) { ?>
    <div class="chaty-popup-form">
        <div class="chaty-popup-overlay"></div>
        <div class="chaty-popup-content">
            <div class="popup-title"><?php esc_html_e("Create a new widget", "chaty") ?></div>
            <div class="popup-description"><?php esc_html_e("Would you like to load settings from an existing widget?", "chaty") ?></div>
            <form action="<?php echo esc_url(admin_url("admin.php")) ?>" method="get">
                <div class="select-field">
                    <input type="hidden" name="page" value="chaty-widget-settings" />
                    <select name="copy-from" >
                        <option value=""><?php esc_html_e("No thanks", "chaty") ?></option>
                        <?php
                        $total_widgets = $this->get_total_widgets();
                        $menu_text     = esc_attr__('Settings', 'chaty');
                        if ($total_widgets > 0) {
                            $menu_text     = esc_html__("Settings Widget #1", "chaty");
                            $total_widgets = 1;

                            $text = get_option("cht_widget_title");
                            if (!empty($text) && $text != "" && $text != null) {
                                $menu_text = esc_html__("Settings ", "chaty").$text;
                            }
                        } else {
                            $total_widgets = 0;
                        }

                        $deleted_list = get_option("chaty_deleted_settings");
                        if (empty($deleted_list) || !is_array($deleted_list)) {
                            $deleted_list = [];
                        }

                        echo "<option value='0'>".esc_attr($menu_text)>"</option>";
                        $chaty_widgets = get_option("chaty_total_settings");
                        if (!empty($chaty_widgets) && $chaty_widgets != null && is_numeric($chaty_widgets) && $chaty_widgets > 0) {
                            for ($i = 1; $i <= $chaty_widgets; $i++) {
                                if (!in_array($i, $deleted_list)) {
                                    $cht_widget_title = get_option("cht_widget_title_".$i);
                                    if (empty($cht_widget_title) || $cht_widget_title == "" || $cht_widget_title == null) {
                                        $cht_widget_title = esc_html__("Settings Widget #", "chaty").($i + $total_widgets);
                                    } else {
                                        $cht_widget_title = esc_html__("Settings ", "chaty").$cht_widget_title;
                                    }

                                    echo "<option value='".esc_attr($i)."'".esc_attr($cht_widget_title)."</option>";
                                }
                            }
                        }
                        ?>
                    </select>
                </div>
                <div class="select-field-btn">
                    <button type="submit" class="popup-form-btn"><?php esc_html_e("Start Editing", "chaty") ?></button>
                </div>
            </form>
        </div>
    </div>
<?php }//end if

