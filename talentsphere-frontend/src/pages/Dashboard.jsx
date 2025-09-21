import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import EmployerDashboard from './EmployerDashboard';
import JobSeekerDashboard from './JobSeekerDashboard';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect admin users to their respective dashboards
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user?.role === 'external_admin') {
      navigate('/external-admin', { replace: true });
    }
  }, [user?.role, navigate]);

  // Route to appropriate dashboard based on user role
  if (user?.role === 'employer') {
    return <EmployerDashboard />;
  }

  if (user?.role === 'job_seeker') {
    return <JobSeekerDashboard />;
  }

  // For admin and external_admin, show loading while redirecting
  if (user?.role === 'admin' || user?.role === 'external_admin') {
    return (
  <div className="max-w-3xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-16 sm:py-20 text-center">
        <h1 className="text-2xl font-semibold mb-4">Redirecting to your dashboard...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // Default fallback for other roles or loading state
  return (
  <div className="max-w-3xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-16 sm:py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to TalentSphere</h1>
      <p className="text-muted-foreground mb-8">
        Please complete your profile setup to access your personalized dashboard.
      </p>
    </div>
  );
};

export default Dashboard;

