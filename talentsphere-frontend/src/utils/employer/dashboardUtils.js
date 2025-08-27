// Utility functions for employer dashboard

// Date formatting
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  
  return date.toLocaleDateString();
};

// Status color mapping
export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-500',
    published: 'bg-green-500',
    inactive: 'bg-gray-500',
    paused: 'bg-yellow-500',
    closed: 'bg-red-500',
    draft: 'bg-blue-500',
    submitted: 'bg-blue-500',
    under_review: 'bg-yellow-500',
    shortlisted: 'bg-purple-500',
    interviewed: 'bg-indigo-500',
    hired: 'bg-green-500',
    rejected: 'bg-red-500',
    pending: 'bg-orange-500'
  };
  return colors[status?.toLowerCase()] || 'bg-gray-500';
};

// Status icon mapping
export const getStatusIcon = (status) => {
  // This would return appropriate icon components based on status
  // For now, returning null as icons are handled in components
  return null;
};

// Salary formatting
export const formatSalary = (job) => {
  if (!job) return 'Not specified';
  
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
  }
  
  if (job.salary_range) {
    return job.salary_range;
  }
  
  return 'Not specified';
};

// Calculate conversion rate
export const calculateConversionRate = (views, applications) => {
  if (!views || views === 0) return 0;
  return Math.round((applications / views) * 100);
};

// Calculate match score color
export const getMatchScoreColor = (score) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

// Format time duration
export const formatDuration = (hours) => {
  if (!hours) return '0 hours';
  
  if (hours < 24) {
    return `${hours} hours`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return `${days} days`;
  }
  
  return `${days} days ${remainingHours} hours`;
};

// Generate insights based on data
export const generateInsights = (data) => {
  const insights = [];
  
  if (data.stats?.totalJobs === 0) {
    insights.push({
      type: 'info',
      title: 'Get Started',
      description: 'Post your first job to start attracting candidates.',
      action: 'Create Job'
    });
  }
  
  if (data.stats?.newApplications > 10) {
    insights.push({
      type: 'success',
      title: 'High Interest',
      description: `You have ${data.stats.newApplications} new applications waiting for review.`,
      action: 'Review Applications'
    });
  }
  
  if (data.stats?.pendingReviews > 5) {
    insights.push({
      type: 'warning',
      title: 'Pending Reviews',
      description: 'You have several applications pending review. Quick responses improve candidate experience.',
      action: 'Review Now'
    });
  }
  
  return insights;
};

// Filter jobs based on criteria
export const filterJobs = (jobs, filters) => {
  return jobs.filter(job => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        job.title?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.location?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && job.status !== filters.status) {
      return false;
    }
    
    // Employment type filter
    if (filters.employment_type !== 'all' && job.employment_type !== filters.employment_type) {
      return false;
    }
    
    // Date range filter
    if (filters.date_range !== 'all') {
      const jobDate = new Date(job.created_at);
      const now = new Date();
      const daysAgo = parseInt(filters.date_range);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      if (jobDate < cutoffDate) return false;
    }
    
    return true;
  });
};

// Sort jobs
export const sortJobs = (jobs, sortBy, sortOrder = 'desc') => {
  return [...jobs].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    // Handle different data types
    if (sortBy === 'created_at') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

// Export data to CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Validate job data
export const validateJobData = (jobData) => {
  const errors = {};
  
  if (!jobData.title?.trim()) {
    errors.title = 'Job title is required';
  }
  
  if (!jobData.description?.trim()) {
    errors.description = 'Job description is required';
  }
  
  if (!jobData.employment_type) {
    errors.employment_type = 'Employment type is required';
  }
  
  if (jobData.salary_min && jobData.salary_max && jobData.salary_min > jobData.salary_max) {
    errors.salary = 'Minimum salary cannot be greater than maximum salary';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Calculate hiring metrics
export const calculateHiringMetrics = (applications) => {
  const total = applications.length;
  const stages = {
    submitted: applications.filter(app => app.status === 'submitted').length,
    under_review: applications.filter(app => app.status === 'under_review').length,
    shortlisted: applications.filter(app => app.status === 'shortlisted').length,
    interviewed: applications.filter(app => app.status === 'interviewed').length,
    hired: applications.filter(app => app.status === 'hired').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };
  
  return {
    total,
    stages,
    conversionRates: {
      reviewRate: total > 0 ? Math.round((stages.under_review / total) * 100) : 0,
      shortlistRate: total > 0 ? Math.round((stages.shortlisted / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((stages.interviewed / total) * 100) : 0,
      hireRate: total > 0 ? Math.round((stages.hired / total) * 100) : 0
    }
  };
};
