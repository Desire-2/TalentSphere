import React, { useEffect, useRef, useState } from 'react';
import { CONSENT_EVENT, getAdsConsent } from '../../utils/consent';

// Module-level singleton: inject the AdSense loader script exactly once,
// regardless of how many <GoogleAds> instances mount.
let adsenseScriptInjected = false;
const loadAdSenseScript = (adClient) => {
  if (adsenseScriptInjected) return;
  if (document.querySelector('script[data-ats-adsense]')) {
    adsenseScriptInjected = true;
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-ats-adsense', 'true');
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adClient)}`;
  script.onerror = () => {
    console.warn('Failed to load Google AdSense script');
  };
  document.head.appendChild(script);
  adsenseScriptInjected = true;
};

// Official AdSense queue pattern: pushes are queued on window.adsbygoogle and
// processed by the loader whenever it finishes loading (no timing race).
const queueAdPush = (ins) => {
  if (!ins || ins.dataset.atsPushed === 'true') return;
  ins.dataset.atsPushed = 'true';
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (error) {
    console.warn('Error initializing Google Ad:', error);
    ins.dataset.atsPushed = '';
  }
};

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
  const insRef = useRef(null);
  const [consented, setConsented] = useState(() => getAdsConsent());

  useEffect(() => {
    const onConsent = () => setConsented(getAdsConsent());
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  const active = Boolean(consented && adClient && adSlot);

  useEffect(() => {
    if (!active) return;
    loadAdSenseScript(adClient);
  }, [active, adClient]);

  useEffect(() => {
    if (!active) return;
    // Effect runs after DOM commit, so the <ins> is in place for the queue push.
    queueAdPush(insRef.current);
  }, [active]);

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
    ref: insRef,
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
