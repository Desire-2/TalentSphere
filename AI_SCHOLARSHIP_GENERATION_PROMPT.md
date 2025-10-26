# AI Prompt for Scholarship Content Generation

## Comprehensive AI Prompt

Use this prompt with any AI assistant (ChatGPT, Claude, Gemini, etc.) to generate complete scholarship data in JSON format that can be imported directly into the TalentSphere Create Scholarship form.

---

## 🤖 COPY THIS PROMPT:

```
Generate a complete scholarship opportunity in JSON format with all the following fields populated. Create realistic, detailed content for each field.

SCHOLARSHIP CONTEXT:
[Describe the scholarship - e.g., "A merit-based scholarship for engineering students from underrepresented communities"]

Required JSON Structure:
{
  // BASIC INFORMATION (Required)
  "title": "Create an attractive, professional scholarship title (50-100 characters)",
  "summary": "Write a compelling 1-2 sentence summary that captures the essence of the scholarship (150-200 characters)",
  "description": "Write a comprehensive description in Markdown format including:\n## About the Scholarship\n[2-3 paragraphs about the scholarship, its purpose, and impact]\n\n## Benefits\n- List all benefits\n- Be specific and detailed\n\n## Who Should Apply\n[Description of ideal candidates]",
  "scholarship_type": "Choose one: 'merit', 'need', 'athletic', 'artistic', 'community', 'research', 'leadership', or 'other'",
  "category_id": "Use '1' for now (will be updated based on actual categories)",
  
  // ORGANIZATION INFORMATION (Required)
  "external_organization_name": "Name of the foundation, university, or organization offering the scholarship",
  "external_organization_website": "Organization's official website URL (https://...)",
  "external_organization_logo": "URL to organization logo image (https://... .png or .jpg)",
  "source_url": "Direct URL to the scholarship announcement page",
  
  // ACADEMIC INFORMATION
  "study_level": "Choose one: 'high_school', 'undergraduate', 'graduate', 'postgraduate', 'doctoral', 'postdoctoral', or 'any'",
  "field_of_study": "Specify accepted fields (e.g., 'Computer Science, Engineering, Mathematics' or 'Any field')",
  
  // LOCATION
  "location_type": "Choose one: 'any', 'specific', 'region', or 'online'",
  "country": "Country name if location_type is 'specific' or 'region', otherwise leave empty",
  "city": "City name if location_type is 'specific', otherwise leave empty",
  "state": "State/Province if location_type is 'specific', otherwise leave empty",
  
  // FINANCIAL INFORMATION (Important)
  "amount_min": "Minimum scholarship amount in numbers only (e.g., '5000')",
  "amount_max": "Maximum scholarship amount in numbers only (e.g., '10000')",
  "currency": "Currency code: 'USD', 'EUR', 'GBP', 'CAD', 'AUD', etc.",
  "funding_type": "Choose one: 'full' (full tuition + expenses), 'partial' (partial tuition), 'stipend' (living expenses only), or 'other'",
  "renewable": true or false (whether scholarship can be renewed for multiple years),
  "duration_years": Number of years scholarship covers (1, 2, 3, 4, etc.),
  
  // ELIGIBILITY CRITERIA
  "min_gpa": "Minimum GPA required (e.g., '3.0', '3.5', '3.75') or leave empty if none",
  "citizenship_requirements": "Citizenship requirements (e.g., 'US Citizens only', 'International students welcome', 'Open to all nationalities')",
  "age_min": "Minimum age requirement (e.g., '17', '18') or leave empty",
  "age_max": "Maximum age requirement (e.g., '25', '30') or leave empty",
  "gender_requirements": "Choose one: 'any', 'male', 'female', 'non_binary', or 'other'",
  
  // IMPORTANT DATES (Required)
  "application_deadline": "Deadline in YYYY-MM-DD format (e.g., '2025-12-31')",
  "award_date": "Expected award announcement date in YYYY-MM-DD format (e.g., '2026-03-15')",
  
  // APPLICATION INFORMATION (Required)
  "application_type": "Choose one: 'external' (apply on external website), 'email' (apply via email), or 'internal' (apply through TalentSphere)",
  "application_url": "Full application URL if application_type is 'external' (https://...)",
  "application_email": "Application email address if application_type is 'email'",
  "application_instructions": "Detailed step-by-step instructions on how to apply:\n1. First step\n2. Second step\n3. etc.",
  "required_documents": "List all required documents in Markdown format:\n- Academic transcripts\n- Letters of recommendation (specify how many)\n- Personal statement/essay\n- Resume/CV\n- Proof of enrollment\n- etc.",
  
  // ADDITIONAL DETAILS
  "benefits": "Comprehensive list of ALL benefits in Markdown format:\n- Tuition coverage details\n- Monthly/annual stipend amounts\n- Travel allowances\n- Conference attendance\n- Mentorship opportunities\n- Internship programs\n- Networking events\n- etc.",
  "requirements": "Detailed list of ALL requirements in Markdown format:\n- Academic requirements (GPA, test scores)\n- Enrollment status\n- Field of study\n- Leadership experience\n- Community service\n- Research experience\n- etc.",
  "selection_criteria": "Explain the evaluation process:\n1. How applications will be evaluated\n2. Weighting of different criteria (e.g., 'Academic excellence 40%, Leadership 30%, Essay 20%, Recommendations 10%')\n3. Selection timeline\n4. Number of awards available",
  "contact_email": "Contact email for questions about the scholarship",
  "contact_phone": "Contact phone number with country code (e.g., '+1-555-0123') or leave empty",
  
  // SEO & METADATA
  "meta_keywords": "Comma-separated keywords for search optimization (e.g., 'engineering scholarship, merit-based funding, undergraduate scholarship, STEM funding')",
  "tags": "Comma-separated tags for categorization (e.g., 'engineering, merit-based, undergraduate, renewable, full-funding')",
  
  // PUBLICATION STATUS
  "status": "Choose one: 'published' (make live immediately) or 'draft' (save for review)"
}

INSTRUCTIONS:
1. Fill ALL fields with realistic, detailed, professional content
2. Make the scholarship sound attractive and prestigious
3. Be specific with numbers, dates, and requirements
4. Use proper Markdown formatting in description, benefits, requirements, etc.
5. Ensure dates are in the future and realistic
6. Make all URLs realistic (you can use example.com if creating fictional scholarships)
7. Be consistent across all fields (e.g., if it's for engineering, mention engineering throughout)
8. Output ONLY valid JSON - no additional text before or after
9. Use proper JSON syntax with quotes around strings and correct commas

Generate the scholarship now based on the context provided above.
```

