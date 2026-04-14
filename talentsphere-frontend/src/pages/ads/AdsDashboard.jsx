/**
 * Ads Dashboard - Main overview page for employers
 * Shows active campaigns, summary metrics, and campaign management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  MousePointer,
  Eye,
  Percent,
  Zap,
  Plus,
  Filter,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import adManagerService from '../../services/adManager';
import { toast } from 'sonner';

const AdsDashboard = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Summary metrics
  const [metrics, setMetrics] = useState({
    activeCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    averageCtr: 0,
  });

  useEffect(() => {
    loadCampaigns();
  }, [filter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const filterParam = filter !== 'all' ? filter : undefined;
      const response = await adManagerService.listCampaigns({
        status: filterParam,
        limit: 100,
      });

      setCampaigns(response.campaigns || []);

      // Calculate metrics
      const activeCampaigns = response.campaigns.filter((c) => c.status === 'ACTIVE').length;
      const totalImpressions = response.campaigns.reduce(
        (sum, c) => sum + (c.impressions || 0),
        0
      );
      const totalClicks = response.campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
      const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

      setMetrics({
        activeCampaigns,
        totalImpressions,
        totalClicks,
        averageCtr: avgCtr,
      });
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (campaignId) => {
    try {
      await adManagerService.pauseCampaign(campaignId);
      toast.success('Campaign paused');
      loadCampaigns();
    } catch (error) {
      toast.error(error.error || 'Failed to pause campaign');
    }
  };

  const handleResume = async (campaignId) => {
    try {
      await adManagerService.resumeCampaign(campaignId);
      toast.success('Campaign resumed');
      loadCampaigns();
    } catch (error) {
      toast.error(error.error || 'Failed to resume campaign');
    }
  };

  const handleSubmitReview = async (campaignId) => {
    try {
      await adManagerService.submitCampaign(campaignId);
      toast.success('Campaign submitted for review! Admin will review it shortly.');
      loadCampaigns();
    } catch (error) {
      toast.error(error.error || 'Failed to submit campaign for review');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'secondary',
      PENDING_REVIEW: 'outline',
      ACTIVE: 'default',
      PAUSED: 'secondary',
      REJECTED: 'destructive',
      COMPLETED: 'outline',
    };

    const icons = {
      DRAFT: <AlertCircle className="w-3 h-3 mr-1" />,
      PENDING_REVIEW: <Clock className="w-3 h-3 mr-1" />,
      ACTIVE: <Zap className="w-3 h-3 mr-1" />,
      PAUSED: <AlertCircle className="w-3 h-3 mr-1" />,
      REJECTED: <AlertCircle className="w-3 h-3 mr-1" />,
      COMPLETED: <Check className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex w-fit">
        {icons[status]}
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ad Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your advertising campaigns</p>
        </div>
        <Button
          onClick={() => navigate('new')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalImpressions)}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalClicks)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Average CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCtr}%</div>
            <p className="text-xs text-muted-foreground mt-1">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Campaigns</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-accent' : ''}>
                    All Campaigns
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('ACTIVE')} className={filter === 'ACTIVE' ? 'bg-accent' : ''}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('DRAFT')} className={filter === 'DRAFT' ? 'bg-accent' : ''}>
                    Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('PAUSED')} className={filter === 'PAUSED' ? 'bg-accent' : ''}>
                    Paused
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('PENDING_REVIEW')} className={filter === 'PENDING_REVIEW' ? 'bg-accent' : ''}>
                    Pending Review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan="7" className="text-center py-8 text-muted-foreground">
                    Loading campaigns...
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="7" className="text-center py-8 text-muted-foreground">
                    No campaigns yet. Create one to get started!
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <button
                        onClick={() => navigate(`${campaign.id}`)}
                        className="font-medium hover:underline text-primary"
                      >
                        {campaign.name}
                      </button>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${
                                (parseFloat(campaign.budget_spent) / parseFloat(campaign.budget_total)) * 100 || 0
                              }%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${parseFloat(campaign.budget_spent).toFixed(2)} / $
                          {parseFloat(campaign.budget_total).toFixed(2)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.impressions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                    <TableCell className="text-right">{campaign.ctr}%</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">•••</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`${campaign.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          {campaign.status === 'ACTIVE' && (
                            <DropdownMenuItem onClick={() => handlePause(campaign.id)}>
                              Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'PAUSED' && (
                            <DropdownMenuItem onClick={() => handleResume(campaign.id)}>
                              Resume
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'DRAFT' && (
                            <>
                              <DropdownMenuItem onClick={() => navigate(`${campaign.id}`)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSubmitReview(campaign.id)} className="text-orange-600">
                                Request Review
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this campaign? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive">Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdsDashboard;
