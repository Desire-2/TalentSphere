# 🤖 AI Job Generation Prompt for TalentSphere

## **Master Prompt for Generating Complete Job Data**

Copy and paste this prompt to any AI assistant to generate properly formatted job data for the TalentSphere CreateExternalJob form:

---

## **PROMPT:**

```
Generate a complete job posting in JSON format that includes ALL the following fields. Create a realistic, professional job posting for [JOB_TITLE] at [COMPANY_NAME]. The JSON should be ready to import into a job posting form.

Required JSON Structure:
{
  "title": "[Job title - be specific and professional]",
  "summary": "[One compelling sentence describing the role - 100-150 characters]",
  "description": "[Detailed HTML-formatted job description with sections for About the Role, Key Responsibilities, What We Offer - minimum 300 words]",
  "employment_type": "[Choose: full_time, part_time, contract, internship, freelance]",
  "experience_level": "[Choose: entry, junior, mid, senior, executive]",
  "category_id": "[Choose a number 1-10 representing job category]",
  "external_company_name": "[Company name]",
  "external_company_website": "[Valid company website URL]",
  "external_company_logo": "[Valid company logo URL or placeholder]",
  "location_type": "[Choose: remote, on_site, hybrid]",
  "location_city": "[City name]",
  "location_state": "[State/Province name]",
  "location_country": "[Country name]",
  "salary_min": [Minimum salary as number],
  "salary_max": [Maximum salary as number],
  "salary_currency": "[Choose: USD, EUR, GBP, etc.]",
  "salary_period": "[Choose: hourly, monthly, annual]",
  "show_salary": [true or false],
  "salary_negotiable": [true or false],
  "required_skills": "[Bullet-pointed list using • for each skill/requirement]",
  "preferred_skills": "[Bullet-pointed list using • for each preferred qualification]",
  "years_experience_min": [Minimum years as number],
  "years_experience_max": [Maximum years as number],
  "education_requirement": "[Education requirements as string]",
  "application_type": "[Choose: external_url, email, internal]",
  "application_url": "[Application URL if external_url type]",
  "application_email": "[Email address for applications]",
  "application_instructions": "[Detailed instructions for applying - 100-200 words]"
}

IMPORTANT FORMATTING RULES:
1. The "description" field must use HTML tags like <h2>, <h3>, <p>, <ul>, <li> for proper formatting
2. Skills sections should use bullet points with • character
3. All salary fields should be numbers without currency symbols
4. Boolean fields (show_salary, salary_negotiable) should be true/false without quotes
5. All URLs must be valid and realistic
6. Make the content professional, engaging, and realistic for the specified role

Create a job posting for: [SPECIFY JOB ROLE AND INDUSTRY HERE]
```

---

## **Example Usage Prompts**

### **For Tech Jobs:**
```
Generate a complete job posting in JSON format following the structure above for a "Senior React Developer" position at "InnovateTech Solutions" in the software development industry.
```

### **For Marketing Jobs:**
```
Generate a complete job posting in JSON format following the structure above for a "Digital Marketing Manager" position at "GrowthHub Marketing" in the digital marketing industry.
```

### **For Healthcare Jobs:**
```
Generate a complete job posting in JSON format following the structure above for a "Registered Nurse" position at "CareFirst Medical Center" in the healthcare industry.
```

### **For Finance Jobs:**
```
Generate a complete job posting in JSON format following the structure above for a "Financial Analyst" position at "WealthTech Financial Services" in the finance industry.
```

### **For Design Jobs:**
```
Generate a complete job posting in JSON format following the structure above for a "UX/UI Designer" position at "PixelPerfect Design Studio" in the creative industry.
```

---

## **Advanced Customization Prompts**

### **For Specific Salary Range:**
```
[Use the main prompt above] + "Set the salary range between $75,000 - $95,000 annually and make salary negotiable."
```

### **For Remote-First Companies:**
```
[Use the main prompt above] + "Make this a fully remote position with emphasis on distributed team collaboration and async work culture."
```

### **For Startup Environment:**
```
[Use the main prompt above] + "Create this for a fast-growing startup environment with equity options, flexible culture, and growth opportunities."
```

### **For Enterprise Company:**
```
[Use the main prompt above] + "Create this for a large enterprise company with comprehensive benefits, structured career progression, and corporate culture."
```

---

## **Field Reference Guide**

### **Employment Types:**
- `full_time` - Standard full-time position
- `part_time` - Part-time position
- `contract` - Contract/temporary work
- `internship` - Internship program
- `freelance` - Freelance/gig work

### **Experience Levels:**
- `entry` - 0-2 years experience
- `junior` - 1-3 years experience
- `mid` - 3-7 years experience
- `senior` - 5-12 years experience
- `executive` - 10+ years, leadership roles

### **Location Types:**
- `remote` - Fully remote work
- `on_site` - Must work from office
- `hybrid` - Mix of remote and office

### **Application Types:**
- `external_url` - Apply through company website
- `email` - Apply via email
- `internal` - Apply through internal system

### **Category IDs (Reference):**
1. Technology/Software
2. Marketing/Sales
3. Healthcare/Medical
4. Finance/Accounting
5. Education/Training
6. Creative/Design
7. Operations/Management
8. Customer Service
9. Engineering/Manufacturing
10. Legal/Compliance

---

## **Quality Checklist**

When reviewing AI-generated job data, ensure:

✅ **Complete Fields**: All required fields are filled
✅ **Valid Format**: JSON is properly formatted
✅ **Realistic Data**: Salary ranges and requirements are market-appropriate
✅ **Professional Tone**: Content is engaging and professional
✅ **HTML Formatting**: Description uses proper HTML tags
✅ **Bullet Points**: Skills use • character for consistency
✅ **Valid URLs**: All URLs are realistic and properly formatted
✅ **Appropriate Length**: Description is comprehensive but not excessive
✅ **Industry Accuracy**: Requirements match the specified role and industry

---

## **Quick Copy Templates**

### **Basic Template:**
```
Generate a complete job posting in JSON format following the TalentSphere structure for a "[JOB_TITLE]" position at "[COMPANY_NAME]" in the [INDUSTRY] industry. Include all required fields with realistic, professional content.
```

### **Detailed Template:**
```
Create a comprehensive job posting in JSON format for a [EXPERIENCE_LEVEL] [JOB_TITLE] role at [COMPANY_NAME]. Make it [REMOTE/HYBRID/ON_SITE] with a salary range of $[MIN] - $[MAX] [PERIOD]. Focus on [SPECIFIC_REQUIREMENTS] and include attractive benefits. Format the description with HTML tags and use bullet points for skills.
```

---

## **Pro Tips for Better Results**

1. **Be Specific**: Mention industry, company size, and culture
2. **Include Context**: Add information about team size, reporting structure
3. **Specify Benefits**: Mention specific perks, benefits, growth opportunities  
4. **Set Constraints**: Define salary ranges, experience levels, location preferences
5. **Request Variations**: Ask for multiple versions to compare options
6. **Industry Research**: Reference current market trends and requirements

---

*Use these prompts with ChatGPT, Claude, Gemini, or any AI assistant to generate complete, professional job postings that perfectly match your TalentSphere form structure!*