---

## 📋 Quick Examples

### Example 1: Merit-Based Tech Scholarship

**Prompt Context:**
```
SCHOLARSHIP CONTEXT: A merit-based scholarship for undergraduate computer science students with strong academic records and demonstrated leadership in tech communities
```

**Expected Output:**
```json
{
  "title": "Tech Leaders Excellence Scholarship 2026",
  "summary": "Full-ride scholarship recognizing outstanding undergraduate computer science students who demonstrate exceptional academic achievement and leadership in technology communities.",
  "description": "## About the Scholarship\n\nThe Tech Leaders Excellence Scholarship is a prestigious award designed to support the next generation of technology innovators. This scholarship recognizes students who not only excel academically but also contribute meaningfully to their tech communities through leadership, mentorship, and innovative projects.\n\nFounded by a consortium of leading technology companies, this program aims to remove financial barriers for talented students pursuing careers in computer science and related fields. Recipients join an exclusive network of tech leaders and gain access to invaluable industry connections.\n\n## Benefits\n- Complete tuition coverage for four years\n- $24,000 annual stipend for living expenses\n- Latest technology equipment package ($3,000 value)\n- Guaranteed summer internships at partner tech companies\n- Exclusive mentorship from industry leaders\n- Annual conference attendance (all expenses paid)\n- Career development workshops and networking events\n\n## Who Should Apply\n\nIdeal candidates are undergraduate students majoring in Computer Science, Software Engineering, or related fields who have demonstrated:\n- Outstanding academic performance (GPA 3.7+)\n- Leadership in tech clubs, hackathons, or open-source projects\n- Commitment to using technology for social good\n- Strong communication and collaboration skills",
  "scholarship_type": "merit",
  "category_id": "1",
  "external_organization_name": "Tech Leaders Foundation",
  "external_organization_website": "https://techleadersfoundation.org",
  "external_organization_logo": "https://techleadersfoundation.org/images/logo-scholarship.png",
  "source_url": "https://techleadersfoundation.org/scholarships/tech-excellence-2026",
  "study_level": "undergraduate",
  "field_of_study": "Computer Science, Software Engineering, Information Technology, Data Science",
  "location_type": "any",
  "country": "",
  "city": "",
  "state": "",
  "amount_min": "80000",
  "amount_max": "100000",
  "currency": "USD",
  "funding_type": "full",
  "renewable": true,
  "duration_years": 4,
  "min_gpa": "3.7",
  "citizenship_requirements": "Open to all nationalities, must be studying in the United States",
  "age_min": "17",
  "age_max": "22",
  "gender_requirements": "any",
  "application_deadline": "2026-03-15",
  "award_date": "2026-05-30",
  "application_type": "external",
  "application_url": "https://techleadersfoundation.org/apply",
  "application_email": "",
  "application_instructions": "## How to Apply\n\n1. **Create an Account**: Register at our application portal using your academic email address\n2. **Complete Online Application**: Fill out the comprehensive application form including personal information, academic history, and extracurricular activities\n3. **Upload Required Documents**: Submit all required documents (see list below)\n4. **Submit Essays**: Complete two required essays (500 words each)\n5. **Request Recommendations**: Arrange for two letters of recommendation to be sent directly through our portal\n6. **Submit Application**: Review all information and submit before the deadline\n7. **Interview**: Selected finalists will be invited for virtual interviews in April 2026\n\n**Important**: Incomplete applications will not be considered. All materials must be received by the deadline.",
  "required_documents": "- Official academic transcripts from all institutions attended\n- Two letters of recommendation (one from a professor, one from a professional mentor or employer)\n- Personal statement (500 words): Describe your academic journey and career goals\n- Leadership essay (500 words): Discuss a significant leadership experience and its impact\n- Current resume or CV highlighting technical skills and projects\n- Portfolio of coding projects or GitHub profile link\n- Proof of enrollment or acceptance letter\n- Optional: Awards, certifications, or publications",
  "benefits": "## Complete Benefits Package\n\n### Financial Support\n- **Full Tuition Coverage**: 100% of tuition and mandatory fees for four years (up to $100,000)\n- **Living Stipend**: $2,000 per month during academic year ($24,000 annually)\n- **Technology Grant**: One-time $3,000 allowance for laptop, software, and equipment\n- **Book Allowance**: $1,000 per academic year\n\n### Career Development\n- **Guaranteed Internships**: Paid summer internships at Google, Microsoft, Amazon, or other partner companies\n- **Industry Mentorship**: One-on-one mentoring from senior tech leaders\n- **Networking Events**: Exclusive access to 4+ annual networking events with industry professionals\n- **Conference Attendance**: All-expenses-paid attendance to major tech conferences (e.g., Google I/O, Microsoft Build)\n\n### Academic Support\n- **Peer Network**: Join a community of 50+ fellow Tech Leaders scholars\n- **Study Abroad**: Funding support for international study opportunities\n- **Research Grants**: Additional funding available for research projects\n\n### Professional Development\n- **Leadership Training**: Annual leadership development workshops\n- **Communication Skills**: Public speaking and technical writing courses\n- **Career Coaching**: Resume review, interview prep, and career guidance\n\n### Post-Graduation\n- **Alumni Network**: Lifetime access to Tech Leaders alumni community\n- **Job Placement Support**: Assistance with job search and placement",
  "requirements": "## Eligibility Requirements\n\n### Academic Requirements\n- Minimum cumulative GPA of 3.7 on a 4.0 scale\n- Currently enrolled or accepted as an undergraduate student\n- Majoring in Computer Science, Software Engineering, Information Technology, Data Science, or closely related field\n- Completed at least one semester of college coursework (for current students)\n- Must maintain 3.5 GPA to renew scholarship each year\n\n### Enrollment Requirements\n- Full-time student status (minimum 12 credits per semester)\n- Enrolled at an accredited four-year college or university in the United States\n- Must be pursuing a Bachelor's degree\n\n### Leadership & Experience\n- Demonstrated leadership in technology-related activities (clubs, hackathons, open-source projects, etc.)\n- Strong record of community involvement or volunteer work\n- Evidence of technical skills through projects, internships, or coursework\n\n### Age & Status\n- Between 17 and 22 years old at time of application\n- International students must have valid student visa or be eligible for one\n\n### Other Requirements\n- Strong English communication skills (written and verbal)\n- Commitment to attend all required scholarship program events\n- Willingness to participate in mentorship and community service activities\n- Agreement to serve as an ambassador for the Tech Leaders Foundation",
  "selection_criteria": "## Evaluation Process\n\nApplications are evaluated through a comprehensive, holistic review process:\n\n### Scoring Breakdown\n1. **Academic Excellence** (35%)\n   - GPA and course rigor\n   - Technical coursework performance\n   - Academic achievements and honors\n\n2. **Leadership & Impact** (30%)\n   - Leadership roles in tech organizations\n   - Impact on tech community\n   - Mentorship and teaching experience\n   - Initiative in starting projects or organizations\n\n3. **Essays & Personal Statement** (20%)\n   - Quality of writing and clarity of thought\n   - Articulation of goals and vision\n   - Authenticity and personal story\n   - Demonstrated passion for technology\n\n4. **Letters of Recommendation** (10%)\n   - Strength and specificity of recommendations\n   - Evidence of character and potential\n   - Third-party validation of achievements\n\n5. **Technical Portfolio** (5%)\n   - Quality and complexity of coding projects\n   - Contribution to open-source projects\n   - Innovation and creativity\n\n### Selection Timeline\n- **March 15, 2026**: Application deadline\n- **March 16-31, 2026**: Initial review of all applications\n- **April 1-15, 2026**: Finalist selection (top 100 candidates)\n- **April 16-30, 2026**: Virtual interviews with finalists\n- **May 15, 2026**: Final selection committee meeting\n- **May 30, 2026**: Award announcements and winner notification\n- **June 1-15, 2026**: Award acceptance period\n\n### Number of Awards\n**25 scholarships** will be awarded for the 2026-2027 academic year. All recipients receive the full benefits package.",
  "contact_email": "scholarships@techleadersfoundation.org",
  "contact_phone": "+1-888-555-TECH",
  "meta_keywords": "computer science scholarship, technology scholarship, merit scholarship, undergraduate funding, STEM scholarship, full-ride scholarship, renewable scholarship, tech leaders, programming scholarship, software engineering funding",
  "tags": "technology, computer-science, merit-based, undergraduate, full-scholarship, renewable, leadership, STEM, programming, software-engineering",
  "status": "published"
}
```

