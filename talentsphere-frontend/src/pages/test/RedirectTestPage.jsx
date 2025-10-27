import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '../../stores/authStore';
import { useAuthNavigation } from '../../hooks/useAuthNavigation';

const RedirectTestPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { navigateToProtectedRoute, requireAuth } = useAuthNavigation();

  const testRoutes = [
    { path: '/dashboard', label: 'Dashboard', description: 'General dashboard (all authenticated users)' },
    { path: '/profile', label: 'Profile', description: 'User profile page' },
    { path: '/admin', label: 'Admin Dashboard', description: 'Admin only area' },
    { path: '/external-admin', label: 'External Admin', description: 'External admin only area' },
    { path: '/jobs/post', label: 'Post Job', description: 'Employer functionality' },
  { path: '/jobseeker/profile', label: 'Job Seeker Profile', description: 'Job seeker area' },
  ];

  const handleTestRedirect = (path) => {
    navigateToProtectedRoute(path);
  };

  const handleBookmarkTest = () => {
    requireAuth(() => {
      alert('Bookmark action would be performed here!');
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔄 Enhanced Login Redirect Test Page</CardTitle>
          <CardDescription>
            Test the enhanced login redirection system. Try accessing protected routes when logged out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <Alert className="mb-4">
              <AlertDescription className="text-green-600">
                ✅ You are logged in as: <strong>{user?.email}</strong> (Role: <strong>{user?.role}</strong>)
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4">
              <AlertDescription className="text-amber-600">
                ⚠️ You are not logged in. Try clicking the buttons below to test redirect functionality.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-3">🛡️ Protected Route Tests</h3>
              <p className="text-sm text-gray-600 mb-4">
                These buttons will redirect to login if you're not authenticated, then bring you back here after login.
              </p>
              <div className="space-y-2">
                {testRoutes.map((route) => (
                  <div key={route.path}>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => handleTestRedirect(route.path)}
                    >
                      <div>
                        <div className="font-medium">{route.label}</div>
                        <div className="text-xs text-gray-500">{route.description}</div>
                      </div>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">⚡ Action Tests</h3>
              <p className="text-sm text-gray-600 mb-4">
                These simulate user actions that require authentication.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleBookmarkTest}
                >
                  📖 Test Bookmark Action
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigateToProtectedRoute('/jobs/1/apply')}
                >
                  📝 Test Job Application
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigateToProtectedRoute('/applications')}
                >
                  📋 View My Applications
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">📖 How to Test</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>If you're logged in, log out first</li>
              <li>Click any protected route button above</li>
              <li>You'll be redirected to the login page</li>
              <li>After logging in, you should be redirected back to the intended destination</li>
              <li>Test with different user roles to see role-based restrictions</li>
            </ol>
          </div>

          <div className="mt-4 pt-4 border-t">
            <h3 className="text-lg font-semibold mb-3">🔗 Quick Links</h3>
            <div className="flex gap-2 flex-wrap">
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="sm">Register</Button>
              </Link>
              <Link to="/jobs">
                <Button variant="outline" size="sm">Job List</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="sm">Home</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RedirectTestPage;