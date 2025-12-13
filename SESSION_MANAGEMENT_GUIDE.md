# Session Management System - Complete Guide

## Overview

The TalentSphere frontend now includes a comprehensive session management system that handles user authentication state, automatic token refresh, session expiration detection, and provides user-friendly warnings when sessions are about to expire.

## Features Implemented

### 1. **Session Manager Hook** (`useSessionManager.js`)
A custom React hook that provides:
- ✅ Automatic session validation at configurable intervals
- ✅ Token refresh before expiration
- ✅ Activity tracking to prevent unnecessary API calls
- ✅ Session timeout detection
- ✅ Auto-logout on session expiration
- ✅ Route-based session validation
- ✅ Custom event handlers for session lifecycle events

### 2. **Enhanced Auth Service** (`auth.js`)
Extended authentication service with:
- ✅ `validateSession()` - Validates current JWT token
- ✅ `refreshSession()` - Refreshes authentication token
- ✅ `getTokenExpiration()` - Extracts expiration time from JWT
- ✅ `isTokenExpired()` - Checks if token is expired or about to expire

### 3. **Enhanced Auth Store** (`authStore.js`)
Updated Zustand store with:
- ✅ `validateSession()` - Store-level session validation
- ✅ `refreshSession()` - Store-level token refresh
- ✅ `isTokenExpired()` - Check token expiration status
- ✅ `getTokenExpiration()` - Get token expiration timestamp

### 4. **Enhanced API Service** (`api.js`)
Improved API interceptor with:
- ✅ Automatic detection of 401 Unauthorized responses
- ✅ Session expiration event emission
- ✅ Smart redirect with return path preservation
- ✅ Clear error messages for expired sessions

### 5. **Layout Components Integration**
All layout components now include session management:
- ✅ `Layout.jsx` - Main layout with session monitoring
- ✅ `AdminLayout.jsx` - Admin panel with frequent validation (3 min intervals)
- ✅ `ExternalAdminLayout.jsx` - External admin with frequent validation
- ✅ `Header.jsx` - Enhanced with session status indicators

### 6. **User Interface Enhancements**
Visual feedback for users:
- ✅ Toast notifications for session warnings (5 minutes before expiry)
- ✅ Toast notifications for session expiration
- ✅ Session status indicator in user dropdown menu
- ✅ Color-coded status (green=active, yellow=warning, red=critical)
- ✅ Real-time countdown of remaining session time

## Architecture

### Session Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Activity                         │
│         (Mouse, Keyboard, Scroll, Touch)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              useSessionManager Hook                      │
│  • Tracks last activity timestamp                       │
│  • Validates session every 5 minutes (default)          │
│  • Checks for token refresh every 10 minutes            │
│  • Validates on route changes                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Auth Store                              │
│  • validateSession() → calls auth service               │
│  • refreshSession() → refreshes JWT token               │
│  • Updates state on success/failure                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Auth Service                            │
│  • Validates token with backend API                     │
│  • Refreshes token via /auth/refresh-token              │
│  • Updates localStorage                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API Service                            │
│  • Intercepts 401 responses                             │
│  • Emits 'session-expired' event                        │
│  • Redirects to login with return path                  │
└─────────────────────────────────────────────────────────┘
```

## Configuration Options

### useSessionManager Options

```javascript
useSessionManager({
  validateInterval: 5 * 60 * 1000,      // Check every 5 minutes
  refreshBeforeExpiry: 10 * 60 * 1000,  // Refresh 10 min before expiry
  sessionTimeout: 24 * 60 * 60 * 1000,  // 24 hours timeout
  enableActivityTracking: true,          // Track user activity
  onSessionExpired: () => {},            // Custom handler
  onSessionRefreshed: () => {},          // Custom handler
})
```

### Current Implementation

**Main Layout** (`Layout.jsx`)
```javascript
useSessionManager({
  onSessionExpired: () => console.log('🔒 Session expired in main layout'),
  onSessionRefreshed: () => console.log('🔄 Session refreshed in main layout')
});
```

**Admin Layouts** (`AdminLayout.jsx`, `ExternalAdminLayout.jsx`)
```javascript
useSessionManager({
  onSessionExpired: () => console.log('🔒 Admin session expired'),
  onSessionRefreshed: () => console.log('🔄 Admin session refreshed'),
  validateInterval: 3 * 60 * 1000, // Check every 3 minutes (more frequent)
});
```

## User Experience Features

### 1. Session Expiration Warnings
- **5 minutes before expiry**: Yellow warning toast
- **Message**: "Your session will expire in X minute(s). Please save your work."
- **Duration**: 10 seconds (longer to ensure user sees it)
- **Icon**: Alert circle

### 2. Session Expired Notification
- **On expiration**: Red error toast
- **Message**: "Your session has expired. Please login again."
- **Duration**: 5 seconds
- **Action**: Auto-redirect to login with return URL

### 3. Session Status Indicator (Dropdown Menu)
- **Green badge**: Session active (>2 hours remaining)
- **Yellow badge**: Warning (5-30 minutes remaining)
- **Red badge**: Critical (<5 minutes remaining)
- **Display**: Shows hours/minutes remaining
- **Updates**: Real-time countdown

## API Endpoints Required

The session management system requires the following backend endpoints:

### 1. Token Verification
```
POST /api/auth/verify-token
Body: { "token": "jwt_token_here" }
Response: { "valid": true/false }
```

### 2. Token Refresh
```
POST /api/auth/refresh-token
Headers: { "Authorization": "Bearer jwt_token_here" }
Response: { 
  "token": "new_jwt_token",
  "user": { user_data }
}
```

### 3. Automatic 401 Handling
All API endpoints should return:
```
Status: 401 Unauthorized
Body: { 
  "error": "Token expired" 
}
```

## Usage Examples

### Basic Usage in Components

```javascript
import { useSessionManager } from '@/hooks/useSessionManager';

