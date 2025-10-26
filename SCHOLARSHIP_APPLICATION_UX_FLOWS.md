# Scholarship Application - User Experience Flow

## Overview
This document describes the complete user journey for applying to scholarships in three different ways.

---

## Flow 1: External Scholarships

### User Journey
```
1. User browses scholarships
   ↓
2. Finds scholarship with external provider
   ↓
3. Clicks "Apply Externally" button
   ↓
4. Confirmation dialog appears:
   "You will be redirected to the external application portal 
    at [provider-domain]. Do you want to continue?"
   ↓
5a. User clicks "OK" (Proceed)
   └→ External URL opens in new tab
   └→ Application click is tracked for analytics
   └→ Success message: "Application portal opened in a new tab.
                        Keep this page open for reference."
   
5b. User clicks "Cancel" (Stay)
   └→ User remains on scholarship page
   └→ Can still click the preview links for more info
```

### Visual Elements
- **Button**: Blue gradient with "Apply Externally" + ExternalLink icon
- **Info Card**: Blue themed with external link icon
  - Shows: "External Application"
  - Text: "This scholarship requires application through an external portal"
  - Links: Preview portal + Organization website
- **Tips**: Mention to keep page open for reference

### Data Tracking
- Tracks application click count per scholarship
- User authentication required
- No additional form data captured

---

## Flow 2: Email Applications

### User Journey
```
1. User browses scholarships
   ↓
2. Finds scholarship with email application
   ↓
3. Clicks "Send Application Email" button
   ↓
4. User's email client opens automatically with:
   - TO: [scholarship email]
   - SUBJECT: "Application for [Scholarship Title]"
   - BODY: Pre-filled template with instructions
   ↓
5. User composes their email response
   ↓
6. User sends email to scholarship provider
   ↓
7. Application submitted (outside platform)
```

### Visual Elements
- **Button**: Purple gradient with "Send Application Email" + Mail icon
- **Info Card**: Purple themed with mail icon
  - Shows: "Email Application"
  - Text: "This scholarship requires application by email"
  - Email address: Clickable mailto link
  - Instructions: Display any additional requirements
- **Tips**: Remind about attaching required documents

### User Experience Notes
- No TalentSphere-side form to fill
- Relies on user's configured email client
- Encourages proper email composition
- Tracks clicks but not actual submissions

---

## Flow 3: Internal Scholarships

### User Journey

#### Step 1: Decision to Apply
```
1. User browses scholarships
   ↓
2. Finds scholarship marked "Internal Application"
   ↓
3. Reads scholarship details
   ↓
4. Clicks "Apply Now" button
   ↓
5. (If not logged in) → Redirect to login
   ↓
6. (If logged in) → Navigate to /scholarships/:id/apply
```

#### Step 2: Application Form (Part 1)
```
PERSONAL INFORMATION SECTION
├─ First Name *
├─ Last Name *
├─ Email *
├─ Phone Number *
└─ Date of Birth * (date picker)

[Continue to next section...]
```

#### Step 3: Application Form (Part 2)
```
EDUCATION INFORMATION SECTION
├─ Current Institution * (text input)
├─ Study Level * (dropdown)
│  ├─ Undergraduate
│  ├─ Graduate
│  ├─ Postgraduate
│  ├─ PhD
│  └─ Vocational
├─ Current GPA * (0-4.0, number input)
└─ Field of Study (text input)

[Continue to next section...]
```

#### Step 4: Application Form (Part 3)
```
ADDRESS INFORMATION SECTION
├─ Country * (text input)
├─ State/Province (text input)
├─ City * (text input)
└─ Postal Code (text input)

[Continue to essays if required...]
```

#### Step 5: Application Form (Part 4 - if essay required)
```
APPLICATION ESSAYS SECTION
[Shows essay prompts if available]

├─ Motivation Essay * (textarea 5 rows)
│  "Why do you want this scholarship?"
├─ Career Goals (textarea 4 rows)
│  "What are your career aspirations?"
├─ Achievements (textarea 4 rows)
│  "Describe your key achievements"
└─ Financial Need Statement (textarea 3 rows)
│  "Optional: explain financial situation"

[Continue to experience section...]
```

#### Step 6: Application Form (Part 5)
```
EXPERIENCE & ACTIVITIES SECTION
├─ Extracurricular Activities (textarea)
├─ Community Service & Volunteering (textarea)
├─ Leadership Experience (textarea)
└─ Additional Information (textarea)

[Continue to documents if required...]
```

#### Step 7: Application Form (Part 6 - if documents required)
```
SUPPORTING DOCUMENTS SECTION
[Shows file upload area]

[Drag and drop zone or click to upload]
├─ Accepted: PDF, JPEG, PNG, Word (max 5MB each)
├─ Required documents displayed:
│  ├─ ✓ Academic Transcript required
│  ├─ ✓ 2 Recommendation Letters required
│  └─ ✓ Portfolio required
└─ [List uploaded files with remove option]

[Continue to terms...]
```

#### Step 8: Application Form (Part 7)
```
TERMS & CONDITIONS
☐ I agree to the terms and conditions *
  Text: "I confirm that the information provided 
         in this application is true and accurate..."

[Continue to submission...]
```

