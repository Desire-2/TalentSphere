# 🚀 AI CV Builder - Quick Start Guide

## Immediate Setup (5 Minutes)

### 1. Get Google Gemini API Key (FREE)

Visit: https://makersuite.google.com/app/apikey
- Sign in with Google account
- Click "Create API Key"
- Copy the key

### 2. Configure Backend

```bash
cd backend

# Add to .env file (create if doesn't exist)
echo "GEMINI_API_KEY=your_api_key_here" >> .env

# Install required packages
pip install google-genai==0.3.0 WeasyPrint==63.0
```

### 3. Install System Dependencies (for PDF generation)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install python3-cffi python3-brotli libpango-1.0-0 libpangocairo-1.0-0
```

**macOS:**
```bash
brew install cairo pango gdk-pixbuf libffi
```

**Windows:**
```bash
# WeasyPrint will install automatically with pip
# No additional dependencies needed
```

### 4. Start Backend

```bash
cd backend
python src/main.py
```

Backend should start on `http://localhost:5001`

### 5. Start Frontend

```bash
cd talentsphere-frontend
npm install  # if not already done
npm run dev
```

Frontend should start on `http://localhost:5173`

## 🎯 Using the CV Builder

### Access the Feature

1. Login as a **job seeker** user
2. Go to **Dashboard**
3. Click **"AI CV Builder"** button (purple button in header)

OR

4. Navigate directly to: `http://localhost:5173/jobseeker/cv-builder`

### Generate Your First CV

**Option A: General CV (No Specific Job)**
1. Choose style: "Professional"
2. Keep all sections selected
3. Click "Generate AI CV"
4. Wait 10-20 seconds for AI processing
5. Review ATS score and tips
6. Click "Download PDF"

**Option B: Job-Tailored CV**
1. Enter custom job details:
   - Job Title: "Senior Software Engineer"
   - Job Description: (paste any job description)
   - Requirements: (paste job requirements)
2. Choose style: "Modern"
3. Click "Generate AI CV"
4. Review optimized content
5. Download PDF

## 📊 Test the System

```bash
cd backend

# Set test credentials
export TEST_USER_EMAIL=jobseeker@test.com
export TEST_USER_PASSWORD=password123

# Run comprehensive tests
python test_cv_builder.py
```

Expected output:
```
✅ Logged in as jobseeker@test.com
✅ User CV data retrieved successfully
✅ Retrieved 5 CV styles
✅ General CV generated successfully
✅ Tailored CV generated successfully
✅ Professional style CV generated
✅ Creative style CV generated
✅ Modern style CV generated
✅ Minimal style CV generated
✅ Executive style CV generated
✅ HTML preview generated

🎉 All tests passed! CV Builder system is working correctly.
```

## 🎨 Available CV Styles

1. **Professional** - For corporate, finance, legal, consulting
2. **Creative** - For design, marketing, media
3. **Modern** - For tech, startups, digital industries
4. **Minimal** - For executive, academic, research
5. **Executive** - For C-suite, VP, director-level

## 💡 Pro Tips

### For Best Results

1. **Complete Your Profile First**
   - Add work experiences with achievements
   - Include education with GPA
   - Add certifications and projects
   - Update skills section

2. **Be Specific with Job Details**
   - Paste full job description
   - Include all requirements
   - Add company context

3. **Choose Appropriate Style**
   - Professional → Banking, Law, Finance
   - Creative → Design, Advertising, Media
   - Modern → Tech Startups, Digital
   - Minimal → Senior Executive, Academic
   - Executive → C-Level, Board Level

4. **Review ATS Score**
   - Aim for 80%+ for best results
   - Follow optimization tips
   - Add suggested keywords

### Common Use Cases

**Scenario 1: Quick Application**
- Select job from dropdown
- Generate → Download
- Attach to application
⏱️ Time: 30 seconds

**Scenario 2: Career Change**
- Use custom job details
- Choose creative/modern style
- Emphasize transferable skills
⏱️ Time: 2 minutes

**Scenario 3: Executive Position**
- Use executive style
- Focus on leadership sections
- Highlight board experience
⏱️ Time: 3 minutes

## 🔧 Troubleshooting

### Issue: "AI service not configured"
**Solution:**
```bash
cd backend
echo "GEMINI_API_KEY=your_actual_key" >> .env
# Restart backend
```

### Issue: PDF Download Fails
**Solution:**
```bash
# Install WeasyPrint dependencies (see step 3 above)
# Then restart backend
```

### Issue: No Jobs in Dropdown
**Solution:**
- Use "Custom Job Details" section instead
- Or apply to some jobs first

### Issue: CV Generation Takes Too Long
**Cause:** Gemini API rate limiting or large profile
**Solution:**
- Wait 60 seconds and try again
- Reduce number of sections
- Check API quota at https://makersuite.google.com

## 📈 What Gets Generated

For each CV, the AI creates:

✅ **Professional Summary** - Compelling 3-4 sentence overview  
✅ **Contact Information** - Name, title, location, links  
✅ **Core Competencies** - 5-8 key skills optimized for job  
✅ **Professional Experience** - Achievement-focused bullet points  
✅ **Education** - Degrees with honors and relevant coursework  
✅ **Skills** - Categorized technical and soft skills  
✅ **Certifications** - Professional credentials  
✅ **Projects** - Portfolio highlights with impact metrics  
✅ **Awards** - Recognition and achievements  
✅ **ATS Score** - Estimated compatibility (0-100%)  
✅ **Optimization Tips** - Specific improvement suggestions  

## 🎯 Next Steps

After generating your CV:

1. **Review Content Carefully**
   - Ensure all information is accurate
   - Verify dates and company names
   - Check for any AI hallucinations

2. **Customize Further**
   - Add personal touches
   - Include specific metrics
   - Tailor summary for each application

3. **Test ATS Compatibility**
   - Upload to test ATS systems
   - Use JobScan or similar tools
   - Aim for 80%+ match

4. **Create Multiple Versions**
   - Different styles for different industries
   - Tailored versions for specific companies
   - One-page vs. two-page versions

## 📞 Need Help?

- **Documentation:** See `AI_CV_BUILDER_COMPLETE_GUIDE.md`
- **Test Script:** Run `python test_cv_builder.py`
- **API Docs:** Check backend routes in `src/routes/cv_builder.py`
- **Examples:** See test script for request/response examples

---

**Ready to Create Your Perfect CV? Let's Go! 🚀**
