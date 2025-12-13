import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const AuthDebugPage = () => {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }

    setAuthStatus({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'None',
      hasUser: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
      } : null
    });
  };

  const testBackendAuth = async () => {
    setTesting(true);
    setTestResult(null);

    const token = localStorage.getItem('token');
    
    if (!token) {
      setTestResult({
        success: false,
        message: 'No token found in localStorage',
        action: 'Please login first'
      });
      setTesting(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/complete-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: 'Authentication successful!',
          data: {
            userId: data.user?.id,
            email: data.user?.email,
            sectionsLoaded: Object.keys(data).length
          }
        });
      } else {
        const error = await response.text();
        setTestResult({
          success: false,
          message: `Authentication failed (${response.status})`,
          details: error,
          action: response.status === 401 ? 'Token is invalid or expired. Please login again.' : 'Check backend logs for details'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error',
        details: error.message,
        action: 'Check if backend server is running on port 5001'
      });
    } finally {
      setTesting(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuthStatus();
    setTestResult(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        ← Back
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Authentication Debug</h1>
          <p className="text-gray-600">Check your authentication status and troubleshoot issues</p>
        </div>

        {/* Auth Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {authStatus?.hasToken && authStatus?.hasUser ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Authentication Status
            </CardTitle>
            <CardDescription>Current authentication state in browser</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Token Status</p>
                <p className="text-base flex items-center gap-2">
                  {authStatus?.hasToken ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-600" /> Present ({authStatus.tokenLength} chars)</>
                  ) : (
                    <><XCircle className="w-4 h-4 text-red-600" /> Missing</>
                  )}
                </p>
                {authStatus?.hasToken && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">{authStatus.tokenPreview}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">User Data</p>
                <p className="text-base flex items-center gap-2">
                  {authStatus?.hasUser ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-600" /> Present</>
                  ) : (
                    <><XCircle className="w-4 h-4 text-red-600" /> Missing</>
                  )}
                </p>
              </div>
            </div>

            {authStatus?.user && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">User Information</p>
                <div className="bg-gray-50 p-3 rounded space-y-1 text-sm font-mono">
                  <p><span className="text-gray-600">ID:</span> {authStatus.user.id}</p>
                  <p><span className="text-gray-600">Email:</span> {authStatus.user.email}</p>
                  <p><span className="text-gray-600">Role:</span> {authStatus.user.role}</p>
                  {authStatus.user.name && <p><span className="text-gray-600">Name:</span> {authStatus.user.name}</p>}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={checkAuthStatus} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
              <Button onClick={clearAuthData} variant="outline" size="sm">
                Clear Auth Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backend Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Backend Connection Test</CardTitle>
            <CardDescription>Test if your token works with the backend API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testBackendAuth} disabled={testing || !authStatus?.hasToken}>
              {testing ? 'Testing...' : 'Test Backend Connection'}
            </Button>

            {!authStatus?.hasToken && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No token found. Please login first to test backend connection.
                </AlertDescription>
              </Alert>
            )}

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{testResult.message}</strong>
                  {testResult.details && (
                    <p className="text-sm mt-1 font-mono">{testResult.details}</p>
                  )}
                  {testResult.action && (
                    <p className="text-sm mt-2">
                      <strong>Action:</strong> {testResult.action}
                    </p>
                  )}
                  {testResult.data && (
                    <div className="text-sm mt-2 bg-green-50 p-2 rounded">
                      <p>User ID: {testResult.data.userId}</p>
                      <p>Email: {testResult.data.email}</p>
                      <p>Sections loaded: {testResult.data.sectionsLoaded}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login Page
            </Button>
            <Button onClick={() => navigate('/register')} variant="outline" className="w-full">
              Create New Account
            </Button>
            <Button onClick={() => { clearAuthData(); navigate('/login'); }} variant="outline" className="w-full">
              Clear Data & Login Again
            </Button>
          </CardContent>
        </Card>

        {/* Troubleshooting Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-red-600">Issue: Getting 401 (Unauthorized) errors</strong>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Your token is missing or expired</li>
                  <li>Solution: Login again to get a fresh token</li>
                </ul>
              </div>
              <div>
                <strong className="text-red-600">Issue: Profile page won't load</strong>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Check if backend server is running (should be on port 5001)</li>
                  <li>Try clearing browser cache and cookies</li>
                  <li>Check browser console (F12) for specific errors</li>
                </ul>
              </div>
              <div>
                <strong className="text-green-600">✓ Token exists but test fails</strong>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Token may be expired (typically 24 hours)</li>
                  <li>Use "Clear Data & Login Again" button above</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthDebugPage;
