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
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  Building2,
  Send,
  UserPlus,
  Globe,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../../utils/helpers';
import { toast } from 'sonner';
import shareScholarshipService from '../../services/shareScholarshipService';

const ShareScholarship = ({ 
  scholarship, 
  children,
  trigger = null 
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('link');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copying, setCopying] = useState(false);
  const [sending, setSending] = useState(false);
  const [shareTemplates, setShareTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [shareSuggestions, setShareSuggestions] = useState([]);
  const [scholarshipShareStats, setScholarshipShareStats] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [supportsNativeShare] = useState(typeof navigator !== 'undefined' && !!navigator.share);
  const messageLimit = 280;

  // Helper to update stats after any share action
  const updateStats = () => {
    const stats = shareScholarshipService.getScholarshipShareStats(scholarship.id);
    setScholarshipShareStats(stats);
  };

  // Generate scholarship URL
  const scholarshipUrl = `${window.location.origin}/scholarships/${scholarship.id}`;
  
  // Scholarship preview data
  const organizationName = scholarship.external_organization_name || 'TalentSphere';
  const scholarshipTitle = scholarship.title;
  const amount = scholarship.amount_max 
    ? `${formatCurrency(scholarship.amount_max, scholarship.currency || 'USD')}`
    : 'Various amounts';
  const deadline = scholarship.application_deadline 
    ? new Date(scholarship.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Open';

  // Default sharing message
  const defaultMessage = `🎓 Great scholarship opportunity: ${scholarshipTitle} at ${organizationName}. Award: ${amount}. Apply by ${deadline}!`;

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadShareData();
    }
  }, [open]);

  const loadShareData = () => {
    // Generate share templates
    const templates = shareScholarshipService.generateShareTemplates(scholarship, organizationName);
    setShareTemplates(templates);
    setSelectedTemplate(templates[0]);

    // Generate share suggestions
    const suggestions = shareScholarshipService.generateShareSuggestions(scholarship);
    setShareSuggestions(suggestions);

    // Load stats
    updateStats();
  };

  // Generate QR Code when QR tab is opened
  useEffect(() => {
    if (activeTab === 'qr' && !qrCodeUrl) {
      generateQRCode();
    }
  }, [activeTab]);

  const generateQRCode = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(scholarshipUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  // Handle custom message changes with character limit
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
      shareScholarshipService.recordShare(scholarship.id, platform, customMessage || selectedTemplate?.template);
      updateStats();
      
      toast.success("Copied to clipboard!", {
        description: "Scholarship link has been copied to your clipboard."
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
    const trackingUrl = shareScholarshipService.generateTrackingUrl(scholarship.id, platform);
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
    shareScholarshipService.recordShare(scholarship.id, platform, customMessage || selectedTemplate?.template);
    updateStats();
    toast.success(`Opening ${platform}...`, {
      description: "Share this scholarship with your network!"
    });
  };

  // Handle email share
  const handleEmailShare = async () => {
    if (!recipientEmail || !recipientName) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const emailContent = shareScholarshipService.generateEmailContent(
        scholarship,
        organizationName,
        recipientName,
        scholarshipUrl,
        customMessage
      );

      // Record the share
      shareScholarshipService.recordShare(scholarship.id, 'direct_email', customMessage, recipientEmail);
      updateStats();

      // In a real app, you would send this to your backend
      // For now, we'll open the email client
      const subject = `Scholarship Opportunity: ${scholarshipTitle}`;
      const body = encodeURIComponent(emailContent);
      window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;

      toast.success("Email client opened!", {
        description: "Your email is ready to send."
      });

      setRecipientEmail('');
      setRecipientName('');
    } catch (error) {
      toast.error("Failed to prepare email", {
        description: "Please try again."
      });
    } finally {
      setSending(false);
    }
  };

  // Native share (mobile devices)
  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: scholarshipTitle,
        text: customMessage || defaultMessage,
        url: scholarshipUrl
      });
      shareScholarshipService.recordShare(scholarship.id, 'native_share', customMessage);
      updateStats();
      toast.success("Shared successfully!");
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to share", {
          description: "Please try another sharing method."
        });
      }
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `scholarship-${scholarship.id}-qr.png`;
    link.click();
    
    shareScholarshipService.recordShare(scholarship.id, 'qr_download');
    updateStats();
    
    toast.success("QR Code downloaded!", {
      description: "You can now print or share the QR code."
    });
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset some states when closing
      setActiveTab('link');
      setCustomMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-6 h-6 text-blue-600" />
            Share Scholarship Opportunity
          </DialogTitle>
          <DialogDescription>
            Help students discover this amazing scholarship opportunity
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Scholarship Preview */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {scholarship.external_organization_logo ? (
                    <Avatar className="h-12 w-12 border-2 border-blue-200">
                      <AvatarImage src={scholarship.external_organization_logo} alt={organizationName} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {organizationName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {organizationName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {organizationName}
                    </h3>
                    <p className="text-xs text-gray-600">Scholarship Provider</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-tight mb-2">
                    {scholarshipTitle}
                  </h4>
                  {scholarship.summary && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {scholarship.summary}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {scholarship.amount_max && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-700">
                        {amount}
                      </span>
                    </div>
                  )}
                  
                  {scholarship.application_deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-700">Deadline: {deadline}</span>
                    </div>
                  )}

                  {scholarship.study_level && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700 capitalize">
                        {scholarship.study_level?.replace('_', ' ') || scholarship.study_level}
                      </span>
                    </div>
                  )}

                  {(scholarship.country || scholarship.location_type !== 'any') && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-700">
                        {scholarship.country || scholarship.location_type?.replace('_', ' ') || 'Any Location'}
                      </span>
                    </div>
                  )}
                </div>

                {scholarship.scholarship_type && (
                  <div className="pt-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 capitalize">
                      {scholarship.scholarship_type?.replace('_', ' ') || scholarship.scholarship_type}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Stats */}
            {scholarshipShareStats && scholarshipShareStats.totalShares > 0 && (
              <Card className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Total Shares</span>
                    </div>
                    <span className="text-2xl font-bold text-green-700">
                      {scholarshipShareStats.totalShares}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Help more students discover this opportunity!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sharing Options */}
          <div className="lg:col-span-2">
            {/* Quick Share Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(scholarshipUrl)} className="gap-1">
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
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              )}
              {scholarshipShareStats?.totalShares > 0 && (
                <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {scholarshipShareStats.totalShares} total shares
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
                      <Label htmlFor="scholarship-url">Scholarship URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="scholarship-url"
                          value={scholarshipUrl}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          onClick={() => copyToClipboard(scholarshipUrl)}
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
                        placeholder="Add a personal message to encourage applications..."
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
                        <span className="text-blue-600 underline">{scholarshipUrl}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => copyToClipboard(`${customMessage || defaultMessage}\n\n${scholarshipUrl}`)}
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
                      <Label className="text-sm font-medium mb-2 block">Share Suggestions</Label>
                      <div className="space-y-2">
                        {shareSuggestions.map((suggestion, index) => (
                          <div key={index} className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                            <div className="flex items-start gap-2">
                              <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700">{suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Templates */}
              <TabsContent value="templates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Pre-written Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Choose a template</Label>
                      <div className="space-y-2">
                        {shareTemplates.map((template, index) => (
                          <div
                            key={index}
                            onClick={() => setSelectedTemplate(template)}
                            className={`cursor-pointer rounded-lg p-3 border-2 transition-all hover:shadow-md ${
                              selectedTemplate?.name === template.name
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-medium text-sm text-gray-900">{template.name}</span>
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
                          <span className="text-blue-600 underline">{scholarshipUrl}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => copyToClipboard(`${selectedTemplate.template}\n\n${scholarshipUrl}`, 'template')}
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
                            onClick={() => copyToClipboard(`${customMessage}\n\n${scholarshipUrl}`, 'custom')}
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
                      Share via Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start gap-2">
                        <UserPlus className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 text-sm mb-1">
                            Know someone who might be interested?
                          </h4>
                          <p className="text-xs text-blue-700">
                            Send them a personalized email about this scholarship opportunity
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="recipient-name">Recipient Name</Label>
                      <Input
                        id="recipient-name"
                        placeholder="e.g., John Doe"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="recipient-email">Recipient Email</Label>
                      <Input
                        id="recipient-email"
                        type="email"
                        placeholder="student@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email-message">Personal Message (Optional)</Label>
                      <Textarea
                        id="email-message"
                        placeholder="Add a personal note to your recipient..."
                        value={customMessage}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleEmailShare}
                      disabled={!recipientEmail || !recipientName || sending}
                      className="w-full"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      This will open your email client with a pre-filled message
                    </p>
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
                      <div className="space-y-4">
                        <div className="flex flex-col items-center">
                          <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-lg">
                            <img 
                              src={qrCodeUrl} 
                              alt="Scholarship QR Code" 
                              className="w-64 h-64"
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-3 text-center max-w-sm">
                            Scan this QR code to access the scholarship page instantly
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={downloadQRCode}
                            variant="outline"
                            className="flex-1 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download QR Code
                          </Button>
                          <Button
                            onClick={() => copyToClipboard(scholarshipUrl)}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </Button>
                        </div>

                        <div className="w-full bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 text-center">
                            <strong>Perfect for:</strong> Print materials, posters, flyers, 
                            or anywhere you need offline access to the scholarship
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

export default ShareScholarship;