---

## 🎯 Usage Scenarios

### Scenario 1: Create Scholarships for Different Fields

**For Medical Students:**
```
SCHOLARSHIP CONTEXT: A need-based scholarship for medical students from low-income families pursuing careers in rural healthcare
```

**For Artists:**
```
SCHOLARSHIP CONTEXT: An artistic scholarship for undergraduate fine arts students specializing in digital media and contemporary art
```

**For Athletes:**
```
SCHOLARSHIP CONTEXT: An athletic scholarship for Division I student-athletes maintaining academic excellence while competing in track and field
```

### Scenario 2: Different Scholarship Types

**Research Grant:**
```
SCHOLARSHIP CONTEXT: A research scholarship for doctoral students conducting groundbreaking research in climate change and sustainability
```

**Community Service:**
```
SCHOLARSHIP CONTEXT: A community service scholarship for students who have demonstrated exceptional commitment to volunteer work and social justice
```

**International Students:**
```
SCHOLARSHIP CONTEXT: A scholarship specifically for international students from developing countries pursuing STEM education in the United States
```

---

## 💡 Pro Tips for Better AI Generation

### 1. Be Specific in Context
❌ Bad: "Create a scholarship"
✅ Good: "Create a merit-based scholarship for undergraduate business students with entrepreneurial experience, focused on women in business"

