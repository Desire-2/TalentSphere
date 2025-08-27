import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Users, 
  TrendingUp, 
  Star,
  ArrowRight,
  CheckCircle,
  Building,
  DollarSign,
  Clock,
  Target,
  ExternalLink,
  Zap,
  Award,
  Eye,
  MousePointer,
  Loader2,
  Shield
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../utils/helpers';
import FeaturedAdsCarousel from '../components/FeaturedAdsCarousel';
import apiService from '../services/api';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState({
    featuredJobs: true,
    categories: true,
    companies: true
  });

  // API states for stats
  const [stats, setStats] = useState({
    activeJobs: 0,
    companies: 0,
    jobSeekers: 0,
    successRate: '0%'
  });

  // Load stats from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        // For now, we'll calculate basic stats from the data we load
        // In production, create a dedicated /public/stats endpoint
        const [jobsResponse, companiesResponse] = await Promise.all([
          apiService.get('/jobs').catch(() => ({ jobs: [] })),
          apiService.get('/companies').catch(() => ({ companies: [] }))
        ]);

        const activeJobs = jobsResponse.jobs?.length || 0;
        const companies = companiesResponse.companies?.length || 0;
        
        setStats({
          activeJobs: activeJobs,
          companies: companies,
          jobSeekers: Math.floor(activeJobs * 2.5), // Estimated based on jobs
          successRate: '85%' // Static for now
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        // Keep default stats if API fails
      }
    };

    loadStats();
  }, []);

  // Load featured jobs from API
  useEffect(() => {
    const loadFeaturedJobs = async () => {
      try {
        setLoading(prev => ({ ...prev, featuredJobs: true }));
        const response = await apiService.get('/public/featured-jobs?limit=6');
        if (response.featured_jobs) {
          setFeaturedJobs(response.featured_jobs);
        }
      } catch (error) {
        console.error('Error loading featured jobs:', error);
        setFeaturedJobs([]); // Set empty array on error
      } finally {
        setLoading(prev => ({ ...prev, featuredJobs: false }));
      }
    };

    loadFeaturedJobs();
  }, []);

  // Load job categories from API  
  useEffect(() => {
    const loadJobCategories = async () => {
      try {
        setLoading(prev => ({ ...prev, categories: true }));
        const response = await apiService.get('/job-categories');
        if (response.categories) {
          const categoriesWithIcons = response.categories.map(category => ({
            ...category,
            icon: getCategoryIcon(category.name)
          }));
          setJobCategories(categoriesWithIcons);
        }
      } catch (error) {
        console.error('Error loading job categories:', error);
        setJobCategories([]);
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    loadJobCategories();
  }, []);

  // Load companies from API
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(prev => ({ ...prev, companies: true }));
        const response = await apiService.get('/companies?limit=8');
        if (response.companies) {
          setCompanies(response.companies);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        setCompanies([]);
      } finally {
        setLoading(prev => ({ ...prev, companies: false }));
      }
    };

    loadCompanies();
  }, []);

  // Helper function to get category icons
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Technology': '💻',
      'Healthcare': '⚕️',
      'Finance': '💰',
      'Education': '📚',
      'Marketing': '📈',
      'Engineering': '⚙️',
      'Sales': '📊',
      'Design': '🎨',
      'Human Resources': '👥',
      'Operations': '⚡',
      'Customer Service': '🎧',
      'Legal': '⚖️',
      'Consulting': '💼',
      'Real Estate': '🏠',
      'Manufacturing': '🏭',
      'Retail': '🛍️',
      'Transportation': '🚗',
      'Media': '📺',
      'Non-Profit': '🤝',
      'Government': '🏛️'
    };
    return iconMap[categoryName] || '💼';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to jobs page with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (location) params.append('location', location);
    window.location.href = `/jobs?${params.toString()}`;
  };

  // Loading skeleton component
  const LoadingSkeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Featured Advertisements Carousel */}
      <section className="mb-16 relative z-10">
        <FeaturedAdsCarousel />
      </section>

      {/* Hero Section - Ultra Enhanced UI */}
      <section className="relative py-32 px-4 mb-32 overflow-hidden">
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90 backdrop-blur-sm"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.1'%3e%3cpath d='m30 54c13.255 0 24-10.745 24-24s-10.745-24-24-24-24 10.745-24 24 10.745 24 24 24zm0-6c9.941 0 18-8.059 18-18s-8.059-18-18-18-18 8.059-18 18 8.059 18 18 18z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Dynamic Light Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-conic from-blue-400 via-purple-400 to-pink-400 opacity-30 rounded-full blur-3xl animate-spin-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-conic from-cyan-400 via-indigo-400 to-blue-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Main Heading with Advanced Typography */}
          <div className="mb-12">
            <h1 className="text-7xl md:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-100 animate-slide-in-left leading-tight tracking-tight">
              Find Your
            </h1>
            <h1 className="text-7xl md:text-8xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 animate-slide-in-right leading-tight tracking-tight">
              Dream Job
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl mb-12 text-blue-100 animate-fade-in font-light leading-relaxed max-w-3xl mx-auto" style={{animationDelay: '0.3s'}}>
            Join over <span className="font-bold text-yellow-300">{stats.jobSeekers}</span> professionals who discovered their perfect career match through our AI-powered platform
          </p>

          {/* Enhanced Search Form with Glassmorphism */}
          <form onSubmit={handleSearch} className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl max-w-5xl mx-auto animate-scale-in hover:bg-white/25 transition-all duration-300" style={{animationDelay: '0.5s'}}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 group-hover:text-white w-6 h-6 transition-colors" />
                <Input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  className="pl-14 h-16 text-white placeholder:text-white/60 focus-ring text-lg rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm focus:bg-white/20 hover:bg-white/15 transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 group-hover:text-white w-6 h-6 transition-colors" />
                <Input
                  type="text"
                  placeholder="City, state, or remote"
                  className="pl-14 h-16 text-white placeholder:text-white/60 focus-ring text-lg rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm focus:bg-white/20 hover:bg-white/15 transition-all duration-300"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-16 group text-lg font-bold rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-gray-900 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 hover:from-yellow-300 hover:via-orange-300 hover:to-red-300">
                <Search className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Search Jobs
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>
          </form>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/80 animate-fade-in" style={{animationDelay: '0.7s'}}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live Jobs: {stats.activeJobs}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium">Verified Companies</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">{stats.successRate} Success Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Ultra Modern Design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-32 px-4 max-w-7xl mx-auto">
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white/90">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {stats.activeJobs}
            </div>
            <div className="text-gray-600 font-semibold text-lg mb-2">Active Jobs</div>
            <div className="text-sm text-gray-500">Updated daily</div>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white/90">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Building className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {stats.companies}
            </div>
            <div className="text-gray-600 font-semibold text-lg mb-2">Companies</div>
            <div className="text-sm text-gray-500">Verified partners</div>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white/90">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {stats.jobSeekers}
            </div>
            <div className="text-gray-600 font-semibold text-lg mb-2">Job Seekers</div>
            <div className="text-sm text-gray-500">Active candidates</div>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white/90">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {stats.successRate}
            </div>
            <div className="text-gray-600 font-semibold text-lg mb-2">Success Rate</div>
            <div className="text-sm text-gray-500">Placement success</div>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Featured Jobs - Ultra Modern Design */}
      <section className="py-24 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23374151' fill-opacity='1'%3e%3cpath d='M20 20c11.046 0 20-8.954 20-20H0c0 11.046 8.954 20 20 20z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-sm font-semibold text-gray-700">Featured Opportunities</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 animate-slide-in-left leading-tight">
              Featured Jobs
            </h2>
            <p className="text-xl text-gray-600 animate-slide-in-right max-w-2xl mx-auto leading-relaxed">
              Handpicked opportunities from top companies actively seeking exceptional talent
            </p>
          </div>

          {loading.featuredJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="animate-pulse overflow-hidden rounded-3xl">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <LoadingSkeleton className="w-16 h-16 rounded-2xl" />
                        <div className="space-y-3">
                          <LoadingSkeleton className="h-5 w-32" />
                          <LoadingSkeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <LoadingSkeleton className="h-8 w-20 rounded-full" />
                    </div>
                    <div className="space-y-4">
                      <LoadingSkeleton className="h-4 w-full" />
                      <LoadingSkeleton className="h-4 w-3/4" />
                      <LoadingSkeleton className="h-4 w-1/2" />
                      <LoadingSkeleton className="h-12 w-full rounded-2xl mt-6" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Briefcase className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">No Featured Jobs Available</h3>
              <p className="text-gray-500 mb-8 text-lg">Check back later for exciting new opportunities</p>
              <Button asChild className="hover-lift bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl text-lg font-semibold">
                <Link to="/jobs">Browse All Jobs</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredJobs.map((job, index) => (
                <div key={job.id} className="group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white/90">
                    {/* Card Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Featured Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold px-3 py-1 rounded-full shadow-lg border-0">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    </div>

                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            {job.company_logo ? (
                              <img src={job.company_logo} alt={job.company} className="w-full h-full object-cover" />
                            ) : (
                              <Building className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300">{job.title}</CardTitle>
                            <CardDescription className="text-blue-600 font-semibold text-base">{job.company}</CardDescription>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors">
                          <MapPin className="w-5 h-5 mr-3 text-blue-500" />
                          <span className="font-medium">
                            {typeof job.location === 'string' ? job.location : 
                             job.location?.display || 
                             `${job.location?.city || ''}${job.location?.city && job.location?.state ? ', ' : ''}${job.location?.state || ''}` || 
                             'Location not specified'}
                            {job.is_remote && (
                              <Badge variant="outline" className="ml-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full">
                                Remote
                              </Badge>
                            )}
                          </span>
                        </div>
                        
                        {job.salary_min && job.salary_max && (
                          <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors">
                            <DollarSign className="w-5 h-5 mr-3 text-emerald-500" />
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
                              {job.salary_currency && job.salary_currency !== 'USD' && ` ${job.salary_currency}`}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors">
                          <Clock className="w-5 h-5 mr-3 text-orange-500" />
                          <span className="font-medium">
                            {job.posted_at ? formatRelativeTime(job.posted_at) : 'Recently posted'}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors">
                          <Briefcase className="w-5 h-5 mr-3 text-purple-500" />
                          <span className="font-medium">
                            {job.type ? job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Full Time'}
                          </span>
                        </div>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-0" asChild>
                        <Link to={`/jobs/${job.id}`}>
                          <span className="flex items-center justify-center">
                            View Details
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </span>
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button variant="outline" size="lg" asChild className="hover-lift border-2 border-gray-200 hover:border-blue-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <Link to="/jobs">
                <span className="flex items-center">
                  View All Jobs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Job Categories - Modern Design */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-6 shadow-lg border border-white/20">
              <Target className="w-5 h-5 text-purple-500 mr-2" />
              <span className="text-sm font-semibold text-gray-700">Explore Opportunities</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 leading-tight">
              Browse by Category
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Find opportunities perfectly matched to your skills and interests across diverse industries
            </p>
          </div>

          {loading.categories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="text-center animate-pulse overflow-hidden rounded-3xl">
                  <CardContent className="p-8">
                    <LoadingSkeleton className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
                    <LoadingSkeleton className="h-5 w-20 mx-auto mb-2" />
                    <LoadingSkeleton className="h-4 w-16 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobCategories.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Target className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">No Job Categories Available</h3>
              <p className="text-gray-500 text-lg">Categories will appear here as jobs are added</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {jobCategories.map((category, index) => (
                <Link
                  key={category.id || index}
                  to={`/jobs?category=${encodeURIComponent(category.name)}`}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="text-center overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-white/90 group-hover:border-purple-200 relative">
                    {/* Hover Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <CardContent className="p-8 relative z-10">
                      <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-500 filter group-hover:drop-shadow-lg">
                        {category.icon}
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors duration-300 text-lg">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                        {category.job_count || category.count || 0} jobs
                      </p>
                      
                      {/* Bottom accent line */}
                      <div className="w-8 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto mt-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-x-0 group-hover:scale-x-100 transition-all duration-300"></div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Companies - Ultra Modern Design */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='1'%3e%3cpath d='M50 50c27.614 0 50-22.386 50-50H0c0 27.614 22.386 50 50 50z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full mb-6">
              <Building className="w-5 h-5 text-emerald-600 mr-2" />
              <span className="text-sm font-semibold text-gray-700">Trusted Partners</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-emerald-900 to-blue-900 leading-tight">
              Top Companies
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Join industry leaders, innovative startups, and Fortune 500 companies seeking exceptional talent
            </p>
          </div>

          {loading.companies ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="text-center animate-pulse overflow-hidden rounded-3xl">
                  <CardContent className="p-8">
                    <LoadingSkeleton className="w-20 h-20 rounded-2xl mx-auto mb-6" />
                    <LoadingSkeleton className="h-5 w-24 mx-auto mb-2" />
                    <LoadingSkeleton className="h-4 w-20 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Building className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">No Companies Available</h3>
              <p className="text-gray-500 text-lg">Companies will appear here as they join our platform</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {companies.map((company, index) => (
                <Link
                  key={company.id || index}
                  to={`/companies/${company.id || encodeURIComponent(company.name)}`}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="text-center overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white relative">
                    {/* Card Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Success Indicator */}
                    <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    
                    <CardContent className="p-8 relative z-10">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl border border-gray-100">
                        {company.logo_url || company.logo ? (
                          <img 
                            src={company.logo_url || company.logo} 
                            alt={company.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 text-lg">
                        {company.name}
                      </h3>
                      
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Briefcase className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-600 font-medium">
                          {company.job_count || company.jobs || 0} open positions
                        </span>
                      </div>
                      
                      {/* Rating Stars */}
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      
                      {/* Bottom accent line */}
                      <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mt-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-x-0 group-hover:scale-x-100 transition-all duration-300"></div>
                    </CardContent>
                    
                    {/* Hover Border Effect */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-blue-200 transition-colors duration-300"></div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button variant="outline" size="lg" asChild className="hover-lift border-2 border-gray-200 hover:border-emerald-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-emerald-600 px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <Link to="/companies">
                <span className="flex items-center">
                  View All Companies
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just a few simple steps and land your dream job
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center animate-fade-in relative" style={{ animationDelay: '0.1s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <div className="absolute top-10 right-0 hidden md:block">
                <ArrowRight className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Your Profile</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Build a comprehensive profile showcasing your skills, experience, and career aspirations
              </p>
            </div>

            <div className="text-center animate-fade-in relative" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Search className="w-10 h-10 text-green-600" />
              </div>
              <div className="absolute top-10 right-0 hidden md:block">
                <ArrowRight className="w-8 h-8 text-green-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Search & Apply</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Browse thousands of jobs from top companies and apply to positions that match your goals
              </p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Hired</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Connect with employers, showcase your potential, and land your dream job
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-96 h-96 bg-white opacity-10 rounded-full blur-3xl absolute -top-32 -left-32"></div>
          <div className="w-72 h-72 bg-pink-300 opacity-20 rounded-full blur-3xl absolute -bottom-32 -right-32"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Find Your Next Opportunity?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of professionals who have found their dream jobs through TalentSphere
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button size="lg" variant="secondary" asChild className="hover-lift px-8 py-4 text-lg font-bold bg-white text-blue-700 hover:bg-gray-100">
              <Link to="/register">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600 hover-lift px-8 py-4 text-lg font-bold" asChild>
              <Link to="/jobs">
                Browse Jobs
                <Eye className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center justify-center space-x-8 text-blue-100">
            <div className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              <span>Trusted by {stats.companies} companies</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>{stats.jobSeekers} job seekers</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
