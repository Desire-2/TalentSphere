import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { 
  Lightbulb, TrendingUp, AlertCircle, CheckCircle2, Target, 
  Award, Briefcase, GraduationCap, FolderKanban, Languages,
  Heart, Users, RefreshCw, Download, Share2, Sparkles
} from 'lucide-react';

const ProfileOptimization = ({ analysis = {}, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  console.log('🎯 ProfileOptimization received analysis:', analysis);
  
  const completeness = analysis?.completeness || { overall_score: 0, sections: {}, recommendations: [] };
  const keywords = analysis?.keywords || { current_keywords: [], suggested_keywords: [] };
  
  console.log('📊 Completeness data:', completeness);
  console.log('🔑 Keywords data:', keywords);
  
  const overallScore = completeness.overall_score || 0;
  const sections = completeness.sections || {};
  const recommendations = completeness.recommendations || [];
  
  // Handle both array of objects {keyword, count} and array of strings
  const currentKeywords = Array.isArray(keywords.current_keywords)
    ? keywords.current_keywords.map(k => typeof k === 'object' && k.keyword ? k.keyword : k)
    : [];
  
  const suggestedKeywords = keywords.suggested_keywords || [];
  
  console.log('✅ Processed data:', {
    overallScore,
    sectionsCount: Object.keys(sections).length,
    recommendationsCount: recommendations.length,
    currentKeywordsCount: currentKeywords.length,
    suggestedKeywordsCount: suggestedKeywords.length
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const getCompletenessColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressColor = (score) => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 75) return 'bg-blue-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getCompletenessLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', icon: <Award className="w-5 h-5 text-green-600" /> };
    if (score >= 75) return { label: 'Great', icon: <CheckCircle2 className="w-5 h-5 text-blue-600" /> };
    if (score >= 50) return { label: 'Good', icon: <Target className="w-5 h-5 text-yellow-600" /> };
    return { label: 'Needs Work', icon: <AlertCircle className="w-5 h-5 text-red-600" /> };
  };

  const getCompletenessMessage = (score) => {
    if (score >= 90) return 'Outstanding! Your profile is highly competitive and will attract top employers.';
    if (score >= 75) return 'Great job! Your profile is strong. A few more details will make it exceptional.';
    if (score >= 50) return 'Good progress! Adding more information will significantly boost your visibility.';
    return 'Let\'s build a compelling profile together. Complete the recommended sections below.';
  };

  const getSectionIcon = (sectionName) => {
    const icons = {
      personal: <Users className="w-4 h-4" />,
      professional: <Briefcase className="w-4 h-4" />,
      work_experience: <Briefcase className="w-4 h-4" />,
      education: <GraduationCap className="w-4 h-4" />,
      skills: <Sparkles className="w-4 h-4" />,
      certifications: <Award className="w-4 h-4" />,
      projects: <FolderKanban className="w-4 h-4" />,
      languages: <Languages className="w-4 h-4" />,
      volunteer: <Heart className="w-4 h-4" />,
    };
    return icons[sectionName] || <CheckCircle2 className="w-4 h-4" />;
  };

  const getSectionLabel = (sectionName) => {
    const labels = {
      personal: 'Personal Information',
      professional: 'Professional Summary',
      work_experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
      certifications: 'Certifications',
      projects: 'Projects',
      languages: 'Languages',
      volunteer: 'Volunteer Experience',
      memberships: 'Professional Memberships',
      awards: 'Awards & Achievements',
    };
    return labels[sectionName] || sectionName;
  };

  const level = getCompletenessLevel(overallScore);
  const sectionEntries = Object.entries(sections).sort((a, b) => a[1] - b[1]);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Profile Strength Score</CardTitle>
                <CardDescription>Your overall profile completeness</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${getCompletenessColor(overallScore)}`}>
                {overallScore}%
              </div>
              <div className="flex items-center gap-2">
                {level.icon}
                <span className={`text-lg font-semibold ${getCompletenessColor(overallScore)}`}>
                  {level.label}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={overallScore} className={`h-4 ${getProgressColor(overallScore)}`} />
            <p className="text-sm text-gray-600">{getCompletenessMessage(overallScore)}</p>
          </div>

          {/* Action Buttons */}
          {overallScore >= 75 && (
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Profile
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Section Breakdown
          </CardTitle>
          <CardDescription>Completion status by profile section</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectionEntries.length > 0 ? (
              sectionEntries.map(([sectionName, score]) => (
                <div key={sectionName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSectionIcon(sectionName)}
                      <span className="text-sm font-medium">{getSectionLabel(sectionName)}</span>
                    </div>
                    <span className={`text-sm font-semibold ${getCompletenessColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Loading section analysis...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Recommendations ({recommendations.length})
          </CardTitle>
          <CardDescription>Actionable tips to improve your profile</CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Alert key={index} className="border-l-4 border-l-orange-500">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <AlertDescription className="ml-2">
                    <strong className="font-medium">{rec.section || 'General'}:</strong> {rec.message || rec}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Perfect! No recommendations at this time.</p>
              <p className="text-xs text-gray-500 mt-1">Your profile is well-optimized.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Profile Keywords
          </CardTitle>
          <CardDescription>Keywords found in your profile and suggestions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Keywords */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Current Keywords ({currentKeywords.length})</h4>
            {currentKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentKeywords.map((keyword, index) => (
                  <Badge key={index} variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Add more details to generate keywords</p>
            )}
          </div>

          {/* Suggested Keywords */}
          {suggestedKeywords.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                Suggested Keywords to Add ({suggestedKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="border-yellow-300 text-yellow-700">
                    + {keyword}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Adding these keywords can improve your profile visibility in searches
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips for Improvement */}
      {overallScore < 90 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Quick Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-900">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                <span>Complete all required fields in Personal Information</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                <span>Add at least 3 work experiences with detailed descriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                <span>List minimum 8-10 relevant skills</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                <span>Include certifications or professional development</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                <span>Showcase projects or portfolio items</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileOptimization;
