/**
 * AI Scholarship Parser Service
 * Uses Google Gemini AI to parse scholarship postings and extract structured data
 * 
 * This service takes raw scholarship text and converts it into a structured format
 * that matches the TalentSphere scholarship data structure.
 * 
 * @module aiScholarshipParser
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Parse scholarship content using Google Gemini AI
 * 
 * @param {string} rawContent - Raw text from scholarship posting
 * @param {Array} categories - Available scholarship categories from backend
 * @returns {Promise<Object>} Parsed scholarship data
 * @throws {Error} If API key is missing, parsing fails, or API quota exceeded
 * 
 * @example
 * const scholarshipData = await parseScholarshipWithAI(rawText, categories);
 * setFormData(prevData => ({ ...prevData, ...scholarshipData }));
 */
export async function parseScholarshipWithAI(rawContent, categories = []) {
  // Validate API key
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  // Validate input
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error('Please provide scholarship content to parse.');
  }

  try {
    // Use gemini-2.5-flash-lite for optimal free tier performance
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite"
    });

    // Build category context for better matching
    const categoryContext = categories.length > 0
      ? `\n\nAvailable scholarship categories:\n${categories.map(cat => `- ${cat.name} (ID: ${cat.id})`).join('\n')}`
      : '';

    const prompt = `You are an expert scholarship data extraction assistant. Parse the following scholarship posting and extract ALL available information into a structured JSON format.

${categoryContext}

CRITICAL INSTRUCTIONS:
1. Extract ALL fields that have information available in the text
2. For category_id: Match the scholarship to the most appropriate category from the list above. Return the numeric ID.
3. For dates: Convert to ISO 8601 format (YYYY-MM-DDTHH:mm:ss). Look for keywords: deadline, due date, application closes, apply by
4. For amounts: Extract numeric values only (no currency symbols or text). Look for: award amount, scholarship value, funding, stipend, grant
5. For URLs: Ensure they start with http:// or https://. Extract website, apply link, application portal
6. For boolean fields: Use true/false (lowercase)
7. For location: Parse city, state, and country separately. "Any location" = location_type: "any"
8. For study_level: Extract ALL applicable study levels and return as comma-separated string. Valid values: undergraduate, graduate, postgraduate, phd, vocational. Example: "undergraduate,graduate" or "phd,postgraduate". Look for: bachelor's, master's, doctoral, PhD, undergraduate, graduate
9. For scholarship_type: Use lowercase (merit-based, need-based, sports, academic, research, diversity, community, athletic, art, stem, international). Infer from context if not explicitly stated
10. For gender_requirements: Use lowercase (any, male, female, other). "Open to all" or no mention = "any"
11. For description: Convert to clean markdown format with proper headings and formatting. Include all details about the scholarship
12. For funding_type: Use lowercase (full, partial, tuition-only, living-expenses). "Full funding" includes tuition + living. "Tuition only" = tuition-only
13. For application_type: Use lowercase (external, email, internal). If there's a website link = "external", if email address = "email"
14. For location_type: Use lowercase (any, specific-country, specific-city). No location restriction = "any"
15. For required_documents: List all documents mentioned (transcripts, essays, letters, CV, etc.)
16. For essay_topics: Extract any essay prompts or topics mentioned
17. For num_recommendation_letters: Extract the specific number of letters required (default: 2)
18. For renewable: Look for keywords: renewable, multi-year, annually renewable
19. For duration_years: Extract scholarship duration (1-10 years). Default: 1
20. For field_of_study: Extract specific fields like Engineering, Medicine, Business, STEM, Arts, etc.
21. For nationality_requirements: Extract citizenship or residency requirements
22. For other_requirements: Extract additional criteria (work experience, community service, etc.)
23. For min_gpa: Extract minimum GPA (0.0-4.0 scale). Convert from percentage if needed
24. For max_age: Extract age limits if mentioned
25. Leave fields empty/null if information is not available

SCHOLARSHIP POSTING:
${rawContent}

EXTRACTION EXAMPLES:
- "Full tuition + $2,000/month stipend" → amount_min: 24000, amount_max: null, funding_type: "full"
- "Bachelor's and Master's students" → study_level: "undergraduate,graduate"
- "Open to all nationalities" → nationality_requirements: "Open to all", location_type: "any"
- "3.5 GPA required" → min_gpa: 3.5
- "Two letters of recommendation" → requires_recommendation_letters: true, num_recommendation_letters: 2
- "Essay on career goals (500 words)" → requires_essay: true, essay_topics: "Career goals essay (500 words)"

Return ONLY a valid JSON object with this exact structure (no additional text, no markdown formatting):
{
  "title": "Full scholarship title",
  "summary": "Brief 2-3 sentence summary",
  "description": "Complete description in markdown format",
  "scholarship_type": "merit-based|need-based|sports|academic|research|diversity|community|athletic|art|stem|international",
  "category_id": "numeric_category_id_from_list_above",
  "external_organization_name": "Organization name",
  "external_organization_website": "https://organization.com",
  "external_organization_logo": "https://organization.com/logo.png",
  "source_url": "https://original-scholarship-url.com",
  "study_level": "comma-separated list: undergraduate,graduate,postgraduate,phd,vocational (include all that apply)",
  "field_of_study": "Engineering, Medicine, etc.",
  "location_type": "any|specific-country|specific-city",
  "country": "Country name",
  "city": "City name",
  "state": "State/Province name",
  "amount_min": "numeric_value_only",
  "amount_max": "numeric_value_only",
  "currency": "USD|EUR|GBP|CAD|AUD|CNY|INR|JPY|etc. (3-letter ISO code, detect from $ € £ ¥ symbols or text)",
  "funding_type": "full|partial|tuition-only|living-expenses",
  "renewable": true or false,
  "duration_years": "numeric_value",
  "min_gpa": "numeric_value_0_to_4",
  "max_age": "numeric_value",
  "nationality_requirements": "Text describing nationality requirements",
  "gender_requirements": "any|male|female|other",
  "other_requirements": "Additional requirements text",
  "application_type": "external|email|internal",
  "application_deadline": "YYYY-MM-DDTHH:mm:ss",
  "application_email": "scholarships@organization.com",
  "application_url": "https://apply.organization.com",
  "application_instructions": "Detailed application instructions",
  "required_documents": "List of required documents",
  "requires_transcript": true or false,
  "requires_recommendation_letters": true or false,
  "num_recommendation_letters": "numeric_value",
  "requires_essay": true or false,
  "essay_topics": "Essay topics or prompts",
  "requires_portfolio": true or false
}`;

    console.log('🤖 Sending scholarship data to Gemini AI for parsing...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Received response from Gemini AI');
    
    // Extract JSON from response (handle potential markdown wrapping)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    // Parse JSON
    const parsedData = JSON.parse(jsonText);
    
    // Validate and clean the parsed data
    const cleanedData = validateAndCleanScholarshipData(parsedData);
    
    console.log('✅ Scholarship data parsed and validated successfully');
    console.log('📊 Extracted fields:', Object.keys(cleanedData).filter(key => cleanedData[key]));
    
    return cleanedData;
    
  } catch (error) {
    console.error('❌ Error parsing scholarship with AI:', error);
    
    // Provide specific error messages
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your API key configuration.');
    }
    
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
      throw new Error('API quota exceeded. Please try again later or check your API limits at https://aistudio.google.com/');
    }
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response. The AI might have returned invalid data. Please try again.');
    }
    
    throw new Error(`Failed to parse scholarship: ${error.message}`);
  }
}

