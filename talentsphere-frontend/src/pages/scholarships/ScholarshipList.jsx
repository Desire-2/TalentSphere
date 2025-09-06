import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap,
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Users,
  Clock,
  ExternalLink,
  Star,
  Bookmark,
  BookmarkCheck,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { scholarshipService } from '../../services/scholarship';
import { useAuthStore } from '../../stores/authStore';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { generateKeywords, generateBreadcrumbStructuredData } from '../../utils/seoUtils';

// Sample data for demonstration when API is not available
const getSampleCategories = () => [
  { id: 1, name: 'STEM', slug: 'stem', description: 'Science, Technology, Engineering, and Mathematics' },
  { id: 2, name: 'Business', slug: 'business', description: 'Business and Management Studies' },
  { id: 3, name: 'Medicine', slug: 'medicine', description: 'Medical and Health Sciences' },
  { id: 4, name: 'Arts', slug: 'arts', description: 'Arts and Humanities' },
  { id: 5, name: 'Engineering', slug: 'engineering', description: 'Engineering and Technology' },
];

const getSampleScholarships = () => [
  {
    id: 1,
    title: 'Global Excellence Scholarship',
    description: 'A prestigious scholarship for outstanding academic performance and leadership qualities.',
    external_organization_name: 'International Education Foundation',
    scholarship_type: 'merit-based',
    amount_min: 10000,
    amount_max: 25000,
    currency: 'USD',
    application_deadline: '2025-12-31',
    study_level: 'undergraduate',
    funding_type: 'partial',
    location: 'Global',
    category: { name: 'General', slug: 'general' },
    is_active: true,
    status: 'published',
    external_application_url: 'https://scholarships.example.com/global-excellence',
    external_organization_website: 'https://www.ief.org'
  },
  {
    id: 2,
    title: 'STEM Innovation Award',
    description: 'Supporting the next generation of scientists and engineers with comprehensive funding.',
    external_organization_name: 'Tech Innovation Institute',
    scholarship_type: 'academic',
    amount_min: 15000,
    amount_max: 40000,
    currency: 'USD',
    application_deadline: '2025-11-15',
    study_level: 'graduate',
    funding_type: 'full',
    location: 'United States',
    category: { name: 'STEM', slug: 'stem' },
    is_active: true,
    status: 'published',
    external_application_url: 'https://apply.techinnovation.edu/stem-award',
    external_organization_website: 'https://www.techinnovation.edu'
  },
  {
    id: 3,
    title: 'Community Leadership Grant',
    description: 'For students who have demonstrated exceptional community service and leadership.',
    external_organization_name: 'Community Foundation',
    scholarship_type: 'merit-based',
    amount_min: 5000,
    amount_max: 15000,
    currency: 'USD',
    application_deadline: '2026-01-30',
    study_level: 'undergraduate',
    funding_type: 'partial',
    location: 'Any',
    category: { name: 'Leadership', slug: 'leadership' },
    is_active: true,
    status: 'published'
    // No external URL - internal application
  },
  {
    id: 4,
    title: 'Medical Research Fellowship',
    description: 'Supporting aspiring medical researchers with funding for advanced studies.',
    external_organization_name: 'Medical Research Council',
    scholarship_type: 'research',
    amount_min: 20000,
    amount_max: 50000,
    currency: 'USD',
    application_deadline: '2025-10-15',
    study_level: 'postgraduate',
    funding_type: 'full',
    location: 'Europe',
    category: { name: 'Medicine', slug: 'medicine' },
    is_active: true,
    status: 'published',
    external_application_url: 'research-council.eu/fellowships/apply',
    external_organization_website: 'https://www.research-council.eu'
  },
  {
    id: 5,
    title: 'Arts and Culture Scholarship',
    description: 'Nurturing creative talents in arts, music, and cultural studies.',
    external_organization_name: 'Cultural Heritage Foundation',
    scholarship_type: 'merit-based',
    amount_min: 8000,
    amount_max: 20000,
    currency: 'USD',
    application_deadline: '2025-09-30',
    study_level: 'undergraduate',
    funding_type: 'partial',
    location: 'International',
    category: { name: 'Arts', slug: 'arts' },
    is_active: true,
    status: 'published',
    external_application_url: 'www.culturalheritage.org/scholarships/apply',
    external_organization_website: 'https://www.culturalheritage.org'
  },
  {
    id: 6,
    title: 'Sustainable Development Grant',
    description: 'For students passionate about environmental sustainability and green technology.',
    external_organization_name: 'Green Future Initiative',
    scholarship_type: 'academic',
    amount_min: 12000,
    amount_max: 30000,
    currency: 'USD',
    application_deadline: '2025-12-01',
    study_level: 'graduate',
    funding_type: 'partial',
    location: 'Global',
    category: { name: 'Environmental', slug: 'environmental' },
    is_active: true,
    status: 'published'
    // No external URL - internal application
  }
];

