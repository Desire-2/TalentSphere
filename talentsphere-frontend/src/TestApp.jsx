import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardOverview from './components/employer/DashboardOverview';
import ApplicationManagement from './components/employer/ApplicationManagement';

// Simple test app to verify components work
const TestApp = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <div>
                <h1 className="text-3xl font-bold mb-8">Employer Dashboard</h1>
                <DashboardOverview />
              </div>
            } />
            <Route path="/applications" element={
              <div>
                <h1 className="text-3xl font-bold mb-8">Application Management</h1>
                <ApplicationManagement />
              </div>
            } />
          </Routes>
          
          {/* Navigation */}
          <div className="fixed bottom-4 right-4 flex gap-2">
            <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Dashboard
            </a>
            <a href="/applications" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Applications
            </a>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default TestApp;
