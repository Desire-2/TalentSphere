# Quick Start: JSON Import for Scholarship Form

## How to Use

### Step 1: Open Import Dialog
Click the **"Import JSON"** button at the top of the Create Scholarship form (next to the Preview button).

### Step 2: Paste Your JSON
Copy and paste your scholarship data in JSON format into the text area.

### Step 3: Parse & Preview
Click **"Parse & Preview JSON"** to validate the format and see what will be imported.

### Step 4: Import
Review the preview, then click **"Import & Auto-Fill Form"** to populate the form.

### Step 5: Edit & Submit
Make any necessary adjustments and submit as normal.

## Minimal JSON Example

```json
{
  "title": "My Scholarship",
  "external_organization_name": "My Foundation",
  "description": "Scholarship description here",
  "scholarship_type": "merit",
  "category_id": "1",
  "amount_max": "5000",
  "currency": "USD",
  "application_deadline": "2024-12-31",
  "application_type": "external",
  "application_url": "https://example.com/apply"
}
```

## Full Example

See `/sample_scholarship_import.json` for a complete example with all possible fields.

## Common Fields

| Field | Description | Example |
|-------|-------------|---------|
| `title` | Scholarship name | "Tech Excellence Scholarship" |
| `external_organization_name` | Organization offering scholarship | "ABC Foundation" |
| `description` | Full description (supports Markdown) | "## About\n\nDetails..." |
| `scholarship_type` | Type of scholarship | "merit", "need", "athletic" |
| `amount_max` | Maximum award amount | "10000" |
| `currency` | Currency code | "USD", "EUR", "GBP" |
| `application_deadline` | Deadline date | "2024-12-31" |
| `application_type` | How to apply | "external", "email", "internal" |
| `application_url` | Application link | "https://..." |

## Tips

✅ **Use Markdown** in the description field for better formatting  
✅ **Include all required fields** to avoid validation errors  
✅ **Preview before importing** to catch any issues  
✅ **Test with sample file** first to understand the format  

## Supported Field Variations

Some fields accept multiple names:
- `organization_name` → `external_organization_name`
- `organization_website` → `external_organization_website`
- `organization_logo` → `external_organization_logo`

## Error Handling

If you see an error:
1. Check your JSON syntax (missing commas, quotes, brackets)
2. Use a JSON validator online if needed
3. Make sure dates are in YYYY-MM-DD format
4. Ensure numeric fields contain numbers (as strings is OK)

## Need Help?

- See full documentation in `JSON_IMPORT_FEATURE_COMPLETE.md`
- Use the sample file at `/sample_scholarship_import.json`
- Check the console for detailed error messages

---

**Happy importing!** 🚀
