import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Eye, 
  Check, 
  X, 
  Clock, 
  Search,
  Filter,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  Zap,
  Target,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MousePointer,
  BarChart3,
  Edit,
  Trash2,
  Ban,
  Play,
  Pause
} from 'lucide-react';

const AdvertisementManagement = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAd, setSelectedAd] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdvertisements();
  }, []);

  useEffect(() => {
    filterAdvertisements();
  }, [advertisements, searchQuery, statusFilter, typeFilter]);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockAds = [
        {
          id: 1,
          title: 'Senior Full Stack Developer - Remote Opportunity',
          description: 'Join our innovative team building next-gen fintech solutions. React, Node.js, competitive package with equity.',
          type: 'job_promotion',
          company: {
            id: 1,
            name: 'FinTech Innovations',
            logo: '/api/placeholder/60/60',
            verified: true
          },
          status: 'pending',
          priority: 1,
          startDate: '2024-01-20',
          endDate: '2024-02-20',
          budget: 2500,
          targetAudience: {
            locations: ['San Francisco', 'Remote'],
            skills: ['React', 'Node.js', 'JavaScript'],
            experienceLevel: 'Senior'
          },
          content: {
            image: '/api/placeholder/600/300',
            callToAction: 'Apply Now',
            landingUrl: '/jobs/senior-fullstack-fintech'
          },
          analytics: {
            impressions: 15250,
            clicks: 892,
            applications: 67,
            ctr: 5.85,
            conversionRate: 7.51
          },
          submittedAt: '2024-01-15T10:30:00Z',
          reviewedAt: null,
          reviewedBy: null,
          rejectionReason: null
        },
        {
          id: 2,
          title: 'TechCorp - Where Innovation Thrives',
          description: 'Join Silicon Valley\'s fastest-growing startup. We\'re building the future of work with cutting-edge technology.',
          type: 'company_branding',
          company: {
            id: 2,
            name: 'TechCorp Inc.',
            logo: '/api/placeholder/60/60',
            verified: true
          },
          status: 'approved',
          priority: 2,
          startDate: '2024-01-10',
          endDate: '2024-02-10',
          budget: 5000,
          targetAudience: {
            locations: ['San Francisco', 'Bay Area'],
            skills: ['Software Development', 'Engineering'],
            experienceLevel: 'All Levels'
          },
          content: {
            image: '/api/placeholder/600/300',
            callToAction: 'Explore Opportunities',
            landingUrl: '/companies/techcorp'
          },
          analytics: {
            impressions: 28750,
            clicks: 1456,
            applications: 234,
            ctr: 5.07,
            conversionRate: 16.07
          },
          submittedAt: '2024-01-08T14:20:00Z',
          reviewedAt: '2024-01-09T09:15:00Z',
          reviewedBy: 'admin@talentsphere.com',
          rejectionReason: null
        },
        {
          id: 3,
          title: 'Revolutionary AI Platform Development',
          description: 'Be part of building revolutionary AI tools that developers love. We\'re looking for passionate engineers.',
          type: 'product_showcase',
          company: {
            id: 3,
            name: 'AI Dynamics',
            logo: '/api/placeholder/60/60',
            verified: false
          },
          status: 'rejected',
          priority: 3,
          startDate: '2024-01-25',
          endDate: '2024-02-25',
          budget: 3000,
          targetAudience: {
            locations: ['Remote', 'New York'],
            skills: ['AI', 'Machine Learning', 'Python'],
            experienceLevel: 'Mid to Senior'
          },
          content: {
            image: '/api/placeholder/600/300',
            callToAction: 'Learn More',
            landingUrl: '/companies/ai-dynamics/careers'
          },
          analytics: {
            impressions: 0,
            clicks: 0,
            applications: 0,
            ctr: 0,
            conversionRate: 0
          },
          submittedAt: '2024-01-12T16:45:00Z',
          reviewedAt: '2024-01-13T11:30:00Z',
          reviewedBy: 'admin@talentsphere.com',
          rejectionReason: 'Company verification required before advertising approval'
        },
        {
          id: 4,
          title: 'Lead Product Manager - Healthcare Tech',
          description: 'Drive product strategy for healthcare solutions that impact millions of lives. Remote-first company with strong mission.',
          type: 'job_promotion',
          company: {
            id: 4,
            name: 'HealthTech Solutions',
            logo: '/api/placeholder/60/60',
            verified: true
          },
          status: 'active',
          priority: 1,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          budget: 1500,
          targetAudience: {
            locations: ['Remote'],
            skills: ['Product Management', 'Healthcare', 'Strategy'],
            experienceLevel: 'Senior'
          },
          content: {
            image: '/api/placeholder/600/300',
            callToAction: 'Apply Today',
            landingUrl: '/jobs/lead-pm-healthcare'
          },
          analytics: {
            impressions: 12890,
            clicks: 723,
            applications: 89,
            ctr: 5.61,
            conversionRate: 12.31
          },
          submittedAt: '2023-12-28T09:00:00Z',
          reviewedAt: '2023-12-29T10:15:00Z',
          reviewedBy: 'admin@talentsphere.com',
          rejectionReason: null
        }
      ];
      setAdvertisements(mockAds);
    } catch (error) {
      console.error('Error loading advertisements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAdvertisements = () => {
    let filtered = advertisements;

    if (searchQuery) {
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ad => ad.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(ad => ad.type === typeFilter);
    }

    setFilteredAds(filtered);
  };

  const handleApproveAd = async (adId) => {
    try {
      // Mock API call
      console.log(`Approving advertisement ${adId}`);
      setAdvertisements(prev => prev.map(ad => 
        ad.id === adId 
          ? { ...ad, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: 'admin@talentsphere.com' }
          : ad
      ));
    } catch (error) {
      console.error('Error approving advertisement:', error);
    }
  };

  const handleRejectAd = async (adId, reason) => {
    try {
      // Mock API call
      console.log(`Rejecting advertisement ${adId} with reason: ${reason}`);
      setAdvertisements(prev => prev.map(ad => 
        ad.id === adId 
          ? { 
              ...ad, 
              status: 'rejected', 
              reviewedAt: new Date().toISOString(), 
              reviewedBy: 'admin@talentsphere.com',
              rejectionReason: reason
            }
          : ad
      ));
    } catch (error) {
      console.error('Error rejecting advertisement:', error);
    }
  };

  const handlePauseAd = async (adId) => {
    try {
      setAdvertisements(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, status: 'paused' } : ad
      ));
    } catch (error) {
      console.error('Error pausing advertisement:', error);
    }
  };

  const handleResumeAd = async (adId) => {
    try {
      setAdvertisements(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, status: 'active' } : ad
      ));
    } catch (error) {
      console.error('Error resuming advertisement:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-blue-100 text-blue-800 border-blue-300',
      active: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      paused: 'bg-gray-100 text-gray-800 border-gray-300',
      expired: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      active: Zap,
      rejected: XCircle,
      paused: Pause,
      expired: AlertTriangle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeIcon = (type) => {
    const icons = {
      job_promotion: Briefcase,
      company_branding: Building,
      product_showcase: Target
    };
    const Icon = icons[type] || Target;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      job_promotion: 'Job Promotion',
      company_branding: 'Company Branding',
      product_showcase: 'Product Showcase'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const AdReviewDialog = ({ ad, onApprove, onReject, onClose }) => {
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const handleReject = () => {
      if (rejectionReason.trim()) {
        onReject(ad.id, rejectionReason);
        onClose();
      }
    };

    return (
      <Dialog open={!!ad} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getTypeIcon(ad?.type)}
              Review Advertisement: {ad?.title}
            </DialogTitle>
            <DialogDescription>
              Review and approve or reject this advertisement submission
            </DialogDescription>
          </DialogHeader>

          {ad && (
            <div className="space-y-6">
              {/* Ad Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Advertisement Preview</h3>
                <div className="bg-white rounded-lg border-l-4 border-l-blue-500 overflow-hidden">
                  <img 
                    src={ad.content.image} 
                    alt={ad.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src={ad.company.logo} 
                        alt={ad.company.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-sm">{ad.title}</h4>
                        <p className="text-xs text-gray-600">{ad.company.name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{ad.description}</p>
                    <Button size="sm" className="w-full">
                      {ad.content.callToAction}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Ad Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Company:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{ad.company.name}</span>
                        {ad.company.verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Budget:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(ad.budget)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Campaign Duration:</span>
                      <span className="text-sm">
                        {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Target Audience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Locations:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ad.targetAudience.locations.map((location, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ad.targetAudience.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Experience Level:</span>
                      <span className="text-sm">{ad.targetAudience.experienceLevel}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Analytics (if approved/active) */}
              {(ad.status === 'approved' || ad.status === 'active') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Performance Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {ad.analytics.impressions.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Impressions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {ad.analytics.clicks.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {ad.analytics.applications.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Applications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {ad.analytics.ctr.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-600">CTR</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {ad.analytics.conversionRate.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-600">Conversion</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {ad.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  {!showRejectForm ? (
                    <>
                      <Button 
                        onClick={() => onApprove(ad.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve Advertisement
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => setShowRejectForm(true)}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject Advertisement
                      </Button>
                    </>
                  ) : (
                    <div className="flex-1 space-y-3">
                      <Textarea
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive"
                          onClick={handleReject}
                          disabled={!rejectionReason.trim()}
                          className="flex-1"
                        >
                          Confirm Rejection
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Info */}
              {ad.status === 'rejected' && ad.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Rejection Reason:</h4>
                  <p className="text-sm text-red-700">{ad.rejectionReason}</p>
                  <div className="text-xs text-red-600 mt-2">
                    Reviewed by {ad.reviewedBy} on {formatDate(ad.reviewedAt)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advertisement Management</h2>
          <p className="text-gray-600">Review and manage company advertisements</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            {advertisements.filter(ad => ad.status === 'pending').length} Pending Review
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-300">
            {advertisements.filter(ad => ad.status === 'active').length} Active
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search advertisements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="paused">Paused</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="job_promotion">Job Promotion</option>
              <option value="company_branding">Company Branding</option>
              <option value="product_showcase">Product Showcase</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Advertisement List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading advertisements...</p>
          </div>
        ) : filteredAds.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No advertisements found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAds.map((ad) => (
            <Card key={ad.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={ad.company.logo} 
                        alt={ad.company.name}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{ad.title}</h3>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getTypeIcon(ad.type)}
                            {getTypeLabel(ad.type)}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{ad.company.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>Budget: {formatCurrency(ad.budget)}</span>
                          <span>Submitted: {formatDate(ad.submittedAt)}</span>
                          {ad.reviewedAt && (
                            <span>Reviewed: {formatDate(ad.reviewedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{ad.description}</p>

                    <div className="flex items-center gap-4">
                      <Badge className={`${getStatusColor(ad.status)} flex items-center gap-1`}>
                        {getStatusIcon(ad.status)}
                        {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                      </Badge>
                      
                      {(ad.status === 'active' || ad.status === 'approved') && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {ad.analytics.impressions.toLocaleString()} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="w-3 h-3" />
                            {ad.analytics.clicks.toLocaleString()} clicks
                          </span>
                          <span className="text-green-600 font-medium">
                            {ad.analytics.ctr.toFixed(1)}% CTR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAd(ad)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>

                    {ad.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleApproveAd(ad.id)}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedAd(ad)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {ad.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseAd(ad.id)}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}

                    {ad.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => handleResumeAd(ad.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <AdReviewDialog
        ad={selectedAd}
        onApprove={handleApproveAd}
        onReject={handleRejectAd}
        onClose={() => setSelectedAd(null)}
      />
    </div>
  );
};

export default AdvertisementManagement;
