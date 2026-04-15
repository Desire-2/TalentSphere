/**
 * Campaign Detail Page - View, edit, and manage individual campaign
 * Tabs: Overview (analytics), Creatives, Targeting, Settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  Zap,
  Eye,
  MousePointer,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import adManagerService from '../../services/adManager';
import { toast } from 'sonner';
import CampaignAnalyticsPanel from '../../components/ads/CampaignAnalyticsPanel';

const RWANDA_LOCATIONS = [
  'Kigali',
  'Gasabo',
  'Kicukiro',
  'Nyarugenge',
  'South Province',
  'West Province',
  'North Province',
  'East Province',
];

const JOB_CATEGORIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Marketing',
  'Sales',
  'Operations',
  'Education',
];

const OBJECTIVES = [
  'AWARENESS',
  'TRAFFIC',
  'ENGAGEMENT',
  'LEADS',
];

const BILLING_TYPES = [
  'CPM',
  'CPC',
  'FLAT_RATE',
];

const buildTargetingForm = (targeting) => ({
  locations: targeting?.locations || [],
  job_categories: targeting?.job_categories || [],
  user_type: targeting?.user_type || 'all',
  min_experience_years: targeting?.min_experience_years ?? 0,
  keywords: targeting?.keywords || [],
});

const toDateInputValue = (rawValue) => {
  if (!rawValue) return '';
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

const formatCurrency = (value) => {
  const parsed = Number(value || 0);
  if (Number.isNaN(parsed)) return '0.00';
  return parsed.toFixed(2);
};

const isValidHttpUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const CampaignDetail = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSettings, setEditingSettings] = useState(false);
  const [creatingCreative, setCreatingCreative] = useState(false);
  const [availablePlacements, setAvailablePlacements] = useState([]);
  const [selectedPlacementIds, setSelectedPlacementIds] = useState([]);
  const [savingPlacements, setSavingPlacements] = useState(false);
  const [editingTargeting, setEditingTargeting] = useState(false);
  const [savingTargeting, setSavingTargeting] = useState(false);
  const [creativeActionBusyId, setCreativeActionBusyId] = useState(null);
  const [campaignActionBusy, setCampaignActionBusy] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  const [settingsForm, setSettingsForm] = useState({});
  const [targetingForm, setTargetingForm] = useState(buildTargetingForm(null));
  const [creativeForm, setCreativeForm] = useState({
    headline: '',
    bodyText: '',
    ctaButtonText: 'Learn More',
    destinationUrl: '',
    adFormat: 'BANNER_HORIZONTAL',
  });

  const [creativeImageFile, setCreativeImageFile] = useState(null);

  const [analytics, setAnalytics] = useState({
    totals: {},
    daily: [],
  });

  const canEditCampaign = ['DRAFT', 'PAUSED', 'NEEDS_CHANGES'].includes(campaign?.status);

  const selectedPlacementObjects = selectedPlacementIds
    .map((id) => availablePlacements.find((placement) => placement.id === id))
    .filter(Boolean);

  const selectedPlacementSupportedFormats = new Set(
    selectedPlacementObjects.flatMap((placement) => placement.allowed_formats || [])
  );

  const creativeFormatOptions = [
    'BANNER_HORIZONTAL',
    'BANNER_VERTICAL',
    'CARD',
    'INLINE_FEED',
    'SPONSORED_JOB',
    'SPOTLIGHT',
  ];

  const loadCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      const [campaignData, placementsData] = await Promise.all([
        adManagerService.getCampaign(campaignId),
        adManagerService.listPlacements(campaignId),
      ]);
      setCampaign(campaignData);
      setAvailablePlacements(placementsData?.placements || []);

      const selectedIds =
        (campaignData?.placements || []).map((placement) => placement.id) ||
        (placementsData?.placements || [])
          .filter((placement) => placement.selected)
          .map((placement) => placement.id);
      setSelectedPlacementIds(selectedIds);

      setSettingsForm({
        name: campaignData.name,
        objective: campaignData.objective,
        billing_type: campaignData.billing_type,
        bid_amount: campaignData.bid_amount,
        budget_total: campaignData.budget_total,
        start_date: toDateInputValue(campaignData.start_date),
        end_date: toDateInputValue(campaignData.end_date),
      });
      setTargetingForm(buildTargetingForm(campaignData?.targeting));
      setKeywordInput('');
      setEditingTargeting(false);

      const analyticsData = await adManagerService.getAnalytics(campaignId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error(error?.error || error?.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadCampaignData();
  }, [loadCampaignData]);

  const handlePlacementToggle = (placementId) => {
    setSelectedPlacementIds((prev) =>
      prev.includes(placementId)
        ? prev.filter((id) => id !== placementId)
        : [...prev, placementId]
    );
  };

  const handleSavePlacements = async () => {
    if (selectedPlacementIds.length === 0) {
      toast.error('Select at least one placement');
      return;
    }

    try {
      setSavingPlacements(true);
      await adManagerService.updateCampaignPlacements(campaignId, selectedPlacementIds);
      toast.success('Campaign placements updated');
      await loadCampaignData();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to update placements');
    } finally {
      setSavingPlacements(false);
    }
  };

  const handleToggleTargetingValue = (field, value) => {
    setTargetingForm((prev) => {
      const selected = prev[field] || [];
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      return {
        ...prev,
        [field]: next,
      };
    });
  };

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (!keyword) return;

    setTargetingForm((prev) => {
      if (prev.keywords.includes(keyword)) return prev;
      return {
        ...prev,
        keywords: [...prev.keywords, keyword],
      };
    });
    setKeywordInput('');
  };

  const handleRemoveKeyword = (keyword) => {
    setTargetingForm((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((item) => item !== keyword),
    }));
  };

  const handleSaveTargeting = async () => {
    try {
      setSavingTargeting(true);
      await adManagerService.setTargeting(campaignId, {
        ...targetingForm,
        min_experience_years: Math.max(0, Number(targetingForm.min_experience_years) || 0),
      });
      toast.success('Targeting updated');
      setEditingTargeting(false);
      await loadCampaignData();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to update targeting');
    } finally {
      setSavingTargeting(false);
    }
  };

  const handleCancelTargeting = () => {
    setTargetingForm(buildTargetingForm(campaign?.targeting));
    setKeywordInput('');
    setEditingTargeting(false);
  };

  const handleCreateCreative = async () => {
    if (!creativeForm.headline.trim() || !creativeForm.bodyText.trim() || !creativeForm.destinationUrl.trim()) {
      toast.error('Headline, body text, and destination URL are required');
      return;
    }

    if (!isValidHttpUrl(creativeForm.destinationUrl.trim())) {
      toast.error('Destination URL must be a valid absolute http(s) URL');
      return;
    }

    if (!selectedPlacementSupportedFormats.has(creativeForm.adFormat)) {
      toast.error(`Selected placements do not support ${creativeForm.adFormat}`);
      return;
    }

    try {
      await adManagerService.createCreative(campaignId, {
        title: creativeForm.headline,
        body_text: creativeForm.bodyText,
        cta_text: creativeForm.ctaButtonText,
        cta_url: creativeForm.destinationUrl.trim(),
        ad_format: creativeForm.adFormat,
        is_active: true,
      }, creativeImageFile);
      toast.success('Creative created');
      setCreatingCreative(false);
      setCreativeForm({
        headline: '',
        bodyText: '',
        ctaButtonText: 'Learn More',
        destinationUrl: '',
        adFormat: 'BANNER_HORIZONTAL',
      });
      setCreativeImageFile(null);
      loadCampaignData();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to create creative');
    }
  };

  const handleDeleteCreative = async (creativeId) => {
    const confirmed = window.confirm('Delete this creative? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setCreativeActionBusyId(`delete-${creativeId}`);
      await adManagerService.deleteCreative(campaignId, creativeId);
      toast.success('Creative deleted');
      await loadCampaignData();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to delete creative');
    } finally {
      setCreativeActionBusyId(null);
    }
  };

  const handleToggleCreativeStatus = async (creative) => {
    try {
      setCreativeActionBusyId(`toggle-${creative.id}`);
      await adManagerService.updateCreative(campaignId, creative.id, {
        is_active: !creative.is_active,
      });
      toast.success(`Creative ${creative.is_active ? 'deactivated' : 'activated'}`);
      await loadCampaignData();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to update creative');
    } finally {
      setCreativeActionBusyId(null);
    }
  };

  const handleUpdateSettings = async () => {
    if (!settingsForm?.name?.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (!OBJECTIVES.includes(settingsForm?.objective)) {
      toast.error('Please select a valid campaign objective');
      return;
    }

    if (!BILLING_TYPES.includes(settingsForm?.billing_type)) {
      toast.error('Please select a valid billing type');
      return;
    }

    if (!settingsForm?.bid_amount || parseFloat(settingsForm.bid_amount) <= 0) {
      toast.error('Bid amount must be greater than 0');
      return;
    }

    if (!settingsForm?.budget_total || parseFloat(settingsForm.budget_total) <= 0) {
      toast.error('Budget must be greater than 0');
      return;
    }

    if (settingsForm.start_date && settingsForm.end_date && settingsForm.start_date >= settingsForm.end_date) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      await adManagerService.updateCampaign(campaignId, settingsForm);
      toast.success('Campaign updated');
      setEditingSettings(false);
      loadCampaignData();
    } catch (error) {
      toast.error(error?.error || 'Failed to update campaign');
    }
  };

  const handleResubmitForReview = async () => {
    try {
      await adManagerService.submitCampaign(campaignId);
      toast.success('Campaign resubmitted for review');
      loadCampaignData();
    } catch (error) {
      toast.error(error?.error || 'Failed to resubmit campaign');
    }
  };

  const handlePauseCampaign = async () => {
    try {
      setCampaignActionBusy(true);
      await adManagerService.pauseCampaign(campaignId);
      toast.success('Campaign paused');
      await loadCampaignData();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to pause campaign');
    } finally {
      setCampaignActionBusy(false);
    }
  };

  const handleResumeCampaign = async () => {
    try {
      setCampaignActionBusy(true);
      await adManagerService.resumeCampaign(campaignId);
      toast.success('Campaign resumed');
      await loadCampaignData();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to resume campaign');
    } finally {
      setCampaignActionBusy(false);
    }
  };

  const handleDeleteCampaign = async () => {
    const confirmed = window.confirm(
      `Delete campaign "${campaign?.name}"? This will permanently remove creatives and analytics data.`
    );
    if (!confirmed) return;

    try {
      setCampaignActionBusy(true);
      await adManagerService.deleteCampaign(campaignId);
      toast.success('Campaign deleted successfully');
      navigate('/employer/ads');
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to delete campaign');
    } finally {
      setCampaignActionBusy(false);
    }
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
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Button onClick={() => navigate('/employer/ads')} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Campaign not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button onClick={() => navigate('/employer/ads')} variant="outline" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(campaign.status)}
            <span className="text-sm text-muted-foreground">
              {campaign.start_date && `Started ${new Date(campaign.start_date).toLocaleDateString()}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {campaign.status === 'ACTIVE' && (
            <Button variant="outline" onClick={handlePauseCampaign} disabled={campaignActionBusy}>
              Pause Campaign
            </Button>
          )}
          {campaign.status === 'PAUSED' && (
            <Button variant="outline" onClick={handleResumeCampaign} disabled={campaignActionBusy}>
              Resume Campaign
            </Button>
          )}
          {['DRAFT', 'PAUSED', 'REJECTED', 'NEEDS_CHANGES', 'COMPLETED'].includes(campaign.status) && (
            <Button variant="destructive" onClick={handleDeleteCampaign} disabled={campaignActionBusy}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {campaign.status === 'NEEDS_CHANGES' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Admin requested updates before approval.</p>
              <p className="text-sm">
                {campaign.review?.notes || 'Please update your creatives/campaign settings and resubmit for review.'}
              </p>
              <Button size="sm" onClick={handleResubmitForReview} className="mt-1">
                Resubmit For Review
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Impressions</p>
                <p className="text-2xl font-bold mt-1">{analytics.totals?.impressions || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Clicks</p>
                <p className="text-2xl font-bold mt-1">{analytics.totals?.clicks || 0}</p>
              </div>
              <MousePointer className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">CTR</p>
                <p className="text-2xl font-bold mt-1">{analytics.totals?.ctr || 0}%</p>
              </div>
              <Percent className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget</p>
              <p className="text-sm font-medium mt-2">
                ${formatCurrency(campaign.budget_spent)} / ${formatCurrency(campaign.budget_total)}
              </p>
              <div className="w-full h-2 bg-secondary rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${
                      Number(campaign.budget_total) > 0
                        ? Math.min(100, (Number(campaign.budget_spent || 0) / Number(campaign.budget_total)) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto rounded-none">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="creatives"
              className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
            >
              Creatives
            </TabsTrigger>
            <TabsTrigger
              value="targeting"
              className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
            >
              Targeting & Placements
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            {campaign.review && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-sm">Review Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Decision:</span>{' '}
                    <span className="font-medium">{campaign.review.decision || 'PENDING'}</span>
                  </p>
                  {campaign.review.notes && (
                    <p>
                      <span className="text-muted-foreground">Notes:</span> {campaign.review.notes}
                    </p>
                  )}
                  {campaign.review.reviewed_at && (
                    <p>
                      <span className="text-muted-foreground">Reviewed At:</span>{' '}
                      {new Date(campaign.review.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {campaign.review_audit_logs && campaign.review_audit_logs.length > 0 && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-sm">Moderation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {campaign.review_audit_logs.map((log) => (
                      <div key={log.id} className="text-sm border rounded p-2">
                        <p className="font-medium">{log.action.replace('_', ' ')}</p>
                        <p className="text-muted-foreground text-xs">
                          {log.admin_name || 'Admin'} - {new Date(log.created_at).toLocaleString()}
                        </p>
                        {log.note && <p className="mt-1">{log.note}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <CampaignAnalyticsPanel campaignId={campaignId} campaignName={campaign.name} />
          </TabsContent>

          {/* Creatives Tab */}
          <TabsContent value="creatives" className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Ad Creatives</h3>
                {!creatingCreative && canEditCampaign && (
                  <Button onClick={() => setCreatingCreative(true)} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Creative
                  </Button>
                )}
              </div>

              {creatingCreative && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Create New Creative</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Headline</Label>
                      <Input
                        maxLength={80}
                        placeholder="Headline"
                        value={creativeForm.headline}
                        onChange={(e) =>
                          setCreativeForm({ ...creativeForm, headline: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {creativeForm.headline.length}/80
                      </p>
                    </div>

                    <div>
                      <Label>Body Text</Label>
                      <Textarea
                        maxLength={200}
                        placeholder="Ad copy"
                        value={creativeForm.bodyText}
                        onChange={(e) =>
                          setCreativeForm({ ...creativeForm, bodyText: e.target.value })
                        }
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {creativeForm.bodyText.length}/200
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>CTA Button</Label>
                        <Select
                          value={creativeForm.ctaButtonText}
                          onValueChange={(v) =>
                            setCreativeForm({ ...creativeForm, ctaButtonText: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Learn More">Learn More</SelectItem>
                            <SelectItem value="Apply Now">Apply Now</SelectItem>
                            <SelectItem value="Contact Us">Contact Us</SelectItem>
                            <SelectItem value="Visit Website">Visit Website</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Ad Format</Label>
                        <Select
                          value={creativeForm.adFormat}
                          onValueChange={(v) =>
                            setCreativeForm({ ...creativeForm, adFormat: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {creativeFormatOptions
                              .filter((fmt) => selectedPlacementSupportedFormats.size === 0 || selectedPlacementSupportedFormats.has(fmt))
                              .map((fmt) => (
                                <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Destination URL</Label>
                      <Input
                        placeholder="https://..."
                        value={creativeForm.destinationUrl}
                        onChange={(e) =>
                          setCreativeForm({
                            ...creativeForm,
                            destinationUrl: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="creativeImage">Creative Image (optional)</Label>
                      <Input
                        id="creativeImage"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => setCreativeImageFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">PNG/JPG/WEBP up to 2MB.</p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCreatingCreative(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCreative}>Create Creative</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {campaign.creatives && campaign.creatives.length > 0 ? (
                <div className="space-y-3">
                  {campaign.creatives.map((creative) => (
                    <Card key={creative.id}>
                      <CardContent className="pt-6 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{creative.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {creative.body_text}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {creative.ad_format}
                            </Badge>
                            {creative.is_active ? (
                              <Badge className="text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                        {canEditCampaign && (
                          <div className="flex flex-col md:flex-row gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={creativeActionBusyId === `toggle-${creative.id}`}
                              onClick={() => handleToggleCreativeStatus(creative)}
                            >
                              {creative.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={creativeActionBusyId === `delete-${creative.id}`}
                              onClick={() => handleDeleteCreative(creative.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No creatives yet. Add one to get started.</p>
              )}
            </div>
          </TabsContent>

          {/* Targeting Tab */}
          <TabsContent value="targeting" className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Placements</h3>
                {availablePlacements.length > 0 ? (
                  <div className="space-y-3">
                    {availablePlacements.map((placement) => {
                      const isChecked = selectedPlacementIds.includes(placement.id);
                      return (
                        <label
                          key={placement.id}
                          className="flex items-start gap-3 border rounded-md p-3 cursor-pointer hover:border-primary/40"
                        >
                          <Checkbox
                            checked={isChecked}
                            disabled={!canEditCampaign}
                            onCheckedChange={() => handlePlacementToggle(placement.id)}
                          />
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{placement.display_name || placement.name}</p>
                            <p className="text-xs text-muted-foreground">{placement.description || placement.placement_key}</p>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {(placement.allowed_formats || []).map((fmt) => (
                                <Badge key={`${placement.id}-${fmt}`} variant="outline" className="text-[10px]">
                                  {fmt}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    {canEditCampaign && (
                      <div className="flex justify-end">
                        <Button onClick={handleSavePlacements} disabled={savingPlacements}>
                          {savingPlacements ? 'Saving...' : 'Save Placements'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active placements available.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="font-semibold">Campaign Targeting</h3>
                  {!editingTargeting && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={!canEditCampaign}
                      onClick={() => setEditingTargeting(true)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Targeting
                    </Button>
                  )}
                </div>

                {!editingTargeting ? (
                  <div className="space-y-4">
                    {targetingForm.user_type && (
                      <div>
                        <Label className="text-muted-foreground">Audience</Label>
                        <p className="font-medium capitalize mt-2">{targetingForm.user_type}</p>
                      </div>
                    )}

                    {targetingForm.locations?.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Locations</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {targetingForm.locations.map((loc) => (
                            <Badge key={loc}>{loc}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {targetingForm.job_categories?.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Job Categories</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {targetingForm.job_categories.map((cat) => (
                            <Badge key={cat} variant="outline">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {targetingForm.keywords?.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Keywords</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {targetingForm.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {Number(targetingForm.min_experience_years) > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Minimum Experience</Label>
                        <p className="font-medium mt-2">
                          {targetingForm.min_experience_years} years
                        </p>
                      </div>
                    )}

                    {targetingForm.locations.length === 0 &&
                      targetingForm.job_categories.length === 0 &&
                      targetingForm.keywords.length === 0 &&
                      Number(targetingForm.min_experience_years) === 0 && (
                        <p className="text-sm text-muted-foreground">No targeting set yet.</p>
                      )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      <div>
                        <Label>Audience Type</Label>
                        <Select
                          value={targetingForm.user_type}
                          onValueChange={(value) =>
                            setTargetingForm((prev) => ({ ...prev, user_type: value }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="jobseekers">Jobseekers Only</SelectItem>
                            <SelectItem value="employers">Employers Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Locations</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                          {RWANDA_LOCATIONS.map((location) => (
                            <label key={location} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={targetingForm.locations.includes(location)}
                                onCheckedChange={() => handleToggleTargetingValue('locations', location)}
                              />
                              <span className="text-sm">{location}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Job Categories</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                          {JOB_CATEGORIES.map((category) => (
                            <label key={category} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={targetingForm.job_categories.includes(category)}
                                onCheckedChange={() => handleToggleTargetingValue('job_categories', category)}
                              />
                              <span className="text-sm">{category}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="minExperience">Minimum Experience (Years)</Label>
                        <Input
                          id="minExperience"
                          type="number"
                          min={0}
                          value={targetingForm.min_experience_years}
                          onChange={(e) =>
                            setTargetingForm((prev) => ({
                              ...prev,
                              min_experience_years: e.target.value,
                            }))
                          }
                          className="mt-2 max-w-xs"
                        />
                      </div>

                      <div>
                        <Label htmlFor="targetingKeyword">Keywords</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="targetingKeyword"
                            placeholder="Add keyword"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddKeyword();
                              }
                            }}
                          />
                          <Button type="button" variant="outline" onClick={handleAddKeyword}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {targetingForm.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="gap-1">
                              {keyword}
                              <button
                                type="button"
                                aria-label={`Remove ${keyword}`}
                                className="ml-1"
                                onClick={() => handleRemoveKeyword(keyword)}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={handleCancelTargeting}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTargeting} disabled={savingTargeting}>
                          {savingTargeting ? 'Saving...' : 'Save Targeting'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-6">
            <div className="space-y-4">
              {!editingSettings ? (
                <>
                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <Label className="text-muted-foreground">Campaign Name</Label>
                        <p className="font-medium">{campaign.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Budget</Label>
                        <p className="font-medium">
                          ${formatCurrency(campaign.budget_total)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Start Date</Label>
                          <p className="font-medium">
                            {campaign.start_date
                              ? new Date(campaign.start_date).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">End Date</Label>
                          <p className="font-medium">
                            {campaign.end_date
                              ? new Date(campaign.end_date).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Button
                    onClick={() => setEditingSettings(true)}
                    className="gap-2"
                    disabled={!canEditCampaign}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Settings
                  </Button>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="campaignName">Campaign Name</Label>
                      <Input
                        id="campaignName"
                        value={settingsForm.name}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                        <Label>Objective</Label>
                        <Select
                          value={settingsForm.objective}
                          onValueChange={(value) =>
                            setSettingsForm({
                              ...settingsForm,
                              objective: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select objective" />
                          </SelectTrigger>
                          <SelectContent>
                            {OBJECTIVES.map((objective) => (
                              <SelectItem key={objective} value={objective}>
                                {objective}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Billing Type</Label>
                        <Select
                          value={settingsForm.billing_type}
                          onValueChange={(value) =>
                            setSettingsForm({
                              ...settingsForm,
                              billing_type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BILLING_TYPES.map((billingType) => (
                              <SelectItem key={billingType} value={billingType}>
                                {billingType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bidAmount">Bid Amount</Label>
                        <Input
                          id="bidAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={settingsForm.bid_amount}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              bid_amount: e.target.value === '' ? '' : parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                      <Label htmlFor="budgetTotal">Total Budget ($)</Label>
                      <Input
                        id="budgetTotal"
                        type="number"
                          min="0"
                          step="0.01"
                        value={settingsForm.budget_total}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                              budget_total: e.target.value === '' ? '' : parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={settingsForm.start_date}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              start_date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={settingsForm.end_date}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              end_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleUpdateSettings} className="gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingSettings(false)}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default CampaignDetail;
