/**
 * Campaign Detail Page - View, edit, and manage individual campaign
 * Tabs: Overview (analytics), Creatives, Targeting, Settings
 */

import React, { useState, useEffect } from 'react';
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

const CampaignDetail = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSettings, setEditingSettings] = useState(false);
  const [creatingCreative, setCreatingCreative] = useState(false);

  const [settingsForm, setSettingsForm] = useState({});
  const [creativeForm, setCreativeForm] = useState({
    headline: '',
    bodyText: '',
    ctaButtonText: 'Learn More',
    destinationUrl: '',
    adFormat: 'BANNER_HORIZONTAL',
  });

  const [analytics, setAnalytics] = useState({
    totals: {},
    daily: [],
  });

  const rwandaDistricts = [
    'Kigali', 'Gasabo', 'Kicukiro', 'Nyarugenge',
    'South Province', 'West Province', 'North Province', 'East Province',
  ];

  const jobCategories = [
    'Technology', 'Finance', 'Healthcare', 'Marketing', 'Sales', 'Operations', 'Education',
  ];

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const campaignData = await adManagerService.getCampaign(campaignId);
      setCampaign(campaignData);
      setSettingsForm({
        name: campaignData.name,
        budget_total: campaignData.budget_total,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
      });

      const analyticsData = await adManagerService.getAnalytics(campaignId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCreative = async () => {
    try {
      await adManagerService.createCreative(campaignId, {
        title: creativeForm.headline,
        body_text: creativeForm.bodyText,
        cta_text: creativeForm.ctaButtonText,
        cta_url: creativeForm.destinationUrl,
        ad_format: creativeForm.adFormat,
        is_active: true,
      });
      toast.success('Creative created');
      setCreatingCreative(false);
      setCreativeForm({
        headline: '',
        bodyText: '',
        ctaButtonText: 'Learn More',
        destinationUrl: '',
        adFormat: 'BANNER_HORIZONTAL',
      });
      loadCampaignData();
    } catch (error) {
      toast.error(error?.error || 'Failed to create creative');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await adManagerService.updateCampaign(campaignId, settingsForm);
      toast.success('Campaign updated');
      setEditingSettings(false);
      loadCampaignData();
    } catch (error) {
      toast.error(error?.error || 'Failed to update campaign');
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
      </div>

      {/* Quick Stats */}
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
                ${parseFloat(campaign.budget_spent).toFixed(2)} / ${parseFloat(campaign.budget_total).toFixed(2)}
              </p>
              <div className="w-full h-2 bg-secondary rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${(parseFloat(campaign.budget_spent) / parseFloat(campaign.budget_total)) * 100 || 0}%`,
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
              Targeting
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
            <CampaignAnalyticsPanel campaignId={campaignId} campaignName={campaign.name} />
          </TabsContent>

          {/* Creatives Tab */}
          <TabsContent value="creatives" className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Ad Creatives</h3>
                {!creatingCreative && (
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
                            <SelectItem value="BANNER_HORIZONTAL">Horizontal Banner</SelectItem>
                            <SelectItem value="BANNER_VERTICAL">Vertical Banner</SelectItem>
                            <SelectItem value="CARD">Card</SelectItem>
                            <SelectItem value="INLINE_FEED">Inline Feed</SelectItem>
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
                        <Button variant="ghost" size="sm" className="ml-4">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                <h3 className="font-semibold mb-4">Current Targeting</h3>
                {campaign.targeting ? (
                  <div className="space-y-4">
                    {campaign.targeting.locations?.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Locations</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {campaign.targeting.locations.map((loc) => (
                            <Badge key={loc}>{loc}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {campaign.targeting.job_categories?.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Job Categories</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {campaign.targeting.job_categories.map((cat) => (
                            <Badge key={cat} variant="outline">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No targeting set yet.</p>
                )}
              </div>

              <Button variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Targeting
              </Button>
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
                          ${parseFloat(campaign.budget_total).toFixed(2)}
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
                      <Label htmlFor="budgetTotal">Total Budget ($)</Label>
                      <Input
                        id="budgetTotal"
                        type="number"
                        value={settingsForm.budget_total}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            budget_total: parseFloat(e.target.value),
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
