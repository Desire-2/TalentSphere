import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHelmet = ({
  title = "TalentSphere - Connect Talent with Opportunities",
  description = "Discover your next career opportunity or find the perfect candidate. TalentSphere connects talented professionals with leading companies worldwide.",
  keywords = "jobs, careers, recruitment, talent, opportunities, employment, job search, hiring, scholarships",
  image = "/og-image.jpg",
  url = window.location.href,
  type = "website",
  author = "TalentSphere",
  twitterCard = "summary_large_image",
  structuredData = null,
  canonical = null,
  noindex = false,
  nofollow = false,
  alternateLanguages = null,
  articleData = null,
  organization = null
}) => {
  const siteName = "TalentSphere";
  const siteUrl = window.location.origin;
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  
  // Default structured data for the organization
  const defaultOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TalentSphere",
    "url": siteUrl,
    "logo": `${siteUrl}/logo-512.png`,
    "description": "Leading talent acquisition and career development platform",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@talentsphere.com"
    },
    "sameAs": [
      "https://linkedin.com/company/talentsphere",
      "https://twitter.com/talentsphere",
      "https://facebook.com/talentsphere"
    ]
  };

  const organizationData = organization || defaultOrganization;

  // Robots meta content
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@talentsphere" />
      <meta name="twitter:creator" content="@talentsphere" />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="web" />
      <meta name="rating" content="general" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      
      {/* Alternate Languages */}
      {alternateLanguages && alternateLanguages.map((lang, index) => (
        <link
          key={index}
          rel="alternate"
          hrefLang={lang.hreflang}
          href={lang.href}
        />
      ))}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Organization Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
      
      {/* Article Structured Data */}
      {articleData && (
        <script type="application/ld+json">
          {JSON.stringify(articleData)}
        </script>
      )}
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Helmet>
  );
};

export default SEOHelmet;