#### Step 9: Form Submission
```
[Cancel Button] ..................... [Submit Application Button]

On Submit:
1. Validate all required fields
2. Show errors if validation fails
3. On success:
   └─ Show loading spinner
   └─ Send to backend
   └─ Wait for response
   └─ Redirect to success page (if 201)
   └─ Show error message (if failed)
```

#### Step 10: Success Page
```
✓ [Success checkmark icon]

TITLE: "Application Submitted!"
SUBTITLE: "Your scholarship application has been successfully submitted."

┌─ CONFIRMATION DETAILS ─────────────────┐
│ 📄 Application Reference: APP-12345678 │
│ ────────────────────────────────────── │
│ ✉️  Confirmation Email: Check your     │
│    email for a detailed receipt        │
│ ────────────────────────────────────── │
│ ⏱️  Next Steps: You'll be notified     │
│    of the results by email             │
└────────────────────────────────────────┘

WHAT HAPPENS NEXT?
1. Your application will be reviewed
2. You may receive follow-up requests
3. Final results via email

PRO TIPS
• Keep your reference number
• Check email (including spam folder)
• Update profile if contact changes

[View Scholarship Details]
[Browse More Scholarships]
[Go to Dashboard]

Auto-redirect in 10 seconds...
```

---

## Form Validation & Error Handling

### Real-time Validation (As User Types)
```
First Name: [John        ]
             ↑ Valid, no error message

Email:      [test        ]
             ↑ Invalid, shows: "Please enter a valid email address"

GPA:        [5.0         ]
             ↑ Invalid, shows: "GPA must be between 0 and 4.0"
```

### On Submit Validation
```
User clicks Submit
↓
System checks ALL required fields
↓
If errors found:
  - Highlight error fields with red border
  - Show error message below field
  - Toast notification: "Please fill in all required fields"
  - Stay on form (don't submit)
↓
If all valid:
  - Show loading state: "Submitting..."
  - Disable submit button
  - Send to backend
```

### Error Recovery
```
Error Response (e.g., Server unavailable)
↓
Show Toast Error: "Failed to submit application. Please try again."
↓
Button becomes active again
↓
User can fix issues and resubmit
```

---

## User Messages & Notifications

### Toast Notifications (bottom right corner)

**Success:**
```
✓ Application submitted successfully!
  [Dismiss]
```

**Errors:**
```
✗ Failed to submit application. Please try again.
  [Dismiss]

✗ You have already applied for this scholarship.
  [Dismiss]

✗ Please fill in all required fields.
  [Dismiss]

✗ File size should not exceed 5MB.
  [Dismiss]

✗ Only PDF, images, and Word documents are allowed.
  [Dismiss]
```

**Info:**
```
ℹ Redirecting to login...
  [Dismiss]

ℹ File uploaded successfully.
  [Dismiss]
```

### Alert Boxes (on page)

**Deadline Passed:**
```
⚠️ APPLICATION CLOSED

The application deadline for this scholarship 
has passed.

Deadline was: December 31, 2025

[Go Back]
```

**Unauthenticated:**
```
You need to sign in to apply for scholarships
[Redirect to login]
```

---

## Pre-filling from User Profile

When user navigates to application form, the following fields are pre-filled from their profile:

```
first_name      ← user.first_name
last_name       ← user.last_name
email           ← user.email
phone           ← user.phone
```

**User can still edit these fields**

---

## Mobile Experience

### Responsive Design
- **Desktop (≥1024px)**: Two-column form layout where applicable
- **Tablet (768px-1024px)**: Single column with adjusted spacing
- **Mobile (<768px)**: Full-width single column

### Touch-friendly
- Larger tap targets (≥44px)
- Clear visual feedback on interaction
- Minimized scrolling requirements
- File upload: Works with device file picker

### Form Sections
- Collapsible on mobile for progressive disclosure
- Clear visual separation between sections
- Sticky section headers while scrolling

---

## Accessibility Features

### Keyboard Navigation
- Tab through all form fields
- Enter to submit form
- Escape to close modals/confirmations
- Arrow keys for dropdowns

### Screen Readers
- Form labels properly associated with inputs
- Error messages announced
- Success messages announced
- Section headings structured with hierarchy

### Visual
- High contrast text (WCAG AA compliant)
- Red/green not sole indicators (use icons too)
- Clear error messages
- Readable font sizes (min 14px on mobile)

---

## Troubleshooting Flows

### "The button doesn't work"
```
1. Check if you're logged in
2. Check if deadline has passed
3. Check browser console for errors
4. Try refreshing the page
5. Contact support if issue persists
```

### "My file won't upload"
```
1. Check file size (max 5MB)
2. Check file type (PDF, image, Word only)
3. Try different file
4. Try uploading one file at a time
5. Check internet connection
```

### "Application won't submit"
```
1. Fill all required fields (marked with *)
2. Check form for red error messages
3. Verify all validations pass (email, GPA, etc.)
4. Try clearing cache and reload
5. Try different browser
6. Contact support if still failing
```

---

## Confirmation Checklist

Before users hit submit:
- ✓ All required fields filled (marked with *)
- ✓ No red error messages
- ✓ Email is valid format
- ✓ GPA is 0-4.0
- ✓ Date of birth is valid
- ✓ Terms accepted
- ✓ All required files uploaded (if applicable)

---

**Experience Design**: October 26, 2025
**Last Updated**: October 26, 2025
