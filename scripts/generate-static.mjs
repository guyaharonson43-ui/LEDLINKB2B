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
copyDir('product-images');   // תמונות מוצר עם רקע מוסר (cutout-product-images.mjs)
copyDir('strips');
copyDir('projects');
copyDir('DATASHEET');
copyDir('datasheets');
// libs/ (CDN fallbacks) removed — tools.html is now Vite-built, no CDN deps needed

// Root-level static files
for (const f of [
  'manifest.json', 'CNAME', 'hero.jpg', 'hero.webp',
  'a11y-widget.js', 'products_data.js', 'datasheets_data.js',
  'llms.txt', 'logo.png',
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

// datasheets_data.js: `const PRODUCT_DATASHEETS = {...}; export default PRODUCT_DATASHEETS;`
// Same lookup order as ProductModal.jsx: by product.id first, then product.name.
const datasheetsSrc = readFileSync(join(ROOT, 'datasheets_data.js'), 'utf8')
  .replace(/^export\s+default\s+\S+\s*;?\s*$/gm, '');
const datasheets = new Function(datasheetsSrc + '\nreturn PRODUCT_DATASHEETS;')();

// אותו סינון כמו בקטלוג: לינק לקובץ שאינו קיים מחזיר 404, וגרוע מהיעדר
// לינק. הדפים הסטטיים משרתים גם את מנועי החיפוש, ולכן חשוב שלא יפרסמו
// הפניות שבורות.
const existingFiles = new Set(
  ['datasheets', 'DATASHEET']
    .filter(dir => existsSync(join(ROOT, dir)))
    .flatMap(dir => readdirSync(join(ROOT, dir)).map(f => dir + '/' + f))
);

function datasheetsFor(p) {
  const list = datasheets[p.id] || datasheets[p.name] || [];
  return list.filter(d => existingFiles.has(d.file));
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

// ── 3. Schema.org ItemList (all products) ────────────────────────────────────

// Each product has its own page carrying the full Product schema, so the
// catalog only needs a summary ItemList pointing at those pages (Google's
// recommended pattern for list pages) instead of 500+ inline Product objects.
const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'קטלוג מוצרי LEDLink',
  numberOfItems: products.length,
  itemListElement: products.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: canonicalUrl(p),
    name: cleanName(p.name)
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
    // p.url is the old WordPress slug (404s on this site) — link our own product page
    const link = `<a href="${canonicalUrl(p)}">${escHtml(name)}</a>`;
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
// Product pages don't have a real per-product last-modified date to report —
// stamping all ~700 of them with today's build date is a false-freshness
// signal search engines flag as suspicious. Omit <lastmod> for those; keep it
// only on the handful of static pages where "today" is a reasonable proxy.
const sitemapProducts = products
  .map(p => ({ loc: canonicalUrl(p), priority: '0.8', changefreq: 'monthly' }));

const sitemapAll = [
  ...sitemapStatic.map(u => ({ ...u, lastmod: today })),
  ...sitemapProducts,
];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapAll.map(u => `  <url>
    <loc>${u.loc}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`generate-static: sitemap.xml  →  ${sitemapAll.length} URLs`);

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── 7. Per-product pages (dist/product/{id}/index.html) ─────────────────────
// Real, individually-indexable pages — each with its own Product +
// BreadcrumbList schema, a descriptive title/description, a spec table,
// related-product links and the site header/footer, so every page stands on
// its own for search engines and AI crawlers (which don't run the catalog JS).

const productDir = join(DIST, 'product');
const WA_NUMBER  = '972504722550';

const CATEGORY_INFO = {
  'פרופילים': {
    blurb: 'פרופילי האלומיניום של LEDLink מיוצרים במפעל שלנו ברחובות ונחתכים לפי מידה עד 6 מטר, בשחור, בלבן או בכל גוון RAL. הפרופיל מפזר את החום מהסטריפ, מאריך את חייו ומסתיר את נקודות האור מאחורי כיסוי אחיד.',
    links: [['איזה פרופיל LED מתאים לאיזה חלל?', '/guides.html'], ['מחשבון פרופיל LED', '/tools.html?tool=linear']],
    tail: 'ייצור וחיתוך לפי מידה ברחובות, משלוח לכל הארץ.',
  },
  'סטריפ LED': {
    blurb: 'סטריפ LED מקצועי לתאורה ארכיטקטונית ולתאורת פנים וחוץ. לבחירת ספק כוח מתאים חשבו את ההספק הכולל (אורך × הספק למטר) והוסיפו מרווח ביטחון של 20% לפחות.',
    links: [['מחשבון ספק כוח', '/tools.html?tool=power'], ['מחשבון מפל מתח', '/tools.html?tool=voltage'], ['איך מחשבים הספק לסטריפ LED?', '/guides.html']],
    tail: 'ייעוץ טכני ללא עלות ומשלוח לכל הארץ.',
  },
  'דרייברים': {
    blurb: 'דרייבר (ספק כוח) ממיר את מתח הרשת למתח קבוע (CV) עבור סטריפ LED, או לזרם קבוע (CC) עבור גופי תאורה ומודולים. מומלץ לבחור דרייבר שההספק שלו גבוה ב-20% לפחות מהעומס בפועל.',
    links: [['מחשבון ספק כוח', '/tools.html?tool=power'], ['מחשבון מפל מתח', '/tools.html?tool=voltage']],
    tail: 'ייעוץ טכני ללא עלות ומשלוח לכל הארץ.',
  },
  'גופי תאורה': {
    blurb: 'גופי תאורה מקצועיים לפרויקטים של מגורים, משרדים ומסחר. צוות LEDLink ישמח לעזור בתכנון התאורה ובבחירת הגוף המתאים לחלל.',
    links: [['מחשבון לומן לחלל', '/tools.html?tool=lumen'], ['גוון אור 2700K, 3000K או 4000K?', '/guides.html']],
    tail: 'ייעוץ תאורה ללא עלות ומשלוח לכל הארץ.',
  },
};

const hasHebrew = s => /[֐-׿]/.test(s);

// Visible product name. Profiles are named by bare model number ("1013") and
// drivers by the supplier's Latin code ("BRICK060"); prefix them with what the
// product actually is so the title/H1 match what people search for.
function displayName(p) {
  let n = cleanName(p.name).replace(/\bALIMENTATORE\b\s*/gi, '').replace(/\s+/g, ' ').trim();
  if (p.category === 'פרופילים' && !n.includes('פרופיל')) n = `פרופיל אלומיניום LED ${n}`;
  else if (p.category === 'דרייברים' && !hasHebrew(n)) {
    const isControl = /INTERFACE|TRANSMITTER|REPEATER|SENSORE|PIR|TIMER|REMOTE/i.test(n);
    n = `${isControl ? 'בקר LED' : 'דרייבר LED'} ${n}`;
  }
  return n;
}

// Label unlabelled desc fragments ("24V", "IP20", "3000K") by their shape.
function guessLabel(v) {
  if (/^IP\d+/i.test(v))                 return 'דרגת הגנה';
  if (/lm\/w/i.test(v))                  return 'יעילות אורית';
  if (/lm(\/m)?$/i.test(v))              return 'שטף אור';
  if (/W(\/m)?$/i.test(v))               return 'הספק';
  if (/^\d+(\.\d+)?\s*V(DC|AC)?$/i.test(v)) return 'מתח';
  if (/\d{4}K/.test(v))                  return 'גוון אור';
  if (/°$/.test(v))                      return 'זווית פיזור';
  if (/אורך/.test(v))                    return 'אורך';
  return 'מאפיין';
}

const OUTPUT_MODE = { CV: 'מתח קבוע (CV)', CC: 'זרם קבוע (CC)', DALI: 'DALI' };
// Same mapping as src/catalog/utils/driverMeta.js, so the product page and the
// catalog show the same input range.
const INPUT_VOLTAGE = { '110V': 'AC 220-240V', '230V': 'AC 220-240V', '100÷250V AC': 'AC 100-250V' };

// Normalised [label, value] spec rows from whichever fields the product has.
function specRows(p) {
  const rows = [];
  const seen = new Set();
  const add = (label, value) => {
    value = String(value || '').trim();
    if (!value || seen.has(label + value)) return;
    seen.add(label + value);
    rows.push([label, value]);
  };

  if (p.sku) add('מק"ט', p.sku);

  if (p.desc) {
    for (const part of cleanName(p.desc).split('|').map(s => s.trim()).filter(Boolean)) {
      const m = part.match(/^([^:]{1,20}):\s*(.+)$/);
      if (m) add(m[1].trim() === 'מקט' ? 'מק"ט' : m[1].trim(), m[2]);
      else if (p.category === 'פרופילים' && hasHebrew(part) && !/צבע|אורך/.test(part)) add('סוג', part);
      else {
        const label = guessLabel(part);
        add(label, label === 'אורך' ? part.replace(/^אורך\s*(יחידה)?\s*/, '') : part);
      }
    }
  }

  const s = p.specs || {};
  if (s.power)       add('הספק', s.power);
  if (s.outputMode)  add('סוג יציאה', OUTPUT_MODE[s.outputMode] || s.outputMode);
  if (s.voltage)     /MA$/i.test(s.voltage) ? add('זרם יציאה', s.voltage.replace(/MA$/i, 'mA'))
                                            : add(p.category === 'דרייברים' ? 'מתח יציאה' : 'מתח', s.voltage);
  if (s.inputVoltage && p.category === 'דרייברים') add('מתח כניסה', INPUT_VOLTAGE[s.inputVoltage] || s.inputVoltage);
  if (s.ip)          add('דרגת הגנה', s.ip);
  if (Array.isArray(s.dimming) && s.dimming.length) add('עמעום ושליטה', s.dimming.join(', '));
  if (p.cri)         add('CRI', `${p.cri}+`);

  for (const [k, v] of Object.entries(p.extractedSpecs || {})) {
    if (!rows.some(r => r[1] === String(v).trim())) add(k, v);
  }

  // Drop generic rows whose value already appears under a real label.
  const labelled = new Set(rows.filter(r => r[0] !== 'מאפיין').map(r => r[1]));
  return rows.filter(r => r[0] !== 'מאפיין' || !labelled.has(r[1]));
}

function skuFor(p, rows) {
  if (p.sku) return p.sku;
  const r = rows.find(r => r[0] === 'מק"ט');
  if (r) return r[1];
  const name = cleanName(p.name);
  if (name.includes('—')) return name.split('—').pop().trim();
  // QLT driver ids are the model code (qlt-th24030u → TH24030U) — more reliable
  // than the display name, which is sometimes shared between two models.
  if (p.category === 'דרייברים' && p.id.startsWith('qlt-')) return p.id.slice(4).toUpperCase();
  return p.category === 'דרייברים' ? name.split(' ')[0] : null;
}

// Title suffix for drivers, whose names carry no specs ("BRICK060").
function titleSpecs(p) {
  if (p.category !== 'דרייברים') return '';
  const s = p.specs || {};
  const bits = [s.power, s.outputMode === 'CV' || s.outputMode === 'CC' ? s.outputMode : '',
                s.voltage && /MA$/i.test(s.voltage) ? s.voltage.replace(/MA$/i, 'mA') : s.voltage, s.ip]
    .filter(Boolean);
  return bits.length ? ` — ${bits.join(' ')}` : '';
}

function metaDescription(p, name, rows) {
  const info = CATEGORY_INFO[p.category] || CATEGORY_INFO['גופי תאורה'];
  const specs = rows.filter(r => r[0] !== 'מק"ט' && r[0] !== 'מתח כניסה').slice(0, 4).map(r => r[1]).join(', ');
  let d = `${name} מבית LEDLink${specs ? ` — ${specs}` : ''}. ${info.tail}`;
  if (d.length > 160) d = d.slice(0, 157).replace(/[\s,—-]+\S*$/, '') + '…';
  return d;
}

// Up to 6 products from the same category, most similar first: same variant
// family, then same sub-category / family / output mode. Stable, so builds
// are reproducible.
function relatedProducts(p) {
  const score = q =>
    (p.variantFamily && q.variantFamily === p.variantFamily ? 8 : 0) +
    (p.subCategory && q.subCategory === p.subCategory ? 4 : 0) +
    (p.family && q.family === p.family ? 2 : 0) +
    (p.specs?.outputMode && q.specs?.outputMode === p.specs.outputMode ? 1 : 0);
  return products
    .filter(q => q.id !== p.id && q.category === p.category)
    .map((q, i) => ({ q, s: score(q), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, 6)
    .map(x => x.q);
}

// Titles must be unique; variants with identical names get their SKU appended.
const titleCounts = {};
for (const p of products) {
  const t = displayName(p) + titleSpecs(p);
  titleCounts[t] = (titleCounts[t] || 0) + 1;
}

const PRODUCT_PAGE_CSS = `
  *{box-sizing:border-box}
  body{font-family:'Heebo',Arial,sans-serif;direction:rtl;background:#F4F4F0;color:#1C1C1C;margin:0;line-height:1.6}
  a{color:inherit}
  .nav{background:#1A1A1A;padding:0 16px}
  .nav-in{max-width:1100px;margin:0 auto;height:60px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .logo{direction:ltr;text-decoration:none;font-size:22px;white-space:nowrap}
  .logo b{color:#E8A020;font-weight:900}.logo span{color:#fff;font-weight:300}
  .nav-links{display:flex;gap:20px;overflow-x:auto}
  .nav-links a{color:#AAA;text-decoration:none;font-size:14px;font-weight:500;white-space:nowrap}
  .nav-links a:hover{color:#E8A020}
  main{max-width:1100px;margin:0 auto;padding:20px 16px 48px}
  .crumbs{font-size:13px;color:#777;margin-bottom:20px}
  .crumbs a{text-decoration:none;color:#777}.crumbs a:hover{color:#C4880A}
  .crumbs span{margin:0 6px;color:#BBB}
  .top{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start}
  .media{background:#fff;border:1px solid #E0DDD6;border-radius:12px;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;padding:24px}
  .media img{max-width:100%;max-height:100%;object-fit:contain}
  .cat{color:#C4880A;font-weight:700;font-size:13px;letter-spacing:.5px;margin-bottom:8px}
  h1{font-size:clamp(24px,3vw,34px);font-weight:800;line-height:1.25;margin:0 0 16px}
  table.specs{width:100%;border-collapse:collapse;background:#fff;border:1px solid #E0DDD6;border-radius:8px;overflow:hidden;font-size:14px;margin-bottom:20px}
  .specs th,.specs td{padding:10px 14px;text-align:right;border-bottom:1px solid #EEEBE4;vertical-align:top}
  .specs tr:last-child th,.specs tr:last-child td{border-bottom:0}
  .specs th{width:38%;color:#666;font-weight:600;background:#FAFAF7}
  .actions{display:flex;gap:12px;flex-wrap:wrap}
  .btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px}
  .btn-wa{background:#E8A020;color:#1C1C1C}.btn-wa:hover{background:#C4880A}
  .btn-cat{border:1px solid #1C1C1C;color:#1C1C1C}
  h2{font-size:20px;font-weight:800;margin:40px 0 14px}
  .docs{display:flex;flex-direction:column;gap:8px;margin-top:20px}
  .docs a{padding:10px 14px;background:#fff;border:1px solid #E0DDD6;border-radius:6px;color:#C4880A;text-decoration:none;font-weight:600;font-size:14px}
  .about{background:#fff;border:1px solid #E0DDD6;border-radius:12px;padding:20px 24px;max-width:800px}
  .about p{margin:0 0 12px}
  .about ul{margin:0;padding-inline-start:20px}
  .about a{color:#C4880A;font-weight:600}
  .rel{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
  .rel a{background:#fff;border:1px solid #E0DDD6;border-radius:10px;padding:12px;text-decoration:none;font-size:13px;font-weight:600;display:flex;flex-direction:column;gap:8px}
  .rel a:hover{border-color:#E8A020}
  .rel img{width:100%;aspect-ratio:1/1;object-fit:contain}
  footer{background:#1A1A1A;color:#AAA;font-size:14px;padding:32px 16px}
  .foot-in{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:12px 32px;justify-content:space-between}
  footer a{color:#AAA;text-decoration:none}footer a:hover{color:#E8A020}
  footer strong{color:#fff}
  @media (max-width:760px){
    .top{grid-template-columns:1fr;gap:20px}
    .nav-links{gap:14px}.nav-links a{font-size:13px}
    .actions .btn{flex:1 1 100%}
  }
`;

function buildProductPage(p) {
  const url      = canonicalUrl(p);
  const info     = CATEGORY_INFO[p.category] || CATEGORY_INFO['גופי תאורה'];
  const name     = displayName(p);
  const rows     = specRows(p);
  const sku      = skuFor(p, rows);
  let   title    = name + titleSpecs(p);
  if (titleCounts[title] > 1 && sku && !title.split(/[\s—()]+/).includes(sku)) title += ` (${sku})`;
  const desc     = metaDescription(p, name, rows);
  const imgUrl   = imageUrl(p);
  const tabUrl   = `${BASE_URL}/catalog.html?tab=${encodeURIComponent(p.category)}`;
  const catalogLink = `${BASE_URL}/catalog.html?product=${encodeURIComponent(p.id)}`;
  const waText   = `שלום, אשמח להצעת מחיר על ${name}${sku ? ` (מק"ט ${sku})` : ''}\n${url}`;
  const waLink   = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`;
  const ds       = datasheetsFor(p);
  const related  = relatedProducts(p);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: desc,
    image: imgUrl,
    brand: { '@type': 'Brand', name: 'LEDLink' },
    category: p.category,
    ...(sku ? { sku } : {}),
    url,
    ...(rows.length ? {
      additionalProperty: rows.filter(r => r[0] !== 'מק"ט')
        .map(([n, v]) => ({ '@type': 'PropertyValue', name: n, value: v }))
    } : {})
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      ['דף הבית', `${BASE_URL}/`],
      ['קטלוג', `${BASE_URL}/catalog.html`],
      [p.category, tabUrl],
      [name, url],
    ].map(([n, item], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item }))
  };
  // "</" inside JSON would close the <script> early
  const ld = o => JSON.stringify(o).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)} | LEDLink</title>
<meta name="description" content="${escHtml(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="product">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escHtml(title)} | LEDLink">
<meta property="og:description" content="${escHtml(desc)}">
<meta property="og:image" content="${imgUrl}">
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="LEDLink">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" as="image" href="${imgUrl}" fetchpriority="high">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">${ld(productSchema)}</script>
<script type="application/ld+json">${ld(breadcrumbSchema)}</script>
<style>${PRODUCT_PAGE_CSS}</style>
</head>
<body>
<header class="nav"><div class="nav-in">
  <a class="logo" href="/"><b>LED</b><span>LINK</span></a>
  <nav class="nav-links" aria-label="ניווט ראשי">
    <a href="/catalog.html">קטלוג</a>
    <a href="/tools.html">כלי תכנון</a>
    <a href="/guides.html">מדריכים</a>
    <a href="/about.html">אודות</a>
    <a href="/faq.html">שאלות נפוצות</a>
  </nav>
</div></header>
<main>
  <nav class="crumbs" aria-label="פירורי לחם">
    <a href="/">דף הבית</a><span>›</span><a href="/catalog.html">קטלוג</a><span>›</span><a href="${tabUrl}">${escHtml(p.category)}</a><span>›</span>${escHtml(name)}
  </nav>
  <div class="top">
    <div class="media"><img src="${imgUrl}" alt="${escHtml(name)}" fetchpriority="high"></div>
    <div>
      <div class="cat">${escHtml(p.category)}${p.subCategory ? ' · ' + escHtml(p.subCategory) : ''}</div>
      <h1>${escHtml(name)}</h1>
      ${rows.length ? `<table class="specs"><tbody>${rows.map(([l, v]) =>
        `<tr><th scope="row">${escHtml(l)}</th><td>${escHtml(v)}</td></tr>`).join('')}</tbody></table>` : ''}
      <div class="actions">
        <a class="btn btn-wa" href="${waLink}" target="_blank" rel="noopener">לקבלת הצעת מחיר בוואטסאפ</a>
        <a class="btn btn-cat" href="${catalogLink}">צפייה בקטלוג</a>
      </div>
      ${ds.length ? `<div class="docs">${ds.map(d =>
        `<a href="${BASE_URL}/${d.file}" target="_blank" rel="noopener">${escHtml(d.label)}</a>`).join('')}</div>` : ''}
    </div>
  </div>

  <h2>על ${escHtml(p.category)} של LEDLink</h2>
  <div class="about">
    <p>${escHtml(info.blurb)}</p>
    <ul>${info.links.map(([t, h]) => `<li><a href="${h}">${escHtml(t)}</a></li>`).join('')}</ul>
  </div>

  ${related.length ? `<h2>מוצרים דומים</h2>
  <div class="rel">${related.map(q => {
    const qn = displayName(q);
    return `<a href="${canonicalUrl(q)}"><img src="${imageUrl(q)}" alt="${escHtml(qn)}" loading="lazy" decoding="async">${escHtml(qn)}</a>`;
  }).join('')}</div>` : ''}
</main>
<footer><div class="foot-in">
  <div><strong>LEDLink</strong> · יצרן רכיבי תאורת LED מאז 2009 · יצירה 19, רחובות</div>
  <div><a href="tel:+97286326059">08-6326059</a> · <a href="mailto:office@ledlink.co.il">office@ledlink.co.il</a> · א׳–ה׳ <span dir="ltr">07:00–15:00</span></div>
</div></footer>
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
