// מסיר כפילויות צבע מקטגוריית "גופי תאורה" ב-products_data_with_lighting.js.
//
// הכלל: גוף שקיים בלבן ובשחור עם מפרט זהה מוצג בצבע אחד בלבד. בכל 49 הזוגות
// שנבדקו ויזואלית נשמר השחור — תמונות המוצר הלבן נבלעות ברקע הלבן של הקטלוג,
// והפער קיצוני בגופי התלייה (הלבן כמעט שקוף) ובסדרת TKM-FLAT (קובצי 1KB,
// צללית שטוחה כמעט בלי פרטים).
//
// מה נשאר בכוונה:
//   • גימורים מיוחדים — פליז, ברונזה, זהב, כרום. אלה בחירה עיצובית, לא כפילות.
//   • פסים ומסילות — שם נשמר צבע אחד לכל גוון (החלטה נפרדת), ולכן הם מוחרגים.
//
// הרשימה מפורשת ולא נגזרת מכלל, כי הבחירה בין שני צבעים היא שיפוט ויזואלי.
// שתי מלכודות שהתגלו בקיבוץ האוטומטי ושאסור להחזיר אליו:
//   • סדרת "מאש" (LH-M48BK..LH-M53BK) — שישה דגמים שונים עם שם זהה לחלוטין.
//   • LH-VB1/VB2/VB3 — אותו סיפור. אלה אינם כפילויות צבע.
//
// הרצה: node scripts/dedupe-lighting-colors.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'products_data_with_lighting.js');
const CATEGORY = 'גופי תאורה';

// המק"ט הלבן בכל זוג לבן/שחור — נמחק, השחור נשאר.
const WHITE_DUPLICATES = new Set([
  // פסי צבירה ומסילות
  'TKM-FLAT090WH/WW', 'TKM-FLAT030WH/WW', 'TKM-FLAT122WH/WW',
  'TKM-55COB120WH/WW', 'TKM-35COB80WH/WW', 'HiPROFILE150WH/WW',
  'TK-50COB150WH', 'TK-62COB170WH', 'TK-94COB190WH',
  'CL-50COB60WH-Track', 'CL-60GU130WH/Track', 'CL-10E27WH/Track',
  'CL-55GUWH/Pendant', 'CL-56GUWH/Pendant',
  'HiLINE18S6WH', 'HiLINE09S6WH',
  // ספוטים ושקועים
  'DL-BB010WH/CT', 'DL-BB020WH/CT', 'DL-BB030WH/CT', 'DL-BB040WH/CT',
  'DL-2026/WH', 'DL-2025/WH', 'WL-804RC-LWWH/27',
  // צמודי תקרה
  'CL-M101/WH', 'CL-M105/WH', 'DL-M509W/WH', 'CL-80COB150/WH',
  'CL-6RWH/CT', 'CL-7RWH/CT', 'CL-21080WH', 'CL-60GU80WH-1',
  // בקרה וחיישנים
  'EB-EP1439/WH', 'EB-ES2122/WH', 'EB-ES2322/WH', 'EB-ES2222/WH',
  'EB-ERC2206WH/KIT', 'SD-PK1/WH', 'SD-R11/WH', 'F-PLAY/WH-Sen',
  // גופי תלייה
  'CL-104WH/CT', 'CL-EYE5WH/WW-Pendant', 'CL-EYE3WH/WW-Pendant',
  'CL-EYE1WH/WW-Pendant', 'CL-40COB600WH/WW-Pendant',
  'LH-7027WH-R3', 'LH-7027WH-L5', 'LH-RB27WH',
  'LH-ROD50/WH', 'LH-EYU27/WH',
  // זוגות שהקיבוץ לפי שם פספס, כל אחד מסיבה אחרת בניסוח:
  // D66  — "DownLight מקצועי" מול 'שקוע "D" מקצועי'
  // CL-M106 — "שחור מלא" מול "לבן ושחור"
  // LH-7027-L3 — תווי ** בתחילת שם הפריט השחור
  // LH-DECO50  — "שחור+פליז" מול "לבן+פליז"
  'D66-WH/22W', 'CL-M106/WH', 'LH-7027WH-L3', 'LH-DECO50/WH',
]);

