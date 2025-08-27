import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Copy,
  Play,
  Pause,
  Star,
  Trash2,
  BarChart3,
  Target,
  Settings,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  ExternalLink,
  Share2,
  Archive,
  BookOpen
} from 'lucide-react';
import JobManagement from './JobManagement';
import JobViewModal from './JobViewModal';
import JobEditModal from './JobEditModal';
import useJobManagement from '../../hooks/useJobManagement';
import { setupDevAuth, isDevAuthActive } from '../../utils/devAuth';

const JobManagementContainer = () => {
  // Set up development authentication if not already active
  useEffect(() => {
    if (!isDevAuthActive()) {
      setupDevAuth();
      console.log('🔧 Auto-setup development authentication for testing');
    }
  }, []);

  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const {
    // Data
    jobs,
    selectedJobs,
    jobStats,
    
    // States
    loading,
    error,
    lastFetch,
    filters,
    pagination,
    
    // Handlers
    handleFilterChange,
    handlePageChange,
    handlePerPageChange,
    setSelectedJobs,
    
    // Job actions
    handleCreateJob,
    handleEditJob,
    handleViewJob,
    handleDuplicateJob,
    handleToggleJobStatus,
    handleDeleteJob,
    handlePromoteJob,
    handleBulkActions,
    handleExportJobs,
    handleRefresh,
    
    // Utilities
    setError,
    clearSelection
  } = useJobManagement();

  // Enhanced action handlers with loading states
  const handleActionWithLoading = async (actionId, actionFn, ...args) => {
    setActionLoading(prev => ({ ...prev, [actionId]: true }));
    try {
      await actionFn(...args);
    } catch (error) {
      console.error(`Action ${actionId} failed:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionId]: false }));
    }
  };

  // Enhanced bulk actions with confirmation
  const handleBulkAction = async (action) => {
    if (selectedJobs.length === 0) {
      alert('Please select jobs first');
      return;
    }

    const actionMessages = {
      publish: `Are you sure you want to publish ${selectedJobs.length} job(s)? This will make them visible to candidates.`,
      pause: `Are you sure you want to pause ${selectedJobs.length} job(s)? They will no longer be visible to candidates.`,
      archive: `Are you sure you want to archive ${selectedJobs.length} job(s)? This action can be reversed later.`,
      delete: `Are you sure you want to permanently delete ${selectedJobs.length} job(s)? This action cannot be undone.`,
      duplicate: `Create copies of ${selectedJobs.length} selected job(s)?`,
      feature: `Promote ${selectedJobs.length} job(s) to featured status? This may incur additional charges.`
    };

    if (window.confirm(actionMessages[action])) {
      await handleActionWithLoading(`bulk-${action}`, handleBulkActions, action);
      setShowBulkActions(false);
    }
  };

  // Enhanced export with options
  const handleExportWithOptions = async (format = 'csv') => {
    const exportOptions = {
      csv: { name: 'CSV Export', extension: 'csv' },
      excel: { name: 'Excel Export', extension: 'xlsx' },
      pdf: { name: 'PDF Report', extension: 'pdf' }
    };

    await handleActionWithLoading('export', handleExportJobs, format);
    setShowExportModal(false);
  };

  // Enhanced job creation with templates
  const handleCreateJobWithTemplate = (template = null) => {
    setSelectedJobId(null); // For new job
    setEditModalOpen(true);
  };

  // Enhanced view job handler
  const handleViewJobEnhanced = (jobId) => {
    setSelectedJobId(jobId);
    setViewModalOpen(true);
  };

  // Enhanced edit job handler
  const handleEditJobEnhanced = (jobId) => {
    setSelectedJobId(jobId);
    setEditModalOpen(true);
  };

  // Modal handlers
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedJobId(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedJobId(null);
  };

  const handleJobSaved = (savedJob) => {
    // Refresh the jobs list after saving
    handleRefresh();
    console.log('Job saved:', savedJob);
  };

  const handleJobPreview = (jobData) => {
    // Could open a preview modal or navigate to preview page
    console.log('Preview job:', jobData);
  };

  // Quick actions for individual jobs
  const handleQuickAction = async (jobId, action) => {
    const actionMap = {
      view: () => handleViewJobEnhanced(jobId),
      edit: () => handleEditJobEnhanced(jobId),
      duplicate: () => handleActionWithLoading(`duplicate-${jobId}`, handleDuplicateJob, jobId),
      toggle: () => handleActionWithLoading(`toggle-${jobId}`, handleToggleJobStatus, jobId),
      promote: () => handleActionWithLoading(`promote-${jobId}`, handlePromoteJob, jobId),
      delete: () => {
        if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
          handleActionWithLoading(`delete-${jobId}`, handleDeleteJob, jobId);
        }
      },
      analytics: () => window.open(`/jobs/${jobId}/analytics`, '_blank'),
      share: () => {
        const shareUrl = `${window.location.origin}/jobs/${jobId}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Job URL copied to clipboard!');
      }
    };

    if (actionMap[action]) {
      await actionMap[action]();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header with Action Buttons */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="mt-2 text-gray-600">Manage and track your job postings</p>
            {lastFetch && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastFetch.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => handleActionWithLoading('refresh', handleRefresh)}
              disabled={loading.jobs || actionLoading.refresh}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading.jobs || actionLoading.refresh) ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Advanced Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(filters.search || filters.status !== 'all' || filters.employment_type !== 'all') && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              )}
            </button>

            {/* Export Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportModal(true)}
                disabled={loading.jobs || actionLoading.export}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
                {actionLoading.export && <Clock className="h-4 w-4 ml-2 animate-spin" />}
              </button>
            </div>

            {/* Bulk Actions Button */}
            {selectedJobs.length > 0 && (
              <button
                onClick={() => setShowBulkActions(true)}
                className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100"
              >
                <Settings className="h-4 w-4 mr-2" />
                Bulk Actions ({selectedJobs.length})
              </button>
            )}

            {/* Create Job Dropdown */}
            <div className="relative group">
              <button
                onClick={() => handleCreateJobWithTemplate()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading.jobs ? '...' : jobStats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-1-1v1a3 3 0 01-3 3H9a3 3 0 01-3-3v-1m1-4V6a3 3 0 013-3h2a3 3 0 013 3v3m1 4a3 3 0 01-3 3" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading.jobs ? '...' : jobStats.active}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Draft Jobs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading.jobs ? '...' : jobStats.draft}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Paused Jobs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading.jobs ? '...' : jobStats.paused}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading.jobs ? '...' : jobStats.applications}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading.jobs ? '...' : jobStats.views}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading job data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setError(null);
                    handleRefresh();
                  }}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modals */}
      
      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowBulkActions(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Bulk Actions
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Perform actions on {selectedJobs.length} selected job(s)
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 space-y-3">
                <button
                  onClick={() => handleBulkAction('publish')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  disabled={actionLoading['bulk-publish']}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {actionLoading['bulk-publish'] ? 'Publishing...' : 'Publish All'}
                </button>
                
                <button
                  onClick={() => handleBulkAction('pause')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                  disabled={actionLoading['bulk-pause']}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  {actionLoading['bulk-pause'] ? 'Pausing...' : 'Pause All'}
                </button>
                
                <button
                  onClick={() => handleBulkAction('duplicate')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  disabled={actionLoading['bulk-duplicate']}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {actionLoading['bulk-duplicate'] ? 'Duplicating...' : 'Duplicate All'}
                </button>
                
                <button
                  onClick={() => handleBulkAction('feature')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                  disabled={actionLoading['bulk-feature']}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {actionLoading['bulk-feature'] ? 'Featuring...' : 'Feature All'}
                </button>
                
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
                  disabled={actionLoading['bulk-archive']}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {actionLoading['bulk-archive'] ? 'Archiving...' : 'Archive All'}
                </button>
                
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  disabled={actionLoading['bulk-delete']}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {actionLoading['bulk-delete'] ? 'Deleting...' : 'Delete All'}
                </button>
                
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowExportModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Export Jobs
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Choose export format for your job data
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 space-y-3">
                <button
                  onClick={() => handleExportWithOptions('csv')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  disabled={actionLoading.export}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </button>
                
                <button
                  onClick={() => handleExportWithOptions('excel')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  disabled={actionLoading.export}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Export as Excel
                </button>
                
                <button
                  onClick={() => handleExportWithOptions('pdf')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  disabled={actionLoading.export}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Export as PDF Report
                </button>
                
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowFilterModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                  <Filter className="h-6 w-6 text-purple-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Advanced Filters
                  </h3>
                </div>
              </div>
              
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Search jobs..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    value={filters.employment_type}
                    onChange={(e) => handleFilterChange('employment_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={filters.date_range}
                    onChange={(e) => handleFilterChange('date_range', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 3 months</option>
                    <option value="365">Last year</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="title">Title</option>
                    <option value="application_count">Applications</option>
                    <option value="view_count">Views</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                  <select
                    value={filters.sort_order}
                    onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    // Reset filters
                    handleFilterChange('search', '');
                    handleFilterChange('status', 'all');
                    handleFilterChange('employment_type', 'all');
                    handleFilterChange('date_range', 'all');
                    handleFilterChange('sort_by', 'created_at');
                    handleFilterChange('sort_order', 'desc');
                    setShowFilterModal(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Job Management Component */}
      <JobManagement
        jobs={jobs}
        loading={loading.jobs}
        error={error}
        selectedJobs={selectedJobs}
        setSelectedJobs={setSelectedJobs}
        filters={filters}
        onFilterChange={handleFilterChange}
        pagination={pagination}
        onPageChange={handlePageChange}
        onCreateJob={() => handleCreateJobWithTemplate()}
        onEditJob={(jobId) => handleQuickAction(jobId, 'edit')}
        onViewJob={(jobId) => handleQuickAction(jobId, 'view')}
        onDuplicateJob={(jobId) => handleQuickAction(jobId, 'duplicate')}
        onToggleJobStatus={(jobId) => handleQuickAction(jobId, 'toggle')}
        onDeleteJob={(jobId) => handleQuickAction(jobId, 'delete')}
        onPromoteJob={(jobId) => handleQuickAction(jobId, 'promote')}
        onBulkActions={handleBulkActions}
        onExportJobs={handleExportJobs}
        onQuickAction={handleQuickAction}
        actionLoading={actionLoading}
      />

      {/* Enhanced View Modal */}
      <JobViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        jobId={selectedJobId}
        onEdit={handleEditJobEnhanced}
        onToggleStatus={handleToggleJobStatus}
        onDuplicate={handleDuplicateJob}
        onPromote={handlePromoteJob}
      />

      {/* Enhanced Edit Modal */}
      <JobEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        jobId={selectedJobId}
        onSave={handleJobSaved}
        onPreview={handleJobPreview}
      />
    </div>
  );
};

export default JobManagementContainer;
