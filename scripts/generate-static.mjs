/**
 * Post-build script — runs after `vite build`:
 *  1. Copies all static asset directories and files to dist/
 *  2. Injects Schema.org ItemList + noscript product fallback into dist/catalog.html
 *  3. Generates dist/sitemap.xml and dist/robots.txt
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync,
         mkdirSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const BASE_URL = 'https://ledlink.co.il';

// ── 1. Copy static assets that Vite doesn't know about ──────────────────────

function copyRecursive(src, dest) {
  if (!existsSync(src)) return;
  const stat = statSync(src);
  if (stat.isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    copyFileSync(src, dest);
  }
}

function copyDir(name) {
  const src = join(ROOT, name);
  const dest = join(DIST, name);
  if (!existsSync(src)) return;
  copyRecursive(src, dest);
  console.log(`generate-static: copied  /${name}  →  dist/${name}`);
}

function copyFile(name) {
  const src = join(ROOT, name);
  const dest = join(DIST, name);
  if (!existsSync(src)) return;
  copyFileSync(src, dest);
  console.log(`generate-static: copied  ${name}  →  dist/${name}`);
}

// Image + asset directories
copyDir('strips');
copyDir('projects');
copyDir('DATASHEET');
copyDir('datasheets');
// libs/ (CDN fallbacks) removed — tools.html is now Vite-built, no CDN deps needed

// Root-level static files
for (const f of [
  'manifest.json', 'CNAME', 'hero.jpg', 'hero.webp',
  'a11y-widget.js', 'products_data.js', 'datasheets_data.js',
]) copyFile(f);

// Static HTML pages (served as-is; not Vite-built)
// Note: tools.html is now Vite-built — do NOT copy it here
for (const f of [
  '404.html',
  'about.html', 'faq.html',
  'takanon.html', 'privacy.html', 'accessibility.html',
]) copyFile(f);

// ── 2. Load products ─────────────────────────────────────────────────────────

const raw = readFileSync(join(ROOT, 'products_data.js'), 'utf8');
const stripped = raw.replace(/^export\s+default\s+\S+\s*;?\s*$/gm, '');
const fn = new Function('window', stripped + '\nreturn window.__PRODUCTS__;');
const products = fn({});

if (!Array.isArray(products) || products.length === 0) {
  console.error('generate-static: could not load products');
  process.exit(1);
}

function cleanName(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

// ── 3. Schema.org ItemList (all 373 products) ────────────────────────────────

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'קטלוג מוצרי LEDLink',
  numberOfItems: products.length,
  itemListElement: products.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: cleanName(p.name),
      description: p.desc ? cleanName(p.desc.split('|')[0].trim()) : '',
      brand: { '@type': 'Brand', name: 'LEDLink' },
      ...(p.url ? { url: p.url }                    : {}),
      ...(p.img ? { image: `${BASE_URL}/${p.img}` } : {}),
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'ILS',
        seller: { '@type': 'Organization', name: 'LEDLink Components' }
      }
    }
  }))
};

const schemaBlock =
  `<script type="application/ld+json">\n${JSON.stringify(itemListSchema)}\n</script>`;

// ── 4. Noscript fallback (all products) ──────────────────────────────────────

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

// ── 5. Patch dist/catalog.html ───────────────────────────────────────────────

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
console.log(`generate-static: schema (${products.length} products) + noscript  →  dist/catalog.html`);

// ── 6. sitemap.xml ───────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);

const sitemapStatic = [
  { loc: `${BASE_URL}/`,             priority: '1.0', changefreq: 'weekly'  },
  { loc: `${BASE_URL}/catalog.html`, priority: '0.9', changefreq: 'daily'   },
  { loc: `${BASE_URL}/tools.html`,   priority: '0.7', changefreq: 'monthly' },
  { loc: `${BASE_URL}/guides.html`,  priority: '0.6', changefreq: 'monthly' },
  { loc: `${BASE_URL}/about.html`,   priority: '0.5', changefreq: 'yearly'  },
  { loc: `${BASE_URL}/faq.html`,     priority: '0.5', changefreq: 'monthly' },
];
const sitemapProducts = products
  .filter(p => p.url && p.url.startsWith(`${BASE_URL}/`))
  .map(p => ({ loc: p.url, priority: '0.8', changefreq: 'monthly' }));

const sitemapAll = [...sitemapStatic, ...sitemapProducts];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapAll.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`generate-static: sitemap.xml  →  ${sitemapAll.length} URLs`);

// ── 7. robots.txt ────────────────────────────────────────────────────────────

writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`,
  'utf8'
);
console.log('generate-static: robots.txt  →  dist/robots.txt');
