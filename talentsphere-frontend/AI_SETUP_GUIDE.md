# Quick Setup Guide - AI Job Parser

## 1. Get Your Free Gemini API Key

1. Open [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" button
4. Copy the generated key (starts with `AIza...`)

## 2. Add API Key to Environment

Edit your `.env.development` file:

```bash
# Add this line with your actual API key
VITE_GEMINI_API_KEY=AIzaSyA_your_actual_key_here
```

## 3. Restart the Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it:
npm run dev
# or
pnpm dev
```

## 4. Test the Feature

1. Navigate to: External Admin → Create Job
2. Click the purple **"AI Auto-Fill"** button
3. Paste the sample job posting below
4. Click **"Parse with AI & Auto-Fill Form"**
5. Watch the magic happen! ✨

---

## Sample Job Postings for Testing

### Sample 1: Tech Company (LinkedIn Style)

```
Senior Full Stack Developer
TechFlow Solutions · San Francisco, CA (Hybrid)
$140,000 - $180,000/year · Full-time

About TechFlow Solutions
We're a rapidly growing fintech startup revolutionizing digital payments. Our platform processes over $2B in transactions annually.

The Role
We're seeking an experienced Full Stack Developer to join our engineering team. You'll work on building scalable microservices and modern web applications that power our payment infrastructure.

Key Responsibilities
• Design and develop high-performance web applications using React and Node.js
• Build and maintain RESTful APIs and microservices architecture
• Collaborate with product managers and designers to deliver exceptional user experiences
• Write clean, maintainable, and well-tested code
• Participate in code reviews and mentor junior developers

Required Qualifications
• 5+ years of professional software development experience
• Strong proficiency in JavaScript/TypeScript, React, Node.js
• Experience with PostgreSQL, Redis, and MongoDB
• Solid understanding of RESTful APIs and microservices
• Bachelor's degree in Computer Science or related field

Preferred Skills
• Experience with AWS, Docker, and Kubernetes
• Knowledge of GraphQL and WebSockets
• Familiarity with CI/CD pipelines
• Previous fintech or payments industry experience

What We Offer
• Competitive salary and equity package
• Comprehensive health, dental, and vision insurance
• Flexible PTO and remote work options
• Professional development budget ($5,000/year)
• Latest MacBook Pro and equipment
• Catered lunches and snacks

How to Apply
Visit https://techflow.com/careers/senior-fullstack or email jobs@techflow.com with your resume and portfolio.
```

### Sample 2: Remote Position (Indeed Style)

```
Job Title: Product Designer
Company: DesignHub Inc.
Location: Remote (US-based)
Type: Full-time, Remote
Salary: $90,000 - $130,000 per year

About Us:
DesignHub is a design-first SaaS company building tools for creative teams. We serve 50,000+ customers worldwide.

Job Description:
We're looking for a talented Product Designer to help shape the future of our design collaboration platform. You'll work closely with our product and engineering teams to create intuitive, beautiful user experiences.

Responsibilities:
- Lead design projects from concept to launch
- Create wireframes, prototypes, and high-fidelity mockups
- Conduct user research and usability testing
- Maintain and evolve our design system
- Collaborate with engineers during implementation

Requirements:
- 3+ years of product design experience
- Expert proficiency in Figma and design tools
- Strong portfolio demonstrating UX/UI skills
- Experience with design systems
- Excellent communication skills

Nice to Have:
- Experience with motion design and prototyping tools
- Knowledge of HTML/CSS
- Previous SaaS product experience
- Illustration or branding skills

Benefits:
- 100% remote work
- Health, dental, vision insurance
- 401(k) with company match
- Unlimited PTO
- Home office stipend ($1,000)
- Annual company retreat

Apply:
Send your portfolio and resume to careers@designhub.io
Application deadline: December 31, 2024
```

### Sample 3: Entry Level (Company Website Style)

```
Position: Junior Data Analyst
Department: Analytics & Insights
Employment Type: Full-time
Location: New York, NY (On-site)
Posted: November 15, 2024

About DataCorp:
DataCorp is a leading data analytics consultancy serving Fortune 500 companies. We turn complex data into actionable business insights.
Website: https://datacorp.com

Role Overview:
Join our growing analytics team as a Junior Data Analyst. This is an excellent opportunity for recent graduates or early-career professionals passionate about data and analytics.

What You'll Do:
• Analyze large datasets using SQL and Python
• Create data visualizations and dashboards in Tableau
• Assist senior analysts with client projects
• Prepare reports and presentations for stakeholders
• Support data quality and validation efforts

Required Qualifications:
• Bachelor's degree in Statistics, Mathematics, Computer Science, or related field
• 0-2 years of relevant experience (internships count!)
• Proficiency in SQL and Excel
• Basic knowledge of Python or R
• Strong analytical and problem-solving skills

Preferred:
• Experience with Tableau, Power BI, or similar tools
• Understanding of statistical methods
• Familiarity with data warehousing concepts
• Previous internship in analytics or data science

Compensation & Benefits:
• Starting salary: $60,000 - $75,000/year (based on experience)
• Health insurance (medical, dental, vision)
• 401(k) with 4% match
• 15 days PTO + 10 holidays
• Professional development opportunities
• Mentorship program

How to Apply:
Apply online at https://datacorp.com/careers/junior-analyst-2024
Questions? Email hr@datacorp.com

DataCorp is an equal opportunity employer.
```

### Sample 4: Freelance/Contract (Simple Format)

```
Freelance Marketing Content Writer

Type: Freelance, Part-time
Location: Remote (Global)
Rate: $50-80/hour depending on experience
Duration: 3-6 months (with possibility of extension)

We're a fast-growing e-commerce brand looking for a skilled content writer to create engaging blog posts, product descriptions, and marketing copy.

Responsibilities:
- Write 8-10 blog posts per month (1000-1500 words each)
- Create compelling product descriptions
- Develop email marketing content
- Collaborate with marketing team on content strategy

Requirements:
- 2+ years of professional writing experience
- Portfolio of published work
- Excellent English writing and grammar skills
- SEO knowledge
- Ability to meet deadlines consistently

Preferred:
- E-commerce or retail writing experience
- Knowledge of WordPress
- Social media copywriting skills

To Apply:
Email your portfolio and resume to: hiring@ecommercebrand.com
Subject line: "Freelance Writer Application - [Your Name]"
```

---

## What to Expect

When you click "Parse with AI & Auto-Fill Form", the AI will:

1. ✨ Extract the job title
2. 🏢 Identify company name and website
3. 📍 Parse location information
4. 💰 Extract salary details and range
5. 📝 Convert description to markdown format
6. 🎯 List required and preferred skills
7. 📧 Find application instructions
8. ⚡ Fill all relevant form fields automatically

**Processing time**: Usually 3-10 seconds depending on content length.

---

## Troubleshooting

### "AI service not configured" error?
- Make sure you added `VITE_GEMINI_API_KEY` to `.env.development`
- Restart the dev server after adding the key

### Button is disabled?
- Make sure you've pasted at least 50 characters
- Check that you're not already parsing (wait for current operation to complete)

### Inaccurate results?
- Try pasting the complete job posting
- Ensure the content is in English
- Include all sections (title, company, requirements, etc.)

---

## Next Steps

After successful parsing:

1. ✅ Review all auto-filled fields
2. ✏️ Edit any fields that need adjustment
3. 📸 Click "Preview" to see how it will look
4. 💾 Save as draft or publish immediately

**Remember**: The AI provides a strong starting point, but always review the output before publishing!
