import api from './api';

export const scholarshipService = {
  // Public scholarship endpoints
  getScholarships: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await api.get(`/scholarships?${queryParams.toString()}`);
      
      // Handle different possible response structures
      if (response.data) {
        return response.data;
      } else if (response.scholarships) {
        return response;
      } else {
        // If response is an array, wrap it in the expected structure
        return {
          scholarships: Array.isArray(response) ? response : [],
          pagination: {
            total: Array.isArray(response) ? response.length : 0,
            pages: 1,
            page: 1,
            per_page: Array.isArray(response) ? response.length : 0
          }
        };
      }
    } catch (error) {
      console.error('Error in getScholarships:', error);
      // Return empty result structure on error
      return {
        scholarships: [],
        pagination: { total: 0, pages: 1, page: 1, per_page: 0 }
      };
    }
  },

  getScholarshipDetail: async (id) => {
    try {
      const response = await api.get(`/scholarships/${id}`);
      
      // Handle different possible response structures
      if (response.data) {
        return response.data;
      } else if (response.scholarship) {
        return response;
      } else {
        return response;
      }
    } catch (error) {
      console.error('Error in getScholarshipDetail:', error);
      throw error; // Re-throw for detail page to handle
    }
  },

  getScholarshipCategories: async (includeChildren = false) => {
    try {
      const response = await api.get(`/scholarship-categories?include_children=${includeChildren}`);
      
      // Handle different possible response structures
      if (response.data) {
        return response.data;
      } else if (response.categories) {
        return response;
      } else {
        // If response is an array, wrap it in the expected structure
        return {
          categories: Array.isArray(response) ? response : []
        };
      }
    } catch (error) {
      console.error('Error in getScholarshipCategories:', error);
      // Return empty result structure on error
      return {
        categories: []
      };
    }
  },

  // External admin scholarship management
  getExternalScholarships: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      console.log('Fetching external scholarships with params:', params);
      const response = await api.get(`/external-scholarships?${queryParams.toString()}`);
      console.log('External scholarships raw response:', response);
      console.log('External scholarships response.data:', response.data);
      
      // Return the data directly - api.get already extracts response.data
      return response.data || response;
    } catch (error) {
      console.error('Error in getExternalScholarships:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  getExternalScholarshipById: async (id) => {
    try {
      const response = await api.get(`/scholarships/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching scholarship by ID:', error);
      throw error;
    }
  },

  getExternalScholarshipStats: async () => {
    const response = await api.get('/external-scholarships/stats');
    return response.data;
  },

  createScholarship: async (scholarshipData) => {
    const response = await api.post('/scholarships', scholarshipData);
    return response.data;
  },

  updateScholarship: async (id, scholarshipData) => {
    const response = await api.put(`/scholarships/${id}`, scholarshipData);
    return response.data;
  },

  deleteScholarship: async (id) => {
    const response = await api.delete(`/scholarships/${id}`);
    return response.data;
  },

  bulkImportScholarships: async (scholarshipsData) => {
    const response = await api.post('/external-scholarships/bulk-import', { scholarships: scholarshipsData });
    return response.data;
  },

  // Bookmark functionality
  bookmarkScholarship: async (id) => {
    const response = await api.post(`/scholarships/${id}/bookmark`);
    return response.data;
  },

  removeBookmark: async (id) => {
    const response = await api.delete(`/scholarships/${id}/bookmark`);
    return response.data;
  },

  getMyBookmarkedScholarships: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await api.get(`/my-bookmarked-scholarships?${queryParams.toString()}`);
    return response.data;
  },

  // Application tracking
  trackApplicationClick: async (scholarshipId) => {
    try {
      const response = await api.post(`/scholarships/${scholarshipId}/track-application`);
      return response.data;
    } catch (error) {
      console.warn('Failed to track application click:', error);
      // Don't throw error as this is not critical for user experience
      return null;
    }
  },

  applyToScholarship: async (scholarshipId, applicationData = {}) => {
    try {
      const response = await api.post(`/scholarships/${scholarshipId}/apply`, applicationData);
      return response.data;
    } catch (error) {
      console.error('Error applying to scholarship:', error);
      throw error;
    }
  },

  // Filter options helpers
  getScholarshipTypes: () => [
    { value: 'merit-based', label: 'Merit-Based' },
    { value: 'need-based', label: 'Need-Based' },
    { value: 'sports', label: 'Sports & Athletics' },
    { value: 'academic', label: 'Academic Excellence' },
    { value: 'research', label: 'Research' }
  ],

  getStudyLevels: () => [
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'postgraduate', label: 'Postgraduate' },
    { value: 'phd', label: 'PhD' },
    { value: 'vocational', label: 'Vocational' }
  ],

  getFundingTypes: () => [
    { value: 'full', label: 'Full Funding' },
    { value: 'partial', label: 'Partial Funding' },
    { value: 'tuition-only', label: 'Tuition Only' },
    { value: 'living-expenses', label: 'Living Expenses' }
  ],

  getLocationTypes: () => [
    { value: 'any', label: 'Any Location' },
    { value: 'specific-country', label: 'Specific Country' },
    { value: 'specific-city', label: 'Specific City' }
  ],

  getGenderRequirements: () => [
    { value: 'any', label: 'Any Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ],

  getApplicationTypes: () => [
    { value: 'external', label: 'External Website' },
    { value: 'email', label: 'Email Application' },
    { value: 'internal', label: 'Internal System' }
  ],

  // Validation helpers
  validateScholarshipData: (data) => {
    const errors = {};

    if (!data.title?.trim()) {
      errors.title = 'Title is required';
    }

    if (!data.description?.trim()) {
      errors.description = 'Description is required';
    }

    if (!data.external_organization_name?.trim()) {
      errors.external_organization_name = 'Organization name is required';
    }

    if (!data.scholarship_type) {
      errors.scholarship_type = 'Scholarship type is required';
    }

    if (!data.category_id) {
      errors.category_id = 'Category is required';
    }

    if (!data.application_deadline) {
      errors.application_deadline = 'Application deadline is required';
    } else {
      const deadline = new Date(data.application_deadline);
      const now = new Date();
      if (deadline <= now) {
        errors.application_deadline = 'Application deadline must be in the future';
      }
    }

    if (data.amount_min && data.amount_max && data.amount_min > data.amount_max) {
      errors.amount_max = 'Maximum amount must be greater than minimum amount';
    }

    if (data.min_gpa && (data.min_gpa < 0 || data.min_gpa > 4.0)) {
      errors.min_gpa = 'GPA must be between 0 and 4.0';
    }

    if (data.max_age && data.max_age < 16) {
      errors.max_age = 'Maximum age must be at least 16';
    }

    if (data.duration_years && data.duration_years < 1) {
      errors.duration_years = 'Duration must be at least 1 year';
    }

    if (data.num_recommendation_letters && data.num_recommendation_letters < 0) {
      errors.num_recommendation_letters = 'Number of recommendation letters cannot be negative';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Formatting helpers
  formatScholarshipAmount: (scholarship) => {
    if (!scholarship.funding?.min && !scholarship.funding?.max) {
      return 'Amount not disclosed';
    }

    const currency = scholarship.funding?.currency || 'USD';
    const currencySymbol = { USD: '$', EUR: '€', GBP: '£' }[currency] || currency;

    if (scholarship.funding?.min && scholarship.funding?.max) {
      return `${currencySymbol}${scholarship.funding.min.toLocaleString()} - ${currencySymbol}${scholarship.funding.max.toLocaleString()}`;
    } else if (scholarship.funding?.min) {
      return `${currencySymbol}${scholarship.funding.min.toLocaleString()}+`;
    } else if (scholarship.funding?.max) {
      return `Up to ${currencySymbol}${scholarship.funding.max.toLocaleString()}`;
    }

    return 'Amount not disclosed';
  },

  formatDeadline: (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays} days left`;
    } else if (diffDays <= 30) {
      return `${Math.ceil(diffDays / 7)} weeks left`;
    } else {
      return date.toLocaleDateString();
    }
  },

  getScholarshipStatus: (scholarship) => {
    if (!scholarship.is_active) return 'inactive';
    if (scholarship.is_expired) return 'expired';
    if (scholarship.status === 'published') return 'active';
    return scholarship.status;
  },

  getScholarshipStatusColor: (status) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      published: 'text-green-600 bg-green-100',
      draft: 'text-gray-600 bg-gray-100',
      expired: 'text-red-600 bg-red-100',
      inactive: 'text-gray-600 bg-gray-100',
      paused: 'text-yellow-600 bg-yellow-100',
      closed: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  },

  getUrgencyLevel: (daysLeft) => {
    if (daysLeft <= 7) return 'urgent';
    if (daysLeft <= 30) return 'moderate';
    return 'normal';
  },

  getUrgencyColor: (urgencyLevel) => {
    const colors = {
      urgent: 'text-red-600 bg-red-100',
      moderate: 'text-yellow-600 bg-yellow-100',
      normal: 'text-blue-600 bg-blue-100'
    };
    return colors[urgencyLevel] || 'text-blue-600 bg-blue-100';
  }
};

export default scholarshipService;
