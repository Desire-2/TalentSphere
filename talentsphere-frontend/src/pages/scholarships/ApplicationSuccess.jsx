import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, FileText, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ApplicationSuccess = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/scholarships');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pt-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-green-900 mb-2">
              Application Submitted!
            </CardTitle>
            <CardDescription className="text-lg text-green-700">
              Your scholarship application has been successfully submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Confirmation Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Application Reference</p>
                  <p className="text-xs text-green-700">{`APP-${Date.now()}`}</p>
                </div>
              </div>
              
              <Separator className="bg-green-200" />
              
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Confirmation Email</p>
                  <p className="text-xs text-green-700">Check your email for a detailed receipt</p>
                </div>
              </div>
              
              <Separator className="bg-green-200" />
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Next Steps</p>
                  <p className="text-xs text-green-700">You'll be notified of the results by email</p>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">What Happens Next?</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Your application will be reviewed by the scholarship committee</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>You may receive follow-up requests for additional information</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Final results will be communicated via email</span>
                </li>
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tips</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Keep your reference number for future correspondence</li>
                <li>• Check your email regularly (including spam folder)</li>
                <li>• Update your profile if you change contact information</li>
              </ul>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <Button
                onClick={() => navigate(`/scholarships/${id}`)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                View Scholarship Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                onClick={() => navigate('/scholarships')}
                variant="outline"
                className="w-full"
              >
                Browse More Scholarships
              </Button>
              
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>

            {/* Auto-redirect message */}
            <div className="text-center text-xs text-gray-500">
              Redirecting in 10 seconds...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
