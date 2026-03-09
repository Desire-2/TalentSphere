/**
 * CV Builder Service
 * API client for CV generation with section-by-section support.
 * Uses Server-Sent Events (SSE) when available; falls back to POST polling.
 */

import { API_CONFIG } from '../config/environment';

const API_BASE = `${API_CONFIG.BASE_URL}/cv-builder`;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  timeout: 120000,
};

function isRetryableError(error) {
  if (error.code === 'RATE_LIMITED') return true;
  if (error.code === 'TIMEOUT') return true;
  if (error.code === 'NETWORK_ERROR') return true;
  if (error.status === 503) return true;
  if (error.status === 429) return true;
  if (error.status >= 500) return true;
  return false;
}

async function retryWithBackoff(fn, context = {}) {
  let lastError;
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${RETRY_CONFIG.maxRetries}...`);
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error)) throw error;

      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      const waitSeconds = Math.ceil(delay / 1000);
      console.warn(`⏳ Retryable error (${error.code}). Waiting ${waitSeconds}s before retry…`, error.message);
      if (context.onRetryWait) context.onRetryWait({ attempt, waitSeconds, error });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed after ${RETRY_CONFIG.maxRetries} attempts: ${lastError.message}`);
}

// ── SSE transport ─────────────────────────────────────────────────────────────

/**
 * Detect whether the browser supports EventSource.
 */
function supportsSSE() {
  return typeof EventSource !== 'undefined';
}

/**
 * Build the SSE URL from generation params.
 */
function buildStreamURL(params) {
  const { job_id, custom_job, style, sections } = params;
  const qs = new URLSearchParams();
  if (job_id) qs.set('job_id', String(job_id));
  if (style) qs.set('style', style);
  if (sections && sections.length) qs.set('sections', sections.join(','));
  if (custom_job) {
    try {
      qs.set('custom_job', encodeURIComponent(JSON.stringify(custom_job)));
    } catch {
      // If serialization fails, fall back to POST
    }
  }
  return `${API_BASE}/generate-stream?${qs.toString()}`;
}

/**
 * Connect to the SSE streaming endpoint and resolve with the complete CV data
 * when the "complete" phase event arrives.
 *
 * EventSource does not support custom headers (no Authorization), so we pass
 * the token as a query parameter instead. The backend must extract it from
 * request.args when the SSE path is used.
 *
 * Falls back to null if EventSource is not supported, letting the caller use
 * the POST path.
 */
function generateViaSSE(params, callbacks = {}) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token') || '';
    const url = buildStreamURL(params) + (token ? `&token=${encodeURIComponent(token)}` : '');

    let es;
    try {
      es = new EventSource(url);
    } catch (err) {
      reject(err);
      return;
    }

    const cleanup = () => {
      if (es) {
        es.close();
        es = null;
      }
    };

    // Safety timeout in case the stream stalls
    const timer = setTimeout(() => {
      cleanup();
      const e = new Error('SSE stream timed out after 120 seconds');
      e.code = 'TIMEOUT';
      reject(e);
    }, RETRY_CONFIG.timeout);

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { phase, message } = msg;

        if (phase !== 'complete' && phase !== 'error') {
          // Forward progress events to the caller
          if (callbacks.onPhaseUpdate) callbacks.onPhaseUpdate({ phase, message });
          return;
        }

        clearTimeout(timer);
        cleanup();

        if (phase === 'error') {
          const err = new Error(msg.message || 'SSE generation error');
          err.code = 'GENERATION_ERROR';
          reject(err);
          return;
        }

        // phase === 'complete'
        resolve({
          success: true,
          data: {
            cv_content: msg.cv_data,
            agent_reasoning: msg.agent_reasoning || null,
            metadata: msg.metadata || {},
            progress: [],
            todos: [],
            job_match_analysis: msg.cv_data?.job_match_analysis || null,
          },
        });
      } catch (parseErr) {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      clearTimeout(timer);
      cleanup();
      const err = new Error('SSE connection error');
      err.code = 'NETWORK_ERROR';
      reject(err);
    };
  });
}

// ── POST transport (original) ─────────────────────────────────────────────────

async function generateViaPOST(params, callbacks = {}) {
  const {
    job_id,
    custom_job,
    style = 'professional',
    sections = ['summary', 'work', 'education', 'skills', 'projects', 'certifications', 'awards', 'references'],
    use_section_by_section = true,
  } = params;

  const token = localStorage.getItem('token');

  console.log('🔧 CV Generation (POST):', { hasToken: !!token, job_id, style, sections: sections.length });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeout);

  try {
    const requestBody = { style, sections, use_section_by_section };
    if (job_id) requestBody.job_id = job_id;
    else if (custom_job) requestBody.custom_job = custom_job;

    const response = await fetch(`${API_BASE}/quick-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error();
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        error.code = 'RATE_LIMITED';
        error.status = 429;
        error.retryAfter = parseInt(retryAfter);
        error.message = `API rate limited. Try again in ${retryAfter}s`;
      } else if (response.status === 408 || response.status === 504) {
        error.code = 'TIMEOUT';
        error.status = response.status;
        error.message = 'Request timeout.';
      } else if (response.status >= 500) {
        error.code = 'SERVER_ERROR';
        error.status = response.status;
        error.message = `Server error (${response.status})`;
      } else {
        error.code = 'API_ERROR';
        error.status = response.status;
        error.message = `Error (${response.status}): ${response.statusText}`;
        try { error.message = JSON.parse(errorText).message || error.message; } catch { /* */ }
      }
      throw error;
    }

    const responseData = await response.json();
    if (!responseData.success) {
      const error = new Error(responseData.message || 'CV generation failed');
      error.code = 'GENERATION_ERROR';
      throw error;
    }
    return responseData;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const e = new Error('Request timed out after 120 seconds');
      e.code = 'TIMEOUT';
      throw e;
    }
    if (err instanceof TypeError) {
      const e = new Error('Network error. Please check your connection.');
      e.code = 'NETWORK_ERROR';
      throw e;
    }
    throw err;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate CV content.
 *
 * Prefers the SSE endpoint (/generate-stream) for real-time phase updates.
 * Automatically falls back to the POST endpoint (/quick-generate) when:
 *   - EventSource is not available in the browser
 *   - The SSE connection fails
 *
 * @param {Object} params - Generation parameters
 * @param {number}  params.job_id
 * @param {Object}  params.custom_job
 * @param {string}  params.style
 * @param {string[]} params.sections
 * @param {boolean} params.use_section_by_section
 * @param {Object}  callbacks
 * @param {Function} callbacks.onRetryWait
 * @param {Function} callbacks.onPhaseUpdate  — (only for SSE) called with {phase, message}
 */
export const generateCV = async (params = {}, callbacks = {}) => {
  // Try SSE first if the browser supports it
  if (supportsSSE()) {
    try {
      console.log('🌊 Attempting SSE streaming generation…');
      return await generateViaSSE(params, callbacks);
    } catch (sseErr) {
      console.warn('⚠️ SSE failed, falling back to POST:', sseErr.message);
      // fall through to POST
    }
  }

  // POST fallback with retry logic
  return retryWithBackoff(() => generateViaPOST(params, callbacks), {
    onRetryWait: callbacks.onRetryWait,
  });
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
