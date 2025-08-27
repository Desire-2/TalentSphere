import React, { useState } from 'react';
import { 
  FileText,
  RefreshCw,
  Download,
  Search,
  Star,
  Eye,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  MessageSquare,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Users,
  Clock,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { formatDate, getStatusColor } from '../../utils/employer/dashboardUtils';
import { useApplicationManagement } from '../../hooks/useApplicationManagement';

const ApplicationManagement = () => {
  const {
    // Data
    applications,
    jobs,
    selectedApplications,
    
    // States
    loading,
    error,
    lastFetch,
    filters,
    pagination,
    
    // Computed values
    selectedCount,
    
    // Handlers
    handleFilterChange,
    handlePageChange,
    handleSelectApplication,
    handleSelectAll,
    handleUpdateApplicationStatus,
    handleBulkAction,
    handleScheduleInterview,
    handleExport,
    handleSendMessage,
    handleReviewApplication,
    handleRefresh,
    setError
  } = useApplicationManagement();

  // Local state for UI
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplicationForInterview, setSelectedApplicationForInterview] = useState(null);

  // Handle interview scheduling
  const handleScheduleInterviewClick = (applicationId) => {
    setSelectedApplicationForInterview(applicationId);
    setShowScheduleModal(true);
  };

  const handleScheduleInterviewSubmit = async (interviewData) => {
    if (selectedApplicationForInterview) {
      await handleScheduleInterview(selectedApplicationForInterview, interviewData);
      setShowScheduleModal(false);
      setSelectedApplicationForInterview(null);
    }
  };

  // Clear error after some time
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Application Management</h2>
          <p className="text-gray-600">
            Review and manage candidate applications
            {lastFetch && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {formatDate(lastFetch)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading.applications}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading.applications ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={loading.action || applications.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-blue-600">{pagination.total || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Applications</p>
                <p className="text-2xl font-bold text-green-600">
                  {applications.filter(app => app.status === 'submitted').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interviews Scheduled</p>
                <p className="text-2xl font-bold text-purple-600">
                  {applications.filter(app => app.interview_scheduled).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hired</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {applications.filter(app => app.status === 'hired').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name, email, or job title..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interviewed">Interviewed</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.job_id} 
              onValueChange={(value) => handleFilterChange('job_id', value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.slice(0, 10).map((job) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={filters.date_range} 
              onValueChange={(value) => handleFilterChange('date_range', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedCount} application(s) selected
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleBulkAction('shortlist')}
              disabled={loading.action}
            >
              <Star className="w-3 h-3 mr-1" />
              Shortlist
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkAction('mark_reviewed')}
              disabled={loading.action}
            >
              <Eye className="w-3 h-3 mr-1" />
              Mark Reviewed
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => handleBulkAction('reject')}
              disabled={loading.action}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {/* Select All Checkbox */}
        {applications.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={selectedCount === applications.length && applications.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedCount > 0 
                ? `${selectedCount} of ${applications.length} selected`
                : `Select all ${applications.length} applications`
              }
            </span>
          </div>
        )}

        {loading.applications ? (
          <div className="text-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center p-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No applications found</p>
            <p className="text-sm text-gray-400">
              {filters.search || filters.status !== 'all' || filters.job_id !== 'all' 
                ? 'Try adjusting your filters to see more results'
                : 'Applications will appear here when candidates apply to your jobs'
              }
            </p>
          </div>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Checkbox
                      checked={application.selected || false}
                      onCheckedChange={(checked) => handleSelectApplication(application.id, checked)}
                      className="mt-2"
                    />
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={application.applicant?.avatar} alt={application.applicant?.name} />
                      <AvatarFallback>
                        {application.applicant?.name?.split(' ').map(n => n[0]).join('') || 
                         `${application.applicant?.first_name?.[0] || ''}${application.applicant?.last_name?.[0] || ''}` || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{application.applicant?.name || 'Anonymous'}</h4>
                        <Badge className={`${getStatusColor(application.status)} text-white`}>
                          <span className="capitalize">{application.status?.replace('_', ' ')}</span>
                        </Badge>
                        {application.match_score && (
                          <Badge variant="outline" className="text-green-600">
                            {application.match_score}% match
                          </Badge>
                        )}
                        {application.applicant?.email && (
                          <span className="text-xs text-gray-500">
                            {application.applicant.email}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{application.job?.title}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Applied {formatDate(application.created_at)}
                      </p>
                      
                      {/* Application Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {application.applicant_profile?.title && (
                          <div>
                            <span className="font-medium">Title:</span>
                            <p className="text-gray-600">{application.applicant_profile.title}</p>
                          </div>
                        )}
                        {application.applicant_profile?.experience_level && (
                          <div>
                            <span className="font-medium">Experience:</span>
                            <p className="text-gray-600 capitalize">{application.applicant_profile.experience_level}</p>
                          </div>
                        )}
                        {application.applicant_profile?.location && (
                          <div>
                            <span className="font-medium">Location:</span>
                            <p className="text-gray-600">{application.applicant_profile.location}</p>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {application.applicant_profile?.skills && (
                        <div className="mt-3">
                          <span className="text-sm font-medium">Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {application.applicant_profile.skills.split(',').slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill.trim()}
                              </Badge>
                            ))}
                            {application.applicant_profile.skills.split(',').length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{application.applicant_profile.skills.split(',').length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cover Letter Preview */}
                      {application.cover_letter && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium mb-1">Cover Letter:</p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {application.cover_letter.slice(0, 200)}
                            {application.cover_letter.length > 200 && '...'}
                          </p>
                        </div>
                      )}

                      {/* Interview Info */}
                      {application.interview_scheduled && (
                        <div className="mt-3 p-3 bg-blue-50 rounded flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            Interview scheduled for {formatDate(application.interview_datetime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {application.resume_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSendMessage(application.id)}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={loading.action}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleUpdateApplicationStatus(application.id, 'under_review')}
                          disabled={application.status === 'under_review'}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Mark as Reviewed
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateApplicationStatus(application.id, 'shortlisted')}
                          disabled={application.status === 'shortlisted'}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleScheduleInterviewClick(application.id)}
                          disabled={application.interview_scheduled}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Interview
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleUpdateApplicationStatus(application.id, 'hired')}
                          disabled={application.status === 'hired'}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Hired
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                          disabled={application.status === 'rejected'}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleReviewApplication(application.id)}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
            {pagination.total} applications
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1 || loading.applications}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages || loading.applications}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading overlay for actions */}
      {loading.action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Processing action...</p>
          </div>
        </div>
      )}

      {/* TODO: Add Interview Scheduling Modal */}
      {/* This would be implemented as a separate component */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Schedule Interview</h3>
            <p className="text-gray-600 mb-4">
              Interview scheduling feature would be implemented here
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowScheduleModal(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => {
                // Mock schedule interview
                handleScheduleInterviewSubmit({
                  interview_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  interview_type: 'video',
                  interview_notes: 'Initial screening interview'
                });
              }}>
                Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;
