// סנכרון ערכי הסינון של דרייברים וסטריפים מאתר היצרן QLT.
//
// הסינון בקטלוג עובד בדיוק על אותם ערכים שמוצגים בפילטרים של qlt.it — לא על
// specs שיובאו פעם ונסחפו. דוגמה: SLIMBOX60 1 רשום אצלנו כ-1-10V בלבד, ולכן
// לא היה ברור אם הוא נעלם מסינון DALI בגלל באג או בגלל שאינו DALI. כשהערכים
// מגיעים מהיצרן, התוצאה אצלנו זהה לתוצאה שם.
//
// המקור: ה-REST API הציבורי של האתר (WordPress), אותן טקסונומיות שעליהן
// בנויים הפילטרים בדפי הקטגוריה.
//
// הרצה: npm run sync:qlt   ← כותב את src/catalog/data/qltFacets.js
// הקובץ נשמר בריפו. ה-build לא ניגש לרשת, כדי שפריסה לא תיכשל בגלל אתר חיצוני.

import { writeFile } from 'node:fs/promises';
import products from '../products_data_with_lighting.js';

const API = 'https://www.qlt.it/wp-json/wp/v2';
const OUT = new URL('../src/catalog/data/qltFacets.js', import.meta.url);

// הטקסונומיות שעליהן בנויים פילטרי QLT בשני דפי הקטגוריה
const TAXONOMIES = [
  'products_category',
  // דרייברים
  'power', 'output_mode', 'constant_voltage', 'constant_current',
  'insulation_class', 'input_voltage', 'dimmable',
  // סטריפים
  'operating_voltage', 'watt_mt', 'cri', 'color_temperature',
  'led_type', 'ip_class', 'lumen_watt',
];

const CATEGORIES = ['דרייברים', 'סטריפ LED'];

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'LEDLink-catalog-sync/1.0' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return { body: await res.json(), pages: Number(res.headers.get('x-wp-totalpages') || 1) };
}

async function getAll(path, params) {
  const out = [];
  for (let page = 1; ; page++) {
    const qs = new URLSearchParams({ ...params, per_page: '100', page: String(page) });
    const { body, pages } = await getJson(`${API}/${path}?${qs}`);
    out.push(...body);
    if (page >= pages) return out;
  }
}

// שמות המונחים והכותרות מגיעים מקודדים ל-HTML (">95" מגיע כ-"&gt;95").
// &amp; אחרון, כדי ש-"&amp;gt;" לא יפוענח פעמיים.
function decodeEntities(s) {
  return String(s ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();
}

const normKey = s => decodeEntities(s).toUpperCase().replace(/[^A-Z0-9]+/g, '');

function slugFromUrl(url) {
  const m = (url || '').match(/qlt\.it\/(?:[a-z]{2}\/)?products\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]).toLowerCase() : null;
}

// ---------------------------------------------------------------------------

const qltProducts = await getAll('products', {
  lang: 'en',
  _fields: ['id', 'slug', 'title', ...TAXONOMIES].join(','),
});
console.log(`מוצרים ב-QLT: ${qltProducts.length}`);

const qltBySlug  = new Map(qltProducts.map(q => [q.slug, q]));
const qltByTitle = new Map();
for (const q of qltProducts) {
  const k = normKey(q.title?.rendered);
  qltByTitle.set(k, [...(qltByTitle.get(k) || []), q]);
}

// התאמת מוצר מהקטלוג למוצר ב-QLT.
//
// הקישור השמור על המוצר לא תמיד עדכני: QLT שינתה חלק מה-slugs מאז הייבוא
// (pul42be-multicurrent → pul42be-multicurrent-dimmable, track29 → track29-2).
// לכן שלושה שלבים, מהמחמיר למקל, וכל התאמה שאינה slug מדויק מודפסת לבדיקה:
//   1. slug זהה
//   2. שם הדגם זהה לכותרת (בסטריפים — הקוד שאחרי "—" בשם העברי)
//   3. ה-slug הישן הוא קידומת של slug יחיד אחד בלבד
function findQlt(p) {
  const slug = slugFromUrl(p.url);
  if (slug && qltBySlug.has(slug)) return { qp: qltBySlug.get(slug), how: 'slug' };

  const model = p.name.split('—').pop();
  const byTitle = qltByTitle.get(normKey(model)) || [];
  if (byTitle.length === 1) return { qp: byTitle[0], how: 'title' };

  if (slug) {
    const cands = qltProducts.filter(q => q.slug.startsWith(`${slug}-`));
    if (cands.length === 1) return { qp: cands[0], how: 'prefix' };
    if (cands.length > 1) return { ambiguous: cands.map(c => c.slug) };
  }
  return null;
}

// מזהי מונחים → שם
const terms = new Map();
for (const tax of TAXONOMIES) {
  for (const t of await getAll(tax, { lang: 'en', _fields: 'id,name' })) {
    terms.set(t.id, decodeEntities(t.name));
  }
}

const facets = {};
const report = { slug: 0, title: [], prefix: [], ambiguous: [], none: [] };
const unresolved = [];

for (const p of products.filter(x => CATEGORIES.includes(x.category))) {
  const hit = findQlt(p);
  if (!hit) {
    // מוצר בלי קישור ל-QLT הוא מוצר של LEDLink עצמה — צפוי, ולא נספר ככישלון
    if (slugFromUrl(p.url)) report.none.push(`${p.id} (${slugFromUrl(p.url)})`);
    continue;
  }
  if (hit.ambiguous) { report.ambiguous.push(`${p.id} → ${hit.ambiguous.join(' | ')}`); continue; }

  if (hit.how === 'slug') report.slug++;
  else report[hit.how].push(`${p.id} "${p.name}" → ${hit.qp.slug} "${decodeEntities(hit.qp.title?.rendered)}"`);

  const entry = {};
  for (const tax of TAXONOMIES) {
    const names = (hit.qp[tax] || []).map(id => {
      if (!terms.has(id)) unresolved.push(`${p.id} ${tax}:${id}`);
      return terms.get(id);
    }).filter(Boolean);
    if (names.length) entry[tax] = names;
  }
  facets[p.id] = entry;
}

const header = `// נוצר אוטומטית ע"י scripts/sync-qlt-facets.mjs — לא לערוך ידנית. להרצה: npm run sync:qlt
// ערכי הסינון של כל מוצר כפי שהם רשומים באתר היצרן qlt.it.
// סונכרן: ${new Date().toISOString().slice(0, 10)} · ${Object.keys(facets).length} מוצרים
`;
// שורה לכל מוצר — כך סנכרון הבא מראה ב-diff בדיוק אילו מוצרים השתנו
const body = Object.entries(facets).map(([id, f]) => `  ${JSON.stringify(id)}: ${JSON.stringify(f)},`).join('\n');
await writeFile(OUT, `${header}export default {\n${body}\n};\n`);

const list = (title, rows) => rows.length && console.log(`\n${title} (${rows.length}):\n  ${rows.join('\n  ')}`);
console.log(`\nנכתבו ${Object.keys(facets).length} מוצרים · slug מדויק: ${report.slug}`);
list('הותאמו לפי שם הדגם', report.title);
list('הותאמו לפי קידומת slug', report.prefix);
list('כמה מועמדים — לא הותאמו', report.ambiguous);
list('מקושרים ל-QLT אך לא נמצאו', report.none);
list('מונחים שלא זוהו', unresolved);
