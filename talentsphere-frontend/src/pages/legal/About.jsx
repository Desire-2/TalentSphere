import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, Building2, HeartHandshake } from 'lucide-react';
import SEOHelmet from '../../components/seo/SEOHelmet';

const About = () => (
  <>
    <SEOHelmet
      title="About Us - AfriTech Opportunities"
      description="AfriTech Opportunities is a jobs, scholarships and internships platform for Rwanda and Africa, built by AfriTech Bridge to connect talent with real opportunities."
      canonical="https://jobs.afritechbridge.online/about"
    />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-gray-700 leading-relaxed">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a2847] mb-6">About AfriTech Opportunities</h1>

      <p className="mb-4">
        AfriTech Opportunities is a job, scholarship and internship platform built for
        Rwanda and the wider African continent. It is operated by <strong>AfriTech Bridge</strong>,
        a technology initiative focused on closing the gap between talented people and the
        opportunities that match their skills.
      </p>

      <p className="mb-8">
        We bring together employers, scholarship providers and candidates in one place:
        employers reach motivated applicants, students discover funding for their studies,
        and job seekers find roles that fit their ambitions — from entry-level positions
        in Kigali to remote roles across Africa.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="rounded-xl border border-gray-200 p-5">
          <Briefcase className="w-6 h-6 text-[#1BA398] mb-2" />
          <h2 className="font-bold text-[#0a2847] mb-1">Jobs</h2>
          <p className="text-sm">Verified-style listings from employers across Rwanda and Africa, with simple on-platform applications.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <GraduationCap className="w-6 h-6 text-[#1BA398] mb-2" />
          <h2 className="font-bold text-[#0a2847] mb-1">Scholarships</h2>
          <p className="text-sm">Scholarships and financial aid programs with clear eligibility, deadlines and application steps.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <Building2 className="w-6 h-6 text-[#1BA398] mb-2" />
          <h2 className="font-bold text-[#0a2847] mb-1">Employers</h2>
          <p className="text-sm">Company profiles, applicant management and optional sponsored placements to reach more candidates.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <HeartHandshake className="w-6 h-6 text-[#1BA398] mb-2" />
          <h2 className="font-bold text-[#0a2847] mb-1">Career tools</h2>
          <p className="text-sm">Guidance and AI-assisted career tools to help candidates prepare stronger applications.</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#0a2847] mt-8 mb-3">Our mission</h2>
      <p className="mb-4">
        Talent is evenly distributed; opportunity is not. Our mission is to make
        opportunity accessible — giving every candidate a fair place to discover roles and
        funding, and giving employers a reliable way to find the people they need.
      </p>

      <h2 className="text-xl font-bold text-[#0a2847] mt-8 mb-3">Contact</h2>
      <p className="mb-6">
        Based in Kigali, Rwanda. Email us at{' '}
        <a href="mailto:support@afritechbridge.online" className="text-[#1BA398] underline">
          support@afritechbridge.online
        </a>{' '}
        or visit the <Link to="/contact" className="text-[#1BA398] underline">contact page</Link>.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link to="/jobs" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#1BA398] text-white font-semibold hover:bg-[#158F85] transition-colors">
          Browse jobs
        </Link>
        <Link to="/scholarships" className="inline-flex items-center px-5 py-2.5 rounded-lg border border-[#1BA398] text-[#1BA398] font-semibold hover:bg-[#1BA398]/10 transition-colors">
          Browse scholarships
        </Link>
      </div>
    </div>
  </>
);

export default About;
