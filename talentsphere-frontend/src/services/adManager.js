/**
 * Ad Manager Service - API client for advertising backend
 * Handles all communication with the /api/ads endpoints
 */

import axiosInstance from './api';

const BASE_URL = '/ads';

export const adManagerService = {
  // ========================
  // CAMPAIGN ENDPOINTS
  // ========================
  
  /**
   * Create a new campaign
   */
  createCampaign: async (campaignData) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/campaigns`, campaignData);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * List all campaigns for current employer
   */
  listCampaigns: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      const response = await axiosInstance.get(`${BASE_URL}/campaigns?${params}`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get campaign detail
   */
  getCampaign: async (campaignId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/campaigns/${campaignId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update campaign
   */
  updateCampaign: async (campaignId, updates) => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/campaigns/${campaignId}`, updates);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Submit campaign for review
   */
  submitCampaign: async (campaignId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/campaigns/${campaignId}/submit`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Pause campaign
   */
  pauseCampaign: async (campaignId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/campaigns/${campaignId}/pause`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Resume campaign
   */
  resumeCampaign: async (campaignId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/campaigns/${campaignId}/resume`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ========================
  // CREATIVE ENDPOINTS
  // ========================

  /**
   * Create a creative for a campaign
   */
  createCreative: async (campaignId, creativeData) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/campaigns/${campaignId}/creatives`,
        creativeData
      );
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update a creative
   */
  updateCreative: async (campaignId, creativeId, updates) => {
    try {
      const response = await axiosInstance.put(
        `${BASE_URL}/campaigns/${campaignId}/creatives/${creativeId}`,
        updates
      );
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a creative
   */
  deleteCreative: async (campaignId, creativeId) => {
    try {
      const response = await axiosInstance.delete(
        `${BASE_URL}/campaigns/${campaignId}/creatives/${creativeId}`
      );
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ========================
  // TARGETING ENDPOINTS
  // ========================

  /**
   * Set campaign targeting
   */
  setTargeting: async (campaignId, targetingData) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/campaigns/${campaignId}/targeting`,
        targetingData
      );
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ========================
  // ANALYTICS ENDPOINTS
  // ========================

  /**
   * Get campaign analytics
   */
  getAnalytics: async (campaignId, dateRange = {}) => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('start', dateRange.start);
      if (dateRange.end) params.append('end', dateRange.end);
      
      const response = await axiosInstance.get(
        `${BASE_URL}/analytics/${campaignId}?${params}`
      );
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ========================
  // CREDITS ENDPOINTS
  // ========================

  /**
   * Get credit balance
   */
  getCredits: async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/credits`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Purchase credits
   */
  purchaseCredits: async (amount, paymentReference) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/credits/purchase`, {
        amount,
        reference_id: paymentReference,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adManagerService;
