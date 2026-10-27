import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import { initConsentMode, updateConsentMode } from './utils/consentMode.js'
import { getAdPersonalizationConsent, getAdsConsent, getAnalyticsConsent } from './utils/consent.js'

// Consent Mode v2 defaults (denied) must be queued before any Google tag loads,
// then synced with the visitor's stored choice.
initConsentMode()
updateConsentMode({
  ads: getAdsConsent(),
  analytics: getAnalyticsConsent(),
  adPersonalization: getAdPersonalizationConsent(),
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
