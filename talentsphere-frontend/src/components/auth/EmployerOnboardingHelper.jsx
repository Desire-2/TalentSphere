import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Building2, 
  Shield,
  Briefcase,
  Star,
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';

const EmployerOnboardingHelper = ({ onComplete }) => {
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuthStore();

  useEffect(() => {
    loadOnboardingGuide();
  }, []);

  const loadOnboardingGuide = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/auth/employer/onboarding-guide');
      setOnboardingData(response);
      
      // Find current step based on completion
      const incompleteStepIndex = response.onboarding_steps.findIndex(step => !step.completed);
      setCurrentStep(incompleteStepIndex >= 0 ? incompleteStepIndex : response.onboarding_steps.length - 1);
    } catch (error) {
      console.error('Failed to load onboarding guide:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (step.id) {
      case 'profile_setup':
        return <Briefcase {...iconProps} />;
      case 'company_setup':
        return <Building2 {...iconProps} />;
      case 'verification':
        return <Shield {...iconProps} />;
      case 'first_job':
        return <FileText {...iconProps} />;
      case 'premium_features':
        return <Star {...iconProps} />;
      default:
        return <CheckCircle2 {...iconProps} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const handleStepAction = (step) => {
    // Navigate to appropriate page based on step
    switch (step.id) {
      case 'profile_setup':
        window.location.href = '/profile';
        break;
      case 'company_setup':
        window.location.href = '/employer/company';
        break;
      case 'verification':
        window.location.href = '/employer/verification';
        break;
      case 'first_job':
        window.location.href = '/employer/jobs/new';
        break;
      case 'premium_features':
        window.location.href = '/employer/premium';
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!onboardingData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load onboarding guide. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Welcome to TalentSphere!
          </CardTitle>
          <CardDescription>
            Complete these steps to optimize your employer experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Profile Completion
              </span>
              <span className="text-sm font-medium text-blue-600">
                {onboardingData.completion_percentage}%
              </span>
            </div>
            <Progress 
              value={onboardingData.completion_percentage} 
              className="h-3"
            />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              Estimated completion time: {onboardingData.estimated_completion_time}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Actions */}
      {onboardingData.required_actions.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Action Required:</strong> Complete these steps to unlock all features:
            <ul className="list-disc list-inside mt-2 space-y-1">
              {onboardingData.required_actions.map((action, index) => (
                <li key={index}>{action.description}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Onboarding Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Setup Steps</h3>
        
        {onboardingData.onboarding_steps.map((step, index) => (
          <Card 
            key={step.id} 
            className={`transition-all duration-200 ${
              step.completed 
                ? 'bg-green-50 border-green-200' 
                : index === currentStep 
                ? 'ring-2 ring-blue-500 border-blue-200' 
                : 'hover:shadow-md'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : index === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      getStepIcon(step)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {step.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={getPriorityColor(step.priority)}
                      >
                        {step.priority}
                      </Badge>
                      {step.completed && (
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                          ✓ Complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {!step.completed && (
                  <Button
                    variant={index === currentStep ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStepAction(step)}
                    className="flex-shrink-0 ml-4"
                  >
                    Start
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Need Help?
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                Our support team is here to help you get started. Contact us if you have any questions.
              </p>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-100">
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Button */}
      {onboardingData.completion_percentage >= 80 && (
        <div className="text-center">
          <Button 
            onClick={onComplete}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployerOnboardingHelper;
