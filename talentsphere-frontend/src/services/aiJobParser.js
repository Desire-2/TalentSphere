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
    const prompt = `You are an expert job posting analyzer. Parse the following job posting and extract all relevant information into a structured JSON format.

Job Posting Content:
"""
${rawContent}
"""
${categoryInfo}

Please analyze this job posting and extract the following information. Return ONLY a valid JSON object with these fields:

{
  "title": "Job title (string, required)",
  "summary": "Brief one-line summary of the role (string, 150 chars max)",
  "description": "Full job description in markdown format (string, required, preserve formatting, use markdown headers, lists, etc.)",
  "external_company_name": "Company name (string, required)",
  "external_company_website": "Company website URL (string, must start with http:// or https://)",
  "external_company_logo": "Company logo URL if mentioned (string, must start with http:// or https://)",
  "employment_type": "One of: full-time, part-time, contract, freelance, internship (string, required, default: full-time)",
  "experience_level": "One of: entry, mid, senior, executive (string, required, default: mid)",
  "category_id": "BEST MATCHING category ID from the list above based on job title, skills, and responsibilities (string, REQUIRED - choose the most relevant one)",
  "location_type": "IMPORTANT: One of: remote, on-site, hybrid (string, required). Analyze keywords like 'remote work', 'work from home', 'WFH', 'office-based', 'in-office', 'on-site', 'hybrid work', 'flexible location' to determine this accurately",
  "location_city": "City name ONLY without state/country (string, e.g., 'San Francisco' not 'San Francisco, CA')",
  "location_state": "State/Province name or abbreviation (string, e.g., 'CA', 'California', 'NY')",
  "location_country": "Country name (string, e.g., 'USA', 'United States', 'UK', 'Canada')",
  "salary_min": "Minimum salary as number (number, no currency symbols)",
  "salary_max": "Maximum salary as number (number, no currency symbols)",
  "salary_currency": "Currency code like USD, EUR, GBP, CAD (string, default: USD)",
  "salary_period": "One of: yearly, monthly, hourly (string, default: yearly)",
  "salary_negotiable": "Whether salary is negotiable (boolean, default: false)",
  "show_salary": "Whether to show salary (boolean, default: true)",
  "required_skills": "Comma-separated list of required skills (string)",
  "preferred_skills": "Comma-separated list of preferred/nice-to-have skills (string)",
  "years_experience_min": "Minimum years of experience (number, default: 0)",
  "years_experience_max": "Maximum years of experience (number)",
  "education_requirement": "Education requirements (string)",
  "application_type": "One of: external, email (string, required, default: external)",
  "application_url": "Application URL (string, must start with http:// or https://)",
  "application_email": "Application email (string)",
  "application_instructions": "How to apply instructions (string)",
  "source_url": "Original job posting URL if mentioned (string)"
}

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON, no additional text or explanations
2. For the description field, convert the content to proper markdown format with headers (##), lists (-), bold (**), etc.
3. If a field is not found in the content, use empty string "" for text fields, null for numbers, or the default value mentioned
4. For salary, extract numbers only (remove currency symbols, commas)
5. Standardize employment_type, experience_level, location_type, application_type to match the exact values listed
6. Skills should be comma-separated (e.g., "React, TypeScript, Node.js")
7. Ensure all URLs start with http:// or https://
8. Make intelligent guesses for missing but inferable information (like experience level from job title)
9. For category_id: Analyze the job title, required skills, and responsibilities to determine the BEST matching category from the list provided
10. For location parsing:
    - location_type: Look for keywords like "remote", "work from home", "WFH", "distributed", "office", "on-site", "in-office", "hybrid", "flexible location"
    - location_city: Extract ONLY the city name (e.g., "San Francisco" from "San Francisco, CA")
    - location_state: Extract state/province (e.g., "CA", "California", "NY", "New York")
    - location_country: Extract or infer country (e.g., "USA", "United States", "Canada", "UK")
    - If format is "City, State" (e.g., "Austin, TX"), split correctly into city and state
    - If format is "City, State, Country", split into all three fields
    - For remote jobs, location fields may be empty or specify eligible regions
11. The JSON must be valid and parseable

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

  return {
    // Basic Information
    title: toString(data.title),
    summary: toString(data.summary),
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
