// אוצרות קטגוריית "גופי תאורה" — משאיר קטלוג בשפה עיצובית אחת.
//
// הרקע: לקטלוג הייתה שפה כפולה. מצד אחד פסי צבירה מגנטיים, שקועים עם באפל
// עמוק וצילינדרים מינימליים — שפה אדריכלית עדכנית. מצד שני ספרייה דקורטיבית
// מ-2015: כלובי אדיסון, פנסי שרשרת עם זכוכית ענבר, אשכולות E27 בכבל בד,
// כדורי רשת ופורניר עץ. הסתירה הזו פוגעת באמינות של הצד הראשון.
//
// הסקריפט עושה שני דברים:
//   1. מוחק 50 גופים מיושנים, כולל בתי נורה חשופים. אלה תחילה הועברו
//      לקטגוריה "בתי נורה ואביזרי תלייה", שבוטלה מאוחר יותר.
//   2. מנקה סימני ספק (** ▪▪ ●●) שדלפו לתוך שמות מוצרים.
//
// הרצה: node scripts/curate-lighting.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'products_data_with_lighting.js');

const RETIRED = new Map([
  // כדורי רשת מתכת (סדרת LUSTER) — כלוב רשת, שיא 2016
  ['LH-M6/1', 'כדור רשת'], ['LH-M6L/3', 'כדור רשת'], ['LH-M6R/3', 'כדור רשת'],
  // כדורים צבעוניים דקורטיביים (סדרת STYLE)
  ['LH-STYLE/1', 'דקורטיבי'], ['LH-STYLE/3', 'דקורטיבי'], ['LH-STYLE/5', 'דקורטיבי'],
  // סדרת "מאש" — בטון תעשייתי
  ['LH-M48BK', 'תעשייתי'], ['LH-M49BK', 'תעשייתי'], ['LH-M50BK', 'תעשייתי'],
  ['LH-M51BK', 'תעשייתי'], ['LH-M52BK', 'תעשייתי'], ['LH-M53BK', 'תעשייתי'],
  // פנסי שרשרת עם זכוכית ענבר/שקופה — "וינטג' תעשייתי"
  ['LH-TCH27/BG', 'פנס שרשרת'], ['LH-TCH27/CH', 'פנס שרשרת'],
  ['LH-TDH27/BG', 'פנס שרשרת'], ['LH-TDH27/CH', 'פנס שרשרת'],
  // כלוב אדיסון ובתי נורה "רטרו"/"וינטג'" מוזהבים
  ['LH-VBB27DM/BK', 'כלוב אדיסון'], ['LH-RB27RB', 'רטרו'], ['LH-RB27BK', 'רטרו'],
  ['LH-VBB27BK', 'וינטג׳'], ['LH-VBB27RB', 'וינטג׳'],
  ['LH-DECO50/BK', 'חרוזים דקורטיביים'],
  // אהיל בד עם זרוע — מנורת לילה של מלון
  ['WL-PA07G9/LW', 'אהיל בד'], ['WL-PA08G9/BK', 'אהיל בד'],
  // פורניר עץ מכופף
  ['WL-382L-DW/CT', 'פורניר עץ'], ['WL-382L-LW/CT', 'פורניר עץ'],
  ['WL-3830LW/WW', 'פורניר עץ'], ['WL-3832LW/WW', 'פורניר עץ'],
  ['WL-804RC-LWBK/27', 'פורניר עץ'],
  // אשכולות E27 בכבל בד עם בתי נורה פליז — שפת 2015-2018
  ['LH-7027BKBG-R3', 'אשכול כבל בד'], ['LH-7027BK-R3', 'אשכול כבל בד'],
  ['LH-7027WHBG-R3', 'אשכול כבל בד'], ['LH-7027BKBG-L3', 'אשכול כבל בד'],
  ['LH-7027WHBG-L3', 'אשכול כבל בד'], ['LH-7027BK-L3', 'אשכול כבל בד'],
  ['LH-7027BKBG-L5', 'אשכול כבל בד'], ['LH-7027BK-L5', 'אשכול כבל בד'],
  ['LH-7027WHBG-L5', 'אשכול כבל בד'], ['LH-7027/R5', 'אשכול כבל בד'],
  // שקועי MR16 עם רפלקטור ניקל/כרום מבריק ומקור אור גלוי — סנוור.
  // התקן היום הוא באפל שחור עמוק, שכבר קיים בקטלוג בסדרת DL-BB.
  ['DL-2014/SH', 'ניקל מבריק'], ['DL-2016/SH', 'ניקל מבריק'],
  ['DL-2023/SH', 'ניקל מבריק'], ['DL-WL158/SH', 'ניקל מבריק'],
  ['DL-2013/W', 'ניקל מבריק'],
  // בתי נורה חשופים E27 — רכיב ולא גוף תאורה מוגמר. בשלב ראשון הועברו
  // לקטגוריה נפרדת, ובהמשך הוחלט שאין להם מקום בקטלוג כלל.
  ['LH-VB1/BK', 'בית נורה חשוף'], ['LH-VB2/BK', 'בית נורה חשוף'],
  ['LH-VB3/BK', 'בית נורה חשוף'], ['LH-EYU27/BK', 'בית נורה חשוף'],
  ['LH-15027/BK', 'בית נורה חשוף'], ['LH-WLBKBK27', 'בית נורה חשוף'],
]);

const src = readFileSync(FILE, 'utf8');
const PREFIX = 'const __PRODUCTS__ = ';
const bodyStart = src.indexOf(PREFIX) + PREFIX.length;
const bodyEnd = src.lastIndexOf('];') + 1;
const products = JSON.parse(src.slice(bodyStart, bodyEnd));

const removed = [];
const cleaned = [];

// סימני סימון של הספק (** ▪▪ ●●) דלפו לתוך שמות מוצרים ומוצגים על הכרטיס
const SUPPLIER_MARK = /^[\s*▪●■□◆★]+/;

const next = products
  .filter((p) => {
    if (!RETIRED.has(p.sku)) return true;
    removed.push([p.sku, RETIRED.get(p.sku)]);
    return false;
  })
  .map((p) => {
    let out = p;
    if (SUPPLIER_MARK.test(out.name)) {
      const name = out.name.replace(SUPPLIER_MARK, '').trim();
      cleaned.push(`${out.sku}: ${JSON.stringify(out.name)} → ${JSON.stringify(name)}`);
      out = { ...out, name };
    }
    return out;
  });

writeFileSync(FILE, src.slice(0, bodyStart) + JSON.stringify(next, null, 2) + src.slice(bodyEnd));

const byReason = {};
removed.forEach(([, r]) => { byReason[r] = (byReason[r] || 0) + 1; });

console.log(`הוסרו ${removed.length} גופים מיושנים:`);
for (const [r, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${r}`);
}

if (cleaned.length) {
  console.log(`\nנוקו ${cleaned.length} שמות מסימני ספק:`);
  cleaned.forEach((c) => console.log(`  ${c}`));
}

const missingDel = [...RETIRED.keys()].filter((s) => !removed.some(([x]) => x === s));
if (missingDel.length) {
  console.log('\nמק"טים ברשימה שלא נמצאו בקובץ (הרצה חוזרת?):');
  missingDel.forEach((s) => console.log(`  ${s}`));
}
console.log(`\nסה"כ מוצרים בקובץ: ${next.length}`);