### 2. Specify Regional/Cultural Context
```
SCHOLARSHIP CONTEXT: A scholarship for Indigenous students in Canada pursuing environmental science and traditional ecological knowledge
```

### 3. Include Budget Range
```
SCHOLARSHIP CONTEXT: A small local scholarship ($2,000-$5,000) for high school seniors in California planning to attend community college
```

### 4. Mention Unique Requirements
```
SCHOLARSHIP CONTEXT: A scholarship for first-generation college students who are also student parents, covering childcare costs and tuition
```

---

## 🔄 AI Tools You Can Use

### ChatGPT / GPT-4
1. Copy the main prompt above
2. Add your specific SCHOLARSHIP CONTEXT
3. Submit and receive JSON output
4. Copy the JSON
5. Import into TalentSphere

### Claude
1. Use the same prompt
2. Claude is excellent at maintaining JSON structure
3. Can handle complex, detailed scholarships

### Google Gemini
1. Works well with the prompt
2. Good for creating multiple variations
3. Can generate in different languages

### Local AI (Ollama, LM Studio)
1. Use models like Llama 3 or Mixtral
2. May need to adjust prompt slightly
3. Great for privacy-sensitive scholarship data

---

## 🚀 Advanced: Batch Generation

### Generate Multiple Scholarships at Once

