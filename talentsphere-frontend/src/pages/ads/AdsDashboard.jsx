/**
 * Ads Dashboard - Main overview page for employers
 * Shows active campaigns, summary metrics, and campaign management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MousePointer,
  Eye,
  Percent,
  Zap,
  Plus,
  Clock,
  Check,
  AlertCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import adManagerService from '../../services/adManager';
import { toast } from 'sonner';

const AdsDashboard = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total_pages: 1, has_next: false, has_prev: false });
  const [statusCounts, setStatusCounts] = useState({});

  const ACTIVE_FILTERS = ['ACTIVE', 'DRAFT', 'PAUSED', 'PENDING_REVIEW', 'NEEDS_CHANGES'];

  // Summary metrics
  const [metrics, setMetrics] = useState({
    activeCampaigns: 0,
    totalImpressions: 0,
    monthlyImpressions: 0,
    totalClicks: 0,
    averageCtr: 0,
    totalCampaigns: 0,
    pendingReview: 0,
    needsChanges: 0,
  });

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const filterParam = filter !== 'all' ? filter : undefined;
      const [response, summary] = await Promise.all([
        adManagerService.listCampaigns({
          status: filterParam,
          q: debouncedSearchQuery || undefined,
          page: pagination.page,
          limit: pagination.limit,
        }),
        adManagerService.getDashboardSummary(),
      ]);

      const campaignList = response?.campaigns || [];
      const backendStatusCounts = response?.status_counts || {};

      // Fallback when backend is stale/missing status_counts.
      const derivedStatusCounts = campaignList.reduce((acc, campaign) => {
        const statusKey = String(campaign?.status || '').toUpperCase();
        if (!statusKey) return acc;
        acc[statusKey] = (acc[statusKey] || 0) + 1;
        return acc;
      }, {});

      const hasBackendStatusCounts = Object.keys(backendStatusCounts).length > 0;
      const safeStatusCounts = hasBackendStatusCounts ? backendStatusCounts : derivedStatusCounts;

      setCampaigns(campaignList);
      setStatusCounts(safeStatusCounts);
      setPagination((prev) => ({ ...prev, ...(response?.pagination || {}) }));

      const activeCampaigns = Number(summary?.active_campaigns ?? 0);
      const totalImpressions = Number(summary?.total_impressions ?? 0);
      const monthlyImpressions = Number(summary?.monthly_impressions ?? 0);
      const totalClicks = Number(summary?.total_clicks ?? 0);
      const avgCtr = Number(summary?.average_ctr ?? 0);

      setMetrics({
        activeCampaigns,
        totalImpressions,
        monthlyImpressions,
        totalClicks,
        averageCtr: avgCtr,
        totalCampaigns: Number(
          response?.total || Object.values(safeStatusCounts).reduce((sum, value) => sum + Number(value || 0), 0)
        ),
        pendingReview: Number(safeStatusCounts?.PENDING_REVIEW || 0),
        needsChanges: Number(safeStatusCounts?.NEEDS_CHANGES || 0),
      });
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error(error?.error || error?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearchQuery, pagination.page, pagination.limit]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearchQuery]);

  const handlePause = async (campaignId) => {
    try {
      await adManagerService.pauseCampaign(campaignId);
      toast.success('Campaign paused');
      loadCampaigns();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to pause campaign');
    }
  };

  const handleResume = async (campaignId) => {
    try {
      await adManagerService.resumeCampaign(campaignId);
      toast.success('Campaign resumed');
      loadCampaigns();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to resume campaign');
    }
  };

  const handleSubmitReview = async (campaignId) => {
    try {
      await adManagerService.submitCampaign(campaignId);
      toast.success('Campaign submitted for review! Admin will review it shortly.');
      loadCampaigns();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to submit campaign for review');
    }
  };

  const handleEditCampaign = (campaign) => {
    const campaignId = campaign?.id ?? campaign?.campaign_id;
    if (!campaignId) {
      toast.error('Unable to edit campaign: missing campaign ID');
      return;
    }
    navigate(`/employer/ads/${campaignId}`);
  };

  const handleDeleteCampaign = async (campaign) => {
    const campaignId = campaign?.id ?? campaign?.campaign_id;
    if (!campaignId) {
      toast.error('Unable to delete campaign: missing campaign ID');
      return;
    }

    const campaignName = campaign?.name || `#${campaignId}`;
    const confirmed = window.confirm(
      `Delete campaign "${campaignName}"? This will permanently remove its creatives and analytics data.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await adManagerService.deleteCampaign(campaignId);
      toast.success('Campaign deleted');

      // If deleting the last item on page, move to previous page when possible.
      if (campaigns.length === 1 && (pagination.page || 1) > 1) {
        setPagination((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }));
      } else {
        loadCampaigns();
      }
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to delete campaign');
    }
  };

  const goToCampaignDetails = (campaign) => {
    const campaignId = campaign?.id ?? campaign?.campaign_id;
    if (!campaignId) {
      toast.error('Unable to open campaign details: missing campaign ID');
      return;
    }
    navigate(`/employer/ads/${campaignId}`);
  };

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'secondary',
      PENDING_REVIEW: 'outline',
      ACTIVE: 'default',
      PAUSED: 'secondary',
      REJECTED: 'destructive',
      NEEDS_CHANGES: 'outline',
      COMPLETED: 'outline',
    };

    const icons = {
      DRAFT: <AlertCircle className="w-3 h-3 mr-1" />,
      PENDING_REVIEW: <Clock className="w-3 h-3 mr-1" />,
      ACTIVE: <Zap className="w-3 h-3 mr-1" />,
      PAUSED: <AlertCircle className="w-3 h-3 mr-1" />,
      REJECTED: <AlertCircle className="w-3 h-3 mr-1" />,
      NEEDS_CHANGES: <AlertCircle className="w-3 h-3 mr-1" />,
      COMPLETED: <Check className="w-3 h-3 mr-1" />,
    };

    const badgeClasses = {
      DRAFT: 'border border-[#1b4f86] bg-[#123f6e]/70 text-slate-100',
      PENDING_REVIEW: 'border border-[#FF6B35]/40 bg-[#FF6B35]/20 text-[#FF6B35]',
      ACTIVE: 'border border-[#1BA398]/40 bg-[#1BA398]/20 text-[#1BA398]',
      PAUSED: 'border border-[#1b4f86] bg-[#123f6e]/70 text-slate-100',
      REJECTED: 'border border-[#ef4444]/40 bg-[#ef4444]/20 text-[#fecaca]',
      NEEDS_CHANGES: 'border border-[#FF6B35]/40 bg-[#FF6B35]/20 text-[#FF6B35]',
      COMPLETED: 'border border-[#1BA398]/40 bg-[#1BA398]/20 text-[#1BA398]',
    };

    return (
      <Badge
        variant={variants[status]}
        className={`flex w-fit ${badgeClasses[status] || 'border border-[#1b4f86] bg-[#123f6e]/70 text-slate-100'}`}
      >
        {icons[status]}
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const formatNumber = (num) => {
    const parsed = Number(num || 0);
    if (Number.isNaN(parsed)) return '0';
    if (parsed >= 1000000) return (parsed / 1000000).toFixed(1) + 'M';
    if (parsed >= 1000) return (parsed / 1000).toFixed(1) + 'K';
    return parsed.toString();
  };

  const formatCurrency = (value) => {
    const parsed = Number(value || 0);
    if (Number.isNaN(parsed)) return '0.00';
    return parsed.toFixed(2);
  };

  const pageBackgroundStyle = {
    backgroundColor: '#002a5a',
    backgroundImage:
      'radial-gradient(circle at center, rgba(18, 63, 110, 0.45) 0, rgba(18, 63, 110, 0.45) 18px, transparent 20px)',
    backgroundSize: '74px 74px',
  };

  const darkCardClass = 'border-[#1b4f86] bg-[#0a335f]/75 text-slate-100';
  const brandPrimaryButtonClass = 'bg-gradient-to-r from-[#1BA398] to-[#FF6B35] text-slate-100 hover:from-[#158b7e] hover:to-[#e55a24]';
  const brandOutlineButtonClass = 'border-[#1BA398]/50 text-[#1BA398] hover:bg-[#1BA398]/15 hover:text-slate-100';
  const brandDropdownContentClass = 'border-[#1b4f86] bg-[#0a335f] text-slate-100';
  const brandDropdownItemClass = 'cursor-pointer text-slate-200 focus:bg-[#1BA398]/20 focus:text-slate-100 data-[highlighted]:bg-[#1BA398]/20 data-[highlighted]:text-slate-100';

  const getBudgetProgress = (campaign) => {
    const spent = Number(campaign?.budget_spent || 0);
    const total = Number(campaign?.budget_total || 0);
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.max(0, (spent / total) * 100));
  };

  return (
    <div className="space-y-6 rounded-2xl p-4 sm:p-6" style={pageBackgroundStyle}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Ad Campaigns</h1>
          <p className="text-slate-300 mt-1">Manage and monitor your advertising campaigns</p>
        </div>
        <Button
          onClick={() => navigate('new')}
          className="gap-2 bg-gradient-to-r from-[#1BA398] to-[#FF6B35] hover:from-[#158b7e] hover:to-[#e55a24]"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className={darkCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCampaigns}</div>
            <p className="text-xs text-slate-300 mt-1">Across all statuses</p>
          </CardContent>
        </Card>

        <Card className={darkCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
            <p className="text-xs text-slate-300 mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card className={darkCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.monthlyImpressions)}</div>
            <p className="text-xs text-slate-300 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className={darkCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalClicks)}</div>
            <p className="text-xs text-slate-300 mt-1">Total</p>
          </CardContent>
        </Card>

        <Card className={darkCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Average CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCtr}%</div>
            <p className="text-xs text-slate-300 mt-1">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      {(metrics.pendingReview > 0 || metrics.needsChanges > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert className="border-[#1b4f86] bg-[#0a335f]/75 text-slate-100">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {metrics.pendingReview} campaign(s) pending admin review.
            </AlertDescription>
          </Alert>
          <Alert className="border-[#1b4f86] bg-[#0a335f]/75 text-slate-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {metrics.needsChanges} campaign(s) need changes before approval.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Filters and Table */}
      <Card className={darkCardClass}>
        <CardHeader className="pb-4 border-b border-[#1b4f86]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-slate-100">Campaigns</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by campaign name, objective, or status..."
                  className="w-full sm:w-80 border-[#1b4f86] bg-[#123f6e]/60 text-slate-100 placeholder:text-slate-300"
                />
                <Button variant="outline" size="sm" onClick={loadCampaigns} className={brandOutlineButtonClass}>Refresh</Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                className={filter === 'all' ? brandPrimaryButtonClass : brandOutlineButtonClass}
                onClick={() => setFilter('all')}
              >
                All ({Object.values(statusCounts).reduce((acc, count) => acc + Number(count || 0), 0)})
              </Button>
              {ACTIVE_FILTERS.map((statusKey) => (
                <Button
                  key={statusKey}
                  variant={filter === statusKey ? 'default' : 'outline'}
                  size="sm"
                  className={filter === statusKey ? brandPrimaryButtonClass : brandOutlineButtonClass}
                  onClick={() => setFilter(statusKey)}
                >
                  {statusKey.replace('_', ' ')} ({statusCounts?.[statusKey] || 0})
                </Button>
              ))}
            </div>

          </div>
        </CardHeader>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-slate-300">Campaign Name</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Budget</TableHead>
                <TableHead className="text-right text-slate-300">Impressions</TableHead>
                <TableHead className="text-right text-slate-300">Clicks</TableHead>
                <TableHead className="text-right text-slate-300">CTR</TableHead>
                <TableHead className="w-52 text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan="7" className="text-center py-8 text-slate-300">
                    Loading campaigns...
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="7" className="text-center py-8 text-slate-300">
                    No campaigns yet. Create one to get started!
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <button
                        onClick={() => goToCampaignDetails(campaign)}
                        className="font-medium hover:underline text-[#1BA398]"
                      >
                        {campaign.name}
                      </button>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="w-32 h-2 bg-[#123f6e]/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#1BA398] to-[#FF6B35] rounded-full"
                            style={{
                              width: `${getBudgetProgress(campaign)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-300">
                          ${formatCurrency(campaign.budget_spent)} / ${formatCurrency(campaign.budget_total)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.impressions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                    <TableCell className="text-right">{campaign.ctr}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className={brandOutlineButtonClass} onClick={() => goToCampaignDetails(campaign)}>
                          View
                        </Button>
                        {campaign.actions?.can_edit && (
                          <Button variant="outline" size="sm" className={brandOutlineButtonClass} onClick={() => handleEditCampaign(campaign)}>
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        {campaign.actions?.can_delete && (
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteCampaign(campaign)}>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-[#1BA398]">•••</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={brandDropdownContentClass}>
                            <DropdownMenuItem className={brandDropdownItemClass} onSelect={() => goToCampaignDetails(campaign)}>
                              View Details
                            </DropdownMenuItem>
                            {campaign.actions?.can_pause && (
                              <DropdownMenuItem className={brandDropdownItemClass} onClick={() => handlePause(campaign.id)}>
                                Pause
                              </DropdownMenuItem>
                            )}
                            {campaign.actions?.can_resume && (
                              <DropdownMenuItem className={brandDropdownItemClass} onClick={() => handleResume(campaign.id)}>
                                Resume
                              </DropdownMenuItem>
                            )}
                            {campaign.actions?.can_submit_review && (
                              <DropdownMenuItem
                                onClick={() => handleSubmitReview(campaign.id)}
                                className={`${brandDropdownItemClass} text-[#FF6B35] focus:bg-[#FF6B35]/20 data-[highlighted]:bg-[#FF6B35]/20`}
                              >
                                {campaign.status === 'NEEDS_CHANGES' ? 'Resubmit for Review' : 'Request Review'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {campaigns.some((c) => c.status === 'NEEDS_CHANGES') && (
            <div className="px-4 pb-4">
              <Alert className="border-[#1b4f86] bg-[#0a335f]/75 text-slate-100">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Some campaigns need updates before approval. Open the campaign and review admin feedback, then resubmit.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 pb-4 text-sm text-slate-300">
          <p>
            Page {pagination.page || 1} of {pagination.total_pages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={brandOutlineButtonClass}
              disabled={!pagination.has_prev || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={brandOutlineButtonClass}
              disabled={!pagination.has_next || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdsDashboard;
