<div id="mfn-consent-mode" class="mfn-cookies" data-tab="consent" data-expires="<?php echo mfn_opts_get('gdpr2-settings-cookie_expire',365); ?>" data-animation="<?php echo mfn_opts_get('gdpr2-settings-animation'); ?>">
  <div class="mfn-cookies-popup">
    <div class="mfn-cookies-wrapper">
      <ul class="cookies-tab-nav">
        <li class="tab is-active" data-id="consent"><a href="#"><?php echo mfn_opts_get('gdpr2-content-title','Consent'); ?></a></li>
        <li class="tab" data-id="details"><a href="#"><?php echo mfn_opts_get('gdpr2-details-title','Details'); ?></a></li>
        <li class="tab" data-id="about"><a href="#"><?php echo mfn_opts_get('gdpr2-about-title','About Cookies'); ?></a></li>
      </ul>
      <div data-id="consent" class="cookies-tab-content"><?php echo mfn_opts_get('gdpr2-consent-content'); ?></div>
      <div data-id="details" class="cookies-tab-content">
        <form class="cookie-consent">
          <div class="cookie-type">
            <header>
              <strong><?php echo mfn_opts_get('gdpr2-necessary-title','Necessary'); ?></strong>
              <div class="mfn-switch">
                <input class="mfn-switch-input" id="cookies_neccessary" type="checkbox" checked="" disabled="disabled">
                <label class="mfn-switch-label" for="cookies_neccessary"></label>
              </div>
            </header>
            <?php echo mfn_opts_get('gdpr2-necessary-consent'); ?>
          </div>
          <div class="cookie-type">
            <header>
              <strong><?php echo mfn_opts_get('gdpr2-analytics-title','Analytics & Performance'); ?></strong>
              <div class="mfn-switch">
                <input class="mfn-switch-input" id="cookies_analytics" type="checkbox" checked="">
                <label class="mfn-switch-label" for="cookies_analytics"></label>
              </div>
            </header>
            <?php echo mfn_opts_get('gdpr2-analytics-consent'); ?>
          </div>
          <div class="cookie-type">
            <header>
              <strong><?php echo mfn_opts_get('gdpr2-marketing-title','Marketing'); ?></strong>
              <div class="mfn-switch">
                <input class="mfn-switch-input" id="cookies_marketing" type="checkbox" checked="">
                <label class="mfn-switch-label" for="cookies_marketing"></label>
              </div>
            </header>
            <?php echo mfn_opts_get('gdpr2-marketing-consent'); ?>
          </div>
        </form>
      </div>
      <div data-id="about" class="cookies-tab-content">
        <?php echo mfn_opts_get('gdpr2-about-content'); ?>
      </div>
    </div>
    <footer class="mfn-cookies-footer">
      <a id="consent_deny" class="button button-outlined white" href="#"><?php echo mfn_opts_get('gdpr2-button-deny','Deny'); ?></a>
      <a id="consent_customize" class="button button-outlined white" href="#"><span><?php echo mfn_opts_get('gdpr2-button-customize','Customize'); ?></span></a>
      <a id="consent_selected" class="button button-outlined white" href="#"><?php echo mfn_opts_get('gdpr2-button-allow-selected','Allow selected'); ?></a>
      <a id="consent_allow" class="button secondary button_theme" href="#"><?php echo mfn_opts_get('gdpr2-button-allow-all','Allow all'); ?></a>
    </footer>
  </div>
</div>
