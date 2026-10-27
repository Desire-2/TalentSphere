// Cookie / tracking consent helpers (localStorage-backed)

import { updateConsentMode } from './consentMode';

const ADS_CONSENT_KEY = 'ats_ads_consent';
const ANALYTICS_CONSENT_KEY = 'ats_analytics_consent';
const AD_PERSONALIZATION_CONSENT_KEY = 'ats_ad_personalization_consent';

export const CONSENT_EVENT = 'ats-consent-updated';
export const CONSENT_OPEN_EVENT = 'ats-consent-open';

export const getAdsConsent = () => localStorage.getItem(ADS_CONSENT_KEY) === 'granted';

export const getAnalyticsConsent = () => localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'granted';

export const getAdPersonalizationConsent = () =>
  localStorage.getItem(AD_PERSONALIZATION_CONSENT_KEY) === 'granted';

export const setConsent = ({ ads, analytics, adPersonalization }) => {
  if (ads !== undefined) localStorage.setItem(ADS_CONSENT_KEY, ads ? 'granted' : 'denied');
  if (analytics !== undefined) localStorage.setItem(ANALYTICS_CONSENT_KEY, analytics ? 'granted' : 'denied');
  if (adPersonalization !== undefined) {
    localStorage.setItem(AD_PERSONALIZATION_CONSENT_KEY, adPersonalization ? 'granted' : 'denied');
  }
  updateConsentMode({
    ads: getAdsConsent(),
    analytics: getAnalyticsConsent(),
    adPersonalization: getAdPersonalizationConsent(),
  });
  window.dispatchEvent(new Event(CONSENT_EVENT));
};

export const hasAnyConsent = () => localStorage.getItem(ADS_CONSENT_KEY) !== null;

// Re-open the cookie banner (e.g. from a footer "Cookie preferences" link)
export const openCookieConsent = () => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
