import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Activity,
  Briefcase,
  FileText,
  Target,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useEmployerDashboard } from '../hooks/employer/useEmployerDashboard';

// Import the new components
import DashboardOverview from '../components/employer/DashboardOverview';
import JobManagementContainer from '../components/employer/JobManagementContainer';
import ApplicationManagement from '../components/employer/ApplicationManagement';
import AnalyticsDashboard from '../components/employer/AnalyticsDashboard';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const normalizeTab = (tab) => {
    const allowedTabs = ['overview', 'jobs', 'applications', 'candidates', 'analytics'];
    return allowedTabs.includes(tab) ? tab : 'overview';
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(searchParams.get('tab')));

  useEffect(() => {
    const nextTab = normalizeTab(searchParams.get('tab'));
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (nextTab) => {
    const normalized = normalizeTab(nextTab);
    setActiveTab(normalized);

    if (normalized === 'overview') {
      const params = new URLSearchParams(searchParams);
      params.delete('tab');
      setSearchParams(params, { replace: true });
      return;
    }

    setSearchParams({ tab: normalized }, { replace: true });
  };
  
  // Use the custom hook for all dashboard data and operations
  const {
    // Data
    dashboardData,
    candidates,
    analyticsData,
    
    // States
    loading,
    errors,
    candidateFilters,
    
    // Pagination
    candidatePagination,
    
    // Actions
    setCandidateFilters,
    setCandidateSearchMode,
    
    // Handlers
    handleCandidatePageChange,
    
    // Load functions
    loadDashboardData,
  } = useEmployerDashboard();

  // Navigation handlers
  const handleCreateJob = () => {
    navigate('/employer/jobs/create');
  };

  const handleViewJob = (jobId) => {
    navigate(`/employer/jobs/${jobId}`);
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

  // Analytics actions
  const handleExportAnalytics = () => {
    const analyticsExport = {
      metrics: analyticsData,
      generated_at: new Date().toISOString()
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
            error={errors.dashboard}
            onRefresh={loadDashboardData}
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
          <ApplicationManagement />
        </TabsContent>

        <TabsContent value="candidates">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={candidateFilters.search}
                onChange={(event) => {
                  setCandidateSearchMode('search');
                  setCandidateFilters((previous) => ({ ...previous, search: event.target.value }));
                }}
                placeholder="Search by name, title, skills, or location"
                aria-label="Search candidates"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setCandidateSearchMode('top');
                  setCandidateFilters((previous) => ({ ...previous, search: '' }));
                }}
              >
                Show top candidates
              </Button>
            </div>

            {errors.candidates && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errors.candidates}
              </div>
            )}

            {loading.candidates ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-44 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : candidates.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {candidates.map((candidate) => (
                  <Card key={candidate.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{candidate.name || 'Candidate'}</h3>
                          <p className="text-sm text-gray-600">{candidate.title || 'Title not provided'}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {candidate.experience_level || 'experience not set'}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <p>{candidate.location || 'Location not provided'}</p>
                        <p>{candidate.years_experience || 0} years of experience</p>
                        <p>
                          {candidate.availability_status
                            ? `Availability: ${candidate.availability_status}`
                            : 'Availability not provided'}
                        </p>
                      </div>
                      {candidate.skills?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {candidate.skills.slice(0, 6).map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
                No candidates match the current search.
              </div>
            )}

            {candidatePagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Page {candidatePagination.page} of {candidatePagination.pages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={candidatePagination.page <= 1 || loading.candidates}
                    onClick={() => handleCandidatePageChange(candidatePagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      candidatePagination.page >= candidatePagination.pages ||
                      loading.candidates
                    }
                    onClick={() => handleCandidatePageChange(candidatePagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard
            analyticsData={analyticsData}
            onExport={handleExportAnalytics}
            loading={loading.analytics}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployerDashboard;
