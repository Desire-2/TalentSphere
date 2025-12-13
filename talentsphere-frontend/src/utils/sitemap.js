import { jobService } from '../services/job';
import { scholarshipService } from '../services/scholarship';
import { companyService } from '../services/company';
import config from '../config/environment.js';

// Generate dynamic sitemap
export const generateSitemap = async () => {
  const baseUrl = window.location.origin;
  const currentDate = new Date().toISOString();

  // Static routes
  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      url: `${baseUrl}/jobs`,
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/scholarships`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/companies`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    }
  ];

  try {
    // Fetch dynamic content
    const [jobsResponse, scholarshipsResponse, companiesResponse] = await Promise.all([
      jobService.getJobs({ page: 1, per_page: 1000 }),
      scholarshipService.getScholarships({ page: 1, per_page: 1000 }),
      companyService.getCompanies({ page: 1, per_page: 1000 })
    ]);

    // Add job URLs
    const jobUrls = (jobsResponse.jobs || []).map(job => ({
      url: `${baseUrl}/jobs/${job.id}`,
      lastmod: job.updated_at || job.created_at || currentDate,
      changefreq: 'weekly',
      priority: '0.7'
    }));

    // Add scholarship URLs
    const scholarshipUrls = (scholarshipsResponse.scholarships || []).map(scholarship => ({
      url: `${baseUrl}/scholarships/${scholarship.id}`,
      lastmod: scholarship.updated_at || scholarship.created_at || currentDate,
      changefreq: 'weekly',
      priority: '0.7'
    }));

    // Add company URLs
    const companyUrls = (companiesResponse.companies || []).map(company => ({
      url: `${baseUrl}/companies/${company.id}`,
      lastmod: company.updated_at || company.created_at || currentDate,
      changefreq: 'monthly',
      priority: '0.6'
    }));

    // Combine all URLs
    const allUrls = [...staticRoutes, ...jobUrls, ...scholarshipUrls, ...companyUrls];

    // Generate XML sitemap
    const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(route => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return xmlSitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return basic sitemap with static routes only
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(route => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    return basicSitemap;
  }
};

// Generate static sitemap for public folder
export const generateStaticSitemap = () => {
  const baseUrl = config.APP.APP_URL; // Use environment variable instead of hardcoded URL
  const currentDate = new Date().toISOString();

  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      url: `${baseUrl}/jobs`,
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/scholarships`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/companies`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    }
  ];

  const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(route => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xmlSitemap;
};
