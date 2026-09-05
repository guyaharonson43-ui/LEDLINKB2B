// מסמן משפחות וריאנטים בקטגוריית "גופי תאורה".
//
// הבעיה: הקטלוג הציג את אותו דגם כמה פעמים ברצף — 10W/20W/30W/40W של אותו
// שקוע, 90 ס"מ מול 180 ס"מ של אותו לינארי. זה נקרא ככפילות גם כשמדובר
// במוצרים שונים לגמרי מבחינת הזמנה.
//
// הפתרון: כרטיס אחד למשפחה, עם בורר וריאנטים. אף מק"ט לא נמחק — כולם
// נשארים בנתונים, ב-sitemap ובדפי המוצר הסטטיים.
//
// למה רשימה מפורשת ולא זיהוי אוטומטי: נוסו שתי היוריסטיקות ושתיהן נכשלו.
//   • לפי שם — "לינארי כפול לתקרה סדרת מוד שחור" מול "לינארי כפול סדרת מוד
//     MOOD לבן" הם אותה סדרה בניסוח שונה, ולא התקבצו.
//   • לפי מק"ט — DL-2026 (דארק לייט) ו-DL-0354 (שקוע גבס) קיבלו אותה תחילית
//     והתקבצו בטעות, וכך גם שלוש סדרות שונות תחת CL-M#.
// הקריטריון הוא ויזואלי — "הנראות אותו דבר" — ולכן הרשימה עברה בעין.
// גוף יחיד מול אשכול חמישייה נראים שונה ולכן אינם משפחה (VISION, ETOS, BELL).
//
// הרצה: node scripts/build-variant-families.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'products_data_with_lighting.js');

