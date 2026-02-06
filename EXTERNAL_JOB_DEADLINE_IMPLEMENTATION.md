# External Job Deadline Field Implementation

## Overview
Added `application_deadline` and `expires_at` fields to the external job creation form to ensure proper integration with the auto-cleanup system. The cleanup service automatically deletes external jobs 1 day after their deadline passes.

## Changes Made

### 1. Frontend: CreateExternalJob.jsx

#### formData State (Lines ~500-506)
Added two new fields to the initial form state:
```javascript
// Application
application_type: 'external',
application_url: '',
application_email: '',
application_instructions: '',
application_deadline: '', // Deadline for applications (required for auto-cleanup)
expires_at: '', // Job expiration date (optional fallback)
```

#### Form Sections (Line ~557)
Updated the 'application' section to include the new fields:
```javascript
{
  id: 'application',
  title: 'Application Process',
  icon: FileText,
  description: 'How candidates can apply',
  fields: ['application_type', 'application_url', 'application_email', 
           'application_instructions', 'application_deadline', 'expires_at']
}
```

#### Form Validation (Lines ~1550-1575)
Added comprehensive validation for deadline fields:
```javascript
// Validate application deadline (required for external jobs)
if (!formData.application_deadline?.trim()) {
  fieldErrors.application_deadline = 'Application deadline is required for external jobs';
} else {
  const deadlineDate = new Date(formData.application_deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (deadlineDate < today) {
    fieldErrors.application_deadline = 'Application deadline must be a future date';
  }
}

// Validate expires_at if provided
if (formData.expires_at?.trim()) {
  const expirationDate = new Date(formData.expires_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (expirationDate < today) {
    fieldErrors.expires_at = 'Expiration date must be a future date';
  }
}
```

#### Form Submission (Lines ~1600-1610)
Updated jobData preparation to include deadline fields:
```javascript
const jobData = {
  ...formData,
  // ... other fields ...
  // Include deadline fields for auto-cleanup system
  application_deadline: formData.application_deadline ? formData.application_deadline : null,
  expires_at: formData.expires_at ? formData.expires_at : null,
};
```

#### UI Components (Lines ~3230-3265)
Added date input fields to the Application Process card:
```jsx
{/* Application Deadline Fields */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField label="Application Deadline" field="application_deadline" required>
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <Input
        type="date"
        id="application_deadline"
        value={formData.application_deadline}
        onChange={(e) => stableInputChange('application_deadline', e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="enhanced-input pl-10"
        required
      />
    </div>
    <p className="text-xs text-gray-500 mt-1">
      <Info className="inline h-3 w-3 mr-1" />
      External jobs are auto-deleted 1 day after this deadline
    </p>
  </FormField>

  <FormField label="Job Expiration Date" field="expires_at">
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <Input
        type="date"
        id="expires_at"
        value={formData.expires_at}
        onChange={(e) => stableInputChange('expires_at', e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="enhanced-input pl-10"
      />
    </div>
    <p className="text-xs text-gray-500 mt-1">
      <Info className="inline h-3 w-3 mr-1" />
      Optional: When the job posting should expire (fallback if no deadline)
    </p>
  </FormField>
</div>
```

#### AI/JSON Import (Lines ~1220-1225)
Updated JSON import mapping to include deadline fields:
```javascript
// Application
application_type: coerceToString(parsedData.application_type ?? parsedData.apply_method, 'external'),
application_url: coerceToString(parsedData.application_url ?? parsedData.apply_url ?? parsedData.url ?? salarySource.url, ''),
application_email: coerceToString(parsedData.application_email ?? parsedData.apply_email ?? parsedData.email, ''),
application_instructions: coerceToString(parsedData.application_instructions ?? parsedData.apply_instructions, ''),
application_deadline: coerceToString(parsedData.application_deadline ?? parsedData.deadline ?? parsedData.apply_by, ''),
expires_at: coerceToString(parsedData.expires_at ?? parsedData.expiration_date ?? parsedData.end_date, ''),
```

## Backend Integration

### Job Model (backend/src/models/job.py)
Already supports both fields:
```python
application_deadline = db.Column(db.DateTime)  # Line 99
expires_at = db.Column(db.DateTime)           # Line 127
```

