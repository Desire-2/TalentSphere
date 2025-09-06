import React, { useState, useEffect } from 'react';
import { 
  Briefcase,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Archive,
  ArchiveRestore,
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Share2,
  Star,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { externalAdminService } from '../../services/externalAdmin';
import { toast } from 'sonner';
import './ExternalJobsManagement.css';
// Import the new components
import { JobStatusBadge, JobTypeBadge, ExperienceLevelBadge } from '../../components/external-admin/JobBadges';
import { JobActionsDropdown, QuickJobActions } from '../../components/external-admin/JobActions';

const ExternalJobsManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    employment_type: '',
    experience_level: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [pagination.page]);

  // Separate effect for filters with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
      fetchJobs();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        per_page: pagination.per_page
      };

      // Only add non-empty filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params[key] = value;
        }
      });

      console.log('Fetching jobs with params:', params); // Debug log

      const response = await externalAdminService.getExternalJobs(params);
      console.log('Jobs response:', response); // Debug log
      
      setJobs(response.external_jobs || []);
      setPagination(prev => ({
        ...prev,
        ...response.pagination
      }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [jobId]: 'status' }));
      
      await externalAdminService.updateJobStatus(jobId, newStatus);
      
      // Update job status in state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );

      const statusMessages = {
        'published': 'Job published successfully',
        'archived': 'Job archived successfully',
        'draft': 'Job saved as draft'
      };

      toast.success(statusMessages[newStatus] || 'Job status updated');
      console.log('✅ Job status updated:', { jobId, newStatus });
      
    } catch (error) {
      console.error('❌ Error updating job status:', error);
      toast.error('Failed to update job status');
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: null }));
    }
  };  const handleDeleteJob = async (jobId) => {
    if (!jobId) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [jobId]: 'delete' }));
      
      await externalAdminService.deleteExternalJob(jobId);

      // Remove job from state
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      
      // Close dialog and reset state
      setShowDeleteDialog(false);
      setSelectedJob(null);
      
      // Show success message
      toast.success('Job deleted successfully');
      console.log('✅ Job deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting job:', error);
      toast.error('Failed to delete job');
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: null }));
    }
  };

    // Enhanced handler functions  
  const handleCopyJobLink = async (jobId) => {
    try {
      setActionLoading(prev => ({ ...prev, [jobId]: 'copy' }));
      
      const result = await externalAdminService.copyJobLink(jobId);
      
      if (result.success) {
        toast.success('Job link copied to clipboard!');
        console.log('✅ Job link copied:', result.url);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Error copying job link:', error);
      toast.error('Failed to copy job link');
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: null }));
    }
  };

  const handleDuplicateJob = async (jobId) => {
    try {
      setActionLoading(prev => ({ ...prev, [jobId]: 'duplicate' }));
      
      const duplicatedJob = await externalAdminService.duplicateExternalJob(jobId);
      
      // Add the duplicated job to the state
      setJobs(prevJobs => [duplicatedJob, ...prevJobs]);
      
      toast.success('Job duplicated successfully!');
      console.log('✅ Job duplicated successfully:', duplicatedJob.title);
      
    } catch (error) {
      console.error('❌ Error duplicating job:', error);
      toast.error('Failed to duplicate job');
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: null }));
    }
  };

  // Loading state for component
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">External Jobs</h1>
            <p className="text-gray-600 mt-2">
              Manage external job postings and their performance
            </p>
          </div>
          <Link to="/external-admin/jobs/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          </Link>
        </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.employment_type || 'all'} onValueChange={(value) => setFilters({ ...filters, employment_type: value === 'all' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Employment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.experience_level || 'all'} onValueChange={(value) => setFilters({ ...filters, experience_level: value === 'all' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Experience Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="entry">Entry</SelectItem>
                <SelectItem value="mid">Mid</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            External Jobs ({pagination.total})
          </CardTitle>
          <CardDescription>
            Jobs imported from external sources and partner companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="job-card border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Job Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        {job.external_company_logo ? (
                          <img 
                            src={job.external_company_logo} 
                            alt={job.external_company_name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {job.external_company_name}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location?.display || 'Remote'}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                          <div className="mt-1">
                            <JobStatusBadge status={job.status} />
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Employment Type</span>
                          <div className="mt-1">
                            <JobTypeBadge type={job.employment_type} />
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Experience</span>
                          <div className="mt-1">
                            <ExperienceLevelBadge level={job.experience_level} />
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Source</span>
                          <div className="mt-1 flex items-center">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            <span className="text-sm text-gray-700">{job.job_source || 'External'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Job Stats */}
                      <div className="job-stats flex items-center space-x-6 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {job.statistics?.view_count || 0} views
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {job.statistics?.application_count || 0} applications
                        </span>
                        {job.salary?.display && (
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {job.salary.display}
                          </span>
                        )}
                        {job.source_url && (
                          <a 
                            href={job.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-blue-600"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Original Source
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Quick Action Buttons */}
                      <QuickJobActions 
                        job={job}
                        actionLoading={actionLoading}
                        onStatusUpdate={handleStatusUpdate}
                        onCopyLink={handleCopyJobLink}
                      />

                      {/* More Actions Dropdown */}
                      <JobActionsDropdown 
                        job={job}
                        actionLoading={actionLoading}
                        onStatusUpdate={handleStatusUpdate}
                        onCopyLink={handleCopyJobLink}
                        onDuplicate={handleDuplicateJob}
                        onDelete={(selectedJob) => {
                          setSelectedJob(selectedJob);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 transition-all duration-200"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </JobActionsDropdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No external jobs found</h3>
              <p className="text-gray-600 mb-6">
                {Object.values(filters).some(v => v) 
                  ? "No jobs match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first external job posting or importing jobs from external sources."
                }
              </p>
              <div className="flex justify-center space-x-4">
                <Link to="/external-admin/jobs/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Job
                  </Button>
                </Link>
                <Link to="/external-admin/jobs/import">
                  <Button variant="outline">
                    Import Jobs
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  {pagination.page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(pageNum => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        onClick={() => setPagination({...pagination, page: pageNum})}
                        isActive={pageNum === pagination.page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  {pagination.page < pagination.pages && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Job Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete the job "{selectedJob?.title}"? 
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ This action cannot be undone
                </p>
                <ul className="text-red-700 text-sm mt-2 space-y-1">
                  <li>• The job listing will be permanently removed</li>
                  <li>• All applications will be deleted</li>
                  <li>• Analytics data will be lost</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedJob(null);
              }}
              className="bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteJob(selectedJob?.id)}
              disabled={actionLoading[selectedJob?.id] === 'delete'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading[selectedJob?.id] === 'delete' ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default ExternalJobsManagement;
