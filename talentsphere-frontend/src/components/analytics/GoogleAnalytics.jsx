import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CONSENT_EVENT, getAnalyticsConsent } from '../../utils/consent';

// Google Analytics configuration
const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_TRACKING_ID) {
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url, title) => {
  if (!GA_TRACKING_ID || typeof window.gtag === 'undefined') return;

  window.gtag('config', GA_TRACKING_ID, {
    page_title: title,
    page_location: url,
  });
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (!GA_TRACKING_ID || typeof window.gtag === 'undefined') return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track job application events
export const trackJobApplication = (jobId, jobTitle, companyName) => {
  trackEvent('job_application', 'Jobs', `${jobTitle} - ${companyName}`, jobId);
};

// Track scholarship application events
export const trackScholarshipApplication = (scholarshipId, scholarshipTitle) => {
  trackEvent('scholarship_application', 'Scholarships', scholarshipTitle, scholarshipId);
};

// Track search events
export const trackSearch = (searchTerm, searchType, resultsCount) => {
  trackEvent('search', searchType, searchTerm, resultsCount);
};

// Track user interactions
export const trackUserInteraction = (action, category, label) => {
  trackEvent(action, category, label);
};

// React component to automatically track page views (consent-gated)
const GoogleAnalytics = () => {
  const location = useLocation();
  const [consented, setConsented] = useState(() => getAnalyticsConsent());

  useEffect(() => {
    const onConsent = () => setConsented(getAnalyticsConsent());
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (!consented) return;
    initGA();
  }, [consented]);

  useEffect(() => {
    if (!consented) return;
    const url = window.location.origin + location.pathname + location.search;
    const title = document.title;
    trackPageView(url, title);
  }, [consented, location]);

  return null;
};

export default GoogleAnalytics;
