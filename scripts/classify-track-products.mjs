// מטפל בתת-הקטגוריה "פסי צבירה מגנטים ומתח גבוה" ב-products_data_with_lighting.js.
// הסקריפט הוא מקור האמת לכללי הקטגוריה הזו, וניתן להרצה חוזרת אחרי כל עדכון
// קטלוג מיורולוקס — אחרת האביזרים והכפילויות יחזרו פנימה בייבוא הבא.
//
//   1. מסיר אביזרי חיבור והזנה — הזנות, סופיות, זוויתנים, מאריכים, מחברים,
//      מתאמי כבל ודרייברים ייעודיים. הקטלוג מציג רק פסים וגופי תאורה.
//   2. מסיר אורכי פס כפולים (כפילויות צבע מטופלות ב-dedupe-lighting-colors.mjs).
//   3. מעדכן את שם תת-הקטגוריה ומסווג את הנותרים:
//      trackType — "מגנטי 48V" | "מתח גבוה 230V" | "מסילה לינארית"
//      itemKind  — "גוף תאורה" | "פס ומסילה"   (מוצג כתגית, אינו משמש לסינון)
//   4. מעביר את המסילות העירומות לתת-קטגוריה "אביזרים", כך שקטגוריית
//      פסי הצבירה מציגה גופי תאורה בלבד.
//
// מספר הפאזות לא מוצג בקטלוג בכוונה — לקוח שצריך לדעת מתקשר.
//
// הרצה: node scripts/classify-track-products.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'products_data_with_lighting.js');
const SUBCAT = 'פסי צבירה מגנטים ומתח גבוה';
// השם הקודם, לפני שינוי שם הקטגוריה. נשמר כדי שהסקריפט ימשיך לזהות רשומות
// שטרם עברו מיגרציה — הוא כותב תמיד את SUBCAT.
const SUBCAT_LEGACY = 'פסי צבירה ומסילות';
// המסילות העירומות אינן גופי תאורה ומורידות מהערך החזותי של הקטגוריה.
// הן עוברות לתת-קטגוריה נפרדת — עדיין נגישות למי שמחפש אותן במפורש.
const SUBCAT_ACCESSORY = 'אביזרים';
const isTrack = (p) =>
  p.subCategory === SUBCAT ||
  p.subCategory === SUBCAT_LEGACY ||
  p.subCategory === SUBCAT_ACCESSORY;

const TRACK_TYPE_BY_FAMILY = {
  'פס מגנטי 48V': 'מגנטי 48V',
  'פסי צבירה 230V': 'מתח גבוה 230V',
  'מסילות HiLINE': 'מסילה לינארית',
};

// הפסים עצמם — פרופיל המסילה שעליו נתלים הגופים
const RAIL_SKU = /^(?:TKM-(?:C30|R30|T30)|TK-C\d0)\//;
// סופיות, זוויתיים, מחברים, הזנות ודרייברים ייעודיים לפס
const ACCESSORY_SKU =
  /^(?:TKM-(?:S20|ATC|AEC|TCC|RCC|CCC|P\d)|TK-(?:P08|CEC|CCC|CLL|CLR|CMC|CFR|CFL|RMC|RLR|RLL|RFR|RFL))/;

// אורכי פס כפולים. TK-C10/20/30 הם אותו פס בשלושה אורכים, וחמישה מהם אף חולקים
// בדיוק את אותה תמונה. נשמר אורך אחד לכל צבע — 3 מטר, שהתמונות שלו נקיות
// (TK-C10/WH הוא היחיד עם סימן מים של יורולוקס). האורך יורד גם מהשם: לקוח
// שצריך אורך אחר מתקשר.
const DUPLICATE_LENGTH_SKUS = new Set([
  'TK-C10/WH', 'TK-C10/BK-F', 'TK-C20/BK-F', 'TK-C20/WH-F',
]);

