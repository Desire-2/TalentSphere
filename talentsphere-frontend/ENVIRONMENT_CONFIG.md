# TalentSphere Frontend Environment Configuration

This document describes the environment configuration for the TalentSphere frontend application.

## Environment Files

The application uses different environment files based on the deployment environment:

### `.env` (Development - Default)
Used during local development with `npm run dev`.
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5001/api
VITE_API_URL=http://localhost:5001
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME=TalentSphere
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_DEBUG_LOGS=true
VITE_ENABLE_API_LOGGING=true
VITE_HOT_RELOAD=true
VITE_DEV_MODE=true

# External Services (optional for development)
# VITE_GOOGLE_ANALYTICS_ID=
# VITE_SENTRY_DSN=
# VITE_STRIPE_PUBLIC_KEY=
```

### `.env.production` (Production)
Used when building for production with `npm run build`.
```bash
# API Configuration (update with your production API URL)
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_API_URL=https://your-api-domain.com
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME=TalentSphere
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Feature Flags (disabled in production for performance)
VITE_ENABLE_DEBUG_LOGS=false
VITE_ENABLE_API_LOGGING=false
VITE_HOT_RELOAD=false
VITE_DEV_MODE=false

# External Services (add your production keys)
# VITE_GOOGLE_ANALYTICS_ID=your-ga-id
# VITE_SENTRY_DSN=your-sentry-dsn
# VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

### `.env.development` (Development - Explicit)
Explicit development configuration (optional, fallback to `.env`).

### `.env.example` (Template)
Template file showing all available environment variables.

## Configuration Structure

Environment variables are centrally managed through `src/config/environment.js`:

```javascript
import config from '@/config/environment.js';

// Access configuration
console.log(config.API.BASE_URL);     // API base URL
console.log(config.APP.NAME);         // App name
console.log(config.FEATURES.DEBUG);   // Feature flags
console.log(config.isDevelopment);    // Environment helpers
```

### Available Configuration Sections

1. **API_CONFIG**: Backend API connection settings
2. **APP_CONFIG**: Application metadata and settings
3. **FEATURE_FLAGS**: Development and production feature toggles
4. **EXTERNAL_SERVICES**: Third-party service integration keys

## Setup Instructions

### 1. Development Setup
```bash
# Copy example file
cp .env.example .env

# Edit with your local backend URL
nano .env

# Start development server
npm run dev
```

### 2. Production Setup
```bash
# Copy and configure production environment
cp .env.example .env.production

# Edit with production URLs and keys
nano .env.production

# Build for production
npm run build
```

### 3. Environment Validation

The application automatically validates environment variables on startup:
- Missing required variables are logged as warnings
- Configuration is displayed in development mode
- Environment health check is available via the config utility

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | `http://localhost:5001/api` | Backend API base URL |
| `VITE_API_URL` | No | `http://localhost:5001` | Backend server URL |
| `VITE_API_TIMEOUT` | No | `30000` | API request timeout (ms) |
| `VITE_APP_NAME` | No | `TalentSphere` | Application name |
| `VITE_APP_VERSION` | No | `1.0.0` | Application version |
| `VITE_APP_ENVIRONMENT` | No | `development` | Environment name |
| `VITE_ENABLE_DEBUG_LOGS` | No | `false` | Enable debug logging |
| `VITE_ENABLE_API_LOGGING` | No | `false` | Enable API request logging |
| `VITE_HOT_RELOAD` | No | `true` | Enable hot module replacement |
| `VITE_DEV_MODE` | No | `false` | Enable development features |

## Build Scripts

### Development
```bash
npm run dev          # Start development server
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build locally
./build-production.sh # Enhanced production build with validation
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `VITE_API_BASE_URL` matches your backend
   - Ensure backend server is running
   - Verify CORS configuration

2. **Environment Variables Not Loading**
   - Ensure variable names start with `VITE_`
   - Check file naming (`.env`, `.env.production`, etc.)
   - Restart development server after changes

3. **Build Errors**
   - Verify all required variables are set
   - Check `.env.production` exists and is configured
   - Review build output for specific errors

### Debug Mode

Enable debug mode for detailed logging:
```bash
# In .env file
VITE_ENABLE_DEBUG_LOGS=true
VITE_ENABLE_API_LOGGING=true
```

This will show:
- Environment configuration on startup
- API request/response details
- Component state changes
- Performance metrics

## Production Deployment

When deploying to production platforms (Vercel, Netlify, etc.):

1. Set environment variables in platform dashboard
2. Use production values for all `VITE_*` variables
3. Disable debug flags for performance
4. Configure external service keys

Example for Vercel:
```bash
vercel env add VITE_API_BASE_URL production
# Enter your production API URL when prompted
```

## Security Notes

- Never commit `.env.production` with real keys
- Use `.env.example` for documentation
- External service keys should be platform-specific
- API URLs should use HTTPS in production
