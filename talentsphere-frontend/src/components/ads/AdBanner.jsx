/**
 * AdBanner Component - Horizontal banner format
 * Full-width banner with image, title, body, and CTA
 */

import React, { useEffect } from 'react';
import { trackAdImpression, getAdClickTrackingUrl } from '../../utils/adTracking.js';
import '../../styles/ads.css';

export function AdBanner({ ad, placementKey }) {
  useEffect(() => {
    if (ad?.campaign_id && ad?.creative_id) {
      trackAdImpression(ad.campaign_id, ad.creative_id, placementKey);
    }
  }, [ad, placementKey]);

  if (!ad) return null;

  const clickUrl = getAdClickTrackingUrl(ad.campaign_id, ad.creative_id, placementKey, ad.cta_url);

  return (
    <div className="ad-banner ad-format-banner-horizontal">
      {ad.image_url && (
        <div className="ad-banner-image">
          <img src={ad.image_url} alt={ad.title} />
        </div>
      )}
      
      <div className="ad-banner-content">
        <span className="ad-badge ad-badge-banner">Ad</span>
        <h2 className="ad-banner-title">{ad.title}</h2>
        <p className="ad-banner-body">{ad.body_text}</p>
        
        <a
          href={clickUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ad-banner-cta"
        >
          {ad.cta_text || 'Learn More'}
        </a>
      </div>
    </div>
  );
}

export default AdBanner;
