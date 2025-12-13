# Production Debugging Checklist

## Current Status
✅ Added comprehensive debugging to identify the authentication issue
✅ Enabled production logging temporarily
✅ Added detailed error messages

## Steps to Diagnose the Issue

### 1. Rebuild and Deploy Frontend
```bash
cd talentsphere-frontend
npm run build
# Deploy the new dist/ folder to your hosting
```

### 2. Test and Collect Debug Information

After deploying, open your production site and:

1. **Open Browser Console** (Press F12)
2. **Login** to your account
3. **Navigate** to the job seeker profile page
4. **Check Console Output** for these logs:

#### Expected Console Output:

**API Configuration:**
```
🌐 Production API Config: {
  API_BASE_URL: "https://talentsphere-0oh4.onrender.com/api",
  APP_ENVIRONMENT: "production"
}
```

**Profile Load:**
```
🔍 Loading profile... {
  hasToken: true/false,
  tokenLength: <number>,
  user: "your@email.com"
}
```

**Token Headers:**
```
🔑 Token found and added to headers: {
  tokenLength: <number>,
  tokenPreview: "eyJ...",
  hasAuthorization: true
}
```

**API Request:**
```
🌐 API Request: {
  method: "GET",
  url: "https://talentsphere-0oh4.onrender.com/api/auth/profile",
  headers: {...},
  ...
}
```

### 3. Analyze the Output

#### Scenario A: No Token Found
```
⚠️ No authentication token found in localStorage
🔍 Loading profile... { hasToken: false, ... }
```

**This means:**
- Token wasn't saved during login
- Login process has an issue

**Fix:**
- Check login functionality
- Verify auth.js is saving token correctly
- Check if localStorage is blocked (privacy settings)

#### Scenario B: Token Found But Not Sent
```
🔑 Token found and added to headers: { hasToken: true, ... }
🌐 API Request: { headers: { ... no Authorization ... } }
```

**This means:**
- Token exists but header not being added
- Issue with getHeaders() logic

**Fix:**
- Already fixed in code, should not happen

#### Scenario C: Request to Wrong URL
```
🌐 API Request: {
  url: "http://localhost:5001/api/auth/profile"  # WRONG!
  # or
  url: "/api/auth/profile"  # WRONG for production!
}
```

**This means:**
- Environment variable not being read
- Build using wrong .env file

**Fix:**
```bash
# Ensure .env.production is being used
npm run build -- --mode production

# Or set env vars in your hosting platform directly:
VITE_API_BASE_URL=https://talentsphere-0oh4.onrender.com/api
```

#### Scenario D: CORS Error
```
Access to fetch at 'https://talentsphere-0oh4.onrender.com/api/auth/profile'
from origin 'https://jobs.afritechbridge.online' has been blocked by CORS policy
```

**This means:**
- Backend CORS not configured for your frontend domain

**Fix:**
- Update backend CORS_ORIGINS on Render
- Add: https://jobs.afritechbridge.online
- Restart backend service

#### Scenario E: 401 Unauthorized
```
❌ API Error Details: {
  status: 401,
  errorMessage: "Token expired" / "Invalid token"
}
```

**This means:**
- Token is invalid or expired
- Backend can't verify the token

**Fix:**
- Login again to get fresh token
- Check backend JWT_SECRET_KEY matches
- Verify token format

### 4. Share Debug Output

After following steps 1-3, share the **exact console output** you see, including:

- 🌐 Production API Config
- 🔍 Loading profile
- 🔑 Token found message (or warning if not found)
- 🌐 API Request details
- Any error messages

This will help identify the exact problem.

## Quick Fixes Based on Common Issues

### If Token Not Being Saved
Check your login flow - look for this in console after login:
```javascript
// Should see in auth.js:
localStorage.setItem('token', response.token);
```

### If Wrong API URL
Your hosting platform needs these environment variables:

**Vercel:**
```bash
# In Project Settings → Environment Variables
VITE_API_BASE_URL=https://talentsphere-0oh4.onrender.com/api
```

**Netlify:**
```bash
# In Site Settings → Build & Deploy → Environment
VITE_API_BASE_URL=https://talentsphere-0oh4.onrender.com/api
```

**Other platforms:**
- Check how they inject environment variables
- May need `netlify.toml`, `vercel.json`, or similar config

### If CORS Error
On Render backend:
1. Go to your backend service
2. Environment tab
3. Add/update:
   ```
   CORS_ORIGINS=https://jobs.afritechbridge.online,https://yourdomain.com
   ```
4. Save (auto-restarts)

## Verification Commands

### Test Backend Health
```bash
curl https://talentsphere-0oh4.onrender.com/api/health
```

### Test CORS
```bash
curl -H "Origin: https://jobs.afritechbridge.online" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  https://talentsphere-0oh4.onrender.com/api/auth/profile -v
```

Should include in response:
```
Access-Control-Allow-Origin: https://jobs.afritechbridge.online
Access-Control-Allow-Credentials: true
```

### Test with Your Token
After logging in, get token from console or localStorage, then:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://talentsphere-0oh4.onrender.com/api/auth/profile
```

Should return JSON user profile.

## Next Actions

1. ✅ Code is updated with debugging
2. ⏳ **You need to**: Rebuild and redeploy frontend
3. ⏳ **You need to**: Check browser console after deployment
4. ⏳ **You need to**: Share console output for further diagnosis

The debug logs will tell us exactly what's failing!
