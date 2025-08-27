import React from 'react';
import { useAuthStore } from '../stores/authStore';
import EmployerDashboard from './EmployerDashboard';
import JobSeekerDashboard from './JobSeekerDashboard';

const Dashboard = () => {
  const { user } = useAuthStore();

  // Route to appropriate dashboard based on user role
  if (user?.role === 'employer') {
    return <EmployerDashboard />;
  }

  if (user?.role === 'job_seeker') {
    return <JobSeekerDashboard />;
  }

  // Default fallback for other roles or loading state
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to TalentSphere</h1>
      <p className="text-muted-foreground mb-8">
        Please complete your profile setup to access your personalized dashboard.
      </p>
    </div>
  );
};

export default Dashboard;

