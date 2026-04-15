/**
 * AdCard Component - Default feed ad format
 * Displays sponsored content in card format with tracked metrics
 */

import React, { useEffect } from 'react';
import { trackAdImpression, getAdClickTrackingUrl } from '../../utils/adTracking.js';
import '../../styles/ads.css';

export function AdCard({ ad, placementKey }) {
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
      className="ad-card ad-format-card"
      aria-label={`Open sponsored ad: ${ad.title}`}
    >
      <div className="ad-card-header">
        <span className="ad-badge">Sponsored</span>
        {ad.image_url && (
          <img src={ad.image_url} alt={ad.title} className="ad-card-image" />
        )}
      </div>
      
      <div className="ad-card-content">
        <h3 className="ad-card-title">{ad.title}</h3>
        {sponsorName && <p className="ad-sponsor">By {sponsorName}</p>}
        <p className="ad-card-body">{ad.body_text}</p>
      </div>
      
      <div className="ad-card-footer">
        <span className="ad-card-cta" aria-hidden="true">
          {ad.cta_text || 'Learn More'}
        </span>
      </div>
    </a>
  );
}

export default AdCard;
