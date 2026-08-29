<?php

defined( 'ABSPATH' ) || exit;

$license_status = \MetForm_Pro\Libs\License::instance()->status();

?><div class="wrap">
	<div class="metform-admin-container">
		<div class="attr-card-body list-item">
			<h2 class="list-item-header">License Settings</h2>
			<form action="" method="post" class="form-group attr-input-group mf-admin-input-text mf-admin-input-text--metform-license-key">

				<?php if ($license_status == 'invalid') : ?>
					<p class="license-title">Enter your license key here to activate MetForm Pro. It will enable update notice and auto updates.</p>

					<ol class="license-info-lists">
						<li><span class="pointer">1</span> Log in to your Wpmet account to get the license key.</li>
						<li><span class="pointer">2</span> If you don't yet buy this product, get <a href="https://wpmet.com/metform-pricing/" target="_blank">MetForm Pro</a> now.</li>
						<li> <span class="pointer">3</span> Copy the MetForm Pro license key from your account and paste it below.</li>
					</ol>

					<label for="mf-admin-option-text-metform-license-key license-status" style="margin-bottom: 8px; display:inline-block"><b>Your License Key</b></label><br />
					<input type="text" class="attr-form-control license-input" id="mf-admin-option-text-metform-license-key" placeholder="Please insert your license key here" name="metform-pro-settings-page-key" value="">
					<span class="attr-input-group-btn">
						<input class="license-input" type="hidden" name="metform-pro-settings-page-action" value="activate">
						<button class="button license-btn" type="submit">
							<div class="mf-spinner"></div>Activate
						</button>
					</span>

					<div class="metform-license-form-result">
						<p class="attr-alert attr-alert-info license-alert">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
								<path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="#000000" stroke-width="1.5" />
								<path d="M12.2422 17V12C12.2422 11.5286 12.2422 11.2929 12.0957 11.1464C11.9493 11 11.7136 11 11.2422 11" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
								<path d="M11.992 8H12.001" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg> Still can't find your lisence key? <a target="_blank" href="https://wpmet.com/support-ticket">Knock us here!</a>
						</p>
					</div>

				<?php else: ?>
					<div id="metform-sites-notice-id-license-status" class="metform-notice notice metform-active-notice notice-success" dismissible-meta="user">
						<p><?php printf(esc_html__('Congratulations! You\'r product is activated for "%s"', 'metform-pro'), parse_url(home_url(), PHP_URL_HOST)); ?></p>
					</div>

					<div class="attr-revoke-btn-container">
						<input type="hidden" name="metform-pro-settings-page-action" value="deactivate">
						<div class="status-info">
							<button type="submit" class="button license-remove-btn"> <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" fill="none"><path d="M1 3.667h12M11.667 3.667V13a1.333 1.333 0 0 1-1.333 1.333H3.667A1.333 1.333 0 0 1 2.334 13V3.667m2 0V2.333A1.333 1.333 0 0 1 5.667 1h2.667a1.333 1.333 0 0 1 1.333 1.333v1.334M5.667 7v4M8.334 7v4" stroke="#F8132F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg> Remove license from this domain</button> <span class="license-docs">See documention <a target="_blank" href="https://help.wpmet.com/docs/how-to-revoke-product-license-key/">here</a>.</span>
						</div>
					</div>
				<?php endif; ?>
				<?php wp_nonce_field('metform-pro-settings-page', 'metform-pro-settings-page'); ?>
			</form>
		</div>
	</div>
</div>