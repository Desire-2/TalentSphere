// Central AdSense slot configuration.
// Create the ad units in the AdSense console, then set the VITE_AD_SLOT_* values
// in the deployment environment (see .env.template). Missing slots render nothing in prod.

const slot = (key) => import.meta.env[key] || '';

export const AD_SLOTS = {
  banner: slot('VITE_AD_SLOT_BANNER'),
  square: slot('VITE_AD_SLOT_SQUARE'),
  responsive: slot('VITE_AD_SLOT_RESPONSIVE'),
  mobileBanner: slot('VITE_AD_SLOT_MOBILE_BANNER'),
  largeRectangle: slot('VITE_AD_SLOT_LARGE_RECTANGLE'),
  leaderboard: slot('VITE_AD_SLOT_LEADERBOARD'),
  skyscraper: slot('VITE_AD_SLOT_SKYSCRAPER'),
  inArticle: slot('VITE_AD_SLOT_IN_ARTICLE'),
  multiplex: slot('VITE_AD_SLOT_MULTIPLEX'),
  jobSponsored: slot('VITE_AD_SLOT_JOB_SPONSORED'),
};

export default AD_SLOTS;
