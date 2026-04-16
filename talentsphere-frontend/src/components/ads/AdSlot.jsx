/**
 * AdSlot Component - Main ad rendering component
 * Fetches ads from backend and renders appropriate format
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdCard from './AdCard.jsx';
import AdBanner from './AdBanner.jsx';
import AdInlineFeed from './AdInlineFeed.jsx';
import AdSpotlight from './AdSpotlight.jsx';
import { initializeAdTracking } from '../../utils/adTracking.js';
import config from '../../config/environment.js';

export function AdSlot({
  placement = 'job_feed_mid',
  context = 'job_listing',
  limit = 2,
  format = null,
  style = {},
  className = '',
}) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch ads from backend
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        placement,
        context,
        limit,
      });

      const apiBaseUrl = config.API.BASE_URL || '/api';
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiBaseUrl}/ads/serve?${params}`,
        {
          headers,
        }
      );

      if (!response.ok) throw new Error('Failed to fetch ads');

      const data = await response.json();
      
      // Filter by requested format if specified
      let filteredAds = data.ads || [];
      if (format && filteredAds.length > 0) {
        filteredAds = filteredAds.filter(ad => ad.ad_format === format);
      }

      setAds(filteredAds);
      initializeAdTracking();
    } catch (error) {
      console.debug('Ad loading error:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [placement, context, limit, format]);

  // Fetch ads from backend
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Render nothing if no ads
  if (!loading && ads.length === 0) {
    return null;
  }

  // Render based on format preference or ad format
  const renderAd = (ad) => {
    const adFormat = format || ad.ad_format;

    switch (adFormat?.toUpperCase()) {
      case 'BANNER_HORIZONTAL':
        return <AdBanner key={ad.id} ad={ad} placementKey={placement} />;
      case 'BANNER_VERTICAL':
        return <AdCard key={ad.id} ad={ad} placementKey={placement} />;
      case 'CARD':
        return <AdCard key={ad.id} ad={ad} placementKey={placement} />;
      case 'INLINE_FEED':
        return <AdInlineFeed key={ad.id} ad={ad} placementKey={placement} />;
      case 'SPONSORED_JOB':
        return <AdInlineFeed key={ad.id} ad={ad} placementKey={placement} />;
      case 'SPOTLIGHT':
        return <AdSpotlight key={ad.id} ad={ad} placementKey={placement} />;
      default:
        return <AdCard key={ad.id} ad={ad} placementKey={placement} />;
    }
  };

  return (
    <div
      className={`ad-slot-container ${className} ${loading ? 'loading' : ''}`}
      style={style}
      data-placement={placement}
      data-context={context}
    >
      {loading ? (
        <div className="ad-slot-loading">
          <div className="ad-loading-skeleton"></div>
        </div>
      ) : (
        ads.map(ad => renderAd(ad))
      )}
    </div>
  );
}

export default AdSlot;
