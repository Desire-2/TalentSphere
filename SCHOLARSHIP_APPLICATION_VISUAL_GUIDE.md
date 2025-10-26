# Scholarship Application - Visual Component Guide

## Component Architecture

```
ScholarshipDetail.jsx
    ↓
    ├── Apply Button (Smart Logic)
    │   ├── External → Opens URL
    │   ├── Email → Opens Email Client
    │   └── Internal → Navigate to Form
    │
    └── Info Cards
        ├── External Info Card (Blue)
        ├── Email Info Card (Purple)
        └── Internal Info Card (Green)


/scholarships/:id/apply
    ↓
    └── ScholarshipApplication.jsx
        ├── Header Section
        ├── Scholarship Summary Card
        ├── Alert Box
        ├── Form Sections (7)
        │   ├── Personal Information
        │   ├── Education Information
        │   ├── Address Information
        │   ├── Application Essays
        │   ├── Experience & Activities
        │   ├── Supporting Documents
        │   └── Terms & Conditions
        ├── Submit Buttons
        └── Modal Dialogs (if needed)


/scholarships/:id/application-success
    ↓
    └── ApplicationSuccess.jsx
        ├── Success Icon
        ├── Title & Subtitle
        ├── Confirmation Details Card
        ├── What Happens Next Section
        ├── Pro Tips
        └── Action Buttons
```

## UI Component Mapping

### ScholarshipDetail.jsx - Apply Section

```
┌─────────────────────────────────────────────────┐
│ Apply Card                                      │
├─────────────────────────────────────────────────┤
│ Apply Now                                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Award Amount: $[Amount]                        │
│  [Blue Box]                                     │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🔗 Apply Externally    [External Link] │   │
│  │    or                                   │   │
│  │ 📧 Send Application Email [Mail Link]  │   │
│  │    or                                   │   │
│  │ ✓ Apply Now [Internal Button]           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Logged in: Your profile will be pre-filled   │
│                                                 │
│  [Blue Info Card - based on type]              │
│  [External/Email/Internal specific info]       │
│                                                 │
│  [Yellow Tip Card]                             │
│  Application Tips                              │
│  • Ensure your profile is complete             │
│  • Read all eligibility requirements           │
│  • Apply well before deadline                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### ScholarshipApplication.jsx - Full Form

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Scholarship                                        │
│ Apply for Scholarship                                        │
│ [Scholarship Title]                                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 💡 APPLICATION REQUIREMENTS                                   │
│ Please fill all fields marked with *                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Scholarship Summary (Blue gradient background)               │
│ [Title] [Award Amount] [Deadline]                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 👤 PERSONAL INFORMATION                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [First Name *]    [Last Name *]                            │
│                                                              │
│ [Email *]         [Phone Number *]                         │
│                                                              │
│ [Date of Birth *]                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 🎓 EDUCATION INFORMATION                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [Current Institution *]                                    │
│                                                              │
│ [Study Level *]           [Current GPA * (0-4.0)]          │
│                                                              │
│ [Field of Study]                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 📍 ADDRESS INFORMATION                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [Country *]                                                │
│                                                              │
│ [State/Province]  [City *]         [Postal Code]           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

[... If Essays Required ...]

┌──────────────────────────────────────────────────────────────┐
│ 📖 APPLICATION ESSAYS                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [Essay Prompts Display]                                    │
│                                                              │
│ [Motivation Essay *]                                       │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Why do you want this scholarship?                    │   │
│ │                                                      │   │
│ │ [5-line textarea]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [Career Goals]                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [4-line textarea]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ... more essays ...                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 🏆 EXPERIENCE & ACTIVITIES                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [Extracurricular Activities]                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [3-line textarea]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ... more fields ...                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

[... If Documents Required ...]

┌──────────────────────────────────────────────────────────────┐
│ 📎 SUPPORTING DOCUMENTS                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ⬆️ Click to upload files                             │   │
│ │ PDF, JPEG, PNG, or Word documents (max 5MB each)    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Uploaded Files:                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📄 document.pdf                    234 KB      ✕    │   │
│ │ 📄 transcript.pdf                  156 KB      ✕    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Required:                                                  │
│ • Academic Transcript                                     │
│ • 2 Recommendation Letters                               │
│ • Portfolio (optional)                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ ✓ TERMS & CONDITIONS                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ☐ I agree to the terms and conditions *                    │
│   I confirm that the information provided in this          │
│   application is true and accurate to the best of my      │
│   knowledge. I understand that providing false             │
│   information may result in disqualification from this     │
│   scholarship.                                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ [Cancel]  .......................... [Submit Application]    │
└──────────────────────────────────────────────────────────────┘
```

