// נורמליזציה של מוצרי הדרייברים.
//
// הנתונים הגולמיים ב-products_data.js מגיעים מייבוא ולא עקביים: השדה
// specs.voltage מחזיק וולט בדרייברי מתח-קבוע ומיליאמפר בדרייברי זרם-קבוע,
// התגית specs.outputMode שגויה ב-27 מוצרים, ו-19 מוצרים בקטגוריה אינם
// דרייברים בכלל (מתגי קיר, שלטים, חיישנים, גשרי DALI/DMX).
//
// getDriverMeta הוא המתרגם היחיד. כל שאר הקוד קורא ממנו ולא נוגע ב-specs.

// ---------------------------------------------------------------------------
// שיוך קבוצה
// ---------------------------------------------------------------------------

// מזהה ערך זרם — "350MA", "1350MA". זו הבדיקה שקובעת CC, ולא specs.outputMode:
// 27 מוצרים (PLP105N, NICE303, TRACK28, MININICE3...) מתויגים CC אך המתח שלהם
// 12V/24V/48V, כלומר הם CV. שיוך לפי צורת הערך מתקן אותם בלי לערוך את קובץ
// הנתונים, וממשיך לעבוד גם בייבוא הבא.
const CURRENT_RE = /^(\d+)\s*MA$/i;

export const GROUPS = {
  ALL: 'הכל',
  CV:  'מתח קבוע (CV)',
  CC:  'זרם קבוע (CC)',
  ACC: 'בקרה וממשקים',
};

// סדר התצוגה של מתג הקבוצה
export const GROUP_ORDER = [GROUPS.ALL, GROUPS.CV, GROUPS.CC, GROUPS.ACC];

function deriveGroup(specs, currentMa) {
  const mode = (specs.outputMode || '').trim();
  // אין מצב יציאה, או שהיציאה עצמה הוא אפיק בקרה — לא ספק כוח אלא אביזר
  if (!mode || mode.toUpperCase() === 'DALI') return GROUPS.ACC;
  return currentMa != null ? GROUPS.CC : GROUPS.CV;
}

// ---------------------------------------------------------------------------
// נורמליזציית ערכים
// ---------------------------------------------------------------------------

export const UNSPECIFIED = 'לא צוין';

// מתח כניסה. 110V ו-230V רשומים כשתי קטגוריות נפרדות אך מתארים את אותו דבר:
// דרייבר רשת אירופאי הוא universal 100-240V. מיזוג שלהם מונע מצב שבו סינון
// "230V" מסתיר 114 מוצרים שעובדים באותה רשת בדיוק. מתחי DC משניים
// (12V/24V/48V) הם דרייברים שניזונים ממקור אחר ונשארים נפרדים.
const MAINS = 'AC 100-240V';
const INPUT_VOLTAGE_MAP = {
  '110V': MAINS,
  '230V': MAINS,
  '100÷250V AC': MAINS,
  'DALI': 'DALI',
};

// פרוטוקולי עמעום. הערכים הגולמיים כוללים תדר ויחידות שאינם רלוונטיים לבחירה.
const DIMMING_MAP = {
  'PWM-250-400HZ': 'PWM',
  'RF-24GHZ': 'RF 2.4GHz',
};

// SMART מופיע על מוצר יחיד ותמיד לצד RF. הוא לא פרוטוקול אלא תווית שיווקית,
// ולכן נופל מציר העמעום כדי לא ליצור צ'יפ שמחזיר תוצאה אחת חסרת משמעות.
const DIMMING_DROP = new Set(['SMART']);

function normInputVoltage(raw) {
  const v = (raw || '').trim();
  if (!v) return null;
  return INPUT_VOLTAGE_MAP[v] || v;
}

function normDimming(raw) {
  const out = [];
  for (const d of raw || []) {
    const v = (d || '').trim().toUpperCase();
    if (!v || DIMMING_DROP.has(v)) continue;
    const label = DIMMING_MAP[v] || v;
    if (!out.includes(label)) out.push(label);
  }
  return out;
}

