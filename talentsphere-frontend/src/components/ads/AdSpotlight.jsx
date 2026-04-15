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
  const sponsorName = ad.sponsor?.company_name || ad.sponsor?.display_name || ad.company_name || ad.employer_name;

  return (
    <a
      href={clickUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="ad-spotlight ad-format-spotlight"
      aria-label={`Open sponsored ad: ${ad.title}`}
    >
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
          {sponsorName && <p className="ad-sponsor ad-sponsor-spotlight">By {sponsorName}</p>}
          
          <p className="ad-spotlight-body">{ad.body_text}</p>

          <span className="ad-spotlight-cta" aria-hidden="true">
            {ad.cta_text || 'Explore Now'}
            <span className="ad-spotlight-cta-arrow">→</span>
          </span>
        </div>
      </div>
    </a>
  );
}

export default AdSpotlight;
