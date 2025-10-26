# 🎯 QUICK REFERENCE: AI Scholarship Generation

## Copy-Paste Ready Prompt

```
Generate a complete scholarship opportunity in JSON format with ALL fields populated.

SCHOLARSHIP CONTEXT: [Describe your scholarship here - e.g., "Merit-based scholarship for engineering students from underrepresented communities, $50,000 total, renewable for 4 years"]

Required JSON structure:
{
  "title": "Scholarship name (50-100 chars)",
  "summary": "Brief description (150-200 chars)",
  "description": "Markdown formatted full description with ## headers and bullet points",
  "scholarship_type": "merit|need|athletic|artistic|community|research|leadership|other",
  "category_id": "1",
  "external_organization_name": "Organization name",
  "external_organization_website": "https://...",
  "external_organization_logo": "https://.../logo.png",
  "source_url": "https://...",
  "study_level": "high_school|undergraduate|graduate|postgraduate|doctoral|any",
  "field_of_study": "Accepted fields or 'Any field'",
  "location_type": "any|specific|region|online",
  "country": "Country name or empty",
  "city": "City name or empty",
  "state": "State/Province or empty",
  "amount_min": "Minimum amount (numbers only)",
  "amount_max": "Maximum amount (numbers only)",
  "currency": "USD|EUR|GBP|CAD|AUD|etc",
  "funding_type": "full|partial|stipend|other",
  "renewable": true|false,
  "duration_years": 1|2|3|4,
  "min_gpa": "3.0|3.5|3.7 or empty",
  "citizenship_requirements": "Citizenship requirements or 'Open to all'",
  "age_min": "Minimum age or empty",
  "age_max": "Maximum age or empty",
  "gender_requirements": "any|male|female|non_binary|other",
  "application_deadline": "YYYY-MM-DD",
  "award_date": "YYYY-MM-DD",
  "application_type": "external|email|internal",
  "application_url": "https://... (if type=external)",
  "application_email": "email@domain.com (if type=email)",
  "application_instructions": "Detailed how-to-apply steps",
  "required_documents": "Markdown list of required documents",
  "benefits": "Markdown formatted comprehensive benefits",
  "requirements": "Markdown formatted eligibility requirements",
  "selection_criteria": "Evaluation process and criteria",
  "contact_email": "contact@domain.com",
  "contact_phone": "+1-xxx-xxx-xxxx or empty",
  "meta_keywords": "comma, separated, keywords",
  "tags": "comma, separated, tags",
  "status": "published|draft"
}

Output ONLY valid JSON. Fill ALL fields with realistic, professional content.
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Customize Context
Replace `[Describe your scholarship here]` with your specific scholarship details.

**Example:**
```
SCHOLARSHIP CONTEXT: Merit-based scholarship for computer science students with 3.5+ GPA, $40,000 total over 4 years, includes summer internships at tech companies
```

### Step 2: Send to AI
Copy entire prompt → Paste to ChatGPT/Claude/Gemini → Submit

### Step 3: Import to TalentSphere
Copy JSON output → Click "Import JSON" in form → Parse → Import → Done! ✅

---

## 📋 Ready-to-Use Examples

### Example 1: Tech Scholarship
```
SCHOLARSHIP CONTEXT: Merit-based scholarship for undergraduate computer science students with strong academic records (GPA 3.7+) and demonstrated leadership in tech communities. $100,000 over 4 years, renewable. Includes internships, mentorship, and conference attendance. Sponsored by Tech Leaders Foundation.
```

### Example 2: Medical Scholarship
```
SCHOLARSHIP CONTEXT: Need-based scholarship for medical students from low-income families committed to rural healthcare. Full tuition ($200,000) plus $30,000 annual stipend. Requires 5-year rural service commitment. Open to all medical specialties, preference for primary care.
```

### Example 3: Arts Scholarship
```
SCHOLARSHIP CONTEXT: Artistic scholarship for undergraduate fine arts students specializing in digital media, animation, or graphic design. $15,000 total ($7,500/year for 2 years). Requires portfolio submission. Includes studio internship placement. Ages 18-25, international students welcome.
```

### Example 4: First-Gen Scholarship
```
SCHOLARSHIP CONTEXT: Scholarship for first-generation college students from underrepresented communities. $20,000 over 4 years ($5,000/year), renewable with 3.0 GPA. Includes mentoring, counseling, and career development. Open to all majors. Priority to students pursuing education or social work careers.
```

### Example 5: Research Scholarship
```
SCHOLARSHIP CONTEXT: Research scholarship for doctoral students conducting climate change and sustainability research. $60,000 total ($20,000/year for 3 years). Includes conference funding, research materials budget, and international collaboration opportunities. Must have published research or strong proposal.
```

---

## ✅ Import Checklist

Before importing AI-generated JSON:

- [ ] All text fields have content (no empty required fields)
- [ ] Dates in YYYY-MM-DD format
- [ ] Amounts are numbers without $ or commas
- [ ] URLs start with https://
- [ ] JSON is valid (use jsonlint.com to check)
- [ ] Content looks professional
- [ ] No [PLACEHOLDER] text

---

## 🎯 Field Quick Reference

| Field | Must Include | Example |
|-------|--------------|---------|
| title | Scholarship name | "STEM Excellence Award 2026" |
| amount_max | Numbers only | "50000" not "$50,000" |
| deadline | YYYY-MM-DD | "2026-06-30" |
| scholarship_type | Exact match | "merit" not "Merit-based" |
| study_level | Exact match | "undergraduate" not "Undergrad" |
| description | Markdown format | "## About\n\nDetails..." |

---

## 💡 Pro Tips

1. **Be Specific**: More detail = better output
2. **Check Dates**: Must be future dates in YYYY-MM-DD
3. **Review Content**: AI is good but verify accuracy
4. **Test First**: Try one before batch generating
5. **Save Prompts**: Reuse successful prompts
6. **Iterate**: Refine prompt if output isn't perfect

---

## 🔧 Common Fixes

| Problem | Fix |
|---------|-----|
| Parse error | Check JSON syntax at jsonlint.com |
| Missing fields | Add to SCHOLARSHIP CONTEXT |
| Wrong date format | Change to YYYY-MM-DD |
| Import fails | Verify required fields present |
| Amounts wrong | Remove $ and commas |

---

## 📞 Need More Help?

📖 **Full Guide:** `AI_SCHOLARSHIP_GENERATION_PROMPT.md`  
🎨 **Visual Guide:** `JSON_IMPORT_VISUAL_GUIDE.md`  
🚀 **Quick Start:** `JSON_IMPORT_QUICK_START.md`  
📄 **Sample:** `sample_scholarship_import.json`

---

## 🌟 Recommended AI Tools

| Tool | Best For | Access |
|------|----------|--------|
| **ChatGPT** (GPT-4) | Comprehensive, detailed scholarships | chat.openai.com |
| **Claude** | Complex requirements, perfect JSON | claude.ai |
| **Google Gemini** | Multiple variations, fast | gemini.google.com |
| **Copilot** | Quick generation | copilot.microsoft.com |

---

**Print this page and keep it handy for quick scholarship generation!** 📋✨

---

*Last Updated: October 26, 2025*
