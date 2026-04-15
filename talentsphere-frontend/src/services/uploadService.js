/**
 * File Upload Service backed by backend Vercel Blob uploads.
 */

import config from '../config/environment.js';

class UploadService {
  constructor() {
    this.baseURL = config.API.API_URL;
    this.uploadPath = '/api/uploads/documents';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  getUploadUrl() {
    return `${this.baseURL.replace(/\/$/, '')}${this.uploadPath}`;
  }

  async uploadViaBackend(file, userId, type) {
    const formData = new FormData();
    formData.append('file', file);
    if (userId) {
      formData.append('userId', userId);
    }
    formData.append('type', type);

    const response = await fetch(this.getUploadUrl(), {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData,
      credentials: 'include',
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Upload failed');
    }

    if (!payload.url) {
      throw new Error('Upload failed: missing file url');
    }

    return payload.url;
  }

  /**
   * Upload a resume file
   * @param {File} file - The resume file to upload
   * @param {string} userId - The user ID for organizing files
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  async uploadResume(file, userId) {
    try {
      // Validate file
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a PDF or Word document.');
      }

      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 5MB.');
      }

      return await this.uploadViaBackend(file, userId, 'resume');
    } catch (error) {
      console.error('Resume upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload a portfolio file
   * @param {File} file - The portfolio file to upload
   * @param {string} userId - The user ID for organizing files
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  async uploadPortfolio(file, userId) {
    return this.uploadDocument(file, userId, 'portfolio');
  }

  /**
   * Upload a portfolio or other document
   * @param {File} file - The file to upload
   * @param {string} userId - The user ID for organizing files
   * @param {string} type - The type of document (portfolio, cover-letter, etc.)
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  async uploadDocument(file, userId, type = 'document') {
    try {
      // Basic validation
      const maxSize = 10 * 1024 * 1024; // 10MB for other documents

      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      return await this.uploadViaBackend(file, userId, type);
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete an uploaded file
   * @param {string} fileUrl - The URL of the file to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(fileUrl) {
    try {
      // Mock deletion
      console.log('Mock file deletion:', fileUrl);
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get upload progress (for future implementation)
   * @param {string} uploadId - The upload ID
   * @returns {Promise<number>} - Progress percentage
   */
  async getUploadProgress(uploadId) {
    // Mock progress tracking
    return 100;
  }
}

const uploadService = new UploadService();
export default uploadService;
