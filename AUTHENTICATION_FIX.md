# Authentication Fix - 401 Unauthorized Issues

## Problem Summary
The profile components were receiving 401 (UNAUTHORIZED) errors when trying to access `/api/profile/complete-profile` endpoint.

## Root Causes Identified

### 1. Missing PUT Endpoint
- **Issue**: Components were trying to PUT data to `/complete-profile` but only GET method was supported
- **Fix**: Added `@profile_extensions_bp.route('/complete-profile', methods=['PUT'])` endpoint in `backend/src/routes/profile_extensions.py`
- **Location**: Lines 650-730 in profile_extensions.py

### 2. Token Validation Issues
- **Issue**: Frontend may not be properly checking if token exists before making requests
- **Fix**: Added token validation and better error handling in `EnhancedProfile.jsx`
- **Changes**:
  - Check for token existence before API calls
  - Handle 401 responses by clearing auth data and redirecting to login
  - Added console logging for debugging

### 3. Authentication State Management
- **Issue**: User might not be logged in or token expired
- **Fix**: Enhanced error handling and created auth debugging utilities

## Changes Made

### Backend Changes

**File**: `backend/src/routes/profile_extensions.py`
```python
@profile_extensions_bp.route('/complete-profile', methods=['PUT'])
@token_required
@role_required('job_seeker')
def update_complete_profile(current_user):
    """Update job seeker profile fields (professional summary, skills, preferences, etc.)"""
    # Updates professional_title, professional_summary, skills, preferences, etc.
```

### Frontend Changes

**File**: `talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx`
- Added token validation before API calls
- Enhanced 401 error handling
- Added console logging for debugging
- Redirect to login on authentication failure

**File**: `talentsphere-frontend/src/utils/authDebug.js` (NEW)
- Authentication debugging utilities
- Check auth status in browser console with `window.authDebug.checkAuth()`
- Test authentication with `window.authDebug.testAuth()`

## How to Fix 401 Errors

### Step 1: Verify Backend is Running
```bash
cd backend
./start.sh
# Server should be running on port 5001
```

### Step 2: Check Authentication Status
Open browser console (F12) and run:
```javascript
window.authDebug.checkAuth()
```

Expected output if logged in:
```
🔐 Authentication Status
Token exists: true
Token length: 200+
User data exists: true
User: { id: X, email: "...", role: "job_seeker", ... }
```

### Step 3: Test Backend Connection
```javascript
window.authDebug.testAuth()
```

### Step 4: If Token is Missing or Invalid
**Option A: Login Again**
1. Navigate to `/login`
2. Login with your credentials
3. Return to profile page

**Option B: Clear and Refresh** (in browser console)
```javascript
window.authDebug.clearAndRedirect()
```

## Debugging Commands

### Backend API Test
```bash
# Get a token by logging in
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token to test endpoint
curl http://localhost:5001/api/profile/complete-profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Frontend Debug
```javascript
// In browser console (F12)

// 1. Check if token exists
console.log('Token:', localStorage.getItem('token'));

// 2. Check user data
console.log('User:', JSON.parse(localStorage.getItem('user')));

// 3. Run full auth check
window.authDebug.checkAuth();

// 4. Test backend connection
await window.authDebug.testAuth();
```

## Common Solutions

### Issue: "Token is missing"
**Solution**: User is not logged in
```javascript
// Clear old data and login again
localStorage.clear();
window.location.href = '/login';
```

### Issue: "Invalid token" or "Token expired"
**Solution**: Token has expired
```javascript
// Clear and re-login
window.authDebug.clearAndRedirect();
```

### Issue: "405 METHOD NOT ALLOWED"
**Solution**: Check backend server has the latest code with PUT endpoint
```bash
cd backend
git pull  # or verify you have the latest code
./start.sh  # restart server
```

### Issue: Profile loads but updates fail
**Solution**: 
1. Check browser console for specific error
2. Verify PUT endpoint exists: `curl -X OPTIONS http://localhost:5001/api/profile/complete-profile`
3. Check CORS settings in backend

## Verification Steps

### 1. Verify Backend Endpoint
```bash
# Should return: {"error":"Token is missing"}
curl http://localhost:5001/api/profile/complete-profile

# Should return: 200 OK with profile data (replace TOKEN)
curl http://localhost:5001/api/profile/complete-profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Verify Frontend Auth
- Open `/profile` page
- Check browser console (F12) for:
  - ✅ "Token exists: true"
  - ✅ No 401 errors
  - ❌ If seeing "Token exists: false" → Login required

### 3. Verify Components
- Try editing Professional Summary → Should save without errors
- Try editing Preferences → Should save without errors
- Check Network tab (F12) for successful PUT requests (200 status)

## Prevention

To avoid future auth issues:

1. **Always check token before API calls**
   ```javascript
   const token = localStorage.getItem('token');
   if (!token) {
     navigate('/login');
     return;
   }
   ```

2. **Handle 401 responses globally**
   ```javascript
   if (response.status === 401) {
     localStorage.clear();
     navigate('/login');
   }
   ```

3. **Use authDebug in development**
   ```javascript
   // Add to components during development
   useEffect(() => {
     window.authDebug?.checkAuth();
   }, []);
   ```

## Status

✅ **FIXED**: PUT endpoint added for `/complete-profile`
✅ **IMPROVED**: Enhanced error handling in frontend
✅ **ADDED**: Authentication debugging utilities
⚠️  **REQUIRES**: User must be logged in with valid token

## Testing Checklist

- [ ] Backend server running on port 5001
- [ ] User logged in with valid token
- [ ] `window.authDebug.checkAuth()` shows authenticated
- [ ] Profile page loads without 401 errors
- [ ] Can update Professional Summary
- [ ] Can update Skills
- [ ] Can update Preferences
- [ ] Can add/edit/delete work experiences
- [ ] Can add/edit/delete certifications
- [ ] No console errors in browser

## Support

If issues persist:
1. Check backend logs: `tail -f backend/logs/app.log`
2. Check frontend console: Press F12 → Console tab
3. Run: `window.authDebug.testAuth()` and share output
4. Verify backend has latest code with PUT endpoint
