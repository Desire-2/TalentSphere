/**
 * Environment configuration utility
 * Centralizes all environment variables and provides type-safe access
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
};

// Email Configuration
export const EMAIL_CONFIG = {
  SUPPORT: import.meta.env.VITE_SUPPORT_EMAIL || 'afritechbridge@yahoo.com',
  CONTACT: import.meta.env.VITE_CONTACT_EMAIL || 'afritechbridge@yahoo.com',
  NOREPLY: import.meta.env.VITE_NOREPLY_EMAIL || 'afritechbridge@yahoo.com',
};

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'TalentSphere',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  ENABLE_API_LOGGING: import.meta.env.VITE_ENABLE_API_LOGGING === 'true',
  HOT_RELOAD: import.meta.env.VITE_HOT_RELOAD === 'true',
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
};

// External Services
export const EXTERNAL_SERVICES = {
  GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
};

// Development helpers
export const isDevelopment = APP_CONFIG.ENVIRONMENT === 'development';
export const isProduction = APP_CONFIG.ENVIRONMENT === 'production';

// Log configuration in development
if (isDevelopment && FEATURE_FLAGS.ENABLE_DEBUG_LOGS) {
  console.group('🔧 Environment Configuration');
  console.log('API Config:', API_CONFIG);
  console.log('Email Config:', EMAIL_CONFIG);
  console.log('App Config:', APP_CONFIG);
  console.log('Feature Flags:', FEATURE_FLAGS);
  console.log('External Services:', EXTERNAL_SERVICES);
  console.groupEnd();
}

// Environment validation
export const validateEnvironment = () => {
  const required = [
    { key: 'VITE_API_BASE_URL', value: API_CONFIG.BASE_URL },
  ];

  const missing = required.filter(({ value }) => !value);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', 
      missing.map(({ key }) => key)
    );
    return false;
  }

  return true;
};

// Export all configs as default
export default {
  API: API_CONFIG,
  EMAIL: EMAIL_CONFIG,
  APP: APP_CONFIG,
  FEATURES: FEATURE_FLAGS,
  EXTERNAL: EXTERNAL_SERVICES,
  isDevelopment,
  isProduction,
  validateEnvironment,
};
