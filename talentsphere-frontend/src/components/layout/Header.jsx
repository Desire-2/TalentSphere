import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Bell,
  MessageSquare,
  Zap,
  Star,
  Shield,
  ChevronDown,
  Building2,
  Plus,
  GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getInitials } from '../../utils/helpers';
import NotificationDropdownEnhanced from '../notifications/NotificationDropdownEnhanced';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  // Handle scroll effect for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/50 opacity-60"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Enhanced Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 group-hover:from-blue-600 group-hover:to-purple-600 transition-colors duration-300">
                  TalentSphere
                </span>
                <span className="text-xs text-gray-500 font-medium -mt-1">Find Your Dream Job</span>
              </div>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              to="/jobs" 
              className="group relative px-4 py-2 rounded-xl text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:bg-blue-50/50"
            >
              <span className="relative z-10 flex items-center space-x-1">
                <Search className="w-4 h-4" />
                <span>Find Jobs</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-300"></div>
            </Link>
            <Link 
              to="/companies" 
              className="group relative px-4 py-2 rounded-xl text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:bg-blue-50/50"
            >
              <span className="relative z-10 flex items-center space-x-1">
                <Briefcase className="w-4 h-4" />
                <span>Companies</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-300"></div>
            </Link>
            <Link 
              to="/scholarships" 
              className="group relative px-4 py-2 rounded-xl text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:bg-purple-50/50"
            >
              <span className="relative z-10 flex items-center space-x-1">
                <GraduationCap className="w-4 h-4" />
                <span>Scholarships</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 rounded-xl transition-all duration-300"></div>
            </Link>
            {isAuthenticated && user?.role === 'employer' && (
              <Link 
                to="/post-job" 
                className="group relative px-4 py-2 rounded-xl text-gray-700 hover:text-emerald-600 font-medium transition-all duration-300 hover:bg-emerald-50/50"
              >
                <span className="relative z-10 flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>Post Job</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 rounded-xl transition-all duration-300"></div>
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="group relative px-4 py-2 rounded-xl text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:bg-purple-50/50"
              >
                <span className="relative z-10 flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-300"></div>
              </Link>
            )}
            {isAuthenticated && user?.role === 'external_admin' && (
              <Link 
                to="/external-admin" 
                className="group relative px-4 py-2 rounded-xl text-gray-700 hover:text-indigo-600 font-medium transition-all duration-300 hover:bg-indigo-50/50"
              >
                <span className="relative z-10 flex items-center space-x-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>Manage Scholarships</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-300"></div>
              </Link>
            )}
          </nav>

          {/* Enhanced Right side */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                {/* Enhanced Search */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden md:flex h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 hover:scale-105"
                >
                  <Search className="w-4 h-4" />
                </Button>

                {/* Enhanced Notifications */}
                <NotificationDropdownEnhanced />

                {/* Enhanced Messages */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all duration-300 hover:scale-105"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>

                {/* Enhanced User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 px-3 rounded-xl hover:bg-purple-50 transition-all duration-300 hover:scale-105 group">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                          <AvatarImage src={user?.profile_picture} alt={user?.first_name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                            {getInitials(user?.first_name, user?.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors duration-300" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-2" align="end" forceMount>
                    {/* Enhanced User Info */}
                    <div className="flex items-center justify-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl mb-2">
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-lg">
                        <AvatarImage src={user?.profile_picture} alt={user?.first_name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                          {getInitials(user?.first_name, user?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                        <p className="text-sm text-gray-600 truncate max-w-[160px]">
                          {user?.email}
                        </p>
                        {user?.role && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 w-fit">
                            {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <DropdownMenuItem asChild className="rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer">
                      <Link to="/dashboard" className="flex items-center px-3 py-2">
                        <User className="mr-3 h-4 w-4" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* Job Seeker Menu Items */}
                    {user?.role === 'job_seeker' && (
                      <>
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 cursor-pointer">
                          <Link to="/jobseeker/profile" className="flex items-center px-3 py-2">
                            <User className="mr-3 h-4 w-4" />
                            <span className="font-medium">My Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 cursor-pointer">
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
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 cursor-pointer">
                          <Link to="/company/profile" className="flex items-center px-3 py-2">
                            <Building2 className="mr-3 h-4 w-4" />
                            <span className="font-medium">Company Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 cursor-pointer">
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
                  className="rounded-xl hover:bg-gray-50 transition-all duration-300 hover:scale-105 font-medium"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
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
              className="md:hidden h-9 w-9 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:scale-105"
              onClick={toggleMobileMenu}
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
          <div className="md:hidden border-t border-gradient-to-r from-transparent via-gray-200 to-transparent">
            <div className="py-4 bg-gradient-to-br from-white/80 to-blue-50/50 backdrop-blur-sm rounded-b-2xl border border-white/20 shadow-xl">
              <nav className="flex flex-col space-y-2">
                <Link 
                  to="/jobs" 
                  className="group flex items-center space-x-3 px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:bg-blue-50/70"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Search className="w-4 h-4" />
                  <span>Find Jobs</span>
                </Link>
                <Link 
                  to="/companies" 
                  className="group flex items-center space-x-3 px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:bg-blue-50/70"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Companies</span>
                </Link>
                <Link 
                  to="/scholarships" 
                  className="group flex items-center space-x-3 px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:bg-purple-50/70"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Scholarships</span>
                </Link>
                {isAuthenticated && user?.role === 'employer' && (
                  <Link 
                    to="/post-job" 
                    className="group flex items-center space-x-3 px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-emerald-600 font-medium transition-all duration-300 hover:bg-emerald-50/70"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Star className="w-4 h-4" />
                    <span>Post Job</span>
                  </Link>
                )}
                {isAuthenticated && user?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="group flex items-center space-x-3 px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:bg-purple-50/70"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                {isAuthenticated && user?.role === 'external_admin' && (
                  <Link 
                    to="/external-admin" 
                    className="group flex items-center space-x-3 px-4 py-3 mx-2 rounded-xl text-gray-700 hover:text-indigo-600 font-medium transition-all duration-300 hover:bg-indigo-50/70"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Manage Scholarships</span>
                  </Link>
                )}
                {!isAuthenticated && (
                  <div className="flex flex-col space-y-2 pt-4 mx-2 border-t border-gray-200/50">
                    <Button 
                      variant="ghost" 
                      asChild 
                      className="justify-start rounded-xl hover:bg-gray-50 transition-all duration-300"
                    >
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <User className="w-4 h-4 mr-3" />
                        Sign In
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      className="justify-start bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg"
                    >
                      <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Zap className="w-4 h-4 mr-3" />
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

