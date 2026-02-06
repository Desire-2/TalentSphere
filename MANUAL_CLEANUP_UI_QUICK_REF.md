# Manual Cleanup UI - Quick Reference

## 🎯 Overview

Frontend admin interface for managing the automatic cleanup service. Allows administrators to view statistics and manually trigger cleanup of expired external jobs and scholarships.

## 📍 Access

**URL**: `/admin/cleanup`  
**Navigation**: Admin Panel → Cleanup  
**Required Role**: Admin

## ✨ Features

### 📊 Real-time Statistics Dashboard

**Service Status Card**
- Service running status (Running/Stopped)
- Check interval (default: 12 hours)
- Grace period (default: 1 day)

**Health Check Card**
- Service health status
- Last health check timestamp

**Last Cleanup Card**
- Jobs deleted in last cleanup
- Scholarships deleted in last cleanup
- Cleanup timestamp

**External Jobs Statistics**
- Total external jobs
- Jobs eligible for deletion (with highlight)
- Active jobs count

**External Scholarships Statistics**
- Total external scholarships
- Scholarships eligible for deletion (with highlight)
- Active scholarships count

### 🎛️ Manual Cleanup Actions

**Run Full Cleanup**
- Deletes both jobs and scholarships
- Shows total count badge
- Confirmation dialog required
- Disabled if no items eligible

**Cleanup Jobs Only**
- Deletes only external jobs
- Shows jobs count badge
- Confirmation dialog required
- Disabled if no jobs eligible

**Cleanup Scholarships Only**
- Deletes only external scholarships
- Shows scholarships count badge
- Confirmation dialog required
- Disabled if no scholarships eligible

### ℹ️ Information Panel

- Grace period information
- Cutoff date display
- Total eligible items count
- Deletion criteria explanation
- Cascade deletion warning

### 🔄 Auto-refresh

- Data refreshes every 30 seconds
- Manual refresh button available
- Loading indicators during refresh

## 🎨 UI Components

### Color Coding

**Service Status**
- 🟢 Green: Service running, healthy
- 🔴 Red: Service stopped
- 🟡 Yellow: Warning/attention needed

**Statistics**
- 🔵 Blue: Jobs statistics
- 🟣 Purple: Scholarships statistics
- 🔴 Red: Items eligible for deletion
- 🟢 Green: Active items

**Action Buttons**
- Indigo: Run full cleanup
- Blue: Cleanup jobs
- Purple: Cleanup scholarships
- Gray: Disabled (no eligible items)

### Icons

- 🗑️ `Trash2` - Main page icon
- 📊 `Activity` - Service status
- ✅ `CheckCircle` - Health check
- ⏰ `Clock` - Last cleanup time
- 💼 `Briefcase` - Jobs
- 🎓 `GraduationCap` - Scholarships
- 🔄 `RefreshCw` - Loading/refresh
- ℹ️ `Info` - Information panel
- ⚠️ `AlertCircle` - Warnings

## 📁 Files

### Created
- `talentsphere-frontend/src/services/cleanup.js` - API service methods
- `talentsphere-frontend/src/pages/admin/AdminCleanupManagement.jsx` - Main component

### Modified
- `talentsphere-frontend/src/pages/admin/index.js` - Export component
- `talentsphere-frontend/src/components/layout/AdminLayout.jsx` - Add navigation
- `talentsphere-frontend/src/App.jsx` - Add route and import

## 🔌 API Integration

### Service Methods (cleanup.js)

```javascript
// Get cleanup statistics
getCleanupStats()

// Run full cleanup
runCleanup()

// Cleanup jobs only
cleanupJobs()

// Cleanup scholarships only
cleanupScholarships()

// Get service status
getServiceStatus()

// Get health status (no auth required)
getHealthStatus()
```

### API Endpoints Used

```
GET  /api/cleanup/stats              # Statistics
POST /api/cleanup/run                # Full cleanup
POST /api/cleanup/jobs               # Jobs only
POST /api/cleanup/scholarships       # Scholarships only
GET  /api/cleanup/service/status     # Service status
GET  /api/cleanup/health             # Health check
```

## 🧪 Testing

### 1. Access the Page
```
1. Login as admin
2. Navigate to /admin/cleanup
3. Verify page loads with statistics
```

### 2. View Statistics
```
✓ Service status shows "Running"
✓ Health status shows "healthy"
✓ Statistics display for jobs and scholarships
✓ Cutoff date is displayed
✓ Grace period shows "1 day(s)"
```

### 3. Test Manual Cleanup
```
1. Click "Run Full Cleanup"
2. Confirm dialog appears
3. Accept confirmation
4. Success message shows deleted count
5. Statistics refresh automatically
```

