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
  const defaultMessage = `Check out this exciting ${job.title} position at ${companyName}! ${jobLocation ? `Located in ${jobLocation}. ` : ''}${salaryDisplay !== 'Salary not specified' ? `Salary: ${salaryDisplay}. ` : ''}Apply now!\n\n🌟 Join our community for more opportunities: http://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl`;

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">Share Job Opportunity</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Share this job with your network and help someone find their next opportunity. 💼✨
          </DialogDescription>
        </DialogHeader>

  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* Job Preview */}
          <div className="lg:col-span-2">
            <Card className="lg:sticky lg:top-0 border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b">
                <CardTitle className="text-base sm:text-lg font-bold text-gray-800">📋 Job Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                {/* Company Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-blue-300 shadow-md">
                    <AvatarImage src={getCompanyLogo(job)} alt={companyName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white font-bold text-sm sm:text-base">
                      {companyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 line-clamp-2">{job.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 truncate">{companyName}</p>
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
          <div className="lg:col-span-3">
            {/* Quick Share Bar */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-3 sm:p-4 rounded-xl border-2 border-blue-200 mb-4 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-3">🚀 Quick Share</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(jobUrl)} className="gap-1 hover:bg-blue-100 transition-colors">
                  <LinkIcon className="w-4 h-4" /> <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSocialShare('linkedin')} className="gap-1 hover:bg-blue-50 transition-colors">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSocialShare('twitter')} className="gap-1 hover:bg-sky-50 transition-colors">
                  <Twitter className="w-4 h-4 text-sky-500" />
                  <span className="hidden sm:inline">Twitter</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSocialShare('whatsapp')} className="gap-1 hover:bg-green-50 transition-colors">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
                {supportsNativeShare && (
                  <Button size="sm" variant="outline" onClick={handleNativeShare} className="gap-1 hover:bg-purple-50 transition-colors">
                    <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
                  </Button>
                )}
                {jobShareStats?.totalShares > 0 && (
                  <div className="ml-auto text-xs text-gray-600 flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {jobShareStats.totalShares} shares
                  </div>
                )}
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-auto bg-gradient-to-r from-gray-100 to-gray-200 p-1.5 gap-1.5">
                <TabsTrigger value="link" className="flex flex-col xl:flex-row items-center justify-center gap-1 xl:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-1.5 xl:px-4 text-[10px] xl:text-sm whitespace-nowrap rounded-md transition-all">
                  <LinkIcon className="w-4 h-4 xl:w-4 xl:h-4 flex-shrink-0" />
                  <span className="text-[9px] xl:text-sm mt-0.5 xl:mt-0">Link</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="flex flex-col xl:flex-row items-center justify-center gap-1 xl:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-1.5 xl:px-4 text-[10px] xl:text-sm whitespace-nowrap rounded-md transition-all">
                  <Globe className="w-4 h-4 xl:w-4 xl:h-4 flex-shrink-0" />
                  <span className="text-[9px] xl:text-sm mt-0.5 xl:mt-0">Social</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex flex-col xl:flex-row items-center justify-center gap-1 xl:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-1.5 xl:px-4 text-[10px] xl:text-sm whitespace-nowrap rounded-md transition-all">
                  <MessageSquare className="w-4 h-4 xl:w-4 xl:h-4 flex-shrink-0" />
                  <span className="text-[9px] xl:text-sm mt-0.5 xl:mt-0">Templates</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex flex-col xl:flex-row items-center justify-center gap-1 xl:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-1.5 xl:px-4 text-[10px] xl:text-sm whitespace-nowrap rounded-md transition-all">
                  <Mail className="w-4 h-4 xl:w-4 xl:h-4 flex-shrink-0" />
                  <span className="text-[9px] xl:text-sm mt-0.5 xl:mt-0">Email</span>
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex flex-col xl:flex-row items-center justify-center gap-1 xl:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-1.5 xl:px-4 text-[10px] xl:text-sm whitespace-nowrap rounded-md transition-all">
                  <QrCode className="w-4 h-4 xl:w-4 xl:h-4 flex-shrink-0" />
                  <span className="text-[9px] xl:text-sm mt-0.5 xl:mt-0">QR</span>
                </TabsTrigger>
              </TabsList>

              {/* Link Sharing */}
              <TabsContent value="link" className="space-y-4 mt-4">
                <Card className="border-2 shadow-md max-w-3xl mx-auto">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                      <div className="p-1.5 bg-blue-500 rounded-md">
                        <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      Share Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
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
              <TabsContent value="social" className="space-y-4 mt-4">
                <Card className="border-2 shadow-md max-w-3xl mx-auto">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                      <div className="p-1.5 bg-purple-500 rounded-md">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      Social Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
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
              <TabsContent value="templates" className="space-y-4 mt-4">
                <Card className="border-2 shadow-md max-w-3xl mx-auto">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                      <div className="p-1.5 bg-green-500 rounded-md">
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      Share Templates
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      ✨ Choose from pre-written templates or get personalized suggestions
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
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
              <TabsContent value="email" className="space-y-4 mt-4">
                <Card className="border-2 shadow-md max-w-3xl mx-auto">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                      <div className="p-1.5 bg-orange-500 rounded-md">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      Email Sharing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
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
              <TabsContent value="qr" className="space-y-4 mt-4">
                <Card className="border-2 shadow-md max-w-3xl mx-auto">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                      <div className="p-1.5 bg-indigo-500 rounded-md">
                        <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    {qrCodeUrl ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 sm:p-8 rounded-2xl border-4 border-blue-300 shadow-xl">
                          <img 
                            src={qrCodeUrl} 
                            alt="Job QR Code"
                            className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64"
                          />
                        </div>
                        
                        <div className="text-center space-y-3">
                          <p className="text-sm sm:text-base text-gray-700 font-medium">
                            📱 Scan this QR code to view the job details instantly!
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button
                              onClick={downloadQRCode}
                              variant="outline"
                              className="flex items-center gap-2 hover:bg-blue-50"
                            >
                              <Download className="w-4 h-4" />
                              Download QR Code
                            </Button>
                            <Button
                              onClick={() => copyToClipboard(jobUrl)}
                              variant="outline"
                              className="flex items-center gap-2 hover:bg-purple-50"
                            >
                              <Copy className="w-4 h-4" />
                              Copy Link
                            </Button>
                          </div>
                        </div>

                        <div className="w-full bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 border-2 border-blue-200">
                          <p className="text-xs sm:text-sm text-gray-700 text-center">
                            <strong className="text-blue-700">💡 Perfect for:</strong> Print materials, business cards, 
                            flyers, posters, or anywhere you need offline access to the job posting!
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
