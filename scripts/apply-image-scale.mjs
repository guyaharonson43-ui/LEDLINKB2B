// מנרמל את המשקל החזותי של תמונות המוצר בקטגוריית "גופי תאורה".
//
// הבעיה שנמדדה: תמונות המוצר הן 250x250 (יורולוקס לא מגישים גדול יותר), אבל
// המוצר עצמו תופס בהן שטח שונה לחלוטין — 71 מתוך 150 נוגעים בקצה המסגרת
// ונראים דחוסים, בעוד אחרים תופסים פחות מחצי ונראים כמו בול דואר. בגריד אחיד
// זו התחושה הכי לא-יוקרתית שיש: אין ריתמוס, כל מוצר בסקאלה אחרת.
//
// הפתרון: מקדם קנה מידה לכל מוצר, כך שהצלע הארוכה של המוצר תתפוס חלק אחיד
// מהמסגרת. אין כאן שינוי של פיקסל — רק transform בתצוגה.
//
// המדידה עצמה יושבת ב-scripts/data/lighting-image-bounds.json. היא נעשתה ע"י
// ציור כל תמונה לקנבס וסריקת פיקסלים שאינם כמעט-לבנים. לחידוש המדידה (למשל
// אחרי ייבוא תמונות חדשות) צריך דפדפן, כי אין בפרויקט ספריית עיבוד תמונה.
//
// הרצה: node scripts/apply-image-scale.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'products_data_with_lighting.js');
const BOUNDS = join(ROOT, 'scripts', 'data', 'lighting-image-bounds.json');

// היעד: הצלע הארוכה של המוצר תופסת 82% מהמסגרת. מספיק אוויר כדי שלא ייראה
// חתוך, מספיק נוכחות כדי שלא ייראה אבוד.
const TARGET = 0.82;

// תקרת הגדלה. המסגרת מוצגת בכ-193px בעוד המקור הוא 250px, כלומר יש מרווח של
// 250/193 ≈ 1.29 לפני שמתחילים למתוח מעבר לרזולוציה המקורית. 1.25 שומר שוליים.
const MAX_UP = 1.25;
const MIN_DOWN = 0.62;

// שינוי קטן מדי לא מצדיק שדה נוסף בנתונים
const EPSILON = 0.03;

const bounds = JSON.parse(readFileSync(BOUNDS, 'utf8'));

const src = readFileSync(FILE, 'utf8');
const PREFIX = 'const __PRODUCTS__ = ';
const bodyStart = src.indexOf(PREFIX) + PREFIX.length;
const bodyEnd = src.lastIndexOf('];') + 1;
const products = JSON.parse(src.slice(bodyStart, bodyEnd));

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

let scaled = 0, unchanged = 0, missing = [];
const shrunk = [], grown = [];
let grounded = 0;

const next = products.map((p) => {
  // מסירים ערכים קודמים כדי שהרצה חוזרת תהיה דטרמיניסטית
  const { imgScale: _s, imgBase: _b, imgWidth: _w, ...clean } = p;
  if (clean.category !== 'גופי תאורה' || !clean.img) return clean;

  const b = bounds[clean.sku];
  if (!b) { missing.push(clean.sku); return clean; }

  const [W, H, , by, bw, bh] = b;
  const extent = Math.max(bw / W, bh / H);
  const scale = +clamp(TARGET / extent, MIN_DOWN, MAX_UP).toFixed(2);

  // מיקום בסיס המוצר ורוחבו — הצל נצמד אליהם. המרכז האופקי נמדד כ-0.5 כמעט
  // בכל התמונות (חציון מדויק), ולכן אין צורך בערך אופקי.
  const out = { ...clean, imgBase: +(((by + bh) / H)).toFixed(3), imgWidth: +((bw / W)).toFixed(3) };
  grounded++;

  if (Math.abs(scale - 1) < EPSILON) { unchanged++; return out; }

  scaled++;
  (scale < 1 ? shrunk : grown).push(`${clean.sku} ${(extent * 100).toFixed(0)}% → ×${scale}`);
  return { ...out, imgScale: scale };
});

writeFileSync(FILE, src.slice(0, bodyStart) + JSON.stringify(next, null, 2) + src.slice(bodyEnd));

console.log(`נורמלו ${scaled} תמונות (${unchanged} כבר היו בטווח):`);
console.log(`  ${String(grounded).padStart(3)} קיבלו נקודת עגינה לצל (imgBase / imgWidth)`);
console.log(`  ${String(shrunk.length).padStart(3)} כווצו — היו דחוסות בקצה המסגרת`);
console.log(`  ${String(grown.length).padStart(3)} הוגדלו — היו קטנות מדי, בתוך מרווח הרזולוציה`);
if (missing.length) {
  console.log(`\n${missing.length} מק"טים ללא מדידה (הוסיפו אותם ל-lighting-image-bounds.json):`);
  missing.slice(0, 10).forEach((s) => console.log(`  ${s}`));
}
