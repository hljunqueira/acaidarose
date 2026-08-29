<div class="mf-box-style">
	<div class="mf-input-group">
		<label class="attr-input-label">
			<input type="checkbox" value="1" name="mf_sms_status" class="mf-admin-control-input mf-form-modalinput-sms">
			<span><?php esc_html_e('SMS Integrations (Twilio):', 'metform-pro');?></span>
		</label>
	</div>
	<div class="mf-input-group mf-sms mf-sms-integration mf-form-top-spacing  mf-form-bottom-spacing">
		<label for="attr-input-label" class="attr-input-label"><?php esc_html_e('SMS From:', 'metform-pro');?></label>
		<input type="text" name="mf_sms_from" class="mf-sms-from attr-form-control">
		<span class='mf-input-help'><?php esc_html_e('Enter here sms from number.', 'metform-pro');?></span>
	</div>
	<div class="mf-input-group mf-sms mf-sms-integration mf-form-bottom-spacing">
		<label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Twilio Account Sid:', 'metform-pro');?></label>
		<input type="text" name="mf_sms_twilio_account_sid" class="mf-sms-twilio-account-sid attr-form-control">
		<span class='mf-input-help'><?php esc_html_e('Enter here twilio account sid.', 'metform-pro');?></span>
	</div>
	<div class="mf-input-group mf-sms mf-sms-integration">
		<label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Twilio Auth Token:', 'metform-pro');?></label>
		<input type="text" name="mf_sms_twilio_auth_token" class="mf-sms-twilio-auth-token attr-form-control">
		<span class='mf-input-help'><?php esc_html_e('Enter here twilio auth token.', 'metform-pro');?></span>
	</div>
</div>
<div class="mf-box-style mf-box-style">
	<div class="mf-input-group ">
		<label class="attr-input-label">
			<input type="checkbox" value="1" name="mf_sms_user_status" class="mf-admin-control-input mf-form-modalinput-sms-user">
			<span><?php esc_html_e('SMS User:', 'metform-pro');?></span>
		</label>
		<span class='mf-input-help'><?php esc_html_e('Integrate SMS confirmation with this form.', 'metform-pro');?><strong><?php esc_html_e('The form must have at least one mobile number widget and it should be required.', 'metform-pro');?></strong></span>
	</div>
	<div class="mf-input-group mf-sms-user mf-form-top-spacing">
		<label for="attr-input-label" class="attr-input-label"><?php esc_html_e('User SMS Body:', 'metform-pro');?></label>
		<input type="text" name="mf_sms_user_body" class="mf-sms-user-body attr-form-control">
		<span class='mf-input-help'><?php esc_html_e('Enter here admin sms body text.', 'metform-pro');?></span>
	</div>
</div>
<div class="mf-box-style mf-box-style">
	<div class="mf-input-group">
		<label class="attr-input-label">
			<input type="checkbox" value="1" name="mf_sms_admin_status" class="mf-admin-control-input mf-form-modalinput-sms-admin">
			<span><?php esc_html_e('SMS Admin:', 'metform-pro');?></span>
		</label>
	</div>
	<div class="mf-input-group mf-sms-admin mf-form-top-spacing mf-form-bottom-spacing">
		<label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Admin SMS Body:', 'metform-pro');?></label>
		<input type="text" name="mf_sms_admin_body" class="mf-sms-admin-body attr-form-control">
		<span class='mf-input-help'><?php esc_html_e('Enter here admin sms body text.', 'metform-pro');?></span>
	</div>
	<div class="mf-input-group mf-sms-admin">
		<label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Admin SMS To:', 'metform-pro');?></label>
		<input type="text" name="mf_sms_admin_to" class="mf-sms-admin-to attr-form-control">
		<span class='mf-input-help'><?php esc_html_e('Enter here admin sms to mobile number.', 'metform-pro');?></span>
	</div>
</div>