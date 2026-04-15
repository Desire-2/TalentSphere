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
  const sponsorName = ad.sponsor?.company_name || ad.sponsor?.display_name || ad.company_name || ad.employer_name;

  return (
    <a
      href={clickUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="ad-banner ad-format-banner-horizontal"
      aria-label={`Open sponsored ad: ${ad.title}`}
    >
      {ad.image_url && (
        <div className="ad-banner-image">
          <img src={ad.image_url} alt={ad.title} />
        </div>
      )}
      
      <div className="ad-banner-content">
        <span className="ad-badge ad-badge-banner">Ad</span>
        <h2 className="ad-banner-title">{ad.title}</h2>
        {sponsorName && <p className="ad-sponsor ad-sponsor-banner">By {sponsorName}</p>}
        <p className="ad-banner-body">{ad.body_text}</p>
        
        <span className="ad-banner-cta" aria-hidden="true">
          {ad.cta_text || 'Learn More'}
        </span>
      </div>
    </a>
  );
}

export default AdBanner;
