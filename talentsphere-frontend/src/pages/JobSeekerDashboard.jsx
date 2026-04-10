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
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState(new Set());
  
  // Recommendation filters and sorting
  const [recFilters, setRecFilters] = useState({
    minSalary: 0,
    maxSalary: 500000,
    location: '',
    jobType: '',
    experienceLevel: ''
  });
  const [recSortBy, setRecSortBy] = useState('relevance'); // relevance, date, salary
  const [showRecFilters, setShowRecFilters] = useState(false);
  const [filteredRecommendedJobs, setFilteredRecommendedJobs] = useState([]);
  
  const [dashboardData, setDashboardData] = useState({
    profile: {
      name: 'Job Seeker',
      title: 'Professional',
      location: 'Location',
      avatar: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%23e5e7eb%22/%3E%3Ccircle cx=%2240%22 cy=%2230%22 r=%2215%22 fill=%22%23d1d5db%22/%3E%3Cpath d=%22M20 65 Q20 50 40 50 Q60 50 60 65%22 fill=%22%23d1d5db%22/%3E%3C/svg%3E',
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

      // Load all data in parallel with additional endpoints
      // Note: Individual API methods now have built-in fallbacks for missing endpoints
      const [
        profileResponse,
        applicationsResponse, 
        bookmarksResponse,
        recommendationsResponse,
        statsResponse,
        featuredAdsResponse,
        interviewResponse,
        skillGapsResponse,
        careerInsightsResponse,
        profileViewsResponse,
        completenessResponse
      ] = await Promise.allSettled([
        apiService.getProfile(),
        apiService.getMyApplications({ per_page: 10 }),
        apiService.getMyBookmarks(),
        apiService.getJobRecommendations({ limit: 6 }),
        apiService.getApplicationStats(),
        apiService.getPublicFeaturedAds(3),
        apiService.getMyInterviews(),
        apiService.getSkillGaps(),
        apiService.getCareerInsights(),
        apiService.getProfileViews(),
        apiService.get('/profile/completeness-analysis')
      ]);

      // Process profile data
      if (profileResponse.status === 'fulfilled') {
        const profile = profileResponse.value || {};
        
        // Safely parse skills
        let skillsList = [];
        if (profile.job_seeker_profile?.skills) {
          try {
            skillsList = typeof profile.job_seeker_profile.skills === 'string' ? 
              JSON.parse(profile.job_seeker_profile.skills) : 
              profile.job_seeker_profile.skills;
          } catch (e) {
            console.warn('Failed to parse skills:', e);
            skillsList = [];
          }
        }

        // Get profile completion from backend API instead of frontend calculation
        let profileCompletion = 0;
        if (completenessResponse.status === 'fulfilled') {
          const completeness = completenessResponse.value || {};
          profileCompletion = completeness.overall_score || 0;
        } else {
          // Fallback to frontend calculation if API fails
          profileCompletion = calculateProfileCompletion(profile);
        }

        setDashboardData(prev => ({
          ...prev,
          profile: {
            name: profile.name || profile.full_name || 'Job Seeker',
            title: profile.job_seeker_profile?.desired_position || profile.job_title || 'Professional',
            location: profile.job_seeker_profile?.preferred_location || profile.location || 'Location',
            avatar: profile.profile_image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%23e5e7eb%22/%3E%3Ccircle cx=%2240%22 cy=%2230%22 r=%2215%22 fill=%22%23d1d5db%22/%3E%3Cpath d=%22M20 65 Q20 50 40 50 Q60 50 60 65%22 fill=%22%23d1d5db%22/%3E%3C/svg%3E',
            profile_completion: profileCompletion,
            open_to_opportunities: profile.job_seeker_profile?.open_to_opportunities ?? true,
            skills: Array.isArray(skillsList) ? skillsList : []
          }
        }));
      } else {
        console.warn('Failed to load profile:', profileResponse.reason);
      }

      // Process applications data
      if (applicationsResponse.status === 'fulfilled') {
        const applicationsData = applicationsResponse.value || {};
        const applications = applicationsData.applications || [];
        
        setDashboardData(prev => ({
          ...prev,
          recentApplications: applications.slice(0, 5).map(app => {
            // Safely extract company name from various possible structures
            let companyName = 'Unknown Company';
            if (app.company?.name) {
              companyName = app.company.name;
            } else if (app.job?.company?.name) {
              companyName = app.job.company.name;
            } else if (typeof app.company === 'string') {
              companyName = app.company;
            }

            return {
              id: app.id,
              job: {
                title: app.job?.title || 'Unknown Job',
                company: companyName
              },
              status: app.status || 'submitted',
              applied_date: app.created_at || new Date().toISOString(),
              last_update: app.updated_at || app.created_at || new Date().toISOString(),
              stage: app.stage || getStageFromStatus(app.status)
            };
          })
        }));
      } else {
        console.warn('Failed to load applications:', applicationsResponse.reason);
      }

      // Process stats data
      if (statsResponse.status === 'fulfilled') {
        const stats = statsResponse.value || {};
        setDashboardData(prev => ({
          ...prev,
          stats: {
            totalApplications: stats.total_applications || 0,
            pendingApplications: stats.pending_applications || 0,
            interviewsScheduled: stats.interviews_scheduled || 0,
            offersReceived: stats.offers_received || 0,
            profileViews: stats.profile_views || prev.stats.profileViews || 0,
            bookmarkedJobs: prev.stats.bookmarkedJobs || 0
          }
        }));
      } else {
        console.warn('Failed to load application stats:', statsResponse.reason);
      }

      // Process bookmarks data
      if (bookmarksResponse.status === 'fulfilled') {
        const bookmarks = bookmarksResponse.value;
        const bookmarkList = bookmarks.bookmarks || [];
        
        // Create Set of bookmarked job IDs for quick lookup
        const bookmarkedIds = new Set(bookmarkList.map(b => b.job_id || b.job?.id));
        setBookmarkedJobIds(bookmarkedIds);
        
        setDashboardData(prev => ({
          ...prev,
          bookmarkedJobs: bookmarkList.map(bookmark => ({
            id: bookmark.id || bookmark.job_id,
            job: bookmark.job ? {
              id: bookmark.job.id,
              title: bookmark.job.title,
              company: {
                name: bookmark.job.company?.name || bookmark.company?.name || 'Unknown Company',
                logo: bookmark.job.company?.logo_url || bookmark.company?.logo_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22 viewBox=%220 0 50 50%22%3E%3Crect width=%2250%22 height=%2250%22 fill=%22%239ca3af%22/%3E%3Ctext x=%2225%22 y=%2225%22 font-size=%2220%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23fff%22 font-weight=%22bold%22%3ECo%3C/text%3E%3C/svg%3E'
              },
              location: bookmark.job.location || bookmark.job.city || 'Remote',
              salary_range: bookmark.job.salary_min && bookmark.job.salary_max ? 
                `$${formatSalary(bookmark.job.salary_min)} - $${formatSalary(bookmark.job.salary_max)}` : 
                'Salary not disclosed',
              posted_days_ago: calculateDaysAgo(bookmark.job.created_at)
            } : null
          })).filter(b => b.job !== null),
          stats: {
            ...prev.stats,
            bookmarkedJobs: bookmarkList.length
          }
        }));
      }

      // Process job recommendations
      if (recommendationsResponse.status === 'fulfilled') {
        const recommendations = recommendationsResponse.value || {};
        const jobs = recommendations.recommendations || [];
        
        setDashboardData(prev => ({
          ...prev,
          recommendedJobs: jobs.map(job => {
            // Safely construct location string - handle both string and object formats
            let locationStr = 'Remote';
            if (job.location) {
              if (typeof job.location === 'string') {
                locationStr = job.location;
              } else if (typeof job.location === 'object' && job.location.display) {
                // Handle location object format {display, city, state, country, is_remote, type}
                locationStr = job.location.display || `${job.location.city || ''}, ${job.location.state || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Remote';
              }
            } else if (job.city || job.state) {
              locationStr = `${job.city || ''}, ${job.state || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Remote';
            } else if (job.is_remote) {
              locationStr = 'Remote';
            }

            // Process skills array
            let skillsList = [];
            if (job.required_skills) {
              if (typeof job.required_skills === 'string') {
                try {
                  // Try to parse if it's JSON string
                  skillsList = JSON.parse(job.required_skills);
                } catch {
                  // Otherwise split by comma
                  skillsList = job.required_skills.split(',').map(s => s.trim());
                }
              } else if (Array.isArray(job.required_skills)) {
                skillsList = job.required_skills;
              }
            }

            return {
              id: job.id,
              title: job.title || 'Job Position',
              company: {
                name: job.company?.name || 'Unknown Company',
                logo: job.company?.logo_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22 viewBox=%220 0 50 50%22%3E%3Crect width=%2250%22 height=%2250%22 fill=%22%239ca3af%22/%3E%3Ctext x=%2225%22 y=%2225%22 font-size=%2220%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23fff%22 font-weight=%22bold%22%3ECo%3C/text%3E%3C/svg%3E'
              },
              location: locationStr,
              employment_type: job.employment_type || 'full-time',
              salary_range: job.salary_min && job.salary_max ? 
                `$${formatSalary(job.salary_min)} - $${formatSalary(job.salary_max)}` : 
                'Salary not disclosed',
              match_score: job.match_score || 0,
              is_remote: job.is_remote || false,
              posted_days_ago: calculateDaysAgo(job.created_at || job.posted_at),
              skills: skillsList.slice(0, 3),
              match_reasons: job.match_reasons || [`${job.match_score || 0}% compatibility based on your profile`]
            };
          })
        }));
      } else {
        console.warn('Failed to load job recommendations:', recommendationsResponse.reason);
      }

      // Process featured ads (relevant opportunities)
      if (featuredAdsResponse.status === 'fulfilled') {
        const ads = featuredAdsResponse.value;
        loadRelevantAds(ads.featured_ads || []);
      } else {
        // Fallback to regular featured ads
        loadRelevantAds();
      }

      // Process interview schedule data
      if (interviewResponse.status === 'fulfilled') {
        const interviews = interviewResponse.value || {};
        const interviewList = interviews.interviews || [];
        setDashboardData(prev => ({
          ...prev,
          interviewSchedule: interviewList.map(interview => ({
            id: interview.id,
            job_title: interview.job_title || interview.application?.job?.title || 'Interview',
            company: interview.company_name || interview.application?.job?.company?.name || 'Unknown Company',
            date: interview.interview_date || interview.scheduled_at,
            type: interview.interview_type || 'video',
            interviewer: interview.interviewer_name || 'Hiring Team',
            status: interview.status || 'confirmed'
          }))
        }));
      } else {
        console.warn('Failed to load interview schedule:', interviewResponse.reason);
      }

      // Process skill gaps data
      if (skillGapsResponse.status === 'fulfilled') {
        const skillData = skillGapsResponse.value || {};
        const skillGaps = skillData.skill_gaps || [];
        setDashboardData(prev => ({
          ...prev,
          skillGaps: skillGaps.map(skill => ({
            skill: skill.skill_name || skill.skill,
            demand: skill.market_demand || skill.demand,
            your_level: skill.your_level || skill.proficiency || 0
          }))
        }));
      } else {
        console.warn('Failed to load skill gaps:', skillGapsResponse.reason);
      }

      // Process career insights data
      if (careerInsightsResponse.status === 'fulfilled') {
        const insights = careerInsightsResponse.value || {};
        setDashboardData(prev => ({
          ...prev,
          careerInsights: {
            avgSalaryIncrease: insights.avg_salary_increase || insights.avgSalaryIncrease || 0,
            marketDemand: insights.market_demand || insights.marketDemand || 'Medium',
            topSkillsInDemand: insights.top_skills_in_demand || insights.topSkillsInDemand || [],
            careerGrowthPotential: insights.career_growth_potential || insights.careerGrowthPotential || 0
          }
        }));
      } else {
        console.warn('Failed to load career insights:', careerInsightsResponse.reason);
      }

      // Process profile views
      if (profileViewsResponse.status === 'fulfilled') {
        const viewsData = profileViewsResponse.value || {};
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            profileViews: viewsData.total_views || viewsData.profile_views || 0
          }
        }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;
    
    // Weighted scoring for more accurate assessment
    const weights = { critical: 10, important: 7, optional: 3 };
    
    const fields = {
      critical: [
        profile.name || profile.full_name,
        profile.email,
        profile.job_seeker_profile?.desired_position,
        profile.job_seeker_profile?.bio || profile.bio,
      ],
      important: [
        profile.job_seeker_profile?.skills,
        profile.job_seeker_profile?.years_of_experience,
        profile.job_seeker_profile?.education_level,
        profile.job_seeker_profile?.resume_url,
        profile.job_seeker_profile?.job_type_preference,
      ],
      optional: [
        profile.profile_image,
        profile.phone_number,
        profile.job_seeker_profile?.preferred_location,
        profile.job_seeker_profile?.certifications,
        profile.job_seeker_profile?.portfolio_url,
        profile.job_seeker_profile?.linkedin_url,
      ]
    };
    
    let earned = 0, total = 0;
    
    Object.entries(fields).forEach(([category, fieldList]) => {
      fieldList.forEach(field => {
        total += weights[category];
        if (field && field !== '' && field !== 0) earned += weights[category];
      });
    });
    
    return Math.round((earned / total) * 100);
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

  // Recommendation filter and sort functions
  const applyFiltersAndSort = (jobs) => {
    let filtered = [...jobs];

    // Apply filters
    if (recFilters.minSalary > 0 || recFilters.maxSalary < 500000) {
      filtered = filtered.filter(job => {
        const salaryStr = job.salary_range || '';
        // Extract first number from salary range string like "$100k - $150k"
        const salaryMatch = salaryStr.match(/\$(\d+)/);
        if (salaryMatch) {
          const salary = parseInt(salaryMatch[1]) * 1000;
          return salary >= recFilters.minSalary && salary <= recFilters.maxSalary;
        }
        return true;
      });
    }

    if (recFilters.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(recFilters.location.toLowerCase()) ||
        job.location === 'Remote'
      );
    }

    if (recFilters.jobType) {
      filtered = filtered.filter(job => 
        job.employment_type.toLowerCase().includes(recFilters.jobType.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (recSortBy) {
        case 'relevance':
          return b.match_score - a.match_score;
        case 'date':
          return a.posted_days_ago - b.posted_days_ago;
        case 'salary':
          const salaryA = parseInt(a.salary_range?.match(/\$(\d+)/)?.[1] || 0) * 1000;
          const salaryB = parseInt(b.salary_range?.match(/\$(\d+)/)?.[1] || 0) * 1000;
          return salaryB - salaryA;
        default:
          return 0;
      }
    });

    setFilteredRecommendedJobs(filtered);
  };

  // Apply filters whenever they change
  useEffect(() => {
    applyFiltersAndSort(dashboardData.recommendedJobs);
  }, [dashboardData.recommendedJobs, recFilters, recSortBy]);

  const handleFilterChange = (filterName, value) => {
    setRecFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setRecFilters({
      minSalary: 0,
      maxSalary: 500000,
      location: '',
      jobType: '',
      experienceLevel: ''
    });
    setRecSortBy('relevance');
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
        // Update bookmarked IDs Set
        setBookmarkedJobIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await apiService.bookmarkJob(jobId);
        // Update bookmarked IDs Set
        setBookmarkedJobIds(prev => new Set([...prev, jobId]));
      }
      
      // Update stats
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          bookmarkedJobs: isCurrentlyBookmarked ? 
            Math.max(0, prev.stats.bookmarkedJobs - 1) : 
            prev.stats.bookmarkedJobs + 1
        }
      }));
      
    } catch (error) {
      console.error('Error bookmarking job:', error);
      setError('Failed to bookmark job. Please try again.');
      setTimeout(() => setError(null), 3000);
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
      
      if (!ads || ads.length === 0) {
        try {
          const response = await apiService.getPublicFeaturedAds(3);
          ads = response.featured_ads || [];
        } catch (fetchError) {
          console.warn('Could not fetch featured ads:', fetchError);
          ads = [];
        }
      }

      if (!ads || ads.length === 0) {
        setRelevantAds([]);
        return;
      }

      // Transform backend featured ads into relevant ads format
      const transformedAds = ads.map((ad, index) => {
        // Process skills
        let skillsList = [];
        if (ad.required_skills) {
          if (typeof ad.required_skills === 'string') {
            try {
              skillsList = JSON.parse(ad.required_skills);
            } catch {
              skillsList = ad.required_skills.split(',').map(s => s.trim());
            }
          } else if (Array.isArray(ad.required_skills)) {
            skillsList = ad.required_skills;
          }
        }
        
        // Default tags if no skills
        if (skillsList.length === 0) {
          skillsList = ['React', 'JavaScript', 'Remote', 'Full-time'];
        }

        return {
          id: ad.id || index + 1,
          type: 'job_promotion',
          title: ad.title || 'Featured Opportunity',
          description: ad.summary || ad.description || 'Exciting opportunity in a growing company.',
          image: ad.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22 viewBox=%220 0 400 200%22%3E%3Crect width=%22400%22 height=%22200%22 fill=%22%23d1d5db%22/%3E%3Ctext x=%22200%22 y=%22100%22 font-size=%2224%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239ca3af%22%3EFeatured Opportunity%3C/text%3E%3C/svg%3E',
          company: {
            name: ad.company_name || ad.company?.name || 'Tech Company',
            logo: ad.company_logo || ad.company?.logo_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Crect width=%2260%22 height=%2260%22 fill=%22%239ca3af%22/%3E%3Ctext x=%2230%22 y=%2230%22 font-size=%2224%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23fff%22 font-weight=%22bold%22%3ECo%3C/text%3E%3C/svg%3E',
            rating: 4.5 + (Math.random() * 0.5), // Generate rating between 4.5-5.0
            size: `${Math.floor(Math.random() * 500) + 50}-${Math.floor(Math.random() * 500) + 500} employees`
          },
          matchScore: Math.floor(Math.random() * 15) + 85, // 85-100% match
          callToAction: 'Apply Now',
          link: `/jobs/${ad.id}`,
          status: 'active',
          relevanceReason: 'Matches your skills and experience level',
          tags: skillsList.slice(0, 5),
          salary: ad.salary_min && ad.salary_max ? 
            `$${formatSalary(ad.salary_min)} - $${formatSalary(ad.salary_max)}` : 
            '$80k - $120k',
          location: ad.location || (ad.city ? `${ad.city}, ${ad.state || ''}` : 'Remote'),
          benefits: ['Health', 'Dental', 'Stock Options', 'Remote Work'],
          stats: {
            views: Math.floor(Math.random() * 2000) + 500,
            applications: Math.floor(Math.random() * 100) + 20,
            interactions: Math.floor(Math.random() * 100) + 20,
            responseRate: `${Math.floor(Math.random() * 20) + 75}%`
          }
        };
      });

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
      // Set empty array on error to prevent undefined issues
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
    <div className="w-full min-h-screen bg-gradient-to-br from-[#001F3F] via-[#0a2847] to-[#001F3F]">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-white shadow-lg flex-shrink-0">
            <AvatarImage src={dashboardData.profile.avatar} alt={dashboardData.profile.name} />
            <AvatarFallback className="bg-gradient-to-br from-[#001F3F] to-[#1BA398] text-white font-semibold text-sm sm:text-base">
              {dashboardData.profile.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-[#1BA398] to-[#FF6B35] bg-clip-text text-transparent truncate">
              Welcome back, {dashboardData.profile.name.split(' ')[0]}!
            </h1>
            <p className="text-sm sm:text-base text-[#1BA398] truncate">
              {dashboardData.profile.title} • {dashboardData.profile.location || 'Location not specified'}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${dashboardData.profile.open_to_opportunities ? 'animate-pulse' : 'bg-gray-400'}` } style={{backgroundColor: dashboardData.profile.open_to_opportunities ? '#1BA398' : undefined}}></div>
                <span className="text-xs sm:text-sm" style={{color: dashboardData.profile.open_to_opportunities ? '#1BA398' : '#888'}}>
                  {dashboardData.profile.open_to_opportunities ? '● Open to opportunities' : '● Not looking'}
                </span>
              </div>
              {dashboardData.profile.skills && dashboardData.profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dashboardData.profile.skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-[#1BA398]/50 text-[#1BA398] bg-[#1BA398]/5">
                      {skill}
                    </Badge>
                  ))}
                  {dashboardData.profile.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs border-[#1BA398]/50 text-[#1BA398] bg-[#1BA398]/5">
                      +{dashboardData.profile.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          <Button 
            onClick={refreshData}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="border-[#1BA398] hover:bg-[#1BA398]/10 text-[#1BA398] flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            onClick={() => navigate('/jobseeker/cv-builder')}
            variant="outline"
            size="sm"
            className="border-[#FF6B35] hover:bg-[#FF6B35]/10 text-[#FF6B35] flex-1 sm:flex-none"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">AI CV Builder</span>
            <span className="sm:hidden">CV</span>
          </Button>
          <Button 
            onClick={() => navigate('/jobs')}
            size="sm"
            className="bg-gradient-to-r from-[#FF6B35] to-[#001F3F] hover:from-[#FF6B35]/90 hover:to-[#001F3F]/90 shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none"
          >
            <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Browse Jobs</span>
            <span className="sm:hidden">Jobs</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/jobseeker/profile')}
            className="border-[#001F3F] hover:bg-[#001F3F]/10 text-[#001F3F] w-full lg:w-auto"
          >
            <span className="hidden sm:inline">Complete Profile ({dashboardData.profile.profile_completion}%)</span>
            <span className="sm:hidden">Profile {dashboardData.profile.profile_completion}%</span>
          </Button>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {dashboardData.profile.profile_completion < 100 && (
        <Card className="border-l-4 border-l-[#1BA398] bg-gradient-to-r from-[#1BA398]/10 to-[#FF6B35]/10 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-[#1BA398]/20 to-[#FF6B35]/20 rounded-xl flex-shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6" style={{color: '#1BA398'}} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 text-sm sm:text-base" style={{color: '#001F3F'}}>Boost Your Profile Visibility</h3>
                <p className="text-xs sm:text-sm mb-3" style={{color: '#1BA398'}}>
                  Complete your profile to get 3x more job recommendations and increase your visibility to employers
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <Progress value={dashboardData.profile.profile_completion} className="w-full sm:w-48 h-2 sm:h-3" />
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap text-[#1BA398]">
                    {dashboardData.profile.profile_completion}% complete
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/jobseeker/profile')}
              className="bg-[#FF6B35] border-[#FF6B35] text-white hover:bg-[#FF6B35]/90 shadow-sm w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Complete Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Relevant Advertisements */}
      {relevantAds.length > 0 && (
        <Card className="border-l-4 border-l-[#1BA398] bg-gradient-to-r from-[#1BA398]/15 to-[#FF6B35]/10 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6" style={{color: '#1BA398'}} />
                <div>
                  <CardTitle className="text-white">Opportunities Tailored for You</CardTitle>
                  <CardDescription className="text-[#1BA398]">
                    Personalized recommendations based on your profile and preferences
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-[#1BA398] bg-[#1BA398]/20" style={{color: '#1BA398'}}>
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
                        {ad.location}
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
                      className="w-full bg-gradient-to-r from-[#FF6B35] to-[#1BA398] hover:from-[#FF6B35]/90 hover:to-[#1BA398]/90 text-xs group"
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
        <Card className="bg-gradient-to-br from-[#1BA398] to-[#1BA398]/80 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1BA398]/80 text-sm font-medium">Active Applications</p>
                <p className="text-3xl font-bold">{dashboardData.stats.pendingApplications}</p>
                <p className="text-[#1BA398]/80 text-xs">of {dashboardData.stats.totalApplications} total</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#FF6B35] to-[#FF6B35]/80 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-medium">Interviews</p>
                <p className="text-3xl font-bold">{ dashboardData.stats.interviewsScheduled}</p>
                <p className="text-white/80 text-xs">scheduled</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#001F3F] to-[#001F3F]/80 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-medium">Bookmarked Jobs</p>
                <p className="text-3xl font-bold">{dashboardData.stats.bookmarkedJobs}</p>
                <p className="text-white/80 text-xs">saved opportunities</p>
              </div>
              <div className="p-3 bg-[#1BA398]/30 rounded-lg backdrop-blur">
                <Bookmark className="w-6 h-6" style={{color: '#1BA398'}} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#FF6B35] to-[#FF6B35]/80 text-white shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-xs sm:text-sm font-medium">Job Offers</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{dashboardData.stats.offersReceived}</p>
                <p className="text-white/80 text-[10px] sm:text-xs">received</p>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
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

      <Tabs defaultValue="recommendations" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-[#0a2847]/50 shadow-lg rounded-xl p-1 gap-1 border border-[#1BA398]/30 backdrop-blur-sm">
          <TabsTrigger 
            value="recommendations"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1BA398] data-[state=active]:to-[#FF6B35] data-[state=active]:text-white rounded-lg transition-all duration-300 text-xs sm:text-sm text-gray-300 hover:text-[#1BA398]"
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">For You</span>
            <span className="sm:hidden">Jobs</span>
          </TabsTrigger>
          <TabsTrigger 
            value="applications"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1BA398] data-[state=active]:to-[#FF6B35] data-[state=active]:text-white rounded-lg transition-all duration-300 text-xs sm:text-sm text-gray-300 hover:text-[#1BA398]"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Applications</span>
            <span className="sm:hidden">Apps</span>
          </TabsTrigger>
          <TabsTrigger 
            value="interviews"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B35] data-[state=active]:to-[#1BA398] data-[state=active]:text-white rounded-lg transition-all duration-300 text-xs sm:text-sm text-gray-300 hover:text-[#FF6B35]"
          >
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden lg:inline">Interviews</span>
            <span className="lg:hidden">Calls</span>
          </TabsTrigger>
          <TabsTrigger 
            value="skills"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1BA398] data-[state=active]:to-[#FF6B35] data-[state=active]:text-white rounded-lg transition-all duration-300 text-xs sm:text-sm text-gray-300 hover:text-[#1BA398]"
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger 
            value="insights"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B35] data-[state=active]:to-[#1BA398] data-[state=active]:text-white rounded-lg transition-all duration-300 text-xs sm:text-sm col-span-2 sm:col-span-1 text-gray-300 hover:text-[#1BA398]"
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4 sm:space-y-6">
          {/* Filter and sort controls */}
          {showRecFilters && (
            <Card className="border-[#1BA398]/50 border bg-[#0a2847]/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Salary Range */}
                  <div>
                    <label className="text-sm font-medium text-[#1BA398] mb-2 block">Salary Range (Min)</label>
                    <Input 
                      type="number" 
                      placeholder="Min salary" 
                      value={recFilters.minSalary}
                      onChange={(e) => handleFilterChange('minSalary', parseInt(e.target.value) || 0)}
                      className="text-xs bg-[#001F3F]/50 border-[#1BA398]/30 text-white placeholder-gray-400 focus:border-[#1BA398] focus:ring-[#1BA398]/50"
                    />
                  </div>
                  
                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium text-[#1BA398] mb-2 block">Location</label>
                    <Input 
                      type="text" 
                      placeholder="e.g., Remote, NYC" 
                      value={recFilters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="text-xs bg-[#001F3F]/50 border-[#1BA398]/30 text-white placeholder-gray-400 focus:border-[#1BA398] focus:ring-[#1BA398]/50"
                    />
                  </div>
                  
                  {/* Job Type */}
                  <div>
                    <label className="text-sm font-medium text-[#1BA398] mb-2 block">Job Type</label>
                    <select 
                      value={recFilters.jobType}
                      onChange={(e) => handleFilterChange('jobType', e.target.value)}
                      className="w-full px-3 py-2 border border-[#1BA398]/30 rounded-md bg-[#001F3F]/50 text-sm text-white focus:border-[#1BA398] focus:ring-[#1BA398]/50"
                    >
                      <option value="">All Types</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                    <select 
                      value={recSortBy}
                      onChange={(e) => setRecSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    >
                      <option value="relevance">Most Relevant</option>
                      <option value="date">Most Recent</option>
                      <option value="salary">Highest Salary</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowRecFilters(false)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-xl border-0 bg-white border-t-4 border-t-[#1BA398]">
            <CardHeader className="bg-gradient-to-r from-[#1BA398]/10 to-[#FF6B35]/10 border-b-2 border-[#1BA398]/20 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{color: '#1BA398'}} />
                    Recommended Jobs for You
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    AI-powered job matches based on your profile and preferences
                    {filteredRecommendedJobs.length < dashboardData.recommendedJobs.length && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({filteredRecommendedJobs.length} of {dashboardData.recommendedJobs.length})
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowRecFilters(!showRecFilters)}
                    className={`border-[#1BA398] text-[#1BA398] text-xs sm:text-sm font-medium ${showRecFilters ? 'bg-[#1BA398] text-white' : 'hover:bg-[#1BA398]/10'}`}
                  >
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Filters
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshData}
                    disabled={refreshing}
                    className="border-[#1BA398] text-[#1BA398] hover:bg-[#1BA398]/10 text-xs sm:text-sm font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/jobs')}
                    className="border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/10 text-xs sm:text-sm font-medium"
                  >
                    See All Jobs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredRecommendedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Recommendations Yet</h3>
                  <p className="text-gray-500 mb-6">
                    {dashboardData.recommendedJobs.length === 0 
                      ? 'Complete your profile to get personalized job recommendations'
                      : 'No jobs match your current filters. Try adjusting them.'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {dashboardData.recommendedJobs.length === 0 && (
                      <Button 
                        onClick={() => navigate('/jobseeker/profile')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Complete Profile
                      </Button>
                    )}
                    {filteredRecommendedJobs.length === 0 && dashboardData.recommendedJobs.length > 0 && (
                      <Button 
                        onClick={resetFilters}
                        variant="outline"
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecommendedJobs.map((job) => (
                    <Card key={job.id} className="border-l-4 border-l-[#1BA398] bg-[#0a2847]/80 hover:shadow-xl hover:border-l-[#FF6B35] transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
                      <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                          <div className="flex-1 w-full min-w-0">
                            <div className="flex items-start gap-2 sm:gap-3 mb-3">
                              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-[#1BA398]/30 flex-shrink-0">
                                <AvatarImage src={job.company.logo} alt={job.company.name} />
                                <AvatarFallback className="bg-gradient-to-r from-[#1BA398] to-[#FF6B35] text-white font-semibold text-xs sm:text-sm">
                                  {job.company.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base md:text-lg text-white hover:text-[#FF6B35] cursor-pointer transition-colors truncate">
                                  {job.title}
                                </h3>
                                <p className="text-[#1BA398] font-medium text-xs sm:text-sm truncate">{job.company.name}</p>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300 mt-1">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[120px] sm:max-w-none">{job.location}</span>
                                  </span>
                                  {job.is_remote && (
                                    <Badge variant="outline" className="text-[#1BA398] border-[#1BA398] bg-[#1BA398]/20 text-xs">
                                      Remote
                                    </Badge>
                                  )}
                                  <span className="capitalize hidden sm:inline">{job.employment_type}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {job.posted_days_ago}d ago
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                              <span className="font-semibold text-[#FF6B35] text-sm sm:text-base md:text-lg">{job.salary_range}</span>
                              <Badge className="px-3 py-1 font-semibold bg-[#1BA398]/80 text-white border-0">
                                <Star className="w-3 h-3 mr-1" />
                                {job.match_score}% match
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {job.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="bg-[#1BA398]/20 text-[#1BA398] border-[#1BA398]/40">
                                  {skill}
                                </Badge>
                              ))}
                            </div>

                            <div className="mb-4">
                              <p className="text-sm font-medium text-[#1BA398] mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#1BA398]" />
                                Why this job matches:
                              </p>
                              <ul className="text-sm text-gray-300 space-y-1">
                                {job.match_reasons.map((reason, index) => (
                                  <li key={index} className="flex items-center gap-2 pl-2">
                                    <div className="w-1 h-1 bg-[#FF6B35] rounded-full"></div>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-6">
                            <Button 
                              onClick={() => handleJobApplication(job.id)}
                              className="bg-gradient-to-r from-[#FF6B35] to-[#1BA398] hover:from-[#FF6B35]/90 hover:to-[#1BA398]/90 shadow-lg hover:shadow-xl transition-all duration-300 text-white font-semibold"
                            >
                              <Briefcase className="w-4 h-4 mr-2" />
                              Apply Now
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleJobBookmark(job.id, false)}
                              className="border-[#1BA398] hover:bg-[#1BA398]/10 text-[#1BA398]"
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
          <Card className="border-t-4 border-t-[#1BA398] bg-[#0a2847]/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-[#1BA398]/20 to-[#FF6B35]/10 border-b border-[#1BA398]/30">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5" style={{color: '#1BA398'}} />
                Your Applications
              </CardTitle>
              <CardDescription className="text-[#1BA398]">Track the status of your job applications</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.recentApplications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Applications Yet</h3>
                  <p className="text-gray-300 mb-6">
                    Start applying to jobs that match your profile
                  </p>
                  <Button 
                    onClick={() => navigate('/jobs')}
                    className="bg-gradient-to-r from-[#1BA398] to-[#FF6B35] hover:from-[#1BA398]/90 hover:to-[#FF6B35]/90 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse Jobs
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {dashboardData.recentApplications.map((application) => (
                  <div key={application.id} className="p-4 border border-[#1BA398]/30 bg-[#001F3F]/30 rounded-lg hover:bg-[#1BA398]/10 hover:border-[#1BA398]/60 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{application.job.title}</h4>
                        <p className="text-gray-300 text-sm">
                          {typeof application.job.company === 'string' 
                            ? application.job.company 
                            : application.job.company?.name || 'Unknown Company'
                          }
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span>Applied: {formatDate(application.applied_date)}</span>
                          <span>Updated: {formatDate(application.last_update)}</span>
                          <span className="font-medium" style={{color: '#1BA398'}}>{application.stage}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={`${getStatusColor(application.status)} text-white`}
                        >
                          {application.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="sm" style={{color: '#1BA398'}}>View</Button>
                      </div>
                    </div>
                  </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 border-[#1BA398] text-[#1BA398] hover:bg-[#1BA398]/10" onClick={() => navigate('/jobseeker/applications')}>
                    View All Applications
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <Card className="border-t-4 border-t-[#FF6B35]">
            <CardHeader className="bg-gradient-to-r from-[#FF6B35]/10 to-[#001F3F]/10 border-b-2 border-[#FF6B35]/20">
              <CardTitle className="flex items-center gap-2" style={{color: '#001F3F'}}>
                <Calendar className="w-5 h-5" style={{color: '#FF6B35'}} />
                Upcoming Interviews
              </CardTitle>
              <CardDescription>Your scheduled interviews and meetings</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.interviewSchedule.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Interviews Scheduled</h3>
                  <p className="text-gray-500 mb-6">
                    Keep applying and you'll start getting interview invitations
                  </p>
                  <Button 
                    onClick={() => navigate('/jobs')}
                    className="bg-gradient-to-r from-[#FF6B35] to-[#1BA398] hover:from-[#FF6B35]/90 hover:to-[#1BA398]/90"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Find Opportunities
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.interviewSchedule.map((interview) => (
                    <Card key={interview.id} className="border-l-4 border-l-[#1BA398] hover:shadow-lg transition-shadow">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card className="border-t-4 border-t-[#1BA398]">
            <CardHeader className="bg-gradient-to-r from-[#1BA398]/10 to-[#FF6B35]/10 border-b-2 border-[#1BA398]/20">
              <CardTitle className="flex items-center gap-2" style={{color: '#001F3F'}}>
                <TrendingUp className="w-5 h-5" style={{color: '#1BA398'}} />
                Skill Development
              </CardTitle>
              <CardDescription>Bridge skill gaps to unlock better opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.skillGaps.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Skill Gap Analysis Yet</h3>
                  <p className="text-gray-500 mb-6">
                    Complete your profile to get personalized skill recommendations
                  </p>
                  <Button 
                    onClick={() => navigate('/jobseeker/profile')}
                    className="bg-gradient-to-r from-[#001F3F] to-[#1BA398] hover:from-[#001F3F]/90 hover:to-[#1BA398]/90"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-t-4 border-t-[#FF6B35]">
              <CardHeader className="bg-gradient-to-r from-[#FF6B35]/10 to-[#001F3F]/10 border-b-2 border-[#FF6B35]/20">
                <CardTitle className="flex items-center gap-2" style={{color: '#001F3F'}}>
                  <BarChart3 className="w-5 h-5" style={{color: '#FF6B35'}} />
                  Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-[#1BA398]/10 to-[#1BA398]/5 rounded-lg border border-[#1BA398]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5" style={{color: '#1BA398'}} />
                    <span className="font-medium" style={{color: '#001F3F'}}>Salary Potential</span>
                  </div>
                  <p className="text-2xl font-bold" style={{color: '#1BA398'}}>
                    +{dashboardData.careerInsights.avgSalaryIncrease}%
                  </p>
                  <p className="text-sm text-gray-600">Expected increase in next role</p>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-[#FF6B35]/10 to-[#FF6B35]/5 rounded-lg border border-[#FF6B35]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5" style={{color: '#FF6B35'}} />
                    <span className="font-medium" style={{color: '#001F3F'}}>Market Demand</span>
                  </div>
                  <p className="text-2xl font-bold" style={{color: '#FF6B35'}}>
                    {dashboardData.careerInsights.marketDemand}
                  </p>
                  <p className="text-sm text-gray-600">For your skill set</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-[#1BA398]">
              <CardHeader className="bg-gradient-to-r from-[#1BA398]/10 to-[#FF6B35]/10 border-b-2 border-[#1BA398]/20">
                <CardTitle style={{color: '#001F3F'}}>Trending Skills</CardTitle>
                <CardDescription>Most in-demand skills in your field</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.careerInsights.topSkillsInDemand.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#1BA398]/5 to-[#FF6B35]/5 rounded-lg border border-[#1BA398]/20">
                      <span className="font-medium" style={{color: '#001F3F'}}>{skill}</span>
                      <Badge className="bg-[#1BA398] hover:bg-[#1BA398]/90 text-white">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
