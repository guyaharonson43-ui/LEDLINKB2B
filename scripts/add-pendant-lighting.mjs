// שולף את קטגוריית "גופי תאורה תלויים" (page_50609) מ-eurolux.co.il ומוסיף אותה
// כקטגוריה עליונה חדשה "גופי תלייה" ל-lighting_data.js ול-products_data_with_lighting.js.
// הרצה: node scripts/add-pendant-lighting.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_URL = 'https://www.eurolux.co.il/page_50609';
const IMG_BASE = 'https://www.eurolux.co.il/Media/Resize/250_250/';
const COLORS = ['שחור', 'לבן', 'ברונזה', 'פליז', 'כרום', 'זהב', 'אפור'];

function extractSpecs(title) {
  const specs = [];
  const w = title.match(/(\d+(?:\.\d+)?)\s*(?:וואט|W)\b/i);
  if (w) specs.push(`${w[1]}W`);
  const k = title.match(/(\d{3,4})\s*K\b/);
  if (k) specs.push(`${k[1]}K`);
  const ip = title.match(/IP(\d{2})/i);
  if (ip) specs.push(`IP${ip[1]}`);
  if (/\bE27\b/i.test(title)) specs.push('E27');
  if (/\bGU10\b/i.test(title)) specs.push('GU10');
  if (/\bCCT\b/i.test(title)) specs.push('CCT');
  const deg = title.match(/(\d+)\s*°/);
  if (deg) specs.push(`${deg[1]}°`);
  return specs;
}

function extractedSpecsFromTags(tags, title) {
  const out = {};
  for (const t of tags) {
    if (/W$/.test(t)) out['הספק'] = t;
    else if (/K$/.test(t)) out['גוון אור'] = t;
    else if (/^IP/.test(t)) out['אטימה'] = t;
  }
  const color = COLORS.find((c) => title.includes(c));
  if (color) out['צבע'] = color;
  return out;
}

function slug(sku) {
  return sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function fetchProducts() {
  const res = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const chunks = html.split('class="item text-center"').slice(1);
  const products = [];
  for (const c of chunks) {
    const img = /src="Media\/Resize\/250_250\/([^"]+)"/.exec(c);
    const sku = /מק"ט:\s*([^<]+)</.exec(c);
    const title = /<h2>([^<]+)<\/h2>/.exec(c);
    const price = /<span id="price\d+">([^<]+)<\/span>/.exec(c);
    if (!sku || !title || !img || !price) continue;
    const t = title[1].trim();
    products.push({
      sku: sku[1].trim(),
      t,
      specs: extractSpecs(t),
      price: parseFloat(price[1].replace(/,/g, '')),
      img: IMG_BASE + img[1],
    });
  }
  return products;
}

async function main() {
  const products = await fetchProducts();
  if (products.length === 0) throw new Error('לא נמצאו מוצרים — ייתכן שמבנה העמוד השתנה');
  console.log(`נשלפו ${products.length} מוצרי תלייה מ-${SOURCE_URL}`);

  const ledFamily = products.filter((p) => /^CL[-/]/.test(p.sku));
  const classicFamily = products.filter((p) => !/^CL[-/]/.test(p.sku));

  const newCat = {
    id: 'pendant',
    t: 'גופי תלייה',
    d: 'גופי תאורה תלויים — לד משולב וקלאסי E27, מגוון סגנונות לתלייה מהתקרה.',
    families: [
      {
        id: 'pendant-led',
        t: 'תלויות LED משולבות',
        sections: [{ t: 'גופי תאורה', products: ledFamily }],
        n: ledFamily.length,
      },
      {
        id: 'pendant-e27',
        t: 'תלויות קלאסיות E27',
        sections: [{ t: 'גופי תאורה', products: classicFamily }],
        n: classicFamily.length,
      },
    ],
    n: products.length,
  };

  // 1) עדכון lighting_data.js
  const dataPath = join(ROOT, 'lighting_data.js');
  const dataSrc = readFileSync(dataPath, 'utf8');
  const dataHeader = dataSrc.split('\n').slice(0, 2).join('\n');
  const sandbox = { window: {} };
  new Function('window', dataSrc.split('\n').slice(2).join('\n'))(sandbox.window);
  const catalog = sandbox.window.LL_CATALOG;
  catalog.cats.push(newCat);
  catalog.realTotal = (catalog.realTotal || 0) + products.length;
  catalog.grandTotal = (catalog.grandTotal || 0) + products.length;
  writeFileSync(dataPath, `${dataHeader}\nwindow.LL_CATALOG = ${JSON.stringify(catalog, null, 1)};\n`);
  console.log(`עודכן lighting_data.js — realTotal=${catalog.realTotal}, grandTotal=${catalog.grandTotal}`);

  // 2) עדכון products_data_with_lighting.js
  const mergedPath = join(ROOT, 'products_data_with_lighting.js');
  let mergedSrc = readFileSync(mergedPath, 'utf8');

  const newEntries = products.map((p) => {
    const family = /^CL[-/]/.test(p.sku) ? 'תלויות LED משולבות' : 'תלויות קלאסיות E27';
    const entry = {
      id: `ll-light-${slug(p.sku)}`,
      sku: p.sku,
      name: p.t,
      img: p.img,
      desc: p.specs.join(' | '),
      category: 'גופי תאורה',
      subCategory: 'גופי תלייה',
      family,
      price: p.price,
      url: null,
      isFlagship: false,
      scarcity: null,
      specTags: p.specs,
      extractedSpecs: extractedSpecsFromTags(p.specs, p.t),
    };
    return JSON.stringify(entry, null, 2).replace(/\n/g, '\r\n  ');
  });

  const insertRe = /\r?\n\];\r?\n\r?\nif \(typeof window/;
  if (!insertRe.test(mergedSrc)) {
    throw new Error('לא נמצא מיקום ההכנסה בסוף המערך — בדוק את מבנה הקובץ');
  }
  mergedSrc = mergedSrc.replace(
    insertRe,
    `,\r\n  ${newEntries.join(',\r\n  ')}\r\n];\r\n\r\nif (typeof window`
  );

  const before = mergedSrc.match(/מוצרים מקוריים: (\d+) \| גופי תאורה: (\d+) \| סה"כ: (\d+)/);
  if (before) {
    const [, base, lighting, total] = before.map(Number);
    mergedSrc = mergedSrc.replace(
      /מוצרים מקוריים: \d+ \| גופי תאורה: \d+ \| סה"כ: \d+/,
      `מוצרים מקוריים: ${base} | גופי תאורה: ${lighting + products.length} | סה"כ: ${total + products.length}`
    );
  }

  writeFileSync(mergedPath, mergedSrc);
  console.log(`עודכן products_data_with_lighting.js — נוספו ${products.length} רשומות`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
