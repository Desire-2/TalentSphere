# Certification Section Fix - 500 Internal Server Error

## Problem
POST request to `/api/profile/certifications` was returning 500 Internal Server Error when trying to add a certification.

## Root Cause
**Field name mismatch** between frontend and backend:

### Frontend (Before Fix)
```javascript
formData = {
  certification_name: '',  // ❌ Wrong field name
  expiration_date: '',     // ❌ Wrong field name
  // ... other fields
}
```

### Backend Expected Schema
```python
class Certification(db.Model):
    name = db.Column(db.String(200))           # ✅ Expects 'name'
    expiry_date = db.Column(db.Date)           # ✅ Expects 'expiry_date'
    # ... other fields
```

## Solution
Updated CertificationsSection.jsx to match backend schema exactly:

### Changes Made

1. **Field Name Updates**
   - `certification_name` → `name`
   - `expiration_date` → `expiry_date`

2. **Updated Locations**
   - ✅ `formData` state initialization
   - ✅ `resetForm()` function
   - ✅ `handleEdit()` function
   - ✅ Form input fields (id, value, onChange)
   - ✅ Display in certification cards
   - ✅ Expiration status badges

### Code Changes

```javascript
// Before
const [formData, setFormData] = useState({
  certification_name: '',
  expiration_date: '',
  // ...
});

// After
const [formData, setFormData] = useState({
  name: '',
  expiry_date: '',
  // ...
});
```

```jsx
// Before
<Input
  id="certification_name"
  value={formData.certification_name}
  onChange={(e) => setFormData({...formData, certification_name: e.target.value})}
/>

// After
<Input
  id="name"
  value={formData.name}
  onChange={(e) => setFormData({...formData, name: e.target.value})}
/>
```

```jsx
// Before
<h3>{cert.certification_name}</h3>
Expires: {formatDate(cert.expiration_date)}

// After
<h3>{cert.name}</h3>
Expires: {formatDate(cert.expiry_date)}
```

## Backend Schema Reference

### Certification Model Fields
```python
# Required Fields
name                    # String(200) - Certification name
issuing_organization    # String(200) - Organization that issued it

# Date Fields
issue_date             # Date - When certification was issued
expiry_date            # Date - When certification expires (nullable)
does_not_expire        # Boolean - True if certification never expires

# Optional Fields
credential_id          # String(100) - Certification ID/number
credential_url         # String(255) - URL to verify certification
description            # Text - Additional details
skills_acquired        # Text (JSON array) - Skills gained
display_order          # Integer - Display ordering
```

## Testing

### Test Cases
1. ✅ Add new certification with expiry date
2. ✅ Add certification that doesn't expire
3. ✅ Edit existing certification
4. ✅ Delete certification
5. ✅ Display expiration warnings (expiring soon/expired badges)

### Build Verification
```bash
cd talentsphere-frontend && npm run build
✓ 3637 modules transformed
✓ built in 5.48s
```

## API Endpoint
```
POST /api/profile/certifications
PUT /api/profile/certifications/:id
DELETE /api/profile/certifications/:id
GET /api/profile/certifications
```

### Request Payload Example
```json
{
  "name": "AWS Certified Solutions Architect",
  "issuing_organization": "Amazon Web Services",
  "issue_date": "2024-01-15",
  "expiry_date": "2027-01-15",
  "credential_id": "AWS-SA-12345",
  "credential_url": "https://aws.amazon.com/verification/...",
  "does_not_expire": false
}
```

## Files Modified
- `/talentsphere-frontend/src/pages/jobseeker/sections/CertificationsSection.jsx`

## Related Issues Fixed
- Fixed 500 Internal Server Error on POST
- Ensured data consistency between frontend and backend
- Proper expiration date handling and display
- Correct field mapping for edit operations

## Status
✅ **RESOLVED** - Certification section now fully functional with proper backend integration

---
**Error**: `POST http://localhost:5173/api/profile/certifications 500 (Internal Server Error)`  
**Fix**: Updated field names from `certification_name/expiration_date` to `name/expiry_date`  
**Result**: Certifications can now be added, edited, and deleted successfully
