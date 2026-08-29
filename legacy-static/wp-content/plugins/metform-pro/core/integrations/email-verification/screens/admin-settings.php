<!-- <div class="mf-box-style"> -->
    <div class="mf-input-group mf-box-style">
        <label class="attr-input-label">
            <input type="checkbox" value="1" name="email_verification_enable" class="mf-admin-control-input mf-form-email-verification-enable">
            <span><?php esc_html_e('Email verification :', 'metform-pro');?></span>
        </label>
        <span class="mf-input-help"><?php esc_html_e('Want to send an email verification mail to the user by email? Active this one.', 'metform-pro')?><strong><?php esc_html_e('The form must have at least one Email widget and it should be required.', 'metform-pro')?></strong></span>
    </div>
    <div class="mf-input-group mf-form-email-verification mf-form-top-spacing mf-form-bottom-spacing">
        <label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Email Subject:', 'metform-pro');?></label>
        <input type="text" name="email_verification_email_subject" class="mf-form-email-verification-email-subject attr-form-control" placeholder="<?php esc_html_e('Email subject', 'metform-pro');?>">
        <span class='mf-input-help'><?php esc_html_e('Enter here email subject.', 'metform-pro');?></span>
    </div>
    <div class="mf-input-group mf-form-email-verification mf-form-bottom-spacing">
        <label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Redirect:', 'metform-pro');?></label>
        <input type="text" name="email_verification_confirm_redirect" class="mf-form-email-verification-email-redirect attr-form-control" placeholder="<?php esc_html_e('Enter redirect url', 'metform-pro');?>">
        <span class='mf-input-help'><?php esc_html_e('Redirect after verify email', 'metform-pro');?></span>
    </div>
    <div class="mf-input-group mf-form-email-verification mf-form-bottom-spacing">
        <label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Email template heading:', 'metform-pro');?></label>
        <input type="text" name="email_verification_heading" class="mf-form-email-verification-heading attr-form-control" placeholder="<?php esc_html_e('Enter email template heading', 'metform-pro');?>">
    </div>
    <div class="mf-input-group mf-form-email-verification mf-form-bottom-spacing">
        <label for="attr-input-label" class="attr-input-label"><?php esc_html_e('Email template paragraph:', 'metform-pro');?></label>
        <textarea name="email_verification_paragraph" class="mf-form-email-verification-paragraph attr-form-control" rows="3" placeholder="<?php esc_html_e('Enter email template paragraph', 'metform-pro');?>"></textarea>
    </div>
<!-- </div> -->
