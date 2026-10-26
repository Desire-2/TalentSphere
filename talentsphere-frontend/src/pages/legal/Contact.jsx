import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import SEOHelmet from '../../components/seo/SEOHelmet';

const Contact = () => (
  <>
    <SEOHelmet
      title="Contact Us - AfriTech Opportunities"
      description="Contact the AfriTech Opportunities team in Kigali, Rwanda for support with your account, job listings or scholarship applications."
      canonical="https://jobs.afritechbridge.online/contact"
    />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a2847] mb-4">Contact us</h1>
      <p className="text-gray-600 mb-8 leading-relaxed">
        Questions about an application, your account, or posting a job? We are here to
        help. Reach us through any of the channels below and we will get back to you as
        soon as possible.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <a
          href="mailto:support@afritechbridge.online"
          className="flex items-start gap-3 rounded-xl border border-gray-200 p-5 hover:border-[#1BA398] transition-colors"
        >
          <Mail className="w-5 h-5 text-[#1BA398] mt-0.5" />
          <span>
            <span className="block font-bold text-[#0a2847]">Email</span>
            <span className="text-sm text-gray-600">support@afritechbridge.online</span>
          </span>
        </a>
        <a
          href="tel:+250780784924"
          className="flex items-start gap-3 rounded-xl border border-gray-200 p-5 hover:border-[#1BA398] transition-colors"
        >
          <Phone className="w-5 h-5 text-[#1BA398] mt-0.5" />
          <span>
            <span className="block font-bold text-[#0a2847]">Phone</span>
            <span className="text-sm text-gray-600">+250 780 784 924</span>
          </span>
        </a>
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-5">
          <MapPin className="w-5 h-5 text-[#1BA398] mt-0.5" />
          <span>
            <span className="block font-bold text-[#0a2847]">Location</span>
            <span className="text-sm text-gray-600">Kigali, Rwanda</span>
          </span>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-5">
          <Clock className="w-5 h-5 text-[#1BA398] mt-0.5" />
          <span>
            <span className="block font-bold text-[#0a2847]">Support hours</span>
            <span className="text-sm text-gray-600">Monday – Friday, 8:00 – 18:00 (CAT)</span>
          </span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#0a2847] mb-3">Before you write</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-600">
        <li>For account access issues, include the email address you registered with.</li>
        <li>For job or scholarship listings, include the listing title and link.</li>
        <li>Report suspicious listings by emailing the listing link with the subject "Report".</li>
        <li>Privacy and data requests: see our <a href="/privacy" className="text-[#1BA398] underline">Privacy Policy</a> for how to exercise your rights.</li>
      </ul>
    </div>
  </>
);

export default Contact;
