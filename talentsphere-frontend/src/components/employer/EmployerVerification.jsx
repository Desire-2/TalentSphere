import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Shield, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  Award,
  Building2
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';

const EmployerVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useAuthStore();

  const documentTypes = [
    {
      key: 'business_license',
      title: 'Business License',
      description: 'Valid business license or registration certificate',
      required: true,
      accepted: '.pdf,.jpg,.jpeg,.png'
    },
    {
      key: 'tax_id',
      title: 'Tax ID Certificate',
      description: 'Government-issued tax identification document',
      required: true,
      accepted: '.pdf,.jpg,.jpeg,.png'
    },
    {
      key: 'company_registration',
      title: 'Company Registration',
      description: 'Certificate of incorporation or company registration',
      required: true,
      accepted: '.pdf,.jpg,.jpeg,.png'
    },
    {
      key: 'employment_authorization',
      title: 'Employment Authorization',
      description: 'Authorization to hire employees (if applicable)',
      required: false,
      accepted: '.pdf,.jpg,.jpeg,.png'
    }
  ];

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await apiService.get('/auth/employer/verification-status');
      setVerificationStatus(response);
    } catch (error) {
      console.error('Failed to load verification status:', error);
      setMessage({ type: 'error', text: 'Failed to load verification status' });
    }
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // In a real application, you would upload to cloud storage
      // For now, we'll simulate the upload
      const fileUrl = URL.createObjectURL(file);
      
      setUploadedFiles(prev => ({
        ...prev,
        [documentType]: {
          file,
          url: fileUrl,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        }
      }));

      setMessage({ type: 'success', text: `${file.name} uploaded successfully` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload file' });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (documentType) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      if (updated[documentType]) {
        URL.revokeObjectURL(updated[documentType].url);
        delete updated[documentType];
      }
      return updated;
    });
  };

  const handleSubmitVerification = async () => {
    setIsSubmitting(true);
    try {
      const documents = {};
      Object.keys(uploadedFiles).forEach(key => {
        documents[key] = uploadedFiles[key].url;
      });

      await apiService.post('/auth/verify-employer', documents);
      
      setMessage({ type: 'success', text: 'Verification documents submitted successfully!' });
      await loadVerificationStatus();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit verification documents' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!verificationStatus) return null;

    if (verificationStatus.is_verified) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Verified</Badge>;
    }
    
    if (verificationStatus.has_submitted_docs) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ Under Review</Badge>;
    }
    
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">📋 Not Started</Badge>;
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!verificationStatus) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Employer Verification
              </CardTitle>
              <CardDescription>
                Verify your employer status to build trust with candidates
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Verification Progress</span>
              <span className="text-blue-600">{verificationStatus.profile_completion}%</span>
            </div>
            <Progress value={verificationStatus.profile_completion} className="h-2" />
            
            {verificationStatus.is_verified ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  🎉 Congratulations! Your employer account is verified. You now have access to all premium features.
                </AlertDescription>
              </Alert>
            ) : verificationStatus.has_submitted_docs ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Your documents are under review. We'll notify you within 2-3 business days.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-blue-200 bg-blue-50">
                <Award className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Why verify?</strong> Verified employers receive 3x more applications and access to premium features.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Required Actions */}
      {verificationStatus.required_actions.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Action Required:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {verificationStatus.required_actions.map((action, index) => (
                <li key={index}>{action.description}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Message */}
      {message.text && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Document Upload */}
      {!verificationStatus.is_verified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Required Documents
            </CardTitle>
            <CardDescription>
              Upload the following documents to verify your employer status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {documentTypes.map((docType) => (
                <div key={docType.key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {docType.title}
                        {docType.required && <span className="text-red-500">*</span>}
                      </h4>
                      <p className="text-sm text-gray-600">{docType.description}</p>
                    </div>
                    {uploadedFiles[docType.key] && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>

                  {uploadedFiles[docType.key] ? (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-600 bg-blue-100 rounded p-1" />
                          <div>
                            <p className="font-medium text-sm">{uploadedFiles[docType.key].name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadedFiles[docType.key].size)} • 
                              Uploaded {new Date(uploadedFiles[docType.key].uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(uploadedFiles[docType.key].url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(docType.key)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drop your file here or
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-${docType.key}`).click()}
                        disabled={isUploading}
                      >
                        Choose File
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Accepted formats: {docType.accepted} (Max 10MB)
                      </p>
                      <input
                        id={`file-${docType.key}`}
                        type="file"
                        accept={docType.accepted}
                        onChange={(e) => handleFileUpload(docType.key, e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Button */}
              {Object.keys(uploadedFiles).length > 0 && !verificationStatus.has_submitted_docs && (
                <div className="text-center pt-4 border-t">
                  <Button
                    onClick={handleSubmitVerification}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Submit for Verification
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    By submitting, you agree to our verification process and terms.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits of Verification */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Benefits of Verification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Verified Badge</p>
                <p className="text-sm text-green-700">Show candidates you're legitimate</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Priority Listings</p>
                <p className="text-sm text-green-700">Your jobs appear higher in search</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Advanced Analytics</p>
                <p className="text-sm text-green-700">Detailed insights on your postings</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Premium Support</p>
                <p className="text-sm text-green-700">Priority customer service</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployerVerification;
