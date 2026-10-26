import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdsConsent, getAnalyticsConsent, hasAnyConsent, setConsent } from '../../utils/consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(() => !hasAnyConsent());
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ads, setAds] = useState(() => getAdsConsent());
  const [analytics, setAnalytics] = useState(() => getAnalyticsConsent());

  if (!visible) return null;

  const save = (nextAds, nextAnalytics) => {
    setConsent({ ads: nextAds, analytics: nextAnalytics });
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6" role="dialog" aria-label="Cookie consent">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-2xl rounded-xl p-4 sm:p-5">
        <div className="sm:flex sm:items-start sm:gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 mb-1">We use cookies</p>
            <p className="text-sm text-gray-600">
              We use essential cookies to run the site. With your consent we also load Google AdSense
              and Google Analytics to fund the service and understand usage.{' '}
              <Link to="/cookies" className="text-blue-600 underline hover:text-blue-800">Cookie policy</Link>
            </p>

            {detailsOpen && (
              <div className="mt-3 space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ads}
                    onChange={(e) => setAds(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Advertising cookies (Google AdSense)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Analytics cookies (Google Analytics)
                </label>
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
            <button
              type="button"
              onClick={() => save(true, true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => save(false, false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={() => (detailsOpen ? save(ads, analytics) : setDetailsOpen(true))}
              className="px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              {detailsOpen ? 'Save choices' : 'Customize'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
