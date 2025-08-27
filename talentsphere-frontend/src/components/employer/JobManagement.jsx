import React from 'react';
import { 
  Briefcase,
  Plus,
  Settings,
  Download,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Pause,
  Play,
  Star,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { formatDate, getStatusColor, formatSalary } from '../../utils/employer/dashboardUtils';

const JobManagement = ({
  jobs,
  loading,
  error,
  selectedJobs,
  setSelectedJobs,
  filters,
  onFilterChange,
  pagination,
  onPageChange,
  onCreateJob,
  onEditJob,
  onViewJob,
  onDuplicateJob,
  onToggleJobStatus,
  onDeleteJob,
  onPromoteJob,
  onBulkActions,
  onExportJobs,
  onQuickAction,
  actionLoading = {}
}) => {
  const filteredJobs = jobs; // Filtering is handled in the hook

  const handleSelectAllJobs = (checked) => {
    if (checked) {
      setSelectedJobs(jobs.map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleJobSelection = (jobId, checked) => {
    if (checked) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Jobs Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Management</h2>
          <p className="text-gray-600">Manage your job postings and track their performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onCreateJob} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Job
          </Button>
          <Button 
            variant="outline" 
            onClick={onBulkActions} 
            disabled={selectedJobs.length === 0 || actionLoading['bulk-action']}
            className={selectedJobs.length > 0 ? "border-orange-300 text-orange-700 hover:bg-orange-50" : ""}
          >
            {actionLoading['bulk-action'] ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            {actionLoading['bulk-action'] 
              ? 'Processing...' 
              : `Bulk Actions (${selectedJobs.length})`
            }
          </Button>
          <Button 
            variant="outline" 
            onClick={onExportJobs}
            disabled={actionLoading['export']}
          >
            {actionLoading['export'] ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {actionLoading['export'] ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.employment_type} onValueChange={(value) => onFilterChange('employment_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Employment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sort_by} onValueChange={(value) => onFilterChange('sort_by', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="application_count">Applications</SelectItem>
                <SelectItem value="view_count">Views</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Card key={job.id} className={`hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-gradient-to-r from-white to-gray-50/30 hover:from-blue-50/30 hover:to-white group ${selectedJobs.includes(job.id) ? 'ring-2 ring-blue-500 border-l-blue-600' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Checkbox
                      checked={selectedJobs.includes(job.id)}
                      onCheckedChange={(checked) => handleJobSelection(job.id, checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold hover:text-blue-600 cursor-pointer"
                            onClick={() => onViewJob(job.id)}>
                          {job.title}
                        </h3>
                        {job.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {job.is_urgent && (
                          <Badge className="bg-red-100 text-red-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>

                      {/* Prominent Action Buttons */}
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewJob(job.id)}
                          disabled={actionLoading[`view-${job.id}`]}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                        >
                          {actionLoading[`view-${job.id}`] ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4 mr-2" />
                          )}
                          {actionLoading[`view-${job.id}`] ? 'Loading...' : 'View Details'}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => onEditJob(job.id)}
                          disabled={actionLoading[`edit-${job.id}`]}
                          className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          {actionLoading[`edit-${job.id}`] ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Edit className="w-4 h-4 mr-2" />
                          )}
                          {actionLoading[`edit-${job.id}`] ? 'Loading...' : 'Edit Job'}
                        </Button>
                        
                        <div className="text-xs text-gray-500 ml-auto">
                          Created {formatDate(job.created_at)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {job.location?.is_remote ? 'Remote' : (job.location?.display || job.location?.city || 'Remote')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {job.employment_type || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          {formatSalary(job)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(job.created_at)}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{job.view_count || 0}</p>
                          <p className="text-sm text-gray-600">Views</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{job.application_count || 0}</p>
                          <p className="text-sm text-gray-600">Applications</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            {job.application_count > 0 ? Math.round((job.view_count || 0) / job.application_count * 100) / 100 : 0}%
                          </p>
                          <p className="text-sm text-gray-600">Conversion</p>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onQuickAction ? onQuickAction(job.id, 'view') : onViewJob(job.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onQuickAction ? onQuickAction(job.id, 'edit') : onEditJob(job.id)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onQuickAction ? onQuickAction(job.id, 'duplicate') : onDuplicateJob(job.id)}
                          disabled={actionLoading[`duplicate-${job.id}`]}
                          className="flex items-center gap-1"
                        >
                          {actionLoading[`duplicate-${job.id}`] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          Copy
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onQuickAction ? onQuickAction(job.id, 'share') : null}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Share
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onQuickAction ? onQuickAction(job.id, 'analytics') : null}
                          className="flex items-center gap-1"
                        >
                          <BarChart3 className="w-3 h-3" />
                          Stats
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(job.status)} text-white font-medium shadow-sm`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          job.status === 'published' ? 'bg-white/80' :
                          job.status === 'draft' ? 'bg-white/60' :
                          job.status === 'paused' ? 'bg-white/70' :
                          'bg-white/60'
                        }`} />
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                      
                      <div className="text-xs text-gray-500 text-right">
                        <div>{job.application_count || 0} applications</div>
                        <div>ID: {job.id}</div>
                      </div>
                    </div>
                    
                    {/* Status Toggle Button */}
                    <Button
                      size="sm"
                      variant={job.status === 'published' ? 'destructive' : 'default'}
                      onClick={() => onQuickAction ? onQuickAction(job.id, 'toggle') : onToggleJobStatus(job.id)}
                      disabled={actionLoading[`toggle-${job.id}`]}
                      className="flex items-center gap-1"
                    >
                      {actionLoading[`toggle-${job.id}`] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : job.status === 'published' ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      {actionLoading[`toggle-${job.id}`] 
                        ? 'Updating...' 
                        : job.status === 'published' 
                          ? 'Pause' 
                          : 'Publish'
                      }
                    </Button>
                    
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading[`action-${job.id}`]}>
                            {actionLoading[`action-${job.id}`] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => onQuickAction ? onQuickAction(job.id, 'view') : onViewJob(job.id)}
                            className="cursor-pointer hover:bg-blue-50 transition-colors"
                            disabled={actionLoading[`view-${job.id}`]}
                          >
                            <div className="flex items-center w-full">
                              <Eye className="w-4 h-4 mr-2 text-blue-600" />
                              <span className="flex-1 font-medium">View Details</span>
                              {actionLoading[`view-${job.id}`] && (
                                <Loader2 className="w-3 h-3 animate-spin ml-2 text-blue-600" />
                              )}
                            </div>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => onQuickAction ? onQuickAction(job.id, 'edit') : onEditJob(job.id)}
                            className="cursor-pointer hover:bg-green-50 transition-colors"
                            disabled={actionLoading[`edit-${job.id}`]}
                          >
                            <div className="flex items-center w-full">
                              <Edit className="w-4 h-4 mr-2 text-green-600" />
                              <span className="flex-1 font-medium">Edit Job</span>
                              {actionLoading[`edit-${job.id}`] && (
                                <Loader2 className="w-3 h-3 animate-spin ml-2 text-green-600" />
                              )}
                            </div>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => onQuickAction ? onQuickAction(job.id, 'duplicate') : onDuplicateJob(job.id)}
                            disabled={actionLoading[`duplicate-${job.id}`]}
                          >
                            {actionLoading[`duplicate-${job.id}`] ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Copy className="w-4 h-4 mr-2" />
                            )}
                            {actionLoading[`duplicate-${job.id}`] ? 'Duplicating...' : 'Duplicate'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => onQuickAction ? onQuickAction(job.id, 'share') : null}
                            disabled={actionLoading[`share-${job.id}`]}
                            className="flex items-center gap-2 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            {actionLoading[`share-${job.id}`] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ExternalLink className="w-4 h-4 text-cyan-600" />
                            )}
                            <span>{actionLoading[`share-${job.id}`] ? 'Sharing...' : 'Share Job'}</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => onQuickAction ? onQuickAction(job.id, 'toggle') : onToggleJobStatus(job.id)}
                            disabled={actionLoading[`toggle-${job.id}`]}
                          >
                            {actionLoading[`toggle-${job.id}`] ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : job.status === 'published' ? (
                              <Pause className="w-4 h-4 mr-2" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            {actionLoading[`toggle-${job.id}`] 
                              ? 'Updating...' 
                              : job.status === 'published' 
                                ? 'Pause Job' 
                                : 'Activate Job'
                            }
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => onQuickAction ? onQuickAction(job.id, 'promote') : onPromoteJob(job.id)} 
                            disabled={job.is_featured || actionLoading[`promote-${job.id}`]}
                          >
                            {actionLoading[`promote-${job.id}`] ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Star className="w-4 h-4 mr-2" />
                            )}
                            {actionLoading[`promote-${job.id}`]
                              ? 'Promoting...'
                              : job.is_featured 
                                ? 'Already Featured' 
                                : 'Feature Job'
                            }
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => onQuickAction ? onQuickAction(job.id, 'analytics') : null}
                            disabled={actionLoading[`analytics-${job.id}`]}
                            className="flex items-center gap-2 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            {actionLoading[`analytics-${job.id}`] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <BarChart3 className="w-4 h-4 text-indigo-600" />
                            )}
                            <span>{actionLoading[`analytics-${job.id}`] ? 'Loading...' : 'View Analytics'}</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => onQuickAction ? onQuickAction(job.id, 'delete') : onDeleteJob(job.id)}
                            className="text-red-600 focus:text-red-600"
                            disabled={actionLoading[`delete-${job.id}`]}
                          >
                            {actionLoading[`delete-${job.id}`] ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            {actionLoading[`delete-${job.id}`] ? 'Deleting...' : 'Delete Job'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status !== 'all' || filters.employment_type !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Create your first job posting to get started'
                }
              </p>
              <Button onClick={onCreateJob}>
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} jobs
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.per_page)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(Math.ceil(pagination.total / pagination.per_page), pagination.page + 1))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.per_page)}
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
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobManagement;
