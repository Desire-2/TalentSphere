import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye, 
  BarChart3, 
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  Pause,
  Play,
  Edit,
  Trash2,
  Star,
  Image,
  MapPin,
  Clock,
  Users,
  MousePointer,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { useNavigate } from 'react-router-dom';

const CompanyAdvertising = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateAdDialog, setShowCreateAdDialog] = useState(false);
  const [advertisingData, setAdvertisingData] = useState({
    stats: {
      activeAds: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalSpent: 0,
      applicationsGenerated: 0,
      averageCTR: 0
    },
    activeAds: [],
    adPackages: [],
    recentPerformance: [],
    companyInfo: null
  });

  const [newAd, setNewAd] = useState({
    type: 'job_promotion', // job_promotion, company_branding, product_showcase
    title: '',
    description: '',
    image: null,
    targetAudience: '',
    budget: '',
    duration: '30',
    locations: [],
    keywords: [],
    link: '',
    callToAction: 'Apply Now'
  });

  useEffect(() => {
    loadAdvertisingData();
  }, []);

  const loadAdvertisingData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      setAdvertisingData({
        stats: {
          activeAds: 5,
          totalImpressions: 45670,
          totalClicks: 2341,
          totalSpent: 1250.00,
          applicationsGenerated: 187,
          averageCTR: 5.1
        },
        activeAds: [
          {
            id: 1,
            type: 'job_promotion',
            title: 'Senior React Developer Position',
            description: 'Join our innovative team building next-gen applications',
            image: '/api/placeholder/400/200',
            status: 'active',
            budget: 500,
            spent: 342.50,
            impressions: 15230,
            clicks: 892,
            applications: 67,
            ctr: 5.9,
            start_date: '2024-08-01T00:00:00Z',
            end_date: '2024-08-31T23:59:59Z',
            target_locations: ['San Francisco', 'Remote'],
            target_keywords: ['React', 'JavaScript', 'Frontend']
          },
          {
            id: 2,
            type: 'company_branding',
            title: 'TechCorp - Where Innovation Meets Excellence',
            description: 'Discover career opportunities at Silicon Valley\'s fastest-growing startup',
            image: '/api/placeholder/400/200',
            status: 'active',
            budget: 800,
            spent: 245.75,
            impressions: 22340,
            clicks: 1156,
            applications: 43,
            ctr: 5.2,
            start_date: '2024-08-05T00:00:00Z',
            end_date: '2024-09-05T23:59:59Z',
            target_locations: ['San Francisco', 'New York', 'Remote'],
            target_keywords: ['Startup', 'Innovation', 'Technology']
          },
          {
            id: 3,
            type: 'product_showcase',
            title: 'Revolutionary AI Platform - Now Hiring Talent',
            description: 'Be part of building the future of artificial intelligence',
            image: '/api/placeholder/400/200',
            status: 'paused',
            budget: 300,
            spent: 89.25,
            impressions: 5420,
            clicks: 234,
            applications: 12,
            ctr: 4.3,
            start_date: '2024-07-20T00:00:00Z',
            end_date: '2024-08-20T23:59:59Z',
            target_locations: ['Remote'],
            target_keywords: ['AI', 'Machine Learning', 'Python']
          }
        ],
        adPackages: [
          {
            id: 1,
            name: 'Starter Boost',
            description: 'Perfect for single job promotions',
            duration_days: 30,
            price: 299,
            features: ['Homepage placement', 'Category top listing', 'Basic analytics'],
            popular: false
          },
          {
            id: 2,
            name: 'Professional Growth',
            description: 'Enhanced visibility for growing companies',
            duration_days: 60,
            price: 599,
            features: ['Premium homepage placement', 'Category spotlight', 'Advanced analytics', 'Social media promotion'],
            popular: true
          },
          {
            id: 3,
            name: 'Enterprise Suite',
            description: 'Maximum exposure for large campaigns',
            duration_days: 90,
            price: 1299,
            features: ['Hero homepage placement', 'Multi-category presence', 'Custom analytics dashboard', 'Dedicated account manager'],
            popular: false
          }
        ],
        companyInfo: {
          name: 'TechCorp Inc.',
          logo: '/api/placeholder/80/80',
          industry: 'Technology',
          website: 'https://techcorp.com'
        }
      });
    } catch (error) {
      console.error('Error loading advertising data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      expired: 'bg-red-500',
      pending: 'bg-blue-500',
      draft: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: CheckCircle,
      paused: AlertCircle,
      expired: XCircle,
      pending: Clock,
      draft: Edit
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getAdTypeIcon = (type) => {
    const icons = {
      job_promotion: FileText,
      company_branding: Star,
      product_showcase: Target
    };
    const Icon = icons[type] || Target;
    return <Icon className="w-5 h-5" />;
  };

  const getAdTypeLabel = (type) => {
    const labels = {
      job_promotion: 'Job Promotion',
      company_branding: 'Company Branding',
      product_showcase: 'Product Showcase'
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  const calculateDaysLeft = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleCreateAd = async () => {
    try {
      // Mock API call to create advertisement
      console.log('Creating ad:', newAd);
      setShowCreateAdDialog(false);
      // Refresh data
      await loadAdvertisingData();
    } catch (error) {
      console.error('Error creating ad:', error);
    }
  };

  const handlePauseAd = async (adId) => {
    try {
      // Mock API call to pause ad
      console.log('Pausing ad:', adId);
      await loadAdvertisingData();
    } catch (error) {
      console.error('Error pausing ad:', error);
    }
  };

  const handleResumeAd = async (adId) => {
    try {
      // Mock API call to resume ad
      console.log('Resuming ad:', adId);
      await loadAdvertisingData();
    } catch (error) {
      console.error('Error resuming ad:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Advertising</h1>
          <p className="text-gray-600 mt-2">Promote your jobs, brand, and products to reach top talent</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showCreateAdDialog} onOpenChange={setShowCreateAdDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Advertisement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Advertisement</DialogTitle>
                <DialogDescription>
                  Create compelling ads to promote your jobs, company brand, or products
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="ad-type">Advertisement Type</Label>
                  <Select value={newAd.type} onValueChange={(value) => setNewAd({...newAd, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ad type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="job_promotion">Job Promotion</SelectItem>
                      <SelectItem value="company_branding">Company Branding</SelectItem>
                      <SelectItem value="product_showcase">Product Showcase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Ad Title</Label>
                  <Input
                    id="title"
                    value={newAd.title}
                    onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                    placeholder="Enter compelling ad title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAd.description}
                    onChange={(e) => setNewAd({...newAd, description: e.target.value})}
                    placeholder="Describe what makes this opportunity special"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={newAd.budget}
                      onChange={(e) => setNewAd({...newAd, budget: e.target.value})}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Select value={newAd.duration} onValueChange={(value) => setNewAd({...newAd, duration: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Input
                    id="target-audience"
                    value={newAd.targetAudience}
                    onChange={(e) => setNewAd({...newAd, targetAudience: e.target.value})}
                    placeholder="e.g., Software Engineers, Remote Workers"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta">Call to Action</Label>
                  <Select value={newAd.callToAction} onValueChange={(value) => setNewAd({...newAd, callToAction: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apply Now">Apply Now</SelectItem>
                      <SelectItem value="Learn More">Learn More</SelectItem>
                      <SelectItem value="Join Our Team">Join Our Team</SelectItem>
                      <SelectItem value="Get Started">Get Started</SelectItem>
                      <SelectItem value="View Opportunities">View Opportunities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCreateAdDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAd}>
                    Create Advertisement
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => navigate('/advertising/packages')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Packages
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Ads</p>
                <p className="text-2xl font-bold">{advertisingData.stats.activeAds}</p>
              </div>
              <Target className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Impressions</p>
                <p className="text-2xl font-bold">{formatNumber(advertisingData.stats.totalImpressions)}</p>
              </div>
              <Eye className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Clicks</p>
                <p className="text-2xl font-bold">{formatNumber(advertisingData.stats.totalClicks)}</p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Applications</p>
                <p className="text-2xl font-bold">{advertisingData.stats.applicationsGenerated}</p>
              </div>
              <Users className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(advertisingData.stats.totalSpent)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Avg CTR</p>
                <p className="text-2xl font-bold">{advertisingData.stats.averageCTR}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Active Campaigns</TabsTrigger>
          <TabsTrigger value="packages">Ad Packages</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Active Advertisement Campaigns
              </CardTitle>
              <CardDescription>Manage your ongoing advertising campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {advertisingData.activeAds.map((ad) => (
                  <Card key={ad.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden">
                            <img 
                              src={ad.image} 
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                {getAdTypeIcon(ad.type)}
                                <Badge variant="outline">
                                  {getAdTypeLabel(ad.type)}
                                </Badge>
                              </div>
                              <Badge 
                                className={`${getStatusColor(ad.status)} text-white flex items-center gap-1`}
                              >
                                {getStatusIcon(ad.status)}
                                {ad.status}
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold text-lg mb-2">{ad.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">{ad.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Impressions</p>
                                <p className="font-semibold">{formatNumber(ad.impressions)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Clicks</p>
                                <p className="font-semibold">{formatNumber(ad.clicks)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">CTR</p>
                                <p className="font-semibold">{ad.ctr}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Applications</p>
                                <p className="font-semibold">{ad.applications}</p>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex justify-between text-sm mb-2">
                                <span>Budget Progress</span>
                                <span>{formatCurrency(ad.spent)} / {formatCurrency(ad.budget)}</span>
                              </div>
                              <Progress value={(ad.spent / ad.budget) * 100} className="h-2" />
                            </div>
                            
                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {calculateDaysLeft(ad.end_date)} days left
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {ad.target_locations.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6">
                          {ad.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePauseAd(ad.id)}
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResumeAd(ad.id)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Resume
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advertisement Packages</CardTitle>
              <CardDescription>Choose the perfect package for your advertising needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {advertisingData.adPackages.map((pkg) => (
                  <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-2 border-blue-500' : ''}`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500">Most Popular</Badge>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="text-center">
                        <h3 className="font-bold text-xl mb-2">{pkg.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                        <div className="mb-6">
                          <span className="text-3xl font-bold">{formatCurrency(pkg.price)}</span>
                          <span className="text-gray-500">/{pkg.duration_days} days</span>
                        </div>
                        <ul className="space-y-2 mb-6 text-sm">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className={`w-full ${pkg.popular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                          variant={pkg.popular ? 'default' : 'outline'}
                        >
                          Select Package
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Your advertising performance this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Conversion Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {((advertisingData.stats.applicationsGenerated / advertisingData.stats.totalClicks) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Applications per click</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Cost per Application</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(advertisingData.stats.totalSpent / advertisingData.stats.applicationsGenerated)}
                    </p>
                    <p className="text-sm text-gray-600">Average cost effectiveness</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Ads</CardTitle>
                <CardDescription>Your best converting advertisements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {advertisingData.activeAds
                    .sort((a, b) => b.applications - a.applications)
                    .slice(0, 3)
                    .map((ad, index) => (
                    <div key={ad.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{ad.title}</h4>
                        <p className="text-xs text-gray-500">{getAdTypeLabel(ad.type)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{ad.applications} apps</p>
                        <p className="text-xs text-gray-500">{ad.ctr}% CTR</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        #{index + 1}
                      </Badge>
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

export default CompanyAdvertising;
