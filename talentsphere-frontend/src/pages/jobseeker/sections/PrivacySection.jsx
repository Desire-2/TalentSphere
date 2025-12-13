import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Shield } from 'lucide-react';

const PrivacySection = ({ data, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>Control who can see your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">Privacy settings coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default PrivacySection;
