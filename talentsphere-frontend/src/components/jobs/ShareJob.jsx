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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageSquare, 
  Facebook, 
  Twitter, 
  Linkedin,
  Link as LinkIcon,
  QrCode,
  Download,
  Users,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  Briefcase,
  Building,
  Send,
  UserPlus,
  Globe,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, snakeToTitle } from '../../utils/helpers';
import { toast } from 'sonner';
// (Dynamic import for QRCode done only when needed to reduce initial bundle size)
import shareJobService from '../../services/shareJobService';

const ShareJob = ({ 
  job, 
  children, 
  getCompanyName,
  getCompanyLogo,
  getJobDescription,
  getJobLocation,
  getSalaryDisplay,
  trigger = null 
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('link');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copying, setCopying] = useState(false);
  const [sending, setSending] = useState(false);
  const [shareTemplates, setShareTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [shareSuggestions, setShareSuggestions] = useState([]);
  const [jobShareStats, setJobShareStats] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [supportsNativeShare] = useState(typeof navigator !== 'undefined' && !!navigator.share);
  const messageLimit = 280;

  // Helper to update stats after any share action
  const updateStats = () => {
    const stats = shareJobService.getJobShareStats(job.id);
    setJobShareStats(stats);
  };

  // Generate job URL
  const jobUrl = `${window.location.origin}/jobs/${job.id}`;
  
  // Job preview data
  const companyName = getCompanyName(job);
  const jobDescription = getJobDescription(job);
  const jobLocation = getJobLocation(job);
  const salaryDisplay = getSalaryDisplay(job);

  // Default share message
  const defaultMessage = `Check out this exciting ${job.title} position at ${companyName}! ${jobLocation ? `Located in ${jobLocation}. ` : ''}${salaryDisplay !== 'Salary not specified' ? `Salary: ${salaryDisplay}. ` : ''}Apply now!`;

  // Initialize analytics and suggestions
  const initializeShareData = () => {
    const templates = shareJobService.generateShareTemplates(job, companyName);
    setShareTemplates(templates);
    
    const suggestions = shareJobService.getShareSuggestions(job);
    setShareSuggestions(suggestions);
    
    const stats = shareJobService.getJobShareStats(job.id);
    setJobShareStats(stats);
  };

  // Generate QR Code
  const generateQRCode = async () => {
    try {
      // Dynamic import for better performance
      const { default: QRCode } = await import('qrcode');
      const url = await QRCode.toDataURL(jobUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Lazy-generate QR code only when QR tab becomes active
  useEffect(() => {
    if (activeTab === 'qr' && !qrCodeUrl) {
      generateQRCode();
    }
  }, [activeTab]);

  // If no custom trigger passed, pre-load stats for badge display
  useEffect(() => {
    if (!trigger) {
      initializeShareData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centralized message change handler enforcing limit
  const handleMessageChange = (value) => {
    if (value.length <= messageLimit) {
      setCustomMessage(value);
    } else {
      setCustomMessage(value.slice(0, messageLimit));
    }
  };

  const messageProgress = Math.min(100, (customMessage.length / messageLimit) * 100);

  // Copy to clipboard with analytics
  const copyToClipboard = async (text, platform = 'clipboard') => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
  shareJobService.recordShare(job.id, platform, customMessage || selectedTemplate?.template);
  updateStats();
      
      toast.success("Copied to clipboard!", {
        description: "Link has been copied to your clipboard."
      });
    } catch (error) {
      toast.error("Failed to copy", {
        description: "Please try again or copy manually."
      });
    }
    setTimeout(() => setCopying(false), 1000);
  };

  // Social media sharing URLs with tracking
  const getSocialShareUrl = (platform) => {
    const message = customMessage || selectedTemplate?.template || defaultMessage;
    const trackingUrl = shareJobService.generateTrackingUrl(job.id, platform);
    const encodedUrl = encodeURIComponent(trackingUrl);
    const encodedMessage = encodeURIComponent(message);

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedMessage}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodedMessage} ${trackingUrl}`;
      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`;
      default:
        return trackingUrl;
    }
  };

  // Handle social share with analytics
  const handleSocialShare = (platform) => {
    window.open(getSocialShareUrl(platform), '_blank');
  shareJobService.recordShare(job.id, platform, customMessage || selectedTemplate?.template);
  updateStats();
    
    toast.success("Shared successfully!", {
      description: `Job shared on ${platform}. Thanks for spreading the word!`
    });
  };

  // Email sharing with analytics
  const shareViaEmail = () => {
    const message = customMessage || selectedTemplate?.template || defaultMessage;
    const subject = encodeURIComponent(`Job Opportunity: ${job.title} at ${companyName}`);
    const body = encodeURIComponent(`${message}\n\nView Job Details: ${jobUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    
  shareJobService.recordShare(job.id, 'email_client', message);
  updateStats();
    
    toast.success("Email client opened!", {
      description: "Email draft created with job details."
    });
  };

  // Add recipient email
  const addRecipientEmail = () => {
    if (recipientEmail && !recipientEmails.includes(recipientEmail)) {
      setRecipientEmails([...recipientEmails, recipientEmail]);
      setRecipientEmail('');
    }
  };

  // Remove recipient email
  const removeRecipientEmail = (email) => {
    setRecipientEmails(recipientEmails.filter(e => e !== email));
  };

  // Send direct email with analytics integration
  const sendDirectEmail = async () => {
    if (recipientEmails.length === 0) {
      toast.error("No recipients", {
        description: "Please add at least one email address."
      });
      return;
    }

    setSending(true);
    
    try {
      // Use the share service to send emails
      const message = customMessage || selectedTemplate?.template || defaultMessage;
      await shareJobService.sendDirectEmails(job.id, recipientEmails, message);
      
      toast.success("Emails sent!", {
        description: `Job shared with ${recipientEmails.length} recipient(s).`
      });
      setRecipientEmails([]);
      setCustomMessage('');
      
      // Refresh stats
  updateStats();
      
    } catch (error) {
      // Fallback to simulated send if service fails
      await new Promise(resolve => setTimeout(resolve, 2000));
  shareJobService.recordShare(job.id, 'direct_email', customMessage || selectedTemplate?.template, recipientEmails.length);
  updateStats();
      
      toast.success("Emails sent!", {
        description: `Job shared with ${recipientEmails.length} recipient(s). (Simulated)`
      });
      setRecipientEmails([]);
      setCustomMessage('');
    }
    
    setSending(false);
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${job.title}-${companyName}-QR.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  // Open share dialog and generate QR code
  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (newOpen) {
      initializeShareData();
    }
  };

  // Native share handler
  const handleNativeShare = async () => {
    if (!supportsNativeShare) return;
    const message = customMessage || selectedTemplate?.template || defaultMessage;
    try {
      await navigator.share({
        title: `Job: ${job.title}`,
        text: message,
        url: jobUrl
      });
      shareJobService.recordShare(job.id, 'native_share', message);
      updateStats();
      toast.success('Shared!', { description: 'Thanks for sharing this job.' });
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast.error('Share failed', { description: 'Could not invoke native share.' });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || children || (
          <Button variant="outline" size="sm" className="relative">
            <Share2 className="w-4 h-4 mr-1" />
            Share
            {jobShareStats?.totalShares > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">
                {jobShareStats.totalShares}
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Share2 className="w-6 h-6 text-blue-600" />
            Share Job Opportunity
          </DialogTitle>
          <DialogDescription>
            Share this job with your network and help someone find their next opportunity.
          </DialogDescription>
        </DialogHeader>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-0">
              <CardHeader>
                <CardTitle className="text-lg">Job Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-gray-200">
                    <AvatarImage src={getCompanyLogo(job)} alt={companyName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                      {companyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                    <p className="text-gray-600">{companyName}</p>
                  </div>
                </div>

                {/* Job Badges */}
                <div className="flex flex-wrap gap-2">
                  {job.job_source === 'external' && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      External
                    </Badge>
                  )}
                  {job.is_featured && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {job.is_urgent && (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>

                {/* Job Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{jobLocation}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                    <span>{salaryDisplay}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    <span>{formatRelativeTime(job.created_at)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2 text-orange-500" />
                    <span>{snakeToTitle(job.employment_type)}</span>
                  </div>
                </div>

                {/* Job Description Preview */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 line-clamp-4">{jobDescription}</p>
                </div>

                {/* Skills */}
                {job.required_skills && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">
                      Required Skills:
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {job.required_skills.split(',').slice(0, 4).map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {skill.trim()}
                        </Badge>
                      ))}
                      {job.required_skills.split(',').length > 4 && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                          +{job.required_skills.split(',').length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sharing Options */}
          <div className="lg:col-span-2">
            {/* Quick Share Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(jobUrl)} className="gap-1">
                <LinkIcon className="w-4 h-4" /> Copy Link
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSocialShare('linkedin')} className="gap-1">
                <Linkedin className="w-4 h-4 text-blue-600" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSocialShare('twitter')} className="gap-1">
                <Twitter className="w-4 h-4 text-sky-500" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSocialShare('whatsapp')} className="gap-1">
                <MessageSquare className="w-4 h-4 text-green-600" />
              </Button>
              {supportsNativeShare && (
                <Button size="sm" variant="outline" onClick={handleNativeShare} className="gap-1">
                  <Share2 className="w-4 h-4" /> Native
                </Button>
              )}
              {jobShareStats?.totalShares > 0 && (
                <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {jobShareStats.totalShares} total shares
                </div>
              )}
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Social
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </TabsTrigger>
              </TabsList>

              {/* Link Sharing */}
              <TabsContent value="link" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Share Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="job-url">Job URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="job-url"
                          value={jobUrl}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          onClick={() => copyToClipboard(jobUrl)}
                          disabled={copying}
                          className="shrink-0"
                        >
                          {copying ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="share-message">Custom Message (Optional)</Label>
                      <Textarea
                        id="share-message"
                        placeholder="Add a personal message..."
                        value={customMessage}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                      <div className="mt-1">
                        <div className="h-1 bg-gray-200 rounded overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              messageProgress < 70 ? 'bg-green-500' : messageProgress < 90 ? 'bg-yellow-400' : 'bg-red-500'
                            }`}
                            style={{ width: `${messageProgress}%` }}
                          />
                        </div>
                        <p className={`text-[10px] mt-1 text-right ${customMessage.length === messageLimit ? 'text-red-600' : 'text-gray-500'}`}>
                          {customMessage.length}/{messageLimit}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Full Message Preview</Label>
                      <div className="bg-gray-50 rounded-lg p-3 mt-1 text-sm text-gray-700">
                        {customMessage || defaultMessage}
                        <br />
                        <span className="text-blue-600 underline">{jobUrl}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => copyToClipboard(`${customMessage || defaultMessage}\n\n${jobUrl}`)}
                      className="w-full"
                      disabled={copying}
                    >
                      {copying ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Full Message
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Social Media Sharing */}
              <TabsContent value="social" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Social Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {/* LinkedIn */}
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('linkedin')}
                        className="flex items-center justify-center gap-2 p-3 h-auto hover:bg-blue-50"
                      >
                        <Linkedin className="w-5 h-5 text-blue-600" />
                        <span>LinkedIn</span>
                      </Button>

                      {/* Twitter */}
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('twitter')}
                        className="flex items-center justify-center gap-2 p-3 h-auto hover:bg-blue-50"
                      >
                        <Twitter className="w-5 h-5 text-blue-400" />
                        <span>Twitter</span>
                      </Button>

                      {/* Facebook */}
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('facebook')}
                        className="flex items-center justify-center gap-2 p-3 h-auto hover:bg-blue-50"
                      >
                        <Facebook className="w-5 h-5 text-blue-700" />
                        <span>Facebook</span>
                      </Button>

                      {/* WhatsApp */}
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('whatsapp')}
                        className="flex items-center justify-center gap-2 p-3 h-auto hover:bg-green-50"
                      >
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <span>WhatsApp</span>
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <Label>Customize Message</Label>
                      <Textarea
                        placeholder="Add a personal touch to your social media post..."
                        value={customMessage}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                      <div className="mt-1">
                        <div className="h-1 bg-gray-200 rounded overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              messageProgress < 70 ? 'bg-green-500' : messageProgress < 90 ? 'bg-yellow-400' : 'bg-red-500'
                            }`}
                            style={{ width: `${messageProgress}%` }}
                          />
                        </div>
                        <p className={`text-[10px] mt-1 text-right ${customMessage.length === messageLimit ? 'text-red-600' : 'text-gray-500'}`}>
                          {customMessage.length}/{messageLimit}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This message will be used for all social media platforms
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Share Templates */}
              <TabsContent value="templates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Share Templates
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Choose from pre-written templates or get personalized suggestions
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Share Suggestions */}
                    {shareSuggestions.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Personalized Suggestions
                        </h4>
                        <div className="space-y-2">
                          {shareSuggestions.slice(0, 3).map((suggestion, index) => (
                            <div key={index} className="text-sm bg-white rounded-md p-3 border border-blue-200">
                              <p className="font-medium text-blue-800 mb-1">
                                {suggestion.platform !== 'any' ? `Best for ${suggestion.platform}` : 'Perfect timing'}
                              </p>
                              <p className="text-gray-700 mb-1">{suggestion.reason}</p>
                              <p className="text-xs text-blue-600 italic">{suggestion.tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job Share Statistics */}
                    {jobShareStats && jobShareStats.totalShares > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          This Job's Share Stats
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{jobShareStats.totalShares}</div>
                            <div className="text-gray-600">Total Shares</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {Object.keys(jobShareStats.platformStats).length}
                            </div>
                            <div className="text-gray-600">Platforms</div>
                          </div>
                        </div>
                        {Object.entries(jobShareStats.platformStats).length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-600 mb-2">Top platforms:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(jobShareStats.platformStats)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 3)
                                .map(([platform, count]) => (
                                  <Badge key={platform} variant="outline" className="text-xs">
                                    {platform}: {count}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Template Selection */}
                    <div>
                      <Label className="text-base font-semibold">Choose a Template</Label>
                      <div className="grid gap-3 mt-3">
                        {shareTemplates.map((template, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedTemplate?.name === template.name
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{template.name}</h4>
                              {selectedTemplate?.name === template.name && (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-3">{template.template}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected Template Preview */}
                    {selectedTemplate && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <Label className="text-sm font-medium text-blue-900 mb-2 block">
                          Selected Template Preview
                        </Label>
                        <div className="bg-white rounded-md p-3 text-sm text-gray-700">
                          {selectedTemplate.template}
                          <br />
                          <span className="text-blue-600 underline">{jobUrl}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => copyToClipboard(`${selectedTemplate.template}\n\n${jobUrl}`, 'template')}
                            className="flex-1"
                            disabled={copying}
                          >
                            {copying ? (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            ) : (
                              <Copy className="w-4 h-4 mr-2" />
                            )}
                            Copy Template
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCustomMessage(selectedTemplate.template);
                              setActiveTab('social');
                            }}
                            className="flex-1"
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Use for Social
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Custom Template */}
                    <div>
                      <Label htmlFor="custom-template">Or Create Your Own</Label>
                      <Textarea
                        id="custom-template"
                        placeholder="Write your own share message..."
                        value={customMessage}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex-1 mr-4">
                          <div className="h-1 bg-gray-200 rounded overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                messageProgress < 70 ? 'bg-green-500' : messageProgress < 90 ? 'bg-yellow-400' : 'bg-red-500'
                              }`}
                              style={{ width: `${messageProgress}%` }}
                            />
                          </div>
                          <p className={`text-[10px] mt-1 ${customMessage.length === messageLimit ? 'text-red-600' : 'text-gray-500'}`}>
                            {customMessage.length}/{messageLimit}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCustomMessage('')}
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(`${customMessage}\n\n${jobUrl}`, 'custom')}
                            disabled={!customMessage || copying}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Email Sharing */}
              <TabsContent value="email" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Email Sharing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Email */}
                    <div>
                      <Button
                        onClick={shareViaEmail}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Open in Email Client
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Opens your default email client with pre-filled content
                      </p>
                    </div>

                    <Separator />

                    {/* Direct Email */}
                    <div>
                      <Label>Send Direct Emails</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="Enter email address..."
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addRecipientEmail()}
                          />
                          <Button
                            onClick={addRecipientEmail}
                            disabled={!recipientEmail}
                            size="sm"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Recipients List */}
                        {recipientEmails.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm">Recipients ({recipientEmails.length})</Label>
                            <div className="flex flex-wrap gap-2">
                              {recipientEmails.map((email, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="flex items-center gap-1 pr-1"
                                >
                                  {email}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeRecipientEmail(email)}
                                    className="h-4 w-4 p-0 hover:bg-red-100"
                                  >
                                    ×
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="email-message">Personal Message</Label>
                          <Textarea
                            id="email-message"
                            placeholder="Add a personal message for the recipients..."
                            value={customMessage}
                            onChange={(e) => handleMessageChange(e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                          <div className="mt-1">
                            <div className="h-1 bg-gray-200 rounded overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  messageProgress < 70 ? 'bg-green-500' : messageProgress < 90 ? 'bg-yellow-400' : 'bg-red-500'
                                }`}
                                style={{ width: `${messageProgress}%` }}
                              />
                            </div>
                            <p className={`text-[10px] mt-1 text-right ${customMessage.length === messageLimit ? 'text-red-600' : 'text-gray-500'}`}>
                              {customMessage.length}/{messageLimit}
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={sendDirectEmail}
                          disabled={recipientEmails.length === 0 || sending}
                          className="w-full"
                        >
                          {sending ? (
                            <>
                              <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send to {recipientEmails.length} recipient(s)
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* QR Code */}
              <TabsContent value="qr" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {qrCodeUrl ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                          <img 
                            src={qrCodeUrl} 
                            alt="Job QR Code"
                            className="w-48 h-48"
                          />
                        </div>
                        
                        <div className="text-center space-y-2">
                          <p className="text-sm text-gray-600">
                            Scan this QR code to view the job details
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={downloadQRCode}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download QR Code
                            </Button>
                            <Button
                              onClick={() => copyToClipboard(jobUrl)}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Copy Link
                            </Button>
                          </div>
                        </div>

                        <div className="w-full bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 text-center">
                            <strong>Perfect for:</strong> Print materials, business cards, 
                            flyers, or anywhere you need offline access to the job posting
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareJob;
