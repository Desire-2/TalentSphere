import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity,
  Briefcase,
  FileText,
  Target,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useEmployerDashboard } from '../hooks/employer/useEmployerDashboard';
import { exportToCSV } from '../utils/employer/dashboardUtils';
import apiService from '../services/api';

// Import the new components
import DashboardOverview from '../components/employer/DashboardOverview';
import JobManagementContainer from '../components/employer/JobManagementContainer';
import ApplicationManagement from '../components/employer/ApplicationManagement';
import AnalyticsDashboard from '../components/employer/AnalyticsDashboard';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use the custom hook for all dashboard data and operations
  const {
    // Data
    dashboardData,
    jobs,
    applications,
    candidates,
    analyticsData,
    
    // States
    loading,
    errors,
    selectedJobs,
    jobFilters,
    applicationFilters,
    candidateFilters,
    candidateSearchMode,
    analyticsDateRange,
    
    // Pagination
    jobPagination,
    applicationPagination,
    candidatePagination,
    
    // Actions
    setSelectedJobs,
    setCandidateSearchMode,
    setAnalyticsDateRange,
    setCandidateFilters,
    
    // Handlers
    handleJobFilterChange,
    handleApplicationFilterChange,
    handleJobPageChange,
    handleApplicationPageChange,
    handleCandidatePageChange,
    
    // Load functions
    loadDashboardData,
    loadJobs,
    loadApplications,
    loadCandidates,
    loadAnalytics
  } = useEmployerDashboard();

  // Navigation handlers
  const handleCreateJob = () => {
    navigate('/employer/jobs/create');
  };

  const handleViewJob = (jobId) => {
    navigate(`/employer/jobs/${jobId}`);
  };

  const handleEditJob = (jobId) => {
    navigate(`/employer/jobs/${jobId}/edit`);
  };

  const handleViewAllJobs = () => {
    setActiveTab('jobs');
  };

  const handleViewAllApplications = () => {
    setActiveTab('applications');
  };

  const handleReviewApplication = (applicationId) => {
    navigate(`/employer/applications/${applicationId}`);
  };

  // Job management actions
  const handleDuplicateJob = async (jobId) => {
    try {
      const response = await apiService.post(`/employer/jobs/${jobId}/duplicate`);
      if (response.success) {
        loadJobs();
        console.log('Job duplicated successfully');
      }
    } catch (error) {
      console.error('Error duplicating job:', error);
    }
  };

  const handleToggleJobStatus = async (jobId) => {
    try {
      const response = await apiService.patch(`/employer/jobs/${jobId}/toggle-status`);
      if (response.success) {
        loadJobs();
        console.log('Job status updated successfully');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        const response = await apiService.delete(`/employer/jobs/${jobId}`);
        if (response.success) {
          loadJobs();
          console.log('Job deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const handlePromoteJob = async (jobId) => {
    try {
      const response = await apiService.post(`/employer/jobs/${jobId}/feature`);
      if (response.success) {
        loadJobs();
        console.log('Job promoted successfully');
      }
    } catch (error) {
      console.error('Error promoting job:', error);
    }
  };

  const handleBulkJobActions = () => {
    console.log('Bulk job actions for:', selectedJobs);
    // Implement bulk actions modal or dropdown
  };

  const handleExportJobs = () => {
    exportToCSV(jobs, `jobs_export_${new Date().toISOString().split('T')[0]}`);
  };

  // Application management actions
  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      const response = await apiService.patch(`/employer/applications/${applicationId}`, {
        status
      });
      if (response.success) {
        loadApplications();
        console.log('Application status updated successfully');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleScheduleInterview = (applicationId) => {
    navigate(`/employer/applications/${applicationId}/interview`);
  };

  const handleSendMessage = (applicationId) => {
    navigate(`/employer/applications/${applicationId}/message`);
  };

  const handleBulkApplicationAction = async (action) => {
    const selectedApplications = applications.filter(app => app.selected);
    console.log('Bulk application action:', action, selectedApplications);
    // Implement bulk application actions
  };

  const handleExportApplications = () => {
    exportToCSV(applications, `applications_export_${new Date().toISOString().split('T')[0]}`);
  };

  // Analytics actions
  const handleExportAnalytics = () => {
    const analyticsExport = {
      metrics: analyticsData,
      generated_at: new Date().toISOString(),
      date_range: analyticsDateRange
    };
    
    const blob = new Blob([JSON.stringify(analyticsExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your jobs, review applications, and track hiring performance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="w-4 h-4 mr-2" />
            My Jobs ({dashboardData.stats.totalJobs})
          </TabsTrigger>
          <TabsTrigger value="applications">
            <FileText className="w-4 h-4 mr-2" />
            Applications ({dashboardData.stats.newApplications})
          </TabsTrigger>
          <TabsTrigger value="candidates">
            <Target className="w-4 h-4 mr-2" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardOverview
            dashboardData={dashboardData}
            loading={loading}
            onCreateJob={handleCreateJob}
            onViewAllJobs={handleViewAllJobs}
            onViewAllApplications={handleViewAllApplications}
            onReviewApplication={handleReviewApplication}
            onViewJob={handleViewJob}
          />
        </TabsContent>

        <TabsContent value="jobs">
          <JobManagementContainer />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationManagement
            applications={applications}
            jobs={jobs}
            loading={loading.applications}
            error={errors.applications}
            filters={applicationFilters}
            onFilterChange={handleApplicationFilterChange}
            pagination={applicationPagination}
            onPageChange={handleApplicationPageChange}
            onRefresh={loadApplications}
            onExport={handleExportApplications}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onScheduleInterview={handleScheduleInterview}
            onSendMessage={handleSendMessage}
            onReviewApplication={handleReviewApplication}
            onBulkAction={handleBulkApplicationAction}
          />
        </TabsContent>

        <TabsContent value="candidates">
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Candidate Management</h3>
            <p className="text-gray-600">This section will contain candidate search and management features.</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard
            analyticsData={analyticsData}
            dateRange={analyticsDateRange}
            onDateRangeChange={setAnalyticsDateRange}
            onExport={handleExportAnalytics}
            loading={loading.analytics}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployerDashboard;
