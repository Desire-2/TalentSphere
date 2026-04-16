/**
 * Create Campaign Wizard - Multi-step form for creating ad campaigns
 * Step 1: Basics (name, objective, budget, billing)
 * Step 2: Targeting (location, audience, interests)
 * Step 3: Creative (ad format, text, image)
 * Step 4: Review & Submit
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Eye,
  Settings,
  CheckCircle,
  Sparkles,
  CalendarDays,
  Wallet,
  LayoutTemplate,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  Send,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import adManagerService from '../../services/adManager';
import apiService from '../../services/api';
import { toast } from 'sonner';

const isValidHttpUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const extractErrorMessage = (error, fallback = 'Request failed') => {
  return error?.error || error?.message || fallback;
};

const normalizeFormats = (placement) => {
  const raw = placement?.allowed_formats;

  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim().toUpperCase()).filter(Boolean);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim().toUpperCase()).filter(Boolean);
      }
    } catch {
      // Fall through to CSV-style split.
    }

    return trimmed
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((v) => v.replace(/["']/g, '').trim().toUpperCase())
      .filter(Boolean);
  }

  return [];
};

const placementSupportsFormat = (placement, format) => {
  const expected = String(format || '').trim().toUpperCase();
  return normalizeFormats(placement).includes(expected);
};

const CreateCampaignWizard = () => {
  const navigate = useNavigate();

  // Overall wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [availablePlacements, setAvailablePlacements] = useState([]);
  const [selectedPlacementIds, setSelectedPlacementIds] = useState([]);
  const [loadingPlacements, setLoadingPlacements] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basics
    campaignName: '',
    objective: 'AWARENESS',
    budgetType: 'CPM',
    budgetAmount: '',
    bidAmount: '',
    startDate: '',
    endDate: '',

    // Step 2: Targeting
    locations: [],
    audienceType: 'all',
    jobCategories: [],
    keywords: [],
    keywordInput: '',

    // Step 3: Creative
    adFormat: 'BANNER_HORIZONTAL',
    headline: '',
    bodyText: '',
    ctaButtonText: 'Learn More',
    destinationUrl: '',
    image: null,

    // Step 4: Review - auto-filled
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  const objectives = [
    { value: 'AWARENESS', label: 'Awareness', description: 'Build brand recognition' },
    { value: 'TRAFFIC', label: 'Traffic', description: 'Drive clicks to your site' },
    { value: 'ENGAGEMENT', label: 'Engagement', description: 'Increase interactions' },
    { value: 'LEADS', label: 'Leads', description: 'Collect leads' },
  ];

  const adFormats = [
    { value: 'BANNER_HORIZONTAL', label: 'Horizontal Banner', icon: '▭' },
    { value: 'BANNER_VERTICAL', label: 'Vertical Banner', icon: '▮' },
    { value: 'CARD', label: 'Card', icon: '⬜' },
    { value: 'INLINE_FEED', label: 'Inline Feed', icon: '☰' },
    { value: 'SPONSORED_JOB', label: 'Sponsored Job', icon: '▤' },
    { value: 'SPOTLIGHT', label: 'Spotlight', icon: '★' },
  ];

  const rwandaDistricts = [
    'Kigali',
    'Gasabo',
    'Kicukiro',
    'Nyarugenge',
    'South Province',
    'West Province',
    'North Province',
    'East Province',
  ];

  const jobCategories = [
    'Technology',
    'Finance',
    'Healthcare',
    'Marketing',
    'Sales',
    'Operations',
    'Education',
  ];

  const ctaOptions = [
    'Learn More',
    'Apply Now',
    'Shop Now',
    'Contact Us',
    'Visit Website',
    'Sign Up',
  ];

  const stepConfig = [
    { id: 1, label: 'Basics', icon: Settings },
    { id: 2, label: 'Targeting', icon: Target },
    { id: 3, label: 'Creative', icon: Eye },
    { id: 4, label: 'Review', icon: CheckCircle },
  ];

  const compatiblePlacements = availablePlacements.filter((placement) =>
    placementSupportsFormat(placement, formData.adFormat)
  );

  const loadPlacements = useCallback(async () => {
    try {
      setLoadingPlacements(true);
      let response;

      if (typeof adManagerService?.listPlacements === 'function') {
        response = await adManagerService.listPlacements();
      } else if (typeof adManagerService?.getPlacements === 'function') {
        response = await adManagerService.getPlacements();
      } else {
        // Last-resort fallback if a stale service module is loaded in the browser cache.
        response = await apiService.get('/ads/placements');
      }

      const placements = response?.placements || [];
      setAvailablePlacements(placements);
      const defaults = placements
        .filter((placement) => placementSupportsFormat(placement, formData.adFormat))
        .slice(0, 2)
        .map((placement) => placement.id);
      setSelectedPlacementIds(defaults);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load ad placements'));
      setAvailablePlacements([]);
    } finally {
      setLoadingPlacements(false);
    }
  }, [formData.adFormat]);

  useEffect(() => {
    loadPlacements();
  }, [loadPlacements]);

  useEffect(() => {
    const compatiblePlacementIds = new Set(compatiblePlacements.map((p) => p.id));
    const filteredSelected = selectedPlacementIds.filter((id) => compatiblePlacementIds.has(id));
    if (filteredSelected.length !== selectedPlacementIds.length) {
      setSelectedPlacementIds(filteredSelected);
    }
  }, [compatiblePlacements, selectedPlacementIds]);

  useEffect(() => {
    if (selectedPlacementIds.length === 0 && compatiblePlacements.length > 0) {
      setSelectedPlacementIds(compatiblePlacements.slice(0, 2).map((placement) => placement.id));
    }
  }, [compatiblePlacements, selectedPlacementIds.length]);

  // Step 1: Validate basics
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.campaignName.trim()) newErrors.campaignName = 'Campaign name is required';
    if (!formData.budgetAmount) newErrors.budgetAmount = 'Budget is required';
    if (!formData.bidAmount) newErrors.bidAmount = 'Bid amount is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (parseFloat(formData.budgetAmount || '0') <= 0) {
      newErrors.budgetAmount = 'Budget must be greater than 0';
    }
    if (parseFloat(formData.bidAmount || '0') <= 0) {
      newErrors.bidAmount = 'Bid amount must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (selectedPlacementIds.length === 0) {
      newErrors.placements = 'Select at least one placement to run this campaign';
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Step 3: Validate creative
  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.headline.trim()) newErrors.headline = 'Headline is required';
    if (formData.headline.length > 80) newErrors.headline = 'Headline max 80 characters';
    if (!formData.bodyText.trim()) newErrors.bodyText = 'Body text is required';
    if (formData.bodyText.length > 200) newErrors.bodyText = 'Body text max 200 characters';
    if (!formData.destinationUrl.trim()) newErrors.destinationUrl = 'Destination URL is required';
    if (formData.destinationUrl && !isValidHttpUrl(formData.destinationUrl.trim())) {
      newErrors.destinationUrl = 'Destination URL must be a valid absolute http(s) URL';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      handleInputChange('image', file);
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddKeyword = () => {
    if (formData.keywordInput.trim()) {
      handleInputChange('keywords', [
        ...formData.keywords,
        formData.keywordInput.trim(),
      ]);
      handleInputChange('keywordInput', '');
    }
  };

  const handleLocationToggle = (location) => {
    const updated = formData.locations.includes(location)
      ? formData.locations.filter((l) => l !== location)
      : [...formData.locations, location];
    handleInputChange('locations', updated);
  };

  const handleJobCategoryToggle = (category) => {
    const updated = formData.jobCategories.includes(category)
      ? formData.jobCategories.filter((c) => c !== category)
      : [...formData.jobCategories, category];
    handleInputChange('jobCategories', updated);
  };

  const handlePlacementToggle = (placementId) => {
    const updated = selectedPlacementIds.includes(placementId)
      ? selectedPlacementIds.filter((id) => id !== placementId)
      : [...selectedPlacementIds, placementId];
    setSelectedPlacementIds(updated);
    if (errors.placements) {
      const nextErrors = { ...errors };
      delete nextErrors.placements;
      setErrors(nextErrors);
    }
  };

  const handleSubmit = async (submitFor = 'draft') => {
    try {
      setLoading(true);

      // Create campaign
      const campaignResponse = await adManagerService.createCampaign({
        name: formData.campaignName,
        objective: formData.objective,
        budget_total: parseFloat(formData.budgetAmount),
        billing_type: formData.budgetType,
        bid_amount: parseFloat(formData.bidAmount),
        start_date: formData.startDate,
        end_date: formData.endDate,
        targeting: {
          locations: formData.locations,
          user_type: formData.audienceType,
          job_categories: formData.jobCategories,
          keywords: formData.keywords,
        },
      });
      const campaignId = campaignResponse.campaign?.id;

      if (!campaignId) {
        throw new Error('Campaign created but no ID returned in response');
      }

      const placementIdsToUse = selectedPlacementIds.length > 0
        ? selectedPlacementIds
        : compatiblePlacements.slice(0, 2).map((placement) => placement.id);

      if (placementIdsToUse.length === 0) {
        throw new Error(`No compatible placements available for format ${formData.adFormat}`);
      }

      // Assign placements before creating creatives to match backend creative format validation.
      await adManagerService.updateCampaignPlacements(campaignId, placementIdsToUse);

      // Create creative
      const creativeData = {
        title: formData.headline,
        body_text: formData.bodyText,
        cta_text: formData.ctaButtonText,
        cta_url: formData.destinationUrl,
        ad_format: formData.adFormat,
        is_active: true,
      };
      await adManagerService.createCreative(campaignId, creativeData, formData.image);

      // Set targeting
      await adManagerService.setTargeting(campaignId, {
        locations: formData.locations,
        user_type: formData.audienceType,
        job_categories: formData.jobCategories,
        keywords: formData.keywords,
      });

      // If submitting for review, call the submit endpoint
      if (submitFor === 'review') {
        try {
          await adManagerService.submitCampaign(campaignId);
          toast.success('Campaign submitted for review! Admin will review it shortly.');
        } catch (submitError) {
          throw new Error(`Failed to submit for review: ${extractErrorMessage(submitError)}`);
        }
      } else {
        toast.success('Campaign saved as draft!');
      }

      navigate(`/employer/ads/${campaignId}`);
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Failed to create campaign');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = Math.round((step / stepConfig.length) * 100);

  const StepIndicator = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-100">Step {step} of {stepConfig.length}</span>
        <span className="font-semibold text-[#1BA398]">{progressPercentage}% complete</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#1BA398] to-[#FF6B35] motion-safe:transition-all motion-safe:duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stepConfig.map((s, index) => {
          const Icon = s.icon;
          const isComplete = s.id < step;
          const isActive = s.id === step;

          return (
            <div key={s.id} className="flex min-w-[142px] flex-1 items-center gap-2">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 motion-safe:transition-all motion-safe:duration-300 ${
                  isComplete || isActive
                    ? 'border-[#001F3F] bg-gradient-to-br from-[#001F3F] to-[#0a2847] text-slate-100'
                    : 'border-[#1b4f86] bg-[#123f6e]/70 text-slate-300'
                }`}
              >
                {isComplete ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>

              <div className="min-w-0">
                <p className={`truncate text-xs font-semibold ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>
                  {s.label}
                </p>
                <p className="text-[11px] text-slate-300/90">
                  {isComplete ? 'Completed' : isActive ? 'In progress' : 'Pending'}
                </p>
              </div>

              {index < stepConfig.length - 1 && (
                <div className={`hidden h-0.5 flex-1 rounded-full md:block ${isComplete ? 'bg-[#1BA398]' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const brandPrimaryButtonClass = 'bg-gradient-to-r from-[#1BA398] to-[#FF6B35] text-slate-100 hover:from-[#158b7e] hover:to-[#e55a24]';
  const brandOutlineButtonClass = 'border-[#1BA398]/50 text-[#1BA398] hover:bg-[#1BA398]/15 hover:text-slate-100';
  const brandSecondaryBadgeClass = 'border border-[#1b4f86] bg-[#123f6e]/70 text-slate-200';

  return (
    <div
      className="min-h-full px-3 py-5 sm:px-6 sm:py-8 lg:px-8"
      style={{
        backgroundColor: '#002a5a',
        backgroundImage:
          'radial-gradient(circle at center, rgba(18, 63, 110, 0.45) 0, rgba(18, 63, 110, 0.45) 18px, transparent 20px)',
        backgroundSize: '74px 74px',
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-[#1b4f86] bg-[#002a5a]/92 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-5 bg-gradient-to-r from-[#001F3F] via-[#0a2847] to-[#1BA398] px-5 py-6 text-slate-100 sm:px-7 sm:py-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit border-[#1BA398]/40 bg-[#1BA398]/20 text-slate-100 backdrop-blur-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Campaign Builder
              </Badge>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Ad Campaign</h1>
                <p className="mt-1 text-sm text-slate-200 sm:text-base">
                  Launch your campaign in minutes with guided targeting and creative setup.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs sm:text-sm">
              <div className="rounded-xl bg-[#001F3F]/35 px-3 py-2 backdrop-blur motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-0.5">
                <p className="font-semibold">{formData.startDate || 'Not set'}</p>
                <p className="mt-1 text-slate-300">Start</p>
              </div>
              <div className="rounded-xl bg-[#001F3F]/35 px-3 py-2 backdrop-blur motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-0.5">
                <p className="font-semibold">${formData.budgetAmount || '0'}</p>
                <p className="mt-1 text-slate-300">Budget</p>
              </div>
              <div className="rounded-xl bg-[#001F3F]/35 px-3 py-2 backdrop-blur motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-0.5">
                <p className="font-semibold">{selectedPlacementIds.length}</p>
                <p className="mt-1 text-slate-300">Placements</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <Card
            className="lg:col-span-8 xl:col-span-9 shadow-sm ring-1 ring-black/5 border-[#123f6e]/80 overflow-hidden"
            style={{
              backgroundColor: '#002a5a',
              backgroundImage:
                'radial-gradient(circle at center, rgba(18, 63, 110, 0.4) 0, rgba(18, 63, 110, 0.4) 18px, transparent 20px)',
              backgroundSize: '74px 74px',
            }}
          >
            <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#002a5a]/86 text-slate-100">
              <StepIndicator />

              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Campaign Basics
                  </h2>

                  <div className="rounded-xl border border-[#1b4f86] bg-[#0a335f]/70 p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <Label htmlFor="campaignName" className="text-slate-100">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Summer Job Posting Campaign"
                      value={formData.campaignName}
                      onChange={(e) => handleInputChange('campaignName', e.target.value)}
                      className={`mt-2 ${errors.campaignName ? 'border-destructive' : ''}`}
                    />
                    {errors.campaignName && (
                      <p className="text-sm text-destructive mt-1">{errors.campaignName}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-100">Campaign Objective</Label>
                    <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
                      {objectives.map((obj) => (
                        <button
                          key={obj.value}
                          type="button"
                          onClick={() => handleInputChange('objective', obj.value)}
                          className={`rounded-xl border-2 p-4 text-left motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1BA398]/40 ${
                            formData.objective === obj.value
                              ? 'border-[#1BA398] bg-gradient-to-r from-[#1BA398]/12 to-[#FF6B35]/12 shadow-sm'
                              : 'border-[#1b4f86] bg-[#123f6e]/45 hover:border-[#1BA398]/50'
                          }`}
                        >
                          <p className="font-semibold text-sm">{obj.label}</p>
                          <p className="text-xs text-slate-300 mt-1">{obj.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="budgetType" className="text-slate-100">Billing Type</Label>
                      <Select value={formData.budgetType} onValueChange={(v) => handleInputChange('budgetType', v)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CPM">CPM (Cost Per 1K Impressions)</SelectItem>
                          <SelectItem value="CPC">CPC (Cost Per Click)</SelectItem>
                          <SelectItem value="FLAT_RATE">Flat Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bidAmount" className="text-slate-100">Bid Amount ($)</Label>
                      <Input
                        id="bidAmount"
                        type="number"
                        placeholder="0.50"
                        value={formData.bidAmount}
                        onChange={(e) => handleInputChange('bidAmount', e.target.value)}
                        className={`mt-2 ${errors.bidAmount ? 'border-destructive' : ''}`}
                      />
                      {errors.bidAmount && (
                        <p className="text-sm text-destructive mt-1">{errors.bidAmount}</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#1b4f86] bg-[#0a335f]/70 p-4 sm:p-5">
                    <Label htmlFor="budgetAmount" className="text-slate-100">Total Budget ($)</Label>
                    <Input
                      id="budgetAmount"
                      type="number"
                      placeholder="100.00"
                      value={formData.budgetAmount}
                      onChange={(e) => handleInputChange('budgetAmount', e.target.value)}
                      className={`mt-2 ${errors.budgetAmount ? 'border-destructive' : ''}`}
                    />
                    {errors.budgetAmount && (
                      <p className="text-sm text-destructive mt-1">{errors.budgetAmount}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="startDate" className="text-slate-100">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className={`mt-2 ${errors.startDate ? 'border-destructive' : ''}`}
                      />
                      {errors.startDate && (
                        <p className="text-sm text-destructive mt-1">{errors.startDate}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="endDate" className="text-slate-100">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className={`mt-2 ${errors.endDate ? 'border-destructive' : ''}`}
                      />
                      {errors.endDate && (
                        <p className="text-sm text-destructive mt-1">{errors.endDate}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Audience Targeting
                  </h2>

                  <div>
                    <Label className="text-slate-100">Audience Type</Label>
                    <ToggleGroup
                      type="single"
                      value={formData.audienceType}
                      onValueChange={(v) => v && handleInputChange('audienceType', v)}
                      className="mt-2 grid w-full grid-cols-1 justify-start gap-2 sm:inline-flex sm:w-auto"
                    >
                      <ToggleGroupItem value="all">All Users</ToggleGroupItem>
                      <ToggleGroupItem value="jobseekers">Jobseekers Only</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="rounded-xl border border-[#1b4f86] bg-[#0a335f]/70 p-4 sm:p-5">
                      <Label className="text-slate-100">Locations (Rwanda)</Label>
                      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
                        {rwandaDistricts.map((district) => (
                          <label key={district} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 motion-safe:transition-colors hover:bg-accent/40">
                            <Checkbox
                              checked={formData.locations.includes(district)}
                              onCheckedChange={() => handleLocationToggle(district)}
                            />
                            <span className="text-sm text-slate-100">{district}</span>
                          </label>
                        ))}
                      </div>
                      {formData.locations.length === 0 && (
                        <p className="mt-3 text-xs text-slate-300 border border-dashed border-[#2b5f92] rounded-lg px-3 py-2 bg-[#123f6e]/50">
                          No locations selected yet. Leave empty to target broadly.
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-[#1b4f86] bg-[#0a335f]/70 p-4 sm:p-5">
                      <Label className="text-slate-100">Job Categories</Label>
                      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
                        {jobCategories.map((category) => (
                          <label key={category} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 motion-safe:transition-colors hover:bg-accent/40">
                            <Checkbox
                              checked={formData.jobCategories.includes(category)}
                              onCheckedChange={() => handleJobCategoryToggle(category)}
                            />
                            <span className="text-sm text-slate-100">{category}</span>
                          </label>
                        ))}
                      </div>
                      {formData.jobCategories.length === 0 && (
                        <p className="mt-3 text-xs text-slate-300 border border-dashed border-[#2b5f92] rounded-lg px-3 py-2 bg-[#123f6e]/50">
                          No categories selected yet. Your ad can match multiple interests.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-100">Ad Placements</Label>
                    <p className="text-xs text-slate-300 mt-1">
                      Select where this campaign can appear. Only placements compatible with {formData.adFormat} are shown.
                    </p>

                    {loadingPlacements ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[1, 2, 3, 4].map((item) => (
                          <div key={item} className="rounded-xl border p-3">
                            <div className="h-4 w-1/2 rounded bg-[#2b5f92]/80 animate-pulse" />
                            <div className="mt-2 h-3 w-5/6 rounded bg-[#2b5f92]/80 animate-pulse" />
                            <div className="mt-2 h-3 w-1/3 rounded bg-[#2b5f92]/80 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : compatiblePlacements.length === 0 ? (
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No active placements currently support {formData.adFormat}. Pick another format or ask admin to enable matching placements.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
                        {compatiblePlacements.map((placement) => (
                          <label
                            key={placement.id}
                            className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer motion-safe:transition-all motion-safe:duration-200 hover:border-[#1BA398]/40 hover:bg-gradient-to-r hover:from-[#1BA398]/8 hover:to-[#FF6B35]/8 hover:-translate-y-0.5"
                          >
                            <Checkbox
                              checked={selectedPlacementIds.includes(placement.id)}
                              onCheckedChange={() => handlePlacementToggle(placement.id)}
                            />
                            <div className="space-y-1 min-w-0">
                              <p className="text-sm font-medium truncate">{placement.display_name || placement.name}</p>
                              <p className="text-xs text-slate-300">
                                {placement.description || placement.placement_key}
                              </p>
                              <p className="text-xs text-slate-300">
                                Context: {placement.page_context || 'ALL'}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {errors.placements && (
                      <p className="text-sm text-destructive mt-2">{errors.placements}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#1b4f86] bg-[#0a335f]/70 p-4 sm:p-5">
                    <Label className="text-slate-100">Keywords</Label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="Add keyword"
                        value={formData.keywordInput}
                        onChange={(e) => handleInputChange('keywordInput', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                      />
                      <Button onClick={handleAddKeyword} variant="outline" className={`w-full sm:w-auto ${brandOutlineButtonClass}`}>
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.keywords.map((keyword, i) => (
                        <Badge key={i} variant="secondary" className={`px-2.5 py-1 motion-safe:transition-colors hover:bg-[#123f6e]/85 ${brandSecondaryBadgeClass}`}>
                          {keyword}
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                'keywords',
                                formData.keywords.filter((_, idx) => idx !== i)
                              )
                            }
                            className="ml-1"
                          >
                            ✕
                          </button>
                        </Badge>
                      ))}
                    </div>
                    {formData.keywords.length === 0 && (
                      <p className="mt-3 text-xs text-slate-300 border border-dashed border-[#2b5f92] rounded-lg px-3 py-2 bg-[#123f6e]/50">
                        Add optional keywords to improve relevance and ad matching quality.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Create Ad Creative
                  </h2>

                  <div>
                    <Label className="text-slate-100">Ad Format</Label>
                    <div className="grid grid-cols-2 gap-3 mt-3 lg:grid-cols-3">
                      {adFormats.map((format) => (
                        <button
                          key={format.value}
                          type="button"
                          onClick={() => handleInputChange('adFormat', format.value)}
                          className={`rounded-xl border-2 p-3 text-center motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1BA398]/40 ${
                            formData.adFormat === format.value
                              ? 'border-[#1BA398] bg-gradient-to-r from-[#1BA398]/12 to-[#FF6B35]/12 shadow-sm'
                              : 'border-border hover:border-[#1BA398]/50'
                          }`}
                        >
                          <p className="text-xl mb-1">{format.icon}</p>
                          <p className="text-xs font-medium leading-tight">{format.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#1b4f86] bg-[#0a335f]/70 p-4 sm:p-5 space-y-4">
                    <div>
                      <Label htmlFor="headline" className="text-slate-100">Headline ({formData.headline.length}/80)</Label>
                      <Input
                        id="headline"
                        placeholder="Attention-grabbing headline"
                        value={formData.headline}
                        onChange={(e) => handleInputChange('headline', e.target.value)}
                        maxLength="80"
                        className={`mt-2 ${errors.headline ? 'border-destructive' : ''}`}
                      />
                      {errors.headline && (
                        <p className="text-sm text-destructive mt-1">{errors.headline}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="bodyText" className="text-slate-100">Body Text ({formData.bodyText.length}/200)</Label>
                      <Textarea
                        id="bodyText"
                        placeholder="Compelling ad copy"
                        value={formData.bodyText}
                        onChange={(e) => handleInputChange('bodyText', e.target.value)}
                        maxLength="200"
                        rows={4}
                        className={`mt-2 ${errors.bodyText ? 'border-destructive' : ''}`}
                      />
                      {errors.bodyText && (
                        <p className="text-sm text-destructive mt-1">{errors.bodyText}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="ctaButtonText" className="text-slate-100">Call-to-Action</Label>
                        <Select value={formData.ctaButtonText} onValueChange={(v) => handleInputChange('ctaButtonText', v)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ctaOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="destinationUrl" className="text-slate-100">Destination URL</Label>
                        <Input
                          id="destinationUrl"
                          placeholder="https://example.com"
                          value={formData.destinationUrl}
                          onChange={(e) => handleInputChange('destinationUrl', e.target.value)}
                          className={`mt-2 ${errors.destinationUrl ? 'border-destructive' : ''}`}
                        />
                        {errors.destinationUrl && (
                          <p className="text-sm text-destructive mt-1">{errors.destinationUrl}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-100">Ad Image (Optional)</Label>
                    <label className="mt-2 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 motion-safe:transition-all motion-safe:duration-200 hover:bg-[#1BA398]/10 hover:border-[#1BA398]/40">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2 text-center">
                        <Upload className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-300">PNG, JPG, WebP up to 2MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>

                    {imagePreview && (
                      <div className="mt-4 overflow-hidden rounded-xl border shadow-sm">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-h-[320px] object-cover motion-safe:transition-transform motion-safe:duration-500 hover:scale-[1.01]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Review Your Campaign
                  </h2>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Review your campaign details below. You can edit any section by going back to the previous steps.
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-xl border border-[#1BA398]/30 bg-gradient-to-r from-[#1BA398]/10 to-[#FF6B35]/10 p-4">
                    <h3 className="font-semibold text-[#001F3F] mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      How to Publish Your Campaign
                    </h3>
                    <div className="space-y-2 text-sm text-[#0a2847]">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#001F3F] text-slate-100 flex items-center justify-center text-xs font-semibold">1</div>
                        <div>
                          <p className="font-medium">Save as Draft</p>
                          <p className="text-[#0a2847]">Save your campaign and edit it later. You can publish it anytime.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF6B35] text-slate-100 flex items-center justify-center text-xs font-semibold">2</div>
                        <div>
                          <p className="font-medium">Request Review</p>
                          <p className="text-[#0a2847]">Submit your campaign for admin approval. Once approved, it will go live automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#0a335f]/70 border border-[#1b4f86] p-4 rounded-lg">
                      <h3 className="font-semibold mb-3">Campaign Details</h3>
                      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-slate-300">Campaign Name</p>
                          <p className="font-medium break-words">{formData.campaignName}</p>
                        </div>
                        <div>
                          <p className="text-slate-300">Objective</p>
                          <p className="font-medium">{formData.objective}</p>
                        </div>
                        <div>
                          <p className="text-slate-300">Budget</p>
                          <p className="font-medium">${formData.budgetAmount}</p>
                        </div>
                        <div>
                          <p className="text-slate-300">Billing Type</p>
                          <p className="font-medium">{formData.budgetType}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0a335f]/70 border border-[#1b4f86] p-4 rounded-lg">
                      <h3 className="font-semibold mb-3">Targeting</h3>
                      <div className="text-sm space-y-2">
                        <p>
                          <span className="text-slate-300">Audience:</span>{' '}
                          <span className="font-medium capitalize">{formData.audienceType}</span>
                        </p>
                        {formData.locations.length > 0 && (
                          <p>
                            <span className="text-slate-300">Locations:</span>{' '}
                            <span className="font-medium">{formData.locations.join(', ')}</span>
                          </p>
                        )}
                        {formData.jobCategories.length > 0 && (
                          <p>
                            <span className="text-slate-300">Categories:</span>{' '}
                            <span className="font-medium">{formData.jobCategories.join(', ')}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#0a335f]/70 border border-[#1b4f86] p-4 rounded-lg">
                      <h3 className="font-semibold mb-3">Ad Creative Preview</h3>
                      <div className="text-sm space-y-2">
                        <p>
                          <span className="text-slate-300">Format:</span>{' '}
                          <span className="font-medium">{formData.adFormat}</span>
                        </p>
                        <p>
                          <span className="text-slate-300">Headline:</span>{' '}
                          <span className="font-medium">{formData.headline}</span>
                        </p>
                        <p>
                          <span className="text-slate-300">Body:</span>{' '}
                          <span className="font-medium">{formData.bodyText}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#0a335f]/70 border border-[#1b4f86] p-4 rounded-lg">
                      <h3 className="font-semibold mb-3">Placements</h3>
                      {selectedPlacementIds.length > 0 ? (
                        <p className="text-sm font-medium">
                          {selectedPlacementIds
                            .map((id) =>
                              availablePlacements.find((placement) => placement.id === id)?.display_name || id
                            )
                            .join(', ')}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-300">No placements selected</p>
                      )}
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Estimated reach: <strong>1,200-4,500 impressions/day</strong> (based on your targeting and bid)
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}

              <div className="mt-8 border-t pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    disabled={step === 1 || loading}
                    className={`gap-2 w-full sm:w-auto ${brandOutlineButtonClass}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {step === 4 ? (
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                      <Button
                        onClick={() => handleSubmit('draft')}
                        disabled={loading}
                        variant="outline"
                        className={`gap-2 w-full sm:w-auto ${brandOutlineButtonClass}`}
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save as Draft'}
                      </Button>

                      <Button
                        onClick={() => handleSubmit('review')}
                        disabled={loading}
                        className={`gap-2 w-full sm:w-auto ${brandPrimaryButtonClass}`}
                      >
                        <Send className="w-4 h-4" />
                        {loading ? 'Submitting...' : 'Request Review'}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleNextStep} className={`gap-2 w-full sm:w-auto ${brandPrimaryButtonClass}`}>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hidden border-dashed border-[#1b4f86] lg:col-span-4 lg:block xl:col-span-3 lg:sticky lg:top-6 lg:h-fit shadow-sm ring-1 ring-black/5 bg-[#002a5a]/92"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-100">Live Campaign Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-100">
              <div className="rounded-lg bg-[#123f6e]/60 p-3 motion-safe:transition-colors hover:bg-[#123f6e]/80">
                <p className="text-xs uppercase tracking-wide text-slate-300">Campaign</p>
                <p className="mt-1 font-semibold break-words">{formData.campaignName || 'Untitled campaign'}</p>
                <Badge variant="secondary" className={`mt-2 ${brandSecondaryBadgeClass}`}>{formData.objective}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 text-slate-300" />
                  <div>
                    <p className="text-xs text-slate-300">Budget and Bid</p>
                    <p className="font-medium">${formData.budgetAmount || '0'} total - ${formData.bidAmount || '0'} bid</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-slate-300" />
                  <div>
                    <p className="text-xs text-slate-300">Schedule</p>
                    <p className="font-medium">
                      {formData.startDate || 'Start not set'} - {formData.endDate || 'End not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <LayoutTemplate className="mt-0.5 h-4 w-4 text-slate-300" />
                  <div>
                    <p className="text-xs text-slate-300">Ad Format</p>
                    <p className="font-medium">{formData.adFormat}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#1b4f86] p-3 motion-safe:transition-colors hover:bg-[#123f6e]/60">
                <p className="text-xs uppercase tracking-wide text-slate-300">Placement Coverage</p>
                <p className="mt-1 text-lg font-bold leading-none">{selectedPlacementIds.length}</p>
                <p className="mt-1 text-xs text-slate-300">Selected compatible placements</p>
              </div>

              <div className="rounded-lg border bg-gradient-to-r from-[#1BA398]/10 to-[#FF6B35]/10 p-3 motion-safe:transition-colors hover:from-[#1BA398]/15 hover:to-[#FF6B35]/15">
                <p className="text-xs uppercase tracking-wide text-slate-300">Creative Readiness</p>
                <p className="mt-1 font-medium">
                  {formData.headline && formData.bodyText && formData.destinationUrl
                    ? 'Ready for submission'
                    : 'Add headline, body text and URL'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignWizard;
