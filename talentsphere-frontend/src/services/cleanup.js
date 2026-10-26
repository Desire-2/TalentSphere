import api from './api';

// Get cleanup statistics
export const getCleanupStats = async () => {
  try {
    return await api.get('/cleanup/stats');
  } catch (error) {
    console.error('Error fetching cleanup stats:', error);
    throw error;
  }
};

// Run full cleanup
export const runCleanup = async () => {
  try {
    return await api.post('/cleanup/run', {});
  } catch (error) {
    console.error('Error running cleanup:', error);
    throw error;
  }
};

// Cleanup jobs only
export const cleanupJobs = async () => {
  try {
    return await api.post('/cleanup/jobs', {});
  } catch (error) {
    console.error('Error cleaning up jobs:', error);
    throw error;
  }
};

// Cleanup scholarships only
export const cleanupScholarships = async () => {
  try {
    return await api.post('/cleanup/scholarships', {});
  } catch (error) {
    console.error('Error cleaning up scholarships:', error);
    throw error;
  }
};

// Get service status
export const getServiceStatus = async () => {
  try {
    return await api.get('/cleanup/service/status');
  } catch (error) {
    console.error('Error fetching service status:', error);
    throw error;
  }
};

// Get health status
export const getHealthStatus = async () => {
  try {
    return await api.get('/cleanup/health');
  } catch (error) {
    console.error('Error fetching health status:', error);
    throw error;
  }
};
