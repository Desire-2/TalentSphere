# 📧 Yahoo Mail SMTP Setup for TalentSphere

## 🚀 Production Email Configuration

TalentSphere is configured to use **afritechbridge@yahoo.com** for sending password reset emails and notifications.

### 📋 Required Setup Steps

#### 1. Generate Yahoo App Password

1. **Login to Yahoo Mail**: Go to https://login.yahoo.com and login with `afritechbridge@yahoo.com`
2. **Account Settings**: Click on your profile → Account Security
3. **Generate App Password**: 
   - Click "Generate app password" or "Create app password"
   - Select "Other App" and name it "TalentSphere Production"
   - Copy the generated 16-character password (e.g., `abcd efgh ijkl mnop`)

#### 2. Update Environment Variables

Replace the placeholder in your `.env` file:

```bash
# Replace this line in /backend/.env
SENDER_PASSWORD=your-yahoo-app-password-here-replace-with-actual-password

# With the actual 16-character app password (no spaces):
SENDER_PASSWORD=abcdefghijklmnop
```

#### 3. Deployment Configuration

For production deployment, set these environment variables in your hosting service:

```bash
# Email Settings
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
SENDER_EMAIL=afritechbridge@yahoo.com
SENDER_PASSWORD=your-16-char-app-password
SENDER_NAME=AfriTech Bridge

# Frontend URL (Update with actual production URL)
FRONTEND_URL=https://talent-sphere-emmz.vercel.app
```

### ⚡ Testing Email Configuration

1. **Start the backend server**:
   ```bash
   cd backend
   python src/main.py
   ```

2. **Test password reset**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

3. **Check server logs** for email sending status:
   - ✅ `Password reset email sent successfully` = Working
   - ❌ `SMTP Authentication failed` = Need to set app password
   - ❌ `Error sending email` = Check network/SMTP settings

### 🔐 Security Best Practices

#### App Password Security
- ✅ Use App Passwords (16 characters) instead of account password
- ✅ Never commit passwords to version control
- ✅ Rotate passwords periodically
- ✅ Use different app passwords for different services

#### Email Security
- ✅ TLS encryption enabled (port 587)
- ✅ Professional sender name: "AfriTech Bridge"
- ✅ HTML email templates with proper formatting
- ✅ Password reset links expire in 1 hour

### 📱 Email Template Features

#### Password Reset Email Includes:
- ✅ Professional TalentSphere branding
- ✅ Personalized greeting with user's name
- ✅ Clear call-to-action button
- ✅ Backup plain text link
- ✅ Security warnings about expiration
- ✅ Contact information for support

#### Email Content:
- **From**: `AfriTech Bridge <afritechbridge@yahoo.com>`
- **Subject**: "Reset Your TalentSphere Password"
- **Format**: HTML with fallback text
- **Branding**: TalentSphere colors and styling

### 🛠️ Troubleshooting

#### Common Issues:

1. **"SMTP Authentication Failed"**
   - ✅ **Solution**: Generate new App Password from Yahoo Account Security
   - ✅ **Check**: Use app password, not regular password

2. **"Connection refused"**
   - ✅ **Solution**: Verify SMTP server: `smtp.mail.yahoo.com`
   - ✅ **Check**: Port should be `587` (not 465 or 25)

3. **"Email not received"**
   - ✅ **Check**: Spam/Junk folders
   - ✅ **Verify**: Email address is correct
   - ✅ **Wait**: May take 1-2 minutes to arrive

#### Testing Commands:

```bash
# Test SMTP connection
python -c "
import smtplib
server = smtplib.SMTP('smtp.mail.yahoo.com', 587)
server.starttls()
server.login('afritechbridge@yahoo.com', 'your-app-password')
print('✅ SMTP connection successful!')
server.quit()
"

# Test environment variables
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('SENDER_EMAIL:', os.getenv('SENDER_EMAIL'))
print('SMTP_SERVER:', os.getenv('SMTP_SERVER'))
print('FRONTEND_URL:', os.getenv('FRONTEND_URL'))
"
```

### 📊 Monitoring & Analytics

#### Email Delivery Tracking:
- Server logs show email sending status
- Failed emails are logged with error details
- Success confirmations include recipient email

#### Production Monitoring:
- Monitor SMTP connection failures
- Track password reset request rates
- Alert on authentication failures

---

## 🎯 Quick Setup Checklist

1. ☐ **Generate Yahoo App Password** for afritechbridge@yahoo.com
2. ☐ **Update `.env` file** with actual app password
3. ☐ **Test email sending** with backend running
4. ☐ **Verify email receipt** (check spam folder)
5. ☐ **Deploy with environment variables** set
6. ☐ **Test production password reset** flow

---

## 📞 Support

If you encounter issues with email setup:

1. **Check server logs** for detailed error messages
2. **Verify Yahoo Account Security** settings
3. **Test SMTP connection** manually
4. **Contact**: afritechbridge@yahoo.com for account access issues

---

**🎉 Once configured, users will receive professional password reset emails with secure links that expire in 1 hour!**
