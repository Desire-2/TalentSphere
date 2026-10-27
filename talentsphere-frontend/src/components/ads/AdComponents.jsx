import React from 'react';
import GoogleAds from './GoogleAds.jsx';
import { AD_SLOTS } from '../../config/adSlots';

// Pre-configured ad components for different sections (slots from VITE_AD_SLOT_* env)

// Banner ad for header/top of pages
export const BannerAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.banner}
    adFormat="horizontal"
    className={`w-full ${className}`}
    style={{ minHeight: '90px', ...style }}
  />
);

// Square ad for sidebars
export const SquareAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.square}
    adFormat="rectangle"
    className={className}
    style={{ width: '300px', height: '250px', ...style }}
  />
);

// Responsive ad that adapts to container
export const ResponsiveAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.responsive}
    adFormat="auto"
    className={`w-full ${className}`}
    style={{ minHeight: '200px', ...style }}
    responsive={true}
  />
);

// Mobile banner ad
export const MobileBannerAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.mobileBanner}
    adFormat="banner"
    className={`w-full md:hidden ${className}`}
    style={{ minHeight: '50px', ...style }}
  />
);

// Large rectangle ad for content areas
export const LargeRectangleAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.largeRectangle}
    adFormat="rectangle"
    className={className}
    style={{ width: '336px', height: '280px', ...style }}
  />
);

// Leaderboard ad for top of pages
export const LeaderboardAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.leaderboard}
    adFormat="leaderboard"
    className={`w-full hidden md:block ${className}`}
    style={{ minHeight: '90px', ...style }}
  />
);

// Skyscraper ad for sidebars
export const SkyscraperAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.skyscraper}
    adFormat="vertical"
    className={`hidden lg:block ${className}`}
    style={{ width: '160px', height: '600px', ...style }}
  />
);

// In-article ad for content
export const InArticleAd = ({ className = '', style = {} }) => (
  <div className={`my-8 flex justify-center ${className}`}>
    <GoogleAds
      adSlot={AD_SLOTS.inArticle}
      adFormat="fluid"
      adLayout="in-article"
      style={{ width: '100%', maxWidth: '728px', ...style }}
    />
  </div>
);

// Multiplex ad for related content
export const MultiplexAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.multiplex}
    adFormat="autorelaxed"
    className={`w-full ${className}`}
    style={{ minHeight: '300px', ...style }}
  />
);

// Job listing sponsored ad (Google unit — Google renders its own "Ad" label;
// no custom "Sponsored" wrapper so it stays visually distinct from house ads)
export const JobSponsoredAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot={AD_SLOTS.jobSponsored}
    adFormat="auto"
    className={className}
    style={{ minHeight: '150px', ...style }}
  />
);
