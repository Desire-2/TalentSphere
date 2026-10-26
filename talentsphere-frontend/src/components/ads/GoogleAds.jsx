import React, { useEffect, useState } from 'react';
import { CONSENT_EVENT, getAdsConsent } from '../../utils/consent';

const GoogleAds = ({
  adSlot,
  adFormat = 'auto',
  adLayout = '',
  adLayoutKey = '',
  style = {},
  className = '',
  responsive = true,
  adTest = import.meta.env.MODE === 'development' ? 'on' : 'off'
}) => {
  const adClient = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
  const [consented, setConsented] = useState(() => getAdsConsent());

  useEffect(() => {
    const onConsent = () => setConsented(getAdsConsent());
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (!consented || !adClient) return;

    // Load Google AdSense script if not already loaded
    if (!window.adsbygoogle) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.crossOrigin = 'anonymous';
      script.onerror = () => {
        console.warn('Failed to load Google AdSense script');
      };
      document.head.appendChild(script);
    }

    const initializeAd = () => {
      try {
        if (window.adsbygoogle && adClient && adSlot) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.warn('Error initializing Google Ad:', error);
      }
    };

    const timer = setTimeout(initializeAd, 100);
    return () => clearTimeout(timer);
  }, [consented, adClient, adSlot]);

  // Don't render without client/slot, or before ad consent
  if (!adClient || !adSlot || !consented) {
    return import.meta.env.MODE === 'development' && adClient && adSlot && !consented ? (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 p-4 text-center text-gray-500 ${className}`} style={style}>
        <div className="text-sm">Ad placeholder (awaiting cookie consent)</div>
        <div className="text-xs">Slot: {adSlot}</div>
      </div>
    ) : null;
  }

  const adProps = {
    className: `adsbygoogle ${className}`,
    style: { display: 'block', ...style },
    'data-ad-client': adClient,
    'data-ad-slot': adSlot,
    'data-ad-format': adFormat,
    'data-ad-test': adTest,
    ...(adLayout && { 'data-ad-layout': adLayout }),
    ...(adLayoutKey && { 'data-ad-layout-key': adLayoutKey }),
    ...(responsive && { 'data-full-width-responsive': 'true' })
  };

  return <ins {...adProps} />;
};

export default GoogleAds;
