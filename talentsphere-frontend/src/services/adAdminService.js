import api from './api';

const BASE_URL = '/ads/admin';

const normalizeServiceError = (error, fallbackMessage = 'Ad admin request failed') => {
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

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
};

const adAdminService = {
  getOverview: async () => {
    try {
      return await api.get(`${BASE_URL}/overview`);
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load ads overview');
    }
  },

  getReviewQueue: async (status = 'all', page = 1, limit = 20) => {
    try {
      const query = buildQuery({ status, page, limit });
      return await api.get(`${BASE_URL}/review-queue${query ? `?${query}` : ''}`);
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load review queue');
    }
  },

  listCampaigns: async (filters = {}) => {
    try {
      const query = buildQuery(filters);
      return await api.get(`${BASE_URL}/campaigns${query ? `?${query}` : ''}`);
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load campaigns');
    }
  },

  getCampaignDetail: async (campaignId) => {
    try {
      return await api.get(`${BASE_URL}/campaigns/${campaignId}`);
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load campaign details');
    }
  },

  approveCampaign: async (campaignId) => {
    try {
      return await api.post(`${BASE_URL}/campaigns/${campaignId}/approve`, {});
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to approve campaign');
    }
  },

  rejectCampaign: async (campaignId, notes) => {
    try {
      return await api.post(`${BASE_URL}/campaigns/${campaignId}/reject`, {
        notes,
      });
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to reject campaign');
    }
  },

  resetReview: async (campaignId) => {
    try {
      return await api.post(`${BASE_URL}/campaigns/${campaignId}/reset-review`, {});
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to reset review');
    }
  },

  needsChangesCampaign: async (campaignId, notes) => {
    try {
      return await api.post(`${BASE_URL}/campaigns/${campaignId}/needs-changes`, {
        notes,
      });
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to mark campaign as needs changes');
    }
  },

  updateCampaignStatus: async (campaignId, status) => {
    try {
      return await api.put(`${BASE_URL}/campaigns/${campaignId}/status`, { status });
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to update campaign status');
    }
  },

  listPlacements: async () => {
    try {
      return await api.get(`${BASE_URL}/placements`);
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load placements');
    }
  },

  updatePlacement: async (placementId, payload) => {
    try {
      return await api.put(`${BASE_URL}/placements/${placementId}`, payload);
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to update placement');
    }
  },

  getAnalyticsOverview: async () => {
    try {
      return await api.get(`${BASE_URL}/analytics/overview`);
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to load analytics overview');
    }
  },

  runAggregation: async () => {
    try {
      return await api.post(`${BASE_URL}/run-aggregation`, {});
    } catch (error) {
      throw normalizeServiceError(error, 'Failed to run aggregation');
    }
  },
};

export default adAdminService;
