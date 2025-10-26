import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Briefcase,
  Plus,
  Upload,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ExternalLink,
  Users,
  FileText,
  Loader2,
  Bell,
  User
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

const ExternalAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  // Safety check: redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login...');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    try {
      setIsLoggingOut(true);
      console.log('Initiating logout...');
      
      // Clear auth state and localStorage
      await logout();
      
      // Additional cleanup - ensure localStorage is cleared
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force navigation with replace to prevent back button issues
      navigate('/login', { replace: true });
      
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Even if logout fails on server, force local cleanup
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force navigation to login
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

    const navigation = [
    {
      name: 'Dashboard',
      href: '/external-admin',
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: 'External Jobs',
      href: '/external-admin/jobs',
      icon: Briefcase
    },
    {
      name: 'Create Job',
      href: '/external-admin/jobs/create',
      icon: Plus
    },
    {
      name: 'Scholarships',
      href: '/external-admin/scholarships',
      icon: Users
    },
    {
      name: 'Create Scholarship',
      href: '/external-admin/scholarships/create',
      icon: Plus
    },
    {
      name: 'Analytics',
      href: '/external-admin/analytics',
      icon: BarChart3
    },
    {
      name: 'Job Templates',
      href: '/external-admin/templates',
      icon: FileText
    },
    {
      name: 'External Sources',
      href: '/external-admin/sources',
      icon: ExternalLink
    },
    {
      name: 'Notifications',
      href: '/external-admin/notifications',
      icon: Bell
    },
    {
      name: 'Profile & Settings',
      href: '/external-admin/profile',
      icon: User
    }
  ];

  const isActivePath = (href, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
  <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TalentSphere</h1>
                <Badge variant="secondary" className="mt-1">External Admin</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || user?.first_name + ' ' + user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href, item.exact);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    isActive
                      ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className="ml-2 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="mr-3 h-5 w-5" />
              )}
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
  <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto lg:ml-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  External Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage external job postings and sources
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:inline-flex">
                <ExternalLink className="h-3 w-3 mr-1" />
                External Source Manager
              </Badge>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExternalAdminLayout;
