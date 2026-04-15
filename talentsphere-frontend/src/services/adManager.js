/**
 * Ad Manager Service - API client for advertising backend
 * Handles all communication with the /api/ads endpoints
 */

import axiosInstance from './api';

const BASE_URL = '/ads';

const normalizeServiceError = (error, fallbackMessage = 'Ad request failed') => {
  const message =
    error?.error ||
    error?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    (typeof error === 'string' ? error : null) ||
    fallbackMessage;

  return {
    error: message,
    message,
    details: error,
  };
};

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

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
      throw normalizeServiceError(error, 'Failed to create campaign');
    }
  },

  /**
   * List all campaigns for current employer
   */
  listCampaigns: async (filters = {}) => {
    try {
      const queryString = buildQuery(filters);
      const response = await axiosInstance.get(
        `${BASE_URL}/campaigns${queryString ? `?${queryString}` : ''}`
      );
      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load campaigns');
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
      throw normalizeServiceError(error, 'Failed to load campaign');
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
      throw normalizeServiceError(error, 'Failed to update campaign');
    }
  },

  /**
   * Delete campaign
   */
  deleteCampaign: async (campaignId) => {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}/campaigns/${campaignId}`);
      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to delete campaign');
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
      throw normalizeServiceError(error, 'Failed to submit campaign for review');
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
      throw normalizeServiceError(error, 'Failed to pause campaign');
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
      throw normalizeServiceError(error, 'Failed to resume campaign');
    }
  },

  // ========================
  // CREATIVE ENDPOINTS
  // ========================

  /**
   * Create a creative for a campaign
   */
  createCreative: async (campaignId, creativeData, imageFile = null) => {
    try {
      let response;

      if (imageFile) {
        const formData = new FormData();
        Object.entries(creativeData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        formData.append('image', imageFile);

        response = await axiosInstance.postForm(
          `${BASE_URL}/campaigns/${campaignId}/creatives`,
          formData
        );
      } else {
        response = await axiosInstance.post(
          `${BASE_URL}/campaigns/${campaignId}/creatives`,
          creativeData
        );
      }

      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to create creative');
    }
  },

  /**
   * Update a creative
   */
  updateCreative: async (campaignId, creativeId, updates, imageFile = null) => {
    try {
      let response;

      if (imageFile) {
        const formData = new FormData();
        Object.entries(updates || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        formData.append('image', imageFile);

        response = await axiosInstance.put(
          `${BASE_URL}/campaigns/${campaignId}/creatives/${creativeId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        response = await axiosInstance.put(
          `${BASE_URL}/campaigns/${campaignId}/creatives/${creativeId}`,
          updates
        );
      }

      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to update creative');
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
      throw normalizeServiceError(error, 'Failed to delete creative');
    }
  },

  // ========================
  // PLACEMENTS ENDPOINTS
  // ========================

  /**
   * List available placements and selection state for a campaign.
   */
  listPlacements: async (campaignId = null) => {
    try {
      const queryString = buildQuery({ campaign_id: campaignId });
      const response = await axiosInstance.get(
        `${BASE_URL}/placements${queryString ? `?${queryString}` : ''}`
      );
      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load placements');
    }
  },

  /**
   * Backward-compatible alias for older callers.
   */
  getPlacements: async (campaignId = null) => {
    return adManagerService.listPlacements(campaignId);
  },

  /**
   * Get campaign placements.
   */
  getCampaignPlacements: async (campaignId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/campaigns/${campaignId}/placements`);
      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load campaign placements');
    }
  },

  /**
   * Update campaign placements using placement IDs or keys.
   */
  updateCampaignPlacements: async (campaignId, placements) => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/campaigns/${campaignId}/placements`, {
        placements,
      });
      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to update campaign placements');
    }
  },

  /**
   * Get employer ads dashboard summary metrics.
   */
  getDashboardSummary: async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/dashboard/summary`);
      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load dashboard summary');
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
      throw normalizeServiceError(error, 'Failed to save targeting');
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
      const params = buildQuery(dateRange);
      const response = await axiosInstance.get(
        `${BASE_URL}/analytics/${campaignId}${params ? `?${params}` : ''}`
      );
      return response;
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load analytics');
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
      throw normalizeServiceError(error, 'Failed to load credits');
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
      throw normalizeServiceError(error, 'Failed to purchase credits');
    }
  },
};

export default adManagerService;