```
Generate 5 different scholarship opportunities in JSON array format. Each scholarship should be unique and target different demographics:

1. Merit-based scholarship for engineering students
2. Need-based scholarship for first-generation college students
3. Athletic scholarship for student-athletes
4. Artistic scholarship for performing arts students
5. Research scholarship for graduate students in biotechnology

Return as a JSON array: [scholarship1, scholarship2, ...]

Use this structure for each scholarship:
[Include the full JSON structure from the main prompt]
```

---

## 📊 Field Requirements Cheat Sheet

### Absolutely Required Fields:
- ✅ title
- ✅ external_organization_name
- ✅ description
- ✅ scholarship_type
- ✅ category_id
- ✅ application_deadline
- ✅ application_type
- ✅ application_url OR application_email (depending on type)

### Highly Recommended:
- ⭐ summary
- ⭐ amount_max
- ⭐ currency
- ⭐ study_level
- ⭐ field_of_study
- ⭐ benefits
- ⭐ requirements

### Optional but Valuable:
- 💡 min_gpa
- 💡 citizenship_requirements
- 💡 renewable
- 💡 selection_criteria
- 💡 required_documents
- 💡 meta_keywords
- 💡 tags

---

## 📝 Templates for Common Scholarship Types

### Template 1: Academic Merit Scholarship
```
SCHOLARSHIP CONTEXT: A prestigious merit-based scholarship for top-performing [field] students with GPA above [X.X], offering [amount] to cover [duration] years of study. Focus on students who demonstrate [specific quality]. Organization: [name], based in [location].
```

### Template 2: Need-Based Scholarship
```
SCHOLARSHIP CONTEXT: A need-based scholarship supporting financially disadvantaged students from [demographic/region] pursuing [field of study]. Award amount: [range], renewable for [X] years if academic standards are maintained. Priority given to [specific criteria].
```

### Template 3: Diversity & Inclusion Scholarship
```
SCHOLARSHIP CONTEXT: A diversity scholarship promoting inclusion of underrepresented groups ([specific groups]) in [field]. Covers [percentage]% of tuition plus [additional benefits]. Requires [specific commitments/requirements].
```

### Template 4: Career-Specific Scholarship
```
SCHOLARSHIP CONTEXT: A professional development scholarship for students committed to careers in [specific career path]. Includes internship placement, mentorship, and funding of [amount]. Sponsored by [organization type].
```

---

## ✅ Quality Checklist

Before importing the AI-generated JSON, verify:

- [ ] All required fields are populated
- [ ] Dates are in YYYY-MM-DD format and are future dates
- [ ] Amounts are numeric strings (e.g., "10000" not "$10,000")
- [ ] URLs start with https://
- [ ] Email addresses are valid format
- [ ] Markdown formatting is correct in description, benefits, requirements
- [ ] scholarship_type matches allowed values
- [ ] study_level matches allowed values
- [ ] location_type is appropriate
- [ ] JSON is valid (no syntax errors)
- [ ] Content is professional and realistic
- [ ] No placeholder text like "[INSERT]" or "TBD"

---

## 🎓 Example Use Cases

### Use Case 1: University Scholarship Office
"Generate 10 different scholarships for our university covering various departments and student demographics"

### Use Case 2: Foundation/Organization
"Create a flagship scholarship program for our environmental foundation targeting climate science researchers"

### Use Case 3: Corporate Sponsor
"Design a corporate scholarship for our tech company supporting women in computer science"

### Use Case 4: Community Organization
"Build a local scholarship for community college students in our city preparing for transfer to 4-year institutions"

---

## 📖 Learning Resources

### Understanding Scholarship Fields:
- **title**: The official name - should be memorable and descriptive
- **summary**: Elevator pitch - capture attention in one sentence
- **description**: Full story - use Markdown for formatting
- **scholarship_type**: Category - helps students filter
- **amount_max**: Total value - can be annual or total package
- **funding_type**: Coverage level - sets expectations clearly
- **renewable**: Multi-year - important for long-term planning
- **requirements**: Eligibility - be specific to avoid confusion
- **selection_criteria**: Process - transparency builds trust

