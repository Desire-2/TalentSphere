/**
 * AdSpotlight Component - Full-width spotlight/hero format
 * Large featured box with hero image, title, body, and CTA
 */

import React, { useEffect } from 'react';
import { trackAdImpression, getAdClickTrackingUrl } from '../../utils/adTracking.js';
import '../../styles/ads.css';

export function AdSpotlight({ ad, placementKey }) {
  useEffect(() => {
    if (ad?.campaign_id && ad?.creative_id) {
      trackAdImpression(ad.campaign_id, ad.creative_id, placementKey);
    }
  }, [ad, placementKey]);

  if (!ad) return null;

  const clickUrl = getAdClickTrackingUrl(ad.campaign_id, ad.creative_id, placementKey, ad.cta_url);

  return (
    <div className="ad-spotlight ad-format-spotlight">
      <div className="ad-spotlight-container">
        {ad.image_url && (
          <div className="ad-spotlight-image-container">
            <img src={ad.image_url} alt={ad.title} className="ad-spotlight-image" />
            <div className="ad-spotlight-overlay"></div>
          </div>
        )}

        <div className="ad-spotlight-content">
          <span className="ad-badge ad-badge-spotlight">Spotlight</span>
          
          <h1 className="ad-spotlight-title">{ad.title}</h1>
          
          <p className="ad-spotlight-body">{ad.body_text}</p>

          <a
            href={clickUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ad-spotlight-cta"
          >
            {ad.cta_text || 'Explore Now'}
            <span className="ad-spotlight-cta-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdSpotlight;
