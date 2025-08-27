import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import apiService from '../services/api';
import {
  Building2,
  Search,
  MapPin,
  Users,
  Briefcase,
  Filter,
  Grid,
  List,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Loader2,
  Target
} from 'lucide-react';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Marketing', 'Real Estate', 'Transportation',
    'Energy', 'Entertainment', 'Government', 'Non-profit'
  ];

  const sizeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1001-5000', label: '1001-5000 employees' },
    { value: '5001+', label: '5001+ employees' }
  ];

  useEffect(() => {
    loadCompanies();
  }, [currentPage, searchQuery, selectedIndustry, selectedSize, selectedLocation]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 12,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedIndustry && { industry: selectedIndustry }),
        ...(selectedSize && { company_size: selectedSize }),
        ...(selectedLocation && { location: selectedLocation })
      };

      const response = await apiService.getCompanies(params);
      
      setCompanies(response.companies || []);
      setTotalPages(response.pagination?.pages || 1);
      setTotalCompanies(response.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCompanies();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadCompanies();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('');
    setSelectedSize('');
    setSelectedLocation('');
    setCurrentPage(1);
  };

  const CompanyCard = ({ company }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16 border-2 border-gray-100 group-hover:border-blue-200">
            <AvatarImage src={company.logo_url} alt={company.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
              <Building2 className="w-8 h-8 text-blue-600" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {company.name}
              </h3>
              {company.is_verified && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            {company.tagline && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{company.tagline}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {company.industry && (
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {company.industry}
                </div>
              )}
              {company.company_size && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {company.company_size}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {company.address?.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              {company.address.city}{company.address.state && `, ${company.address.state}`}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">
                {company.job_count || company.jobs || 0} open positions
              </span>
            </div>
            <Button asChild size="sm" className="group-hover:bg-blue-600">
              <Link to={`/companies/${company.id}`}>
                View Profile
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CompanyListItem = ({ company }) => (
    <Card className="group hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-blue-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          <Avatar className="w-20 h-20 border-2 border-gray-100 group-hover:border-blue-200">
            <AvatarImage src={company.logo_url} alt={company.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
              <Building2 className="w-10 h-10 text-blue-600" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                    {company.name}
                  </h3>
                  {company.is_verified && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {company.tagline && (
                  <p className="text-gray-600 mb-3 line-clamp-2">{company.tagline}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                  {company.industry && (
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {company.industry}
                    </div>
                  )}
                  {company.company_size && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {company.company_size}
                    </div>
                  )}
                  {company.address?.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {company.address.city}{company.address.state && `, ${company.address.state}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-blue-600">
                      {company.job_count || company.jobs || 0} open positions
                    </span>
                  </div>
                </div>

                {company.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{company.description}</p>
                )}
              </div>

              <Button asChild className="group-hover:bg-blue-600 flex-shrink-0">
                <Link to={`/companies/${company.id}`}>
                  View Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Explore Companies
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing companies and find your next career opportunity
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search companies by name, industry, or keywords..."
                  className="pl-10 h-12 text-gray-900 focus-ring"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Company Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  placeholder="Location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                />

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {loading ? 'Loading...' : `${totalCompanies} companies found`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Companies Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading companies...</p>
            </div>
          </div>
        ) : companies.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {companies.map((company) => (
                  <CompanyListItem key={company.id} company={company} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages));
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or clearing the filters.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;
