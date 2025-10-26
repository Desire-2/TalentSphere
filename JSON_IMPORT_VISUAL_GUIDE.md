# 📸 Visual Guide: JSON Import Feature

## Feature Overview

The JSON Import feature adds a powerful way to quickly populate the Create Scholarship form using JSON data.

## UI Elements

### 1. Import Button Location
```
╔════════════════════════════════════════════════════════════╗
║  [← Back to Scholarships]                                  ║
║                                                             ║
║  Create New Scholarship                                    ║
║  Post scholarship opportunities for students               ║
║                                                             ║
║                           [📤 Import JSON]  [👁 Preview]  ║  ← NEW!
╚════════════════════════════════════════════════════════════╝
```

### 2. Import Dialog Modal
```
╔═══════════════════════════════════════════════════════════════╗
║  📤 Import Scholarship Data from JSON                    [×] ║
║  ───────────────────────────────────────────────────────────  ║
║  Paste your scholarship data in JSON format below.           ║
║  You can preview and then import it to auto-fill the form.   ║
║                                                               ║
║  JSON Data                                                    ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ {                                                        │ ║
║  │   "title": "Example Scholarship",                       │ ║
║  │   "external_organization_name": "Foundation",           │ ║
║  │   "description": "Scholarship description...",          │ ║
║  │   "amount_max": "10000",                                │ ║
║  │   "currency": "USD",                                    │ ║
║  │   ...                                                   │ ║
║  │ }                                                        │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  [✓ Parse & Preview JSON]  [× Cancel]                        ║
║                                                               ║
║  ═══════════════════════════════════════════════════════════ ║
║                                                               ║
║  👁 Preview - Fields to be Imported                           ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ title: Example Scholarship                              │ ║
║  │ external_organization_name: Foundation                  │ ║
║  │ description: Scholarship description...                 │ ║
║  │ amount_max: 10000                                       │ ║
║  │ currency: USD                                           │ ║
║  │ ... (+ more fields)                                     │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║                           [✓ Import & Auto-Fill Form]        ║
║                                                               ║
║  💡 Tip: The JSON should contain scholarship fields like     ║
║  title, description, external_organization_name, etc.        ║
╚═══════════════════════════════════════════════════════════════╝
```

## Workflow Steps

### Step 1: Click Import Button
```
User Action: Click "Import JSON" button
           ↓
Result: Modal dialog opens
```

### Step 2: Paste JSON
```
User Action: Paste scholarship JSON data into textarea
           ↓
Result: JSON text stored in state
```

### Step 3: Parse & Preview
```
User Action: Click "Parse & Preview JSON"
           ↓
System: Validates JSON format
           ↓
        [Valid?]
       /        \
     YES        NO
      ↓          ↓
  Show Preview  Show Error
```

### Step 4: Review Preview
```
Preview Shows:
┌─────────────────────────────────┐
│ Field Name    →    Value        │
├─────────────────────────────────┤
│ title         →    "My Scholar" │
│ amount_max    →    "5000"       │
│ currency      →    "USD"        │
│ ...                             │
└─────────────────────────────────┘
```

### Step 5: Import Data
```
User Action: Click "Import & Auto-Fill Form"
           ↓
System: Maps JSON fields to formData
           ↓
System: Updates all matching form fields
           ↓
System: Shows success notification
           ↓
System: Closes modal
           ↓
Result: Form is populated with JSON data! ✅
```

## State Flow Diagram

```
Initial State:
showJsonImport = false (Modal hidden)
jsonText = ''
jsonError = ''
jsonPreview = null

           ↓
[User clicks "Import JSON"]
           ↓
showJsonImport = true (Modal visible)

           ↓
[User pastes JSON]
           ↓
jsonText = "{...}" (User's JSON)

           ↓
[User clicks "Parse & Preview"]
           ↓
   Try JSON.parse()
           ↓
    [Success?]
       /    \
     YES    NO
      ↓      ↓
  jsonPreview  jsonError
  = parsed     = error msg
  jsonError    jsonPreview
  = ''         = null

           ↓
[User clicks "Import & Auto-Fill"]
           ↓
formData updated with jsonPreview
           ↓
All states reset to initial
Modal closes
```

