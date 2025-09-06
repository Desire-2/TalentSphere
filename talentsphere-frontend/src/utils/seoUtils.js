import React from 'react';

// SEO utility functions for generating structured data

export const generateJobPostingStructuredData = (job) => {
  const siteUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "identifier": {
      "@type": "PropertyValue",
      "name": "TalentSphere Job ID",
      "value": job.id
    },
    "datePosted": job.created_at,
    "validThrough": job.application_deadline || null,
    "employmentType": job.employment_type || "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company_name || "TalentSphere Partner",
      "sameAs": job.company_website || `${siteUrl}/companies/${job.company_id}`,
      "logo": job.company_logo || `${siteUrl}/default-company-logo.png`
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": job.location || "Remote",
        "addressLocality": job.city || "",
        "addressRegion": job.state || "",
        "addressCountry": job.country || "US"
      }
    },
    "baseSalary": job.salary_range ? {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salary_range,
        "unitText": "YEAR"
      }
    } : null,
    "workHours": job.work_hours || "40 hours per week",
    "qualifications": job.requirements || "",
    "skills": job.skills || "",
    "industry": job.industry || "",
    "jobBenefits": job.benefits || "",
    "url": `${siteUrl}/jobs/${job.id}`,
    "applicationContact": {
      "@type": "ContactPoint",
      "email": job.contact_email || "apply@talentsphere.com"
    }
  };
};

export const generateScholarshipStructuredData = (scholarship) => {
  const siteUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    "name": scholarship.title,
    "description": scholarship.description,
    "url": `${siteUrl}/scholarships/${scholarship.id}`,
    "credentialCategory": "Scholarship",
    "educationalLevel": scholarship.study_level || "Any",
    "competencyRequired": scholarship.eligibility_requirements || "",
    "availableAt": {
      "@type": "EducationalOrganization",
      "name": scholarship.university_name || scholarship.external_organization_name || "TalentSphere Partner",
      "url": scholarship.external_organization_website || siteUrl
    },
    "offers": {
      "@type": "Offer",
      "price": scholarship.award_amount || 0,
      "priceCurrency": "USD",
      "validThrough": scholarship.application_deadline || null,
      "url": scholarship.external_application_url || `${siteUrl}/scholarships/${scholarship.id}/apply`
    },
    "applicationDeadline": scholarship.application_deadline,
    "awardAmount": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": scholarship.award_amount || 0
    }
  };
};

export const generateCompanyStructuredData = (company) => {
  const siteUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": company.name,
    "description": company.description,
    "url": company.website || `${siteUrl}/companies/${company.id}`,
    "logo": company.logo || `${siteUrl}/default-company-logo.png`,
    "industry": company.industry || "",
    "numberOfEmployees": company.company_size || "",
    "foundingDate": company.founded_year || "",
    "address": company.location ? {
      "@type": "PostalAddress",
      "streetAddress": company.location
    } : null,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "HR",
      "email": company.contact_email || ""
    }
  };
};

export const generateBreadcrumbStructuredData = (breadcrumbs) => {
  const siteUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `${siteUrl}${crumb.url}`
    }))
  };
};

export const generateWebsiteStructuredData = () => {
  const siteUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TalentSphere",
    "alternateName": "TalentSphere Jobs",
    "url": siteUrl,
    "description": "Connect Talent with Opportunities - Leading job search and recruitment platform",
    "publisher": {
      "@type": "Organization",
      "name": "TalentSphere",
      "logo": `${siteUrl}/logo-512.png`
    },
    "potentialAction": [
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${siteUrl}/jobs?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    ]
  };
};

export const generateArticleStructuredData = (article) => {
  const siteUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": article.image ? `${siteUrl}${article.image}` : `${siteUrl}/og-image.jpg`,
    "author": {
      "@type": "Organization",
      "name": "TalentSphere"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TalentSphere",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo-512.png`
      }
    },
    "datePublished": article.datePublished || new Date().toISOString(),
    "dateModified": article.dateModified || new Date().toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    }
  };
};

// SEO optimization utilities
export const generateMetaTitle = (pageTitle, includesSiteName = true) => {
  const siteName = "TalentSphere";
  return includesSiteName ? `${pageTitle} | ${siteName}` : pageTitle;
};

export const truncateDescription = (description, maxLength = 160) => {
  if (!description) return "";
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3).trim() + "...";
};

export const generateJobSEOTitle = (job) => {
  return `${job.title} at ${job.company_name || 'Leading Company'} - Apply Now`;
};

export const generateJobSEODescription = (job) => {
  const baseDesc = `Join ${job.company_name || 'a leading company'} as ${job.title}. `;
  const location = job.location ? `Location: ${job.location}. ` : "";
  const salary = job.salary_range ? `Salary: ${job.salary_range}. ` : "";
  const type = job.employment_type ? `Type: ${job.employment_type}. ` : "";
  
  const fullDesc = baseDesc + location + salary + type + "Apply now on TalentSphere.";
  return truncateDescription(fullDesc);
};

export const generateScholarshipSEOTitle = (scholarship) => {
  const amount = scholarship.award_amount ? ` - $${scholarship.award_amount.toLocaleString()}` : '';
  return `${scholarship.title}${amount} Scholarship - Apply Now`;
};

export const generateScholarshipSEODescription = (scholarship) => {
  const amount = scholarship.award_amount ? `$${scholarship.award_amount.toLocaleString()} ` : '';
  const org = scholarship.university_name || scholarship.external_organization_name || 'Leading Institution';
  const deadline = scholarship.application_deadline 
    ? ` Deadline: ${new Date(scholarship.application_deadline).toLocaleDateString()}.`
    : '';
  
  const fullDesc = `Apply for the ${amount}${scholarship.title} scholarship from ${org}.${deadline} Find more scholarships on TalentSphere.`;
  return truncateDescription(fullDesc);
};

export const generateKeywords = (baseKeywords, additionalKeywords = []) => {
  const defaultKeywords = ["jobs", "careers", "recruitment", "talent", "opportunities", "employment"];
  return [...defaultKeywords, ...baseKeywords, ...additionalKeywords].join(", ");
};
