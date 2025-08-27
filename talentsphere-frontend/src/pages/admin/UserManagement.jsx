import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Building,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  SortAsc,
  SortDesc,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  UserPlus,
  Ban,
  Unlock,
  Copy,
  ExternalLink,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useAdminStore } from '../../stores/adminStore';
import { formatRelativeTime } from '../../utils/helpers';

const UserManagement = () => {
  console.log('UserManagement component loaded');
  
  const { 
    users, 
    pagination, 
    isLoading, 
    error, 
    fetchUsers, 
    toggleUserStatus 
  } = useAdminStore();

  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: '',
    is_verified: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    per_page: 20
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [showUserDetails, setShowUserDetails] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [emailTemplate, setEmailTemplate] = useState({
    subject: '',
    message: '',
    sendToAll: false
  });
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [compactView, setCompactView] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers(filters);
  }, [filters, fetchUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsers(filters);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    handleFilterChange('sort_by', key);
    handleFilterChange('sort_order', direction);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allUserIds = users.map(user => user.id);
    setSelectedUsers(prev => 
      prev.length === allUserIds.length ? [] : allUserIds
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    
    setActionLoading(prev => ({ ...prev, bulk: true }));
    
    try {
      if (bulkAction === 'activate') {
        for (const userId of selectedUsers) {
          const user = users.find(u => u.id === userId);
          if (user && !user.is_active) {
            await toggleUserStatus(userId);
          }
        }
      } else if (bulkAction === 'deactivate') {
        for (const userId of selectedUsers) {
          const user = users.find(u => u.id === userId);
          if (user && user.is_active && user.role !== 'admin') {
            await toggleUserStatus(userId);
          }
        }
      } else if (bulkAction === 'email') {
        setShowEmailDialog(true);
        return;
      }
      
      await fetchUsers(filters);
      setSelectedUsers([]);
      setBulkAction('');
      console.log('✅ Bulk action completed successfully');
    } catch (error) {
      console.error('❌ Bulk action failed:', error);
      alert('Bulk action failed. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, bulk: false }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(filters);
  };

  const handleSendEmail = (user) => {
    if (user) {
      const subject = encodeURIComponent('Message from TalentSphere Admin');
      const body = encodeURIComponent(`Dear ${user.first_name},\n\nThis is a message from the TalentSphere administration team.\n\nBest regards,\nTalentSphere Team`);
      const mailtoUrl = `mailto:${user.email}?subject=${subject}&body=${body}`;
      window.open(mailtoUrl, '_blank');
    } else {
      setEmailTemplate({
        subject: 'Important Notice from TalentSphere',
        message: 'Dear User,\n\nWe hope this message finds you well.\n\nBest regards,\nTalentSphere Team',
        sendToAll: selectedUsers.length === 0
      });
      setShowEmailDialog(true);
    }
  };

  const handleSendBulkEmail = () => {
    const recipients = selectedUsers.length > 0 
      ? users.filter(u => selectedUsers.includes(u.id)).map(u => u.email)
      : users.map(u => u.email);
    
    const subject = encodeURIComponent(emailTemplate.subject);
    const body = encodeURIComponent(emailTemplate.message);
    const mailtoUrl = `mailto:?bcc=${recipients.join(',')}&subject=${subject}&body=${body}`;
    
    window.open(mailtoUrl, '_blank');
    setShowEmailDialog(false);
    setSelectedUsers([]);
  };

  const handleViewProfile = (user) => {
    setShowUserDetails(user);
  };

  const handleCopyUserInfo = (user) => {
    const userInfo = `Name: ${user.full_name}\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.is_active ? 'Active' : 'Inactive'}\nVerified: ${user.is_verified ? 'Yes' : 'No'}\nJoined: ${new Date(user.created_at).toLocaleDateString()}`;
    navigator.clipboard.writeText(userInfo);
    console.log('User info copied to clipboard');
  };

  const handleToggleUserStatus = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await toggleUserStatus(userId);
      console.log('✅ User status toggled successfully');
      await fetchUsers(filters);
    } catch (error) {
      console.error('❌ Failed to toggle user status:', error);
      alert('Failed to toggle user status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'destructive',
      employer: 'default',
      job_seeker: 'secondary'
    };
    return variants[role] || 'secondary';
  };

  const getStatusBadge = (isActive, isVerified) => {
    if (!isActive) return { variant: 'destructive', text: 'Inactive' };
    if (!isVerified) return { variant: 'secondary', text: 'Unverified' };
    return { variant: 'success', text: 'Active' };
  };

  const exportUsers = () => {
    const csvHeaders = [
      'ID', 'Name', 'Email', 'Role', 'Status', 'Verified', 'Phone', 'Location',
      'Last Login', 'Created', 'Applications', 'Jobs Posted', 'Profile Completed'
    ];
    
    const csvData = users.map(user => [
      user.id,
      `${user.first_name} ${user.last_name}`,
      user.email,
      user.role,
      user.is_active ? 'Active' : 'Inactive',
      user.is_verified ? 'Yes' : 'No',
      user.phone || 'N/A',
      user.location || 'N/A',
      user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
      new Date(user.created_at).toLocaleDateString(),
      user.stats?.applications_count || 0,
      user.stats?.jobs_posted || 0,
      user.profile_completed ? 'Yes' : 'No'
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Users exported successfully');
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load users: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage all platform users and their permissions
              {selectedUsers.length > 0 && (
                <span className="text-blue-600 font-medium ml-2">
                  ({selectedUsers.length} selected)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
            
            <Button onClick={() => handleSendEmail()} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            
            <Button onClick={exportUsers} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            
            <Button variant="default">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.is_verified).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Employers</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.role === 'employer').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-600">Job Seekers</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.role === 'job_seeker').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Advanced Filters</CardTitle>
              <div className="flex items-center space-x-2">
                <Label htmlFor="compact-view" className="text-sm">Compact View</Label>
                <Switch
                  id="compact-view"
                  checked={compactView}
                  onCheckedChange={setCompactView}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filters">Basic Filters</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="filters" className="space-y-4">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <Input
                      placeholder="Search users by name, email, or phone..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <Select value={filters.role || 'all'} onValueChange={(value) => handleFilterChange('role', value === 'all' ? '' : value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="job_seeker">Job Seeker</SelectItem>
                      <SelectItem value="employer">Employer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.is_active || 'all'} onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? '' : value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.is_verified || 'all'} onValueChange={(value) => handleFilterChange('is_verified', value === 'all' ? '' : value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Verified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Verified</SelectItem>
                      <SelectItem value="false">Unverified</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button type="submit" disabled={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Items per page</Label>
                    <Select value={filters.per_page.toString()} onValueChange={(value) => handleFilterChange('per_page', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="20">20 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                        <SelectItem value="100">100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Sort by</Label>
                    <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Date Joined</SelectItem>
                        <SelectItem value="last_login">Last Login</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Order</Label>
                    <Select value={filters.sort_order} onValueChange={(value) => handleFilterChange('sort_order', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest First</SelectItem>
                        <SelectItem value="asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{selectedUsers.length} users selected</span>
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Choose bulk action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activate">Activate Users</SelectItem>
                      <SelectItem value="deactivate">Deactivate Users</SelectItem>
                      <SelectItem value="email">Send Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedUsers([])}
                  >
                    Clear Selection
                  </Button>
                  <Button 
                    onClick={handleBulkAction}
                    disabled={!bulkAction || actionLoading.bulk}
                  >
                    {actionLoading.bulk ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    Apply Action
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Users Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Users ({pagination?.total || 0})</CardTitle>
                <CardDescription>
                  Showing {users.length} of {pagination?.total || 0} users
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                >
                  {viewMode === 'table' ? 'Grid View' : 'Table View'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('name')}
                        >
                          User
                          {sortConfig.key === 'name' && (
                            sortConfig.direction === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('last_login')}
                        >
                          Activity
                          {sortConfig.key === 'last_login' && (
                            sortConfig.direction === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('created_at')}
                        >
                          Joined
                          {sortConfig.key === 'created_at' && (
                            sortConfig.direction === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const status = getStatusBadge(user.is_active, user.is_verified);
                      return (
                        <TableRow 
                          key={user.id}
                          className={`${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''} ${compactView ? 'h-12' : ''}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleSelectUser(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className={compactView ? "h-6 w-6" : "h-8 w-8"}>
                                <AvatarImage src={user.profile_picture} />
                                <AvatarFallback>
                                  {user.first_name?.[0]}{user.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className={`font-medium ${compactView ? 'text-sm' : ''}`}>
                                  {user.full_name}
                                </div>
                                <div className={`text-gray-500 ${compactView ? 'text-xs' : 'text-sm'}`}>
                                  {user.email}
                                </div>
                                {!compactView && user.phone && (
                                  <div className="text-xs text-gray-400 flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadge(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant={status.variant}>
                                {status.text}
                              </Badge>
                              {!compactView && user.stats && (
                                <div className="text-xs text-gray-500">
                                  {user.role === 'job_seeker' && (
                                    <span>{user.stats.applications_count} applications</span>
                                  )}
                                  {user.role === 'employer' && (
                                    <span>{user.stats.jobs_posted} jobs posted</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={compactView ? 'text-xs' : 'text-sm'}>
                              {user.last_login ? (
                                <span>Last: {formatRelativeTime(user.last_login)}</span>
                              ) : (
                                <span className="text-gray-400">Never logged in</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`text-gray-500 ${compactView ? 'text-xs' : 'text-sm'}`}>
                              {formatRelativeTime(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewProfile(user)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View profile</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleCopyUserInfo(user)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy user info</TooltipContent>
                              </Tooltip>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                  
                                  <DropdownMenuItem onClick={() => handleSendEmail(user)}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Profile
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onClick={() => handleCopyUserInfo(user)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Info
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  {user.role !== 'admin' && (
                                    <DropdownMenuItem
                                      onClick={() => handleToggleUserStatus(user.id)}
                                      disabled={actionLoading[user.id]}
                                      className={user.is_active ? 'text-red-600' : 'text-green-600'}
                                    >
                                      {actionLoading[user.id] ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                      ) : user.is_active ? (
                                        <>
                                          <Ban className="h-4 w-4 mr-2" />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="h-4 w-4 mr-2" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {user.role === 'employer' && (
                                    <DropdownMenuItem>
                                      <Building className="h-4 w-4 mr-2" />
                                      View Company
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Enhanced Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', 1)}
                    disabled={pagination.page === 1 || isLoading}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                    disabled={!pagination.has_prev || isLoading}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                    disabled={!pagination.has_next || isLoading}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', pagination.pages)}
                    disabled={pagination.page === pagination.pages || isLoading}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails !== null} onOpenChange={() => setShowUserDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about {showUserDetails?.full_name}
              </DialogDescription>
            </DialogHeader>
            
            {showUserDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={showUserDetails.profile_picture} />
                      <AvatarFallback className="text-lg">
                        {showUserDetails.first_name?.[0]}{showUserDetails.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{showUserDetails.full_name}</h3>
                      <p className="text-gray-600">{showUserDetails.email}</p>
                      <Badge variant={getRoleBadge(showUserDetails.role)}>
                        {showUserDetails.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{showUserDetails.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{showUserDetails.location || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Joined {new Date(showUserDetails.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Account Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Active</span>
                        <Badge variant={showUserDetails.is_active ? 'success' : 'destructive'}>
                          {showUserDetails.is_active ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Verified</span>
                        <Badge variant={showUserDetails.is_verified ? 'success' : 'secondary'}>
                          {showUserDetails.is_verified ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Last Login</span>
                        <span className="text-sm text-gray-600">
                          {showUserDetails.last_login 
                            ? formatRelativeTime(showUserDetails.last_login)
                            : 'Never'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {showUserDetails.stats && (
                    <div>
                      <h4 className="font-medium mb-2">Activity Stats</h4>
                      <div className="space-y-2">
                        {showUserDetails.role === 'job_seeker' && (
                          <>
                            <div className="flex items-center justify-between">
                              <span>Applications</span>
                              <span>{showUserDetails.stats.applications_count || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Bookmarks</span>
                              <span>{showUserDetails.stats.bookmarks_count || 0}</span>
                            </div>
                          </>
                        )}
                        {showUserDetails.role === 'employer' && (
                          <>
                            <div className="flex items-center justify-between">
                              <span>Jobs Posted</span>
                              <span>{showUserDetails.stats.jobs_posted || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Applications Received</span>
                              <span>{showUserDetails.stats.applications_received || 0}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDetails(null)}>
                Close
              </Button>
              {showUserDetails && (
                <Button onClick={() => handleSendEmail(showUserDetails)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email</DialogTitle>
              <DialogDescription>
                {selectedUsers.length > 0 
                  ? `Send email to ${selectedUsers.length} selected users`
                  : 'Send email to all users'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={emailTemplate.subject}
                  onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject..."
                />
              </div>
              
              <div>
                <Label htmlFor="email-message">Message</Label>
                <Textarea
                  id="email-message"
                  value={emailTemplate.message}
                  onChange={(e) => setEmailTemplate(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your message..."
                  rows={6}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-to-all"
                  checked={emailTemplate.sendToAll}
                  onCheckedChange={(checked) => setEmailTemplate(prev => ({ ...prev, sendToAll: checked }))}
                />
                <Label htmlFor="send-to-all" className="text-sm">
                  Send to all users (ignore selection)
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendBulkEmail}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default UserManagement;
