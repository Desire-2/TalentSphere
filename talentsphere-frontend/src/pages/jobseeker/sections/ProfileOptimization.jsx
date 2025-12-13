import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

const ProfileOptimization = ({ completeness = 0, keywords = [], tips = [] }) => {
  const getCompletenessColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletenessMessage = (score) => {
    if (score >= 80) return 'Excellent! Your profile is well-optimized.';
    if (score >= 50) return 'Good progress! Add more details to improve.';
    return 'Let\'s build a strong profile together.';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Profile Completeness
          </CardTitle>
          <CardDescription>Your profile strength score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-3xl font-bold ${getCompletenessColor(completeness)}`}>
                {completeness}%
              </span>
              <span className="text-sm text-gray-600">{getCompletenessMessage(completeness)}</span>
            </div>
            <Progress value={completeness} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Profile Keywords
          </CardTitle>
          <CardDescription>Top skills and terms in your profile</CardDescription>
        </CardHeader>
        <CardContent>
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">{keyword}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No keywords detected yet. Add more details to your profile.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Recommendations
          </CardTitle>
          <CardDescription>Tips to improve your profile</CardDescription>
        </CardHeader>
        <CardContent>
          {tips.length > 0 ? (
            <ul className="space-y-3">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Great job! No recommendations at this time.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileOptimization;