## Field Mapping Examples

### Example 1: Basic Import
```
Input JSON:                    Output Form:
{                             ┌──────────────────────┐
  "title": "My Scholarship",  │ Title: My Scholarship│
  "amount_max": "5000"        │ Max Amount: 5000     │
}                             └──────────────────────┘
```

### Example 2: Field Variations
```
Input JSON:                           Mapped To:
"organization_name"          →        external_organization_name
"organization_website"       →        external_organization_website
"organization_logo"          →        external_organization_logo
```

### Example 3: Partial Import
```
Existing Form:                Input JSON:              Result:
┌──────────────────┐        {                       ┌──────────────────┐
│ Title: Old       │          "title": "New",      │ Title: New       │ ← Updated
│ Amount: 1000     │          "currency": "EUR"    │ Amount: 1000     │ ← Kept
│ Currency: USD    │        }                      │ Currency: EUR    │ ← Updated
└──────────────────┘                                └──────────────────┘
```

## Error Handling

### Valid JSON
```
Input: {"title": "Test"}
         ↓
✅ Success Toast: "JSON parsed successfully! Review the preview below."
         ↓
Preview Section Appears
```

### Invalid JSON
```
Input: {title: "Test"}  (missing quotes)
         ↓
❌ Error Alert: "Invalid JSON: Unexpected token t in JSON at position 1"
         ↓
❌ Error Toast: "Invalid JSON format"
```

## Success Flow

```
┌──────────────────────┐
│ 1. Click Import      │
│    Button            │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│ 2. Paste JSON        │
│    Data              │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│ 3. Parse &           │
│    Preview           │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│ 4. Review            │
│    Preview           │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│ 5. Import &          │
│    Auto-Fill         │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│ ✅ Form Populated!   │
│ 🎉 Success!          │
└──────────────────────┘
```

## Component Hierarchy

```
CreateScholarship
  ├─ Header
  │   ├─ Back Button
  │   ├─ Title
  │   └─ Actions
  │       ├─ Import JSON Button ← NEW
  │       └─ Preview Button
  │
  ├─ Form
  │   └─ (All form fields)
  │
  └─ JSON Import Dialog ← NEW
      ├─ Dialog Header
      │   ├─ Title
      │   └─ Description
      │
      ├─ JSON Input
      │   ├─ Label
      │   ├─ Textarea
      │   └─ Error Alert (conditional)
      │
      ├─ Action Buttons
      │   ├─ Parse Button
      │   └─ Cancel Button
      │
      ├─ Preview Section (conditional)
      │   ├─ Preview Title
      │   ├─ Fields Grid
      │   └─ Import Button
      │
      └─ Help Alert
```

## Toast Notifications

### Success Notifications
```
✅ "JSON parsed successfully! Review the preview below."
   (After successful parsing)

✅ "Form populated from JSON successfully!"
   (After successful import)
```

### Error Notifications
```
❌ "Invalid JSON format"
   (When JSON.parse() fails)

❌ "Please parse the JSON first"
   (When trying to import without parsing)
```

## Color Coding

```
🔵 Blue     - Primary actions (Parse, Import)
⚪ White    - Secondary actions (Cancel)
🟢 Green    - Import & Auto-Fill button
🔴 Red      - Error messages
🟡 Yellow   - Info/Help messages
```

## Responsive Behavior

```
Desktop (>1024px):
┌─────────────────────────────────────┐
│         Full Width Modal            │
│  ┌──────────────────────────────┐  │
│  │   Large JSON Editor          │  │
│  │   (Easy to read/edit)        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘

Mobile (<768px):
┌──────────────────┐
│   Full Screen    │
│  ┌────────────┐  │
│  │  Compact   │  │
│  │   Editor   │  │
│  └────────────┘  │
└──────────────────┘
```

---

## Quick Reference

| Action | Result |
|--------|--------|
| Click "Import JSON" | Opens dialog |
| Paste JSON | Stores in state |
| Click "Parse" | Validates & shows preview |
| Click "Import" | Populates form |
| Click "Cancel" | Closes dialog |

**All fields supported: 41/41** ✅

---

**Visual guide complete!** Use this as a reference for understanding the UI flow. 🎨
