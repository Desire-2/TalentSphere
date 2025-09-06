import React, { useEffect } from 'react';

const GoogleAds = ({ 
  adSlot, 
  adFormat = 'auto', 
  adLayout = '',
  adLayoutKey = '',
  style = {},
  className = '',
  responsive = true,
  adTest = process.env.NODE_ENV === 'development' ? 'on' : 'off'
}) => {
  const adClient = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;

  useEffect(() => {
    // Load Google AdSense script if not already loaded
    if (!window.adsbygoogle && adClient) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.crossOrigin = 'anonymous';
      
      // Add error handling
      script.onerror = () => {
        console.warn('Failed to load Google AdSense script');
      };
      
      document.head.appendChild(script);
    }

    // Initialize ad after script loads
    const initializeAd = () => {
      try {
        if (window.adsbygoogle && adClient && adSlot) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.warn('Error initializing Google Ad:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeAd, 100);
    
    return () => clearTimeout(timer);
  }, [adClient, adSlot]);

  // Don't render if no ad client ID
  if (!adClient || !adSlot) {
    return process.env.NODE_ENV === 'development' ? (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 p-4 text-center text-gray-500 ${className}`} style={style}>
        <div className="text-sm">Google Ad Placeholder</div>
        <div className="text-xs">Slot: {adSlot}</div>
        <div className="text-xs">Set VITE_GOOGLE_ADS_CLIENT_ID in .env</div>
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
