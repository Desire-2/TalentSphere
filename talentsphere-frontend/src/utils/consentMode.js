// Google Consent Mode v2 (required for AdSense in EEA/UK and increasingly
// enforced globally). Defaults everything to 'denied' BEFORE any Google tag
// loads, then updates to 'granted' based on the user's cookie banner choice.

const CONSENT_MODE_FLAG = '__atsConsentModeInitialized';

export const initConsentMode = () => {
  if (window[CONSENT_MODE_FLAG]) return;
  window[CONSENT_MODE_FLAG] = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
};

export const updateConsentMode = ({ ads = false, analytics = false, adPersonalization = false }) => {
  if (!window[CONSENT_MODE_FLAG]) return;
  window.gtag('consent', 'update', {
    ad_storage: ads ? 'granted' : 'denied',
    ad_user_data: ads ? 'granted' : 'denied',
    ad_personalization: adPersonalization ? 'granted' : 'denied',
    analytics_storage: analytics ? 'granted' : 'denied',
  });
};