/**
 * Validate and clean parsed scholarship data
 * Ensures data types are correct and values are within acceptable ranges
 * 
 * @param {Object} data - Raw parsed data from AI
 * @returns {Object} Cleaned and validated scholarship data
 */
function validateAndCleanScholarshipData(data) {
  const cleaned = {};
  
  // String fields - trim and ensure non-empty
  const stringFields = [
    'title', 'summary', 'description', 'scholarship_type', 'external_organization_name',
    'external_organization_website', 'external_organization_logo', 'source_url',
    'study_level', 'field_of_study', 'location_type', 'country', 'city', 'state',
    'currency', 'funding_type', 'nationality_requirements', 'gender_requirements',
    'other_requirements', 'application_type', 'application_email', 'application_url',
    'application_instructions', 'required_documents', 'essay_topics'
  ];
  
  stringFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string') {
      const trimmed = data[field].trim();
      if (trimmed && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'N/A') {
        cleaned[field] = trimmed;
      }
    }
  });
  
  // Enforce field length limits to match database schema
  if (cleaned.title && cleaned.title.length > 500) {
    console.warn(`⚠️ Title truncated from ${cleaned.title.length} to 500 characters`);
    cleaned.title = cleaned.title.substring(0, 497) + '...';
  }
  
  if (cleaned.summary && cleaned.summary.length > 1000) {
    console.warn(`⚠️ Summary truncated from ${cleaned.summary.length} to 1000 characters`);
    cleaned.summary = cleaned.summary.substring(0, 997) + '...';
  }
  
  // Validate and clean study levels (can be comma-separated)
  if (cleaned.study_level) {
    const validLevels = ['undergraduate', 'graduate', 'postgraduate', 'phd', 'vocational'];
    const levels = cleaned.study_level.split(',').map(l => l.trim().toLowerCase()).filter(l => validLevels.includes(l));
    if (levels.length > 0) {
      cleaned.study_level = levels.join(',');
    } else {
      delete cleaned.study_level;
    }
  }
  
  // Clean and validate URLs
  const urlFields = ['external_organization_website', 'external_organization_logo', 'source_url', 'application_url'];
  urlFields.forEach(field => {
    if (cleaned[field]) {
      cleaned[field] = cleanUrl(cleaned[field]);
    }
  });
  
  // Numeric fields - parse and validate
  if (data.category_id) {
    const categoryId = parseInt(data.category_id);
    if (!isNaN(categoryId) && categoryId > 0) {
      cleaned.category_id = categoryId.toString();
    }
  }
  
  // Currency validation and normalization
  if (data.currency) {
    let currency = String(data.currency).toUpperCase().trim();
    
    // Map common currency symbols to codes
    const currencyMap = {
      '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', 
      '₹': 'INR', 'C$': 'CAD', 'A$': 'AUD', '元': 'CNY',
      'USD': 'USD', 'EUR': 'EUR', 'GBP': 'GBP', 'CAD': 'CAD',
      'AUD': 'AUD', 'JPY': 'JPY', 'CNY': 'CNY', 'INR': 'INR'
    };
    
    if (currencyMap[currency]) {
      cleaned.currency = currencyMap[currency];
    } else if (currency.length === 3) {
      cleaned.currency = currency;
    } else {
      cleaned.currency = 'USD'; // Default fallback
    }
  }
  
  if (data.amount_min) {
    const amount = parseInt(String(data.amount_min).replace(/[^0-9]/g, ''));
    if (!isNaN(amount) && amount >= 0) {
      cleaned.amount_min = amount.toString();
    }
  }
  
  if (data.amount_max) {
    const amount = parseInt(String(data.amount_max).replace(/[^0-9]/g, ''));
    if (!isNaN(amount) && amount >= 0) {
      cleaned.amount_max = amount.toString();
    }
  }
  
  if (data.min_gpa) {
    let gpa = parseFloat(data.min_gpa);
    
    // Convert percentage to 4.0 scale if needed (e.g., 85% → 3.4)
    if (!isNaN(gpa) && gpa > 4.0 && gpa <= 100) {
      console.warn(`⚠️ Converting GPA from percentage: ${gpa}% → ${(gpa / 25).toFixed(2)}`);
      gpa = gpa / 25; // Convert percentage to 4.0 scale (100% = 4.0)
    }
    
    if (!isNaN(gpa) && gpa >= 0 && gpa <= 4.0) {
      cleaned.min_gpa = gpa.toFixed(2).toString();
    }
  }
  
  if (data.max_age) {
    const age = parseInt(data.max_age);
    if (!isNaN(age) && age >= 16 && age <= 100) {
      cleaned.max_age = age.toString();
    }
  }
  
  if (data.duration_years) {
    const years = parseInt(data.duration_years);
    if (!isNaN(years) && years >= 1 && years <= 10) {
      cleaned.duration_years = years.toString();
    }
  }
  
  if (data.num_recommendation_letters) {
    const num = parseInt(data.num_recommendation_letters);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      cleaned.num_recommendation_letters = num.toString();
    }
  }
  
  // Boolean fields
  const booleanFields = [
    'renewable', 'requires_transcript', 'requires_recommendation_letters',
    'requires_essay', 'requires_portfolio'
  ];
  
  booleanFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      // Handle string representations of booleans
      if (typeof data[field] === 'string') {
        cleaned[field] = data[field].toLowerCase() === 'true';
      } else {
        cleaned[field] = Boolean(data[field]);
      }
    }
  });
  
  // Date fields - validate ISO format
  if (data.application_deadline) {
    const deadline = cleanDate(data.application_deadline);
    if (deadline) {
      cleaned.application_deadline = deadline;
    }
  }
  
  // Ensure description is in markdown format
  if (cleaned.description && !cleaned.description.includes('#') && !cleaned.description.includes('**')) {
    cleaned.description = convertToMarkdown(cleaned.description);
  }
  
  // Generate summary if missing but description exists
  if (!cleaned.summary && cleaned.description) {
    cleaned.summary = generateScholarshipSummary(cleaned.title || 'Scholarship', cleaned.description);
  }
  
  return cleaned;
}

