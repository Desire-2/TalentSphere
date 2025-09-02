# TalentSphere Admin Profile & Settings

This document describes the comprehensive admin profile and settings management system for TalentSphere.

## Features

### 🔧 Admin Profile Management
- **Profile Information**: Manage personal details, contact information, and bio
- **Avatar Upload**: Upload and update profile pictures
- **Account Details**: View creation date, last login, role, and permissions
- **Activity Tracking**: View recent administrative actions and statistics
- **Statistics Dashboard**: Monitor admin actions, active users, and system health

### ⚙️ Admin Settings Management
- **System Settings**: Configure site-wide parameters and feature toggles
- **Security Configuration**: Manage authentication, permissions, and security features
- **Email Configuration**: Set up SMTP settings and notification preferences
- **Database Management**: Monitor connections, perform backups, and manage retention
- **System Health**: Real-time monitoring of server resources and performance

## Components

### AdminProfile Component (`/admin/profile`)

**Features:**
- Three tabbed interface: Profile Details, Admin Statistics, Recent Activity
- Editable profile information with validation
- Avatar upload functionality
- Admin statistics display
- Recent activity log with action categorization

**Key Sections:**
1. **Profile Details Tab**
   - Profile picture with upload capability
   - Contact information (name, email, phone, location)
   - Bio and personal information
   - Account details and permissions

2. **Admin Statistics Tab**
   - Total administrative actions performed
   - Active users count
   - Total logins tracked
   - System health status

3. **Recent Activity Tab**
   - Chronological list of admin actions
   - Action categorization (update, system, approval, verification, analytics)
   - Timestamps and relative time display

### AdminSettings Component (`/admin/settings`)

**Features:**
- Five tabbed interface for different setting categories
- Environment-based configuration management
- Real-time validation and testing capabilities
- Export/import functionality for settings

**Key Sections:**
1. **System Settings Tab**
   - Site configuration (name, description)
   - Feature toggles (maintenance mode, registration, email verification)
   - Upload and session settings
   - Two-factor authentication controls

2. **Security Settings Tab**
   - Brute force protection configuration
   - API key generation and management
   - Security feature toggles (CAPTCHA, SSL, audit logging)
   - Login attempt limits and lockout settings

3. **Email Settings Tab**
   - SMTP configuration (host, port, credentials)
   - Email templates and preferences
   - Test email functionality
   - Notification settings

4. **Database Settings Tab**
   - Connection monitoring (read-only display)
   - Backup configuration and scheduling
   - Backup retention policies
   - Manual backup triggers

5. **System Health Tab**
   - Real-time resource monitoring (CPU, memory, disk usage)
   - Active connections and user statistics
   - System status indicators
   - Performance metrics

## API Endpoints

### Profile Management
- `GET /api/admin/profile` - Get current admin profile
- `PUT /api/admin/profile` - Update admin profile
- `POST /api/admin/upload-avatar` - Upload profile picture
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/activity-log` - Get activity log

### Settings Management
- `GET /api/admin/settings/{type}` - Get settings by type (system/email/security/database)
- `PUT /api/admin/settings/{type}` - Update settings by type
- `POST /api/admin/settings/email/test` - Test email configuration
- `POST /api/admin/database/backup` - Perform database backup
- `POST /api/admin/system/clear-cache` - Clear system cache
- `GET /api/admin/system/health` - Get detailed system health

## Configuration

### Environment Variables
The admin settings system reads from and writes to environment variables for production deployment:

```bash
# System Configuration
SITE_NAME=TalentSphere
SITE_DESCRIPTION="Premier job portal connecting talent with opportunities"
MAINTENANCE_MODE=false
REGISTRATION_ENABLED=true

# Security Configuration
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15
ENABLE_BRUTE_FORCE_PROTECTION=true
ENABLE_TWO_FACTOR=false

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
FROM_EMAIL=noreply@talentsphere.com
```

### Database Schema Extensions
The admin profile system may require extending the User model with additional fields:

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN location VARCHAR(255);
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500);
```

## Security Features

### Access Control
- Admin role verification required for all endpoints
- JWT token authentication
- Permission-based access control
- Activity logging and audit trails

### Data Protection
- Sensitive data masking in exports
- Password field encryption
- API key generation and rotation
- Input validation and sanitization

### Security Monitoring
- Failed login attempt tracking
- IP-based access controls
- Session timeout management
- Brute force protection

## Usage Examples

### Accessing Admin Profile
1. Navigate to `/admin/profile`
2. View/edit profile information in the Profile Details tab
3. Monitor admin statistics in the Admin Statistics tab
4. Review recent actions in the Recent Activity tab

### Configuring System Settings
1. Navigate to `/admin/settings`
2. Select the appropriate tab (System/Security/Email/Database/Health)
3. Modify settings as needed
4. Save changes using the respective save buttons
5. Test configurations using provided test functions

### Managing Security
1. Go to Security Settings tab
2. Configure login attempt limits and lockout duration
3. Generate new API keys as needed
4. Enable/disable security features based on requirements
5. Monitor security events through activity logs

## Development Notes

### Mock Data
Currently, the system uses mock data for:
- Admin statistics (will be replaced with actual tracking)
- Activity logs (will be replaced with audit logging)
- System health metrics (will be enhanced with real monitoring)

### Future Enhancements
- Real-time notifications for admin actions
- Advanced analytics and reporting
- Role-based permission granularity
- Integration with external monitoring tools
- Automated backup scheduling
- Multi-factor authentication support

### Testing
- Test all admin functionality with different user roles
- Verify access controls and permission checks
- Test settings persistence and retrieval
- Validate email configuration with real SMTP servers
- Test backup and restore functionality

## Browser Compatibility
- Modern browsers with ES6+ support
- Responsive design for desktop and tablet usage
- Keyboard navigation support
- Screen reader compatibility

## Performance Considerations
- Lazy loading of admin components
- Optimized API calls with caching
- Efficient data fetching strategies
- Resource monitoring and optimization
