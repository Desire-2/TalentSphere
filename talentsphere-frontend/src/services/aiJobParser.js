import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Job Parser Service
 * Uses Google Gemini AI to parse external job postings and convert them to our data structure
 */

// Initialize the AI client
// API key should be stored in environment variables for production
const initializeAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment variables. AI parsing will not work.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Parse external job posting content using AI
 * @param {string} rawContent - Raw text from external job posting
 * @param {Array} categories - Available job categories from backend
 * @returns {Promise<object>} - Parsed job data matching our form structure
 */
export const parseJobWithAI = async (rawContent, categories = []) => {
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error('Please provide job content to parse');
  }

  const genAI = initializeAI();
  if (!genAI) {
    throw new Error('AI service not configured. Please add VITE_GEMINI_API_KEY to your .env file');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Prepare category information for AI
    const categoryInfo = categories.length > 0 
      ? `\n\nAvailable Job Categories:\n${categories.map(cat => `- ID: ${cat.id}, Name: "${cat.name}"`).join('\n')}`
      : '\n\nNote: Match the job to one of these common categories: Technology, Marketing, Sales, Design, Management, Finance, Healthcare, Education, Engineering, Customer Service, Human Resources, Legal, Operations, Data Science, Product Management';

    // Create a comprehensive prompt to extract job information
    const prompt = `You are TalentSphere's AI Job Analyst, an expert system designed to extract and structure job posting information with exceptional accuracy and intelligence. Your role is to transform raw job postings into perfectly structured data that matches our platform's requirements.

CONTEXT & EXPERTISE:
- You specialize in identifying job market trends, compensation structures, and skill requirements
- You understand regional employment patterns and company cultures
- You can infer missing information based on industry standards and job market context
- You excel at converting unstructured text into professional, marketing-ready content

JOB POSTING TO ANALYZE:
"""
${rawContent}
"""

${categoryInfo}

ANALYSIS REQUIREMENTS:
Perform a comprehensive analysis and extract the following information. Use your expertise to infer missing details and enhance the content for maximum appeal to job seekers.

Return ONLY a valid JSON object with these enhanced fields:

{
  "title": "📝 Optimized job title - professional, compelling, and search-friendly (string, required)",
  "summary": "🎯 Engaging one-line summary highlighting key value proposition (string, 120-150 chars, focus on benefits to candidate)",
  "description": "📋 Professionally structured job description in markdown format with clear sections: Overview, Responsibilities, Requirements, Benefits, Company Culture. Use headers (##), bullet points, and emphasis for readability (string, required)",
  "external_company_name": "🏢 Company name exactly as it appears officially (string, required)",
  "external_company_website": "🌐 Official company website URL (string, must start with http:// or https://)",
  "external_company_logo": "🖼️ Company logo URL if mentioned (string, must start with http:// or https://)",
  "employment_type": "💼 Employment type: full-time, part-time, contract, freelance, internship (string, required, default: full-time)",
  "experience_level": "🎓 Experience level: entry, mid, senior, executive - infer from requirements and title (string, required, default: mid)",
  "category_id": "🏷️ BEST MATCHING category ID based on primary job function, skills, and industry (string, REQUIRED)",
  "location_type": "📍 Work arrangement: remote, on-site, hybrid - analyze all location clues carefully (string, required)",
  "location_city": "🏙️ City name only (e.g., 'San Francisco', 'New York', 'London')",
  "location_state": "🗺️ State/Province (e.g., 'CA', 'NY', 'Ontario', 'Berlin')",
  "location_country": "🌍 Country name (e.g., 'United States', 'Canada', 'United Kingdom', 'Germany')",
  "salary_min": "💰 Minimum salary as clean number without symbols (number)",
  "salary_max": "💰 Maximum salary as clean number without symbols (number)",
  "salary_currency": "💱 Currency code: USD, EUR, GBP, CAD, etc. (string, infer from location if not specified)",
  "salary_period": "📅 Salary period: yearly, monthly, hourly (string, default: yearly)",
  "salary_negotiable": "🤝 Is salary negotiable? Look for phrases like 'DOE', 'negotiable', 'competitive' (boolean, default: false)",
  "show_salary": "👁️ Should salary be displayed? (boolean, default: true if salary provided)",
  "required_skills": "⚡ Essential skills - prioritize most important, separate with commas (string)",
  "preferred_skills": "✨ Nice-to-have skills - bonus qualifications, separate with commas (string)",
  "years_experience_min": "📊 Minimum years of experience required (number, default: 0)",
  "years_experience_max": "📊 Maximum years of experience or upper range (number)",
  "education_requirement": "🎓 Education requirements - be specific about degree level and field if mentioned (string)",
  "application_type": "📬 How to apply: external (website), email (direct email) - analyze application process (string, required, default: external)",
  "application_url": "🔗 Direct application URL if provided (string, must start with http:// or https://)",
  "application_email": "📧 Application email address if email application (string)",
  "application_instructions": "📝 Detailed application instructions in structured markdown format with steps, requirements, and tips (string)",
  "source_url": "🔗 Original job posting URL if mentioned (string)",
  "benefits": "🎁 Company benefits and perks - extract from job posting (string)",
  "remote_policy": "🏠 Remote work policy details if mentioned (string)",
  "visa_sponsorship": "🛂 Visa sponsorship availability - look for visa, H1B, work permit mentions (boolean, default: false)",
  "urgency_level": "⚡ Hiring urgency: low, medium, high, urgent - infer from language like 'immediate', 'ASAP', 'soon' (string, default: medium)",
  "company_size": "👥 Company size category: startup, small, medium, large, enterprise - infer from context (string)",
  "industry": "🏭 Primary industry sector (string)",
  "job_function": "⚙️ Primary job function area (string)",
  "is_featured": "⭐ Should this be featured? High-quality companies/roles deserve featuring (boolean, default: false)"
}

🚀 ADVANCED PROCESSING INSTRUCTIONS:

1. **JSON OUTPUT**: Return ONLY valid, parseable JSON - no markdown, explanations, or additional text
2. **CONTENT ENHANCEMENT**: Don't just extract - improve and optimize the content for maximum job seeker appeal
3. **INTELLIGENT INFERENCE**: Use your expertise to fill gaps and enhance incomplete information
4. **PROFESSIONAL FORMATTING**: Transform casual language into professional, compelling copy

📋 FIELD-SPECIFIC INSTRUCTIONS:

**Title Optimization**: Make titles more appealing while staying accurate (e.g., "Developer" → "Software Developer", add seniority if implied)

**Description Structure**: Convert to markdown with this optimal structure:
\`\`\`
## About the Role
[Engaging overview paragraph]

## Key Responsibilities
- [Bullet points for main duties]

## What We're Looking For
- [Requirements as appealing bullet points]

## What We Offer
- [Benefits and growth opportunities]

## About [Company]
[Company culture and values]
\`\`\`

**Skills Processing**:
- Prioritize technical skills first, then soft skills
- Standardize technology names (e.g., "js" → "JavaScript", "react" → "React")
- Remove duplicates and group related skills
- Separate required vs. preferred intelligently

**Salary Intelligence**:
- Convert all formats to numbers (e.g., "$80k-100k" → min: 80000, max: 100000)
- Infer currency from location if not specified
- Detect negotiability from language like "competitive", "DOE", "based on experience"

**Location Analysis**:
- Remote indicators: "remote", "work from home", "WFH", "distributed", "anywhere", "location flexible"
- Hybrid indicators: "hybrid", "flexible", "remote-friendly", "work from home some days"
- On-site indicators: "office", "on-site", "in-person", "headquarters", specific address

**Experience Level Logic**:
- Entry: 0-2 years, keywords like "junior", "entry-level", "graduate", "new grad"
- Mid: 2-5 years, keywords like "mid-level", "intermediate", "experienced"
- Senior: 5+ years, keywords like "senior", "lead", "expert", "architect"
- Executive: Management roles, "director", "VP", "C-level", "head of"

**Application Instructions Enhancement**: Convert basic instructions into professional, structured markdown:
\`\`\`
## How to Apply

1. **Submit your application** through our careers page
2. **Include your resume** in PDF format
3. **Write a compelling cover letter** highlighting relevant experience
4. **Provide work samples** or portfolio links if applicable

### What to Include
- [ ] Updated resume/CV
- [ ] Cover letter tailored to this role
- [ ] Portfolio or work samples
- [ ] Professional references

**Application Timeline**: We review applications on a rolling basis and aim to respond within 1 week.
\`\`\`

**Quality Indicators for Featured Status**:
- Well-known companies or strong employer brands
- Comprehensive benefits packages
- Clear growth opportunities
- Competitive compensation
- Professional job posting quality

**Industry & Function Mapping**:
- Use standard industry classifications
- Map to primary job function areas
- Consider company type and role requirements

5. **VALIDATION**: Ensure all required fields are populated and data types match specifications
6. **CONSISTENCY**: Maintain consistent formatting and professional tone throughout
7. **ERROR HANDLING**: If unclear, make the most reasonable professional interpretation

Return the JSON now:`;



    console.log('🤖 Sending job content to AI for parsing...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ AI Response received:', text.substring(0, 200) + '...');

    // Extract JSON from response (handle cases where AI adds extra text)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    // Try to extract JSON if there's extra text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Parse the JSON
    const parsedData = JSON.parse(jsonText);
    
    console.log('✅ Successfully parsed job data:', parsedData);
    
    // Validate and clean the data
    const cleanedData = validateAndCleanJobData(parsedData);
    
    return cleanedData;
    
  } catch (error) {
    console.error('❌ AI parsing error:', error);
    
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API key. Please check your VITE_GEMINI_API_KEY configuration.');
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('API quota exceeded. Please try again later or check your API limits.');
    } else if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response. The AI returned invalid JSON. Please try again.');
    }
    
    throw new Error(`AI parsing failed: ${error.message}`);
  }
};