/**
 * Clean and validate URL
 * @param {string} url - URL to clean
 * @returns {string|null} Cleaned URL or null if invalid
 */
function cleanUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  let cleaned = url.trim();
  
  // Remove markdown link formatting if present
  const markdownLinkMatch = cleaned.match(/\[.*?\]\((.*?)\)/);
  if (markdownLinkMatch) {
    cleaned = markdownLinkMatch[1];
  }
  
  // Add protocol if missing
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  
  // Validate URL format
  try {
    new URL(cleaned);
    return cleaned;
  } catch {
    return null;
  }
}

/**
 * Clean and validate date string
 * @param {string} dateStr - Date string to clean
 * @returns {string|null} ISO formatted date string or null if invalid
 */
function cleanDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Try parsing the date
    const date = new Date(dateStr);
    
    // Check if date is valid and in the future
    if (isNaN(date.getTime())) return null;
    
    // Convert to ISO format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return null;
  }
}

/**
 * Convert plain text to markdown format
 * @param {string} text - Plain text to convert
 * @returns {string} Markdown formatted text
 */
function convertToMarkdown(text) {
  if (!text) return '';
  
  let markdown = text.trim();
  
  // Add main heading if there isn't one
  if (!markdown.startsWith('#')) {
    const lines = markdown.split('\n');
    const firstLine = lines[0];
    if (firstLine.length < 100) {
      markdown = `# ${firstLine}\n\n${lines.slice(1).join('\n')}`;
    }
  }
  
  // Convert section titles to headings
  markdown = markdown.replace(/^([A-Z][^.!?\n]{3,50}):?\s*$/gm, '## $1');
  
  // Convert bullet points
  markdown = markdown.replace(/^[•\-]\s+/gm, '- ');
  
  // Add emphasis to important keywords
  const keywords = ['Important', 'Note', 'Required', 'Deadline', 'Eligibility'];
  keywords.forEach(keyword => {
    markdown = markdown.replace(new RegExp(`\\b${keyword}\\b`, 'g'), `**${keyword}**`);
  });
  
  return markdown;
}

