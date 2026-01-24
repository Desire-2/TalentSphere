import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {/* Company Info */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start lg:flex-col lg:items-start space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-4">
              <div className="flex-shrink-0 relative group">
                <img 
                  src="/logo-192.png" 
                  alt="AfriTech Opportunities Logo" 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-wide text-center sm:text-left lg:text-2xl">AfriTech Opportunities</span>
            </div>
            <p className="text-gray-200 text-xs sm:text-sm lg:text-base font-light text-center sm:text-left">
              Connecting talent with opportunities across Africa through innovative technology. Find your dream job, scholarship, or internship opportunity.
            </p>
            <div className="flex flex-col space-y-2 mt-3 sm:mt-2">
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs sm:text-sm text-gray-200">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">support@afritechopportunities.com</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs sm:text-sm text-gray-200">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+250780784924</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs sm:text-sm text-gray-200">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700">
              <div className="relative group">
                {/* Animated background glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-40 group-hover:opacity-75 transition-opacity duration-500 animate-pulse"></div>
                
                {/* Main badge container */}
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2 sm:p-3 lg:p-4 overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1.5 sm:gap-2 lg:gap-3">
                    <span className="text-white text-xs lg:text-sm font-light tracking-wide">Powered by</span>
                    <span className="inline-flex items-center space-x-1.5 sm:space-x-2">
                      <span className="text-white font-black text-xs sm:text-sm lg:text-lg tracking-tight drop-shadow-lg">AfriTech Bridge</span>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors flex-shrink-0">
                        <span className="text-white text-xs font-bold">→</span>
                      </div>
                    </span>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:via-white/60 transition-colors duration-300"></div>
                </div>
              </div>
            </div>
          </div>

          {/* For Job Seekers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">For Job Seekers</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/jobs" className="hover:text-white transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-white transition-colors">
                  Company Directory
                </Link>
              </li>
              <li>
                <Link to="/career-advice" className="hover:text-white transition-colors">
                  Career Advice
                </Link>
              </li>
              <li>
                <Link to="/salary-guide" className="hover:text-white transition-colors">
                  Salary Guide
                </Link>
              </li>
              <li>
                <Link to="/resume-builder" className="hover:text-white transition-colors">
                  Resume Builder
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">For Employers</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/post-job" className="hover:text-white transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="/browse-candidates" className="hover:text-white transition-colors">
                  Browse Candidates
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/featured-ads" className="hover:text-white transition-colors">
                  Featured Ads
                </Link>
              </li>
              <li>
                <Link to="/recruitment-solutions" className="hover:text-white transition-colors">
                  Recruitment Solutions
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/press" className="hover:text-white transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-10 sm:mt-16 pt-6 sm:pt-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs sm:text-sm text-gray-300 text-center sm:text-left">
              © 2025 AfriTech Opportunities. All rights reserved. Powered by AfriTech Bridge.
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-300">
              <Link to="/privacy" className="hover:text-blue-400 transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-blue-400 transition-colors underline underline-offset-2">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-blue-400 transition-colors underline underline-offset-2">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