### Job Routes (backend/src/routes/job.py)
Already parses deadline fields:
```python
# Parse application deadline (Lines 530-541)
application_deadline = None
if data.get('application_deadline'):
    try:
        deadline_str = data['application_deadline']
        if 'T' in deadline_str:
            application_deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
        else:
            application_deadline = datetime.fromisoformat(deadline_str + 'T23:59:59')
    except ValueError:
        return jsonify({'error': 'Invalid application deadline format'}), 400
```

### Cleanup Service (backend/src/services/cleanup_service.py)
Automatically deletes jobs based on these fields:
```python
# Check both application_deadline and expires_at (Lines 100-113)
expired_jobs = Job.query.filter(
    Job.job_source == 'external',
    db.or_(
        db.and_(
            Job.application_deadline.isnot(None),
            Job.application_deadline <= cutoff_date
        ),
        db.and_(
            Job.expires_at.isnot(None),
            Job.expires_at <= cutoff_date
        )
    )
).all()
```

## Scholarship Form Status

### CreateScholarship.jsx
**Already configured correctly** - has `application_deadline` field:
- FormData state includes `application_deadline: ''` (Line 232)
- Form sections include the field (Line 302)
- UI has date input with type="datetime-local" (Lines 1478-1486)
- Validation is in place (Lines 390-399)
- Submission includes the field

### Scholarship Model (backend/src/models/scholarship.py)
```python
application_deadline = db.Column(db.DateTime, nullable=False)  # Line 99
```

### Cleanup Service for Scholarships
```python
# Deletes scholarships 1 day after deadline (Lines 168-220)
expired_scholarships = Scholarship.query.filter(
    Scholarship.scholarship_source == 'external',
    Scholarship.application_deadline <= cutoff_date
).all()
```

## How It Works

### For Jobs:
1. **External Admin creates job** → Must set `application_deadline` (required)
2. **Optionally sets `expires_at`** → Fallback expiration date
3. **Cleanup service runs every 12 hours** → Checks both fields
4. **1 day after deadline** → Job is automatically deleted
5. **Backend sets `job_source='external'`** → Cleanup only affects external jobs

### For Scholarships:
1. **External Admin creates scholarship** → Must set `application_deadline` (required)
2. **Cleanup service runs every 12 hours** → Checks deadline
3. **1 day after deadline** → Scholarship is automatically deleted
4. **Backend sets `scholarship_source='external'`** → Cleanup only affects external scholarships

## User Experience

### Form Helpers:
- **Calendar icons** on date inputs for visual clarity
- **Min date validation** prevents past dates
- **Info tooltips** explain auto-deletion policy
- **Required field** for `application_deadline`
- **Optional field** for `expires_at`

### Validation Messages:
- "Application deadline is required for external jobs"
- "Application deadline must be a future date"
- "Expiration date must be a future date"

### Data Flow:
1. Form input → Date string (YYYY-MM-DD)
2. Frontend validation → Ensures future date
3. Backend parsing → Converts to DateTime with T23:59:59 if no time specified
4. Database storage → DateTime column
5. Cleanup check → Compares with cutoff_date (now - 1 day)

## Testing Checklist

- [ ] Create external job with `application_deadline` only
- [ ] Create external job with both `application_deadline` and `expires_at`
- [ ] Verify validation rejects past dates
- [ ] Verify validation requires `application_deadline`
- [ ] Import job JSON with deadline fields
- [ ] Check cleanup stats show proper count
- [ ] Verify job appears in "Jobs to Delete" when deadline passes
- [ ] Confirm auto-deletion 1 day after deadline
- [ ] Test scholarship creation (already has field)

## Files Modified

### Frontend:
- `talentsphere-frontend/src/pages/external-admin/CreateExternalJob.jsx`
  - Added formData fields (2 new fields)
  - Updated formSections (1 section modified)
  - Added UI components (new date inputs)
  - Added validation logic (2 new validators)
  - Updated handleSubmit (jobData preparation)
  - Updated JSON import mapping (2 new mappings)

### Backend:
- **No changes needed** - already supported!
  - Job model has fields
  - Routes parse fields correctly
  - Cleanup service checks both fields

## Related Documentation
- [AUTO_DELETE_IMPLEMENTATION_SUMMARY.md](AUTO_DELETE_IMPLEMENTATION_SUMMARY.md) - Cleanup service overview
- [JOB_AUTO_DELETION_SYSTEM.md](JOB_AUTO_DELETION_SYSTEM.md) - Auto-deletion details
- [ADMIN_CLEANUP_MANAGEMENT.md](ADMIN_CLEANUP_MANAGEMENT.md) - Admin UI documentation
