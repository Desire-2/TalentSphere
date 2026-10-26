// Generates dist/sitemap.xml at build time (wired as "postbuild").
// Fetches public job/company/scholarship listings from the API; falls back to
// static routes when the API is unreachable.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://jobs.afritechbridge.online';
const API = (process.env.VITE_API_BASE_URL || 'https://talentsphere-ev6o.onrender.com/api').replace(/\/$/, '');
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'sitemap.xml');

const STATIC_ROUTES = [
  { loc: '/', priority: '1.0' },
  { loc: '/jobs', priority: '0.9' },
  { loc: '/scholarships', priority: '0.9' },
  { loc: '/companies', priority: '0.8' },
  { loc: '/about', priority: '0.5' },
  { loc: '/contact', priority: '0.5' },
  { loc: '/privacy', priority: '0.3' },
  { loc: '/terms', priority: '0.3' },
  { loc: '/cookies', priority: '0.3' },
];

async function fetchList(path, listKey) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data[listKey] || [];
    return items.filter((item) => item && item.id);
  } catch {
    return [];
  }
}

function toEntry(item, kind) {
  const lastmod = item.updated_at || item.published_at || item.created_at;
  return {
    loc: `/${kind}/${item.id}`,
    lastmod: lastmod ? String(lastmod).slice(0, 10) : undefined,
    priority: kind === 'jobs' ? '0.8' : '0.7',
  };
}

async function main() {
  const [jobs, companies, scholarships] = await Promise.all([
    fetchList('/jobs?status=published&per_page=200', 'jobs'),
    fetchList('/companies?per_page=200', 'companies'),
    fetchList('/scholarships?status=published&per_page=200', 'scholarships'),
  ]);

  const entries = [
    ...STATIC_ROUTES,
    ...jobs.map((j) => toEntry(j, 'jobs')),
    ...companies.map((c) => toEntry(c, 'companies')),
    ...scholarships.map((s) => toEntry(s, 'scholarships')),
  ];

  const today = new Date().toISOString().slice(0, 10);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) => {
      const parts = [`  <url>`, `    <loc>${SITE}${e.loc}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
      else parts.push(`    <lastmod>${today}</lastmod>`);
      parts.push(`    <priority>${e.priority}</priority>`, `  </url>`);
      return parts.join('\n');
    }),
    '</urlset>',
    '',
  ].join('\n');

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, xml, 'utf8');
  console.log(
    `sitemap: ${entries.length} URLs (${jobs.length} jobs, ${companies.length} companies, ${scholarships.length} scholarships) -> ${OUT}`
  );
}

main().catch((err) => {
  console.warn('sitemap build failed, writing static routes only:', err.message);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...STATIC_ROUTES.map(
      (e) =>
        `  <url>\n    <loc>${SITE}${e.loc}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <priority>${e.priority}</priority>\n  </url>`
    ),
    '</urlset>',
    '',
  ].join('\n');
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, xml, 'utf8');
});
