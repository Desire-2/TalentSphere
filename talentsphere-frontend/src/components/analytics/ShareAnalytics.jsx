import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Share2, 
  Users, 
  Globe, 
  Mail,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Award,
  Target,
  Download,
  Eye,
  Heart,
  MessageSquare,
  ExternalLink,
  Linkedin,
  Twitter,
  Facebook
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import shareJobService from '../../services/shareJobService';

const ShareAnalytics = ({ children, trigger = null }) => {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load analytics data
  const loadAnalytics = () => {
    setLoading(true);
    try {
      const userAnalytics = shareJobService.getUserShareAnalytics();
      const optimalTimes = shareJobService.getOptimalSharingTimes();
      const shareHistory = shareJobService.shareHistory.slice(0, 20); // Last 20 shares
      
      setAnalytics({
        ...userAnalytics,
        optimalTimes,
        recentShareHistory: shareHistory
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog open
  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (newOpen) {
      loadAnalytics();
    }
  };

  // Export analytics data
  const exportAnalytics = () => {
    shareJobService.exportShareData();
  };

  // Clear analytics data
  const clearAnalytics = () => {
    if (confirm('Are you sure you want to clear all sharing data? This action cannot be undone.')) {
      shareJobService.clearAllData();
      loadAnalytics();
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-600" />;
      case 'twitter':
        return <Twitter className="w-4 h-4 text-blue-400" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-700" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'email_client':
      case 'direct_email':
        return <Mail className="w-4 h-4 text-gray-600" />;
      case 'clipboard':
      case 'template':
      case 'custom':
        return <Share2 className="w-4 h-4 text-gray-600" />;
      default:
        return <Globe className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get platform display name
  const getPlatformDisplayName = (platform) => {
    const names = {
      linkedin: 'LinkedIn',
      twitter: 'Twitter',
      facebook: 'Facebook',
      whatsapp: 'WhatsApp',
      email_client: 'Email Client',
      direct_email: 'Direct Email',
      clipboard: 'Clipboard',
      template: 'Template',
      custom: 'Custom Message'
    };
    return names[platform] || platform;
  };

  if (!open && trigger) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ShareAnalyticsContent 
            analytics={analytics}
            loading={loading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            exportAnalytics={exportAnalytics}
            clearAnalytics={clearAnalytics}
            getPlatformIcon={getPlatformIcon}
            getPlatformDisplayName={getPlatformDisplayName}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return children;
};

const ShareAnalyticsContent = ({ 
  analytics, 
  loading, 
  activeTab, 
  setActiveTab, 
  exportAnalytics, 
  clearAnalytics,
  getPlatformIcon,
  getPlatformDisplayName
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-2xl">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Share Analytics
        </DialogTitle>
        <DialogDescription>
          Track your job sharing activity and discover insights about your network engagement.
        </DialogDescription>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {analytics.totalShares || 0}
                </div>
                <div className="text-sm text-gray-600">Total Shares</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analytics.recentShares || 0}
                </div>
                <div className="text-sm text-gray-600">Last 30 Days</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {analytics.topPlatforms?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Platforms Used</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {Math.round(analytics.averageSharesPerDay || 0)}
                </div>
                <div className="text-sm text-gray-600">Avg. Per Day</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Sharing Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentShareHistory && analytics.recentShareHistory.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recentShareHistory.slice(0, 5).map((share, index) => (
                    <div key={share.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {getPlatformIcon(share.platform)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Shared on {getPlatformDisplayName(share.platform)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(share.timestamp)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {share.recipientCount} recipient{share.recipientCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                  {analytics.recentShareHistory.length > 5 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      ...and {analytics.recentShareHistory.length - 5} more shares
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No recent sharing activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Platform Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topPlatforms && analytics.topPlatforms.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topPlatforms.map(([platform, count], index) => {
                    const percentage = analytics.totalShares > 0 ? (count / analytics.totalShares) * 100 : 0;
                    return (
                      <div key={platform} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(platform)}
                            <span className="font-medium">{getPlatformDisplayName(platform)}</span>
                            <Badge variant="outline" className="ml-2">
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{count} shares</div>
                            <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No platform data available</p>
              )}
            </CardContent>
          </Card>

          {/* Platform Recommendations */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Award className="w-5 h-5" />
                Platform Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topPlatforms && analytics.topPlatforms.length > 0 ? (
                  <>
                    <div className="text-sm text-blue-800">
                      <strong>Your top platform:</strong> {getPlatformDisplayName(analytics.topPlatforms[0][0])} 
                      ({analytics.topPlatforms[0][1]} shares)
                    </div>
                    <div className="text-sm text-blue-700">
                      💡 <strong>Tip:</strong> You seem to have great success with {getPlatformDisplayName(analytics.topPlatforms[0][0])}. 
                      Consider focusing more effort on this platform for maximum reach.
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-blue-700">
                    Start sharing jobs to get personalized platform recommendations!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.dailyStats && Object.keys(analytics.dailyStats).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analytics.dailyStats)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .slice(0, 10)
                    .map(([date, count]) => (
                      <div key={date} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <span className="text-sm font-medium">{new Date(date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (count / Math.max(...Object.values(analytics.dailyStats))) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No daily activity data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Optimal Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Optimal Sharing Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.optimalTimes && analytics.optimalTimes.length > 0 ? (
                <div className="space-y-3">
                  {analytics.optimalTimes.map((time, index) => (
                    <div key={time.hour} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-white">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-semibold">{time.timeLabel}</div>
                          <div className="text-sm text-gray-600">
                            {time.count} share{time.count !== 1 ? 's' : ''} at this time
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl">⏰</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Share more jobs to discover your optimal times!</p>
              )}
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.totalShares > 10 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Great Sharing Activity!</span>
                    </div>
                    <p className="text-sm text-green-800">
                      You've shared {analytics.totalShares} jobs! You're helping build a strong professional network.
                    </p>
                  </div>
                )}
                
                {analytics.averageSharesPerDay > 1 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Consistent Sharer</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      You average {analytics.averageSharesPerDay.toFixed(1)} shares per day. Consistency helps maximize your network impact.
                    </p>
                  </div>
                )}
                
                {analytics.topPlatforms && analytics.topPlatforms.length >= 3 && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-900">Multi-Platform Expert</span>
                    </div>
                    <p className="text-sm text-purple-800">
                      You're using {analytics.topPlatforms.length} different platforms. Diversifying your sharing strategy increases reach!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={exportAnalytics}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Data
        </Button>
        <Button
          onClick={clearAnalytics}
          variant="outline"
          className="flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          Clear All Data
        </Button>
      </div>
    </>
  );
};

export default ShareAnalytics;
