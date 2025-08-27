// User roles
export const USER_ROLES = {
  JOB_SEEKER: 'job_seeker',
  EMPLOYER: 'employer',
  ADMIN: 'admin'
};

// Application statuses
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEWED: 'interviewed',
  OFFERED: 'offered',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

// Job types
export const JOB_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  FREELANCE: 'freelance',
  INTERNSHIP: 'internship',
  TEMPORARY: 'temporary'
};

// Experience levels
export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  EXECUTIVE: 'executive'
};

// Education levels
export const EDUCATION_LEVELS = {
  HIGH_SCHOOL: 'high_school',
  ASSOCIATE: 'associate',
  BACHELOR: 'bachelor',
  MASTER: 'master',
  DOCTORATE: 'doctorate',
  PROFESSIONAL: 'professional'
};

// Job categories
export const JOB_CATEGORIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing',
  'Sales',
  'Human Resources',
  'Operations',
  'Customer Service',
  'Design',
  'Engineering',
  'Legal',
  'Consulting',
  'Manufacturing',
  'Retail',
  'Other'
];

// Salary ranges
export const SALARY_RANGES = [
  { label: 'Under $30,000', min: 0, max: 30000 },
  { label: '$30,000 - $50,000', min: 30000, max: 50000 },
  { label: '$50,000 - $75,000', min: 50000, max: 75000 },
  { label: '$75,000 - $100,000', min: 75000, max: 100000 },
  { label: '$100,000 - $150,000', min: 100000, max: 150000 },
  { label: '$150,000 - $200,000', min: 150000, max: 200000 },
  { label: 'Over $200,000', min: 200000, max: null }
];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_TOKEN: '/auth/verify-token',
    REFRESH_TOKEN: '/auth/refresh-token'
  },
  JOBS: {
    LIST: '/jobs',
    DETAIL: '/jobs/:id',
    CREATE: '/jobs',
    UPDATE: '/jobs/:id',
    DELETE: '/jobs/:id',
    CATEGORIES: '/job-categories',
    BOOKMARK: '/jobs/:id/bookmark',
    SEARCH: '/jobs/search',
    FEATURED: '/jobs/featured',
    RECENT: '/jobs/recent'
  },
  APPLICATIONS: {
    APPLY: '/jobs/:id/apply',
    DETAIL: '/applications/:id',
    UPDATE_STATUS: '/applications/:id/status',
    MY_APPLICATIONS: '/my-applications',
    JOB_APPLICATIONS: '/jobs/:id/applications'
  }
};

// Form validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
  },
  PHONE: /^[\+]?[1-9][\d]{0,15}$/
};

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 16 * 1024 * 1024, // 16MB
  ALLOWED_TYPES: {
    RESUME: ['.pdf', '.doc', '.docx'],
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif'],
    DOCUMENT: ['.pdf', '.doc', '.docx', '.txt']
  }
};

// Theme colors (matching design document)
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  SUCCESS: {
    500: '#10b981',
    600: '#059669'
  },
  WARNING: {
    500: '#f59e0b',
    600: '#d97706'
  },
  ERROR: {
    500: '#ef4444',
    600: '#dc2626'
  },
  INFO: {
    500: '#8b5cf6',
    600: '#7c3aed'
  }
};

