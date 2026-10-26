// Cookie / tracking consent helpers (localStorage-backed)

const ADS_CONSENT_KEY = 'ats_ads_consent';
const ANALYTICS_CONSENT_KEY = 'ats_analytics_consent';

export const CONSENT_EVENT = 'ats-consent-updated';

export const getAdsConsent = () => localStorage.getItem(ADS_CONSENT_KEY) === 'granted';

export const getAnalyticsConsent = () => localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'granted';

export const setConsent = ({ ads, analytics }) => {
  if (ads !== undefined) localStorage.setItem(ADS_CONSENT_KEY, ads ? 'granted' : 'denied');
  if (analytics !== undefined) localStorage.setItem(ANALYTICS_CONSENT_KEY, analytics ? 'granted' : 'denied');
  window.dispatchEvent(new Event(CONSENT_EVENT));
};

export const hasAnyConsent = () => localStorage.getItem(ADS_CONSENT_KEY) !== null;