// הסרת האורך משמות הפסים
function cleanRailName(name) {
  return name
    .replace(/^פרופיל\s+\d+\s*מטר\s*(פס צבירה\s*)?/, 'פס צבירה ')
    .replace(/\s*\d+\s*(?:מ["׳']?|מטר)\s*,/, ',')
    .replace(/\s+\d+\s*מטר\s+/, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function itemKindOf(sku = '') {
  return RAIL_SKU.test(sku) ? 'פס ומסילה' : 'גוף תאורה';
}

function classify(p) {
  const trackType = TRACK_TYPE_BY_FAMILY[p.family];
  if (!trackType) {
    throw new Error(`family לא מוכר עבור ${p.sku || p.id}: ${JSON.stringify(p.family)}`);
  }
  return { trackType, itemKind: itemKindOf(p.sku) };
}

// שומר על סדר המפתחות הקיים ומזריק את השדות החדשים מיד אחרי family,
// כדי שה-diff יישאר קריא.
function withTrackFields(p, trackType, itemKind) {
  const out = {};
  for (const [k, v] of Object.entries(p)) {
    if (k === 'trackType' || k === 'itemKind') continue;
    out[k] = v;
    if (k === 'family') {
      out.trackType = trackType;
      out.itemKind = itemKind;
    }
  }
  if (!('trackType' in out)) {
    out.trackType = trackType;
    out.itemKind = itemKind;
  }
  // "סוג פס" מוצג כשורה ראשונה במפרט הטכני ב-ProductModal (נגזר מ-extractedSpecs).
  // הפירוק מסיר ערך קודם כדי שהרצה חוזרת לא תשכפל ולא תשנה סדר.
  const { 'סוג פס': _prev, ...specs } = out.extractedSpecs || {};
  out.extractedSpecs = { 'סוג פס': trackType, ...specs };
  return out;
}

const src = readFileSync(FILE, 'utf8');
const PREFIX = 'const __PRODUCTS__ = ';
const bodyStart = src.indexOf(PREFIX) + PREFIX.length;
const bodyEnd = src.lastIndexOf('];') + 1;
const body = src.slice(bodyStart, bodyEnd);
const products = JSON.parse(body);

const counts = {};
const removed = { accessory: [], extraLength: [] };
const renamed = [];
let touched = 0;

const next = products
  .filter((p) => {
    if (!isTrack(p)) return true;
    const sku = p.sku || '';
    if (ACCESSORY_SKU.test(sku))       { removed.accessory.push(sku);       return false; }
    if (DUPLICATE_LENGTH_SKUS.has(sku)){ removed.extraLength.push(sku);     return false; }
    return true;
  })
  .map((p) => {
    if (!isTrack(p)) return p;
    const { trackType, itemKind } = classify(p);
    touched++;
    const key = `${trackType} / ${itemKind}`;
    counts[key] = (counts[key] || 0) + 1;
    const out = withTrackFields(p, trackType, itemKind);
    out.subCategory = itemKind === 'פס ומסילה' ? SUBCAT_ACCESSORY : SUBCAT;
    if (itemKind === 'פס ומסילה') {
      const clean = cleanRailName(out.name);
      if (clean !== out.name) { renamed.push(`${out.name}  →  ${clean}`); out.name = clean; }
    }
    return out;
  });

// LF בכוונה: git מגדיר את הקובץ כ-LF, ושלושת סקריפטי הנתונים האחרים
// כותבים LF. כתיבת CRLF כאן הפכה כל שורה בקובץ ל-diff מדומה.
writeFileSync(FILE, src.slice(0, bodyStart) + JSON.stringify(next, null, 2) + src.slice(bodyEnd));

console.log(`תת-הקטגוריה "${SUBCAT}" — הוסרו:`);
console.log(`  ${String(removed.accessory.length).padStart(3)}  אביזרי חיבור והזנה`);
console.log(`  ${String(removed.extraLength.length).padStart(3)}  אורכי פס כפולים`);
if (renamed.length) {
  console.log(`\nשמות פסים שנוקו מאורך (${renamed.length}):`);
  renamed.forEach((r) => console.log(`  ${r}`));
}
console.log(`\nסווגו ${touched} מוצרים שנותרו (סה"כ בקובץ: ${next.length}):`);
for (const [k, v] of Object.entries(counts).sort()) {
  console.log(`  ${String(v).padStart(3)}  ${k}`);
}