const ScholarshipList = () => {
  const [scholarships, setScholarships] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScholarships, setTotalScholarships] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    studyLevel: '',
    fundingType: '',
    location: ''
  });
  const { isAuthenticated, user } = useAuthStore();

  // Constants
  const itemsPerPage = 12;

  // Helper function to get location display text
  const getLocationDisplay = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return location.display || location.city || location.country || 'Not specified';
    }
    return 'Not specified';
  };

  useEffect(() => {
    fetchScholarships();
    fetchCategories();
  }, [currentPage, searchTerm, selectedCategory]);

    const fetchScholarships = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      setScholarships([]); // Clear existing data to prevent mixed rendering
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        search: searchTerm,
        category: selectedCategory,
        scholarship_type: filters.type,
        study_level: filters.studyLevel,
        funding_type: filters.fundingType,
        location: filters.location,
        status: 'published' // Only show published scholarships
      };

      const response = await scholarshipService.getScholarships(params);
      
      // Handle different possible response structures
      let scholarshipsData = [];
      let totalPages = 1;
      let totalCount = 0;
      
      if (response) {
        // Try different possible response structures
        if (Array.isArray(response)) {
          scholarshipsData = response;
          totalCount = response.length;
        } else if (response.scholarships) {
          scholarshipsData = response.scholarships;
          totalPages = response.pagination?.pages || response.total_pages || 1;
          totalCount = response.pagination?.total || response.total || 0;
        } else if (response.data) {
          scholarshipsData = Array.isArray(response.data) ? response.data : response.data.scholarships || [];
          totalPages = response.data.pagination?.pages || response.data.total_pages || 1;
          totalCount = response.data.pagination?.total || response.data.total || 0;
        }
      }
      
      // If no data available, provide sample scholarships for demo
      if (scholarshipsData.length === 0 && currentPage === 1) {
        scholarshipsData = getSampleScholarships();
        totalCount = scholarshipsData.length;
        totalPages = Math.ceil(totalCount / itemsPerPage);
      }
      
      setScholarships(scholarshipsData);
      setTotalPages(totalPages);
      setTotalScholarships(totalCount);
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      setError('Failed to load scholarships. Please try again later.');
      
      // Only provide sample data if we don't have any data at all
      if (scholarships.length === 0) {
        const sampleData = getSampleScholarships();
        setScholarships(sampleData);
        setTotalPages(Math.ceil(sampleData.length / itemsPerPage));
        setTotalScholarships(sampleData.length);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await scholarshipService.getScholarshipCategories();
      
      // Handle different possible response structures
      let categoriesData = [];
      
      if (response) {
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response.categories) {
          categoriesData = response.categories;
        } else if (response.data) {
          categoriesData = Array.isArray(response.data) ? response.data : response.data.categories || [];
        }
      }
      
      // If no categories available, provide sample categories
      if (categoriesData.length === 0) {
        categoriesData = getSampleCategories();
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Provide sample data on error for demonstration
      setCategories(getSampleCategories());
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchScholarships();
  };

  const handleCategoryFilter = (categorySlug) => {
    setSelectedCategory(categorySlug === selectedCategory ? '' : categorySlug);
    setCurrentPage(1);
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline specified';
    const date = new Date(deadline);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Deadline passed';
    if (diffDays === 0) return 'Deadline today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    if (diffDays <= 30) return `Due in ${Math.ceil(diffDays / 7)} weeks`;
    return date.toLocaleDateString();
  };

  const getDeadlineColor = (deadline) => {
    if (!deadline) return 'text-gray-500';
    const date = new Date(deadline);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 7) return 'text-orange-600';
    if (diffDays <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading && scholarships.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scholarships...</p>
        </div>
      </div>
    );
  }

  // SEO data
  const scholarshipKeywords = generateKeywords(
    ['scholarships', 'financial aid', 'education funding', 'student grants'],
    searchTerm ? [searchTerm] : []
  );
  
  const seoTitle = searchTerm 
    ? `${searchTerm} Scholarships - Find Financial Aid | TalentSphere`
    : 'Scholarships - Find Educational Funding Opportunities | TalentSphere';
    
  const seoDescription = searchTerm
    ? `Find ${searchTerm} scholarships on TalentSphere. Browse financial aid opportunities and educational grants. Apply for scholarships to fund your education.`
    : `Discover scholarship opportunities to fund your education. Browse hundreds of scholarships, grants, and financial aid programs from leading institutions worldwide.`;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Scholarships', url: '/scholarships' }
  ];
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbs);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* SEO Meta Tags */}
      <SEOHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={scholarshipKeywords}
        type="website"
        image="/scholarships-og-image.jpg"
        canonical={`${window.location.origin}/scholarships`}
        structuredData={breadcrumbStructuredData}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full">
                <GraduationCap className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Scholarship Opportunities
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover funding opportunities for your education. Browse through {totalScholarships} scholarships 
              from universities, organizations, and foundations worldwide.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search scholarships by name, organization, or field..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-white/95 border-white/20 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <Button type="submit" size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Filter by Category
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryFilter('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === '' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryFilter(category.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.slug 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory ? 
                    categories.find(c => c.slug === selectedCategory)?.name + ' Scholarships' : 
                    'All Scholarships'
                  }
                </h2>
                <p className="text-gray-600 mt-1">
                  {totalScholarships} scholarships found
                  {searchTerm && ` for "${searchTerm}"`}
                </p>
              </div>
            </div>

            {/* Scholarship Grid */}
            {scholarships.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No scholarships found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 
                    'Try adjusting your search terms or filters.' : 
                    'No scholarships are currently available.'
                  }
                </p>
                {searchTerm && (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                      setCurrentPage(1);
                    }}
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {scholarships.map((scholarship) => (
                  <Card key={scholarship.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-[1.02]">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {scholarship.category?.name || 'General'}
                          </Badge>
                          {scholarship.external_application_url && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              External
                            </Badge>
                          )}
                        </div>
                        <div className={`text-sm font-medium ${getDeadlineColor(scholarship.application_deadline)}`}>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatDeadline(scholarship.application_deadline)}
                        </div>
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                        {scholarship.title}
                      </CardTitle>
                      <CardDescription className="flex items-center text-gray-600">
                        <Building2 className="w-4 h-4 mr-1" />
                        {scholarship.external_organization_name || scholarship.university_name || 'TalentSphere'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {scholarship.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        {scholarship.award_amount && (
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                            <span className="font-medium text-green-600">
                              ${scholarship.award_amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {scholarship.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {getLocationDisplay(scholarship.location)}
                          </div>
                        )}
                        {scholarship.eligible_programs && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            {scholarship.eligible_programs}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Link 
                          to={`/scholarships/${scholarship.id}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                        >
                          Learn More
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        
                        {isAuthenticated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-blue-600 p-2"
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipList;