### ApplicationSuccess.jsx - Success Page

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    ✓ [Green checkmark icon]                 │
│                                                              │
│               Application Submitted!                        │
│         Your scholarship application has been               │
│              successfully submitted.                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CONFIRMATION DETAILS                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📄 Application Reference: APP-1729951696           │    │
│  │ ────────────────────────────────────────────────── │    │
│  │ ✉️  Confirmation Email: Check your email for      │    │
│  │     a detailed receipt                             │    │
│  │ ────────────────────────────────────────────────── │    │
│  │ ⏱️  Next Steps: You'll be notified of the         │    │
│  │     results by email                               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  WHAT HAPPENS NEXT?                                        │
│  1. Your application will be reviewed by the               │
│     scholarship committee                                  │
│  2. You may receive follow-up requests for                │
│     additional information                                 │
│  3. Final results will be communicated via email           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  💡 PRO TIPS                                               │
│  • Keep your reference number for future correspondence    │
│  • Check your email regularly (including spam folder)      │
│  • Update your profile if you change contact information   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [View Scholarship Details]                               │
│  [Browse More Scholarships]                               │
│  [Go to Dashboard]                                        │
│                                                              │
│  Redirecting in 10 seconds...                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Color Scheme

### External Scholarships
- **Primary Color**: Blue (#3B82F6)
- **Background**: Blue-50 (#EFF6FF)
- **Border**: Blue-200 (#BFDBFE)
- **Text**: Blue-900 (#1E3A8A)
- **Icon**: ExternalLink (lucide-react)

### Email Scholarships
- **Primary Color**: Purple (#A855F7)
- **Background**: Purple-50 (#FAF5FF)
- **Border**: Purple-200 (#E9D5FF)
- **Text**: Purple-900 (#581C87)
- **Icon**: Mail (lucide-react)

### Internal Scholarships
- **Primary Color**: Green (#10B981)
- **Background**: Green-50 (#F0FDF4)
- **Border**: Green-200 (#BBDAF8)
- **Text**: Green-900 (#065F46)
- **Icon**: CheckCircle (lucide-react)

### Alerts & Warnings
- **Info**: Blue (#3B82F6)
- **Warning/Deadline**: Orange (#F97316)
- **Error**: Red (#EF4444)
- **Success**: Green (#10B981)
- **Validation Error**: Yellow (#EAB308)

## Responsive Breakpoints

```
Mobile (<640px)
├─ Single column forms
├─ Full-width buttons
├─ Stacked cards
└─ Large touch targets (44px min)

Tablet (640px - 1024px)
├─ Single or 2-column layout
├─ Sidebar optional
└─ Flexible cards

Desktop (>1024px)
├─ Full 2-3 column layout
├─ Side panels
└─ Optimized spacing
```

## Interactive States

### Button States
```
Default:     [Blue gradient button]
Hover:       [Darker gradient, cursor pointer]
Active:      [Pressed appearance]
Disabled:    [Grayed out, no cursor]
Loading:     [Spinner + "Processing..."]
Success:     [Green background]
Error:       [Red background]
```

### Input Field States
```
Empty:       [Gray border, placeholder text]
Focus:       [Blue border, blue shadow]
Valid:       [Green left border accent]
Invalid:     [Red border, error message below]
Disabled:    [Gray background, no interaction]
Filled:      [Show checkmark or indicator]
```

### Form Section States
```
Incomplete:  [Gray header, some fields empty]
In Progress: [Blue header, partial completion]
Complete:    [Green header with checkmark]
Error:       [Red header with alert icon]
```

## Animation Effects

### Page Transitions
- Fade in on load (200ms)
- Slide up on form section expand (300ms)
- Bounce on button click (100ms)

### Loading States
- Spinner rotation (continuous)
- Pulse effect on disabled elements
- Progress bar for file upload

### Success Feedback
- Scale up icon (300ms)
- Fade in confirmation details (500ms)
- Auto-redirect countdown

---

**Visual Design**: Consistent with TalentSphere design system
**Accessibility**: WCAG AA compliant
**Mobile First**: Responsive to all screen sizes
**Color Contrast**: All text meets accessibility standards

---

Last Updated: October 26, 2025
