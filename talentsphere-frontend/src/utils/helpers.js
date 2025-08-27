import { VALIDATION_RULES } from './constants';

// Format currency
export const formatCurrency = (amount, abbreviated = false, currency = 'USD') => {
  if (!amount) return 'Not specified';
  
  if (abbreviated && amount >= 1000) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
};

// Validate email
export const validateEmail = (email) => {
  return VALIDATION_RULES.EMAIL.test(email);
};

// Validate password
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters long`);
  }
  
  if (!VALIDATION_RULES.PASSWORD.PATTERN.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate phone number
export const validatePhone = (phone) => {
  return VALIDATION_RULES.PHONE.test(phone);
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Convert snake_case to Title Case
export const snakeToTitle = (str) => {
  if (!str) return '';
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

// Generate initials from name
export const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Check if file type is allowed
export const isFileTypeAllowed = (file, allowedTypes) => {
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  return allowedTypes.includes(fileExtension);
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get status color
export const getStatusColor = (status) => {
  const statusColors = {
    pending: 'yellow',
    reviewed: 'blue',
    shortlisted: 'purple',
    interviewed: 'indigo',
    offered: 'green',
    hired: 'green',
    rejected: 'red',
    withdrawn: 'gray',
    active: 'green',
    inactive: 'gray',
    draft: 'yellow',
    published: 'green',
    expired: 'red'
  };
  
  return statusColors[status] || 'gray';
};

// Parse query string
export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
};

// Build query string
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  return searchParams.toString();
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Merge objects
export const mergeObjects = (...objects) => {
  return Object.assign({}, ...objects);
};

// Format large numbers
export const formatNumber = (num) => {
  if (!num) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return num.toString();
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (!value) return '0%';
  return `${value.toFixed(decimals)}%`;
};

// Get color by value
export const getColorByValue = (value, thresholds = { good: 80, warning: 60 }) => {
  if (value >= thresholds.good) return 'green';
  if (value >= thresholds.warning) return 'yellow';
  return 'red';
};

