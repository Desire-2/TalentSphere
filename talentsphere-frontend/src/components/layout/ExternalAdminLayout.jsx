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
  User
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSessionManager } from '../../hooks/useSessionManager';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

const ExternalAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  // Initialize session manager for external admin panel
  useSessionManager({
    onSessionExpired: () => {
      console.log('🔒 External admin session expired');
    },
    onSessionRefreshed: () => {
      console.log('🔄 External admin session refreshed');
    },
    validateInterval: 3 * 60 * 1000, // Check every 3 minutes for external admin
  });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-teal-50/20 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white via-white to-orange-50/30 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header - Enhanced */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/70 bg-gradient-to-r from-[#1e3a5f] via-[#00A19D] to-[#1e3a5f]">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 relative group">
                <div className="absolute inset-0 bg-white rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <img 
                  src="/logo-192.png" 
                  alt="AfriTech Opportunities Logo" 
                  className="relative w-11 h-11 rounded-xl object-contain shadow-lg group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight drop-shadow-md">AfriTech Opp.</h1>
                <Badge variant="secondary" className="mt-0.5 text-xs bg-white/90 text-[#FF6B35] font-bold px-2 py-0.5">External Admin</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User info - Enhanced */}
          <div className="px-4 py-4 border-b border-gray-200/70 bg-gradient-to-r from-orange-50 to-teal-50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-[#FF6B35] to-[#00A19D] rounded-full flex items-center justify-center shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.full_name || user?.first_name + ' ' + user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Enhanced */}
          <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href, item.exact);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-[#1e3a5f] to-[#00A19D] text-white shadow-lg shadow-teal-500/50 scale-[1.02]"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-teal-50 hover:text-[#1e3a5f] hover:shadow-md"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={cn(
                    "mr-3 p-1.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-white/20" 
                      : "bg-gray-100 group-hover:bg-orange-100"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-white" : "text-gray-600 group-hover:text-[#FF6B35]"
                    )} />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className="ml-2 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-white shadow-lg animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer - Enhanced */}
          <div className="p-4 border-t border-gray-200/70 bg-gradient-to-r from-gray-50 to-orange-50/50">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-semibold transition-all duration-200"
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
      </aside>

      {/* Main content - Adjust for fixed sidebar */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
        {/* Top bar - Enhanced */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/70">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-orange-50"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#00A19D] bg-clip-text text-transparent">
                  External Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Manage external job postings and sources
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="hidden sm:inline-flex border-orange-200 text-[#FF6B35] bg-orange-50 font-semibold px-3 py-1">
                <ExternalLink className="h-3 w-3 mr-1" />
                External Source Manager
              </Badge>
            </div>
          </div>
        </header>

        {/* Page content - Enhanced */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExternalAdminLayout;
