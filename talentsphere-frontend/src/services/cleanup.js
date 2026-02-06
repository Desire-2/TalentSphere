import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Get cleanup statistics
export const getCleanupStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/cleanup/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cleanup stats:', error);
    throw error;
  }
};

// Run full cleanup
export const runCleanup = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/cleanup/run`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error running cleanup:', error);
    throw error;
  }
};

// Cleanup jobs only
export const cleanupJobs = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/cleanup/jobs`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error cleaning up jobs:', error);
    throw error;
  }
};

// Cleanup scholarships only
export const cleanupScholarships = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/cleanup/scholarships`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error cleaning up scholarships:', error);
    throw error;
  }
};

// Get service status
export const getServiceStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/cleanup/service/status`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching service status:', error);
    throw error;
  }
};

// Get health status
export const getHealthStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/cleanup/health`);
    return response.data;
  } catch (error) {
    console.error('Error fetching health status:', error);
    throw error;
  }
};
