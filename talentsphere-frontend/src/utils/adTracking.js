import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Ads tracking and utilities

// Initialize Google Ads conversion tracking
export const initGoogleAds = () => {
  const gtagId = import.meta.env.VITE_GOOGLE_ADS_GTAG_ID;
  
  if (!gtagId) {
    console.warn('Google Ads GTAG ID not found. Set VITE_GOOGLE_ADS_GTAG_ID in your environment variables.');
    return;
  }

  // Load Google Ads script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
  document.head.appendChild(script);

  // Initialize gtag for ads
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', gtagId);
};

// Track conversion events for Google Ads
export const trackConversion = (conversionLabel, value = null, currency = 'USD') => {
  const gtagId = import.meta.env.VITE_GOOGLE_ADS_GTAG_ID;
  
  if (!gtagId || typeof window.gtag === 'undefined') return;

  const conversionData = {
    send_to: `${gtagId}/${conversionLabel}`,
    transaction_id: Date.now().toString(), // Unique transaction ID
  };

  if (value !== null) {
    conversionData.value = value;
    conversionData.currency = currency;
  }

  window.gtag('event', 'conversion', conversionData);
};

// Track job application conversions
export const trackJobApplicationConversion = (jobId, jobTitle) => {
  trackConversion('job_application', null);
  
  // Custom event for detailed tracking
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'job_application_submitted', {
      job_id: jobId,
      job_title: jobTitle,
      event_category: 'Jobs',
      event_label: `Job Application: ${jobTitle}`
    });
  }
};

// Track scholarship application conversions
export const trackScholarshipApplicationConversion = (scholarshipId, scholarshipTitle) => {
  trackConversion('scholarship_application', null);
  
  // Custom event for detailed tracking
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'scholarship_application_submitted', {
      scholarship_id: scholarshipId,
      scholarship_title: scholarshipTitle,
      event_category: 'Scholarships',
      event_label: `Scholarship Application: ${scholarshipTitle}`
    });
  }
};

// Track user registration conversions
export const trackRegistrationConversion = (userType) => {
  trackConversion('user_registration', null);
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'sign_up', {
      method: 'email',
      user_type: userType,
      event_category: 'Authentication',
      event_label: `User Registration: ${userType}`
    });
  }
};

// Track premium feature conversions (for future monetization)
export const trackPremiumConversion = (featureName, value) => {
  trackConversion('premium_purchase', value, 'USD');
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'purchase', {
      transaction_id: Date.now().toString(),
      value: value,
      currency: 'USD',
      items: [{
        item_id: featureName,
        item_name: featureName,
        category: 'Premium Features',
        quantity: 1,
        price: value
      }]
    });
  }
};

// Track search conversions
export const trackSearchConversion = (searchTerm, searchType, resultsFound) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      search_type: searchType,
      results_found: resultsFound,
      event_category: 'Search',
      event_label: `${searchType}: ${searchTerm}`
    });
  }
};

// Enhanced click tracking for ads
export const trackAdClick = (adSlot, adPosition = '') => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'ad_click', {
      ad_slot: adSlot,
      ad_position: adPosition,
      event_category: 'Advertising',
      event_label: `Ad Click: ${adSlot}`
    });
  }
};

// Track page views with ad context
export const trackAdPageView = (pageName, adSlots = []) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'page_view_with_ads', {
      page_name: pageName,
      ad_slots_present: adSlots.join(','),
      event_category: 'Page Views',
      event_label: `Page with Ads: ${pageName}`
    });
  }
};

// React hook for ad tracking
export const useAdTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize Google Ads on mount
    initGoogleAds();
  }, []);

  useEffect(() => {
    // Track page views for ad optimization
    const pageName = location.pathname;
    trackAdPageView(pageName);
  }, [location]);

  return {
    trackConversion,
    trackJobApplicationConversion,
    trackScholarshipApplicationConversion,
    trackRegistrationConversion,
    trackPremiumConversion,
    trackSearchConversion,
    trackAdClick
  };
};
