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
  Shield,
  GraduationCap,
  Calendar,
  Globe,
  BookOpen,
  Timer,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../utils/helpers';
import FeaturedAdsCarousel from '../components/FeaturedAdsCarousel';
import apiService from '../services/api';
import { scholarshipService } from '../services/scholarship';
import SEOHelmet from '../components/seo/SEOHelmet';
import { generateWebsiteStructuredData, generateKeywords } from '../utils/seoUtils';
import { LeaderboardAd, ResponsiveAd, SquareAd } from '../components/ads/AdComponents';
import { useAdTracking } from '../utils/adTracking';

// Helper function to convert snake_case to Title Case
const snakeToTitle = (str) => {
  if (!str) return '';
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [searchType, setSearchType] = useState('jobs'); // 'jobs' or 'scholarships'
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [featuredScholarships, setFeaturedScholarships] = useState([]);
  const [loading, setLoading] = useState({
    featuredJobs: true,
    scholarships: true
  });
  const [error, setError] = useState(null);
  
  // Initialize ad tracking
  const adTracking = useAdTracking();

  // API states for stats
  const [stats, setStats] = useState({
    activeJobs: 0,
    scholarships: 0,
    totalUsers: 0,
    successRate: '95%'
  });

  // Load stats from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [jobsResponse, scholarshipsResponse] = await Promise.all([
          apiService.get('/jobs').catch(() => ({ jobs: [] })),
          scholarshipService.getScholarships().catch(() => ({ scholarships: [] }))
        ]);

        const activeJobs = jobsResponse.jobs?.length || 0;
        const scholarships = scholarshipsResponse.scholarships?.length || 0;
        
        setStats({
          activeJobs: activeJobs,
          scholarships: scholarships,
          totalUsers: Math.floor((activeJobs + scholarships) * 3.2), // Estimated
          successRate: '95%'
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, []);

  // Load all jobs from API
  useEffect(() => {
    const loadFeaturedJobs = async () => {
      try {
        setLoading(prev => ({ ...prev, featuredJobs: true }));
        // Load all jobs instead of just featured ones
        const response = await apiService.get('/jobs?per_page=12'); // Get more jobs
        if (response.jobs) {
          setFeaturedJobs(response.jobs);
        }
      } catch (error) {
        console.error('Error loading jobs:', error);
        setFeaturedJobs([]);
      } finally {
        setLoading(prev => ({ ...prev, featuredJobs: false }));
      }
    };

    loadFeaturedJobs();
  }, []);

  // Load featured scholarships
  useEffect(() => {
    const loadFeaturedScholarships = async () => {
      try {
        setLoading(prev => ({ ...prev, scholarships: true }));
        const response = await scholarshipService.getScholarships({ limit: 6, status: 'published' });
        if (response.scholarships) {
          setFeaturedScholarships(response.scholarships.slice(0, 6));
        }
      } catch (error) {
        console.error('Error loading featured scholarships:', error);
        setFeaturedScholarships([]);
      } finally {
        setLoading(prev => ({ ...prev, scholarships: false }));
      }
    };

    loadFeaturedScholarships();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (location) params.append('location', location);
    
    const baseUrl = searchType === 'jobs' ? '/jobs' : '/scholarships';
    window.location.href = `${baseUrl}?${params.toString()}`;
  };

  // Format scholarship deadline
  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks left`;
    return date.toLocaleDateString();
  };

  const getDeadlineColor = (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 7) return 'text-orange-600';
    if (diffDays <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Loading skeleton component
  const LoadingSkeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  // Safe render functions to handle object data
  const safeRenderLocation = (location) => {
    if (!location) return 'Remote';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      if (location.display) return location.display;
      if (location.city && location.country) return `${location.city}, ${location.country}`;
      if (location.city && location.state) return `${location.city}, ${location.state}`;
      if (location.city) return location.city;
      if (location.country) return location.country;
    }
    return 'Remote';
  };

  const safeRenderText = (value, defaultValue = '') => {
    if (!value) return defaultValue;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.display) return value.display;
      if (value.name) return value.name;
      if (value.title) return value.title;
    }
    return defaultValue;
  };

  // SEO data
  const homeKeywords = generateKeywords(
    ['job search', 'career opportunities', 'recruitment platform', 'talent acquisition'],
    ['hiring', 'employment', 'career development', 'professional growth', 'scholarships', 'education funding']
  );
  const websiteStructuredData = generateWebsiteStructuredData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* SEO Meta Tags */}
      <SEOHelmet
        title="TalentSphere - Connect Talent with Opportunities"
        description="Discover your next career opportunity or find the perfect candidate. TalentSphere connects talented professionals with leading companies worldwide. Find jobs, scholarships, and career resources."
        keywords={homeKeywords}
        type="website"
        image="/home-og-image.jpg"
        canonical={window.location.origin}
        structuredData={websiteStructuredData}
      />
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Featured Advertisements Carousel */}
      <section className="mb-8 relative z-10">
        <FeaturedAdsCarousel />
      </section>

      {/* Hero Section - Enhanced for Jobs & Scholarships */}
      <section className="relative py-20 px-4 mb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90 backdrop-blur-sm"></div>
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.1'%3e%3cpath d='m30 54c13.255 0 24-10.745 24-24s-10.745-24-24-24-24 10.745-24 24 10.745 24 24 24zm0-6c9.941 0 18-8.059 18-18s-8.059-18-18-18-18 8.059-18 18 8.059 18 18 18z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-100 leading-tight">
              Discover Your Future
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 leading-tight">
              Jobs & Scholarships
            </h2>
          </div>
          
          <p className="text-lg md:text-xl mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Your gateway to career opportunities and educational funding. Find the perfect job or scholarship that matches your goals.
          </p>

          {/* Enhanced Search Form with Toggle */}
          <form onSubmit={handleSearch} className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl max-w-4xl mx-auto">
            {/* Search Type Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 rounded-2xl p-1 flex">
                <button
                  type="button"
                  onClick={() => setSearchType('jobs')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center ${
                    searchType === 'jobs' 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  Jobs
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('scholarships')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center ${
                    searchType === 'scholarships' 
                      ? 'bg-white text-purple-600 shadow-lg' 
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Scholarships
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                <Input
                  type="text"
                  placeholder={searchType === 'jobs' ? "Job title or keywords" : "Scholarship title or field"}
                  className="pl-12 h-14 text-white placeholder:text-white/60 text-lg rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm focus:bg-white/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Location or country"
                  className="pl-12 h-14 text-white placeholder:text-white/60 text-lg rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm focus:bg-white/20"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Search className="w-5 h-5 mr-2" />
                Search {searchType === 'jobs' ? 'Jobs' : 'Scholarships'}
              </Button>
            </div>
          </form>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-white/80">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{stats.activeJobs} Active Jobs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{stats.scholarships} Scholarships</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium">{stats.successRate} Success Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Google Ads - Leaderboard */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex justify-center">
          <LeaderboardAd className="rounded-lg shadow-sm" />
        </div>
      </section>

      {/* All Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-4"></div>
            <Briefcase className="w-8 h-8 text-blue-600" />
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full ml-4"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Latest Jobs
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover all available job opportunities from top companies across various industries
          </p>
        </div>

        {loading.featuredJobs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl">
                <LoadingSkeleton className="h-16 w-16 rounded-2xl mb-4" />
                <LoadingSkeleton className="h-6 w-3/4 mb-2" />
                <LoadingSkeleton className="h-4 w-1/2 mb-4" />
                <LoadingSkeleton className="h-4 w-full mb-2" />
                <LoadingSkeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredJobs.length > 0 ? featuredJobs.map((job, index) => {
              // Debug: Log external job data
              if (job.is_external || job.job_source || job.external_company_name || job.external_company_logo) {
                console.log('External job found:', {
                  id: job.id,
                  title: job.title,
                  external_company_name: job.external_company_name,
                  external_company_logo: job.external_company_logo,
                  job_source: job.job_source,
                  is_external: job.is_external,
                  company: job.company
                });
              }
              
              return (
              <Card 
                key={job.id} 
                className="group bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:scale-105 hover:bg-white/80 cursor-pointer animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 rounded-2xl overflow-hidden">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center border-2 border-white shadow-md">
                        {job.company?.logo_url ? (
                          <img 
                            src={job.company.logo_url} 
                            alt={`${job.company?.name || job.external_company_name || 'Company'} logo`} 
                            className="w-14 h-14 object-contain rounded-xl"
                            onError={(e) => {
                              console.log('Logo failed to load:', job.company.logo_url);
                              e.target.style.display = 'none';
                              e.target.parentNode.querySelector('.fallback-icon').style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`fallback-icon w-14 h-14 flex items-center justify-center ${job.company?.logo_url ? 'hidden' : 'flex'}`}>
                          {(job.is_external || job.job_source || job.external_company_name) ? (
                            <div className="flex flex-col items-center text-blue-600">
                              <ExternalLink className="w-5 h-5 mb-1" />
                              <Building className="w-4 h-4" />
                            </div>
                          ) : (
                            <Building className="w-8 h-8 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {/* External Job Badge */}
                      {(job.is_external || job.job_source || job.external_company_name) && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          External
                        </Badge>
                      )}
                      {job.is_featured && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {job.is_urgent && (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                          <Zap className="w-3 h-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 group-hover:bg-green-200 transition-colors">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatRelativeTime(job.created_at || job.posted_date)}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {safeRenderText(job.title)}
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium mb-1">
                    {/* Enhanced company name display for external jobs */}
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        {safeRenderText(job.external_company_name || job.company?.name || job.company_name)}
                      </span>
                      {(job.is_external || job.job_source || job.external_company_name) && (
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 px-2 py-0.5">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            External
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardDescription>
                  {/* Enhanced description for external jobs */}
                  {(job.company?.description || job.external_company_description) && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {job.external_company_description || job.company.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">
                        {job.location?.is_remote 
                          ? 'Remote' 
                          : (job.location?.display 
                              ? safeRenderText(job.location.display)
                              : safeRenderLocation(job.location)
                            )
                        }
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {job.salary?.show_salary && job.salary?.min && job.salary?.max 
                          ? `${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)}`
                          : job.salary?.display 
                            ? safeRenderText(job.salary.display)
                            : job.salary_range 
                              ? safeRenderText(job.salary_range)
                              : 'Salary not disclosed'
                        }
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
                      <span className="text-sm">{snakeToTitle(job.employment_type || job.job_type || 'full_time')}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm">{job.statistics?.application_count || job.applications_count || 0} applicants</span>
                    </div>
                    {/* Enhanced external job source display */}
                    {(job.job_source || job.is_external || job.external_company_name) && (
                      <div className="flex items-center text-gray-600">
                        <ExternalLink className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-orange-600">
                          {job.job_source ? `Source: ${job.job_source}` : 'External Job'}
                        </span>
                        {job.source_url && (
                          <a 
                            href={job.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-xs text-blue-500 hover:text-blue-700 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Original
                          </a>
                        )}
                      </div>
                    )}
                    {job.years_experience_min !== undefined && (
                      <div className="flex items-center text-gray-600">
                        <Award className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                        <span className="text-sm">
                          {job.years_experience_min === 0 && !job.years_experience_max 
                            ? 'No experience required'
                            : job.years_experience_max 
                              ? `${job.years_experience_min}-${job.years_experience_max} years`
                              : `${job.years_experience_min}+ years`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Job Type Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* External Job Priority Badge */}
                    {(job.is_external || job.job_source || job.external_company_name) && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300 font-semibold">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {job.job_source || 'External Job'}
                      </Badge>
                    )}
                    {job.category?.name && (
                      <Badge variant="outline" className="text-xs">
                        {job.category.name}
                      </Badge>
                    )}
                    {job.experience_level && (
                      <Badge variant="outline" className="text-xs">
                        {snakeToTitle(job.experience_level)}
                      </Badge>
                    )}
                    {job.location?.is_remote && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                        Remote OK
                      </Badge>
                    )}
                    {job.location?.type === 'hybrid' && (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                        Hybrid
                      </Badge>
                    )}
                    {job.visa_sponsorship && (
                      <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                        Visa Sponsorship
                      </Badge>
                    )}
                  </div>

                  {/* Summary or Description Preview */}
                  {(job.summary || job.description) && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {job.summary || (job.description && job.description.substring(0, 150) + '...')}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <Link 
                        to={`/jobs/${job.id}`}
                        className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors group-hover:scale-105 transform duration-300"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                      {job.statistics?.view_count && (
                        <div className="flex items-center text-gray-500">
                          <Eye className="w-3 h-3 mr-1" />
                          <span className="text-xs">{job.statistics.view_count}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* External Job Indicator */}
                      {(job.application_type && job.application_type !== 'internal') || (job.is_external || job.job_source || job.external_company_name) ? (
                        <div className="flex items-center bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                          <ExternalLink className="w-3 h-3 text-orange-600 mr-1" />
                          <span className="text-xs text-orange-700 font-medium">External Apply</span>
                        </div>
                      ) : (
                        <div className="flex items-center bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                          <CheckCircle className="w-3 h-3 text-blue-600 mr-1" />
                          <span className="text-xs text-blue-700 font-medium">Direct Apply</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            }) : (
              <div className="col-span-full text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Jobs Available</h3>
                <p className="text-gray-500">Check back later for new opportunities</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/jobs">
            <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Browse More Jobs
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Google Ads - Responsive between sections */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex justify-center">
          <ResponsiveAd className="rounded-lg shadow-sm" />
        </div>
      </section>

      {/* Featured Scholarships Section */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-4"></div>
            <GraduationCap className="w-8 h-8 text-purple-600" />
            <div className="w-12 h-1 bg-gradient-to-r from-pink-500 to-purple-400 rounded-full ml-4"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Featured Scholarships
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock your educational potential with funding opportunities from renowned institutions
          </p>
        </div>

        {loading.scholarships ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl">
                <LoadingSkeleton className="h-16 w-16 rounded-2xl mb-4" />
                <LoadingSkeleton className="h-6 w-3/4 mb-2" />
                <LoadingSkeleton className="h-4 w-1/2 mb-4" />
                <LoadingSkeleton className="h-4 w-full mb-2" />
                <LoadingSkeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredScholarships.length > 0 ? featuredScholarships.map((scholarship, index) => (
              <Card 
                key={scholarship.id} 
                className="group bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:scale-105 hover:bg-white/80 cursor-pointer animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      {scholarship.external_organization_name?.charAt(0) || scholarship.university_name?.charAt(0) || scholarship.provider?.charAt(0) || scholarship.title?.charAt(0) || 'S'}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {scholarship.category?.name && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                          {scholarship.category.name}
                        </Badge>
                      )}
                      {scholarship.scholarship_type && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {scholarship.scholarship_type.replace('_', ' ')}
                        </Badge>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`${getDeadlineColor(scholarship.application_deadline || scholarship.deadline)} bg-white border transition-colors text-xs`}
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDeadline(scholarship.application_deadline || scholarship.deadline)}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                    {safeRenderText(scholarship.title)}
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium mb-1">
                    {safeRenderText(scholarship.external_organization_name || scholarship.university_name || scholarship.provider)}
                  </CardDescription>
                  {scholarship.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {scholarship.description.substring(0, 100)}...
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-bold text-green-600">
                        {scholarship.award_amount 
                          ? `$${scholarship.award_amount.toLocaleString()}`
                          : formatCurrency(scholarship.amount) || 'Amount not specified'
                        }
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">
                        {safeRenderText(scholarship.eligible_programs || scholarship.field_of_study || 'All Fields')}
                      </span>
                    </div>
                    {scholarship.study_level && (
                      <div className="flex items-center text-gray-600">
                        <GraduationCap className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
                        <span className="text-sm capitalize">
                          {scholarship.study_level.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Globe className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm">
                        {safeRenderLocation(scholarship.location) || 'Global'}
                      </span>
                    </div>
                    {(scholarship.external_application_url || scholarship.application_url) && (
                      <div className="flex items-center text-gray-600">
                        <ExternalLink className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                        <span className="text-sm text-orange-600 font-medium">External Application</span>
                      </div>
                    )}
                  </div>

                  {/* Scholarship Type Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {scholarship.scholarship_type === 'merit_based' && (
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                        <Award className="w-3 h-3 mr-1" />
                        Merit Based
                      </Badge>
                    )}
                    {scholarship.scholarship_type === 'need_based' && (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                        <Users className="w-3 h-3 mr-1" />
                        Need Based
                      </Badge>
                    )}
                    {scholarship.scholarship_type === 'sports' && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                        Sports
                      </Badge>
                    )}
                    {scholarship.scholarship_type === 'academic' && (
                      <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                        Academic
                      </Badge>
                    )}
                    {scholarship.study_level && (
                      <Badge variant="outline" className="text-xs">
                        {snakeToTitle(scholarship.study_level)}
                      </Badge>
                    )}
                  </div>

                  {/* Eligibility Requirements Preview */}
                  {scholarship.eligibility_requirements && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        <span className="font-medium text-gray-700">Requirements: </span>
                        {scholarship.eligibility_requirements.substring(0, 100)}...
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <Link 
                        to={`/scholarships/${scholarship.id}`}
                        className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-800 transition-colors group-hover:scale-105 transform duration-300"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                      {scholarship.external_organization_website && (
                        <a 
                          href={scholarship.external_organization_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-gray-500 hover:text-gray-700"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          <span className="text-xs">Website</span>
                        </a>
                      )}
                    </div>
                    {scholarship.application_deadline && (
                      <div className={`text-xs font-medium ${getDeadlineColor(scholarship.application_deadline)}`}>
                        {new Date(scholarship.application_deadline) < new Date() ? (
                          <span className="flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Closed
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Open
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-12">
                <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Featured Scholarships Available</h3>
                <p className="text-gray-500">Check back later for new opportunities</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/scholarships">
            <Button size="lg" className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <GraduationCap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              View All Scholarships
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white/90">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats.scholarships}
              </div>
              <div className="text-gray-600 font-semibold text-lg mb-2">Scholarships</div>
              <div className="text-sm text-gray-500">Available now</div>
              <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 rounded-full"></div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white/90">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.totalUsers}
              </div>
              <div className="text-gray-600 font-semibold text-lg mb-2">Active Users</div>
              <div className="text-sm text-gray-500">Growing community</div>
              <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mt-4 rounded-full"></div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:bg-white/90">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {stats.successRate}
              </div>
              <div className="text-gray-600 font-semibold text-lg mb-2">Success Rate</div>
              <div className="text-sm text-gray-500">Proven results</div>
              <div className="w-16 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto mt-4 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 text-center">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Whether you're seeking the perfect career opportunity or educational funding, 
              we're here to help you achieve your dreams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/jobs">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Explore Jobs
                </Button>
              </Link>
              <Link to="/scholarships">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Find Scholarships
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
