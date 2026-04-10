import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { adminService } from '../../services/admin';

const NotificationManagement = () => {
  // Debug logging
  useEffect(() => {
    console.log('✅ NotificationManagement component mounted');
    return () => {
      console.log('❌ NotificationManagement component unmounted');
    };
  }, []);

  // Morning Update State
  const [morningUpdateLoading, setMorningUpdateLoading] = useState(false);
  const [morningUpdateResult, setMorningUpdateResult] = useState(null);
  const [morningUpdateError, setMorningUpdateError] = useState(null);
  const [morningUpdateHistory, setMorningUpdateHistory] = useState([]);

  // Weekly Digest State
  const [weeklyDigestLoading, setWeeklyDigestLoading] = useState(false);
  const [weeklyDigestResult, setWeeklyDigestResult] = useState(null);
  const [weeklyDigestError, setWeeklyDigestError] = useState(null);
  const [weeklyDigestHistory, setWeeklyDigestHistory] = useState([]);

  // General State
  const [refreshing, setRefreshing] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const savedMorningHistory = localStorage.getItem('morningUpdateHistory');
      const savedWeeklyHistory = localStorage.getItem('weeklyDigestHistory');
      
      if (savedMorningHistory) {
        try {
          setMorningUpdateHistory(JSON.parse(savedMorningHistory));
        } catch (e) {
          console.error('Failed to parse morning update history:', e);
        }
      }
      
      if (savedWeeklyHistory) {
        try {
          setWeeklyDigestHistory(JSON.parse(savedWeeklyHistory));
        } catch (e) {
          console.error('Failed to parse weekly digest history:', e);
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('morningUpdateHistory', JSON.stringify(morningUpdateHistory));
    } catch (e) {
      console.error('Error saving morning update history:', e);
    }
  }, [morningUpdateHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('weeklyDigestHistory', JSON.stringify(weeklyDigestHistory));
    } catch (e) {
      console.error('Error saving weekly digest history:', e);
    }
  }, [weeklyDigestHistory]);

  // Handle Morning Update
  const handleSendMorningUpdate = async () => {
    setMorningUpdateLoading(true);
    setMorningUpdateError(null);
    setMorningUpdateResult(null);

    try {
      console.log('📧 Sending morning update...');
      const response = await adminService.sendMorningUpdate();
      console.log('✅ Morning update response:', response);
      
      const result = {
        timestamp: new Date().toISOString(),
        success: true,
        message: response.message,
        details: response.details,
        daysSinceLastRun: morningUpdateHistory.length > 0 
          ? Math.floor((Date.now() - new Date(morningUpdateHistory[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
          : null
      };

      setMorningUpdateResult(result);
      setMorningUpdateHistory([result, ...morningUpdateHistory.slice(0, 9)]);

      toast.success('Morning update sent successfully!', {
        description: `Sent to ${result.details.sent_count} users`
      });
    } catch (error) {
      console.error('❌ Error sending morning update:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send morning update';
      setMorningUpdateError(errorMessage);
      
      const failureRecord = {
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMessage
      };
      setMorningUpdateHistory([failureRecord, ...morningUpdateHistory.slice(0, 9)]);

      toast.error('Failed to send morning update', {
        description: errorMessage
      });
    } finally {
      setMorningUpdateLoading(false);
    }
  };

  // Handle Weekly Digest
  const handleSendWeeklyDigest = async () => {
    setWeeklyDigestLoading(true);
    setWeeklyDigestError(null);
    setWeeklyDigestResult(null);

    try {
      console.log('📅 Sending weekly digest...');
      const response = await adminService.sendWeeklyDigest();
      console.log('✅ Weekly digest response:', response);
      
      const result = {
        timestamp: new Date().toISOString(),
        success: true,
        message: response.message,
        details: response.details,
        daysSinceLastRun: weeklyDigestHistory.length > 0 
          ? Math.floor((Date.now() - new Date(weeklyDigestHistory[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
          : null
      };

      setWeeklyDigestResult(result);
      setWeeklyDigestHistory([result, ...weeklyDigestHistory.slice(0, 9)]);

      toast.success('Weekly digest sent successfully!', {
        description: `Sent to ${result.details.sent_count} users`
      });
    } catch (error) {
      console.error('❌ Error sending weekly digest:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send weekly digest';
      setWeeklyDigestError(errorMessage);
      
      const failureRecord = {
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMessage
      };
      setWeeklyDigestHistory([failureRecord, ...weeklyDigestHistory.slice(0, 9)]);

      toast.error('Failed to send weekly digest', {
        description: errorMessage
      });
    } finally {
      setWeeklyDigestLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in a real app, you might fetch updated stats
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  // Morning Update Card
  const MorningUpdateCard = () => (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Mail className="h-5 w-5" />
              Morning Update
            </CardTitle>
            <CardDescription className="text-blue-700 mt-1">
              Daily top 5 jobs & scholarships email (6:00 AM scheduled)
            </CardDescription>
          </div>
          <Badge className="bg-blue-500 hover:bg-blue-600">Daily</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Last Status</div>
          {morningUpdateResult?.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Successfully sent</span>
              </div>
              <div className="text-xs text-gray-600">
                {new Date(morningUpdateResult.timestamp).toLocaleString()}
              </div>
            </div>
          ) : morningUpdateError ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <div className="text-xs text-red-600">{morningUpdateError}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No recent execution</div>
          )}
        </div>

        {/* Statistics */}
        {morningUpdateResult?.details && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {morningUpdateResult.details.sent_count}
              </div>
              <div className="text-xs text-gray-600 mt-1">Emails Sent</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-orange-600">
                {morningUpdateResult.details.failed_count}
              </div>
              <div className="text-xs text-gray-600 mt-1">Failed</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-green-600">
                {morningUpdateResult.details.jobs_included}
              </div>
              <div className="text-xs text-gray-600 mt-1">Jobs Included</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-purple-600">
                {morningUpdateResult.details.scholarships_included}
              </div>
              <div className="text-xs text-gray-600 mt-1">Scholarships</div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendMorningUpdate}
          disabled={morningUpdateLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {morningUpdateLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Morning Update Now
            </>
          )}
        </Button>

        {/* Schedule Info */}
        <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-700 mt-1 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <div className="font-medium">Automated Schedule</div>
              <div className="text-xs text-blue-800 mt-1">
                Runs automatically every day at 6:00 AM (server timezone)
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Weekly Digest Card
  const WeeklyDigestCard = () => (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Calendar className="h-5 w-5" />
              Weekly Digest
            </CardTitle>
            <CardDescription className="text-purple-700 mt-1">
              Weekly compilation of jobs & scholarships email (Every Friday 6:00 PM)
            </CardDescription>
          </div>
          <Badge className="bg-purple-500 hover:bg-purple-600">Weekly</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="bg-white p-4 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Last Status</div>
          {weeklyDigestResult?.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Successfully sent</span>
              </div>
              <div className="text-xs text-gray-600">
                {new Date(weeklyDigestResult.timestamp).toLocaleString()}
              </div>
            </div>
          ) : weeklyDigestError ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <div className="text-xs text-red-600">{weeklyDigestError}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No recent execution</div>
          )}
        </div>

        {/* Statistics */}
        {weeklyDigestResult?.details && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {weeklyDigestResult.details.sent_count}
              </div>
              <div className="text-xs text-gray-600 mt-1">Emails Sent</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-orange-600">
                {weeklyDigestResult.details.failed_count}
              </div>
              <div className="text-xs text-gray-600 mt-1">Failed</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-green-600">
                {weeklyDigestResult.details.jobs_included}
              </div>
              <div className="text-xs text-gray-600 mt-1">Jobs Included</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-blue-600">
                {weeklyDigestResult.details.scholarships_included}
              </div>
              <div className="text-xs text-gray-600 mt-1">Scholarships</div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendWeeklyDigest}
          disabled={weeklyDigestLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {weeklyDigestLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Weekly Digest Now
            </>
          )}
        </Button>

        {/* Schedule Info */}
        <div className="bg-purple-100 p-3 rounded-lg border border-purple-300">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-purple-700 mt-1 flex-shrink-0" />
            <div className="text-sm text-purple-900">
              <div className="font-medium">Automated Schedule</div>
              <div className="text-xs text-purple-800 mt-1">
                Runs automatically every Friday at 6:00 PM (server timezone)
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // History Timeline
  const HistoryTimeline = ({ history, title }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No execution history</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((item, index) => (
              <div key={index} className="border-l-2 pl-4 pb-3" style={{
                borderColor: item.success ? '#10b981' : '#ef4444'
              }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {item.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {item.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                {item.success && item.details && (
                  <div className="text-xs text-gray-600 ml-6">
                    Sent: {item.details.sent_count} | Failed: {item.details.failed_count}
                  </div>
                )}
                {!item.success && (
                  <div className="text-xs text-red-600 ml-6">
                    {item.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-full">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-900">✅ Email Notification Management</h1>
        <p className="text-blue-700 mt-2">Component loaded successfully!</p>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Notification Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manually trigger scheduled email campaigns</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MorningUpdateCard />
        <WeeklyDigestCard />
      </div>

      {/* Execution History */}
      <Tabs defaultValue="morning" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="morning">
            <Mail className="h-4 w-4 mr-2" />
            Morning Update History
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <Calendar className="h-4 w-4 mr-2" />
            Weekly Digest History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="morning" className="mt-6">
          <HistoryTimeline
            history={morningUpdateHistory}
            title="Morning Update Execution History"
          />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <HistoryTimeline
            history={weeklyDigestHistory}
            title="Weekly Digest Execution History"
          />
        </TabsContent>
      </Tabs>

      {/* Information Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TrendingUp className="h-5 w-5" />
            About Scheduled Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <p>
            <strong>Morning Update (6:00 AM):</strong> Sends top 5 recently added/updated jobs and scholarships to all active users daily.
          </p>
          <p>
            <strong>Weekly Digest (Friday 6:00 PM):</strong> Sends comprehensive compilation of jobs and scholarships posted during the calendar week to all active users.
          </p>
          <p>
            <strong>Manual Trigger:</strong> Use the buttons above to send notifications immediately regardless of schedule, useful for testing or urgent campaigns.
          </p>
          <p>
            <strong>Scheduler Status:</strong> The notifications are automatically managed by background workers in the Gunicorn process. The scheduler runs in the primary worker to avoid duplicate sends.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagement;
