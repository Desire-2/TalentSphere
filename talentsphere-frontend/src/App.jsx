import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import config from './config/environment.js';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/Profile';
import CompanyProfile from './pages/CompanyProfile';
import CompanyDetail from './pages/CompanyDetail';
import Companies from './pages/Companies';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import JobManagement from './pages/admin/JobManagement';
import EnhancedJobManagement from './pages/admin/EnhancedJobManagement';
import CompanyManagement from './pages/admin/CompanyManagement';
import RevenueAnalytics from './pages/admin/RevenueAnalytics';
import UserAnalytics from './pages/admin/UserAnalytics';
import SystemHealth from './pages/admin/SystemHealth';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSettings from './pages/admin/AdminSettings';

// Job Pages
import JobList from './pages/jobs/JobList';
import JobDetails from './pages/jobs/JobDetails';
import PostJob from './pages/jobs/PostJob';
import JobApply from './pages/jobs/JobApply';
import TestApplyRoute from './pages/TestApplyRoute';

// Application Pages
import MyApplications from './pages/applications/MyApplications';

// Job Seeker Pages
import JobSeekerProfile from './pages/jobseeker/JobSeekerProfile';
import ProfileSettings from './pages/jobseeker/ProfileSettings';
import ApplicationsDashboard from './pages/jobseeker/ApplicationsDashboard';

// Company Pages
import CompanyProfileManagement from './pages/company/CompanyProfileManagement';
import CompanySettings from './pages/company/CompanySettings';

// Notifications
import NotificationsPage from './pages/NotificationsPage';
import NotificationDemo from './components/notifications/NotificationDemo';
import NotificationTestPage from './pages/NotificationTestPage';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AuthInitializer from './components/auth/AuthInitializer';
import TestEmployerComponents from './pages/TestEmployerComponents';

function App() {
  // Validate environment configuration on app startup
  useEffect(() => {
    const isValidEnvironment = config.validateEnvironment();
    if (!isValidEnvironment && config.isDevelopment) {
      console.warn('⚠️ Some environment variables are missing. Check .env file.');
    }
    
    if (config.FEATURES.ENABLE_DEBUG_LOGS) {
      console.log(`🚀 ${config.APP.NAME} v${config.APP.VERSION} starting in ${config.APP.ENVIRONMENT} mode`);
    }
  }, []);

  return (
    <AuthInitializer>
      <Router>
        <Routes>
            {/* Public routes with layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="jobs" element={<JobList />} />
              <Route path="jobs/:id" element={<JobDetails />} />
              <Route path="test-notification" element={<NotificationTestPage />} />
              {/* Job application route - protected and nested properly */}
              <Route path="jobs/:id/apply" element={
                <ProtectedRoute requiredRole="job_seeker">
                  <JobApply />
                </ProtectedRoute>
              } />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/:id" element={<CompanyDetail />} />
            </Route>

            {/* Auth routes (no layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/test-employer" element={<TestEmployerComponents />} />

            {/* Protected user routes with layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="company-profile" element={<CompanyProfile />} />
              <Route path="applications" element={<MyApplications />} />
              <Route path="my-applications" element={<MyApplications />} />
              
              {/* Job Seeker Routes */}
              <Route path="jobseeker/profile" element={<JobSeekerProfile />} />
              <Route path="jobseeker/settings" element={<ProfileSettings />} />
              <Route path="jobseeker/applications" element={<ApplicationsDashboard />} />
              
              {/* Company/Employer Routes */}
              <Route path="company/profile" element={<CompanyProfileManagement />} />
              <Route path="company/settings" element={<CompanySettings />} />
              
              <Route path="jobs/post" element={<PostJob />} />
              <Route path="employer/jobs/create" element={<PostJob />} />
              <Route path="featured-ads" element={
                <div className="container mx-auto px-4 py-20 text-center">
                  <h1 className="text-4xl font-bold mb-4">Featured Ads</h1>
                  <p className="text-muted-foreground">Coming soon in the next phase!</p>
                </div>
              } />
              <Route path="payment" element={
                <div className="container mx-auto px-4 py-20 text-center">
                  <h1 className="text-4xl font-bold mb-4">Payment</h1>
                  <p className="text-muted-foreground">Coming soon in the next phase!</p>
                </div>
              } />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="notifications/demo" element={<NotificationDemo />} />
              <Route path="recommendations" element={
                <div className="container mx-auto px-4 py-20 text-center">
                  <h1 className="text-4xl font-bold mb-4">Recommendations</h1>
                  <p className="text-muted-foreground">Coming soon in the next phase!</p>
                </div>
              } />
            </Route>

          {/* Admin routes with admin layout */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="jobs" element={<JobManagement />} />
            <Route path="jobs-enhanced" element={<EnhancedJobManagement />} />
            <Route path="companies" element={<CompanyManagement />} />
            <Route path="analytics" element={<RevenueAnalytics />} />
            <Route path="user-analytics" element={<UserAnalytics />} />
            <Route path="system-health" element={<SystemHealth />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 Page */}
          <Route path="*" element={
            <Layout>
              <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
                <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
                <a href="/" className="text-primary hover:underline">Go back home</a>
              </div>
            </Layout>
          } />
        </Routes>
      </Router>
      <Toaster />
    </AuthInitializer>
  );
}

export default App;