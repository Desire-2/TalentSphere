import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Company Info */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-wide">TalentSphere</span>
            </div>
            <p className="text-gray-200 text-base font-light">
              Connecting talent with opportunities through innovative technology.<br />
              Find your dream job or discover exceptional candidates.
            </p>
            <div className="flex flex-col space-y-2 mt-2">
              <div className="flex items-center space-x-2 text-sm text-gray-200">
                <Mail className="w-4 h-4" />
                <span>support@talentsphere.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-200">
                <Phone className="w-4 h-4" />
                <span>+250780784924</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-200">
                <MapPin className="w-4 h-4" />
                <span>Kiagli</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="inline-block bg-blue-700 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">Powered by Afritech Bridge</span>
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
              © 2025 TalentSphere. All rights reserved.
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

