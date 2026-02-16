import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  FileText, 
  BarChart3,
  Building2,
  Settings,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  Bell,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '../../stores/authStore';
import { useSessionManager } from '../../hooks/useSessionManager';

const EmployerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Initialize session manager for employer panel
  useSessionManager({
    onSessionExpired: () => {
      console.log('🔒 Employer session expired');
    },
    onSessionRefreshed: () => {
      console.log('🔄 Employer session refreshed');
    },
    validateInterval: 5 * 60 * 1000, // Check every 5 minutes for employers
  });

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/employer/dashboard', 
      icon: LayoutDashboard, 
      current: location.pathname === '/employer/dashboard' || location.pathname === '/dashboard'
    },
    { 
      name: 'My Jobs', 
      href: '/employer/jobs', 
      icon: Briefcase, 
      current: location.pathname.startsWith('/employer/jobs') 
    },
    { 
      name: 'Applications', 
      href: '/employer/applications', 
      icon: FileText, 
      current: location.pathname.startsWith('/employer/applications') 
    },
    { 
      name: 'Candidates', 
      href: '/employer/candidates', 
      icon: Users, 
      current: location.pathname.startsWith('/employer/candidates') 
    },
    { 
      name: 'Company Profile', 
      href: '/employer/company/profile', 
      icon: Building2, 
      current: location.pathname === '/employer/company/profile' 
    },
    { 
      name: 'Analytics', 
      href: '/employer/analytics', 
      icon: BarChart3, 
      current: location.pathname.startsWith('/employer/analytics') 
    },
    { 
      name: 'Settings', 
      href: '/employer/company/settings', 
      icon: Settings, 
      current: location.pathname === '/employer/company/settings' 
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      // Logout function will handle redirect to home page
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure redirect to home even on error
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-teal-50/20 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white via-white to-orange-50/30 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo - Enhanced */}
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
              <span className="text-lg font-black text-white tracking-tight drop-shadow-md">AfriTech Opp.</span>
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

          {/* Employer Badge - Enhanced */}
          <div className="px-4 py-4 border-b border-gray-200/70 bg-gradient-to-r from-orange-50 to-teal-50">
            <Badge variant="default" className="w-full justify-center py-2 text-xs font-bold shadow-md bg-gradient-to-r from-[#FF6B35] to-[#00A19D] hover:from-[#FF5722] hover:to-[#008B8B]">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Employer Dashboard
            </Badge>
          </div>

          {/* Navigation - Enhanced */}
          <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    item.current
                      ? 'bg-gradient-to-r from-[#1e3a5f] to-[#00A19D] text-white shadow-lg shadow-teal-500/50 scale-[1.02]'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-teal-50 hover:text-[#1e3a5f] hover:shadow-md'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`mr-3 p-1.5 rounded-lg transition-colors ${
                    item.current 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 group-hover:bg-orange-100'
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors ${
                      item.current ? 'text-white' : 'text-gray-600 group-hover:text-[#FF6B35]'
                    }`} />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {item.current && (
                    <div className="w-2 h-2 rounded-full bg-white shadow-lg animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Action - Enhanced */}
          <div className="px-4 py-3 border-t border-gray-200/70 bg-gradient-to-r from-orange-50/50 to-teal-50/50">
            <Link to="/employer/jobs/create">
              <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF7033] text-white shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
            </Link>
          </div>

          {/* User section - Enhanced */}
          <div className="border-t border-gray-200/70 p-4 bg-gradient-to-r from-gray-50 to-orange-50/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
              <Avatar className="h-10 w-10 ring-2 ring-orange-100 ring-offset-2">
                <AvatarImage src={user?.profile_picture} />
                <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#00A19D] text-white font-bold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - Adjust for fixed sidebar */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
        {/* Top bar - Sticky */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/70">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-orange-50"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-gray-700" />
              </Button>
              
              {/* Search - Enhanced */}
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search jobs, candidates..."
                    className="pl-10 w-72 border-gray-200 focus:ring-2 focus:ring-[#FF6B35] rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative hover:bg-orange-50 rounded-xl">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* User menu - Enhanced */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-orange-50 rounded-xl px-3">
                    <Avatar className="h-8 w-8 ring-2 ring-orange-100">
                      <AvatarImage src={user?.profile_picture} />
                      <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#00A19D] text-white font-bold text-xs">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg" sideOffset={5}>
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-medium">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/employer/company/profile">Company Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/employer/company/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/">Go to Main Site</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50 rounded-lg font-medium">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content - Enhanced */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployerLayout;