---

## 🔧 Troubleshooting

### Problem: JSON Parse Error
**Solution**: Copy the JSON into a JSON validator (jsonlint.com) to find syntax errors

### Problem: Import Fails
**Solution**: Check that required fields (title, organization_name, description, deadline) are present

### Problem: Dates Not Working
**Solution**: Ensure dates are in YYYY-MM-DD format, not MM/DD/YYYY or other formats

### Problem: AI Generates Incomplete Data
**Solution**: Be more specific in your SCHOLARSHIP CONTEXT, mention that ALL fields must be filled

### Problem: Amounts in Wrong Format
**Solution**: Specify in prompt: "amounts should be numbers only as strings, no dollar signs or commas"

---

## 📄 Sample Prompts Library

Copy and paste these ready-to-use prompts:

### 1. STEM Excellence Scholarship
```
Generate a complete scholarship opportunity in JSON format for: A merit-based scholarship for exceptional undergraduate students in STEM fields (Science, Technology, Engineering, Mathematics) with minimum 3.8 GPA. Award: $50,000 over 4 years ($12,500/year), renewable. Includes summer research funding, mentorship, and conference attendance. Sponsored by the National STEM Foundation. Application deadline: June 30, 2026. Must include leadership in STEM clubs or research experience.
```

### 2. First-Generation College Student Scholarship
```
Generate a complete scholarship opportunity in JSON format for: A need-based scholarship specifically for first-generation college students from low-income families. Award: $20,000 total ($5,000/year for 4 years). Includes academic counseling, peer mentoring, and career development workshops. Sponsored by the Education Equity Foundation. Open to all majors. Minimum 3.0 GPA required. Application deadline: April 15, 2026. Priority given to students pursuing careers in education or social work.
```

### 3. Women in Business Leadership Scholarship
```
Generate a complete scholarship opportunity in JSON format for: A scholarship for women pursuing undergraduate or graduate degrees in Business Administration, Finance, or Entrepreneurship. Award: $25,000 (one-time). Includes executive mentorship program and invitation to annual Women in Business summit. Sponsored by Women Leaders Initiative. Requires demonstration of entrepreneurial experience or business leadership. Minimum 3.5 GPA. Application deadline: September 1, 2026. Ages 20-30 eligible.
```

### 4. Rural Healthcare Scholarship
```
Generate a complete scholarship opportunity in JSON format for: A scholarship for medical students committed to practicing in rural and underserved communities. Award: Full tuition ($200,000) plus $30,000 annual stipend for 4 years. Requires 5-year service commitment in designated rural area after graduation. Sponsored by Rural Health Alliance. Open to MD and DO students. Covers all specialties but preference for primary care. Application deadline: March 1, 2026.
```

### 5. Creative Arts & Digital Media Scholarship
```
Generate a complete scholarship opportunity in JSON format for: A scholarship for talented artists pursuing degrees in Digital Media, Graphic Design, Animation, or Film Production. Award: $15,000 ($7,500/year for 2 years). Requires portfolio submission. Includes internship placement with major design studios. Sponsored by Creative Futures Foundation. Ages 18-25. International students welcome. Application deadline: November 30, 2026. Must demonstrate creative innovation and technical proficiency.
```

---

## 🌟 Final Tips

1. **Be Detailed**: The more detail you provide in SCHOLARSHIP CONTEXT, the better the AI output
2. **Iterate**: Generate, review, refine your prompt, and generate again
3. **Customize**: AI gives you a strong foundation - add personal touches
4. **Verify**: Always review AI-generated content for accuracy
5. **Test**: Import a test scholarship first to ensure format works
6. **Save Prompts**: Keep successful prompts for future use
7. **Mix & Match**: Combine elements from different AI outputs

---

## 📞 Support

If you need help:
1. Check the JSON_IMPORT_QUICK_START.md for import instructions
2. Review JSON_IMPORT_VISUAL_GUIDE.md for workflow details
3. See sample_scholarship_import.json for perfect format example
4. Test with small/simple scholarships first

---

**Ready to generate amazing scholarships with AI!** 🚀

Use this prompt with any AI assistant to create professional, comprehensive scholarship data that imports perfectly into TalentSphere.
