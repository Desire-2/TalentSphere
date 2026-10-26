import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import config from './config/environment.js';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ExternalAdminLayout from './components/layout/ExternalAdminLayout';
import JobSeekerLayout from './components/layout/JobSeekerLayout';
import EmployerLayout from './components/layout/EmployerLayout';
import NotificationProvider from './components/notifications/NotificationProviderReal';
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
import Profile from './pages/Profile';
import CompanyProfile from './pages/CompanyProfile';
import CompanyDetail from './pages/CompanyDetail';
import Companies from './pages/Companies';

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const JobManagement = lazy(() => import('./pages/admin/JobManagement'));
const EnhancedJobManagement = lazy(() => import('./pages/admin/EnhancedJobManagement'));
const CompanyManagement = lazy(() => import('./pages/admin/CompanyManagement'));
const AdminScholarshipManagement = lazy(() => import('./pages/admin/AdminScholarshipManagement'));
const AdminCleanupManagement = lazy(() => import('./pages/admin/AdminCleanupManagement'));
const NotificationManagement = lazy(() => import('./pages/admin/NotificationManagement'));
const RevenueAnalytics = lazy(() => import('./pages/admin/RevenueAnalytics'));
const UserAnalytics = lazy(() => import('./pages/admin/UserAnalytics'));
const SystemHealth = lazy(() => import('./pages/admin/SystemHealth'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAdsManagement = lazy(() => import('./pages/admin/AdminAdsManagement'));

// External Admin Pages
const ExternalAdminDashboard = lazy(() => import('./pages/external-admin/ExternalAdminDashboard'));
const ExternalJobsManagement = lazy(() => import('./pages/external-admin/ExternalJobsManagement'));
const CreateExternalJob = lazy(() => import('./pages/external-admin/CreateExternalJob'));
const EditExternalJob = lazy(() => import('./pages/external-admin/EditExternalJob'));
const ExternalJobAnalytics = lazy(() => import('./pages/external-admin/ExternalJobAnalytics'));
const ExternalJobTemplates = lazy(() => import('./pages/external-admin/ExternalJobTemplates'));
const ExternalAdminProfile = lazy(() => import('./pages/external-admin/ExternalAdminProfile'));
const ScholarshipsManagement = lazy(() => import('./pages/external-admin/ScholarshipsManagement'));
const CreateScholarship = lazy(() => import('./pages/external-admin/CreateScholarship'));
const EditScholarship = lazy(() => import('./pages/external-admin/EditScholarship'));

// Public Scholarship Pages
const ScholarshipList = lazy(() => import('./pages/scholarships/ScholarshipList'));
const ScholarshipDetail = lazy(() => import('./pages/scholarships/ScholarshipDetail'));
const ScholarshipApplication = lazy(() => import('./pages/scholarships/ScholarshipApplication'));
const ApplicationSuccess = lazy(() => import('./pages/scholarships/ApplicationSuccess'));

// Job Pages
const JobList = lazy(() => import('./pages/jobs/JobList'));
const JobDetails = lazy(() => import('./pages/jobs/JobDetails'));
const PostJob = lazy(() => import('./pages/jobs/PostJob'));
const JobApply = lazy(() => import('./pages/jobs/JobApply'));
const TestApplyRoute = lazy(() => import('./pages/TestApplyRoute'));

// Application Pages
const MyApplications = lazy(() => import('./pages/applications/MyApplications'));

// Job Seeker Pages
const EnhancedJobSeekerProfile = lazy(() => import('./pages/jobseeker/EnhancedProfile'));
const ProfileSettings = lazy(() => import('./pages/jobseeker/ProfileSettings'));
const ApplicationsDashboard = lazy(() => import('./pages/jobseeker/ApplicationsDashboard'));
const CareerAgent = lazy(() => import('./pages/jobseeker/CareerAgent'));

// Company Pages
const CompanyProfileManagement = lazy(() => import('./pages/company/CompanyProfileManagement'));
const CompanySettings = lazy(() => import('./pages/company/CompanySettings'));

// Ads/Advertising Pages
const AdsDashboard = lazy(() => import('./pages/ads/AdsDashboard'));
const CreateCampaignWizard = lazy(() => import('./pages/ads/CreateCampaignWizard'));
const CampaignDetail = lazy(() => import('./pages/ads/CampaignDetail'));
const CreditsBilling = lazy(() => import('./pages/ads/CreditsBilling'));

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import ExternalAdminRoute from './components/auth/ExternalAdminRoute';
import AnyAdminRoute from './components/auth/AnyAdminRoute';
import AuthInitializer from './components/auth/AuthInitializer';
import EmployerOnboardingRoute from './components/auth/EmployerOnboardingRoute';
const TestEmployerComponents = lazy(() => import('./pages/TestEmployerComponents'));
const EmployerOnboarding = lazy(() => import('./pages/employer/EmployerOnboarding'));

// Analytics
import GoogleAnalytics from './components/analytics/GoogleAnalytics';
import FloatingWhatsAppButton from './components/common/FloatingWhatsAppButton';

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
      <NotificationProvider>
        <Router>
        <GoogleAnalytics />
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-600">
            Loading…
          </div>
        }>
        <Routes>
          {/* Public routes with layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="jobs" element={<JobList />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="scholarships" element={<ScholarshipList />} />
            <Route path="scholarships/:id" element={<ScholarshipDetail />} />
            {/* Scholarship application routes - protected */}
            <Route path="scholarships/:id/apply" element={
              <ProtectedRoute requiredRole="job_seeker">
                <ScholarshipApplication />
              </ProtectedRoute>
            } />
            <Route path="scholarships/:id/application-success" element={
              <ProtectedRoute requiredRole="job_seeker">
                <ApplicationSuccess />
              </ProtectedRoute>
            } />
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
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/test-employer" element={<TestEmployerComponents />} />

          {/* Common Dashboard Route - automatically routes to correct dashboard based on user role */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Protected user routes with layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="profile" element={<Profile />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="my-applications" element={<MyApplications />} />
          </Route>

          {/* Employer Routes with EmployerLayout */}
          <Route path="/employer" element={
            <ProtectedRoute requiredRole="employer">
              <EmployerOnboardingRoute>
                <EmployerLayout />
              </EmployerOnboardingRoute>
            </ProtectedRoute>
          }>
            <Route path="onboarding" element={<EmployerOnboarding />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="company-profile" element={<CompanyProfile />} />
            <Route path="company/profile" element={<CompanyProfileManagement />} />
            <Route path="company/settings" element={<CompanySettings />} />
            <Route path="jobs/post" element={<PostJob />} />
            <Route path="jobs/create" element={<PostJob />} />
            {/* Advertising Routes */}
            <Route path="ads" element={<AdsDashboard />} />
            <Route path="ads/new" element={<CreateCampaignWizard />} />
            <Route path="ads/:campaignId" element={<CampaignDetail />} />
            <Route path="ads/billing/credits" element={<CreditsBilling />} />
            <Route path="*" element={<Navigate to="/employer/dashboard" replace />} />
          </Route>

          {/* Job Seeker Routes with JobSeekerLayout */}
          <Route path="/jobseeker" element={
            <ProtectedRoute requiredRole="job_seeker">
              <JobSeekerLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<EnhancedJobSeekerProfile />} />
            <Route path="settings" element={<ProfileSettings />} />
            <Route path="applications" element={<ApplicationsDashboard />} />
            <Route path="career-agent" element={<CareerAgent />} />
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
            <Route path="scholarships" element={<AdminScholarshipManagement />} />
            <Route path="scholarships/create" element={<CreateScholarship />} />
            <Route path="scholarships/:id/edit" element={<EditScholarship />} />
            <Route path="companies" element={<CompanyManagement />} />
            <Route path="cleanup" element={<AdminCleanupManagement />} />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="ads" element={<AdminAdsManagement />} />
            <Route path="analytics" element={<RevenueAnalytics />} />
            <Route path="user-analytics" element={<UserAnalytics />} />
            <Route path="system-health" element={<SystemHealth />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* External Admin routes with external admin layout */}
          <Route path="/external-admin" element={
            <ExternalAdminRoute>
              <ExternalAdminLayout />
            </ExternalAdminRoute>
          }>
            <Route index element={<ExternalAdminDashboard />} />
            <Route path="jobs" element={<ExternalJobsManagement />} />
            <Route path="jobs/create" element={<CreateExternalJob />} />
            <Route path="jobs/:id/edit" element={<EditExternalJob />} />
            <Route path="scholarships" element={<ScholarshipsManagement />} />
            <Route path="scholarships/create" element={<CreateScholarship />} />
            <Route path="scholarships/:id/edit" element={<EditScholarship />} />
            <Route path="analytics" element={<ExternalJobAnalytics />} />
            <Route path="templates" element={<ExternalJobTemplates />} />
            <Route path="profile" element={<ExternalAdminProfile />} />
          </Route>

          {/* 404 - redirect all unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        <FloatingWhatsAppButton />
        </Router>
      </NotificationProvider>
      <Toaster />
    </AuthInitializer>
  );
}

export default App;
