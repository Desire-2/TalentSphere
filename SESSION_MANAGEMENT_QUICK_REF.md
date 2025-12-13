# Session Management - Quick Reference

## Quick Start

### For New Components

Add session management to any layout component:

```javascript
import { useSessionManager } from '@/hooks/useSessionManager';

function MyLayout() {
  useSessionManager(); // Uses default configuration
  
  return (
    <div>
      {/* Your layout content */}
    </div>
  );
}
```

### Custom Configuration

```javascript
useSessionManager({
  validateInterval: 3 * 60 * 1000,      // Check every 3 minutes
  onSessionExpired: () => {
    // Custom handler
  },
  onSessionRefreshed: () => {
    // Custom handler  
  }
});
```

## Auth Store Methods

```javascript
import { useAuthStore } from '@/stores/authStore';

const { 
  validateSession,      // Validate current session
  refreshSession,       // Refresh JWT token
  isTokenExpired,       // Check if token expired
  getTokenExpiration    // Get expiration timestamp
} = useAuthStore();

// Validate session
const isValid = await validateSession();

// Refresh token
const refreshed = await refreshSession();

// Check expiration (with 5 min buffer)
const expired = isTokenExpired(5);

// Get expiration time
const expTime = getTokenExpiration(); // milliseconds
```

## Auth Service Functions

```javascript
import { authService } from '@/services/auth';

// Validate session
const isValid = await authService.validateSession();

// Refresh session
const success = await authService.refreshSession();

// Check expiration
const expired = authService.isTokenExpired(5); // buffer in minutes

// Get expiration
const expTime = authService.getTokenExpiration();
```

## Session Events

Listen for session expiration:

```javascript
useEffect(() => {
  const handleSessionExpired = (event) => {
    console.log('Session expired:', event.detail.message);
    // Handle session expiration
  };

  window.addEventListener('session-expired', handleSessionExpired);
  return () => window.removeEventListener('session-expired', handleSessionExpired);
}, []);
```

## Toast Notifications

```javascript
import { toast } from 'sonner';

// Warning toast
toast.warning('Session Expiring', {
  description: 'Your session will expire soon',
  duration: 10000,
});

// Error toast
toast.error('Session Expired', {
  description: 'Please login again',
  duration: 5000,
});

// Success toast
toast.success('Session Refreshed', {
  description: 'Your session has been extended',
});
```

## Configuration Presets

### Standard User Layout
```javascript
useSessionManager(); // Default: 5 min validation
```

### Admin Panels
```javascript
useSessionManager({
  validateInterval: 3 * 60 * 1000, // More frequent
});
```

### Background Tasks
```javascript
useSessionManager({
  enableActivityTracking: false, // Disable activity tracking
});
```

## Common Patterns

### Manual Session Check Before Critical Action

```javascript
const handleCriticalAction = async () => {
  const isValid = await validateSession();
  
  if (!isValid) {
    toast.error('Session expired', {
      description: 'Please login again'
    });
    navigate('/login');
    return;
  }
  
  // Proceed with action
  await performCriticalAction();
};
```

### Extend Session on User Request

```javascript
const handleExtendSession = async () => {
  const refreshed = await refreshSession();
  
  if (refreshed) {
    toast.success('Session extended successfully');
  } else {
    toast.error('Failed to extend session');
  }
};
```

### Check Session Status

```javascript
const SessionStatus = () => {
  const { getTokenExpiration } = useAuthStore();
  const expiration = getTokenExpiration();
  
  if (!expiration) return null;
  
  const timeLeft = expiration - Date.now();
  const minutesLeft = Math.ceil(timeLeft / 60000);
  
  return <div>Session expires in {minutesLeft} minutes</div>;
};
```

## Implementation Checklist

When adding session management to a new layout:

- [x] Import `useSessionManager` hook
- [x] Call hook in component body
- [x] Configure options if needed
- [x] Add custom handlers if required
- [x] Test session expiration flow
- [x] Verify toast notifications appear
- [x] Check console logs for validation

## Files Modified

1. **Created**:
   - `src/hooks/useSessionManager.js` - Session management hook

2. **Enhanced**:
   - `src/services/auth.js` - Session validation methods
   - `src/services/api.js` - 401 error handling
   - `src/stores/authStore.js` - Session state management
   - `src/components/layout/Header.jsx` - Session UI indicators
   - `src/components/layout/Layout.jsx` - Session monitoring
   - `src/components/layout/AdminLayout.jsx` - Session monitoring
   - `src/components/layout/ExternalAdminLayout.jsx` - Session monitoring

## Troubleshooting

**Issue**: Session manager not working
- Check if hook is called in component
- Verify backend endpoints exist
- Check console for errors

**Issue**: Toasts not showing
- Verify ToastProvider in root
- Import toast from 'sonner'
- Check browser console

**Issue**: False session expiration
- Verify JWT format in backend
- Check token expiration time
- Verify system clock sync

## Backend Requirements

Ensure these endpoints exist:

```
POST /api/auth/verify-token
POST /api/auth/refresh-token
```

Both should accept JWT in Authorization header and return appropriate responses.

## Testing Commands

```bash
# Run frontend
cd talentsphere-frontend
npm run dev

# Check for errors
npm run lint

# Build for production
npm run build
```

## Environment Variables

No new environment variables required. Uses existing:
- `VITE_API_BASE_URL` - Backend API URL

## Performance

- Validation: Every 5 minutes (configurable)
- Refresh check: Every 10 minutes (configurable)
- Activity tracking: Passive event listeners
- Memory footprint: ~10KB
- Network impact: 2-3 requests per 10 minutes

## Security Notes

- Tokens stored in localStorage (XSS vulnerable)
- Consider HttpOnly cookies for production
- Auto-refresh only when user is active
- Session cleared on logout
- Return URL preserved on re-login

---

For complete documentation, see `SESSION_MANAGEMENT_GUIDE.md`
