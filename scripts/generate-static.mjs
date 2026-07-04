/**
 * Post-build script — runs after `vite build`:
 *  1. Copies all static asset directories and files to dist/
 *  2. Injects Schema.org ItemList + noscript product fallback into dist/catalog.html
 *  3. Generates dist/sitemap.xml and dist/robots.txt
 *  4. Generates dist/share/{id}.html — OG-rich share pages for WhatsApp/social previews
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

function loadProducts(filename) {
  const src = readFileSync(join(ROOT, filename), 'utf8');
  const stripped = src.replace(/^export\s+default\s+\S+\s*;?\s*$/gm, '');
  const fn = new Function('window', stripped + '\nreturn window.__PRODUCTS__;');
  return fn({}) || [];
}

// Use the combined file (373 base + 245 lighting) when it exists, else fall back
const withLighting = join(ROOT, 'products_data_with_lighting.js');
const products = existsSync(withLighting)
  ? loadProducts('products_data_with_lighting.js')
  : loadProducts('products_data.js');

if (!Array.isArray(products) || products.length === 0) {
  console.error('generate-static: could not load products');
  process.exit(1);
}

function cleanName(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

// Canonical own-site URL for a product — never points off-domain (e.g. supplier sites),
// so every product gets a real, unique, crawlable page under our own domain.
function canonicalUrl(p) {
  return `${BASE_URL}/product/${p.id}/`;
}

function imageUrl(p) {
  if (!p.img) return `${BASE_URL}/hero.webp`;
  return p.img.startsWith('http') ? p.img : `${BASE_URL}/${p.img}`;
}

// Only emit `offers` when we have a real price — omitting it (rather than
// fabricating a value) keeps the Product schema valid instead of invalid.
function offersFor(p, url) {
  if (typeof p.price !== 'number' || p.price <= 0) return null;
  return {
    '@type': 'Offer',
    price: p.price,
    priceCurrency: 'ILS',
    availability: 'https://schema.org/InStock',
    url,
    seller: { '@type': 'Organization', name: 'LEDLink Components' }
  };
}

// ── 3. Schema.org ItemList (all products) ────────────────────────────────────

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'קטלוג מוצרי LEDLink',
  numberOfItems: products.length,
  itemListElement: products.map((p, i) => {
    const url = canonicalUrl(p);
    const offers = offersFor(p, url);
    return {
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: cleanName(p.name),
        description: p.desc ? cleanName(p.desc.split('|')[0].trim()) : '',
        brand: { '@type': 'Brand', name: 'LEDLink' },
        url,
        image: imageUrl(p),
        ...(offers ? { offers } : {})
      }
    };
  })
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

// Inject preload for the first LCP image (first product of the default tab)
const DEFAULT_TAB = 'דרייברים';
const firstLcp = products.find(p => p.category === DEFAULT_TAB && p.img);
if (firstLcp) {
  const preloadTag = `  <link rel="preload" as="image" href="/${firstLcp.img}" fetchpriority="high">`;
  html = html.replace('</head>', `${preloadTag}\n</head>`);
}

writeFileSync(htmlPath, html, 'utf8');
console.log(`generate-static: schema (${products.length} products) + noscript  →  dist/catalog.html`);
if (firstLcp) console.log(`generate-static: LCP preload injected → /${firstLcp.img}`);

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
  .map(p => ({ loc: canonicalUrl(p), priority: '0.8', changefreq: 'monthly' }));

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

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── 7. Per-product pages (dist/product/{id}/index.html) ─────────────────────
// Real, individually-indexable pages — each with its own Product schema, so
// Google can discover/validate every product on its own instead of relying
// on the single ItemList blob in catalog.html.

const productDir = join(DIST, 'product');

function buildProductPage(p) {
  const url        = canonicalUrl(p);
  const name        = escHtml(cleanName(p.name));
  const rawDesc     = p.desc ? cleanName(p.desc) : '';
  const shortDesc   = p.desc ? cleanName(p.desc.split('|')[0].trim()) : cleanName(p.name);
  const desc        = escHtml(shortDesc);
  const imgUrl      = imageUrl(p);
  const catalogLink = `${BASE_URL}/catalog.html?product=${encodeURIComponent(p.id)}`;
  const offers      = offersFor(p, url);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cleanName(p.name),
    description: shortDesc,
    image: imgUrl,
    brand: { '@type': 'Brand', name: 'LEDLink' },
    url,
    ...(offers ? { offers } : {})
  };

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — LEDLink</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<script type="application/ld+json">${JSON.stringify(productSchema)}</script>
<style>
  body{font-family:'Heebo',sans-serif;direction:rtl;background:#F4F4F0;color:#1C1C1C;margin:0;padding:24px}
  main{max-width:720px;margin:0 auto}
  img{max-width:100%;border-radius:12px;margin:16px 0}
  a.btn{display:inline-block;margin-top:16px;padding:12px 24px;background:#E8A020;color:#1C1C1C;text-decoration:none;border-radius:8px;font-weight:700}
  h1{font-size:24px}
</style>
</head>
<body>
<main>
  <h1>${name}</h1>
  <img src="${imgUrl}" alt="${name}" loading="lazy">
  <p>${escHtml(rawDesc)}</p>
  <a class="btn" href="${catalogLink}">צפייה בקטלוג המלא</a>
</main>
</body>
</html>`;
}

for (const p of products) {
  const dir = join(productDir, p.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), buildProductPage(p), 'utf8');
}
console.log(`generate-static: product pages  →  dist/product/  (${products.length} pages)`);

// ── 8. Share pages (dist/share/{id}.html) ───────────────────────────────────

const shareDir = join(DIST, 'share');
mkdirSync(shareDir, { recursive: true });

function buildSharePage(p) {
  const name    = escHtml(cleanName(p.name));
  const rawDesc = p.desc ? cleanName(p.desc.split('|')[0].trim()) : '';
  const desc    = escHtml(rawDesc);
  const imgUrl  = p.img
    ? (p.img.startsWith('http') ? p.img : `${BASE_URL}/${p.img}`)
    : `${BASE_URL}/hero.webp`;
  const pageUrl = `${BASE_URL}/share/${p.id}.html`;
  const target  = `${BASE_URL}/catalog.html?product=${encodeURIComponent(p.id)}`;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=${target}">
<link rel="canonical" href="${target}">
<title>${name} — LEDLink</title>
<meta name="robots" content="noindex">

<!-- Open Graph -->
<meta property="og:type" content="product">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${name} — LEDLink">
<meta property="og:description" content="${desc || 'רכיב LED מקצועי — LEDLink'}">
<meta property="og:image" content="${imgUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="LEDLink">

<!-- Twitter / WhatsApp fallback -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${name} — LEDLink">
<meta name="twitter:description" content="${desc || 'רכיב LED מקצועי — LEDLink'}">
<meta name="twitter:image" content="${imgUrl}">
</head>
<body>
<p style="font-family:sans-serif;direction:rtl;padding:16px">
  מועבר לדף המוצר… <a href="${target}">${name}</a>
</p>
</body>
</html>`;
}

for (const p of products) {
  writeFileSync(join(shareDir, `${p.id}.html`), buildSharePage(p), 'utf8');
}
console.log(`generate-static: share pages  →  dist/share/  (${products.length} files)`);

// ── 9. robots.txt ────────────────────────────────────────────────────────────

const robotsTxt = `\
User-agent: *
Allow: /

# Block query parameters that generate duplicate content.
# ?tab= and ?tool= are allowed (meaningful navigation, canonical tag handles dedup).
Disallow: /*?q=
Disallow: /*?filter=
Disallow: /*?search=
Disallow: /*?ip=
Disallow: /*?voltage=
Disallow: /*?power=
Disallow: /*?color=
Disallow: /*?type=
Disallow: /*?lmw=
Disallow: /*?dimming=
Disallow: /*?output=
Disallow: /*?%D7%A2%D7%9E%D7%A2%D7%95%D7%9D=
Disallow: /*?%D7%94%D7%A1%D7%A4%D7%A7=
Disallow: /*?עמעום=
Disallow: /*?הספק=

Sitemap: ${BASE_URL}/sitemap.xml
`;
writeFileSync(join(DIST, 'robots.txt'), robotsTxt, 'utf8');
console.log('generate-static: robots.txt  →  dist/robots.txt');
