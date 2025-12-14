/**
 * CV Builder Service
 * API client for CV generation with section-by-section support
 */

import { API_CONFIG } from '../config/environment';

// Use proper API base URL configuration
// In development with Vite proxy: /api/cv-builder proxies to backend
// In production: uses environment-configured base URL
const API_BASE = `${API_CONFIG.BASE_URL}/cv-builder`;

/**
 * Generate CV with section-by-section method
 * @param {Object} params - Generation parameters
 * @param {number} params.job_id - Optional job ID for tailored CV
 * @param {Object} params.custom_job - Optional custom job details
 * @param {string} params.style - CV style template
 * @param {Array<string>} params.sections - Sections to generate
 * @param {boolean} params.use_section_by_section - Use section-by-section generation
 * @returns {Promise<Object>} Generated CV with progress and todos
 */
export const generateCV = async (params = {}) => {
  const {
    job_id,
    custom_job,
    style = 'professional',
    sections = ['summary', 'work', 'education', 'skills', 'projects', 'certifications', 'awards', 'references'],
    use_section_by_section = true
  } = params;

  const token = localStorage.getItem('token');
  
  // Debug logging
  console.log('🔧 CV Generation Request:', {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    job_id,
    custom_job,
    style,
    sections,
    use_section_by_section
  });
  
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
    body: JSON.stringify(requestBody)
  });

  console.log('📥 Response status:', response.status);
  console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Response error text:', errorText);
    let errorMessage = 'Failed to generate CV';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorMessage;
    } catch (e) {
      // If response is not JSON (like HTML error page), show generic message
      errorMessage = `Server error (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const responseData = await response.json();
  console.log('✅ Response data:', {
    success: responseData.success,
    hasCvContent: !!responseData.data?.cv_content,
    hasProgress: !!responseData.data?.progress,
    hasTodos: !!responseData.data?.todos,
    progressCount: responseData.data?.progress?.length || 0,
    todosCount: responseData.data?.todos?.length || 0
  });

  return responseData;
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
