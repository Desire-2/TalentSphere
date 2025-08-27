import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Skeleton,
  Tabs,
  Tab,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Insights as InsightsIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { toast } from 'sonner';

// Import our internal services
import { applicationManagementService } from '../../../services/internal/applicationManagement';
import { advancedAnalyticsService } from '../../../services/internal/analyticsService';
import { recommendationEngineService } from '../../../services/internal/recommendationEngine';

/**
 * Advanced Dashboard Component
 * Demonstrates integration of all internal application features
 */
export const AdvancedDashboard = ({ userRole = 'job_seeker' }) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const cleanup = setupRealTimeUpdates();
    
    return cleanup;
  }, [userRole]);

  /**
   * Load comprehensive dashboard data
   */
  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      const promises = [];
      
      // Load role-specific data
      if (userRole === 'job_seeker') {
        promises.push(
          applicationManagementService.getApplicationDashboard(),
          recommendationEngineService.getPersonalizedJobRecommendations(),
          advancedAnalyticsService.getJobSeekerAnalytics()
        );
      } else if (userRole === 'employer') {
        promises.push(
          applicationManagementService.getCandidatePipeline(),
          recommendationEngineService.getCandidateRecommendations(),
          advancedAnalyticsService.getEmployerAnalytics()
        );
      } else if (userRole === 'admin') {
        promises.push(
          advancedAnalyticsService.getAdminDashboardAnalytics(),
          advancedAnalyticsService.getRealTimeMetrics()
        );
      }

      const results = await Promise.all(promises);
      
      setDashboardData(results[0]);
      setRecommendations(results[1]);
      setAnalytics(results[2]);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Setup real-time updates
   */
  const setupRealTimeUpdates = () => {
    if (userRole !== 'admin') return () => {};
    
    const eventSource = advancedAnalyticsService.startRealTimeStream((data) => {
      setRealTimeData(data);
    });

    return () => {
      eventSource.close();
    };
  };

  /**
   * Handle recommendation feedback
   */
  const handleRecommendationFeedback = async (recommendationId, feedbackType, reason = '') => {
    try {
      await recommendationEngineService.trackRecommendationFeedback(recommendationId, {
        type: feedbackType,
        reason: reason,
        timestamp: new Date().toISOString()
      });
      
      toast.success('Feedback recorded - we\'ll improve your recommendations');
      
      // Refresh recommendations
      refreshRecommendations();
    } catch (error) {
      console.error('Failed to record feedback:', error);
      toast.error('Failed to record feedback');
    }
  };

  /**
   * Refresh recommendations
   */
  const refreshRecommendations = async () => {
    setRefreshing(true);
    
    try {
      let newRecommendations;
      
      if (userRole === 'job_seeker') {
        newRecommendations = await recommendationEngineService.getPersonalizedJobRecommendations();
      } else if (userRole === 'employer') {
        newRecommendations = await recommendationEngineService.getCandidateRecommendations();
      }
      
      setRecommendations(newRecommendations);
      toast.success('Recommendations updated');
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
      toast.error('Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} md={6} key={item}>
              <Paper sx={{ p: 2 }}>
                <Skeleton variant="text" height={40} />
                <Skeleton variant="rectangular" height={200} sx={{ mt: 1 }} />
                <Skeleton variant="text" height={30} sx={{ mt: 1 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Advanced Dashboard
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadDashboardData}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Real-time Alerts */}
      {realTimeData?.alerts?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {realTimeData.alerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity={alert.severity || 'info'} 
              sx={{ mb: 1 }}
              onClose={() => {
                const newAlerts = realTimeData.alerts.filter((_, i) => i !== index);
                setRealTimeData({ ...realTimeData, alerts: newAlerts });
              }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<PsychologyIcon />} label="AI Recommendations" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
          <Tab icon={<TimelineIcon />} label="Activity Timeline" />
          <Tab icon={<InsightsIcon />} label="Insights" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <OverviewPanel 
          dashboardData={dashboardData} 
          userRole={userRole} 
          realTimeData={realTimeData}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <RecommendationsPanel 
          recommendations={recommendations}
          onFeedback={handleRecommendationFeedback}
          onRefresh={refreshRecommendations}
          refreshing={refreshing}
          userRole={userRole}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <AnalyticsPanel 
          analytics={analytics}
          userRole={userRole}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ActivityTimelinePanel 
          dashboardData={dashboardData}
          userRole={userRole}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <InsightsPanel 
          analytics={analytics}
          recommendations={recommendations}
          userRole={userRole}
        />
      </TabPanel>
    </Box>
  );
};

/**
 * Tab Panel Component
 */
const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`dashboard-tabpanel-${index}`}
    aria-labelledby={`dashboard-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

/**
 * Overview Panel Component
 */
const OverviewPanel = ({ dashboardData, userRole, realTimeData }) => {
  if (!dashboardData) return <Typography>No data available</Typography>;

  return (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Key Metrics
          </Typography>
          <Grid container spacing={2}>
            {userRole === 'job_seeker' && (
              <>
                <MetricCard
                  title="Total Applications"
                  value={dashboardData.stats?.total || 0}
                  icon={<WorkIcon />}
                  color="primary"
                />
                <MetricCard
                  title="Response Rate"
                  value={`${dashboardData.stats?.responseRate || 0}%`}
                  icon={<TrendingUpIcon />}
                  color="success"
                />
                <MetricCard
                  title="Interviews"
                  value={dashboardData.stats?.interviewed || 0}
                  icon={<PersonIcon />}
                  color="warning"
                />
                <MetricCard
                  title="Success Rate"
                  value={`${dashboardData.stats?.successRate || 0}%`}
                  icon={<StarIcon />}
                  color="error"
                />
              </>
            )}
            {userRole === 'admin' && realTimeData && (
              <>
                <MetricCard
                  title="Active Users"
                  value={realTimeData.currentUsers || 0}
                  icon={<PersonIcon />}
                  color="primary"
                />
                <MetricCard
                  title="System Health"
                  value={realTimeData.systemStatus}
                  icon={<DashboardIcon />}
                  color="success"
                />
              </>
            )}
          </Grid>
        </Paper>
      </Grid>

      {/* Recent Activity */}
      {dashboardData.applications && (
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Applications
            </Typography>
            <List>
              {dashboardData.applications.slice(0, 5).map((app) => (
                <ListItem key={app.id} divider>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: getStatusColor(app.status) }}>
                      <WorkIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={app.job?.title || 'Unknown Job'}
                    secondary={`Status: ${app.status} • Applied: ${formatDate(app.created_at)}`}
                  />
                  <Chip
                    label={app.status}
                    color={getStatusColor(app.status)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      )}

      {/* Quick Actions */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="outlined" startIcon={<WorkIcon />} fullWidth>
              Find Jobs
            </Button>
            <Button variant="outlined" startIcon={<PersonIcon />} fullWidth>
              Update Profile
            </Button>
            <Button variant="outlined" startIcon={<AnalyticsIcon />} fullWidth>
              View Analytics
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

/**
 * Recommendations Panel Component
 */
const RecommendationsPanel = ({ recommendations, onFeedback, onRefresh, refreshing, userRole }) => {
  if (!recommendations || (!recommendations.recommendations && !recommendations.candidates)) {
    return <Typography>No recommendations available</Typography>;
  }

  const items = recommendations.recommendations || recommendations.candidates || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">
          <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI-Powered Recommendations
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? <CircularProgress size={16} /> : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <RecommendationCard
              item={item}
              onFeedback={onFeedback}
              userRole={userRole}
            />
          </Grid>
        ))}
      </Grid>

      {recommendations.insights && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recommendation Insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {recommendations.insights.message || 'Based on your profile and activity, we\'ve personalized these recommendations for you.'}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

/**
 * Recommendation Card Component
 */
const RecommendationCard = ({ item, onFeedback, userRole }) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleLike = () => {
    onFeedback(item.id, 'liked');
  };

  const handleDislike = () => {
    onFeedback(item.id, 'disliked');
  };

  return (
    <Fade in={true}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2 }}>
              {userRole === 'job_seeker' ? <WorkIcon /> : <PersonIcon />}
            </Avatar>
            <Typography variant="h6" component="h3">
              {item.title || item.name}
            </Typography>
          </Box>

          {userRole === 'job_seeker' && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {item.company?.name || 'Unknown Company'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {item.location} • {item.employment_type}
              </Typography>
              {item.match_score && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Match Score: {item.match_score}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={item.match_score} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </>
          )}

          {item.salary_min && (
            <Typography variant="body2" color="text.secondary">
              ${item.salary_min.toLocaleString()} - ${item.salary_max?.toLocaleString() || 'N/A'}
            </Typography>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Box>
            <Tooltip title="Like this recommendation">
              <IconButton size="small" onClick={handleLike}>
                <ThumbUpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Don't show similar recommendations">
              <IconButton size="small" onClick={handleDislike}>
                <ThumbDownIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save for later">
              <IconButton size="small">
                <BookmarkIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Button size="small" variant="contained">
            {userRole === 'job_seeker' ? 'Apply' : 'View Profile'}
          </Button>
        </CardActions>
      </Card>
    </Fade>
  );
};

/**
 * Analytics Panel Component
 */
const AnalyticsPanel = ({ analytics, userRole }) => {
  if (!analytics) return <Typography>No analytics data available</Typography>;

  return (
    <Grid container spacing={3}>
      {/* Performance Charts would go here */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analytics visualizations would be rendered here using Chart.js or similar library.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

/**
 * Activity Timeline Panel Component
 */
const ActivityTimelinePanel = ({ dashboardData, userRole }) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      Activity Timeline
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Timeline component would show user activity history here.
    </Typography>
  </Paper>
);

/**
 * Insights Panel Component
 */
const InsightsPanel = ({ analytics, recommendations, userRole }) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      Personalized Insights
    </Typography>
    <Typography variant="body2" color="text.secondary">
      AI-generated insights and recommendations for improvement would be displayed here.
    </Typography>
  </Paper>
);

/**
 * Metric Card Component
 */
const MetricCard = ({ title, value, icon, color }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

// Helper functions
const getStatusColor = (status) => {
  const colors = {
    'submitted': 'default',
    'under_review': 'primary',
    'interviewed': 'warning',
    'hired': 'success',
    'rejected': 'error'
  };
  return colors[status] || 'default';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

export default AdvancedDashboard;
