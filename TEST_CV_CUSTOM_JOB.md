# Testing Custom Job Details in CV Builder

## Steps to Test

### 1. Open CV Builder
- Navigate to `/cv-builder-new` in the frontend
- Make sure you're logged in as a job seeker

### 2. Configure for Custom Job
- In the "Target Job" dropdown, select **"General CV (No Specific Job)"**
- This should show the custom job details form

### 3. Fill in Custom Job Details
Enter the following test data:

**Job Title:** Senior Full Stack Developer

**Company Name:** TechCorp Solutions

**Job Description:**
```
We are seeking an experienced Full Stack Developer to join our team. 
You will work on building scalable web applications using React, Node.js, and Python.
The ideal candidate has 5+ years of experience and strong problem-solving skills.
```

**Requirements:**
```
- 5+ years of web development experience
- Proficiency in React, Node.js, Python
- Experience with PostgreSQL and MongoDB
- Strong communication and teamwork skills
- Bachelor's degree in Computer Science or related field
```

### 4. Generate CV
- Click "Generate AI-Powered CV"
- Check the browser console for debug logs

### 5. Expected Debug Output

**In Browser Console:**
```
=== CV Generation Debug ===
Selected Job ID: none
Custom Job Title: Senior Full Stack Developer
Custom Job Company: TechCorp Solutions
Custom Job Description: We are seeking an experienced Full Stack Developer...
Custom Job Requirements: - 5+ years of web development experience...
Using custom job_data from form fields
job_data object: {
  title: "Senior Full Stack Developer",
  company_name: "TechCorp Solutions",
  description: "We are seeking...",
  requirements: "- 5+ years..."
}
Final payload being sent: {
  "sections": ["work", "education", "skills", ...],
  "style": "professional",
  "job_data": {
    "title": "Senior Full Stack Developer",
    "company_name": "TechCorp Solutions",
    ...
  }
}
```

**In Backend Terminal:**
```
[CV Builder] Received request data: {...}
[CV Builder] Using custom job data: {
  'title': 'Senior Full Stack Developer',
  'company_name': 'TechCorp Solutions',
  ...
}
[CV Builder Service] Generating CV with job_data: {...}
[CV Builder Service] Style: professional, Sections: [...]
```

### 6. Verify CV Content
The generated CV should:
- ✅ Mention "Senior Full Stack Developer" role in professional summary
- ✅ Highlight React, Node.js, Python skills
- ✅ Reference TechCorp Solutions context
- ✅ Emphasize 5+ years experience
- ✅ Show relevant technical skills prominently

### 7. What to Check If It's NOT Working

**Problem:** Custom job details not reflected in CV

**Debugging Steps:**

1. **Check if fields are visible**
   - Is `selectedJobId === 'none'`?
   - Are the input fields showing?

2. **Check if data is captured**
   - Look at console logs: Are state variables populated?
   - Check: `customJobTitle`, `customJobCompany`, etc.

3. **Check if data is sent**
   - Look at payload in console: Does it have `job_data` property?
   - Check network tab: Is `job_data` in the POST request body?

4. **Check backend receives it**
   - Look at backend logs: Does it log "Using custom job data"?
   - Check: Is `job_data` extracted from request?

5. **Check AI service uses it**
   - Look for: "[CV Builder Service] Generating CV with job_data:"
   - Verify: job_data is not `None` or `null`

### 8. Common Issues

**Issue 1:** Fields not showing
- **Cause:** `selectedJobId` is not 'none'
- **Fix:** Make sure dropdown shows "General CV (No Specific Job)" option

**Issue 2:** Data sent but not used
- **Cause:** AI prompt not including job context
- **Fix:** Verify `_build_cv_generation_prompt` uses `job_data` parameter

**Issue 3:** Empty fields sent
- **Cause:** Form inputs not bound to state
- **Fix:** Verify `onChange` handlers update state correctly

## Current Code Status

### Frontend (CVBuilderNew.jsx)
✅ State variables created: `customJobTitle`, `customJobCompany`, etc.
✅ Conditional rendering: Shows when `selectedJobId === 'none'`
✅ Payload construction: Adds `job_data` when `customJobTitle` is filled
✅ Debug logging: Comprehensive console logs added

### Backend (cv_builder.py)
✅ Route extracts: `job_data = data.get('job_data')`
✅ Debug logging: Logs when custom job data received
✅ Passes to service: `cv_service.generate_cv_content(..., job_data=job_data)`

### AI Service (cv_builder_service.py)
✅ Accepts parameter: `job_data: Optional[Dict[str, Any]] = None`
✅ Debug logging: Logs job_data received
✅ Uses in prompt: `_build_cv_generation_prompt` includes job context

## Next Steps

1. **Run the test** with the sample data above
2. **Capture console logs** from both frontend and backend
3. **Verify the flow** matches expected output
4. **Check the CV content** for job-specific optimization

If issues persist, share the console logs for further debugging!
