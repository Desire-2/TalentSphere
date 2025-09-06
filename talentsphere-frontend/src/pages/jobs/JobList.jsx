import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Filter,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Users,
  TrendingUp,
  Star,
  Grid3X3,
  List,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  Zap,
  Award,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  Calendar,
  Briefcase
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, snakeToTitle } from '../../utils/helpers';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS } from '../../utils/constants';
import apiService from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import ShareJob from '../../components/jobs/ShareJob';

const JobList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    category_id: searchParams.get('category') || '',
    employment_type: searchParams.get('job_type') || '',
    experience_level: searchParams.get('experience_level') || '',
    salary_min: searchParams.get('salary_min') || '',
    salary_max: searchParams.get('salary_max') || ''
  });
  const [categories, setCategories] = useState([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState(new Set());
  const { user, isAuthenticated } = useAuthStore();

  // Helper functions for job data handling
  const getCompanyName = (job) => {
    // Handle both internal jobs (with company object) and external jobs (with external_company_name)
    return job.company?.name || job.external_company_name || 'Company Name';
  };

  const getCompanyLogo = (job) => {
    // Handle both internal jobs (with company object) and external jobs (with external_company_logo)
    return job.company?.logo || job.external_company_logo || null;
  };

  const getCompanyInitials = (companyName) => {
    return companyName
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'CO';
  };

  const getJobDescription = (job) => {
    // Use summary if available for a shorter description, fallback to full description
    return job.summary || job.description || 'No description available';
  };

  const getJobLocation = (job) => {
    if (job.location_type === 'remote' || job.is_remote) {
      return 'Remote';
    }
    
    if (job.location?.display) {
      return job.location.display;
    }
    
    // For external jobs, construct location from individual fields
    const parts = [];
    if (job.location_city || job.city) parts.push(job.location_city || job.city);
    if (job.location_state || job.state) parts.push(job.location_state || job.state);
    if (job.location_country || job.country) parts.push(job.location_country || job.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  };

  const getSalaryDisplay = (job) => {
    if (job.salary?.show_salary && job.salary?.min && job.salary?.max) {
      return `${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)}`;
    }
    if (job.salary_min && job.salary_max && job.show_salary !== false) {
      return `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}`;
    }
    return 'Not disclosed';
  };

  // Load job categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.getJobCategories();
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Count applied filters
  useEffect(() => {
    const count = Object.values(filters).filter(value => value && value !== '').length;
    setAppliedFiltersCount(count);
  }, [filters]);

  // Load jobs when filters change
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = {
          page: pagination.page,
          per_page: 20,
          ...filters
        };

        // Remove empty parameters
        Object.keys(params).forEach(key => {
          if (!params[key]) {
            delete params[key];
          }
        });

        const response = await apiService.getJobs(params);
        
        setJobs(response.jobs || []);
        setPagination(response.pagination || {
          page: 1,
          total: 0,
          pages: 0,
          has_next: false,
          has_prev: false
        });
      } catch (error) {
        console.error('Failed to load jobs:', error);
        setError(error.message || 'Failed to load jobs');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [filters, pagination.page]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));

    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) {
        // Map back to original URL param names for consistency
        const paramMap = {
          search: 'q',
          category_id: 'category',
          employment_type: 'job_type'
        };
        const paramKey = paramMap[k] || k;
        newSearchParams.set(paramKey, v);
      }
    });
    setSearchParams(newSearchParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Save search to recent searches
    if (filters.search && !recentSearches.includes(filters.search)) {
      const newSearches = [filters.search, ...recentSearches.slice(0, 4)];
      setRecentSearches(newSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
    }
  };

  const handleQuickSearch = (searchTerm) => {
    handleFilterChange('search', searchTerm);
  };

  const toggleBookmark = async (jobId) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    try {
      const newBookmarked = new Set(bookmarkedJobs);
      if (newBookmarked.has(jobId)) {
        await apiService.removeBookmark(jobId);
        newBookmarked.delete(jobId);
      } else {
        await apiService.bookmarkJob(jobId);
        newBookmarked.add(jobId);
      }
      setBookmarkedJobs(newBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      // You might want to show a toast notification here
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      category_id: '',
      employment_type: '',
      experience_level: '',
      salary_min: '',
      salary_max: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchParams({});
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header with Stats */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                  Find Your Dream Job
                </h1>
                <p className="text-lg text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Discover {pagination.total || 0} exciting opportunities
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">{pagination.total || 0} Jobs</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border">
                  <Building className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {new Set(jobs.map(job => getCompanyName(job))).size} Companies
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border">
                  <ExternalLink className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">
                    {jobs.filter(job => job.job_source === 'external').length} External Jobs
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-8 hover-lift"
          >
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Main Search Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="Job title, keywords, company name, or skills..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-12 h-12 text-lg border-2 border-gray-100 focus:border-blue-300 rounded-xl bg-white/50 backdrop-blur-sm transition-all"
                  />
                  {/* Recent Searches Dropdown */}
                  {recentSearches.length > 0 && filters.search === '' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10">
                      <div className="p-2 text-xs text-gray-500 bg-gray-50">Recent searches</div>
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleQuickSearch(search)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors"
                        >
                          <Clock className="w-3 h-3 inline mr-2 text-gray-400" />
                          {search}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:col-span-4 relative group">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="City, state, or remote work..."
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="pl-12 h-12 text-lg border-2 border-gray-100 focus:border-blue-300 rounded-xl bg-white/50 backdrop-blur-sm transition-all"
                  />
                </div>
                <div className="md:col-span-3">
                  <Button type="submit" size="lg" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all btn-primary-hover">
                    <Search className="w-5 h-5 mr-2" />
                    Search Jobs
                  </Button>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Advanced Filters
                  {appliedFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                      {appliedFiltersCount}
                    </Badge>
                  )}
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="salary_high">Salary: High to Low</SelectItem>
                        <SelectItem value="salary_low">Salary: Low to High</SelectItem>
                        <SelectItem value="relevance">Most Relevant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-white">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expandable Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <Separator className="mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Select value={filters.category_id || "all"} onValueChange={(value) => handleFilterChange('category_id', value === "all" ? "" : value)}>
                        <SelectTrigger className="h-11 border-2 border-gray-100 focus:border-blue-300 rounded-lg">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filters.employment_type || "all"} onValueChange={(value) => handleFilterChange('employment_type', value === "all" ? "" : value)}>
                        <SelectTrigger className="h-11 border-2 border-gray-100 focus:border-blue-300 rounded-lg">
                          <SelectValue placeholder="Job Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {Object.entries(JOB_TYPES).map(([key, value]) => (
                            <SelectItem key={key} value={value}>{snakeToTitle(value)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filters.experience_level || "all"} onValueChange={(value) => handleFilterChange('experience_level', value === "all" ? "" : value)}>
                        <SelectTrigger className="h-11 border-2 border-gray-100 focus:border-blue-300 rounded-lg">
                          <SelectValue placeholder="Experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {Object.entries(EXPERIENCE_LEVELS).map(([key, value]) => (
                            <SelectItem key={key} value={value}>{snakeToTitle(value)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button variant="outline" onClick={clearFilters} className="h-11 border-2 border-gray-100 hover:border-red-300 hover:text-red-600 transition-colors rounded-lg">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Button>
                    </div>

                    {/* Salary Range */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="number"
                            placeholder="Min salary"
                            value={filters.salary_min}
                            onChange={(e) => handleFilterChange('salary_min', e.target.value)}
                            className="pl-10 h-11 border-2 border-gray-100 focus:border-blue-300 rounded-lg"
                          />
                        </div>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="number"
                            placeholder="Max salary"
                            value={filters.salary_max}
                            onChange={(e) => handleFilterChange('salary_max', e.target.value)}
                            className="pl-10 h-11 border-2 border-gray-100 focus:border-blue-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Job Results */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <p className="text-lg text-gray-600 font-medium">Finding amazing opportunities...</p>
                <p className="text-sm text-gray-500 mt-2">This might take a moment</p>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-16 h-16 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
                <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </motion.div>
            ) : jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No jobs match your search</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Try adjusting your search criteria or explore different filters to find more opportunities
                </p>
                <Button onClick={clearFilters} variant="outline" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear all filters
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }
              >
                {jobs.map((job, index) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    index={index}
                    viewMode={viewMode}
                    isBookmarked={bookmarkedJobs.has(job.id)}
                    onToggleBookmark={toggleBookmark}
                    isAuthenticated={isAuthenticated}
                    getCompanyName={getCompanyName}
                    getCompanyLogo={getCompanyLogo}
                    getCompanyInitials={getCompanyInitials}
                    getJobDescription={getJobDescription}
                    getJobLocation={getJobLocation}
                    getSalaryDisplay={getSalaryDisplay}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Load More Section */}
          {jobs.length > 0 && pagination.has_next && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-12"
            >
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/20">
                <Button 
                  variant="ghost" 
                  size="lg"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={loading}
                  className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Jobs
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Showing {jobs.length} of {pagination.total} jobs
              </p>
              <div className="w-48 mx-auto mt-2">
                <Progress 
                  value={(jobs.length / pagination.total) * 100} 
                  className="h-1"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

// Enhanced Job Card Component
const JobCard = ({ 
  job, 
  index, 
  viewMode, 
  isBookmarked, 
  onToggleBookmark, 
  isAuthenticated,
  getCompanyName,
  getCompanyLogo,
  getCompanyInitials,
  getJobDescription,
  getJobLocation,
  getSalaryDisplay
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const getUrgencyColor = (applicationCount) => {
    if (applicationCount < 5) return 'bg-red-50 text-red-700 border-red-200';
    if (applicationCount < 20) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="group"
      >
        <Card className="hover-lift bg-white/80 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white hover:shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Company Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                  <AvatarImage src={getCompanyLogo(job)} alt={getCompanyName(job)} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                    {getCompanyInitials(getCompanyName(job))}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Job Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      {job.job_source === 'external' && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          External
                        </Badge>
                      )}
                      {job.is_featured && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white animate-glow">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {job.is_urgent && (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse">
                          <Zap className="w-3 h-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-lg text-gray-800 font-semibold">{getCompanyName(job)}</p>
                      {job.external_company_website && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                          asChild
                        >
                          <a href={job.external_company_website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Visit
                          </a>
                        </Button>
                      )}
                    </div>
                    <div className="mb-4 bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-700 leading-relaxed line-clamp-3">{getJobDescription(job)}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleBookmark(job.id)}
                          className="h-10 w-10 p-0 hover:bg-blue-50 group-hover:bg-blue-100 transition-colors"
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Bookmark className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
                      </TooltipContent>
                    </Tooltip>
                    
                    <ShareJob
                      job={job}
                      getCompanyName={getCompanyName}
                      getCompanyLogo={getCompanyLogo}
                      getJobDescription={getJobDescription}
                      getJobLocation={getJobLocation}
                      getSalaryDisplay={getSalaryDisplay}
                      trigger={
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-gray-50 transition-colors"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Share job</TooltipContent>
                        </Tooltip>
                      }
                    />
                  </div>
                </div>

                {/* Skills */}
                {job.required_skills && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm font-medium text-gray-600 mr-2 self-center">Required Skills:</span>
                    {job.required_skills.split(',').slice(0, 5).map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex} 
                        variant="outline" 
                        className="bg-blue-50/50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        {skill.trim()}
                      </Badge>
                    ))}
                    {job.required_skills.split(',').length > 5 && (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600">
                        +{job.required_skills.split(',').length - 5} more skills
                      </Badge>
                    )}
                  </div>
                )}

                {/* Job Meta Information */}
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="font-medium">
                        {getJobLocation(job)}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                      <span className="font-medium">
                        {getSalaryDisplay(job)}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="font-medium">{formatRelativeTime(job.created_at)}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge 
                        variant="outline" 
                        className="bg-indigo-50/50 text-indigo-700 border-indigo-200"
                      >
                        {snakeToTitle(job.employment_type)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Application Stats */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(job.statistics?.application_count || 0)}`}>
                      <Users className="w-3 h-3 inline mr-1" />
                      {job.statistics?.application_count || 0} applied
                    </div>

                    {/* View Job Button */}
                    <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
                      <Link to={`/jobs/${job.id}`} className="flex items-center">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group stagger-item"
    >
      <Card className="h-full hover-lift bg-white/80 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white hover:shadow-2xl hover:border-blue-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-4">
            {/* Company Avatar and Basic Info */}
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="w-14 h-14 border-2 border-white shadow-md ring-2 ring-blue-100">
                <AvatarImage src={getCompanyLogo(job)} alt={getCompanyName(job)} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                  {getCompanyInitials(getCompanyName(job))}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {job.title}
                  </h3>
                </div>
                
                {/* Enhanced Company Info */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-800 font-semibold">{getCompanyName(job)}</p>
                    {job.external_company_website && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 px-2 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                        asChild
                      >
                        <a href={job.external_company_website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-2 h-2 mr-1" />
                          Visit
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{getJobLocation(job)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bookmark Button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleBookmark(job.id)}
                className="h-9 w-9 p-0 hover:bg-blue-50 transition-colors"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-blue-600" />
                ) : (
                  <Bookmark className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                )}
              </Button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {job.job_source === 'external' && (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                External
              </Badge>
            )}
            {job.is_featured && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white animate-glow text-xs">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {job.is_urgent && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
            <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-200 text-xs">
              {snakeToTitle(job.employment_type)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Enhanced Job Description */}
            <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
              <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                {getJobDescription(job)}
              </p>
            </div>
            
            {/* Skills */}
            {job.required_skills && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-medium text-gray-600 mr-2 self-center">Skills:</span>
                {job.required_skills.split(',').slice(0, 4).map((skill, skillIndex) => (
                  <Badge 
                    key={skillIndex} 
                    variant="outline" 
                    className="bg-blue-50/50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors text-xs"
                  >
                    {skill.trim()}
                  </Badge>
                ))}
                {job.required_skills.split(',').length > 4 && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">
                    +{job.required_skills.split(',').length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Job Details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-3 h-3 mr-1 text-green-500" />
                  <span className="font-medium">
                    {getSalaryDisplay(job)}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-3 h-3 mr-1 text-purple-500" />
                  <span className="font-medium">{formatRelativeTime(job.created_at)}</span>
                </div>
              </div>
              
              {/* Application Count */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(job.statistics?.application_count || 0)}`}>
                  <Users className="w-3 h-3 inline mr-1" />
                  {job.statistics?.application_count || 0} applied
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-3 h-3 text-gray-400" />
                  </Button>
                  <ShareJob
                    job={job}
                    getCompanyName={getCompanyName}
                    getCompanyLogo={getCompanyLogo}
                    getJobDescription={getJobDescription}
                    getJobLocation={getJobLocation}
                    getSalaryDisplay={getSalaryDisplay}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-gray-50 transition-colors"
                      >
                        <Share2 className="w-3 h-3 text-gray-400" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* View Job Button */}
            <Button 
              asChild 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all btn-primary-hover"
            >
              <Link to={`/jobs/${job.id}`} className="flex items-center justify-center">
                View Details
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobList;

