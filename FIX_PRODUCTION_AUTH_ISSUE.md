# Fix: Production Authentication Issue on Job Seeker Profile

## Problem
Job seeker profile page works locally but fails in production with:
```
Authentication Required
Please login to access your profile
Failed to load profile.
Your session has expired / token is invalid
```

## Root Cause
The issue was caused by **missing credentials in cross-origin requests**. When the frontend is deployed on a different domain than the backend (e.g., `jobs.afritechbridge.online` vs `talentsphere-0oh4.onrender.com`), the browser doesn't send authentication headers by default for security reasons.

## Solution Applied

### 1. Added Credentials to API Requests
Updated [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L59) to include credentials:
```javascript
const config = {
  mode: 'cors',
  credentials: 'include', // Send auth headers with cross-origin requests
  headers: this.getHeaders(),
  ...options,
};
```

### 2. Updated Backend CORS Configuration
Added the new production frontend domain to CORS_ORIGINS in [backend/.env](backend/.env):
```
CORS_ORIGINS=...,https://talentsphere-0oh4.onrender.com
```

### 3. Updated Production API URL
Configured [.env.production](talentsphere-frontend/.env.production) to use the correct backend:
```
VITE_API_BASE_URL=https://talentsphere-0oh4.onrender.com/api
```

## How It Works

### Local Development
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Uses Vite proxy, so requests appear same-origin
- No credentials needed

### Production
- Frontend: `https://jobs.afritechbridge.online` (or other domain)
- Backend: `https://talentsphere-0oh4.onrender.com`
- Different domains = cross-origin requests
- **Requires** `credentials: 'include'` to send Authorization headers

## Deployment Steps

### For Backend (Render/Hosting Platform)

**CRITICAL**: Update environment variables on your backend hosting:

```bash
CORS_ORIGINS=https://jobs.afritechbridge.online,https://talentsphere.afritechbridge.online,https://talent-sphere-emmz.vercel.app,https://talentsphere-0oh4.onrender.com,http://localhost:5173

# Make sure this includes ALL domains where your frontend is deployed
```

After updating, **restart the backend service**.

### For Frontend (Vercel/Netlify/etc.)

1. Ensure environment variable is set:
   ```
   VITE_API_BASE_URL=https://talentsphere-0oh4.onrender.com/api
   ```

2. Rebuild and deploy:
   ```bash
   cd talentsphere-frontend
   npm run build
   # Deploy dist/ folder
   ```

3. Clear browser cache and test

## Verification

### Test 1: Check CORS Headers
```bash
curl -H "Origin: https://jobs.afritechbridge.online" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  https://talentsphere-0oh4.onrender.com/api/auth/profile -v
```

Should return:
```
Access-Control-Allow-Origin: https://jobs.afritechbridge.online
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: ...Authorization...
```

### Test 2: Test with Token
```bash
# Login to get token first
TOKEN="your_jwt_token"

curl -H "Authorization: Bearer $TOKEN" \
  -H "Origin: https://jobs.afritechbridge.online" \
  https://talentsphere-0oh4.onrender.com/api/auth/profile
```

Should return JSON user profile.

### Test 3: Browser DevTools
1. Open browser console (F12)
2. Go to Network tab
3. Login to your site
4. Navigate to job seeker profile
5. Check the `/api/auth/profile` request:
   - Headers should include `Authorization: Bearer ...`
   - Response should be JSON (200 OK)
   - No CORS errors in console

## Common Issues

### Issue: Still getting 401 Unauthorized
**Causes:**
- Backend CORS_ORIGINS doesn't include your frontend domain
- Backend service not restarted after env change
- Token expired (login again)

**Fix:**
1. Verify CORS_ORIGINS on backend includes exact frontend URL
2. Restart backend service
3. Clear browser cache and login again

### Issue: Token not being sent
**Causes:**
- Frontend not rebuilt after adding `credentials: 'include'`
- Browser blocking third-party cookies

**Fix:**
1. Rebuild frontend
2. Check browser cookie settings (allow third-party cookies for your domains)

### Issue: CORS error in console
**Causes:**
- Backend CORS not configured correctly
- Missing `Access-Control-Allow-Credentials: true` header

**Fix:**
1. Check backend logs for CORS configuration
2. Verify backend main.py has `supports_credentials=True` in CORS setup

## Why This Only Affected Production

**Local Development:**
- Uses Vite dev server with proxy
- Proxy makes backend requests appear same-origin
- Browser sees all requests as coming from `localhost:5173`
- No cross-origin issues

**Production:**
- Frontend and backend on different domains
- Browser enforces CORS restrictions
- Without `credentials: 'include'`, Authorization header is stripped
- Backend receives request without token → 401 Unauthorized

## Files Changed

- ✅ `talentsphere-frontend/src/services/api.js` - Added credentials to requests
- ✅ `backend/.env` - Updated CORS_ORIGINS
- ✅ `talentsphere-frontend/.env.production` - Confirmed correct API URL

## Next Steps

1. **On Backend Hosting (Render):**
   - Update CORS_ORIGINS environment variable
   - Add all frontend domains
   - Restart service

2. **On Frontend Hosting (Vercel/Netlify):**
   - Verify VITE_API_BASE_URL is set correctly
   - Trigger new deployment
   - Test after deployment

3. **Test:**
   - Login on production site
   - Navigate to job seeker profile
   - Should load successfully without auth errors

## Prevention

For future deployments:
1. Always add new frontend domains to backend CORS_ORIGINS
2. Always use `credentials: 'include'` for authenticated cross-origin requests
3. Test authentication on production after any domain changes
4. Document all frontend deployment URLs

## Technical Details

### CORS with Credentials
When using `credentials: 'include'`:
- Browser sends cookies and Authorization headers
- Backend MUST respond with:
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Origin: <specific-origin>` (not `*`)
- Both requirements are met by current Flask-CORS configuration

### Token Flow
1. User logs in → receives JWT token
2. Token stored in localStorage
3. API service reads token from localStorage
4. Adds to Authorization header
5. `credentials: 'include'` ensures header is sent cross-origin
6. Backend validates token
7. Returns user profile

Without `credentials: 'include'`, step 5 fails in production.
