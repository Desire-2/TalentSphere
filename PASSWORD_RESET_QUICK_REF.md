# Password Reset Email System - Quick Reference

## 🚀 Quick Start

### Start Backend
```bash
cd /home/desire/My_Project/TalentSphere/backend
python src/main.py
```

### Test Password Reset
```bash
cd /home/desire/My_Project/TalentSphere
python test_password_reset_system.py
```

## ⚙️ Configuration Check

### Required Environment Variables (.env)
```env
SMTP_SERVER=smtp.gmail.com          # ✅ Gmail SMTP
SMTP_PORT=587                       # ✅ STARTTLS port
SENDER_EMAIL=bikorimanadesire5@gmail.com
SENDER_PASSWORD=aqwdbnwcvishxhqj   # Gmail App Password
SENDER_NAME="AfriTech Bridge"
FRONTEND_URL=http://localhost:5173
```

## 🔧 What Was Fixed

1. **SMTP Server Mismatch** → Changed from `smtp.mail.yahoo.com` to `smtp.gmail.com`
2. **Duplicate Code** → Removed 100+ lines, now uses centralized `email_service`
3. **Missing Template** → Added professional `password_reset` email template
4. **Poor Logging** → Added emoji markers (📧 ✅ ❌ ⚠️ ℹ️) for easy debugging

## 📝 Key Files Changed

- ✏️ `backend/.env` - SMTP server configuration
- ✏️ `backend/src/services/email_service.py` - Added password reset template & method
- ✏️ `backend/src/routes/auth.py` - Removed duplicate code, improved logging

## 🧪 Testing Commands

### Test with cURL
```bash
# 1. Request reset
curl -X POST http://localhost:5001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Verify token (replace TOKEN)
curl -X POST http://localhost:5001/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR-TOKEN"}'

# 3. Reset password (replace TOKEN)
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR-TOKEN",
    "password": "NewPassword123",
    "confirm_password": "NewPassword123"
  }'
```

### Test with Frontend
1. Navigate to: `http://localhost:5173/forgot-password`
2. Enter email
3. Check inbox
4. Click reset link
5. Set new password

## 🐛 Quick Troubleshooting

### Email Not Received?
```bash
# Check backend logs for:
📧 Password reset requested for email: ...
✅ Reset token generated for user: ...
✅ Password reset email sent successfully
```

### SMTP Error?
- Verify Gmail App Password (not regular password)
- Check SMTP_SERVER=smtp.gmail.com
- Check SMTP_PORT=587
- Look for: `❌ SMTP Authentication failed`

### Token Invalid?
- Token expires in 1 hour
- Token is one-time use only
- Check logs: `❌ Reset password: Expired token`

## 📊 Expected Log Flow

### Successful Request
```
📧 Password reset requested for email: user@example.com
✅ Reset token generated for user: user@example.com
✅ Password reset email sent successfully to user@example.com
```

### Successful Reset
```
✅ Password reset successful for user: user@example.com
```

## 🔍 Quick Diagnostics

### Check Email Service Status
```python
# In Python shell
from src.services.email_service import email_service
print(email_service.smtp_server)    # Should be smtp.gmail.com
print(email_service.sender_email)   # Your Gmail
print(email_service.sender_password) # Should not be None
```

### Check User's Reset Token
```python
# In Python shell
from src.models.user import User
user = User.query.filter_by(email='test@example.com').first()
print(user.reset_token)
print(user.reset_token_expires_at)
```

## 📞 Support Checklist

If still having issues:
- [ ] Backend is running on port 5001
- [ ] .env file has correct SMTP settings
- [ ] Using Gmail App Password, not regular password
- [ ] Frontend URL is correct
- [ ] Checking spam folder
- [ ] Token hasn't expired (1 hour limit)
- [ ] Email actually exists in database
- [ ] Checked backend logs for errors

## 🎯 Success Indicators

System is working when:
- ✅ Request returns `{"success": true, "email_sent": true}`
- ✅ Email arrives within seconds
- ✅ Email is well-formatted with TalentSphere branding
- ✅ Reset link opens correct page
- ✅ Password reset succeeds
- ✅ Can login with new password

---

**For detailed documentation, see**: `PASSWORD_RESET_EMAIL_FIX_COMPLETE.md`