### 4. Test Individual Cleanup
```
1. Click "Cleanup Jobs Only" or "Cleanup Scholarships"
2. Confirm action
3. Verify only selected type is cleaned
4. Check statistics update
```

### 5. Test Disabled State
```
1. When no items eligible for deletion
2. All action buttons should be disabled
3. Buttons show gray color
4. No confirmation dialog on click
```

### 6. Test Auto-refresh
```
1. Wait 30 seconds
2. Watch for automatic data refresh
3. Or click "Refresh Data" button manually
4. Verify loading indicator appears
```

## ⚠️ User Experience

### Confirmation Dialogs

**Full Cleanup**
> "Are you sure you want to run a full cleanup? This will delete all expired external jobs and scholarships."

**Jobs Only**
> "Are you sure you want to cleanup expired external jobs?"

**Scholarships Only**
> "Are you sure you want to cleanup expired external scholarships?"

### Success Messages

- "Cleanup completed: X items deleted"
- "Jobs cleanup completed: X jobs deleted"
- "Scholarships cleanup completed: X scholarships deleted"

### Error Messages

- "Failed to load cleanup data"
- "Failed to run cleanup"
- "Failed to cleanup jobs"
- "Failed to cleanup scholarships"

### Warning Notice

A permanent warning banner displays:
> "Warning: Cleanup actions are permanent and cannot be undone. All deleted items and their related records (applications, bookmarks) will be permanently removed from the database."

## 🎯 Usage Examples

### Scenario 1: Regular Cleanup Check
```
1. Admin visits /admin/cleanup
2. Reviews statistics
3. Sees 25 jobs eligible for deletion
4. Clicks "Run Full Cleanup"
5. Confirms action
6. 25 items deleted successfully
7. Statistics show 0 eligible items
```

### Scenario 2: Jobs-Only Cleanup
```
1. Admin needs to cleanup only jobs
2. Clicks "Cleanup Jobs Only"
3. Confirms deletion of 15 jobs
4. Scholarships remain untouched
5. Success message confirms 15 jobs deleted
```

### Scenario 3: No Action Needed
```
1. Admin checks cleanup page
2. All buttons are disabled (gray)
3. Statistics show 0 eligible for deletion
4. No cleanup action needed
5. Admin can monitor service status
```

## 🔒 Security

- ✅ All API calls use admin authentication token
- ✅ Token stored in localStorage
- ✅ Authorization header: `Bearer <token>`
- ✅ Backend validates admin role
- ✅ Health endpoint is public (read-only)
- ✅ All destructive actions require confirmation

## 🚀 Performance

**Optimization Features**
- Automatic data refresh (30s interval)
- Loading states for better UX
- Disabled states prevent multiple requests
- Error handling with user feedback
- Clean UI with smooth transitions

**API Call Optimization**
- Parallel fetching of stats, status, and health
- Single cleanup request per action
- Auto-refresh only when component mounted
- Cleanup on interval unmount

## 📱 Responsive Design

**Desktop (lg+)**
- Three-column grid for status cards
- Two-column grid for statistics
- Full-width action buttons in row

**Tablet (md)**
- Two-column grids
- Stacked action buttons

**Mobile (sm)**
- Single column layout
- Stacked cards and buttons
- Touch-friendly button sizes

## 🎨 Visual Hierarchy

1. **Page Title** - Large, with trash icon
2. **Status Cards** - Three cards in row (service, health, last cleanup)
3. **Statistics** - Two large cards (jobs, scholarships)
4. **Info Panel** - Blue info box with cleanup details
5. **Action Buttons** - Three prominent buttons
6. **Warning** - Yellow warning at bottom

## 🔄 State Management

**Component State**
- `stats` - Cleanup statistics data
- `serviceStatus` - Service running status
- `healthStatus` - Health check data
- `loading` - Initial loading state
- `actionLoading` - Action in progress
- `message` - Success/error messages
- `lastCleanup` - Last cleanup results

**Auto-update Flow**
```
Component Mount
    ↓
Fetch All Data (parallel)
    ↓
Display in UI
    ↓
Start 30s Interval
    ↓
Auto-refresh Data
    ↓
Component Unmount → Clear Interval
```

## 📊 Data Flow

```
User Action
    ↓
Confirmation Dialog
    ↓
API Request (with token)
    ↓
Backend Processing
    ↓
Response with results
    ↓
Update UI State
    ↓
Show Success Message
    ↓
Auto-refresh Statistics
```

---

**Related Documentation**
- [External Auto-Delete System](../EXTERNAL_OPPORTUNITIES_AUTO_DELETE.md)
- [Auto-Delete Quick Reference](../AUTO_DELETE_QUICK_REF.md)
- Backend cleanup service documentation

**Last Updated**: February 2026  
**Version**: 1.0.0