// הפריט הראשון בכל משפחה הוא הנציג שמוצג על הכרטיס.
const FAMILIES = [
  {
    id: 'dl-bb', axis: 'הספק',
    name: 'שקוע "BB" מקצועי עגול שחור CCT',
    items: [
      ['DL-BB010BK/CT', '10W'], ['DL-BB020BK/CT', '20W'],
      ['DL-BB030BK/CT', '30W'], ['DL-BB040BK/CT', '40W'],
    ],
  },
  {
    id: 'hi-d', axis: 'הספק',
    name: 'שקוע מקצועי IP54 Advance 40°+120° לבן',
    items: [['Hi-D66WH/CTA', '30W'], ['Hi-D68WH/CTA', '40W']],
  },
  {
    id: 'hiline', axis: 'אורך',
    name: 'תאורת מסילות HiLINE שחור IP43 125Lm/W 60°',
    items: [['HiLINE09S6BK', '90 ס"מ · 60W'], ['HiLINE18S6BK', '180 ס"מ · 120W']],
  },
  {
    id: 'mood', axis: 'אורך וצבע',
    name: 'לינארי כפול לתקרה סדרת מוד MOOD IP44',
    items: [
      ['CL-21040WH', '90 ס"מ · 40W · לבן'],
      ['CL-21060BK', '120 ס"מ · 60W · שחור'],
      ['CL-21080BK', '150 ס"מ · 80W · שחור'],
    ],
  },
  {
    id: 'glow-flex', axis: 'אורך',
    name: 'סדרת GLOW FLEX · חבל לדים · הברגה E27 · מגנטי 2200K לעמעום',
    items: [
      ['GLN-FLEX060/2K', '60 ס"מ · 6W'], ['GLN-FLEX090/2K', '90 ס"מ · 8W'],
      ['GLN-FLEX120/2K', '120 ס"מ · 10W'],
    ],
  },
  {
    id: 'tkm-flat', axis: 'אורך',
    name: 'FLAT לפס מגנטי · חלבי שחור 3000K',
    items: [
      ['TKM-FLAT122BK/WW', '220 מ"מ · 12W'], ['TKM-FLAT030BK/WW', '436 מ"מ · 24W'],
      ['TKM-FLAT090BK/WW', '970 מ"מ · 36W'],
    ],
  },
  {
    id: 'hiprofile', axis: 'אורך והספק',
    name: 'הייפרופיל · BridgeLUX 60°',
    items: [
      ['HiPROFILE120WH/CW', '120 · 40W · 4000K · לבן'],
      ['HiPROFILE120BK/CW-HO', '120 · 64W · 4000K · שחור'],
      ['HiPROFILE150BK/WW', '150 · 50W · 3000K · שחור'],
      ['HiPROFILE150BK/CW-HO', '150 · 80W · 4000K · שחור'],
    ],
  },
  {
    id: 'tk-cob', axis: 'גודל',
    name: 'רול · ספוט לפס צבירה שחור · Hongli 36° 90CRi',
    items: [
      ['TK-50COB150BK/WW', 'רול.5 · 8W'], ['TK-62COB170BK', 'רול.6 · 18W'],
      ['TK-80COB190BK', 'רול.8 · 30W'], ['TK-94COB190BK', 'רול.9 · 40W'],
    ],
  },
  {
    id: 'rol8-pendant', axis: 'צבע',
    name: 'רול.8 תלוי תקרה 2 מטר · 80x150 מ"מ BridgeLUX 18W',
    items: [['CL-80COB150BK/WW-Pendant', 'שחור'], ['CL-80COB150WH/Pendant', 'לבן']],
  },
  {
    id: 'rol4-pendant', axis: 'אורך',
    name: 'רול.4 תלוי תקרה 2 מטר שחור · BridgeLUX 3000K 38° 8W',
    items: [['CL-40COB300BK/WW-Pendant', '300 מ"מ'], ['CL-40COB600BK/WW-Pendant', '600 מ"מ']],
  },
  {
    id: 'helios', axis: 'הספק',
    name: 'מנורת קיר סדרת HELIOS · מתכווננת · IP20 · 3000K',
    items: [['WL-020BK/WW', '10W'], ['WL-021BK/WW', '18W']],
  },
  {
    id: 'darklight', axis: 'גודל',
    name: 'שקוע קוני דארק לייט MR11 שחור 230V',
    items: [['DL-2026/BK', 'מיני'], ['DL-2025/BK', 'רגיל']],
  },
  {
    id: 'skydance-triac', axis: 'הספק',
    name: 'בקר עמעום Triac לפסי DIN למערכת SKYDANCE · עמעום פאזה',
    items: [['SD-TR1', 'עד 400W'], ['SD-SK1', 'עד 1200W']],
  },
  {
    id: 'rf-buttons', axis: 'תצורה',
    name: 'לחצן RF-Kinetic שחור מאט IP67',
    items: [['EB-ES2122/BK', 'יחיד'], ['EB-ES2222/BK', 'כפול'], ['EB-ES2322/BK', 'שלישייה']],
  },

  // ── סבב שני: משפחות שנמצאו בסריקה ויזואלית של כל 132 הכרטיסים ─────────────
  {
    id: 'd-downlight', axis: 'גודל והספק',
    name: 'שקוע "D" מקצועי עגול IP44 125Lm/w 100°',
    items: [
      ['D64-BK', 'Ø140 · 18W · שחור'], ['D66-BK', 'Ø190 · 28W · שחור'],
      ['D68-WH/36W', 'Ø225 · 36W · לבן'],
    ],
  },
  {
    id: 'eco-cylinder', axis: 'צבע',
    name: 'צמוד תקרה צילינדר ECO · מתכוונן DARK · GU10',
    items: [['DL-0889/BK', 'שחור'], ['DL-0887/WH', 'לבן']],
  },
  {
    id: 'tkm-eye', axis: 'הספק',
    name: 'EYE לפס מגנטי שחור 3000K 24°',
    items: [['TKM-EYE122BK/WW', '12X1W · מתכוונן'], ['TKM-EYE033BK/WW', '18X1W']],
  },
  {
    id: 'tkm-spot', axis: 'גודל והספק',
    name: 'ספוט לפס מגנטי שחור 3000K 24°',
    items: [['TKM-35COB80BK/WW', '35x80 מ"מ · 5W'], ['TKM-55COB120BK/WW', '55x120 מ"מ · 15W']],
  },
  {
    id: 'roll-shir', axis: 'הספק וצבע',
    name: 'צמוד תקרה ROLL סדרת SHIR שיר · IP54 60°',
    items: [
      ['CL-1RD/BK', 'שחור'], ['CL-2RD10WH/WW', '10W · 1000Lm · לבן'],
      ['CL-2RD20BK/WW', '20W · 2000Lm · שחור'],
    ],
  },
  {
    id: 'rf-dimmer', axis: 'הספק',
    name: 'מגען אלקטרוני אלחוטי · עמעום 10-100% RF 433Mhz',
    items: [['EB-ERC901', 'מיני · 0.5A · 100W'], ['EB-ERC301', '1.5A · 300W']],
  },
  {
    id: 'rf-relay', axis: 'תצורה',
    name: 'מגען אלחוטי RF 433Mhz',
    items: [['ERC302', 'יציאה אחת · 10A'], ['ERC303', 'שתי יציאות · 2x5A']],
  },
  {
    id: 'rf-motor', axis: 'תצורה',
    name: 'מגען אלקטרוני מיני למנועים RF 433Mhz 1.7A',
    items: [['EB-ERC2206', 'מודול בלבד'], ['EB-ERC2206BK/KIT', 'קיט עם מפסק שחור · 350W']],
  },

  // ── תצורות של אותה סדרה ────────────────────────────────────────────────────
  // כאן המראה *כן* משתנה — אשכול חמישייה אינו נראה כמו גוף יחיד. איחדתי בכל
  // זאת כי זו הסדרה עצמה עם מספר גופים שונה, וכך מוצגות סדרות כאלה אצל מותגי
  // התאורה המובילים. אם עדיף להציג כל תצורה בנפרד — מוחקים את ארבע המשפחות
  // האלה מהרשימה והכרטיסים חוזרים.
  {
    id: 'vision-pendant', axis: 'תצורה',
    name: 'תלוי תקרה לד מובנה VISION · כבל 2 מטר · 3000K שחור',
    items: [
      ['CL-EYE1BK/WW-Pendant', 'יחיד · 6W'], ['CL-EYE3BK/WW-Pendant', 'שלישייה · 15W'],
      ['CL-EYE5BK/WW-Pendant', 'חמישייה · 24W'],
    ],
  },
  {
    id: 'etos-pendant', axis: 'תצורה',
    name: 'תלוי תקרה לד מובנה ETOS · כבל 2 מטר · 3000K שחור',
    items: [
      ['CL-ET1BK/WW-Pendant', 'יחיד · 8W'], ['CL-ET3BK/WW-Pendant', 'שלישייה · 20W'],
      ['CL-ET5BK/WW-Pendant', 'חמישייה · 32W'],
    ],
  },
  {
    id: 'bell-wall', axis: 'תצורה',
    name: 'צמוד קיר קאפהד · סדרה BELL · מתכוונן CCT',
    items: [
      ['CL-70COB80BK-2/CT', 'זוג · 12W · שחור'], ['CL-70COB80BK-3/CT', 'שלישיה · 18W · שחור'],
      ['CL-70COB80BG-5/CT', 'חמישייה · 28W · פליז'],
    ],
  },
  {
    id: 'rol6-ceiling', axis: 'תצורה',
    name: 'רול.6 פס צמוד תקרה מתכוונן · GU10',
    items: [
      ['CL-60GU80BK-1', 'יחיד · שחור'], ['CL-60GU80WH-2', 'זוג · לבן'],
      ['CL-60GU80BK-3', 'שלישיה · שחור'], ['CL-60GU80WH-R4', 'רביעייה עגולה · לבן'],
      ['CL-60GU80BK-5', 'חמישייה · שחור'],
    ],
  },

  // ── סבב שלישי: הפסים עצמם ──────────────────────────────────────────────────
  // בהחלטה מוקדמת יותר נקבע שפסים נשמרים בשני הצבעים, ולכן הוחרגו מכל סבבי
  // הצמצום — מה שהשאיר אותם ככרטיסים כפולים. עם בורר הווריאנטים אין יותר
  // התנגשות: כרטיס אחד, ושני הצבעים זמינים בתוכו.
  {
    id: 'tkm-rail-surface', axis: 'צבע',
    name: 'פס מגנטי צמוד/תלוי · כולל סופיות',
    items: [['TKM-C30/BK', 'שחור'], ['TKM-C30/WH', 'לבן · כולל התקן']],
  },
  {
    id: 'tkm-rail-recessed', axis: 'צבע',
    name: 'פס מגנטי שקוע · כולל סופיות',
    items: [['TKM-R30/BK', 'שחור'], ['TKM-R30/WH', 'לבן']],
  },
  {
    id: 'tkm-rail-trimless', axis: 'צבע',
    name: 'פס מגנטי TRIMLESS · כולל סופיות',
    items: [['TKM-T30/BK', 'שחור'], ['TKM-T30/WH', 'לבן']],
  },
  {
    id: 'tk-rail-230', axis: 'צבע',
    name: 'פס צבירה · כולל סופיות והזנה',
    items: [['TK-C30/BK-F', 'שחור'], ['TK-C30/WH-F', 'לבן']],
  },
  {
    id: 'hiwing', axis: 'צבע וגוון',
    name: 'מנורת פס צבירה לד מתקפל 50W',
    items: [['HIWING-BK/CW-TRACK', 'שחור · 4000K'], ['HIWING-WH/WW-TRACK', 'לבן · 3000K']],
  },
  {
    id: 'rol5-track', axis: 'גימור',
    name: 'רול.5 ספוט לפס צבירה · 50x60 מ"מ 8W 3000K 38°',
    items: [['CL-50COB60BK-Track', 'שחור'], ['CL-50COB60BG/WW-Track', 'פליז']],
  },
  {
    id: 'rol6-ceiling-single', axis: 'גימור',
    name: 'רול.6 צמוד תקרה · 60x130 מ"מ · כולל נורה GU10 7W',
    items: [['CL-60GU130BK/Ceiling', 'שחור'], ['CL-60GU130BG/Tilt', 'פליז · מתכוונן']],
  },

  // ── סבב רביעי: מקרים שההבדל בהם אמיתי אך אינו נראה בגודל כרטיס ────────────
  // שני אלה נפסלו קודם בטענה שההבדל מהותי מכדי לאחד. ההבדל אכן אמיתי — אבל
  // הוא לא נקרא מהתמונה בגודל כרטיס, ולכן נראה ככפילות. האיחוד לא מעלים אותו:
  // הוא עובר מהשם לתווית הבורר, שם הוא קריא יותר מאשר היה.
  {
    // DL-0354 ו-DL-0829 הם מק"טים שונים במחירים שונים (61.4 מול 59). ההבדל
    // הוא פרופיל השפה, ולכן הציר הוא "פרופיל" ולא צבע.
    id: 'gypsum-round', axis: 'פרופיל',
    name: 'שקוע גבס MR16 עגול 130 מ"מ',
    items: [['DL-0829', 'שפה ישרה'], ['DL-0354', 'שפה מעוגלת']],
  },
  {
    // הציר כאן הוא "דגם" ובמפורש לא "צבע": ההבדל בין העגולה השחורה ללבנה אינו
    // גוון הגוף אלא מנגנון השבת. תווית שאומרת רק "שחור" הייתה מסתירה פיצ'ר.
    id: 'reading-wall', axis: 'דגם',
    name: 'מנורת צמוד קיר קריאה 3W+6W IP20 אור חם',
    items: [
      ['WL-804RC-BK/27', 'עגולה שחורה · מנגנון שבת'],
      ['WL-804R-WH/27', 'עגולה לבנה'],
      ['WL-804S-BK/27', 'מרובעת שחורה'],
    ],
  },
];

