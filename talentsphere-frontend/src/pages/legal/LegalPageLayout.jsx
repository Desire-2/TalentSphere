import React from 'react';
import SEOHelmet from '../../components/seo/SEOHelmet';

const LegalPageLayout = ({ title, description, children }) => {
  return (
    <>
      <SEOHelmet
        title={`${title} - AfriTech Opportunities`}
        description={description}
        canonical={`https://jobs.afritechbridge.online${window.location.pathname}`}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <article className="prose-headings:font-bold prose-headings:text-[#0a2847] text-gray-700 leading-relaxed">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a2847] mb-2">{title}</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: October 26, 2026</p>
          {children}
        </article>
      </div>
    </>
  );
};

export const LegalSection = ({ heading, children }) => (
  <section className="mb-8">
    <h2 className="text-xl sm:text-2xl font-bold text-[#0a2847] mt-8 mb-3">{heading}</h2>
    {children}
  </section>
);

export const LegalSubsection = ({ heading, children }) => (
  <section className="mb-4">
    <h3 className="text-lg font-semibold text-[#0a2847] mb-2">{heading}</h3>
    {children}
  </section>
);

export default LegalPageLayout;