/**
 * Generate a concise summary from scholarship title and description
 * @param {string} title - Scholarship title
 * @param {string} description - Full scholarship description
 * @returns {string} Generated summary (2-3 sentences)
 */
function generateScholarshipSummary(title, description) {
  if (!description) return '';
  
  // Remove markdown and HTML
  const plainText = description
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  
  // Get first 2-3 sentences
  const sentences = plainText.split(/[.!?]+\s+/);
  const summary = sentences.slice(0, 3).join('. ');
  
  // Limit to ~200 characters
  if (summary.length > 200) {
    return summary.substring(0, 197) + '...';
  }
  
  return summary + (summary.endsWith('.') ? '' : '.');
}

/**
 * Analyze which fields were successfully filled by the AI parser
 * Useful for debugging and user feedback
 * 
 * @param {Object} parsedData - Data returned by parseScholarshipWithAI
 * @returns {Object} Analysis object with filled/empty field counts
 */
export function analyzeFilledFields(parsedData) {
  const allFields = {
    basic: ['title', 'summary', 'description', 'scholarship_type', 'category_id'],
    organization: ['external_organization_name', 'external_organization_website', 'external_organization_logo', 'source_url'],
    academic: ['study_level', 'field_of_study'],
    location: ['location_type', 'country', 'city', 'state'],
    eligibility: ['nationality_requirements', 'gender_requirements', 'min_gpa', 'max_age', 'other_requirements'],
    financial: ['amount_min', 'amount_max', 'currency', 'funding_type', 'renewable', 'duration_years'],
    application: ['application_type', 'application_deadline', 'application_email', 'application_url', 'application_instructions', 'required_documents'],
    documents: ['requires_transcript', 'requires_recommendation_letters', 'num_recommendation_letters', 'requires_essay', 'essay_topics', 'requires_portfolio']
  };
  
  const analysis = {
    totalFields: 0,
    filledFields: 0,
    emptyFields: 0,
    sections: {}
  };
  
  Object.entries(allFields).forEach(([section, fields]) => {
    const sectionAnalysis = {
      total: fields.length,
      filled: 0,
      empty: 0,
      filledFieldNames: [],
      emptyFieldNames: []
    };
    
    fields.forEach(field => {
      analysis.totalFields++;
      const value = parsedData[field];
      const isFilled = value !== undefined && value !== null && value !== '';
      
      if (isFilled) {
        analysis.filledFields++;
        sectionAnalysis.filled++;
        sectionAnalysis.filledFieldNames.push(field);
      } else {
        analysis.emptyFields++;
        sectionAnalysis.empty++;
        sectionAnalysis.emptyFieldNames.push(field);
      }
    });
    
    analysis.sections[section] = sectionAnalysis;
  });
  
  return analysis;
}

/**
 * Get user-friendly field name from camelCase/snake_case
 * @param {string} fieldName - Field name to format
 * @returns {string} Formatted field name
 */
export function formatFieldName(fieldName) {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export default {
  parseScholarshipWithAI,
  analyzeFilledFields,
  formatFieldName
};
