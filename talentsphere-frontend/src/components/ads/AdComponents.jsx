import React from 'react';
import GoogleAds from './GoogleAds';

// Pre-configured ad components for different sections

// Banner ad for header/top of pages
export const BannerAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot="5974115780" // Replace with your actual ad slot
    adFormat="horizontal"
    className={`w-full ${className}`}
    style={{ minHeight: '90px', ...style }}
  />
);

// Square ad for sidebars
export const SquareAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot="5974115780" // Replace with your actual ad slot
    adFormat="rectangle"
    className={className}
    style={{ width: '300px', height: '250px', ...style }}
  />
);

// Responsive ad that adapts to container
export const ResponsiveAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot="5974115780" // Replace with your actual ad slot
    adFormat="auto"
    className={`w-full ${className}`}
    style={{ minHeight: '200px', ...style }}
    responsive={true}
  />
);

// Mobile banner ad
export const MobileBannerAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot="5974115780" // Replace with your actual ad slot
    adFormat="banner"
    className={`w-full md:hidden ${className}`}
    style={{ minHeight: '50px', ...style }}
  />
);

// Large rectangle ad for content areas
export const LargeRectangleAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot="5974115780" // Replace with your actual ad slot
    adFormat="rectangle"
    className={className}
    style={{ width: '336px', height: '280px', ...style }}
  />
);

// Leaderboard ad for top of pages
export const LeaderboardAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot="5974115780" // Replace with your actual ad slot
    adFormat="leaderboard"
    className={`w-full hidden md:block ${className}`}
    style={{ minHeight: '90px', ...style }}
  />
);

// Skyscraper ad for sidebars
export const SkyscraperAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot="5974115780" // Replace with your actual ad slot
    adFormat="vertical"
    className={`hidden lg:block ${className}`}
    style={{ width: '160px', height: '600px', ...style }}
  />
);

// In-article ad for content
export const InArticleAd = ({ className = '', style = {} }) => (
  <div className={`my-8 flex justify-center ${className}`}>
    <GoogleAds
      adSlot="5974115780" // Replace with your actual ad slot
      adFormat="fluid"
      adLayout="in-article"
      style={{ width: '100%', maxWidth: '728px', ...style }}
    />
  </div>
);

// Multiplex ad for related content
export const MultiplexAd = ({ className = '', style = {} }) => (
  <GoogleAds
    adSlot="5974115780" // Replace with your actual ad slot
    adFormat="autorelaxed"
    className={`w-full ${className}`}
    style={{ minHeight: '300px', ...style }}
  />
);

// Job listing sponsored ad
export const JobSponsoredAd = ({ className = '', style = {} }) => (
  <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
    <div className="text-xs text-blue-600 mb-2 font-medium">Sponsored</div>
    <GoogleAds
      adSlot="5974115780" // Replace with your actual ad slot
      adFormat="auto"
      style={{ minHeight: '150px', ...style }}
    />
  </div>
);
