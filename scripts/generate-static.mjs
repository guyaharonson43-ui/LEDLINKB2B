/**
 * Post-build script: injects static SEO content into dist/catalog.html
 * and generates dist/sitemap.xml + dist/robots.txt
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const BASE_URL = 'https://ledlink.co.il';

// Load products data — strip only the ES export line, keep window assignment
const raw = readFileSync(join(ROOT, 'products_data.js'), 'utf8');
const stripped = raw.replace(/^export\s+default\s+\S+\s*;?\s*$/gm, '');
const fn = new Function('window', stripped + '\nreturn window.__PRODUCTS__;');
const fakeWindow = {};
const products = fn(fakeWindow);

if (!Array.isArray(products) || products.length === 0) {
  console.error('generate-static: could not load products');
  process.exit(1);
}

// Clean HTML entities from name
function cleanName(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

// ── 1. Per-product Product schema (all products) ────────────────────────────
const productSchemas = products.map(p => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: cleanName(p.name),
  description: p.desc ? cleanName(p.desc.split('|')[0].trim()) : '',
  brand: { '@type': 'Brand', name: 'LEDLink' },
  ...(p.url ? { url: p.url } : {}),
  ...(p.img ? { image: `${BASE_URL}/${p.img}` } : {}),
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/InStock',
    priceCurrency: 'ILS',
    seller: { '@type': 'Organization', name: 'LEDLink Components' }
  }
}));

// Combine into a single ItemList schema to keep the HTML compact
const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'קטלוג מוצרי LEDLink',
  numberOfItems: products.length,
  itemListElement: productSchemas.map((s, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: s
  }))
};

const schemaBlock =
  `<script type="application/ld+json">\n${JSON.stringify(itemListSchema)}\n</script>`;

// ── 2. Noscript static HTML fallback (all 373 products) ─────────────────────
const byCategory = {};
for (const p of products) {
  const cat = p.category || 'אחר';
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(p);
}

let noscriptHtml = '<noscript><div id="static-catalog" style="font-family:sans-serif;direction:rtl;padding:16px">';
noscriptHtml += '<h1 style="font-size:22px;font-weight:900">LEDLink — קטלוג רכיבי LED</h1>';
for (const [cat, items] of Object.entries(byCategory)) {
  noscriptHtml += `<h2 style="font-size:18px;margin-top:24px">${cat}</h2><ul>`;
  for (const p of items) {
    const name = cleanName(p.name);
    const link = p.url ? `<a href="${p.url}">${name}</a>` : name;
    noscriptHtml += `<li>${link}</li>`;
  }
  noscriptHtml += '</ul>';
}
noscriptHtml += '</div></noscript>';

// ── 3. Patch dist/catalog.html ───────────────────────────────────────────────
const htmlPath = join(DIST, 'catalog.html');
let html = readFileSync(htmlPath, 'utf8');

html = html.replace(
  '<!-- Per-product Product schema injected here by generate-static.mjs at build time -->',
  schemaBlock
);

html = html.replace(
  /<div id="root">\s*<!--[^>]*-->\s*<\/div>/,
  `<div id="root">${noscriptHtml}</div>`
);

writeFileSync(htmlPath, html, 'utf8');
console.log(`generate-static: injected ItemList schema (${products.length} products) + noscript list → dist/catalog.html`);

// ── 4. sitemap.xml ───────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { loc: `${BASE_URL}/`,              priority: '1.0', changefreq: 'weekly'  },
  { loc: `${BASE_URL}/catalog.html`,  priority: '0.9', changefreq: 'daily'   },
  { loc: `${BASE_URL}/tools.html`,    priority: '0.7', changefreq: 'monthly' },
  { loc: `${BASE_URL}/guides.html`,   priority: '0.6', changefreq: 'monthly' },
  { loc: `${BASE_URL}/about.html`,    priority: '0.5', changefreq: 'yearly'  },
  { loc: `${BASE_URL}/faq.html`,      priority: '0.5', changefreq: 'monthly' },
];

const productUrls = products
  .filter(p => p.url)
  .map(p => ({ loc: p.url, priority: '0.8', changefreq: 'monthly' }));

const allUrls = [...staticPages, ...productUrls];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`generate-static: sitemap.xml → ${allUrls.length} URLs (${productUrls.length} products + ${staticPages.length} static pages)`);

// ── 5. robots.txt ────────────────────────────────────────────────────────────
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

writeFileSync(join(DIST, 'robots.txt'), robotsTxt, 'utf8');
console.log('generate-static: robots.txt → dist/robots.txt');
