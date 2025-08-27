import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import DashboardOverview from '../components/employer/DashboardOverview';
import ApplicationManagement from '../components/employer/ApplicationManagement';

const TestEmployerComponents = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Employer Dashboard Test
          </h1>
          <p className="text-gray-600">
            Testing real backend integration
          </p>
        </div>

        {/* Dashboard Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Overview Component</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardOverview />
          </CardContent>
        </Card>

        {/* Application Management */}
        <Card>
          <CardHeader>
            <CardTitle>Application Management Component</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestEmployerComponents;
