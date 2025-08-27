import { useEffect, useState } from 'react';
import { 
  Building, 
  Search, 
  Download, 
  MoreVertical,
  CheckCircle,
  Star,
  MapPin,
  Users,
  Briefcase,
  Globe,
  Mail,
  Phone,
  Calendar,
  Shield,
  Eye,
  X,
  Check,
  AlertTriangle,
  FileText,
  Image,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc,
  Plus,
  Edit,
  Trash2,
  Send,
  Ban,
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  RefreshCw,
  Flag,
  MessageSquare,
  Verified,
  Camera,
  MapPin as LocationIcon,
  Building2,
  Archive,
  BarChart3,
  Calendar as CalendarIcon,
  Settings,
  UserCheck,
  Zap,
  Target,
  Crown,
  Award,
  BookOpen,
  Link
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminStore } from '../../stores/adminStore';
import { formatRelativeTime, formatNumber } from '../../utils/helpers';

const EnhancedCompanyManagement = () => {
  const { 
    companies, 
    pagination, 
    isLoading, 
    error, 
    fetchCompanies, 
    verifyCompany,
    rejectCompanyVerification,
    toggleCompanyFeatured,
    toggleCompanyStatus,
    sendCompanyEmail,
    bulkCompanyAction,
    deleteCompany
  } = useAdminStore();

  const [filters, setFilters] = useState({
    search: '',
    is_verified: 'all',
    is_featured: 'all',
    is_active: 'all',
    industry: 'all',
    company_size: 'all',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    per_page: 20
  });

  const [selectedCompanies, setSelectedCompanies] = useState(new Set());
  const [actionLoading, setActionLoading] = useState({});
  const [viewMode, setViewMode] = useState('table'); // table, grid, detailed
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form states
  const [verificationNotes, setVerificationNotes] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchCompanies(filters);
  }, [filters, fetchCompanies]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleSelectCompany = (companyId) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCompanies.size === companies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(companies.map(c => c.id)));
    }
  };

  const handleVerifyCompany = async (companyId, approved = true) => {
    console.log(`${approved ? '✅ Verify' : '❌ Reject'} Company clicked for ID:`, companyId);
    setActionLoading(prev => ({ ...prev, [companyId]: true }));
    try {
      let result;
      if (approved) {
        result = await verifyCompany(companyId);
        console.log('✅ Verify Company API result:', result);
        alert(`Company verified successfully!`);
      } else {
        result = await rejectCompanyVerification(companyId, verificationNotes);
        console.log('❌ Reject Company API result:', result);
        alert(`Company verification rejected successfully!`);
      }
      await fetchCompanies(filters);
      setShowVerificationDialog(false);
      setVerificationNotes('');
      console.log(`✅ Company ${approved ? 'verified' : 'rejected'} successfully`);
    } catch (error) {
      console.error(`❌ Failed to ${approved ? 'verify' : 'reject'} company:`, error);
      alert(`Failed to ${approved ? 'verify' : 'reject'} company. Please try again.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [companyId]: false }));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCompanies.size === 0) {
      alert('Please select companies first');
      return;
    }

    try {
      const companyIds = Array.from(selectedCompanies);
      
      if (action === 'export') {
        await handleExportSelected();
      } else {
        await bulkCompanyAction(companyIds, action);
      }
      
      setSelectedCompanies(new Set());
      setShowBulkActions(false);
      console.log(`✅ Bulk ${action} completed successfully`);
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Bulk action failed. Please try again.');
    }
  };

  const handleExportSelected = async () => {
    const selectedData = companies.filter(c => selectedCompanies.has(c.id));
    const csvContent = generateCSV(selectedData);
    downloadCSV(csvContent, 'selected_companies.csv');
  };

  const handleExportAll = async () => {
    // In a real app, this would fetch all companies from the API
    const csvContent = generateCSV(companies);
    downloadCSV(csvContent, 'all_companies.csv');
  };

  const generateCSV = (data) => {
    const headers = ['Name', 'Industry', 'Location', 'Size', 'Verified', 'Featured', 'Active', 'Created', 'Website', 'Email'];
    const rows = data.map(company => [
      company.name,
      company.industry || '',
      getLocationString(company),
      company.company_size || '',
      company.is_verified ? 'Yes' : 'No',
      company.is_featured ? 'Yes' : 'No',
      company.is_active ? 'Yes' : 'No',
      new Date(company.created_at).toLocaleDateString(),
      company.website || '',
      company.email || ''
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const getLocationString = (company) => {
    const parts = [company.city, company.state, company.country].filter(Boolean);
    return parts.join(', ');
  };

  const getVerificationBadge = (isVerified) => {
    return isVerified 
      ? { variant: 'default', text: 'Verified', icon: CheckCircle, color: 'text-green-600' }
      : { variant: 'secondary', text: 'Unverified', icon: AlertCircle, color: 'text-yellow-600' };
  };

  const getCompanySizeBadge = (size) => {
    const variants = {
      '1-10': { variant: 'outline', text: 'Startup', color: 'bg-blue-50 text-blue-700' },
      '11-50': { variant: 'secondary', text: 'Small', color: 'bg-green-50 text-green-700' },
      '51-200': { variant: 'default', text: 'Medium', color: 'bg-yellow-50 text-yellow-700' },
      '201-500': { variant: 'default', text: 'Large', color: 'bg-orange-50 text-orange-700' },
      '500+': { variant: 'destructive', text: 'Enterprise', color: 'bg-purple-50 text-purple-700' }
    };
    return variants[size] || { variant: 'outline', text: size || 'Unknown', color: 'bg-gray-50 text-gray-700' };
  };

  const getActivityBadge = (isActive) => {
    return isActive 
      ? { variant: 'default', text: 'Active', icon: CheckCircle2, color: 'text-green-600' }
      : { variant: 'destructive', text: 'Inactive', icon: XCircle, color: 'text-red-600' };
  };

  const getCompanyScore = (company) => {
    let score = 0;
    if (company.is_verified) score += 30;
    if (company.description && company.description.length > 100) score += 20;
    if (company.website) score += 15;
    if (company.logo_url) score += 10;
    if (company.industry) score += 10;
    if (company.email) score += 10;
    if (company.city && company.country) score += 5;
    return Math.min(score, 100);
  };

  const sendEmail = async () => {
    console.log('📧 Send Email clicked for company:', selectedCompany?.name);
    if (!selectedCompany || !emailSubject || !emailBody) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const result = await sendCompanyEmail(selectedCompany.id, emailSubject, emailBody);
      console.log('✅ Send Email API result:', result);
      alert('Email sent successfully!');
      setShowEmailDialog(false);
      setEmailSubject('');
      setEmailBody('');
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleToggleFeatured = async (companyId) => {
    console.log('🌟 Toggle Featured clicked for company:', companyId);
    setActionLoading(prev => ({ ...prev, [companyId]: true }));
    try {
      const result = await toggleCompanyFeatured(companyId);
      console.log('✅ Toggle Featured API result:', result);
      
      // If we're filtering by featured companies and just removed featured status,
      // temporarily show all to see the result
      const wasFilteringFeatured = filters.is_featured === 'true';
      const wasRemovedFromFeatured = !result.company.is_featured;
      
      if (wasFilteringFeatured && wasRemovedFromFeatured) {
        // Temporarily clear the featured filter to show the updated company
        const tempFilters = { ...filters, is_featured: 'all' };
        await fetchCompanies(tempFilters);
        setFilters(tempFilters);
        alert(`Company ${result.company.is_featured ? 'featured' : 'unfeatured'} successfully! Filter has been updated to show all companies.`);
      } else {
        await fetchCompanies(filters);
        alert(`Company ${result.company.is_featured ? 'featured' : 'unfeatured'} successfully!`);
      }
      
      console.log('✅ Company featured status toggled successfully');
    } catch (error) {
      console.error('❌ Failed to toggle featured status:', error);
      alert('Failed to toggle featured status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [companyId]: false }));
    }
  };

  const handleToggleStatus = async (companyId) => {
    console.log('🔄 Toggle Status clicked for company:', companyId);
    setActionLoading(prev => ({ ...prev, [companyId]: true }));
    try {
      const result = await toggleCompanyStatus(companyId, suspendReason);
      console.log('✅ Toggle Status API result:', result);
      
      // If we're filtering by active companies and just suspended the company,
      // temporarily show all to see the result
      const wasFilteringActive = filters.is_active === 'true';
      const wasSuspended = !result.company.is_active;
      
      if (wasFilteringActive && wasSuspended) {
        // Temporarily clear the active filter to show the updated company
        const tempFilters = { ...filters, is_active: 'all' };
        await fetchCompanies(tempFilters);
        setFilters(tempFilters);
        alert(`Company ${result.company.is_active ? 'activated' : 'suspended'} successfully! Filter has been updated to show all companies.`);
      } else {
        await fetchCompanies(filters);
        alert(`Company ${result.company.is_active ? 'activated' : 'suspended'} successfully!`);
      }
      
      console.log('✅ Company status toggled successfully');
      setSuspendReason('');
    } catch (error) {
      console.error('❌ Failed to toggle company status:', error);
      alert('Failed to toggle company status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [companyId]: false }));
    }
  };

  const handleRevokeVerification = async (companyId) => {
    console.log('🔄 Revoking verification for company:', companyId);
    setActionLoading(prev => ({ ...prev, [companyId]: true }));
    try {
      await rejectCompanyVerification(companyId, 'Verification revoked by admin');
      
      // If we're filtering by verified companies, temporarily show all to see the result
      const wasFilteringVerified = filters.is_verified === 'true';
      if (wasFilteringVerified) {
        // Temporarily clear the verification filter to show the updated company
        const tempFilters = { ...filters, is_verified: 'all' };
        await fetchCompanies(tempFilters);
        setFilters(tempFilters);
        alert('Company verification revoked successfully! Filter has been updated to show all companies.');
      } else {
        await fetchCompanies(filters);
        alert('Company verification revoked successfully!');
      }
      
      console.log('✅ Company verification revoked successfully');
    } catch (error) {
      console.error('❌ Failed to revoke verification:', error);
      alert('Failed to revoke verification. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [companyId]: false }));
    }
  };

  const handleViewJobs = (company) => {
    // Navigate to jobs page with company filter
    console.log('Viewing jobs for company:', company.name);
    // In a real app, you would navigate to /admin/jobs?company_id=companyId
    alert(`Job postings view would open here for "${company.name}"`);
  };

  const handleViewAnalytics = (company) => {
    // Navigate to analytics page for specific company
    console.log('Viewing analytics for company:', company.name);
    // In a real app, you would show detailed analytics
    alert(`Analytics dashboard would open here for "${company.name}"`);
  };

  const handleFlagForReview = (company) => {
    // Flag company for manual review
    console.log('Flagging company for review:', company.name);
    alert(`Company "${company.name}" has been flagged for review`);
  };

  const handleDeleteCompany = (company) => {
    setSelectedCompany(company);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCompany = async () => {
    console.log('🗑️ Delete Company confirmed for:', selectedCompany?.name);
    if (!selectedCompany) return;
    
    try {
      const result = await deleteCompany(selectedCompany.id);
      console.log('✅ Delete Company API result:', result);
      alert(`Company "${selectedCompany.name}" has been deleted successfully`);
      setShowDeleteConfirm(false);
      setSelectedCompany(null);
      await fetchCompanies(filters); // Refresh the list
      console.log('✅ Company deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete company:', error);
      alert('Failed to delete company. Please try again.');
    }
  };

  const industryOptions = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
    'Retail', 'Construction', 'Transportation', 'Real Estate', 'Media',
    'Government', 'Non-profit', 'Consulting', 'Energy', 'Agriculture',
    'Entertainment', 'Hospitality', 'Legal', 'Marketing', 'AI', 'Clean Energy'
  ];

  const companySizeOptions = [
    { value: '1-10', label: 'Startup (1-10)' },
    { value: '11-50', label: 'Small (11-50)' },
    { value: '51-200', label: 'Medium (51-200)' },
    { value: '201-500', label: 'Large (201-500)' },
    { value: '500+', label: 'Enterprise (500+)' }
  ];

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load companies: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building className="h-8 w-8 text-blue-600" />
              Company Management
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive management and verification of company profiles and advertisements
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => fetchCompanies(filters)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {selectedCompanies.size > 0 && (
              <Button onClick={() => setShowBulkActions(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Bulk Actions ({selectedCompanies.size})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Companies</p>
                  <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">
                    {companies.filter(c => c.is_verified).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Featured</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {companies.filter(c => c.is_featured).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {companies.filter(c => c.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {companies.filter(c => !c.is_verified && c.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Filters Indicator */}
        {(filters.search || filters.is_verified !== 'all' || filters.is_featured !== 'all' || 
          filters.is_active !== 'all' || filters.industry !== 'all' || filters.company_size !== 'all') && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Active filters applied - Some companies may not be visible
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({
                    search: '',
                    is_verified: 'all',
                    is_featured: 'all',
                    is_active: 'all',
                    industry: 'all',
                    company_size: 'all',
                    sort_by: 'created_at',
                    sort_order: 'desc',
                    page: 1,
                    per_page: 20
                  })}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <Input
                    placeholder="Company name, industry, location..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Verification Status</Label>
                  <Select value={filters.is_verified} onValueChange={(value) => handleFilterChange('is_verified', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Verified</SelectItem>
                      <SelectItem value="false">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Featured Status</Label>
                  <Select value={filters.is_featured} onValueChange={(value) => handleFilterChange('is_featured', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Featured</SelectItem>
                      <SelectItem value="false">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Active Status</Label>
                  <Select value={filters.is_active} onValueChange={(value) => handleFilterChange('is_active', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Industry</Label>
                  <Select value={filters.industry} onValueChange={(value) => handleFilterChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industryOptions.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Company Size</Label>
                  <Select value={filters.company_size} onValueChange={(value) => handleFilterChange('company_size', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      {companySizeOptions.map(size => (
                        <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sort By</Label>
                  <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Date Created</SelectItem>
                      <SelectItem value="name">Company Name</SelectItem>
                      <SelectItem value="industry">Industry</SelectItem>
                      <SelectItem value="company_size">Company Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sort Order</Label>
                  <Select value={filters.sort_order} onValueChange={(value) => handleFilterChange('sort_order', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={() => fetchCompanies(filters)} disabled={isLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({
                      search: '',
                      is_verified: 'all',
                      is_featured: 'all',
                      is_active: 'all',
                      industry: 'all',
                      company_size: 'all',
                      sort_by: 'created_at',
                      sort_order: 'desc',
                      page: 1,
                      per_page: 20
                    });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Companies ({pagination?.total || 0})
                </CardTitle>
                <CardDescription>
                  Showing {companies.length} of {pagination?.total || 0} companies
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {companies.length > 0 && (
                  <Checkbox
                    checked={selectedCompanies.size === companies.length}
                    onCheckedChange={handleSelectAll}
                  />
                )}
                <Label className="text-sm">Select All</Label>
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
                          checked={selectedCompanies.size === companies.length && companies.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Profile Score</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => {
                      const verification = getVerificationBadge(company.is_verified);
                      const sizeBadge = getCompanySizeBadge(company.company_size);
                      const activityBadge = getActivityBadge(company.is_active);
                      const profileScore = getCompanyScore(company);
                      
                      return (
                        <TableRow key={company.id} className={selectedCompanies.has(company.id) ? 'bg-blue-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCompanies.has(company.id)}
                              onCheckedChange={() => handleSelectCompany(company.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={company.logo_url} />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {company.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className="font-medium">{company.name}</div>
                                  {company.is_featured && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Crown className="h-4 w-4 text-yellow-500 fill-current" />
                                      </TooltipTrigger>
                                      <TooltipContent>Featured Company</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {company.is_verified && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Verified className="h-4 w-4 text-blue-500 fill-current" />
                                      </TooltipTrigger>
                                      <TooltipContent>Verified Company</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 space-y-1">
                                  {company.website && (
                                    <div className="flex items-center">
                                      <Globe className="h-3 w-3 mr-1" />
                                      <a 
                                        href={company.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline truncate max-w-40"
                                      >
                                        {company.website.replace(/^https?:\/\//, '')}
                                      </a>
                                    </div>
                                  )}
                                  {company.email && (
                                    <div className="flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      <span className="truncate max-w-40">{company.email}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <LocationIcon className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{getLocationString(company) || 'Not specified'}</span>
                              </div>
                              <div className="space-y-1">
                                <Badge className={`text-xs ${sizeBadge.color}`}>
                                  {sizeBadge.text}
                                </Badge>
                                {company.industry && (
                                  <Badge variant="outline" className="text-xs ml-1">
                                    {company.industry}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Badge variant={verification.variant} className="flex items-center space-x-1 w-fit">
                                <verification.icon className="h-3 w-3" />
                                <span>{verification.text}</span>
                              </Badge>
                              <Badge variant={activityBadge.variant} className="text-xs flex items-center space-x-1 w-fit">
                                <activityBadge.icon className="h-3 w-3" />
                                <span>{activityBadge.text}</span>
                              </Badge>
                              {company.is_featured && (
                                <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Progress value={profileScore} className="w-16 h-2" />
                                <span className="text-sm font-medium">{profileScore}%</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Profile Completeness
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center space-x-1">
                                <Briefcase className="h-3 w-3" />
                                <span>{formatNumber(company.jobs_count || 0)} jobs</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{company.company_size || 'Unknown'}</span>
                              </div>
                              {company.total_applications && (
                                <div className="text-xs text-gray-500">
                                  {formatNumber(company.total_applications)} applications
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{formatRelativeTime(company.created_at)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCompany(company);
                                  setShowCompanyDetails(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Full Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCompany(company);
                                  setShowEmailDialog(true);
                                }}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewJobs(company)}>
                                  <Briefcase className="h-4 w-4 mr-2" />
                                  View Job Postings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewAnalytics(company)}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Analytics
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Verification</DropdownMenuLabel>
                                {!company.is_verified ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowVerificationDialog(true);
                                    }}
                                    className="text-green-600"
                                  >
                                    {actionLoading[company.id] ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                    ) : (
                                      <Shield className="h-4 w-4 mr-2" />
                                    )}
                                    Verify Company
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleRevokeVerification(company.id)}
                                    className="text-yellow-600"
                                    disabled={actionLoading[company.id]}
                                  >
                                    {actionLoading[company.id] ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                                    ) : (
                                      <Shield className="h-4 w-4 mr-2" />
                                    )}
                                    Revoke Verification
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleFlagForReview(company)}>
                                  <Flag className="h-4 w-4 mr-2" />
                                  Flag for Review
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Management</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleFeatured(company.id)}
                                  disabled={actionLoading[company.id]}
                                >
                                  {actionLoading[company.id] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                  ) : (
                                    <Star className="h-4 w-4 mr-2" />
                                  )}
                                  {company.is_featured ? 'Remove Feature' : 'Make Featured'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(company.id)}
                                  disabled={actionLoading[company.id]}
                                >
                                  {actionLoading[company.id] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                                  ) : (
                                    <Target className="h-4 w-4 mr-2" />
                                  )}
                                  {company.is_active ? 'Suspend' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCompany(company)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Company
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                    disabled={!pagination.has_prev || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                    disabled={!pagination.has_next || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Details Modal */}
        <Dialog open={showCompanyDetails} onOpenChange={setShowCompanyDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Profile: {selectedCompany?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedCompany && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="verification">Verification</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Company Name</Label>
                          <p className="text-sm">{selectedCompany.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Industry</Label>
                          <p className="text-sm">{selectedCompany.industry || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Size</Label>
                          <p className="text-sm">{selectedCompany.company_size || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Location</Label>
                          <p className="text-sm">{getLocationString(selectedCompany) || 'Not specified'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Website</Label>
                          <p className="text-sm">
                            {selectedCompany.website ? (
                              <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {selectedCompany.website}
                              </a>
                            ) : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm">{selectedCompany.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Phone</Label>
                          <p className="text-sm">{selectedCompany.phone || 'Not provided'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedCompany.description || 'No description provided'}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="verification" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Verification Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Shield className={`h-5 w-5 ${selectedCompany.is_verified ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`font-medium ${selectedCompany.is_verified ? 'text-green-600' : 'text-gray-600'}`}>
                          {selectedCompany.is_verified ? 'Verified Company' : 'Unverified Company'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Profile Completeness</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={getCompanyScore(selectedCompany)} className="flex-1" />
                          <span className="text-sm font-medium">{getCompanyScore(selectedCompany)}%</span>
                        </div>
                      </div>
                      
                      {!selectedCompany.is_verified && (
                        <div className="space-y-2">
                          <Label>Verification Notes</Label>
                          <Textarea
                            placeholder="Add notes about the verification decision..."
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleVerifyCompany(selectedCompany.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve & Verify
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleVerifyCompany(selectedCompany.id, false)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="analytics" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Activity Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span>Job Postings</span>
                          <span className="font-medium">{selectedCompany.jobs_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profile Views</span>
                          <span className="font-medium">{selectedCompany.profile_views || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Applications Received</span>
                          <span className="font-medium">{selectedCompany.total_applications || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Account Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span>Member Since</span>
                          <span className="font-medium">{formatRelativeTime(selectedCompany.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated</span>
                          <span className="font-medium">{formatRelativeTime(selectedCompany.updated_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status</span>
                          <Badge variant={selectedCompany.is_active ? 'default' : 'destructive'}>
                            {selectedCompany.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Available Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full justify-start" onClick={() => {
                          setShowEmailDialog(true);
                          setShowCompanyDetails(false);
                        }}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email to Company
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            handleViewJobs(selectedCompany);
                            setShowCompanyDetails(false);
                          }}
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          View Job Postings
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            handleToggleFeatured(selectedCompany.id);
                            setShowCompanyDetails(false);
                          }}
                          disabled={actionLoading[selectedCompany?.id]}
                        >
                          {actionLoading[selectedCompany?.id] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          ) : (
                            <Star className="h-4 w-4 mr-2" />
                          )}
                          {selectedCompany?.is_featured ? 'Remove Feature Status' : 'Make Featured'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            handleFlagForReview(selectedCompany);
                            setShowCompanyDetails(false);
                          }}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Flag for Review
                        </Button>
                        <Separator />
                        <Button 
                          variant="destructive" 
                          className="w-full justify-start"
                          onClick={() => {
                            handleToggleStatus(selectedCompany.id);
                            setShowCompanyDetails(false);
                          }}
                          disabled={actionLoading[selectedCompany?.id]}
                        >
                          {actionLoading[selectedCompany?.id] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          ) : (
                            <Ban className="h-4 w-4 mr-2" />
                          )}
                          {selectedCompany?.is_active ? 'Suspend Company' : 'Activate Company'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Verification Dialog */}
        <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Company: {selectedCompany?.name}</DialogTitle>
              <DialogDescription>
                Review the company profile and decide whether to approve or reject their verification request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Verification Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about your verification decision..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVerificationDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleVerifyCompany(selectedCompany?.id, false)}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button 
                onClick={() => handleVerifyCompany(selectedCompany?.id, true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve & Verify
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email to {selectedCompany?.name}</DialogTitle>
              <DialogDescription>
                Send a direct email to the company contact.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <Input value={selectedCompany?.email || ''} disabled />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  placeholder="Email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Your message..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendEmail}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Actions Dialog */}
        <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Actions</DialogTitle>
              <DialogDescription>
                Perform actions on {selectedCompanies.size} selected companies.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                onClick={() => handleBulkAction('verify')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Verify Selected Companies
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleBulkAction('feature')}
              >
                <Star className="h-4 w-4 mr-2" />
                Toggle Featured Status
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleBulkAction('export')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
              <Separator />
              <Button 
                variant="destructive" 
                className="w-full justify-start" 
                onClick={() => handleBulkAction('suspend')}
              >
                <Ban className="h-4 w-4 mr-2" />
                Suspend Selected Companies
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkActions(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Companies</DialogTitle>
              <DialogDescription>
                Choose what data to export.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                onClick={() => {
                  handleExportAll();
                  setShowExportDialog(false);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Companies ({pagination?.total || 0})
              </Button>
              {selectedCompanies.size > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    handleExportSelected();
                    setShowExportDialog(false);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected Companies ({selectedCompanies.size})
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Company</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedCompany?.name}"? This action cannot be undone and will remove all associated data including job postings, applications, and company information.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteCompany}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Company
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default EnhancedCompanyManagement;
