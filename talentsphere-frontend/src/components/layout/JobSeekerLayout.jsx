import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  GraduationCap,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import apiService from '../../services/api';

const JobSeekerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profileImage, setProfileImage] = useState('');
  const [profileName, setProfileName] = useState('');

  const resolveUserName = (profileData) => {
    if (!profileData) return 'User';
    return profileData.full_name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'User';
  };

  const resolveProfileImage = (profileData) => {
    if (!profileData) return '';
    return (
      profileData.profile_picture ||
      profileData.avatar_url ||
      profileData.avatar ||
      profileData.image_url ||
      ''
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  };

  const userFullName = profileName || resolveUserName(user);
  const userProfileImage = profileImage || resolveProfileImage(user);

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
      name: 'Career Agent',
      href: '/jobseeker/career-agent',
      icon: FileText,
      current: location.pathname === '/jobseeker/career-agent'
    },
    { 
      name: 'Opportunities',
      href: '/jobs', 
      icon: Briefcase, 
      current: location.pathname === '/jobs' || location.pathname.startsWith('/jobs/') 
    },
    { 
      name: 'Scholarships', 
      href: '/scholarships', 
      icon: GraduationCap,
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
    `group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg border-l-2 transition-colors duration-150 ${
      isCurrent
        ? 'border-[#176b63] bg-[#e9f3f0] text-[#163f3b]'
        : 'border-transparent text-[#566365] hover:border-[#c9dfda] hover:bg-[#f1f6f4] hover:text-[#163f3b]'
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

  // Keep layout identity details in sync with auth store updates.
  useEffect(() => {
    setProfileName(resolveUserName(user));
    setProfileImage(resolveProfileImage(user));
  }, [user]);

  // Fetch latest profile details once so layout reflects newly uploaded avatar immediately.
  useEffect(() => {
    let isMounted = true;

    const refreshLayoutProfile = async () => {
      try {
        const profile = await apiService.getProfile();
        if (!isMounted || !profile) return;

        const latestName = resolveUserName(profile);
        const latestImage = resolveProfileImage(profile);

        setProfileName(latestName);
        setProfileImage(latestImage);
      } catch (error) {
        console.debug('Layout profile refresh skipped:', error?.message || error);
      }
    };

    refreshLayoutProfile();

    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="min-h-screen bg-[#f5f6f3] text-[#202b2d] flex overflow-x-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#202b2d]/35 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[300px] lg:w-64 border-r border-[#dfe5e1] bg-[#fbfcfa] transform transition-transform duration-200 ease-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e3e8e4]">
            <Link to="/jobseeker/dashboard" className="flex items-center gap-3 min-w-0" onClick={() => setSidebarOpen(false)}>
              <img
                src="/logo-192.png"
                alt="AfriTech Opportunities Logo"
                className="h-9 w-9 rounded-lg object-contain"
              />
              <span className="truncate text-sm font-semibold tracking-tight text-[#183c3a]">AfriTech Opportunities</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 p-0 text-[#566365] hover:bg-[#edf2ef]"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="px-5 py-4 border-b border-[#e3e8e4]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b8785]">Job seeker workspace</p>
            <p className="mt-1 text-sm text-[#566365]">Your next move, in one place.</p>
          </div>

          <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="space-y-2">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b8785]">Workspace</p>
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
                      <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        item.current ? 'text-[#176b63]' : 'text-[#7b8785] group-hover:text-[#176b63]'
                      }`} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.current && <span className="h-1.5 w-1.5 rounded-full bg-[#b96143]" aria-hidden="true" />}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b8785]">Explore</p>
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
                      <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        item.current ? 'text-[#176b63]' : 'text-[#7b8785] group-hover:text-[#176b63]'
                      }`} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.current && <span className="h-1.5 w-1.5 rounded-full bg-[#b96143]" aria-hidden="true" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className="border-t border-[#e3e8e4] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto w-full justify-start gap-3 rounded-lg px-2.5 py-2.5 text-left hover:bg-[#edf2ef]">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={userProfileImage} />
                    <AvatarFallback className="bg-[#dcece7] text-[#176b63] font-semibold">
                      {getInitials(userFullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#263536]">{userFullName}</span>
                    <span className="block truncate text-xs text-[#7b8785]">Account settings</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#7b8785]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 rounded-lg border-[#dfe5e1] shadow-lg" sideOffset={8}>
                <DropdownMenuLabel>
                  <div>
                    <p className="text-sm font-medium">{userFullName}</p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
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
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-64">
        <Button
          variant="outline"
          size="sm"
          className="fixed left-4 top-4 z-30 h-9 w-9 p-0 border-[#dfe5e1] bg-[#fbfcfa] text-[#566365] shadow-sm hover:bg-[#edf2ef] lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          aria-expanded={sidebarOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobSeekerLayout;
