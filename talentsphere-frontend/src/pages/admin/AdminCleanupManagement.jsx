import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Briefcase,
  GraduationCap,
  Activity,
  Clock,
  TrendingDown,
  PlayCircle,
  Database
} from 'lucide-react';
import {
  getCleanupStats,
  runCleanup,
  cleanupJobs,
  cleanupScholarships,
  getServiceStatus,
  getHealthStatus
} from '../../services/cleanup';

const AdminCleanupManagement = () => {
  const [stats, setStats] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lastCleanup, setLastCleanup] = useState(null);

  useEffect(() => {
    fetchAllData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsData, serviceData, healthData] = await Promise.all([
        getCleanupStats(),
        getServiceStatus(),
        getHealthStatus()
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (serviceData.success) {
        setServiceStatus(serviceData.data);
      }

      setHealthStatus(healthData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', 'Failed to load cleanup data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleRunFullCleanup = async () => {
    if (!window.confirm('Are you sure you want to run a full cleanup? This will delete all expired external jobs and scholarships.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await runCleanup();
      if (response.success) {
        setLastCleanup(response.data);
        showMessage('success', `Cleanup completed: ${response.data.total_deleted} items deleted`);
        fetchAllData(); // Refresh data
      }
    } catch (error) {
      showMessage('error', 'Failed to run cleanup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCleanupJobs = async () => {
    if (!window.confirm('Are you sure you want to cleanup expired external jobs?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await cleanupJobs();
      if (response.success) {
        showMessage('success', `Jobs cleanup completed: ${response.data.deleted_count} jobs deleted`);
        fetchAllData();
      }
    } catch (error) {
      showMessage('error', 'Failed to cleanup jobs');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCleanupScholarships = async () => {
    if (!window.confirm('Are you sure you want to cleanup expired external scholarships?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await cleanupScholarships();
      if (response.success) {
        showMessage('success', `Scholarships cleanup completed: ${response.data.deleted_count} scholarships deleted`);
        fetchAllData();
      }
    } catch (error) {
      showMessage('error', 'Failed to cleanup scholarships');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Trash2 className="text-indigo-600" size={32} />
          Cleanup Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage automatic cleanup of expired external opportunities
        </p>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Service Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Service Status</h3>
            <Activity className={serviceStatus?.is_running ? 'text-green-500' : 'text-red-500'} size={24} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${serviceStatus?.is_running ? 'text-green-600' : 'text-red-600'}`}>
                {serviceStatus?.is_running ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Check Interval:</span>
              <span className="font-semibold text-gray-900">
                {serviceStatus?.check_interval_hours || 12} hours
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Grace Period:</span>
              <span className="font-semibold text-gray-900">
                {serviceStatus?.grace_period_days || 1} day(s)
              </span>
            </div>
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Health Check</h3>
            <CheckCircle className={healthStatus?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'} size={24} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${
                healthStatus?.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {healthStatus?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Check:</span>
              <span className="font-semibold text-gray-900 text-sm">
                {formatDate(healthStatus?.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Last Cleanup */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Last Cleanup</h3>
            <Clock className="text-indigo-500" size={24} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Jobs Deleted:</span>
              <span className="font-semibold text-gray-900">
                {lastCleanup?.jobs_deleted || serviceStatus?.last_cleanup_jobs || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Scholarships:</span>
              <span className="font-semibold text-gray-900">
                {lastCleanup?.scholarships_deleted || serviceStatus?.last_cleanup_scholarships || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-semibold text-gray-900 text-sm">
                {formatDate(serviceStatus?.last_cleanup)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Jobs Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="text-blue-600" size={24} />
                External Jobs
              </h3>
              <TrendingDown className="text-gray-400" size={20} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Total External:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.jobs.total_external}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                <span className="text-gray-600">Eligible for Deletion:</span>
                <span className="text-2xl font-bold text-red-600">
                  {stats.jobs.eligible_for_deletion}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-gray-600">Active:</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.jobs.active}
                </span>
              </div>
            </div>
          </div>

          {/* Scholarships Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GraduationCap className="text-purple-600" size={24} />
                External Scholarships
              </h3>
              <TrendingDown className="text-gray-400" size={20} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Total External:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.scholarships.total_external}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                <span className="text-gray-600">Eligible for Deletion:</span>
                <span className="text-2xl font-bold text-red-600">
                  {stats.scholarships.eligible_for_deletion}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-gray-600">Active:</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.scholarships.active}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Info */}
      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Cleanup Information</h4>
              <div className="space-y-1 text-blue-800 text-sm">
                <p>• Grace Period: <strong>{stats.grace_period_days} day(s)</strong> after deadline</p>
                <p>• Cutoff Date: <strong>{formatDate(stats.cutoff_date)}</strong></p>
                <p>• Total Eligible: <strong>{stats.total_eligible_for_deletion}</strong> items</p>
                <p>• Items with deadlines before the cutoff date will be deleted</p>
                <p>• Related records (applications, bookmarks) are automatically removed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PlayCircle className="text-indigo-600" size={24} />
          Manual Cleanup Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Run Full Cleanup */}
          <button
            onClick={handleRunFullCleanup}
            disabled={actionLoading || !stats?.total_eligible_for_deletion}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-colors ${
              actionLoading || !stats?.total_eligible_for_deletion
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {actionLoading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Database size={20} />
                Run Full Cleanup
                {stats?.total_eligible_for_deletion > 0 && (
                  <span className="bg-white text-indigo-600 px-2 py-1 rounded-full text-xs">
                    {stats.total_eligible_for_deletion}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Cleanup Jobs */}
          <button
            onClick={handleCleanupJobs}
            disabled={actionLoading || !stats?.jobs.eligible_for_deletion}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-colors ${
              actionLoading || !stats?.jobs.eligible_for_deletion
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {actionLoading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Briefcase size={20} />
                Cleanup Jobs Only
                {stats?.jobs.eligible_for_deletion > 0 && (
                  <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-xs">
                    {stats.jobs.eligible_for_deletion}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Cleanup Scholarships */}
          <button
            onClick={handleCleanupScholarships}
            disabled={actionLoading || !stats?.scholarships.eligible_for_deletion}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-colors ${
              actionLoading || !stats?.scholarships.eligible_for_deletion
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {actionLoading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <GraduationCap size={20} />
                Cleanup Scholarships
                {stats?.scholarships.eligible_for_deletion > 0 && (
                  <span className="bg-white text-purple-600 px-2 py-1 rounded-full text-xs">
                    {stats.scholarships.eligible_for_deletion}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* Refresh Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
          <div className="text-yellow-800 text-sm">
            <strong>Warning:</strong> Cleanup actions are permanent and cannot be undone. All deleted items and their related records (applications, bookmarks) will be permanently removed from the database.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCleanupManagement;