// חריג יחיד לכלל "נשמר השחור": ב-D68 דווקא לפריט השחור אין מחיר בנתונים,
// ומחיקת הלבן הייתה מוחקת את בלוק ה-offers מה-Product schema. כאן נשמר הלבן.
const BLACK_DUPLICATES = new Set([
  'D68-BK',
]);

// ── שלב שני: כרטיס אחד לכל דגם ──────────────────────────────────────────────
// אחרי צמצום לבן/שחור עדיין הוצגו 23 דגמים בכמה גימורים (לבן + ניקל + פליז
// באותה שורה). ההחלטה: כרטיס אחד לדגם. סדר העדיפות לשמירה נגזר מסיומת המק"ט
// ולא מהשם — בשמות רבים "שחור" מתאר את הכבל ולא את הגוף:
//   BK (שחור) > SH (ניקל) > BG (פליז/זהב) > BZ/BB (ברונזה) > CH (כרום) > לבן
// הלבן יורד תמיד: תמונות המוצר הלבן נבלעות ברקע הלבן של הקטלוג.
//
// שני דגמים הוחרגו במכוון — LH-TCH27 ו-LH-TDH27 נבדלים גם בצבע הזכוכית
// (ענבר מול שקופה) ולא רק בגימור המתכת, כלומר מראה שונה ולא כפילות.
// גם הפסים הוחרגו: שם נשמר צבע אחד לכל גוון לפי החלטה נפרדת.
const EXTRA_FINISHES = new Set([
  'CL-60GU130BG/Track', 'DL-2014/W', 'DL-2016-W',
  'DL-2023/BG', 'DL-2023/W', 'DL-WL158/W',
  'CL-60GU80BG-1', 'CL-60GU80BG-3', 'CL-60GU130WH/Tilt',
  'CL-4RWH/CT', 'CL-UPR/BZ', 'CL-UPR/WH',
  'WL-806S-BG/WW', 'WL-210BG/CT', 'CL-61GU80BG-1',
  'EB-ES2222/BG', 'CL-60GU130BG/Pendant', 'CL-40COB300BG/WW-Pendant',
  'LH-ROD50/BG', 'LH-VB3', 'LH-VB1',
  'LH-EYU27/BG', 'LH-EYU27/BB', 'LH-RB27BB',
]);

const src = readFileSync(FILE, 'utf8');
const PREFIX = 'const __PRODUCTS__ = ';
const bodyStart = src.indexOf(PREFIX) + PREFIX.length;
const bodyEnd = src.lastIndexOf('];') + 1;
const products = JSON.parse(src.slice(bodyStart, bodyEnd));

const removed = [];
const next = products.filter((p) => {
  const sku = p.sku || '';
  if (p.category !== CATEGORY) return true;
  if (!WHITE_DUPLICATES.has(sku) && !BLACK_DUPLICATES.has(sku) && !EXTRA_FINISHES.has(sku)) return true;
  removed.push(sku);
  return false;
});

// הקובץ נשמר ב-LF ובפורמט JSON.stringify(_, null, 2) — שמירה על שניהם
// מבטיחה ש-diff יכיל אך ורק את המוצרים שהוסרו.
writeFileSync(FILE, src.slice(0, bodyStart) + JSON.stringify(next, null, 2) + src.slice(bodyEnd));

const missing = [...WHITE_DUPLICATES, ...BLACK_DUPLICATES, ...EXTRA_FINISHES].filter((s) => !removed.includes(s));
console.log(`הוסרו ${removed.length} כפילויות צבע מקטגוריית "${CATEGORY}".`);
if (missing.length) {
  console.log(`\n${missing.length} מק"טים ברשימה כבר לא קיימים בקובץ (הוסרו בהרצה קודמת):`);
  missing.forEach((s) => console.log(`  ${s}`));
}
console.log(`\nסה"כ מוצרים בקובץ: ${next.length}`);
