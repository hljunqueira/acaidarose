<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="chaty-popup" id="custom-message-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("No channel was selected", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Please select at least one chat channel before publishing your widget", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="close-chaty-popup-btn channel-setting-btn btn btn-primary rounded-lg mr-5"><?php esc_html_e("Change Number", "chaty") ?></button>
                    <button type="button" class="btn btn-default check-for-numbers btn btn-primary btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="no-device-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("No channel was selected", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Please select at least one chat channel before publishing your widget", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="close-chaty-popup-btn channel-setting-btn btn btn-primary rounded-lg mr-5"><?php esc_html_e("Select Channel", "chaty") ?></button>
                    <button type="button" class="btn btn-default check-for-triggers btn btn-primary btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="chaty-popup" id="agent-value-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn right-2 top-2 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header text-left font-primary text-cht-gray-150 font-medium p-5 relative">
                    <?php esc_html_e("Fill out all agent name", "chaty") ?>
                </div>
                <div class="chaty-popup-body text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("One or more agent name is missing.", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn-default check-for-triggers btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 mr-5"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn fill-agent-value btn rounded-lg"><?php esc_html_e("Fill agent details", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="no-step-device-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-5 right-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-semibold text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("No channel was selected", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Please select at least one chat channel before publishing your widget", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn-default close-chaty-popup-btn next-step-btn btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 mr-5"><?php esc_html_e("Ok", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn channel-setting-step-btn btn rounded-lg"><?php esc_html_e("Select Channel", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="no-device-value">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-4 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("Fill out at least one channel details", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("You need to fill out at least one channel details for Chaty to show up on your website", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn-default check-for-triggers btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 mr-5"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn channel-setting-btn btn rounded-lg"><?php esc_html_e("Fill channel details", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="no-step-device-value">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("Fill out at least one channel details", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("You need to fill out at least one channel details for Chaty to show up on your website", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn-default close-chaty-popup-btn next-step-btn btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 mr-5"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn channel-setting-step-btn btn rounded-lg"><?php esc_html_e("Fill channel details", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="device-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("No device was selected", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Please select mobile/desktop before publishing your widget", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn-default check-for-triggers btn mr-5 rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn channel-setting-btn btn rounded-lg"><?php esc_html_e("Select Device", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="chaty-popup" id="device-step-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("No device was selected", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Please select mobile/desktop before publishing your widget", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn btn-default close-chaty-popup-btn next-step-btn rounded-lg mr-5"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn channel-setting-step-btn btn btn-primary btn btn-primary btn btn-primary btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150"><?php esc_html_e("Select Device", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="trigger-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("No trigger was selected", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Please select a trigger before publishing your widget", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn btn-default check-for-status rounded-lg bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 mr-5"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn select-trigger-btn btn-primary btn rounded-lg"><?php esc_html_e("Select Trigger", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="trigger-step-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("No trigger was selected", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Please select a trigger before publishing your widget", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn-default close-chaty-popup-btn next-step-btn btn rounded-lg bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 mr-5"><?php esc_html_e("Save Anyway", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn select-trigger-step-btn btn-primary btn rounded-lg"><?php esc_html_e("Select Trigger", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="status-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("Chaty is currently off", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Chaty is currently turned off, would you like to save and show it on your site?", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn-default status-and-save btn rounded-lg bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 mr-5"><?php esc_html_e("Just save and keep it off", "chaty") ?></button>
                    <button type="button" class="btn-primary change-status-btn change-status-and-save btn rounded-lg" id="keep-leads-in-db"><?php esc_html_e("Save &amp; Show on my site", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="custom-leads-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("Are you sure?", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("You're about to turn off saving emails to your local website. Are you sure?", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="close-chaty-popup-btn btn btn-default rounded-lg mr-5"><?php esc_html_e("Disable anyway", "chaty") ?></button>
                    <button type="button" class="close-chaty-popup-btn keep-leads-in-db btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150" id="keep-leads-in-db"><?php esc_html_e("Keep using", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="remove-agents-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-4 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("Remove All Agents?", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("Are you sure you want to remove all agent(s)?", "chaty") ?>
                </div>
                <input type="hidden" id="delete_widget_id" value="">
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="btn-default close-chaty-popup-btn btn rounded-lg btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 mr-5"><?php esc_html_e("No", "chaty") ?></button>
                    <button type="button" class="remove-agent-list btn rounded-lg"><?php esc_html_e("Yes, Remove", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="chaty-popup" id="whatsapp-message-popup">
    <div class="chaty-popup-outer"></div>
    <div class="chaty-popup-inner popup-pos-bottom">
        <div class="chaty-popup-content">
            <div class="chaty-popup-close">
                <a href="javascript:void(0)" class="close-delete-pop close-chaty-popup-btn relative top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.6 15.5c-.53.53-1.38.53-1.91 0L8.05 9.87 2.31 15.6c-.53.53-1.38.53-1.91 0s-.53-1.38 0-1.9l5.65-5.64L.4 2.4C-.13 1.87-.13 1.02.4.49s1.38-.53 1.91 0l5.64 5.63L13.69.39c.53-.53 1.38-.53 1.91 0s.53 1.38 0 1.91L9.94 7.94l5.66 5.65c.52.53.52 1.38 0 1.91z"/></svg>
                </a>
            </div>
            <div class="a-card a-card--normal">
                <div class="chaty-popup-header font-medium text-cht-gray-150 py-4 text-left px-5">
                    <?php esc_html_e("Leading zero in WhatsApp number", "chaty") ?>
                </div>
                <div class="text-cht-gray-150 text-base px-5 py-6">
                    <?php esc_html_e("You've entered your WhatsApp number with a leading zero. Are you sure the number is correct?", "chaty") ?>
                    <div class="phone-number-list" data-label="<?php esc_html_e("Phone number", "chaty"); ?>" data-action="<?php esc_html_e("Remove Zero", "chaty"); ?>" data-test="<?php esc_html_e("Test", "chaty"); ?>" >

                    </div>
                </div>
                <div class="chaty-popup-footer flex px-5 justify-end">
                    <button type="button" class="remove-zero-btn channel-setting-btn btn btn-primary bg-transparent text-cht-gray-150 border-cht-gray-150 hover:bg-transparent hover:text-cht-gray-150 rounded-lg mr-5"><?php esc_html_e("Remove Zero", "chaty") ?></button>
                    <button type="button" class="btn btn-default check-for-numbers btn btn-primary btn rounded-lg btn-primary "><?php esc_html_e("Proceed", "chaty") ?></button>
                </div>
            </div>
        </div>
    </div>
</div>


<?php include 'chatyway-info-popup.php' ?>