# CORS Fix - Quick Deployment Guide

## 🚨 Issue Fixed
**Error**: `Access-Control-Allow-Origin header is present on the requested resource`  
**Cause**: CORS_ORIGINS in production didn't include `https://jobs.afritechbridge.online`

---

## ✅ What Was Fixed

### Files Modified:
1. **`backend/.env`** - Removed duplicate domain, organized list
2. **`backend/render.yaml`** - Added all production domains
3. **`backend/.env.template`** - Updated template for consistency

### All Production Domains Now Allowed:
- ✅ `https://jobs.afritechbridge.online` (Primary - was missing!)
- ✅ `https://talentsphere.afritechbridge.online`
- ✅ `https://talent-sphere-emmz.vercel.app`
- ✅ `https://talentsphere-frontend.vercel.app`
- ✅ `https://talentsphere.vercel.app`
- ✅ `https://talentsphere-0oh4.onrender.com`
- ✅ `https://talentsphere-frontend.onrender.com`

---

## 🚀 Deploy Now

### Option 1: Automatic Deployment (Recommended)
```bash
# Commit and push changes
git add backend/.env backend/render.yaml backend/.env.template
git commit -m "fix: Add missing CORS origins for production domains"
git push origin main

# Render will auto-deploy if configured
```

### Option 2: Manual Deployment via Render Dashboard
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select `talentsphere-backend` service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait for deployment to complete (~2-5 minutes)

---

## ✅ Verification Steps

### 1. Check Render Logs (Important!)
After deployment completes:
1. Go to Render Dashboard → Your Backend Service → **Logs**
2. Look for this line on startup:
   ```
   🔒 CORS allowed origins: ['https://jobs.afritechbridge.online', ...]
   ```
3. **Verify** that `https://jobs.afritechbridge.online` is in the list

### 2. Test from Frontend
Open browser console on `https://jobs.afritechbridge.online`:
```javascript
// Test forgot-password endpoint
fetch('https://talentsphere-0oh4.onrender.com/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
})
.then(r => r.json())
.then(d => console.log('✅ CORS Fixed!', d))
.catch(e => console.error('❌ Still blocked:', e));
```

**Expected**: No CORS error (may get validation error, but CORS should work)

### 3. Run Automated Verification (Optional)
```bash
cd backend
./verify_cors.sh

# This tests all domains and endpoints
```

---

## 🔍 Troubleshooting

### CORS Error Still Appears

**Check 1: Render Environment Variables**
1. Render Dashboard → Backend Service → **Environment** tab
2. Find `CORS_ORIGINS` variable
3. Verify it includes: `https://jobs.afritechbridge.online`
4. If not, manually update and redeploy

**Check 2: Frontend URL is Exact**
- ❌ `https://jobs.afritechbridge.online/` (trailing slash)
- ✅ `https://jobs.afritechbridge.online` (no trailing slash)
- ❌ `http://jobs.afritechbridge.online` (http not https)
- ✅ `https://jobs.afritechbridge.online` (https)

**Check 3: Cache Issues**
```bash
# Hard refresh frontend
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or clear browser cache for the site
```

**Check 4: Backend Logs**
```bash
# In Render Dashboard, check logs for:
# - Startup CORS origins list
# - Any CORS-related errors
# - Request origin that's being blocked
```

### Test Individual Endpoint
```bash
# Replace with actual frontend domain
curl -I -X OPTIONS \
  -H "Origin: https://jobs.afritechbridge.online" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://talentsphere-0oh4.onrender.com/api/auth/forgot-password

# Look for these headers in response:
# Access-Control-Allow-Origin: https://jobs.afritechbridge.online
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## 📋 Why This Happened

**Root Cause**: Configuration mismatch between files

1. **`.env` file** had the domain (but was ignored in production)
2. **`render.yaml`** didn't have it (this is what Render uses)
3. Render deployed with incomplete CORS_ORIGINS from `render.yaml`
4. Frontend requests were blocked

**Prevention**: Always update **both** `.env` and `render.yaml` when adding domains.

---

## 📚 Additional Resources

- **Full Documentation**: See `CORS_CONFIGURATION_FIX.md`
- **Verification Script**: Run `backend/verify_cors.sh`
- **Environment Template**: Check `backend/.env.template`

---

## ✅ Checklist

After deployment, verify:
- [ ] Render deployment completed successfully
- [ ] Render logs show CORS origins including `https://jobs.afritechbridge.online`
- [ ] Forgot password form works from `https://jobs.afritechbridge.online`
- [ ] No CORS errors in browser console
- [ ] Other API endpoints work (login, jobs, etc.)

---

## 🎯 Quick Commands

```bash
# Test CORS locally before deployment
cd backend
export CORS_ORIGINS="https://jobs.afritechbridge.online"
python src/main.py

# Verify configuration files
grep CORS_ORIGINS backend/.env
grep -A1 "key: CORS_ORIGINS" backend/render.yaml

# Run verification script (after deployment)
cd backend && ./verify_cors.sh
```

---

## 💡 Future Domain Additions

When adding a new frontend domain:

1. **Update `backend/.env`**:
   ```env
   CORS_ORIGINS=existing-domains,https://new-domain.com
   ```

2. **Update `backend/render.yaml`**:
   ```yaml
   - key: CORS_ORIGINS
     value: "existing-domains,https://new-domain.com"
   ```

3. **Commit, push, and deploy**

4. **Verify** in Render logs and test from new domain

---

## 🆘 Still Need Help?

1. Check Render logs for startup CORS message
2. Verify environment variables in Render Dashboard
3. Run `./verify_cors.sh` for detailed testing
4. Review full guide in `CORS_CONFIGURATION_FIX.md`

**Remember**: Changes only take effect after Render redeploys the backend!
