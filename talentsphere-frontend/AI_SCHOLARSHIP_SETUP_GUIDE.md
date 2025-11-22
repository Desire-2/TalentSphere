# AI Scholarship Parser - Quick Setup Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Get API Key (1 minute)
1. Visit https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy your new API key

### Step 2: Configure (30 seconds)
```bash
cd talentsphere-frontend
echo "VITE_GEMINI_API_KEY=your_api_key_here" >> .env
npm run dev
```

### Step 3: Use It! (1 minute)
1. Go to External Admin → Create Scholarship
2. Click **✨ AI Auto-Fill** button
3. Paste scholarship content
4. Click **Parse with AI**
5. Review and submit!

## 📝 Sample Scholarships to Test

### Sample 1: Fulbright Scholarship
```
Fulbright Foreign Student Program

The Fulbright Program provides grants for international students to pursue Master's or Ph.D. degrees in the United States.

Award Amount: Full tuition, living stipend, health insurance ($25,000-$40,000 per year)
Duration: 2-4 years
Study Level: Graduate and Ph.D.
Field: All fields of study

Eligibility:
- Bachelor's degree or equivalent
- Minimum GPA: 3.3
- English proficiency (TOEFL/IELTS)
- Citizens of eligible countries
- Demonstrated leadership potential

Application Deadline: October 13, 2024
Application Type: Online application
Website: https://foreign.fulbrightonline.org/

Required Documents:
- Academic transcripts
- Three recommendation letters
- Personal statement (1000 words)
- Research proposal (for Ph.D. applicants)
- English proficiency test scores

Contact: fulbright@state.gov
```

### Sample 2: Rhodes Scholarship
```
Rhodes Scholarship at Oxford University

One of the world's oldest and most prestigious international scholarship programs for graduate study at the University of Oxford.

Financial Support: 
- Full tuition coverage
- Annual stipend of £18,180
- Health insurance
- Two economy flights to/from Oxford

Eligibility Requirements:
- Age: 18-27 years old
- Bachelor's degree completed
- Minimum GPA: 3.7/4.0
- Outstanding academic achievement
- Leadership qualities
- Commitment to service

Study Level: Graduate (Master's or D.Phil.)
Location: Oxford, United Kingdom
Duration: 2-3 years, renewable

Application Deadline: October 1, 2024
Application Process: Apply through Rhodes Trust website at https://www.rhodeshouse.ox.ac.uk/

Required Materials:
- Academic transcripts
- Personal statement
- Resume/CV
- 5-8 recommendation letters
- Proof of citizenship

Organization: Rhodes Trust
Website: https://www.rhodeshouse.ox.ac.uk/
```

### Sample 3: Chevening Scholarship
```
Chevening Scholarships - UK Government

The UK government's global scholarship program, funded by the Foreign, Commonwealth & Development Office.

Award Details:
- Full tuition fees (up to £30,000)
- Monthly living allowance (£1,347)
- Travel costs to/from UK
- Visa application cost
- One arrival allowance

Program Type: Merit-based, fully-funded
Duration: 1 year (Master's degree)
Study Level: Postgraduate
Location: Any UK university

Eligibility Criteria:
- Citizen of Chevening-eligible country
- Minimum 2:1 honors degree or equivalent
- At least 2 years of work experience
- Strong leadership potential
- Return to home country for 2 years after completion

Application Period: August 1 - November 7, 2024
How to Apply: Online application at https://www.chevening.org/apply/

Requirements:
- University degree (undergraduate)
- Work experience proof
- Two references
- Three study choices in UK
- Personal statement (500 words)
- Leadership essay

Contact: https://www.chevening.org/
Email: info@chevening.org
Gender: Open to all genders
Nationality: 160+ eligible countries
```

### Sample 4: DAAD Scholarship (Germany)
```
DAAD Scholarships for Graduate Study in Germany

German Academic Exchange Service (DAAD) offers scholarships for international students to pursue graduate degrees in Germany.

Funding:
€934 per month for graduates
€1,200 per month for doctoral candidates
Health insurance coverage
Travel allowance
Study and research allowance

Eligible Study Levels: Master's and Ph.D.
Fields: Engineering, Natural Sciences, Social Sciences, Arts
Location: Universities in Germany
Duration: 12-42 months depending on program

Eligibility:
- Bachelor's degree (Master's) or Master's degree (Ph.D.)
- Minimum GPA: 3.0
- German or English language proficiency
- Maximum age: 32 years (exceptions for Ph.D.)
- At least 2 years since last degree

Application Deadline: 
- September 30, 2024 (for courses starting in April)
- March 31, 2025 (for courses starting in October)

Application: Apply via DAAD portal at https://www.daad.de/en/

Required Documents:
- CV/Resume
- Letter of motivation
- Academic transcripts and certificates
- Two letters of recommendation
- German or English language certificate
- University admission letter (if available)

Organization: DAAD (Deutscher Akademischer Austauschdienst)
Website: https://www.daad.de/en/
Email: info@daad.de
```

## 🎯 What Gets Auto-Filled

✅ **Basic Info**: Title, summary, description (40+ fields total)
✅ **Organization**: Name, website, logo
✅ **Academic**: Study level, field of study
✅ **Location**: Country, city, state
✅ **Financial**: Amount range, currency, funding type
✅ **Requirements**: GPA, age, eligibility
✅ **Application**: Deadline, URL, email, instructions
✅ **Documents**: Transcripts, essays, recommendations

## 💡 Pro Tips

1. **Include all details** in your paste for best results
2. **Use clear headings** like "Eligibility:", "Deadline:", etc.
3. **Check the form** after parsing to fill any gaps
4. **Review amounts and dates** carefully
5. **Category matching** is automatic but can be adjusted

## 📊 Expected Results

- **Parsing Speed**: 3-5 seconds
- **Fields Filled**: 30-40 out of 40+ fields (75-95%)
- **Accuracy**: Very high for well-formatted content
- **Time Saved**: 10-15 minutes per scholarship

## 🚨 Common Issues

### "API key not configured"
→ Add `VITE_GEMINI_API_KEY` to your `.env` file and restart server

### "Quota exceeded"
→ Free tier: 15/min, 1,500/day. Wait a minute and try again.

### "Some fields empty"
→ Normal! AI extracts what it finds. Fill missing fields manually.

## 📖 Full Documentation

See `AI_SCHOLARSHIP_PARSER_README.md` for complete technical documentation.

## 🎉 Ready to Go!

You're all set! Start parsing scholarships and save hours of data entry.

---

**Questions?** Check the full README or console logs for debugging.