const bySku = new Map();
for (const fam of FAMILIES) {
  fam.items.forEach(([sku, label], i) => {
    if (bySku.has(sku)) throw new Error(`מק"ט מופיע בשתי משפחות: ${sku}`);
    bySku.set(sku, {
      variantFamily: fam.id,
      variantAxis: fam.axis,
      variantLabel: label,
      familyName: fam.name,
      variantPrimary: i === 0,
      variantOrder: i,
    });
  });
}

const src = readFileSync(FILE, 'utf8');
const PREFIX = 'const __PRODUCTS__ = ';
const bodyStart = src.indexOf(PREFIX) + PREFIX.length;
const bodyEnd = src.lastIndexOf('];') + 1;
const products = JSON.parse(src.slice(bodyStart, bodyEnd));

const VARIANT_KEYS = ['variantFamily', 'variantAxis', 'variantLabel', 'familyName', 'variantPrimary', 'variantOrder'];
const tagged = [];

const next = products.map((p) => {
  const meta = bySku.get(p.sku);
  // הרצה חוזרת: מנקים סימון קודם כדי שמק"ט שהוסר מהרשימה יחזור להיות רגיל
  const clean = {};
  for (const [k, v] of Object.entries(p)) if (!VARIANT_KEYS.includes(k)) clean[k] = v;
  if (!meta) return clean;
  tagged.push(p.sku);
  return { ...clean, ...meta };
});

writeFileSync(FILE, src.slice(0, bodyStart) + JSON.stringify(next, null, 2) + src.slice(bodyEnd));

const missing = [...bySku.keys()].filter((s) => !tagged.includes(s));
console.log(`סומנו ${tagged.length} מוצרים ב-${FAMILIES.length} משפחות.`);
for (const fam of FAMILIES) {
  const found = fam.items.filter(([s]) => tagged.includes(s)).length;
  console.log(`  ${String(found).padStart(2)}/${fam.items.length}  ${fam.id.padEnd(15)} [${fam.axis}]`);
}
if (missing.length) {
  console.log(`\nשגיאה — מק"טים ברשימה שלא נמצאו בקובץ (${missing.length}):`);
  missing.forEach((s) => console.log(`  ${s}`));
  process.exitCode = 1;
}
const lighting = next.filter((p) => p.category === 'גופי תאורה');
const cards = lighting.length - (tagged.length - FAMILIES.length);
console.log(`\nגופי תאורה: ${lighting.length} מוצרים → ${cards} כרטיסים`);
