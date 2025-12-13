# API Configuration Fix for Production Deployment

## Problem
The deployed frontend at `jobs.afritechbridge.online` is receiving HTML error pages instead of JSON responses from the API, causing the error:
```
Failed to load profile: SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

## Root Causes
1. **CORS Configuration**: The backend may not include the frontend domain in CORS_ORIGINS
2. **API URL Mismatch**: Frontend may be using incorrect API endpoint
3. **Network/Proxy Issues**: Frontend domain may not be properly configured to reach backend

## Solutions Implemented

### 1. Enhanced Error Detection in API Service
Updated [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js) to:
- Detect HTML responses before attempting JSON parsing
- Provide clear error messages for different scenarios:
  - 404: API endpoint not found
  - CORS errors: Network configuration issues
  - Server errors: Backend misconfiguration

### 2. Updated Production Environment Variables
Modified [talentsphere-frontend/.env.production](talentsphere-frontend/.env.production) to clarify API configuration options.

### 3. Deployment Configuration Steps

#### For Backend (Render/Your Hosting)

**Option A: If frontend and backend are on different domains**

Set the following environment variables in your backend hosting:

```bash
# In Render dashboard or your hosting platform's environment variables:
CORS_ORIGINS=https://jobs.afritechbridge.online,https://talentsphere.afritechbridge.online,https://talent-sphere-emmz.vercel.app,http://localhost:5173,http://localhost:5174

# Other required variables
DATABASE_URL=your_postgresql_url
JWT_SECRET_KEY=your_secret_key
SENDER_EMAIL=afritechbridge@yahoo.com
SENDER_PASSWORD=your_email_password
```

**Option B: If using a proxy/same domain setup**

If `jobs.afritechbridge.online` serves both frontend and proxies `/api` to backend, ensure your web server (Nginx/Apache) is configured to proxy API requests.

#### For Frontend Deployment

**Update the production build to use correct API URL:**

**Option 1: Different domains (recommended for Vercel/Netlify)**
```bash
# .env.production
VITE_API_URL=https://talentsphere-backend.onrender.com
VITE_API_BASE_URL=https://talentsphere-backend.onrender.com/api
```

**Option 2: Same domain with proxy**
```bash
# .env.production
VITE_API_URL=/api
VITE_API_BASE_URL=/api
```

### 4. Verify Configuration

#### Test Backend CORS:
```bash
# Test if backend accepts requests from your frontend domain
curl -H "Origin: https://jobs.afritechbridge.online" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  https://talentsphere-backend.onrender.com/api/auth/profile
```

Expected response should include:
```
Access-Control-Allow-Origin: https://jobs.afritechbridge.online
Access-Control-Allow-Credentials: true
```

#### Test API Endpoint:
```bash
# Get a valid token first by logging in
TOKEN="your_jwt_token_here"

# Test the profile endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://talentsphere-backend.onrender.com/api/auth/profile
```

Should return JSON, not HTML.

### 5. Rebuild and Redeploy

After updating environment variables:

```bash
# Frontend
cd talentsphere-frontend
npm run build

# Deploy the dist/ folder to your hosting (Vercel/Netlify/etc.)

# Backend  
# Restart your backend service on Render to pick up new CORS_ORIGINS
```

## Debugging Steps

1. **Check browser console** for exact error messages
2. **Verify API URL** in browser Network tab - what URL is actually being called?
3. **Check CORS headers** in Network tab response headers
4. **Verify backend logs** for incoming requests
5. **Test with curl** to isolate frontend vs backend issues

## Common Issues

### Issue: Still getting HTML responses
- **Cause**: Backend URL is wrong or unreachable
- **Fix**: Verify `VITE_API_BASE_URL` in your build matches actual backend URL

### Issue: CORS errors in console
- **Cause**: Backend CORS_ORIGINS doesn't include frontend domain
- **Fix**: Update backend environment variable and restart

### Issue: 401 Unauthorized
- **Cause**: Token expired or not being sent
- **Fix**: Login again to get fresh token

### Issue: Network errors
- **Cause**: Backend is down or SSL certificate issues
- **Fix**: Check backend service status and SSL configuration

## Quick Verification Checklist

- [ ] Backend CORS_ORIGINS includes `https://jobs.afritechbridge.online`
- [ ] Frontend .env.production has correct VITE_API_BASE_URL
- [ ] Backend service is running and accessible
- [ ] Frontend build uses production environment variables
- [ ] Browser can reach backend URL (test in new tab)
- [ ] Authentication token is valid and being sent

## Current Configuration

Based on your setup:
- **Frontend Domain**: `jobs.afritechbridge.online`
- **Backend Domain**: `talentsphere-backend.onrender.com` (assumed)
- **Backend CORS** already includes `https://jobs.afritechbridge.online` in `.env`

**Recommended Action**: 
1. Verify the backend is deployed with the CORS_ORIGINS from `.env`
2. Rebuild frontend with production environment
3. Clear browser cache and test again
