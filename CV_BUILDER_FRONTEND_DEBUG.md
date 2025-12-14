# CV Builder Frontend Debug Guide

## Issue Summary
The CV is being generated on the backend, but the frontend is not displaying the generated CV, progress, or todos. The issue appears to be related to authentication or response parsing.

## Recent Changes Made

### 1. Enhanced Logging in cvBuilderService.js
Added comprehensive console logging to track:
- Authentication token presence
- Request parameters
- API call details
- Response status and data structure

### 2. Enhanced Logging in CVBuilder.jsx
Added logging to track:
- API response structure
- State updates (cvContent, progress, todos)
- Success/error handling

### 3. Created Debug Tool
Location: `/talentsphere-frontend/public/cv-debug.js`
- Can be loaded in browser console to test API independently
- Checks token validity
- Tests API endpoints directly

## How to Debug

### Step 1: Login to the Application
1. Open browser to http://localhost:5173
2. Login with test credentials:
   - Email: `john.doe@email.com` OR `jane.smith@email.com`
   - Password: `password123`
3. Navigate to CV Builder page

### Step 2: Open Browser Console
Press F12 or Right-click → Inspect → Console tab

### Step 3: Generate CV and Check Logs
Click "Generate CV" button and watch the console for these logs:

#### Expected Log Sequence:
```
🔧 CV Generation Request: { hasToken: true, ... }
📤 Request body: { style: "professional", ... }
📤 Request URL: /api/cv-builder/quick-generate
📥 Response status: 200 (or error code)
📥 Response headers: { ... }
✅ Response data: { success: true, hasCvContent: true, ... }
🎯 Generate CV response: { success: true, data: { ... } }
✅ Setting CV content and progress...
   - CV content length: XXXX
   - Progress items: X
   - Todos items: X
✅ CV generated successfully!
```

#### If Authentication Fails:
```
📥 Response status: 401
❌ Response error text: {"message":"Authentication token is missing",...}
```
**Solution**: User not logged in or token expired. Login again.

#### If API Error:
```
📥 Response status: 500
❌ Response error text: [error details]
```
**Solution**: Check backend logs for actual error

### Step 4: Use Debug Tool (Optional)
If you want to test the API independently:

1. In browser console, run:
```javascript
// Load debug script
const script = document.createElement('script');
script.src = '/cv-debug.js';
document.head.appendChild(script);
```

2. The script will automatically:
   - Check if you're logged in
   - Decode your JWT token
   - Test the CV generation API
   - Show detailed results

## Common Issues and Solutions

### Issue 1: "Authentication token is missing"
**Symptoms**: 401 error, no token in logs
**Solution**: 
1. Check if user is logged in: `localStorage.getItem('token')` in console
2. If null, login again
3. If exists but still failing, token might be malformed

### Issue 2: "Response success=false"
**Symptoms**: API returns 200 but success=false
**Solution**: Check response.message for details (usually validation error)

### Issue 3: CV generated but not displayed
**Symptoms**: Logs show successful generation but UI doesn't update
**Possible causes**:
1. State not updating: Check if `setCvContent` is called in logs
2. CV content is empty: Check `cv_content length` in logs
3. Rendering issue: Check CVRenderer component

### Issue 4: Progress/Todos not showing
**Symptoms**: CV shows but no progress tracker or todos
**Check**:
1. `Progress items: X` in logs (should be > 0)
2. `Todos items: X` in logs
3. If both are 0, backend might not be returning them

## Debugging Backend Issues

If frontend logs show successful API call but backend has issues:

```bash
# Check backend logs
cd backend
tail -f logs/app.log  # or wherever logs are stored

# Check Gunicorn process
ps aux | grep gunicorn

# Restart backend if needed
pkill -f gunicorn
python src/main.py
```

## Test User Credentials

Database has these test users:
- **Job Seeker 1**: john.doe@email.com / password123
- **Job Seeker 2**: jane.smith@email.com / password123
- **Employer**: hr@techcorp.com / password123
- **Admin**: admin@talentsphere.com / admin123

## Next Steps After Testing

1. **If authentication works but CV doesn't display**:
   - Check CVRenderer component
   - Verify cvContent state is being set
   - Check if CVRenderer expects different data format

2. **If authentication fails**:
   - Verify token is being stored in localStorage after login
   - Check if token_required decorator in backend is working
   - Verify JWT secret key matches between frontend/backend

3. **If API succeeds but response structure is wrong**:
   - Check backend response format in cv_builder.py
   - Ensure response has `success`, `data.cv_content`, `data.progress`, `data.todos`

## Files Modified

1. `/talentsphere-frontend/src/services/cvBuilderService.js` - Added debug logging
2. `/talentsphere-frontend/src/pages/jobseeker/CVBuilder.jsx` - Added response logging
3. `/talentsphere-frontend/public/cv-debug.js` - Created debug tool

## Report Back

After testing, report:
1. What you see in console logs (copy/paste key lines)
2. HTTP status code (401, 200, etc.)
3. Whether token exists in localStorage
4. Any error messages
5. Whether CV content/progress/todos appear in logs but not in UI

This will help identify if it's:
- Authentication issue (token not sent/invalid)
- Backend issue (error generating CV)
- Frontend issue (not parsing response correctly)
- Rendering issue (data received but not displayed)
