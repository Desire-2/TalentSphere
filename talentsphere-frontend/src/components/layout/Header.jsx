import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Briefcase, 
  Search,
  MessageSquare,
  Zap,
  Star,
  Shield,
  ChevronDown,
  Building2,
  Plus,
  GraduationCap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getInitials } from '../../utils/helpers';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const { user, isAuthenticated, logout, getTokenExpiration } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const userFullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  const roleLabel = user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Handle scroll effect for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu whenever route changes.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Keep menu state in sync with viewport transitions.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scroll when the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Monitor token expiration and show warnings
  useEffect(() => {
    if (!isAuthenticated) {
      setSessionWarning(false);
      return;
    }

    const checkTokenExpiration = () => {
      const expiration = getTokenExpiration();
      if (!expiration) return;

      const now = Date.now();
      const timeUntilExpiry = expiration - now;
      const fiveMinutes = 5 * 60 * 1000;

      // Show warning if token expires in less than 5 minutes
      if (timeUntilExpiry > 0 && timeUntilExpiry < fiveMinutes && !sessionWarning) {
        setSessionWarning(true);
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        
        toast.warning('Session Expiring Soon', {
          description: `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work.`,
          duration: 10000,
          icon: <AlertCircle className="w-5 h-5" />,
        });
      }
    };

    // Check immediately and then every minute
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getTokenExpiration, sessionWarning]);

  // Listen for session expired events from API
  useEffect(() => {
    const handleSessionExpired = (event) => {
      toast.error('Session Expired', {
        description: event.detail?.message || 'Your session has expired. Please login again.',
        duration: 5000,
        icon: <AlertCircle className="w-5 h-5" />,
      });
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-lg border-b border-white/20 shadow-lg' 
        : 'bg-white/80 backdrop-blur-sm border-b border-gray-100'
    }`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1BA398]/10 via-transparent to-[#FF6B35]/10 opacity-60 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between gap-2 min-h-[60px] md:min-h-[68px]">
          {/* Enhanced Logo */}
          <div className="flex items-center py-2 sm:py-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
              <div className="relative flex-shrink-0">
                <img 
                  src="/logo-192.png" 
                  alt="AfriTech Opportunities Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg object-contain shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl group-hover:drop-shadow-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#1BA398] to-[#FF6B35] rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#001F3F] via-[#1BA398] to-[#FF6B35] group-hover:from-[#1BA398] group-hover:to-[#FF6B35] transition-colors duration-300 leading-tight">
                  AfriTech Opp.
                </span>
                <span className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 font-medium -mt-0.5 leading-tight">Jobs & Scholarships</span>
              </div>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1">
            <Link 
              to="/jobs" 
              className="group relative px-2.5 md:px-3 lg:px-4 py-2 rounded-xl text-xs md:text-sm text-gray-700 hover:text-[#1BA398] font-medium transition-all duration-300 hover:bg-[#1BA398]/10"
            >
              <span className="relative z-10 flex items-center space-x-1">
                <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Find Jobs</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#1BA398]/0 to-[#FF6B35]/0 group-hover:from-[#1BA398]/10 group-hover:to-[#FF6B35]/10 rounded-xl transition-all duration-300"></div>
            </Link>
            <Link 
              to="/companies" 
              className="group relative px-2.5 md:px-3 lg:px-4 py-2 rounded-xl text-xs md:text-sm text-gray-700 hover:text-[#1BA398] font-medium transition-all duration-300 hover:bg-[#1BA398]/10"
            >
              <span className="relative z-10 flex items-center space-x-1">
                <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Companies</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#1BA398]/0 to-[#FF6B35]/0 group-hover:from-[#1BA398]/10 group-hover:to-[#FF6B35]/10 rounded-xl transition-all duration-300"></div>
            </Link>
            <Link 
              to="/scholarships" 
              className="group relative px-2.5 md:px-3 lg:px-4 py-2 rounded-xl text-xs md:text-sm text-gray-700 hover:text-[#FF6B35] font-medium transition-all duration-300 hover:bg-[#FF6B35]/10"
            >
              <span className="relative z-10 flex items-center space-x-1">
                <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Scholarships</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/0 to-[#1BA398]/0 group-hover:from-[#FF6B35]/10 group-hover:to-[#1BA398]/10 rounded-xl transition-all duration-300"></div>
            </Link>
            {isAuthenticated && user?.role === 'employer' && (
              <Link 
                to="/post-job" 
                className="group relative px-2.5 md:px-3 lg:px-4 py-2 rounded-xl text-xs md:text-sm text-gray-700 hover:text-[#FF6B35] font-medium transition-all duration-300 hover:bg-[#FF6B35]/10"
              >
                <span className="relative z-10 flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Post Job</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/0 to-[#1BA398]/0 group-hover:from-[#FF6B35]/10 group-hover:to-[#1BA398]/10 rounded-xl transition-all duration-300"></div>
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="group relative px-2.5 md:px-3 lg:px-4 py-2 rounded-xl text-xs md:text-sm text-gray-700 hover:text-[#1BA398] font-medium transition-all duration-300 hover:bg-[#1BA398]/10"
              >
                <span className="relative z-10 flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Admin</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#1BA398]/0 to-[#FF6B35]/0 group-hover:from-[#1BA398]/10 group-hover:to-[#FF6B35]/10 rounded-xl transition-all duration-300"></div>
              </Link>
            )}
            {isAuthenticated && user?.role === 'external_admin' && (
              <Link 
                to="/external-admin" 
                  className="group relative px-4 py-2 rounded-xl text-gray-700 hover:text-[#FF6B35] font-medium transition-all duration-300 hover:bg-[#FF6B35]/10"
              >
                <span className="relative z-10 flex items-center space-x-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>Manage Scholarships</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/0 to-[#1BA398]/0 group-hover:from-[#FF6B35]/10 group-hover:to-[#1BA398]/10 rounded-xl transition-all duration-300"></div>
              </Link>
            )}
          </nav>

          {/* Enhanced Right side */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                {/* Enhanced Search */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden xl:flex h-9 w-9 rounded-xl hover:bg-[#1BA398]/20 hover:text-[#1BA398] transition-all duration-300 hover:scale-105"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </Button>

                {/* Enhanced Messages */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex h-9 w-9 rounded-xl hover:bg-[#FF6B35]/20 hover:text-[#FF6B35] transition-all duration-300 hover:scale-105"
                  aria-label="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>

                {/* Enhanced User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 px-1.5 sm:px-2.5 rounded-xl hover:bg-[#FF6B35]/10 transition-all duration-300 group">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                          <AvatarImage src={user?.profile_picture} alt={user?.first_name} />
                          <AvatarFallback className="bg-gradient-to-br from-[#1BA398] to-[#FF6B35] text-white font-semibold">
                            {getInitials(user?.first_name, user?.last_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="hidden xl:flex flex-col items-start leading-tight text-left max-w-[140px]">
                          <span className="text-sm font-semibold text-gray-800 truncate w-full">{userFullName || 'Account'}</span>
                          {roleLabel && <span className="text-[11px] text-gray-500 truncate w-full">{roleLabel}</span>}
                        </div>

                        <ChevronDown className="hidden sm:block w-4 h-4 text-gray-500 group-hover:text-[#FF6B35] transition-colors duration-300" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-[70vh] overflow-y-auto bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-2" align="end" forceMount>
                    {/* Enhanced User Info */}
                    <div className="flex items-center justify-start gap-3 p-3 bg-gradient-to-r from-[#1BA398]/10 to-[#FF6B35]/10 rounded-xl mb-2">
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-lg">
                        <AvatarImage src={user?.profile_picture} alt={user?.first_name} />
                        <AvatarFallback className="bg-gradient-to-br from-[#1BA398] to-[#FF6B35] text-white font-semibold">
                          {getInitials(user?.first_name, user?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-semibold text-gray-900">{userFullName || 'User'}</p>
                        <p className="text-sm text-gray-600 truncate max-w-[160px]">
                          {user?.email}
                        </p>
                        {user?.role && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-[#1BA398]/20 to-[#FF6B35]/20 text-[#1BA398] w-fit">
                            {roleLabel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Session Status Indicator */}
                    {(() => {
                      const expiration = getTokenExpiration();
                      if (!expiration) return null;
                      
                      const timeUntilExpiry = expiration - Date.now();
                      const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
                      const hoursLeft = Math.floor(minutesLeft / 60);
                      
                      let statusColor = 'bg-green-100 text-green-700';
                      let statusText = 'Session Active';
                      let statusIcon = <RefreshCw className="w-3 h-3" />;
                      
                      if (minutesLeft < 5) {
                        statusColor = 'bg-red-100 text-red-700';
                        statusText = `Expires in ${minutesLeft}m`;
                        statusIcon = <AlertCircle className="w-3 h-3" />;
                      } else if (minutesLeft < 30) {
                        statusColor = 'bg-yellow-100 text-yellow-700';
                        statusText = `Expires in ${minutesLeft}m`;
                        statusIcon = <AlertCircle className="w-3 h-3" />;
                      } else if (hoursLeft < 2) {
                        statusText = `${minutesLeft}m remaining`;
                      } else {
                        statusText = `${hoursLeft}h remaining`;
                      }
                      
                      return (
                        <div className={`flex items-center justify-center gap-1 px-2 py-1 mx-2 mb-2 rounded-lg text-xs font-medium ${statusColor}`}>
                          {statusIcon}
                          <span>{statusText}</span>
                        </div>
                      );
                    })()}
                    
                    <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <DropdownMenuItem asChild className="rounded-xl hover:bg-[#1BA398]/10 hover:text-[#1BA398] transition-all duration-200 cursor-pointer">
                      <Link to="/dashboard" className="flex items-center px-3 py-2">
                        <User className="mr-3 h-4 w-4" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* Job Seeker Menu Items */}
                    {user?.role === 'job_seeker' && (
                      <>
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-[#1BA398]/10 hover:text-[#1BA398] transition-all duration-200 cursor-pointer">
                          <Link to="/jobseeker/profile" className="flex items-center px-3 py-2">
                            <User className="mr-3 h-4 w-4" />
                            <span className="font-medium">My Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-[#FF6B35]/10 hover:text-[#FF6B35] transition-all duration-200 cursor-pointer">
                          <Link to="/jobseeker/applications" className="flex items-center px-3 py-2">
                            <Briefcase className="mr-3 h-4 w-4" />
                            <span className="font-medium">My Applications</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {/* Employer Menu Items */}
                    {user?.role === 'employer' && (
                      <>
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-[#1BA398]/10 hover:text-[#1BA398] transition-all duration-200 cursor-pointer">
                          <Link to="/employer/company/profile" className="flex items-center px-3 py-2">
                            <Building2 className="mr-3 h-4 w-4" />
                            <span className="font-medium">Company Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-[#FF6B35]/10 hover:text-[#FF6B35] transition-all duration-200 cursor-pointer">
                          <Link to="/jobs/post" className="flex items-center px-3 py-2">
                            <Plus className="mr-3 h-4 w-4" />
                            <span className="font-medium">Post Job</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem asChild className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200 cursor-pointer">
                      <Link to={
                        user?.role === 'job_seeker' ? '/jobseeker/settings' : 
                        user?.role === 'employer' ? '/company/settings' : 
                        '/profile'
                      } className="flex items-center px-3 py-2">
                        <Settings className="mr-3 h-4 w-4" />
                        <span className="font-medium">Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <DropdownMenuItem onClick={handleLogout} className="rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center px-3 py-2 w-full">
                        <LogOut className="mr-3 h-4 w-4" />
                        <span className="font-medium">Sign Out</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  asChild 
                  className="h-10 rounded-xl bg-white/90 border border-[#1BA398]/30 text-[#1BA398] hover:bg-[#1BA398]/10 hover:text-[#1BA398] transition-all duration-300 font-semibold px-3 sm:px-3.5 shadow-sm"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="h-10 bg-gradient-to-r from-[#1BA398] via-[#0a2847] to-[#FF6B35] hover:from-[#158b7e] hover:via-[#072a5e] hover:to-[#e55a24] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-3 sm:px-4 ring-1 ring-[#FF6B35]/30"
                >
                  <Link to="/register">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>Get Started</span>
                    </span>
                  </Link>
                </Button>
              </>
            )}

            {/* Enhanced Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-9 w-9 rounded-xl hover:bg-gray-50 transition-all duration-300 bg-white/95 border border-gray-200 text-gray-700 shadow-sm"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/70 animate-slideDown">
            <div className="py-3 px-2.5 sm:px-3 bg-gradient-to-br from-white/95 to-blue-50/70 backdrop-blur-md rounded-b-2xl border border-white/20 shadow-xl max-h-[calc(100vh-72px)] overflow-y-auto">
              {isAuthenticated && (
                <div className="flex items-center gap-3 p-2.5 mb-2 rounded-xl bg-white/80 border border-gray-100">
                  <Avatar className="h-9 w-9 ring-2 ring-white shadow-md">
                    <AvatarImage src={user?.profile_picture} alt={user?.first_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {getInitials(user?.first_name, user?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userFullName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              )}

              <nav className="flex flex-col space-y-1">
                <Link 
                  to="/jobs" 
                  className="group flex items-center space-x-3 px-3 py-2.5 mx-0.5 rounded-lg text-gray-700 hover:text-[#1BA398] font-medium transition-all duration-300 hover:bg-[#1BA398]/10 text-sm"
                >
                  <Search className="w-4 h-4 flex-shrink-0" />
                  <span>Find Jobs</span>
                </Link>
                <Link 
                  to="/companies" 
                  className="group flex items-center space-x-3 px-3 py-2.5 mx-0.5 rounded-lg text-gray-700 hover:text-[#1BA398] font-medium transition-all duration-300 hover:bg-[#1BA398]/10 text-sm"
                >
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span>Companies</span>
                </Link>
                <Link 
                  to="/scholarships" 
                  className="group flex items-center space-x-3 px-3 py-2.5 mx-0.5 rounded-lg text-gray-700 hover:text-[#FF6B35] font-medium transition-all duration-300 hover:bg-[#FF6B35]/10 text-sm"
                >
                  <GraduationCap className="w-4 h-4 flex-shrink-0" />
                  <span>Scholarships</span>
                </Link>
                {isAuthenticated && user?.role === 'employer' && (
                  <Link 
                    to="/post-job" 
                    className="group flex items-center space-x-3 px-3 py-2.5 mx-0.5 rounded-lg text-gray-700 hover:text-emerald-600 font-medium transition-all duration-300 hover:bg-emerald-50/80 text-sm"
                  >
                    <Star className="w-4 h-4 flex-shrink-0" />
                    <span>Post Job</span>
                  </Link>
                )}
                {isAuthenticated && user?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="group flex items-center space-x-2 px-2 py-2 mx-1 rounded-xl text-gray-700 hover:text-[#1BA398] font-medium transition-all duration-300 hover:bg-[#1BA398]/10 text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                {isAuthenticated && user?.role === 'external_admin' && (
                  <Link 
                    to="/external-admin" 
                    className="group flex items-center space-x-2 px-2 py-2 mx-1 rounded-xl text-gray-700 hover:text-[#FF6B35] font-medium transition-all duration-300 hover:bg-[#FF6B35]/10 text-sm"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Manage Scholarships</span>
                  </Link>
                )}

                {isAuthenticated && (
                  <div className="flex flex-col space-y-1 pt-2 mt-2 mx-1 border-t border-gray-200/60">
                    <Link
                      to="/dashboard"
                      className="group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:text-[#1BA398] font-medium transition-all duration-300 hover:bg-[#1BA398]/10 text-sm"
                    >
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to={
                        user?.role === 'job_seeker' ? '/jobseeker/settings' :
                        user?.role === 'employer' ? '/company/settings' :
                        '/profile'
                      }
                      className="group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:text-[#FF6B35] font-medium transition-all duration-300 hover:bg-[#FF6B35]/10 text-sm"
                    >
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      <span>Settings</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:text-red-600 font-medium transition-all duration-300 hover:bg-red-50/80 text-sm text-left"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="flex flex-col space-y-2 pt-3 mt-1 mx-1 border-t border-gray-200/60">
                    <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Quick Access</p>
                    <Button 
                      variant="ghost" 
                      asChild 
                      className="justify-center rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-all duration-300 text-sm font-semibold shadow-sm"
                    >
                      <Link to="/login">
                        <User className="w-4 h-4 mr-2" />
                        Sign In
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      className="justify-center bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg text-sm font-semibold ring-1 ring-indigo-300/50"
                    >
                      <Link to="/register">
                        <Zap className="w-4 h-4 mr-2" />
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

