# Production Deployment Quick Fix

## Immediate Actions Required

### 1. Update Backend Environment Variables on Render

Login to Render dashboard and update these environment variables for your backend service:

```
CORS_ORIGINS=https://jobs.afritechbridge.online,https://talentsphere.afritechbridge.online,https://talent-sphere-emmz.vercel.app,http://localhost:5173
```

**After updating, restart the backend service.**

### 2. Verify Backend API URL

Check what URL your frontend is actually deployed with. Based on the error showing `jobs.afritechbridge.online`, update your frontend build configuration:

**If you're using Vercel/Netlify for frontend:**

Create or update environment variables in your hosting dashboard:
```
VITE_API_URL=https://talentsphere-backend.onrender.com
VITE_API_BASE_URL=https://talentsphere-backend.onrender.com/api
```

**If you're using traditional hosting with Nginx/Apache:**

You might be proxying API requests. Check your web server configuration.

### 3. Rebuild Frontend

After updating environment variables in your hosting platform:

```bash
# Trigger a new deployment or manually build:
cd talentsphere-frontend
npm run build

# The dist/ folder should be deployed to your hosting
```

### 4. Clear Browser Cache

After redeployment, clear browser cache or use incognito mode to test.

## Quick Test Commands

### Test if backend is accessible:
```bash
curl https://talentsphere-backend.onrender.com/api/health
```

### Test CORS from your frontend domain:
```bash
curl -H "Origin: https://jobs.afritechbridge.online" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  https://talentsphere-backend.onrender.com/api/auth/profile -v
```

Look for `Access-Control-Allow-Origin: https://jobs.afritechbridge.online` in the response headers.

### Test with a valid token:
```bash
# Login first to get a token, then:
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://talentsphere-backend.onrender.com/api/auth/profile
```

Should return JSON user profile, not HTML.

## What Changed in Your Code

### 1. Enhanced API Error Detection
The API service now detects HTML responses and provides clear error messages:
- ✅ Detects HTML error pages before JSON parsing
- ✅ Shows specific error for 404, CORS, and server issues
- ✅ Logs detailed information for debugging

### 2. Production Environment Documentation
Added comments and alternatives in `.env.production` to clarify configuration options.

## Common Deployment Platforms

### Vercel (Frontend)
1. Go to Project Settings → Environment Variables
2. Add `VITE_API_BASE_URL` = `https://talentsphere-backend.onrender.com/api`
3. Trigger redeploy

### Netlify (Frontend)
1. Site Settings → Build & Deploy → Environment
2. Add `VITE_API_BASE_URL` = `https://talentsphere-backend.onrender.com/api`
3. Trigger redeploy

### Render (Backend)
1. Dashboard → Your Service → Environment
2. Update `CORS_ORIGINS` to include all frontend domains
3. Save changes (auto-restarts)

### cPanel/Traditional Hosting (Frontend + Backend on same server)
If both are on the same server:
1. Use relative paths: `VITE_API_BASE_URL=/api`
2. Configure Nginx/Apache to proxy `/api` to backend
3. No CORS needed if same origin

## Troubleshooting Decision Tree

**Q: Getting "<!doctype html>" error?**
→ Backend is returning HTML error page
→ Check: Is backend URL correct? Is backend running?

**Q: Getting CORS error in console?**
→ Backend doesn't allow requests from your frontend domain
→ Fix: Update CORS_ORIGINS on backend

**Q: Getting 401 Unauthorized?**
→ Token is expired or invalid
→ Fix: Login again to get new token

**Q: Getting 404 Not Found?**
→ API endpoint doesn't exist or URL is wrong
→ Check: Is `/api/auth/profile` available on your backend?

**Q: Network timeout?**
→ Backend is not accessible
→ Check: Backend service status, SSL certificates

## Run Verification Script

We've created a verification script to test your configuration:

```bash
./verify_production_config.sh
```

This will check:
- ✅ Backend accessibility
- ✅ CORS configuration
- ✅ Frontend accessibility
- ✅ API endpoint availability

## Need More Help?

1. Check browser console for exact error
2. Check Network tab to see actual request URL and response
3. Check backend logs on Render dashboard
4. Run the verification script above
5. See detailed guide in `PRODUCTION_API_FIX.md`

## Summary

**The fix requires:**
1. ✅ Updated API service with HTML detection (DONE)
2. ⚠️ Backend CORS must include `https://jobs.afritechbridge.online`
3. ⚠️ Frontend environment must have correct API URL
4. ⚠️ Rebuild and redeploy frontend after env changes