/**
 * Validate and clean the parsed job data
 * @param {object} data - Raw parsed data from AI
 * @returns {object} - Cleaned and validated data
 */
const validateAndCleanJobData = (data) => {
  // Helper function to ensure string
  const toString = (value, defaultVal = '') => {
    if (value === null || value === undefined) return defaultVal;
    return String(value).trim();
  };

  // Helper function to ensure number
  const toNumber = (value, defaultVal = null) => {
    if (value === null || value === undefined || value === '') return defaultVal;
    const num = parseInt(value);
    return isNaN(num) ? defaultVal : num;
  };

  // Helper function to ensure boolean
  const toBoolean = (value, defaultVal = false) => {
    if (value === null || value === undefined) return defaultVal;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  };

  // Validate employment types
  const validEmploymentTypes = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];
  const employmentType = toString(data.employment_type, 'full-time').toLowerCase();
  
  // Validate experience levels
  const validExperienceLevels = ['entry', 'mid', 'senior', 'executive'];
  const experienceLevel = toString(data.experience_level, 'mid').toLowerCase();
  
  // Validate location types
  const validLocationTypes = ['remote', 'on-site', 'hybrid'];
  const locationType = toString(data.location_type, 'on-site').toLowerCase();
  
  // Clean and validate location data
  const cleanLocation = (location) => {
    if (!location) return '';
    // Remove extra whitespace, commas at start/end
    return location.trim().replace(/^,+|,+$/g, '').trim();
  };
  
  const locationCity = cleanLocation(toString(data.location_city));
  const locationState = cleanLocation(toString(data.location_state));
  const locationCountry = cleanLocation(toString(data.location_country));
  
  // Validate application types
  const validApplicationTypes = ['external', 'email'];
  const applicationType = toString(data.application_type, 'external').toLowerCase();
  
  // Validate salary periods
  const validSalaryPeriods = ['yearly', 'monthly', 'hourly'];
  const salaryPeriod = toString(data.salary_period, 'yearly').toLowerCase();

  // Enforce field length limits to match database schema
  let title = toString(data.title);
  if (title.length > 500) {
    console.warn(`⚠️ Job title truncated from ${title.length} to 500 characters`);
    title = title.substring(0, 497) + '...';
  }
  
  let summary = toString(data.summary);
  if (summary.length > 1000) {
    console.warn(`⚠️ Job summary truncated from ${summary.length} to 1000 characters`);
    summary = summary.substring(0, 997) + '...';
  }
  
  return {
    // Basic Information
    title: title,
    summary: summary,
    description: toString(data.description),
    
    // Company Information
    external_company_name: toString(data.external_company_name),
    external_company_website: toString(data.external_company_website),
    external_company_logo: toString(data.external_company_logo),
    
    // Job Details
    employment_type: validEmploymentTypes.includes(employmentType) ? employmentType : 'full-time',
    experience_level: validExperienceLevels.includes(experienceLevel) ? experienceLevel : 'mid',
    category_id: toString(data.category_id),
    
    // Location
    location_type: validLocationTypes.includes(locationType) ? locationType : 'on-site',
    location_city: locationCity,
    location_state: locationState,
    location_country: locationCountry,
    
    // Salary
    salary_min: toNumber(data.salary_min),
    salary_max: toNumber(data.salary_max),
    salary_currency: toString(data.salary_currency, 'USD').toUpperCase(),
    salary_period: validSalaryPeriods.includes(salaryPeriod) ? salaryPeriod : 'yearly',
    salary_negotiable: toBoolean(data.salary_negotiable, false),
    show_salary: toBoolean(data.show_salary, true),
    
    // Requirements
    required_skills: toString(data.required_skills),
    preferred_skills: toString(data.preferred_skills),
    years_experience_min: toNumber(data.years_experience_min, 0),
    years_experience_max: toNumber(data.years_experience_max),
    education_requirement: toString(data.education_requirement),
    
    // Application
    application_type: validApplicationTypes.includes(applicationType) ? applicationType : 'external',
    application_url: toString(data.application_url),
    application_email: toString(data.application_email),
    application_instructions: toString(data.application_instructions),
    
    // Source
    source_url: toString(data.source_url),
    job_source: 'external'
  };
};

/**
 * Generate a smart job summary from title and description
 * @param {string} title - Job title
 * @param {string} description - Job description
 * @returns {Promise<string>} - Generated summary
 */
export const generateJobSummary = async (title, description) => {
  const genAI = initializeAI();
  if (!genAI) {
    return ''; // Return empty if AI not configured
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `Create a compelling one-line job summary (max 150 characters) for this position:

Title: ${title}
Description: ${description.substring(0, 500)}...

Return ONLY the summary text, nothing else. Make it engaging and informative.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();
    
    // Ensure it's within character limit
    return summary.length > 150 ? summary.substring(0, 147) + '...' : summary;
    
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return ''; // Return empty on error
  }
};

export default {
  parseJobWithAI,
  generateJobSummary
};
