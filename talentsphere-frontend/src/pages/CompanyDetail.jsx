import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import apiService from '../services/api';
import { formatCurrency, formatRelativeTime } from '../utils/helpers';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Calendar,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  ExternalLink,
  Briefcase,
  Award,
  Target,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Eye,
  DollarSign,
  Clock,
  Loader2
} from 'lucide-react';

const CompanyDetail = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCompanyData();
  }, [id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load company details and jobs in parallel
      const [companyResponse, jobsResponse] = await Promise.all([
        apiService.getCompany(id),
        apiService.getJobs({ company_id: id, per_page: 20 })
      ]);

      setCompany(companyResponse);
      setJobs(jobsResponse.jobs || []);
    } catch (error) {
      console.error('Failed to load company:', error);
      setError(error.message || 'Failed to load company information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading company information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="py-16">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h2>
                <p className="text-gray-600 mb-8">
                  {error || "The company you're looking for doesn't exist or has been removed."}
                </p>
                <Button asChild>
                  <Link to="/companies">Browse All Companies</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Company Header with Banner */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-64 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
          {company.banner_url ? (
            <img 
              src={company.banner_url} 
              alt={`${company.name} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0">
              <div className="w-96 h-96 bg-white opacity-10 rounded-full blur-3xl absolute -top-32 -left-32"></div>
              <div className="w-72 h-72 bg-pink-300 opacity-20 rounded-full blur-3xl absolute -bottom-32 -right-32"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Company Info Overlay */}
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row gap-6 -mt-20 relative z-10">
            {/* Company Avatar & Basic Info */}
            <Card className="bg-white shadow-xl border-0">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                    <AvatarImage src={company.logo_url} alt={company.name} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-100 to-blue-200">
                      <Building2 className="w-16 h-16 text-blue-600" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold text-gray-900">{company.name}</h1>
                        {company.is_verified && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {company.tagline && (
                        <p className="text-xl text-gray-600 font-medium">{company.tagline}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {company.industry && (
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-600">{company.industry}</span>
                        </div>
                      )}
                      {company.company_size && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-500" />
                          <span className="text-gray-600">{company.company_size}</span>
                        </div>
                      )}
                      {company.address?.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="text-gray-600">
                            {company.address.city}{company.address.state && `, ${company.address.state}`}
                          </span>
                        </div>
                      )}
                      {company.founded_year && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-600">Founded {company.founded_year}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {company.website && (
                        <Button asChild variant="outline" className="hover:bg-blue-50">
                          <a href={company.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4 mr-2" />
                            Visit Website
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-700">
                        <Link to={`#jobs`}>
                          <Briefcase className="w-4 h-4 mr-2" />
                          View Jobs ({jobs.length})
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white shadow-xl border-0 lg:w-80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Company Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
                    <div className="text-xs text-blue-700">Open Jobs</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{company.statistics?.profile_views || 0}</div>
                    <div className="text-xs text-green-700">Profile Views</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{company.statistics?.total_employees_hired || 0}</div>
                    <div className="text-xs text-purple-700">Hires Made</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {company.founded_year ? new Date().getFullYear() - company.founded_year : 'N/A'}
                    </div>
                    <div className="text-xs text-orange-700">Years Active</div>
                  </div>
                </div>

                {/* Social Links */}
                {company.social_media && (
                  <div>
                    <Separator className="my-4" />
                    <h4 className="font-medium mb-3">Connect with us</h4>
                    <div className="flex gap-2">
                      {company.social_media.linkedin && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {company.social_media.twitter && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.twitter} target="_blank" rel="noopener noreferrer">
                            <Twitter className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {company.social_media.facebook && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.facebook} target="_blank" rel="noopener noreferrer">
                            <Facebook className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {company.social_media.instagram && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {company.social_media.youtube && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.youtube} target="_blank" rel="noopener noreferrer">
                            <Youtube className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Company Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  About {company.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {company.description ? (
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {company.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No company description available.</p>
                )}
              </CardContent>
            </Card>

            {/* Specialties */}
            {company.specialties && company.specialties.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Specialties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {company.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Jobs */}
            <Card className="shadow-lg border-0" id="jobs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Open Positions ({jobs.length})
                </CardTitle>
                <CardDescription>
                  Current job opportunities at {company.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <Card key={job.id} className="border border-gray-200 hover:border-blue-300 transition-colors hover:shadow-md">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                <Link to={`/jobs/${job.id}`} className="hover:text-blue-600 transition-colors">
                                  {job.title}
                                </Link>
                              </h3>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {typeof job.location === 'string' ? job.location : 
                                   job.location?.display || 
                                   `${job.location?.city || ''}${job.location?.city && job.location?.state ? ', ' : ''}${job.location?.state || ''}` || 
                                   'Location not specified'
                                  }
                                  {job.is_remote && (
                                    <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700 border-green-200">
                                      Remote
                                    </Badge>
                                  )}
                                </div>
                                {job.salary_min && job.salary_max && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {job.posted_at ? formatRelativeTime(job.posted_at) : 'Recently posted'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Briefcase className="w-4 h-4" />
                                  {job.type ? job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Full Time'}
                                </div>
                              </div>

                              {job.summary && (
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {job.summary}
                                </p>
                              )}

                              {job.skills && job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {job.skills.slice(0, 5).map((skill, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {job.skills.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{job.skills.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex flex-col items-end gap-2">
                              {job.featured && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                  Featured
                                </Badge>
                              )}
                              <Button asChild size="sm">
                                <Link to={`/jobs/${job.id}`}>
                                  View Job
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Positions</h3>
                    <p className="text-gray-500">
                      {company.name} doesn't have any job openings at the moment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Company Values */}
            {company.values && company.values.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Our Values
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {company.values.map((value, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {company.benefits && company.benefits.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-500" />
                    Benefits & Perks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {company.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                      {company.email}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">
                      {company.phone}
                    </a>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-gray-600 text-sm leading-relaxed">
                      {company.address.line1 && <div>{company.address.line1}</div>}
                      {company.address.line2 && <div>{company.address.line2}</div>}
                      <div>
                        {company.address.city}{company.address.state && `, ${company.address.state}`}
                        {company.address.postal_code && ` ${company.address.postal_code}`}
                      </div>
                      {company.address.country && <div>{company.address.country}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
