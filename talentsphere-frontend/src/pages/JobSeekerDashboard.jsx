import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  TrendingUp, 
  Briefcase, 
  Clock, 
  MapPin, 
  Star, 
  Target, 
  Book, 
  Trophy,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Eye,
  Heart,
  MessageSquare,
  Users,
  Building,
  Award,
  ExternalLink,
  Zap,
  TrendingDown,
  DollarSign,
  ThumbsUp,
  MousePointer,
  Search, 
  Bookmark, 
  FileText,
  CheckCircle,
  BarChart3,
  Plus,
  Filter,
  RefreshCw
} from 'lucide-react';
import { LeaderboardAd, ResponsiveAd, SquareAd } from '../components/ads/AdComponents';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const JobSeekerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [relevantAds, setRelevantAds] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    profile: {
      name: 'Job Seeker',
      title: 'Professional',
      location: 'Location',
      avatar: '/api/placeholder/80/80',
      profile_completion: 0,
      open_to_opportunities: true,
      skills: []
    },
    stats: {
      totalApplications: 0,
      pendingApplications: 0,
      interviewsScheduled: 0,
      offersReceived: 0,
      profileViews: 0,
      bookmarkedJobs: 0
    },
    recommendedJobs: [],
    recentApplications: [],
    bookmarkedJobs: [],
    interviewSchedule: [],
    skillGaps: [],
    careerInsights: {
      avgSalaryIncrease: 0,
      marketDemand: "Unknown",
      topSkillsInDemand: [],
      careerGrowthPotential: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Load all data in parallel
      const [
        profileResponse,
        applicationsResponse, 
        bookmarksResponse,
        recommendationsResponse,
        statsResponse,
        featuredAdsResponse
      ] = await Promise.allSettled([
        apiService.getProfile(),
        apiService.getMyApplications({ per_page: 10 }),
        apiService.getMyBookmarks(),
        apiService.getJobRecommendations({ limit: 6 }),
        apiService.getApplicationStats(),
        apiService.getPublicFeaturedAds(3)
      ]);

      // Process profile data
      if (profileResponse.status === 'fulfilled') {
        const profile = profileResponse.value;
        setDashboardData(prev => ({
          ...prev,
          profile: {
            name: profile.name || profile.full_name || 'Job Seeker',
            title: profile.job_seeker_profile?.desired_position || profile.job_title || 'Professional',
            location: profile.job_seeker_profile?.preferred_location || profile.location || 'Location',
            avatar: profile.profile_image || '/api/placeholder/80/80',
            profile_completion: calculateProfileCompletion(profile),
            open_to_opportunities: profile.job_seeker_profile?.open_to_opportunities ?? true,
            skills: profile.job_seeker_profile?.skills ? 
              (typeof profile.job_seeker_profile.skills === 'string' ? 
                JSON.parse(profile.job_seeker_profile.skills) : 
                profile.job_seeker_profile.skills) : []
          }
        }));
      }

      // Process applications data
      if (applicationsResponse.status === 'fulfilled') {
        const applicationsData = applicationsResponse.value;
        const applications = applicationsData.applications || [];
        
        setDashboardData(prev => ({
          ...prev,
          recentApplications: applications.slice(0, 5).map(app => ({
            id: app.id,
            job: {
              title: app.job?.title || 'Unknown Job',
              company: app.company?.name || 'Unknown Company'
            },
            status: app.status,
            applied_date: app.created_at,
            last_update: app.updated_at,
            stage: app.stage || getStageFromStatus(app.status)
          }))
        }));
      }

      // Process stats data
      if (statsResponse.status === 'fulfilled') {
        const stats = statsResponse.value;
        setDashboardData(prev => ({
          ...prev,
          stats: {
            totalApplications: stats.total_applications || 0,
            pendingApplications: stats.pending_applications || 0,
            interviewsScheduled: stats.interviews_scheduled || 0,
            offersReceived: stats.offers_received || 0,
            profileViews: prev.stats.profileViews, // Keep existing or set from another source
            bookmarkedJobs: prev.stats.bookmarkedJobs // Keep existing or set from bookmarks
          }
        }));
      }

      // Process bookmarks data
      if (bookmarksResponse.status === 'fulfilled') {
        const bookmarks = bookmarksResponse.value;
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            bookmarkedJobs: bookmarks.bookmarks?.length || 0
          }
        }));
      }

      // Process job recommendations
      if (recommendationsResponse.status === 'fulfilled') {
        const recommendations = recommendationsResponse.value;
        const jobs = recommendations.recommendations || [];
        
        setDashboardData(prev => ({
          ...prev,
          recommendedJobs: jobs.map(job => ({
            id: job.id,
            title: job.title,
            company: {
              name: job.company?.name || 'Unknown Company',
              logo: job.company?.logo_url || '/api/placeholder/50/50'
            },
            location: job.location || `${job.city || ''}, ${job.state || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Remote',
            employment_type: job.employment_type || 'full-time',
            salary_range: job.salary_min && job.salary_max ? 
              `$${formatSalary(job.salary_min)} - $${formatSalary(job.salary_max)}` : 
              'Salary not disclosed',
            match_score: job.match_score || 0,
            is_remote: job.is_remote,
            posted_days_ago: calculateDaysAgo(job.created_at || job.posted_at),
            skills: job.required_skills ? 
              (typeof job.required_skills === 'string' ? 
                job.required_skills.split(',').map(s => s.trim()).slice(0, 3) : 
                job.required_skills.slice(0, 3)) : [],
            match_reasons: job.match_reasons || [`${job.match_score || 0}% compatibility based on your profile`]
          }))
        }));
      }

      // Process featured ads (relevant opportunities)
      if (featuredAdsResponse.status === 'fulfilled') {
        const ads = featuredAdsResponse.value;
        loadRelevantAds(ads.featured_ads || []);
      } else {
        // Fallback to regular featured ads
        loadRelevantAds();
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;
    
    const fields = [
      profile.name || profile.full_name,
      profile.email,
      profile.job_seeker_profile?.desired_position,
      profile.job_seeker_profile?.skills,
      profile.job_seeker_profile?.years_of_experience,
      profile.job_seeker_profile?.education_level,
      profile.job_seeker_profile?.preferred_location,
      profile.job_seeker_profile?.resume_url,
      profile.profile_image,
      profile.phone_number
    ];
    
    const completedFields = fields.filter(field => field && field !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getStageFromStatus = (status) => {
    const stageMap = {
      'submitted': 'Application Submitted',
      'under_review': 'Under Review',
      'shortlisted': 'Shortlisted',
      'interviewed': 'Interview Completed',
      'hired': 'Offer Received',
      'rejected': 'Not Selected',
      'withdrawn': 'Withdrawn'
    };
    return stageMap[status] || 'Unknown';
  };

  const formatSalary = (salary) => {
    if (salary >= 1000) {
      return `${Math.round(salary / 1000)}k`;
    }
    return salary.toString();
  };

  const calculateDaysAgo = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleJobBookmark = async (jobId, isCurrentlyBookmarked) => {
    try {
      if (isCurrentlyBookmarked) {
        await apiService.removeBookmark(jobId);
      } else {
        await apiService.bookmarkJob(jobId);
      }
      
      // Update local state
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          bookmarkedJobs: isCurrentlyBookmarked ? 
            prev.stats.bookmarkedJobs - 1 : 
            prev.stats.bookmarkedJobs + 1
        }
      }));
      
    } catch (error) {
      console.error('Error bookmarking job:', error);
      // You might want to show a toast notification here
    }
  };

  const handleJobApplication = async (jobId) => {
    try {
      // Navigate to job details page for application
      navigate(`/jobs/${jobId}`);
    } catch (error) {
      console.error('Error navigating to job:', error);
    }
  };

  const loadRelevantAds = async (featuredAds = null) => {
    try {
      let ads = featuredAds;
      
      if (!ads) {
        const response = await apiService.getPublicFeaturedAds(3);
        ads = response.featured_ads || [];
      }

      // Transform backend featured ads into relevant ads format
      const transformedAds = ads.map((ad, index) => ({
        id: ad.id || index + 1,
        type: 'job_promotion',
        title: ad.title || 'Featured Opportunity',
        description: ad.summary || ad.description || 'Exciting opportunity in a growing company.',
        image: ad.image_url || '/api/placeholder/400/200',
        company: {
          name: ad.company_name || ad.company?.name || 'Tech Company',
          logo: ad.company_logo || ad.company?.logo_url || '/api/placeholder/60/60',
          rating: 4.5 + (Math.random() * 0.5), // Generate rating between 4.5-5.0
          size: `${Math.floor(Math.random() * 500) + 50}-${Math.floor(Math.random() * 500) + 500} employees`
        },
        matchScore: Math.floor(Math.random() * 15) + 85, // 85-100% match
        callToAction: 'Apply Now',
        link: `/jobs/${ad.id}`,
        status: 'active',
        relevanceReason: 'Matches your skills and experience level',
        tags: ad.required_skills ? 
          (typeof ad.required_skills === 'string' ? 
            ad.required_skills.split(',').map(s => s.trim()).slice(0, 5) : 
            ad.required_skills.slice(0, 5)) : 
          ['React', 'JavaScript', 'Remote', 'Full-time'],
        salary: ad.salary_min && ad.salary_max ? 
          `$${formatSalary(ad.salary_min)} - $${formatSalary(ad.salary_max)}` : 
          '$80k - $120k',
        location: ad.location || `${ad.city || 'San Francisco'}, ${ad.state || 'CA'}` || 'Remote',
        benefits: ['Health', 'Dental', 'Stock Options', 'Remote Work'],
        stats: {
          views: Math.floor(Math.random() * 2000) + 500,
          applications: Math.floor(Math.random() * 100) + 20,
          responseRate: `${Math.floor(Math.random() * 20) + 75}%`
        }
      }));

      // Add some variety with different ad types
      if (transformedAds.length >= 2) {
        transformedAds[1] = {
          ...transformedAds[1],
          type: 'company_branding',
          title: `${transformedAds[1].company.name} - Growing Tech Innovation`,
          callToAction: 'Explore Careers',
          relevanceReason: 'Fast-growing company in your industry',
          openRoles: Math.floor(Math.random() * 20) + 5
        };
      }

      if (transformedAds.length >= 3) {
        transformedAds[2] = {
          ...transformedAds[2],
          type: 'product_showcase',
          title: 'Developer Tools & Innovation Hub',
          callToAction: 'Join Innovation',
          relevanceReason: 'Perfect match for your technical interests',
          fundingStage: 'Series A'
        };
      }

      setRelevantAds(transformedAds);
    } catch (error) {
      console.error('Error loading relevant ads:', error);
      // Fallback to empty array if error
      setRelevantAds([]);
    }
  };

  const loadDashboardDataOld = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API calls
      setDashboardData({
        profile: {
          name: 'John Doe',
          title: 'Full Stack Developer',
          location: 'San Francisco, CA',
          avatar: '/api/placeholder/80/80',
          profile_completion: 75,
          open_to_opportunities: true,
          skills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'Python']
        },
        stats: {
          totalApplications: 15,
          pendingApplications: 8,
          interviewsScheduled: 3,
          offersReceived: 1,
          profileViews: 234,
          bookmarkedJobs: 12
        },
        recommendedJobs: [
          {
            id: 1,
            title: "Senior React Developer",
            company: {
              name: "TechCorp Inc.",
              logo: "/api/placeholder/50/50"
            },
            location: "San Francisco, CA",
            employment_type: "full-time",
            salary_range: "$120k - $180k",
            match_score: 95,
            is_remote: true,
            posted_days_ago: 2,
            skills: ["React", "Node.js", "TypeScript"],
            match_reasons: ["Skills match: React, Node.js", "Location preference", "Salary range match"]
          },
          {
            id: 2,
            title: "Full Stack Engineer",
            company: {
              name: "StartupXYZ",
              logo: "/api/placeholder/50/50"
            },
            location: "Remote",
            employment_type: "full-time",
            salary_range: "$100k - $150k",
            match_score: 88,
            is_remote: true,
            posted_days_ago: 5,
            skills: ["JavaScript", "Python", "React"],
            match_reasons: ["Remote work preference", "Skills match: JavaScript, React"]
          },
          {
            id: 3,
            title: "Frontend Developer",
            company: {
              name: "DesignCo",
              logo: "/api/placeholder/50/50"
            },
            location: "New York, NY",
            employment_type: "contract",
            salary_range: "$80k - $120k",
            match_score: 82,
            is_remote: false,
            posted_days_ago: 1,
            skills: ["React", "CSS", "JavaScript"],
            match_reasons: ["Skills match: React, JavaScript", "Experience level match"]
          }
        ],
        recentApplications: [
          {
            id: 1,
            job: {
              title: "Senior React Developer",
              company: "TechCorp Inc."
            },
            status: "under_review",
            applied_date: "2025-08-08T10:00:00Z",
            last_update: "2025-08-09T14:30:00Z",
            stage: "Technical Interview"
          },
          {
            id: 2,
            job: {
              title: "Full Stack Engineer",
              company: "StartupXYZ"
            },
            status: "shortlisted",
            applied_date: "2025-08-05T15:20:00Z",
            last_update: "2025-08-07T09:15:00Z",
            stage: "Initial Screening"
          },
          {
            id: 3,
            job: {
              title: "Frontend Developer",
              company: "WebAgency"
            },
            status: "rejected",
            applied_date: "2025-08-01T11:45:00Z",
            last_update: "2025-08-03T16:00:00Z",
            stage: "Application Review"
          }
        ],
        interviewSchedule: [
          {
            id: 1,
            job_title: "Senior React Developer",
            company: "TechCorp Inc.",
            date: "2025-08-12T14:00:00Z",
            type: "video",
            interviewer: "Sarah Johnson",
            status: "confirmed"
          },
          {
            id: 2,
            job_title: "Product Manager",
            company: "InnovateCorp",
            date: "2025-08-15T10:30:00Z",
            type: "in-person",
            interviewer: "Mike Chen",
            status: "pending"
          }
        ],
        skillGaps: [
          { skill: "Docker", demand: 85, your_level: 30 },
          { skill: "AWS", demand: 90, your_level: 45 },
          { skill: "GraphQL", demand: 70, your_level: 20 }
        ],
        careerInsights: {
          avgSalaryIncrease: 15,
          marketDemand: "High",
          topSkillsInDemand: ["React", "Node.js", "Python", "AWS"],
          careerGrowthPotential: 92
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = (ad) => {
    // Track ad engagement analytics
    console.log(`Ad clicked: ${ad.title}`);
    // In real implementation, track click and increment analytics
    window.open(ad.link, '_blank');
  };

  const getAdTypeIcon = (type) => {
    const icons = {
      job_promotion: Briefcase,
      company_branding: Building,
      product_showcase: Target
    };
    const Icon = icons[type] || Target;
    return <Icon className="w-4 h-4" />;
  };

  const getAdTypeLabel = (type) => {
    const labels = {
      job_promotion: 'Job Opportunity',
      company_branding: 'Company Spotlight',
      product_showcase: 'Innovation Hub'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-500',
      under_review: 'bg-orange-500',
      shortlisted: 'bg-purple-500',
      interviewed: 'bg-indigo-500',
      hired: 'bg-green-500',
      rejected: 'bg-red-500',
      withdrawn: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Dashboard Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={loadDashboardData}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
            <AvatarImage src={dashboardData.profile.avatar} alt={dashboardData.profile.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {dashboardData.profile.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {dashboardData.profile.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-600">
              {dashboardData.profile.title} • {
                typeof dashboardData.profile.location === 'string' 
                  ? dashboardData.profile.location 
                  : dashboardData.profile.location?.display || 
                    (dashboardData.profile.location?.city && dashboardData.profile.location?.state 
                      ? `${dashboardData.profile.location.city}, ${dashboardData.profile.location.state}`
                      : 'Location not specified'
                    )
              }
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${dashboardData.profile.open_to_opportunities ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {dashboardData.profile.open_to_opportunities ? 'Open to opportunities' : 'Not looking'}
                </span>
              </div>
              {dashboardData.profile.skills && dashboardData.profile.skills.length > 0 && (
                <div className="flex gap-1">
                  {dashboardData.profile.skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {dashboardData.profile.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{dashboardData.profile.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={refreshData}
            variant="outline"
            disabled={refreshing}
            className="border-blue-200 hover:bg-blue-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate('/jobs')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Search className="w-4 h-4 mr-2" />
            Browse Jobs
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/jobseeker/profile')}
            className="border-purple-200 hover:bg-purple-50"
          >
            Complete Profile ({dashboardData.profile.profile_completion}%)
          </Button>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {dashboardData.profile.profile_completion < 100 && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Boost Your Profile Visibility</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Complete your profile to get 3x more job recommendations and increase your visibility to employers
                </p>
                <div className="flex items-center gap-3">
                  <Progress value={dashboardData.profile.profile_completion} className="w-48 h-3" />
                  <span className="text-sm font-medium text-blue-700">
                    {dashboardData.profile.profile_completion}% complete
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/jobseeker/profile')}
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Complete Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Relevant Advertisements */}
      {relevantAds.length > 0 && (
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-600" />
                <div>
                  <CardTitle className="text-purple-900">Opportunities Tailored for You</CardTitle>
                  <CardDescription className="text-purple-700">
                    Personalized recommendations based on your profile and preferences
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-200 bg-white">
                <Award className="w-3 h-3 mr-1" />
                Sponsored
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {relevantAds.map((ad) => (
                <Card 
                  key={ad.id} 
                  className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 cursor-pointer transform hover:-translate-y-1 bg-white"
                  onClick={() => handleAdClick(ad)}
                >
                  <div className="relative">
                    <img 
                      src={ad.image} 
                      alt={ad.title}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-blue-600 text-white flex items-center gap-1 text-xs">
                        {getAdTypeIcon(ad.type)}
                        {getAdTypeLabel(ad.type)}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs font-semibold">
                        {ad.matchScore}% match
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src={ad.company.logo} 
                        alt={ad.company.name}
                        className="w-10 h-10 rounded-lg object-cover border-2 border-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {ad.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="font-medium">{ad.company.name}</span>
                          {ad.company.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span>{ad.company.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                      {ad.description}
                    </p>

                    <div className="mb-3">
                      <div className="text-xs text-blue-600 font-medium mb-2">
                        {ad.relevanceReason}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ad.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {ad.salary && (
                      <div className="flex items-center gap-1 mb-2 text-xs font-semibold text-green-600">
                        <DollarSign className="w-3 h-3" />
                        {ad.salary}
                      </div>
                    )}

                    {ad.location && (
                      <div className="flex items-center gap-1 mb-3 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {typeof ad.location === 'string' 
                          ? ad.location 
                          : ad.location?.display || 
                            (ad.location?.city && ad.location?.state 
                              ? `${ad.location.city}, ${ad.location.state}`
                              : ad.location?.is_remote ? 'Remote' : 'Location not specified'
                            )
                        }
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {ad.stats.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {ad.stats.applications || ad.stats.interactions} engaged
                      </span>
                    </div>

                    <Button 
                      size="sm"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs group"
                    >
                      {ad.callToAction}
                      <ExternalLink className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Ads - Leaderboard */}
      <section className="mb-8">
        <div className="flex justify-center">
          <LeaderboardAd className="rounded-lg shadow-sm" />
        </div>
      </section>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Applications</p>
                <p className="text-3xl font-bold">{dashboardData.stats.pendingApplications}</p>
                <p className="text-blue-100 text-xs">of {dashboardData.stats.totalApplications} total</p>
              </div>
              <div className="p-3 bg-blue-600/50 rounded-lg backdrop-blur">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Interviews</p>
                <p className="text-3xl font-bold">{dashboardData.stats.interviewsScheduled}</p>
                <p className="text-green-100 text-xs">scheduled</p>
              </div>
              <div className="p-3 bg-green-600/50 rounded-lg backdrop-blur">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Bookmarked Jobs</p>
                <p className="text-3xl font-bold">{dashboardData.stats.bookmarkedJobs}</p>
                <p className="text-purple-100 text-xs">saved opportunities</p>
              </div>
              <div className="p-3 bg-purple-600/50 rounded-lg backdrop-blur">
                <Bookmark className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Job Offers</p>
                <p className="text-3xl font-bold">{dashboardData.stats.offersReceived}</p>
                <p className="text-orange-100 text-xs">received</p>
              </div>
              <div className="p-3 bg-orange-600/50 rounded-lg backdrop-blur">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Ads - Responsive between sections */}
      <section className="mb-8">
        <div className="flex justify-center">
          <ResponsiveAd className="rounded-lg shadow-sm" />
        </div>
      </section>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white shadow-lg rounded-xl p-1">
          <TabsTrigger 
            value="recommendations"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            <Zap className="w-4 h-4 mr-2" />
            For You
          </TabsTrigger>
          <TabsTrigger 
            value="applications"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            <FileText className="w-4 h-4 mr-2" />
            Applications
          </TabsTrigger>
          <TabsTrigger 
            value="interviews"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Interviews
          </TabsTrigger>
          <TabsTrigger 
            value="skills"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger 
            value="insights"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Recommended Jobs for You
                  </CardTitle>
                  <CardDescription>AI-powered job matches based on your profile and preferences</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-blue-200 hover:bg-blue-50"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/jobs')}
                    className="border-purple-200 hover:bg-purple-50"
                  >
                    See All Jobs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {dashboardData.recommendedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Recommendations Yet</h3>
                  <p className="text-gray-500 mb-6">
                    Complete your profile to get personalized job recommendations
                  </p>
                  <Button 
                    onClick={() => navigate('/jobseeker/profile')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recommendedJobs.map((job) => (
                    <Card key={job.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="w-12 h-12 border-2 border-gray-100">
                                <AvatarImage src={job.company.logo} alt={job.company.name} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                                  {job.company.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-lg hover:text-blue-600 cursor-pointer transition-colors">
                                  {job.title}
                                </h3>
                                <p className="text-gray-600 font-medium">{job.company.name}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {typeof job.location === 'string' 
                                      ? job.location 
                                      : job.location?.display || 
                                        (job.location?.city && job.location?.state 
                                          ? `${job.location.city}, ${job.location.state}`
                                          : job.location?.is_remote ? 'Remote' : 'Location not specified'
                                        )
                                    }
                                  </span>
                                  {job.is_remote && (
                                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                                      Remote
                                    </Badge>
                                  )}
                                  <span className="capitalize">{job.employment_type}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {job.posted_days_ago}d ago
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-3">
                              <span className="font-semibold text-green-600 text-lg">{job.salary_range}</span>
                              <Badge className={`px-3 py-1 ${getMatchScoreColor(job.match_score)} font-semibold`}>
                                <Star className="w-3 h-3 mr-1" />
                                {job.match_score}% match
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {job.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {skill}
                                </Badge>
                              ))}
                            </div>

                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Why this job matches:
                              </p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {job.match_reasons.map((reason, index) => (
                                  <li key={index} className="flex items-center gap-2 pl-2">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-6">
                            <Button 
                              onClick={() => handleJobApplication(job.id)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Briefcase className="w-4 h-4 mr-2" />
                              Apply Now
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleJobBookmark(job.id, false)}
                              className="border-purple-200 hover:bg-purple-50"
                            >
                              <Bookmark className="w-4 h-4 mr-2" />
                              Save Job
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Your Applications
              </CardTitle>
              <CardDescription>Track the status of your job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentApplications.map((application) => (
                  <div key={application.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{application.job.title}</h4>
                        <p className="text-gray-600 text-sm">
                          {typeof application.job.company === 'string' 
                            ? application.job.company 
                            : application.job.company?.name || 'Unknown Company'
                          }
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span>Applied: {formatDate(application.applied_date)}</span>
                          <span>Updated: {formatDate(application.last_update)}</span>
                          <span className="font-medium">{application.stage}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={`${getStatusColor(application.status)} text-white`}
                        >
                          {application.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/applications')}>
                View All Applications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Interviews
              </CardTitle>
              <CardDescription>Your scheduled interviews and meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.interviewSchedule.map((interview) => (
                  <Card key={interview.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{interview.job_title}</h4>
                          <p className="text-gray-600">
                            {typeof interview.company === 'string' 
                              ? interview.company 
                              : interview.company?.name || 'Unknown Company'
                            }
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            <span>{formatDate(interview.date)}</span>
                            <span className="capitalize">{interview.type} interview</span>
                            <span>with {interview.interviewer}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={interview.status === 'confirmed' ? 'default' : 'secondary'}
                          >
                            {interview.status}
                          </Badge>
                          <Button size="sm">View Details</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Skill Development
              </CardTitle>
              <CardDescription>Bridge skill gaps to unlock better opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dashboardData.skillGaps.map((skill, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{skill.skill}</h4>
                      <Badge variant="outline">
                        {skill.demand}% market demand
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your Level</span>
                        <span>{skill.your_level}%</span>
                      </div>
                      <Progress value={skill.your_level} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Market Demand</span>
                        <span>{skill.demand}%</span>
                      </div>
                      <Progress value={skill.demand} className="h-2 bg-blue-100" />
                    </div>
                    <Button variant="outline" size="sm" className="mt-3">
                      Find Courses
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Salary Potential</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    +{dashboardData.careerInsights.avgSalaryIncrease}%
                  </p>
                  <p className="text-sm text-gray-600">Expected increase in next role</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Market Demand</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardData.careerInsights.marketDemand}
                  </p>
                  <p className="text-sm text-gray-600">For your skill set</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Skills</CardTitle>
                <CardDescription>Most in-demand skills in your field</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.careerInsights.topSkillsInDemand.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{skill}</span>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobSeekerDashboard;
