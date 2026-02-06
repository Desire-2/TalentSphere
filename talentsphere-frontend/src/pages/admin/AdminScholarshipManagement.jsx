import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap,
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
  TrendingUp,
  Award,
  BookOpen,
  Globe,
  RefreshCw,
  ArrowUpDown,
  UserCheck,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Progress } from '../../components/ui/progress';
import { scholarshipService } from '../../services/scholarship';
import { toast } from 'sonner';

const AdminScholarshipManagement = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScholarships, setSelectedScholarships] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState({
    total_scholarships: 0,
    published_scholarships: 0,
    draft_scholarships: 0,
    external_scholarships: 0,
    internal_scholarships: 0,
    applications_count: 0,
    views_count: 0
  });
  const [viewMode, setViewMode] = useState('table');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scholarshipToDelete, setScholarshipToDelete] = useState(null);
  const [deletingScholarship, setDeletingScholarship] = useState(false);

  // Fetch all scholarships (admin can see all)
  const fetchScholarships = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        per_page: pagination.per_page,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sourceFilter !== 'all' && { scholarship_source: sourceFilter }),
        ...(typeFilter !== 'all' && { scholarship_type: typeFilter }),
        admin_view: true // Special flag for admin to see all scholarships
      };

      const response = await scholarshipService.getAdminScholarships(params);
      
      if (response && response.scholarships) {
        setScholarships(response.scholarships);
        setPagination({
          page: response.pagination?.page || 1,
          per_page: response.pagination?.per_page || 20,
          total: response.pagination?.total || 0,
          pages: response.pagination?.pages || 1
        });
        
        if (response.summary) {
          setStats(response.summary);
        }
      } else {
        setScholarships([]);
      }
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load scholarships';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsResponse = await scholarshipService.getAdminScholarshipStats();
      if (statsResponse && typeof statsResponse === 'object') {
        setStats(statsResponse);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchScholarships();
    fetchStats();
  }, [searchTerm, statusFilter, sourceFilter, typeFilter, sortBy, sortOrder]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchScholarships(newPage);
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination({ ...pagination, page: 1 });
  };

  // Handle filters
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleSourceFilter = (value) => {
    setSourceFilter(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleTypeFilter = (value) => {
    setTypeFilter(value);
    setPagination({ ...pagination, page: 1 });
  };

  // Handle delete
  const confirmDelete = (scholarship) => {
    setScholarshipToDelete(scholarship);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!scholarshipToDelete) return;

    try {
      setDeletingScholarship(true);
      await scholarshipService.deleteScholarship(scholarshipToDelete.id);
      toast.success('Scholarship deleted successfully');
      setShowDeleteDialog(false);
      setScholarshipToDelete(null);
      fetchScholarships(pagination.page);
      fetchStats();
    } catch (error) {
      console.error('Error deleting scholarship:', error);
      toast.error(error.response?.data?.error || 'Failed to delete scholarship');
    } finally {
      setDeletingScholarship(false);
    }
  };

  // Handle feature toggle
  const handleFeatureToggle = async (scholarship) => {
    try {
      await scholarshipService.toggleFeatureScholarship(scholarship.id);
      toast.success(`Scholarship ${scholarship.is_featured ? 'unfeatured' : 'featured'} successfully`);
      fetchScholarships(pagination.page);
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  // Handle status change
  const handleStatusChange = async (scholarship, newStatus) => {
    try {
      await scholarshipService.updateScholarshipStatus(scholarship.id, newStatus);
      toast.success(`Scholarship status updated to ${newStatus}`);
      fetchScholarships(pagination.page);
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update scholarship status');
    }
  };

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatLastUpdated = (updatedAt) => {
    if (!updatedAt) return 'Recently';
    const date = new Date(updatedAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      draft: { variant: 'secondary', className: 'bg-gray-400 hover:bg-gray-500' },
      paused: { variant: 'warning', className: 'bg-yellow-500 hover:bg-yellow-600' },
      closed: { variant: 'destructive', className: 'bg-red-500 hover:bg-red-600' },
      expired: { variant: 'outline', className: 'border-red-300 text-red-600' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={config.className}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  // Get source badge
  const getSourceBadge = (source) => {
    if (source === 'external') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">External</Badge>;
    }
    return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Internal</Badge>;
  };

  // Statistics cards
  const statisticsCards = [
    {
      title: 'Total Scholarships',
      value: stats?.total_scholarships || 0,
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Published',
      value: stats?.published_scholarships || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'External Sources',
      value: stats?.external_scholarships || 0,
      icon: Globe,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Total Applications',
      value: stats?.applications_count || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scholarship Management</h1>
          <p className="text-gray-600 mt-1">Manage all scholarship postings across the platform</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => fetchScholarships(pagination.page)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link to="/admin/scholarships/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Scholarship
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statisticsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search scholarships..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={handleSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="merit-based">Merit-Based</SelectItem>
                <SelectItem value="need-based">Need-Based</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="research">Research</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value);
              if (value === 'updated_at' || value === 'created_at') {
                setSortOrder('desc');
              } else if (value === 'deadline') {
                setSortOrder('asc');
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Recently Updated</SelectItem>
                <SelectItem value="created_at">Newly Added</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex-1"
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="flex-1"
              >
                Cards
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scholarships...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Scholarships List - Table View */}
      {!loading && !error && viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>All Scholarships ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scholarships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No scholarships found
                      </TableCell>
                    </TableRow>
                  ) : (
                    scholarships.map((scholarship) => (
                      <TableRow key={scholarship.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {scholarship.is_featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <div>
                              <div className="font-medium">{scholarship.title}</div>
                              <div className="text-xs text-gray-500">{scholarship.scholarship_type}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {scholarship.external_organization_name || scholarship.organization?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{getSourceBadge(scholarship.scholarship_source)}</TableCell>
                        <TableCell>{getStatusBadge(scholarship.status)}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(scholarship.application_deadline)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatLastUpdated(scholarship.updated_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {scholarship.statistics?.application_count || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {scholarship.statistics?.view_count || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link to={`/scholarships/${scholarship.id}`} target="_blank">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/scholarships/${scholarship.id}/edit`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleFeatureToggle(scholarship)}>
                                <Star className="w-4 h-4 mr-2" />
                                {scholarship.is_featured ? 'Unfeature' : 'Feature'}
                              </DropdownMenuItem>
                              {scholarship.status === 'published' ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(scholarship, 'paused')}>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Pause
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(scholarship, 'published')}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => confirmDelete(scholarship)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={pagination.page === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cards View - Similar to table but in card format */}
      {!loading && !error && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scholarships.map((scholarship) => (
            <Card key={scholarship.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{scholarship.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {scholarship.external_organization_name || scholarship.organization?.name}
                    </CardDescription>
                  </div>
                  {scholarship.is_featured && (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {getStatusBadge(scholarship.status)}
                  {getSourceBadge(scholarship.scholarship_source)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Deadline: {formatDate(scholarship.application_deadline)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span>Updated {formatLastUpdated(scholarship.updated_at)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{scholarship.statistics?.application_count || 0} applications</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{scholarship.statistics?.view_count || 0} views</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link to={`/admin/scholarships/${scholarship.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/scholarships/${scholarship.id}`} target="_blank">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleFeatureToggle(scholarship)}>
                        <Star className="w-4 h-4 mr-2" />
                        {scholarship.is_featured ? 'Unfeature' : 'Feature'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => confirmDelete(scholarship)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scholarship</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{scholarshipToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deletingScholarship}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingScholarship}
            >
              {deletingScholarship ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminScholarshipManagement;
