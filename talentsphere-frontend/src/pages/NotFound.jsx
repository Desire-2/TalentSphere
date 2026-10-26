import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Search, GraduationCap, Building2 } from 'lucide-react';
import SEOHelmet from '../components/seo/SEOHelmet';

const NotFound = () => (
  <>
    <SEOHelmet
      title="Page Not Found - AfriTech Opportunities"
      description="The page you are looking for does not exist or has been moved."
      noindex={true}
    />
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Compass className="w-14 h-14 text-[#1BA398] mx-auto mb-4" />
      <h1 className="text-5xl font-extrabold text-[#0a2847] mb-3">404</h1>
      <p className="text-xl font-semibold text-[#0a2847] mb-2">Page not found</p>
      <p className="text-gray-600 mb-8">
        The page you are looking for doesn't exist or may have been moved. Try one of
        these instead:
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1BA398] text-white font-semibold hover:bg-[#158F85] transition-colors">
          Home
        </Link>
        <Link to="/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1BA398] text-[#1BA398] font-semibold hover:bg-[#1BA398]/10 transition-colors">
          <Search className="w-4 h-4" /> Jobs
        </Link>
        <Link to="/scholarships" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1BA398] text-[#1BA398] font-semibold hover:bg-[#1BA398]/10 transition-colors">
          <GraduationCap className="w-4 h-4" /> Scholarships
        </Link>
        <Link to="/companies" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1BA398] text-[#1BA398] font-semibold hover:bg-[#1BA398]/10 transition-colors">
          <Building2 className="w-4 h-4" /> Companies
        </Link>
      </div>
    </div>
  </>
);

export default NotFound;
