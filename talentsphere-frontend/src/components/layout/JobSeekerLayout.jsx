import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  BookOpen, 
  Settings,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  Briefcase,
  Bell,
  TrendingUp,
  Sparkles,
  ChevronRight
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

const JobSeekerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const userFullName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';

  // Initialize session manager for job seeker panel
  useSessionManager({
    onSessionExpired: () => {
      console.log('🔒 Job seeker session expired');
    },
    onSessionRefreshed: () => {
      console.log('🔄 Job seeker session refreshed');
    },
    validateInterval: 5 * 60 * 1000, // Check every 5 minutes for job seekers
  });

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/jobseeker/dashboard', 
      icon: LayoutDashboard, 
      current: location.pathname === '/jobseeker/dashboard' || location.pathname === '/dashboard'
    },
    { 
      name: 'My Profile', 
      href: '/jobseeker/profile', 
      icon: User, 
      current: location.pathname === '/jobseeker/profile' 
    },
    { 
      name: 'My Applications', 
      href: '/jobseeker/applications', 
      icon: FileText, 
      current: location.pathname === '/jobseeker/applications' 
    },
    { 
      name: 'CV Builder', 
      href: '/jobseeker/cv-builder', 
      icon: BookOpen, 
      current: location.pathname === '/jobseeker/cv-builder' 
    },
    { 
      name: 'Browse Jobs', 
      href: '/jobs', 
      icon: Briefcase, 
      current: location.pathname === '/jobs' || location.pathname.startsWith('/jobs/') 
    },
    { 
      name: 'Scholarships', 
      href: '/scholarships', 
      icon: TrendingUp, 
      current: location.pathname === '/scholarships' || location.pathname.startsWith('/scholarships/') 
    },
    { 
      name: 'Settings', 
      href: '/jobseeker/settings', 
      icon: Settings, 
      current: location.pathname === '/jobseeker/settings' 
    },
  ];

  const coreNavigation = navigation.slice(0, 4);
  const discoveryNavigation = navigation.slice(4);

  const navItemClass = (isCurrent) =>
    `group relative flex items-center px-3.5 py-3 text-sm font-semibold rounded-2xl border transition-all duration-300 ${
      isCurrent
        ? 'bg-gradient-to-r from-[#1e3a5f] via-[#127a8a] to-[#00A19D] text-white border-transparent shadow-lg shadow-cyan-500/30'
        : 'text-gray-700 bg-white/80 border-gray-100 hover:border-orange-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-teal-50 hover:text-[#1e3a5f] hover:shadow-md hover:-translate-y-[1px]'
    }`;

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

  // Close sidebar after navigation for smoother mobile flow.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Reset mobile sidebar when moving to desktop width.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scrolling while mobile sidebar is open.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

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
      <aside className={`fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[320px] lg:w-72 bg-gradient-to-b from-white via-white to-orange-50/30 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
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
              <span className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-md">AfriTech Opp.</span>
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

          {/* Job Seeker Badge - Enhanced */}
          <div className="px-4 py-4 border-b border-gray-200/70 bg-gradient-to-r from-orange-50 to-teal-50">
            <Badge variant="default" className="w-full justify-center py-2 text-xs font-bold shadow-md bg-gradient-to-r from-[#FF6B35] to-[#00A19D] hover:from-[#FF5722] hover:to-[#008B8B]">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              Job Seeker Dashboard
            </Badge>
          </div>

          {/* Navigation - Enhanced */}
          <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="space-y-2">
              <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]/70">Workspace</p>
              <div className="space-y-1.5">
                {coreNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={navItemClass(item.current)}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className={`mr-3 p-1.5 rounded-xl transition-colors ${
                        item.current
                          ? 'bg-white/20'
                          : 'bg-gray-100 group-hover:bg-orange-100'
                      }`}>
                        <Icon className={`h-5 w-5 transition-colors ${
                          item.current ? 'text-white' : 'text-gray-600 group-hover:text-[#FF6B35]'
                        }`} />
                      </div>
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.current ? (
                        <div className="w-2 h-2 rounded-full bg-white shadow-lg animate-pulse" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#00A19D] transition-colors" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]/70">Explore</p>
              <div className="space-y-1.5">
                {discoveryNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={navItemClass(item.current)}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className={`mr-3 p-1.5 rounded-xl transition-colors ${
                        item.current
                          ? 'bg-white/20'
                          : 'bg-gray-100 group-hover:bg-orange-100'
                      }`}>
                        <Icon className={`h-5 w-5 transition-colors ${
                          item.current ? 'text-white' : 'text-gray-600 group-hover:text-[#FF6B35]'
                        }`} />
                      </div>
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.current ? (
                        <div className="w-2 h-2 rounded-full bg-white shadow-lg animate-pulse" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#00A19D] transition-colors" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Quick Actions - Enhanced */}
          <div className="px-4 py-3 border-t border-gray-200/70 bg-gradient-to-r from-orange-50/50 to-teal-50/50 space-y-2">
            <Link to="/jobs">
              <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF7033] text-white shadow-md hover:shadow-lg transition-all duration-200">
                <Search className="w-4 h-4 mr-2" />
                Find Jobs
              </Button>
            </Link>
            <Link to="/jobseeker/cv-builder">
              <Button 
                variant="outline" 
                className="w-full border-2 border-[#00A19D] text-[#00A19D] hover:bg-[#00A19D] hover:text-white transition-all duration-200"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Build My CV
              </Button>
            </Link>
          </div>

          {/* User section - Enhanced */}
          <div className="border-t border-gray-200/70 p-4 bg-gradient-to-r from-gray-50 to-orange-50/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
              <Avatar className="h-10 w-10 ring-2 ring-orange-100 ring-offset-2">
                <AvatarImage src={user?.profile_picture} />
                <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#00A19D] text-white font-bold">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {userFullName}
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
          <div className="flex items-center justify-between h-16 px-3 sm:px-6 gap-2 relative">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-none">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-orange-50 h-9 w-9 p-0"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                aria-expanded={sidebarOpen}
              >
                <Menu className="h-5 w-5 text-gray-700" />
              </Button>

              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">Job Seeker Dashboard</p>
                <p className="text-[11px] text-gray-500 leading-tight truncate">Manage applications, CV, and profile</p>
              </div>
              
              {/* Search - Enhanced */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search jobs, companies..."
                    className="pl-10 w-56 lg:w-72 border-gray-200 focus:ring-2 focus:ring-[#FF6B35] rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="sm:hidden absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[150px] w-full">
              <p className="text-sm font-semibold text-gray-800 leading-tight truncate">Job Seeker</p>
              <p className="text-[11px] text-gray-500 leading-tight truncate">Dashboard</p>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-3 shrink-0 absolute right-3 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex relative hover:bg-orange-50 rounded-xl h-9 w-9 p-0 sm:h-10 sm:w-10" aria-label="Notifications">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* User menu - Enhanced */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-orange-50 rounded-xl h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3">
                    <Avatar className="h-8 w-8 ring-2 ring-orange-100">
                      <AvatarImage src={user?.profile_picture} />
                      <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#00A19D] text-white font-bold text-xs">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start leading-tight text-left max-w-[140px]">
                      <span className="text-sm font-semibold text-gray-800 truncate w-full">{userFullName}</span>
                      <span className="text-[11px] text-gray-500 truncate w-full">Job Seeker</span>
                    </div>
                    <ChevronDown className="hidden sm:block h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg" sideOffset={5}>
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-medium">{userFullName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/jobseeker/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/jobseeker/settings">Settings</Link>
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
        <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobSeekerLayout;