function MyComponent() {
  const { isSessionValid, validateNow, refreshNow } = useSessionManager();
  
  // Use session status
  if (!isSessionValid) {
    return <div>Please login</div>;
  }
  
  // Manual validation
  const handleValidate = async () => {
    await validateNow();
  };
  
  // Manual refresh
  const handleRefresh = async () => {
    await refreshNow();
  };
  
  return <div>Protected content</div>;
}
```

### Custom Session Handlers

```javascript
useSessionManager({
  onSessionExpired: () => {
    // Save user's work
    saveFormData();
    // Show custom message
    showCustomNotification('Session expired. Data has been saved.');
  },
  onSessionRefreshed: () => {
    // Log analytics
    logEvent('session_refreshed');
  }
});
```

## Activity Tracking

The session manager tracks the following user activities:
- Mouse clicks (`mousedown`)
- Keyboard input (`keydown`)
- Scrolling (`scroll`)
- Touch events (`touchstart`)

Activity tracking prevents unnecessary token refreshes when the user is not actively using the application.

## Session Lifecycle

### 1. Initial Load
```
User opens app
  → Layout initializes auth from localStorage
  → useSessionManager starts monitoring
  → Validates session immediately
  → Sets up periodic checks
```

### 2. Active Session
```
User is active
  → Activity events update lastActivity timestamp
  → Periodic validation (every 5 min)
  → Token refresh check (every 10 min)
  → If active recently → refresh token
  → Update UI with session status
```

### 3. Session Warning
```
Token expires in <5 min
  → Show warning toast
  → Update status indicator to yellow/red
  → Continue monitoring
```

### 4. Session Expiration
```
Token expired
  → API call returns 401
  → Emit 'session-expired' event
  → Show error toast
  → Clear localStorage
  → Redirect to login with returnTo param
```

### 5. Route Change
```
User navigates to new route
  → useSessionManager validates session
  → If invalid → logout and redirect
  → If valid → continue
```

## Testing the Session Management

### Manual Testing Checklist

1. ✅ **Login and verify session indicator appears**
   - Login as any user
   - Open user dropdown menu
   - Verify green session status badge

2. ✅ **Test automatic validation**
   - Wait for validation interval (5 minutes)
   - Check console logs for validation messages
   - Verify no errors

3. ✅ **Test session warning**
   - Modify token expiration to expire soon
   - Verify warning toast appears at 5-minute mark
   - Check status indicator turns yellow/red

4. ✅ **Test session expiration**
   - Let session expire completely
   - Make any API call
   - Verify error toast appears
   - Verify redirect to login

5. ✅ **Test activity tracking**
   - Login and remain active
   - Observe token refresh in network tab
   - Verify refresh happens periodically

6. ✅ **Test route-based validation**
   - Navigate between routes while logged in
   - Check console for validation on route change
   - Verify smooth navigation

## Troubleshooting

### Issue: Session expires too quickly
**Solution**: Check JWT expiration time in backend. Default should be 24 hours.

### Issue: Token refresh not working
**Solution**: 
- Verify `/api/auth/refresh-token` endpoint exists
- Check that endpoint accepts Authorization header
- Verify backend returns new token in response

### Issue: Toast notifications not appearing
**Solution**: 
- Verify Sonner toast provider is in root component
- Check browser console for errors
- Ensure `toast` import is from 'sonner'

### Issue: Session indicator shows wrong time
**Solution**: 
- Verify JWT token has 'exp' field
- Check token decoding in `getTokenExpiration()`
- Ensure backend uses standard JWT format

### Issue: Validation happens too frequently
**Solution**: Adjust `validateInterval` in useSessionManager options

## Security Considerations

1. **Token Storage**: Tokens stored in localStorage (consider HttpOnly cookies for production)
2. **Auto-refresh**: Only refreshes when user is active
3. **Validation**: Regular validation prevents token theft exploitation
4. **Clear on logout**: All auth data cleared from localStorage
5. **Return URL**: Preserves intended destination after re-login

## Performance Impact

- **Memory**: Minimal (~10KB for hook and state)
- **CPU**: Negligible (validation every 5 minutes)
- **Network**: 
  - Validation: ~1 request per 5 minutes
  - Refresh: ~1 request per 10 minutes (when active)
  - Total: ~2-3 requests per 10 minutes

## Future Enhancements

Potential improvements for future versions:

1. **Token Renewal UI**: Add manual "Extend Session" button
2. **Idle Logout**: Auto-logout after X minutes of inactivity
3. **Multi-tab Sync**: Sync session across browser tabs
4. **Remember Me**: Extended session for "remember me" option
5. **Session Analytics**: Track session duration and activity patterns
6. **Biometric Re-auth**: Quick re-authentication with fingerprint/face
7. **Progressive Warnings**: Multiple warnings at 15, 10, 5 minutes

## Summary

The session management system provides a robust, user-friendly solution for handling authentication state in the TalentSphere application. It combines automatic validation, smart token refresh, activity tracking, and clear user feedback to create a seamless experience while maintaining security.

Key benefits:
- ✅ No unexpected logouts during active use
- ✅ Clear warnings before session expires
- ✅ Automatic token refresh for active users
- ✅ Smooth UX with visual feedback
- ✅ Configurable for different use cases
- ✅ Minimal performance impact
- ✅ Works across all layout types

The system is production-ready and tested across the main layout, admin panel, and external admin panel.
