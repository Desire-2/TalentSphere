/**
 * CV Builder Service
 * API client for CV generation with section-by-section support
 * Enhanced with error handling, retry logic, and timeout management
 */

import { API_CONFIG } from '../config/environment';

// Use proper API base URL configuration
// In development with Vite proxy: /api/cv-builder proxies to backend
// In production: uses environment-configured base URL
const API_BASE = `${API_CONFIG.BASE_URL}/cv-builder`;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  timeout: 120000 // 120 seconds
};

/**
 * Determine if an error is retryable
 */
function isRetryableError(error) {
  if (error.code === 'RATE_LIMITED') return true;
  if (error.code === 'TIMEOUT') return true;
  if (error.code === 'NETWORK_ERROR') return true;
  if (error.status === 503) return true; // Service unavailable
  if (error.status === 429) return true; // Too many requests
  if (error.status >= 500) return true;  // Server error
  
  return false;
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff(fn, context = {}) {
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${RETRY_CONFIG.maxRetries}...`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.error('❌ Non-retryable error:', error.code, error.message);
        throw error; // Non-retryable, fail immediately
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      
      const waitSeconds = Math.ceil(delay / 1000);
      console.warn(`⏳ Retryable error (${error.code}). Waiting ${waitSeconds}s before retry...`, error.message);
      
      if (context.onRetryWait) {
        context.onRetryWait({ attempt, waitSeconds, error });
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed after ${RETRY_CONFIG.maxRetries} attempts: ${lastError.message}`);
}

/**
 * Generate CV with section-by-section method
 * @param {Object} params - Generation parameters
 * @param {number} params.job_id - Optional job ID for tailored CV
 * @param {Object} params.custom_job - Optional custom job details
 * @param {string} params.style - CV style template
 * @param {Array<string>} params.sections - Sections to generate
 * @param {boolean} params.use_section_by_section - Use section-by-section generation
 * @param {Object} callbacks - Callback functions
 * @param {Function} callbacks.onProgress - Called on progress updates
 * @param {Function} callbacks.onRetryWait - Called when retrying
 * @returns {Promise<Object>} Generated CV with progress and todos
 */
export const generateCV = async (params = {}, callbacks = {}) => {
  const {
    job_id,
    custom_job,
    style = 'professional',
    sections = ['summary', 'work', 'education', 'skills', 'projects', 'certifications', 'awards', 'references'],
    use_section_by_section = true
  } = params;

  const { onProgress, onRetryWait } = callbacks;

  const token = localStorage.getItem('token');
  
  // Debug logging
  console.log('🔧 CV Generation Request:', {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    job_id,
    custom_job,
    style,
    sections: sections.length,
    use_section_by_section
  });
  
  return retryWithBackoff(async () => {
    // Setup abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeout);
    
    try {
      // Build request body
      const requestBody = {
        style,
        sections,
        use_section_by_section
      };

      // Add job data if provided
      if (job_id) {
        requestBody.job_id = job_id;
      } else if (custom_job) {
        requestBody.custom_job = custom_job;
      }
      
      console.log('📤 Request body:', requestBody);
      console.log('📤 Request URL:', `${API_BASE}/quick-generate`);
      
      const response = await fetch(`${API_BASE}/quick-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        
        const error = new Error();
        
        if (response.status === 429) {
          // Rate limited
          const retryAfter = response.headers.get('Retry-After') || '60';
          error.code = 'RATE_LIMITED';
          error.status = 429;
          error.retryAfter = parseInt(retryAfter);
          error.message = `API rate limited. Try again in ${retryAfter}s`;
        } else if (response.status === 408 || response.status === 504) {
          // Timeout
          error.code = 'TIMEOUT';
          error.status = response.status;
          error.message = 'Request timeout. The server took too long to respond.';
        } else if (response.status >= 500) {
          // Server error
          error.code = 'SERVER_ERROR';
          error.status = response.status;
          error.message = `Server error (${response.status}): ${response.statusText}`;
        } else {
          error.code = 'API_ERROR';
          error.status = response.status;
          error.message = `Server error (${response.status}): ${response.statusText}`;
          
          // Try to parse error JSON
          try {
            const errorJson = JSON.parse(errorText);
            error.message = errorJson.message || error.message;
          } catch (e) {
            // Keep generic message
          }
        }
        
        throw error;
      }

      clearTimeout(timeoutId);
      const responseData = await response.json();
      
      console.log('✅ Response data:', {
        success: responseData.success,
        hasCvContent: !!responseData.data?.cv_content,
        hasProgress: !!responseData.data?.progress,
        hasTodos: !!responseData.data?.todos,
        hasATSScore: !!responseData.data?.ats_score,
        progressCount: responseData.data?.progress?.length || 0,
        todosCount: responseData.data?.todos?.length || 0
      });

      if (!responseData.success) {
        const error = new Error(responseData.message || 'CV generation failed');
        error.code = 'GENERATION_ERROR';
        throw error;
      }

      return responseData;
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        const error = new Error('Request timed out after 120 seconds');
        error.code = 'TIMEOUT';
        throw error;
      }
      
      if (err instanceof TypeError) {
        const error = new Error('Network error. Please check your connection.');
        error.code = 'NETWORK_ERROR';
        throw error;
      }
      
      throw err;
    }
  }, { onRetryWait });
};

/**
 * Get user profile data formatted for CV
 * @returns {Promise<Object>} User profile data
 */
export const getUserCVData = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/user-data`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user data');
  }

  return await response.json();
};

/**
 * Get available CV styles
 * @returns {Promise<Object>} CV style metadata
 */
export const getCVStyles = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/styles`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch CV styles');
  }

  return await response.json();
};

/**
 * Download CV as PDF
 * @deprecated This function calls a non-existent backend endpoint.
 * Use CVRenderer's client-side exportToPDF method instead via ref.
 * @param {Object} cvContent - CV content to download
 * @param {string} style - CV style template
 * @returns {Promise<Blob>} PDF file blob
 */
export const downloadCVPDF = async (cvContent, style = 'professional') => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/download-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      cv_content: cvContent,
      style
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to download CV');
  }

  return await response.blob();
};

/**
 * Generate HTML preview of CV
 * @param {Object} cvContent - CV content to preview
 * @param {string} style - CV style template
 * @returns {Promise<string>} HTML preview
 */
export const previewCVHTML = async (cvContent, style = 'professional') => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/preview-html`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      cv_content: cvContent,
      style
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate preview');
  }

  const data = await response.json();
  return data.data.html;
};

/**
 * Parse a raw job posting text using AI and return structured fields
 * @param {string} rawText - The full job posting text to parse
 * @returns {Promise<Object>} Parsed job fields
 */
export const parseJobPosting = async (rawText) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}/parse-job-posting`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ raw_text: rawText })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to parse job posting');
  }

  return data.data;
};
