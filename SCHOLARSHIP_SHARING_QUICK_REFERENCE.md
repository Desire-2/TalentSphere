# 🚀 Scholarship Sharing - Quick Reference Card

## 📍 Quick Access

### Component Location
```
talentsphere-frontend/src/components/scholarships/ShareScholarship.jsx
```

### Basic Usage
```jsx
import ShareScholarship from '../../components/scholarships/ShareScholarship';

<ShareScholarship scholarship={scholarshipData} />
```

---

## 🎯 Main Features

| Feature | Platform | Icon |
|---------|----------|------|
| Social Share | LinkedIn | 🔵 |
| Social Share | Twitter | 🐦 |
| Social Share | Facebook | 📘 |
| Social Share | WhatsApp | 💚 |
| Direct Share | Email | ✉️ |
| Direct Share | Copy Link | 📋 |
| Offline Share | QR Code | 📱 |
| Mobile Share | Native | ↗️ |

---

## 📝 Templates

1. **Professional** - Formal, networking
2. **Casual** - Friendly, approachable
3. **Urgent** - Deadline-focused
4. **Inspirational** - Motivational
5. **Detailed** - Comprehensive
6. **Student-Focused** - Direct appeal

---

## 📊 Analytics API

```javascript
// Import service
import shareScholarshipService from './services/shareScholarshipService';

// Record share
shareScholarshipService.recordShare(id, platform, message);

// Get stats
const stats = shareScholarshipService.getScholarshipShareStats(id);

// Export data
shareScholarshipService.exportShareData();
```

---

## 🎨 Color Reference

```css
Blue:    #2563EB  /* Primary actions */
Green:   #10B981  /* Success, money */
Purple:  #7C3AED  /* Premium, email */
Orange:  #F59E0B  /* Deadlines */
```

---

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## 🔌 Backend Endpoints

```
POST   /api/scholarships/:id/share
GET    /api/scholarships/:id/share/stats
GET    /api/scholarships/share/top
```

---

## ⚙️ Customization

### Custom Button
```jsx
<ShareScholarship 
  scholarship={data}
  trigger={<Button>Custom Text</Button>}
/>
```

### Add Platform
```javascript
// In getSocialShareUrl()
case 'reddit':
  return `https://reddit.com/submit?url=${encodedUrl}`;
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| QR not loading | Wait or refresh |
| Share not recording | Check localStorage |
| Button not showing | Check scholarship prop |

---

## 📚 Documentation

1. `SCHOLARSHIP_SHARING_FEATURE_GUIDE.md` - Full docs
2. `SCHOLARSHIP_SHARING_QUICK_START.md` - Setup guide
3. `SCHOLARSHIP_SHARING_VISUAL_SHOWCASE.md` - UI reference
4. `SCHOLARSHIP_SHARING_IMPLEMENTATION_SUMMARY.md` - Overview

---

## ✅ Quick Test

1. Go to scholarship detail page
2. Click "Share" button
3. Try each platform
4. Verify analytics update

---

## 💡 Best Practices

✅ Use templates for consistency  
✅ Personalize messages  
✅ Share at peak times  
✅ Track analytics  
✅ Test all devices  

---

## 🎓 Support

- Component code has detailed comments
- Check browser console for errors
- Review documentation files
- Test in incognito mode

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Responsive**: ✅ All Devices  
**Tested**: ✅ Verified  

---

*Keep this card handy for quick reference!* 📌
