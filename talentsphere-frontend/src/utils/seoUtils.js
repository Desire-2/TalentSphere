import React from 'react';

// SEO utility functions for generating structured data

const EMPLOYMENT_TYPE_MAP = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  'contract': 'CONTRACT',
  'internship': 'INTERN',
  'freelance': 'FULL_TIME',
  temporary: 'TEMPORARY',
};

export const generateJobPostingStructuredData = (job) => {
  const siteUrl = window.location.origin;
  const salary = job.salary || {};
  const location = job.location || {};
  const skills = Array.isArray(job.required_skills)
    ? job.required_skills
    : (() => {
        try {
          return JSON.parse(job.required_skills || '[]');
        } catch {
          return [];
        }
      })();

  const posting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description || job.summary || '',
    "identifier": {
      "@type": "PropertyValue",
      "name": "AfriTech Opportunities Job ID",
      "value": String(job.id)
    },
    "datePosted": job.published_at || job.created_at,
    "employmentType": EMPLOYMENT_TYPE_MAP[job.employment_type] || 'FULL_TIME',
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company?.name || job.external_company_name || "AfriTech Opportunities Partner",
      "sameAs": job.company?.website || job.company?.slug
        ? `${siteUrl}/companies/${job.company?.id || job.company_id}`
        : siteUrl,
      ...(job.company?.logo_url && { logo: job.company.logo_url })
    },
    "jobLocation": location.is_remote
      ? {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressCountry: location.country || 'RW' }
        }
      : {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: location.city || '',
            addressRegion: location.state || '',
            addressCountry: location.country || 'RW'
          }
        },
    "url": `${siteUrl}/jobs/${job.id}`,
    "applicationContact": {
      "@type": "ContactPoint",
      "email": job.application_email || "support@afritechbridge.online"
    }
  };

  if (location.is_remote) {
    posting.applicantLocationRequirements = {
      "@type": "Country",
      name: location.country || 'RW'
    };
  }

  if (job.application_deadline) {
    posting.validThrough = job.application_deadline;
  }

  if (salary.show_salary !== false && (salary.min || salary.max)) {
    posting.baseSalary = {
      "@type": "MonetaryAmount",
      currency: salary.currency || 'RWF',
      value: {
        "@type": "QuantitativeValue",
        ...(salary.min && { minValue: salary.min }),
        ...(salary.max && { maxValue: salary.max }),
        unitText: (salary.period || 'monthly').toUpperCase()
      }
    };
  }

  if (skills.length) {
    posting.skills = skills.join(', ');
    posting.qualifications = skills.join(', ');
  }

  return posting;
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
      "name": scholarship.university_name || scholarship.external_organization_name || "AfriTech Opportunities Partner",
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
    "name": "AfriTech Opportunities",
    "alternateName": "AfriTech Opportunities Jobs",
    "url": siteUrl,
    "description": "Connect Talent with Opportunities - Leading job search and recruitment platform",
    "publisher": {
      "@type": "Organization",
      "name": "AfriTech Opportunities",
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
      "name": "AfriTech Opportunities"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AfriTech Opportunities",
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
  const siteName = "AfriTech Opportunities";
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
  
  const fullDesc = baseDesc + location + salary + type + "Apply now on AfriTech Opportunities.";
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
  
  const fullDesc = `Apply for the ${amount}${scholarship.title} scholarship from ${org}.${deadline} Find more scholarships on AfriTech Opportunities.`;
  return truncateDescription(fullDesc);
};

export const generateKeywords = (baseKeywords, additionalKeywords = []) => {
  const defaultKeywords = ["jobs", "careers", "recruitment", "talent", "opportunities", "employment"];
  return [...defaultKeywords, ...baseKeywords, ...additionalKeywords].join(", ");
};
