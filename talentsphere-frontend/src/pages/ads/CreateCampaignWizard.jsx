/**
 * Create Campaign Wizard - Multi-step form for creating ad campaigns
 * Step 1: Basics (name, objective, budget, billing)
 * Step 2: Targeting (location, audience, interests)
 * Step 3: Creative (ad format, text, image)
 * Step 4: Review & Submit
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Eye,
  Settings,
  CheckCircle,
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
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import adManagerService from '../../services/adManager';
import { toast } from 'sonner';

const CreateCampaignWizard = () => {
  const navigate = useNavigate();

  // Overall wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

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
    setErrors(newErrors);
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
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
      reader.onload = (e) => setImagePreview(e.target?.result);
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

      console.log('Campaign creation response:', campaignResponse);
      const campaignId = campaignResponse.campaign?.id;
      
      if (!campaignId) {
        throw new Error('Campaign created but no ID returned in response');
      }

      // Create creative
      const creativeData = {
        title: formData.headline,
        body_text: formData.bodyText,
        cta_text: formData.ctaButtonText,
        cta_url: formData.destinationUrl,
        ad_format: formData.adFormat,
        is_active: true,
      };

      console.log('Creating creative:', creativeData);
      await adManagerService.createCreative(campaignId, creativeData);
      console.log('Creative created successfully');

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
          console.log('Submitting campaign', campaignId, 'for review');
          await adManagerService.submitCampaign(campaignId);
          toast.success('Campaign submitted for review! Admin will review it shortly.');
        } catch (submitError) {
          console.error('Submit for review failed:', submitError);
          throw new Error(`Failed to submit for review: ${submitError.message || submitError}`);
        }
      } else {
        toast.success('Campaign saved as draft!');
      }

      navigate(`/employer/ads/${campaignId}`);
    } catch (error) {
      console.error('Campaign operation failed:', error);
      const errorMsg = error?.message || error?.error || 'Failed to create campaign';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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

  // Steps indicator
  const StepIndicator = () => (
    <div className="flex justify-between mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex flex-col items-center flex-1">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              s < step
                ? 'bg-primary text-primary-foreground'
                : s === step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {s < step && <CheckCircle className="w-5 h-5" />}
            {s >= step && s}
          </div>
          <p className="text-xs font-medium mt-2">
            {['Basics', 'Targeting', 'Creative', 'Review'][s - 1]}
          </p>
          {s < 4 && <div className={`h-1 w-12 mt-2 ${s < step ? 'bg-primary' : 'bg-secondary'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Ad Campaign</h1>
        <p className="text-muted-foreground mt-1">Set up your first ad campaign in 4 easy steps</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <StepIndicator />

          {/* STEP 1: Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Campaign Basics
              </h2>

              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Summer Job Posting Campaign"
                  value={formData.campaignName}
                  onChange={(e) => handleInputChange('campaignName', e.target.value)}
                  className={errors.campaignName ? 'border-destructive' : ''}
                />
                {errors.campaignName && (
                  <p className="text-sm text-destructive mt-1">{errors.campaignName}</p>
                )}
              </div>

              <div>
                <Label>Campaign Objective</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {objectives.map((obj) => (
                    <button
                      key={obj.value}
                      onClick={() => handleInputChange('objective', obj.value)}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        formData.objective === obj.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-semibold text-sm">{obj.label}</p>
                      <p className="text-xs text-muted-foreground">{obj.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetType">Billing Type</Label>
                  <Select value={formData.budgetType} onValueChange={(v) => handleInputChange('budgetType', v)}>
                    <SelectTrigger>
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
                  <Label htmlFor="bidAmount">Bid Amount ($)</Label>
                  <Input
                    id="bidAmount"
                    type="number"
                    placeholder="0.50"
                    value={formData.bidAmount}
                    onChange={(e) => handleInputChange('bidAmount', e.target.value)}
                    className={errors.bidAmount ? 'border-destructive' : ''}
                  />
                  {errors.bidAmount && (
                    <p className="text-sm text-destructive mt-1">{errors.bidAmount}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="budgetAmount">Total Budget ($)</Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  placeholder="100.00"
                  value={formData.budgetAmount}
                  onChange={(e) => handleInputChange('budgetAmount', e.target.value)}
                  className={errors.budgetAmount ? 'border-destructive' : ''}
                />
                {errors.budgetAmount && (
                  <p className="text-sm text-destructive mt-1">{errors.budgetAmount}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={errors.startDate ? 'border-destructive' : ''}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-destructive mt-1">{errors.startDate}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={errors.endDate ? 'border-destructive' : ''}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-destructive mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Targeting */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="w-5 h-5" />
                Audience Targeting
              </h2>

              <div>
                <Label>Audience Type</Label>
                <ToggleGroup
                  type="single"
                  value={formData.audienceType}
                  onValueChange={(v) => v && handleInputChange('audienceType', v)}
                  className="justify-start mt-2"
                >
                  <ToggleGroupItem value="all">All Users</ToggleGroupItem>
                  <ToggleGroupItem value="jobseekers">Jobseekers Only</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div>
                <Label>Locations (Rwanda)</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {rwandaDistricts.map((district) => (
                    <label key={district} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.locations.includes(district)}
                        onCheckedChange={() => handleLocationToggle(district)}
                      />
                      <span className="text-sm">{district}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Job Categories</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {jobCategories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.jobCategories.includes(category)}
                        onCheckedChange={() => handleJobCategoryToggle(category)}
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Keywords</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add keyword"
                    value={formData.keywordInput}
                    onChange={(e) => handleInputChange('keywordInput', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <Button onClick={handleAddKeyword} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.keywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary">
                      {keyword}
                      <button
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
              </div>
            </div>
          )}

          {/* STEP 3: Creative */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Create Ad Creative
              </h2>

              <div>
                <Label>Ad Format</Label>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {adFormats.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => handleInputChange('adFormat', format.value)}
                      className={`p-3 rounded-lg border-2 text-center transition ${
                        formData.adFormat === format.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="text-xl mb-1">{format.icon}</p>
                      <p className="text-xs font-medium">{format.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="headline">Headline ({formData.headline.length}/80)</Label>
                <Input
                  id="headline"
                  placeholder="Attention-grabbing headline"
                  value={formData.headline}
                  onChange={(e) => handleInputChange('headline', e.target.value)}
                  maxLength="80"
                  className={errors.headline ? 'border-destructive' : ''}
                />
                {errors.headline && (
                  <p className="text-sm text-destructive mt-1">{errors.headline}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bodyText">Body Text ({formData.bodyText.length}/200)</Label>
                <Textarea
                  id="bodyText"
                  placeholder="Compelling ad copy"
                  value={formData.bodyText}
                  onChange={(e) => handleInputChange('bodyText', e.target.value)}
                  maxLength="200"
                  rows={4}
                  className={errors.bodyText ? 'border-destructive' : ''}
                />
                {errors.bodyText && (
                  <p className="text-sm text-destructive mt-1">{errors.bodyText}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ctaButtonText">Call-to-Action</Label>
                  <Select value={formData.ctaButtonText} onValueChange={(v) => handleInputChange('ctaButtonText', v)}>
                    <SelectTrigger>
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
                  <Label htmlFor="destinationUrl">Destination URL</Label>
                  <Input
                    id="destinationUrl"
                    placeholder="https://example.com"
                    value={formData.destinationUrl}
                    onChange={(e) => handleInputChange('destinationUrl', e.target.value)}
                    className={errors.destinationUrl ? 'border-destructive' : ''}
                  />
                  {errors.destinationUrl && (
                    <p className="text-sm text-destructive mt-1">{errors.destinationUrl}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Ad Image (Optional)</Label>
                <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition">
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 2MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-w-sm h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Review Your Campaign
              </h2>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Review your campaign details below. You can edit any section by going back to the previous steps.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  How to Publish Your Campaign
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">1</div>
                    <div>
                      <p className="font-medium">Save as Draft</p>
                      <p className="text-blue-700">Save your campaign and edit it later. You can publish it anytime.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">2</div>
                    <div>
                      <p className="font-medium">Request Review</p>
                      <p className="text-blue-700">Submit your campaign for admin approval. Once approved, it will go live automatically.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Campaign Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Campaign Name</p>
                      <p className="font-medium">{formData.campaignName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Objective</p>
                      <p className="font-medium">{formData.objective}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">${formData.budgetAmount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Billing Type</p>
                      <p className="font-medium">{formData.budgetType}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Targeting</h3>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="text-muted-foreground">Audience:</span>{' '}
                      <span className="font-medium capitalize">{formData.audienceType}</span>
                    </p>
                    {formData.locations.length > 0 && (
                      <p>
                        <span className="text-muted-foreground">Locations:</span>{' '}
                        <span className="font-medium">{formData.locations.join(', ')}</span>
                      </p>
                    )}
                    {formData.jobCategories.length > 0 && (
                      <p>
                        <span className="text-muted-foreground">Categories:</span>{' '}
                        <span className="font-medium">{formData.jobCategories.join(', ')}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Ad Creative Preview</h3>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="text-muted-foreground">Format:</span>{' '}
                      <span className="font-medium">{formData.adFormat}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Headline:</span>{' '}
                      <span className="font-medium">{formData.headline}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Body:</span>{' '}
                      <span className="font-medium">{formData.bodyText}</span>
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Estimated reach: <strong>1,200–4,500 impressions/day</strong> (based on your targeting and bid)
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              onClick={handlePrevStep}
              variant="outline"
              disabled={step === 1 || loading}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {step === 4 ? (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                  variant="outline"
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  onClick={() => handleSubmit('review')}
                  disabled={loading}
                  className="gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Submitting...' : 'Request Review'}
                </Button>
              </div>
            ) : (
              <Button onClick={handleNextStep} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCampaignWizard;
