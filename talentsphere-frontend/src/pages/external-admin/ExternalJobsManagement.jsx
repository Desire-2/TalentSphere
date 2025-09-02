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
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../components/ui/pagination';
import { externalAdminService } from '../../services/externalAdmin';
import { toast } from 'sonner';

const ExternalJobsManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
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
      await externalAdminService.updateJobStatus(jobId, newStatus);
      toast.success(`Job ${newStatus} successfully`);
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        await externalAdminService.deleteExternalJob(jobId);
        toast.success('Job deleted successfully');
        fetchJobs();
      } catch (error) {
        console.error('Error deleting job:', error);
        toast.error('Failed to delete job');
      }
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getExperienceLevelBadgeColor = (level) => {
    switch (level) {
      case 'entry':
        return 'bg-green-100 text-green-800';
      case 'mid':
        return 'bg-blue-100 text-blue-800';
      case 'senior':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
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
                            <Badge variant={getStatusBadgeVariant(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Employment Type</span>
                          <div className="mt-1">
                            <Badge variant="outline" className="capitalize">
                              {job.employment_type}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Experience</span>
                          <div className="mt-1">
                            <Badge className={`capitalize ${getExperienceLevelBadgeColor(job.experience_level)}`}>
                              {job.experience_level}
                            </Badge>
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
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
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

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/jobs/${job.id}`} className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            View Job
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/external-admin/jobs/${job.id}/edit`} className="flex items-center">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Job
                          </Link>
                        </DropdownMenuItem>
                        {job.status === 'published' ? (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(job.id, 'archived')}>
                            Archive Job
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(job.id, 'published')}>
                            Publish Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    </div>
  );
};

export default ExternalJobsManagement;
