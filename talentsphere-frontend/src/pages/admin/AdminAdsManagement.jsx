/**
 * Admin Ads Management Dashboard
 * Comprehensive moderation and analytics panel for platform-wide ad management
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import {
  Eye, Check, X, MessageSquare, Download, Filter, Search, TrendingUp, 
  Zap, Megaphone, Settings, DollarSign, Users, Clock, AlertCircle, CheckCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import adAdminService from '../../services/adAdminService';

const AdminAdsManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [advertisements, setAdvertisements] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('ALL');
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState(null);
  const [campaignDetailOpen, setCampaignDetailOpen] = useState(false);
  const [campaignDetailLoading, setCampaignDetailLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [reviewPagination, setReviewPagination] = useState({ page: 1, limit: 20, total_pages: 1, total_items: 0 });
  const [campaignsPagination, setCampaignsPagination] = useState({ page: 1, limit: 20, total_pages: 1, total_items: 0 });
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState({
    overview: true,
    reviews: true,
    campaigns: true,
    placements: true
  });

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    if (activeTab === 'overview') {
      await loadPlatformStats();
    } else if (activeTab === 'review-queue') {
      await loadReviewQueue();
    } else if (activeTab === 'campaigns') {
      await loadCampaigns();
    }
  };

  const loadPlatformStats = async () => {
    setLoading(prev => ({ ...prev, overview: true }));
    try {
      const response = await adAdminService.getOverview();
      setPlatformStats(response || {});
    } catch (error) {
      console.error('Failed to load platform stats:', error);
      toast.error(error?.error || error?.message || 'Failed to load platform analytics');
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  };

  const loadReviewQueue = async () => {
    setLoading(prev => ({ ...prev, reviews: true }));
    try {
      const response = await adAdminService.getReviewQueue(statusFilter, reviewPagination.page, reviewPagination.limit);
      const campaigns = response.campaigns || [];
      setReviewStats(response.stats || { total: campaigns.length, pending: 0, approved: 0, rejected: 0 });
      setReviewPagination((prev) => ({ ...prev, ...(response.pagination || {}) }));
      
      // Transform campaigns to advertisement format for consistency
      const ads = campaigns.map(item => ({
        id: item.campaign.id,
        title: item.campaign.name,
        description: item.campaign.objective,
        type: 'campaign',
        company: {
          id: item.employer.id,
          name: item.employer.name,
          email: item.employer.email,
          verified: true
        },
        status: (item.review?.decision || 'NO_REVIEW').toLowerCase(),
        campaign_status: item.campaign.status,
        budget: item.campaign.budget_total,
        billing_type: item.campaign.billing_type,
        startDate: item.campaign.start_date,
        endDate: item.campaign.end_date,
        creatives: item.creatives || [],
        review: item.review,
        actions: item.actions,
        submittedAt: item.campaign.created_at,
        reviewedAt: item.review.reviewed_at,
        reviewedBy: item.review.reviewer_name
      }));
      
      setAdvertisements(ads);
    } catch (error) {
      console.error('Failed to load review queue:', error);
      toast.error(error?.error || error?.message || 'Failed to load review queue');
    } finally {
      setLoading(prev => ({ ...prev, reviews: false }));
    }
  };

  const loadCampaigns = async () => {
    setLoading(prev => ({ ...prev, campaigns: true }));
    try {
      const status = campaignStatusFilter !== 'ALL' ? campaignStatusFilter : undefined;
      const response = await adAdminService.listCampaigns({
        page: campaignsPagination.page,
        limit: campaignsPagination.limit,
        status,
        q: campaignSearchQuery || undefined,
      });
      setCampaigns(response.campaigns || []);
      setCampaignsPagination((prev) => ({ ...prev, ...(response.pagination || {}) }));
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error(error?.error || error?.message || 'Failed to load campaigns');
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  };

  const handleApproveCampaign = async (campaignId) => {
    setActionBusy(true);
    try {
      await adAdminService.approveCampaign(campaignId);
      await Promise.all([loadReviewQueue(), loadCampaigns(), loadPlatformStats()]);
      toast.success('Campaign approved successfully');
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to approve campaign');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRejectCampaign = async (campaignId, notes) => {
    setActionBusy(true);
    try {
      await adAdminService.rejectCampaign(campaignId, notes || 'No reason provided');
      await Promise.all([loadReviewQueue(), loadCampaigns(), loadPlatformStats()]);
      toast.success('Campaign rejected');
      setRejectNotes('');
      setSelectedAd(null);
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to reject campaign');
    } finally {
      setActionBusy(false);
    }
  };

  const handleResetCampaignReview = async (campaignId) => {
    setActionBusy(true);
    try {
      await adAdminService.resetReview(campaignId);
      await Promise.all([loadReviewQueue(), loadCampaigns()]);
      toast.success('Campaign review reset to pending');
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to reset review');
    } finally {
      setActionBusy(false);
    }
  };

  const handleNeedsChangesCampaign = async (campaignId, notes) => {
    setActionBusy(true);
    try {
      await adAdminService.needsChangesCampaign(campaignId, notes || 'Please update the campaign and resubmit.');
      await Promise.all([loadReviewQueue(), loadCampaigns()]);
      toast.success('Campaign marked as needs changes');
      setRejectNotes('');
      setSelectedAd(null);
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to set needs changes');
    } finally {
      setActionBusy(false);
    }
  };

  const handleUpdateCampaignStatus = async (campaignId, status) => {
    setActionBusy(true);
    try {
      await adAdminService.updateCampaignStatus(campaignId, status);
      await Promise.all([loadReviewQueue(), loadCampaigns()]);
      toast.success(`Campaign status changed to ${status}`);
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to update campaign status');
    } finally {
      setActionBusy(false);
    }
  };

  const openCampaignDetail = async (campaignId) => {
    setCampaignDetailOpen(true);
    setCampaignDetailLoading(true);
    setSelectedCampaignDetail(null);

    try {
      const detail = await adAdminService.getCampaignDetail(campaignId);
      setSelectedCampaignDetail(detail);
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to load campaign details');
      setCampaignDetailOpen(false);
    } finally {
      setCampaignDetailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'review-queue') {
      if (reviewPagination.page === 1) {
        loadReviewQueue();
      } else {
        setReviewPagination((prev) => ({ ...prev, page: 1 }));
      }
    }
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'review-queue') {
      loadReviewQueue();
    }
  }, [reviewPagination.page]);

  useEffect(() => {
    if (activeTab === 'campaigns') {
      loadCampaigns();
    }
  }, [campaignsPagination.page]);

  useEffect(() => {
    if (activeTab === 'campaigns') {
      if (campaignsPagination.page === 1) {
        loadCampaigns();
      } else {
        setCampaignsPagination((prev) => ({ ...prev, page: 1 }));
      }
    }
  }, [campaignStatusFilter]);

  useEffect(() => {
    if (activeTab !== 'campaigns') {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      if (campaignsPagination.page === 1) {
        loadCampaigns();
      } else {
        setCampaignsPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [campaignSearchQuery]);

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase() || 'DRAFT';
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
      PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
      PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      ACTIVE: 'bg-green-100 text-green-800 border-green-300',
      PAUSED: 'bg-blue-100 text-blue-800 border-blue-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
      NEEDS_CHANGES: 'bg-orange-100 text-orange-800 border-orange-300',
      COMPLETED: 'bg-purple-100 text-purple-800 border-purple-300',
      NO_REVIEW: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[statusUpper] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="w-8 h-8 text-[#FF6B35]" />
          <h1 className="text-3xl font-bold text-gray-900">Ad Management Dashboard</h1>
        </div>
        <p className="text-gray-600">Monitor, approve campaigns, and view platform analytics</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="review-queue" className="data-[state=active]:bg-white">Review Queue</TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-white">Campaigns</TabsTrigger>
          <TabsTrigger value="placements" className="data-[state=active]:bg-white">Placements</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-8">
          {loading.overview ? (
            <div className="text-center py-12">Loading platform analytics...</div>
          ) : platformStats ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard
                  title="Total Impressions"
                  value={platformStats.total_impressions || 0}
                  icon={<Eye className="w-5 h-5" />}
                  color="blue"
                />
                <KPICard
                  title="Total Clicks"
                  value={platformStats.total_clicks || 0}
                  icon={<Zap className="w-5 h-5" />}
                  color="orange"
                />
                <KPICard
                  title="Platform CTR"
                  value={`${platformStats.platform_ctr || 0}%`}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="green"
                />
                <KPICard
                  title="Total Ad Spend"
                  value={`$${platformStats.total_spend?.toFixed(2) || 0}`}
                  icon={<DollarSign className="w-5 h-5" />}
                  color="purple"
                />
                <KPICard
                  title="Active Campaigns"
                  value={platformStats.active_campaigns || 0}
                  icon={<Megaphone className="w-5 h-5" />}
                  color="teal"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Impressions & Clicks (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={platformStats.daily_breakdown || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="impressions" stroke="#3B82F6" />
                        <Line type="monotone" dataKey="clicks" stroke="#FF6B35" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <span className="font-medium">Total Credits Purchased</span>
                        <span className="text-lg font-bold text-green-600">${platformStats.total_purchased || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="font-medium">Total Credits Spent</span>
                        <span className="text-lg font-bold text-blue-600">${platformStats.total_spent || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                        <span className="font-medium">Platform Revenue</span>
                        <span className="text-lg font-bold text-purple-600">${platformStats.platform_revenue || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Campaigns Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Campaigns (by Impressions)</CardTitle>
                  <CardDescription>Most viewed campaigns this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign Name</TableHead>
                          <TableHead>Employer</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Spend</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(platformStats.top_campaigns || []).map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.employer_name}</TableCell>
                            <TableCell className="text-right">{campaign.impressions}</TableCell>
                            <TableCell className="text-right">{campaign.clicks}</TableCell>
                            <TableCell className="text-right">{campaign.ctr}%</TableCell>
                            <TableCell className="text-right">${campaign.spend?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* REVIEW QUEUE TAB */}
        <TabsContent value="review-queue" className="space-y-6">
          {loading.reviews ? (
            <div className="text-center py-12">Loading campaigns...</div>
          ) : advertisements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">No campaigns found</p>
                <p className="text-gray-600">Campaigns will appear here for review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-semibold">{reviewStats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-xl font-semibold text-amber-600">{reviewStats.pending}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-xs text-gray-500">Approved</p>
                    <p className="text-xl font-semibold text-green-600">{reviewStats.approved}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-xs text-gray-500">Rejected</p>
                    <p className="text-xl font-semibold text-red-600">{reviewStats.rejected}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-xs text-gray-500">Needs Changes</p>
                    <p className="text-xl font-semibold text-orange-600">{reviewStats.needs_changes || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="needs_changes">Needs Changes</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Campaigns List */}
              {advertisements
                .filter(ad => {
                  const matchSearch = (ad.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (ad.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                  const matchStatus = statusFilter === 'all' || ad.status === statusFilter;
                  return matchSearch && matchStatus;
                })
                .map((ad) => (
                <Card key={ad.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{ad.title}</CardTitle>
                        <CardDescription>
                          Submitted by {ad.company.name} ({ad.company.email}) on{' '}
                          {new Date(ad.submittedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(ad.status)}`}
                      >
                        {ad.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Budget</p>
                        <p className="font-semibold">${ad.budget}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Billing</p>
                        <p className="font-semibold">{ad.billing_type}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Objective</p>
                        <p className="font-semibold">{ad.description}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Creatives</p>
                        <p className="font-semibold">{ad.creatives.length}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAd(ad)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>

                      {ad.actions?.can_approve && (
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={actionBusy}
                          onClick={() => handleApproveCampaign(ad.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}

                      {ad.actions?.can_reject && (
                        <Button 
                          size="sm"
                          variant="destructive"
                          disabled={actionBusy}
                          onClick={() => setSelectedAd(ad)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      )}

                      {ad.actions?.can_reset && (
                        <Button 
                          size="sm"
                          variant="outline"
                          disabled={actionBusy}
                          onClick={() => handleResetCampaignReview(ad.id)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Reset Review
                        </Button>
                      )}

                      {ad.actions?.can_needs_changes && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionBusy}
                          onClick={() => handleNeedsChangesCampaign(ad.id, 'Please revise this campaign based on policy and copy quality feedback.')}
                        >
                          Needs Changes
                        </Button>
                      )}

                      {ad.actions?.can_pause && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionBusy}
                          onClick={() => handleUpdateCampaignStatus(ad.id, 'PAUSED')}
                        >
                          Pause
                        </Button>
                      )}

                      {ad.actions?.can_resume && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionBusy}
                          onClick={() => handleUpdateCampaignStatus(ad.id, 'ACTIVE')}
                        >
                          Resume
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Page {reviewPagination.page} of {reviewPagination.total_pages || 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!reviewPagination.has_prev}
                    onClick={() => setReviewPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!reviewPagination.has_next}
                    onClick={() => setReviewPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="space-y-6">
          {loading.campaigns ? (
            <div className="text-center py-12">Loading campaigns...</div>
          ) : (
            <CampaignsManagementTable
              campaigns={campaigns}
              getStatusColor={getStatusColor}
              statusFilter={campaignStatusFilter}
              onStatusFilterChange={setCampaignStatusFilter}
              searchQuery={campaignSearchQuery}
              onSearchQueryChange={setCampaignSearchQuery}
              onStatusChange={handleUpdateCampaignStatus}
              onViewCampaign={openCampaignDetail}
              onRefresh={loadCampaigns}
              actionBusy={actionBusy}
              pagination={campaignsPagination}
              onPageChange={(page) => setCampaignsPagination((prev) => ({ ...prev, page }))}
            />
          )}
        </TabsContent>

        {/* PLACEMENTS TAB */}
        <TabsContent value="placements" className="space-y-6">
          <PlacementsManagement />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAd?.title}</DialogTitle>
            <DialogDescription>
              Review campaign details and add rejection notes if needed.
            </DialogDescription>
          </DialogHeader>

          {selectedAd && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Employer:</span> {selectedAd.company.name}</div>
                <div><span className="text-gray-500">Review Status:</span> {selectedAd.status.toUpperCase()}</div>
                <div><span className="text-gray-500">Campaign Status:</span> {selectedAd.campaign_status}</div>
                <div><span className="text-gray-500">Budget:</span> ${selectedAd.budget}</div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Creatives</p>
                <div className="space-y-3">
                  {selectedAd.creatives.map((creative) => (
                    <CreativePreview key={creative.id} creative={creative} />
                  ))}
                </div>
              </div>

              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Add notes for rejection (optional but recommended)"
                className="h-28"
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedAd(null)}>Close</Button>
                {selectedAd.actions?.can_approve && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={actionBusy}
                    onClick={() => handleApproveCampaign(selectedAd.id)}
                  >
                    Approve
                  </Button>
                )}
                {selectedAd.actions?.can_reject && (
                  <Button
                    variant="destructive"
                    disabled={actionBusy}
                    onClick={() => handleRejectCampaign(selectedAd.id, rejectNotes)}
                  >
                    Reject
                  </Button>
                )}
                {selectedAd.actions?.can_needs_changes && (
                  <Button
                    variant="outline"
                    disabled={actionBusy}
                    onClick={() => handleNeedsChangesCampaign(selectedAd.id, rejectNotes)}
                  >
                    Needs Changes
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={campaignDetailOpen} onOpenChange={(open) => {
        setCampaignDetailOpen(open);
        if (!open) {
          setSelectedCampaignDetail(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCampaignDetail?.campaign?.name || 'Campaign details'}
            </DialogTitle>
            <DialogDescription>
              Deep moderation view with review status and audit timeline.
            </DialogDescription>
          </DialogHeader>

          {campaignDetailLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading campaign details...</div>
          ) : selectedCampaignDetail ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Employer</p>
                  <p className="font-medium">{selectedCampaignDetail.employer?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Campaign Status</p>
                  <p className="font-medium">{selectedCampaignDetail.campaign?.status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Review Decision</p>
                  <p className="font-medium">{selectedCampaignDetail.review?.decision || 'NO_REVIEW'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Budget</p>
                  <p className="font-medium">${selectedCampaignDetail.campaign?.budget_total || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">30d Impressions</p>
                  <p className="font-medium">{selectedCampaignDetail.analytics?.totals?.impressions || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">30d Clicks</p>
                  <p className="font-medium">{selectedCampaignDetail.analytics?.totals?.clicks || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">30d CTR</p>
                  <p className="font-medium">{selectedCampaignDetail.analytics?.totals?.ctr || 0}%</p>
                </div>
                <div>
                  <p className="text-gray-500">30d Spend</p>
                  <p className="font-medium">${selectedCampaignDetail.analytics?.totals?.spend || 0}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Placements</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedCampaignDetail.placements || []).map((placement) => (
                    <Badge key={placement.id} variant="outline">
                      {placement.display_name || placement.name || placement.placement_key}
                    </Badge>
                  ))}
                  {(selectedCampaignDetail.placements || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No placements configured.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Creatives</h3>
                <div className="space-y-3">
                  {(selectedCampaignDetail.creatives || []).map((creative) => (
                    <CreativePreview key={creative.id} creative={creative} />
                  ))}
                  {(selectedCampaignDetail.creatives || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No creatives available.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Review Timeline</h3>
                <div className="space-y-2">
                  {(selectedCampaignDetail.review_audit_logs || []).map((log) => (
                    <div key={log.id} className="border rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown time'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Admin: {log.admin_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {log.from_status || '-'} {'->'} {log.to_status || '-'} | Decision: {log.from_decision || '-'} {'->'} {log.to_decision || '-'}
                      </p>
                      {log.note && <p className="mt-2">{log.note}</p>}
                    </div>
                  ))}
                  {(selectedCampaignDetail.review_audit_logs || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">No campaign data found.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    teal: 'bg-teal-50 text-teal-600'
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`flex items-center justify-between p-4 rounded ${colorClasses[color]}`}>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
};

// Campaign Review Card
const CampaignReviewCard = ({ campaign, employer, creatives, onApprove, onReject }) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showCreativeModal, setShowCreativeModal] = useState(false);

  return (
    <>
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription>
                Submitted by {employer.name} ({employer.email}) on{' '}
                {new Date(campaign.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              PENDING
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Campaign Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Budget</p>
                <p className="font-semibold">${campaign.budget_total}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Objective</p>
                <p className="font-semibold">{campaign.objective}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Billing Model</p>
                <p className="font-semibold">{campaign.billing_type}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Creatives</p>
                <p className="font-semibold">{creatives.length}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1" onClick={() => setShowCreativeModal(true)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Creatives ({creatives.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Campaign Creatives</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {creatives.map((creative) => (
                      <CreativePreview key={creative.id} creative={creative} />
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={onApprove}
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>

              <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Campaign</DialogTitle>
                    <DialogDescription>
                      Provide a reason for rejection. This will be communicated to the employer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="Enter rejection reason..."
                      className="h-32"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          onReject(rejectNotes);
                          setShowRejectDialog(false);
                          setRejectNotes('');
                        }}
                      >
                        Reject Campaign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Creative Preview Component
const CreativePreview = ({ creative }) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      {creative.image_url && (
        <img src={creative.image_url} alt={creative.title} className="w-full h-40 object-cover rounded mb-3" />
      )}
      <h4 className="font-semibold text-sm mb-1">{creative.title}</h4>
      <p className="text-xs text-gray-600 mb-2">{creative.body_text}</p>
      <div className="flex items-center justify-between">
        <Badge variant="outline">{creative.ad_format}</Badge>
        <span className="text-xs font-medium text-blue-600">{creative.cta_text}</span>
      </div>
    </div>
  );
};

// Campaigns Management Table
const CampaignsManagementTable = ({ campaigns, getStatusColor, statusFilter, onStatusFilterChange, searchQuery, onSearchQueryChange, onStatusChange, onViewCampaign, onRefresh, actionBusy, pagination, onPageChange }) => {

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Campaigns</CardTitle>
        <div className="flex gap-3 mt-4">
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination?.page || 1} of {pagination?.total_pages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination?.has_prev}
              onClick={() => onPageChange(Math.max(1, (pagination?.page || 1) - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination?.has_next}
              onClick={() => onPageChange((pagination?.page || 1) + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} hover>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.employer_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${campaign.budget_total}</TableCell>
                  <TableCell className="text-right">${campaign.budget_spent}</TableCell>
                  <TableCell className="text-right">{campaign.impressions || 0}</TableCell>
                  <TableCell className="text-right">{campaign.clicks || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewCampaign(campaign.id)}
                      >
                        View
                      </Button>
                      {campaign.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionBusy}
                          onClick={() => onStatusChange(campaign.id, 'PAUSED')}
                        >
                          Pause
                        </Button>
                      )}
                      {(campaign.status === 'PAUSED' || campaign.status === 'DRAFT' || campaign.status === 'REJECTED') && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionBusy}
                          onClick={() => onStatusChange(campaign.id, 'ACTIVE')}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Placements Management
const PlacementsManagement = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlacements();
  }, []);

  const loadPlacements = async () => {
    try {
      const response = await adAdminService.listPlacements();
      setPlacements(response.placements || []);
    } catch (error) {
      console.error('Failed to load placements:', error);
      toast.error(error?.message || 'Failed to load placements');
    } finally {
      setLoading(false);
    }
  };

  const togglePlacementStatus = async (placementId, isActive) => {
    try {
      await adAdminService.updatePlacement(placementId, {
        is_active: !isActive
      });
      toast.success('Placement updated');
      loadPlacements();
    } catch (error) {
      console.error('Failed to update placement:', error);
      toast.error(error?.message || 'Failed to update placement');
    }
  };

  return loading ? (
    <div className="text-center py-12">Loading placements...</div>
  ) : (
    <div className="space-y-4">
      {placements.map((placement) => (
        <Card key={placement.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{placement.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{placement.placement_key}</p>
                <div className="flex gap-2">
                  <Badge variant="outline">{placement.page_context}</Badge>
                  <Badge variant="outline">Max {placement.max_ads_per_load} ads</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={placement.is_active ? 'default' : 'outline'}
                  onClick={() => togglePlacementStatus(placement.id, placement.is_active)}
                >
                  {placement.is_active ? 'Active' : 'Inactive'}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminAdsManagement;
