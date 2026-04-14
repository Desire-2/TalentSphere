/**
 * AdInlineFeed Component - Inline feed ad (looks like job card)
 * Matches job card CSS styling with "Sponsored" badge
 */

import React, { useEffect } from 'react';
import { trackAdImpression, getAdClickTrackingUrl } from '../../utils/adTracking.js';
import '../../../public/css/ads.css';

export function AdInlineFeed({ ad, placementKey }) {
  useEffect(() => {
    if (ad?.campaign_id && ad?.creative_id) {
      trackAdImpression(ad.campaign_id, ad.creative_id, placementKey);
    }
  }, [ad, placementKey]);

  if (!ad) return null;

  const clickUrl = getAdClickTrackingUrl(ad.campaign_id, ad.creative_id, placementKey, ad.cta_url);

  return (
    <div className="ad-inline-feed ad-format-inline-feed job-card">
      <div className="ad-inline-feed-badge-container">
        <span className="ad-badge ad-badge-sponsored">Sponsored</span>
      </div>

      {ad.image_url && (
        <div className="ad-inline-feed-image">
          <img src={ad.image_url} alt={ad.title} />
        </div>
      )}

      <div className="ad-inline-feed-content">
        <h3 className="ad-inline-feed-title">{ad.title}</h3>
        <p className="ad-inline-feed-body">{ad.body_text}</p>

        <div className="ad-inline-feed-footer">
          <a
            href={clickUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ad-inline-feed-cta"
          >
            {ad.cta_text || 'Learn More'}
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdInlineFeed;