function normPower(raw) {
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// טווחי הזרם של דרייברי MULTICURRENT
// ---------------------------------------------------------------------------

// דרייבר MULTICURRENT מספק טווח זרמים נבחר (DIP switch או כבל), אך הקטלוג
// שומר ערך יחיד מתוכו. התוצאה: סינון 350mA לא החזיר את PUL42, שעושה
// 250–700mA ולכן מתאים לחלוטין — הערך שנשמר עבורו הוא 250mA בלבד.
//
// הטווחים כאן חולצו מדפי הנתונים שבתיקיית datasheets, ולא מנוסחה. כל שורה
// מציינת את הקובץ שממנו נלקחה, כדי שיהיה אפשר לאמת אותה מול המקור.
const CURRENT_RANGES = [
  { match: /^CC23W/i,  min: 100,  max: 700,  src: 'DS_CC.pdf / DS_CCD.pdf — A40CC23W000B, A40CC23WD00B' },
  { match: /^CC36W/i,  min: 150,  max: 900,  src: 'DS_CC.pdf / DS_CCD.pdf — A40CC36W000B, A40CC36WD00B' },
  { match: /^CC44W/i,  min: 300,  max: 1050, src: 'DS_CC.pdf / DS_CCD.pdf — A40CC44W000B, A40CC44WD00B' },
  { match: /^CC60W/i,  min: 1250, max: 2000, src: 'DS_CC.pdf / DS_CCD.pdf — A40CC60W00B, A40CC60WD00B' },
  { match: /^PUL42/i,  min: 250,  max: 700,  src: 'DS_PUL.pdf — A40PUL042BBB, A40PUL042BEB' },
  { match: /^PUL60/i,  min: 800,  max: 2000, src: 'DS_PUL.pdf — A40PUL060ABB, A40PUL060AEB' },
];

// דגמי MULTICURRENT שאין להם עדיין דף נתונים בתיקייה — CCBX, PDMC, QBOX,
// ZCCBX, ZMC013 — נשארים עם הערך היחיד שנשמר עבורם, כלומר ממשיכים להתנהג
// כדרייבר בעל זרם קבוע יחיד עד שיתווסף המקור.
function currentRangeFor(name, single) {
  const hit = CURRENT_RANGES.find(r => r.match.test(name));
  if (hit) return [hit.min, hit.max];
  return [single, single];
}

// ---------------------------------------------------------------------------

const cache = new WeakMap();

/**
 * מחזיר את המפרט המנורמל של דרייבר.
 * @param {object} product מוצר מ-products_data
 * @returns {{
 *   group: string, outputVoltage: string|null, outputCurrent: number|null,
 *   multiCurrent: boolean, power: number|null, ip: string|null,
 *   inputVoltage: string|null, dimming: string[]
 * }}
 */
export function getDriverMeta(product) {
  const hit = cache.get(product);
  if (hit) return hit;

  const specs = product.specs || {};
  const rawV  = (specs.voltage || '').trim();
  const m     = rawV.match(CURRENT_RE);

  const currentMa = m ? parseInt(m[1], 10) : null;

  const name = product.name || '';
  const multi = /MULTICURRENT/i.test(name);
  const [cMin, cMax] = currentMa == null ? [null, null]
                     : multi ? currentRangeFor(name, currentMa)
                     : [currentMa, currentMa];

  const meta = {
    group:         deriveGroup(specs, currentMa),
    outputVoltage: currentMa == null && rawV ? rawV : null,
    outputCurrent: currentMa,
    // דרייבר שהזרם שלו נבחר בהתקנה (DIP/כבל). הנתונים שומרים ערך אחד בלבד
    // מתוך כמה שהמוצר תומך בהם, ולכן סינון מדויק עלול להחמיץ אותו.
    multiCurrent:  multi,
    // גבולות הזרם שהדרייבר באמת מספק. בדרייבר בעל זרם קבוע שניהם שווים
    // ל-outputCurrent; ב-MULTICURRENT עם מקור מאומת זהו הטווח מדף הנתונים.
    currentMin:    cMin,
    currentMax:    cMax,
    // האם הטווח מגובה במקור, או שזהו ערך יחיד שנשמר בקטלוג
    currentRangeKnown: multi && cMin !== cMax,
    power:         normPower(specs.power),
    ip:            (specs.ip || '').trim() || null,
    inputVoltage:  normInputVoltage(specs.inputVoltage),
    dimming:       normDimming(specs.dimming),
  };

  cache.set(product, meta);
  return meta;
}
