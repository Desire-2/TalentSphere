/**
 * AfriTech AI Career Agent service.
 * Single API client for the career workspace: profile intelligence, imports,
 * generation lifecycle, documents, exports, and subscriptions.
 */

import { API_CONFIG } from '../config/environment';
import { authService } from './auth';

const BASE = `${API_CONFIG.BASE_URL}/career-agent`;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshAccessToken() {
  return authService.refreshSession();
}

async function request(path, { method = 'GET', body, formData, signal } = {}, retryAuth = true) {
  const config = { method, signal, credentials: 'include', headers: { ...authHeaders() } };
  if (formData) {
    config.body = formData;
  } else if (body !== undefined) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE}${path}`, config);
  if (response.status === 401 && retryAuth) {
    if (await refreshAccessToken()) {
      return request(path, { method, body, formData, signal }, false);
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('session-expired'));
  }
  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : await response.blob();
  if (!response.ok) {
    const error = new Error(data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code;
    error.usage = data?.usage;
    error.details = data;
    throw error;
  }
  return data;
}

function blobDownloadUrl(blob) {
  return URL.createObjectURL(blob);
}

function resolveResumeDocument(application) {
  const linkedDocumentId = application?.career_documents?.cv_document_id;
  if (linkedDocumentId) return { applicationId: application.id, documentId: linkedDocumentId };
  const match = String(application?.resume_url || '').match(/\/api\/career-agent\/documents\/(\d+)(?:\/download)?/);
  if (!match) return null;
  return { applicationId: application?.id, documentId: Number(match[1]) };
}

function saveBlob(blob, filename) {
  const url = blobDownloadUrl(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filenameFromResponse(response, fallback) {
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

async function authenticatedBlob(path, retryAuth = true) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (response.status === 401 && retryAuth && await refreshAccessToken()) {
    return authenticatedBlob(path, false);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data?.error || `Download failed (${response.status})`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return { blob: await response.blob(), filename: filenameFromResponse(response, 'career-document.pdf') };
}

export const careerAgentService = {
  // ── Profile intelligence ────────────────────────────────────────────────
  getProfile: (signal) => request('/profile', { signal }),
  updatePreferences: (preferences) => request('/profile/preferences', { method: 'PUT', body: preferences }),

  // ── Document import ─────────────────────────────────────────────────────
  importDocument: (file, allowImageAnalysis = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('allow_image_analysis', String(allowImageAnalysis));
    return request('/documents/import', { method: 'POST', formData });
  },
  listImports: () => request('/documents/imports'),
  getImport: (id) => request(`/documents/imports/${id}`),
  confirmImport: (id, categories) => request(`/documents/imports/${id}/confirm`, { method: 'POST', body: { categories } }),
  deleteImport: (id) => request(`/documents/imports/${id}`, { method: 'DELETE' }),
  deleteEvidence: (evidenceId) => request(`/evidence/${encodeURIComponent(String(evidenceId).replace(/^ev_/, ''))}`, { method: 'DELETE' }),

  // ── Job analysis ────────────────────────────────────────────────────────
  analyzeJob: ({ jobId, targetJob } = {}) =>
    request('/analyze-job', { method: 'POST', body: jobId ? { platform_job_id: jobId } : { target_job: targetJob } }),

  // ── Generation lifecycle ────────────────────────────────────────────────
  generate: ({ targetJob, jobId, idempotencyKey, templateKey, documentMode }) =>
    request('/generate', {
      method: 'POST',
      body: {
        ...(jobId ? { platform_job_id: jobId } : { target_job: targetJob }),
        idempotency_key: idempotencyKey,
        template_key: templateKey,
        document_mode: documentMode,
      },
    }),
  listGenerations: () => request('/generations'),
  getGeneration: (id, signal) => request(`/generations/${id}`, { signal }),
  retryGeneration: (id) => request(`/generations/${id}/retry`, { method: 'POST', body: {} }),

  // ── Documents (CV and cover letter share one contract) ──────────────────
  getDocument: (id, signal) => request(`/documents/${id}`, { signal }),
  autosaveDocument: (id, { content, settings }) =>
    request(`/documents/${id}`, { method: 'PUT', body: { content, settings } }),
  saveVersion: (id, changeNote) => request(`/documents/${id}/version`, { method: 'POST', body: { change_note: changeNote } }),
  listVersions: (id) => request(`/documents/${id}/versions`),
  restoreVersion: (id, versionNumber) => request(`/documents/${id}/versions/${versionNumber}/restore`, { method: 'POST', body: {} }),
  aiAssist: (id, { action, selectedText }) =>
    request(`/documents/${id}/ai-assist`, { method: 'POST', body: { action, selected_text: selectedText } }),

  // ── Export ──────────────────────────────────────────────────────────────
  async exportDocument(id, format) {
    return request(`/documents/${id}/export?format=${encodeURIComponent(format)}`, { method: 'POST' });
  },

  // ── Apply-flow document attachment ──────────────────────────────────────
  documentsForJob: (jobId, signal) => request(`/documents/for-job/${jobId}`, { signal }),
  async downloadDocument(documentId, format = 'pdf') {
    const { blob, filename } = await authenticatedBlob(`/documents/${documentId}/download?format=${encodeURIComponent(format)}`);
    saveBlob(blob, filename);
  },
  async viewDocument(documentId, format = 'pdf') {
    const viewer = window.open('', '_blank');
    if (viewer) viewer.opener = null;
    const { blob } = await authenticatedBlob(`/documents/${documentId}/download?format=${encodeURIComponent(format)}`);
    const url = blobDownloadUrl(blob);
    if (viewer) viewer.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
  isCareerAgentResume: (application) => Boolean(resolveResumeDocument(application)),
  async downloadApplicationResume(application, format = 'pdf') {
    const target = resolveResumeDocument(application);
    if (!target) {
      window.open(application.resume_url, '_blank', 'noopener,noreferrer');
      return;
    }
    const path = `/applications/${target.applicationId}/documents/${target.documentId}/download?format=${encodeURIComponent(format)}`;
    const { blob, filename } = await authenticatedBlob(path);
    saveBlob(blob, filename);
  },
  async viewApplicationResume(application, format = 'pdf') {
    const target = resolveResumeDocument(application);
    if (!target) {
      window.open(application.resume_url, '_blank', 'noopener,noreferrer');
      return;
    }
    const viewer = window.open('', '_blank');
    if (viewer) viewer.opener = null;
    const path = `/applications/${target.applicationId}/documents/${target.documentId}/download?format=${encodeURIComponent(format)}`;
    const { blob } = await authenticatedBlob(path);
    const url = blobDownloadUrl(blob);
    if (viewer) viewer.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },

  // ── Usage and subscription ──────────────────────────────────────────────
  getUsage: () => request('/usage'),
  getSubscription: () => request('/subscription'),
  startCheckout: (planCode) =>
    request('/subscription/checkout', { method: 'POST', body: { plan_code: planCode, idempotency_key: `chk-${crypto.randomUUID()}` } }),
  verifyPayment: (providerReference) =>
    request('/subscription/verify', { method: 'POST', body: { provider_reference: providerReference } }),
};

export default careerAgentService;
