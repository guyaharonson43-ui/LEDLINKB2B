// בניית צירי הסינון של הדרייברים ומוני התוצאות.
//
// הצירים נגזרים מהערכים שקיימים בפועל בקבוצה הנבחרת — לא מרשימה כתובה ביד.
// זו הסיבה שהגרסה הקודמת נסחפה מהנתונים: היא הציעה IP67 ו-Resistor שאין להם
// אף מוצר, ושכחה את IGBT, MOSFET, 1-10V, BLE, ZIGBEE, RF ו-DMX.
//
// המפות כאן קובעות סדר ותוויות בלבד. ערך שיופיע בנתונים ואינו במפה ייכנס
// לסוף הציר במקום להיעלם.

import { getDriverMeta, GROUPS, UNSPECIFIED } from './driverMeta';

export const NO_DIMMING = 'ללא עמעום';

// ---------------------------------------------------------------------------
// הגדרת הצירים לכל קבוצה
// ---------------------------------------------------------------------------

// mode: 'single' — הבחירה בלעדית מטבעה (גוף עובד על 24V או על 12V, לא שניהם;
//                  טווח הספק הוא רצף ולא קבוצה).
// mode: 'multi'  — OR בתוך הציר. "IP65 או IP67" ו-"DALI או PUSH" הן בקשות
//                  אמיתיות של מתכנן, ובלעדיהן הוא נאלץ להריץ שני חיפושים.
const AXES = [
  { key: 'voltage',      title: 'מתח יציאה',    mode: 'single', groups: [GROUPS.CV] },
  { key: 'current',      title: 'זרם יציאה',    mode: 'multi',  groups: [GROUPS.CC], unit: 'mA' },
  { key: 'inputVoltage', title: 'מתח כניסה',  mode: 'single', groups: [GROUPS.ALL, GROUPS.CV, GROUPS.CC, GROUPS.ACC] },
  { key: 'ip',           title: 'הגנה (IP)',  mode: 'multi',  groups: [GROUPS.ALL, GROUPS.CV, GROUPS.CC, GROUPS.ACC] },
  { key: 'dimming',      title: 'עמעום',      mode: 'multi',  groups: [GROUPS.ALL, GROUPS.CV, GROUPS.CC, GROUPS.ACC] },
  // בבקרה וממשקים אין ציר הספק — ל-17 מתוך 19 המוצרים אין הנתון כלל.
  { key: 'power',        title: 'הספק',       mode: 'single', groups: [GROUPS.CV, GROUPS.CC] },
];

// סולמות ההספק נפרדים לכל קבוצה. זה מה ששבור בגרסה הקודמת: סולם CV יחיד
// (12–336W) הוחל גם על CC (3–90W), ודחס 59 מוצרים לדלי "עד 30W" אחד.
// הגבולות min < v <= max — סוגרים את החפיפה שבה מוצר 30W נכנס לשני דליים.
const POWER_RANGES = {
  [GROUPS.CV]: [
    { label: 'עד 30W',   min: 0,   max: 30 },
    { label: '30–60W',   min: 30,  max: 60 },
    { label: '60–100W',  min: 60,  max: 100 },
    { label: '100–200W', min: 100, max: 200 },
    { label: '200W+',    min: 200, max: Infinity },
  ],
  [GROUPS.CC]: [
    { label: 'עד 10W', min: 0,  max: 10 },
    { label: '10–25W', min: 10, max: 25 },
    { label: '25–45W', min: 25, max: 45 },
    { label: '45W+',   min: 45, max: Infinity },
  ],
};

export function powerRangesFor(group) {
  return POWER_RANGES[group] || [];
}

// ---------------------------------------------------------------------------
// סדר תצוגה
// ---------------------------------------------------------------------------

// מתח כניסה: רשת קודם (הרוב המכריע), אחריו מתחי DC משניים, ואפיק בקרה בסוף.
const INPUT_VOLTAGE_ORDER = ['AC 100-240V', '48V', '24V', '12V', 'DALI'];
const OUTPUT_VOLTAGE_ORDER = ['12V', '24V', '48V'];

// עמעום מקובץ למשפחות. 13 צ'יפים שטוחים הם רשימה שאי אפשר לסרוק; חמש
// משפחות מסומנות של 2–3 ערכים כל אחת נסרקות במבט.
export const DIMMING_FAMILIES = [
  { name: null,        values: [NO_DIMMING] },
  { name: 'אנלוגי',   values: ['0-10V', '1-10V', 'PWM'] },
  { name: 'פאזה',     values: ['TRIAC', 'IGBT', 'MOSFET'] },
  { name: 'דיגיטלי',  values: ['DALI', 'DMX', 'PUSH'] },
  { name: 'אלחוטי',   values: ['ZIGBEE', 'BLE', 'RF 2.4GHz'] },
];

const DIMMING_ORDER = DIMMING_FAMILIES.flatMap(f => f.values);

// מיון לפי מיקום במפה; ערך שאינו במפה נופל לסוף במקום להיעלם.
function byOrder(order) {
  return (a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib);
  };
}

// IP לפי הערך המספרי — IP00 < IP20 < IP40 < IP44 < IP65 < IP66
const byIp = (a, b) => (parseInt(a.slice(2), 10) || 0) - (parseInt(b.slice(2), 10) || 0);

// ---------------------------------------------------------------------------
// חילוץ ערכי הציר ממוצר יחיד
// ---------------------------------------------------------------------------

// מחזיר תמיד מערך — ציר רב-ערכי (עמעום) מחזיר כמה, ציר חד-ערכי אחד.
// ערך חסר הופך ל-UNSPECIFIED כדי שיהיה לו צ'יפ משלו: בגרסה הקודמת
// 41 מוצרים בלי הספק נפלו בשקט מכל סינון, ומוצר תקין פשוט נעלם.
function valuesOf(meta, key, group) {
  switch (key) {
    // גם כאן UNSPECIFIED ולא מערך ריק: IDNDP010/IDNDP110 הם CV אמיתיים בלי
    // ערך מתח רשום, ובלי צ'יפ משלהם הם היו נושרים מהציר בשקט.
    case 'voltage':      return [meta.outputVoltage || UNSPECIFIED];
    case 'current':      return [meta.outputCurrent != null ? meta.outputCurrent : UNSPECIFIED];
    case 'inputVoltage': return [meta.inputVoltage || UNSPECIFIED];
    case 'ip':           return meta.ip ? [meta.ip] : [UNSPECIFIED];
    case 'dimming':      return meta.dimming.length ? meta.dimming : [NO_DIMMING];
    case 'power': {
      if (meta.power == null) return [UNSPECIFIED];
      const r = powerRangesFor(group).find(x => meta.power > x.min && meta.power <= x.max);
      return r ? [r.label] : [UNSPECIFIED];
    }
    default: return [];
  }
}

// ---------------------------------------------------------------------------
// התאמה
// ---------------------------------------------------------------------------

function axisMatches(meta, axis, selection, group) {
  const isMulti = axis.mode === 'multi';
  if (isMulti ? !selection?.length : (!selection || selection === GROUPS.ALL)) return true;

  const vals = valuesOf(meta, axis.key, group);
  return isMulti
    ? vals.some(v => selection.includes(v))   // OR בתוך הציר
    : vals.includes(selection);
}

/**
 * האם המוצר עובר את כל הצירים הפעילים (AND ביניהם).
 * @param {string|null} skipKey ציר לדלג עליו — לחישוב המונים של אותו ציר עצמו
 */
export function matchesDriver(product, filters, skipKey = null) {
  const meta  = getDriverMeta(product);
  const group = filters.group;

  if (group !== GROUPS.ALL && meta.group !== group) return false;

  for (const axis of AXES) {
    if (axis.key === skipKey) continue;
    if (!axis.groups.includes(group)) continue;
    if (!axisMatches(meta, axis, filters[axis.key], group)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// בניית הצירים עם המונים
// ---------------------------------------------------------------------------

function sortValues(key, values) {
  switch (key) {
    case 'ip':           return values.sort(byIp);
    // UNSPECIFIED הוא מחרוזת בין מספרים — נדחף לסוף במקום ל-NaN באמצע
    case 'current':      return values.sort((a, b) =>
                           (typeof a === 'number' ? a : Infinity) - (typeof b === 'number' ? b : Infinity));
    case 'voltage':      return values.sort(byOrder([...OUTPUT_VOLTAGE_ORDER, UNSPECIFIED]));
    case 'inputVoltage': return values.sort(byOrder([...INPUT_VOLTAGE_ORDER, UNSPECIFIED]));
    case 'dimming':      return values.sort(byOrder(DIMMING_ORDER));
    default:             return values;
  }
}

/**
 * בונה את צירי הסינון לקבוצה הנוכחית.
 *
 * לכל ערך שני מספרים שונים:
 *   inGroup — כמה מוצרים בקבוצה יש לו בכלל. אפס פירושו שהערך לא קיים כאן
 *             ולא נרנדר בכלל (למשל IP67, שאין לו אף מוצר בקטלוג).
 *   count   — כמה נשארים מול שאר הצירים הפעילים, בלי הציר של עצמו (faceted).
 *             אפס פירושו שהערך מואפר. הצ'יפ נשאר במקומו כדי שהצ'יפים לא
 *             יקפצו מתחת לאצבע בכל לחיצה.
 */
export function buildDriverFacets(all, filters) {
  const group = filters.group;

  const groupCounts = { [GROUPS.ALL]: all.length };
  for (const p of all) {
    const g = getDriverMeta(p).group;
    groupCounts[g] = (groupCounts[g] || 0) + 1;
  }

  const inGroup = group === GROUPS.ALL ? all : all.filter(p => getDriverMeta(p).group === group);

  const axes = AXES.filter(a => a.groups.includes(group)).map(axis => {
    // מונה "קיים בקבוצה" — מתעלם מכל סינון
    const present = new Map();
    for (const p of inGroup) {
      for (const v of valuesOf(getDriverMeta(p), axis.key, group)) {
        present.set(v, (present.get(v) || 0) + 1);
      }
    }

    // מונה faceted — כל הצירים הפעילים פרט לזה
    const facet = new Map();
    for (const p of inGroup) {
      if (!matchesDriver(p, filters, axis.key)) continue;
      for (const v of valuesOf(getDriverMeta(p), axis.key, group)) {
        facet.set(v, (facet.get(v) || 0) + 1);
      }
    }

    const options = sortValues(axis.key, [...present.keys()]).map(value => ({
      value,
      label: axis.unit ? `${value}${axis.unit}` : String(value),
      count: facet.get(value) || 0,
    }));

    // ההספק מסודר לפי סדר הדליים המוגדר, לא לפי הופעה בנתונים.
    // byOrder משווה מחרוזות, ולכן חייבים למפות ל-value לפני ההשוואה.
    if (axis.key === 'power') {
      const cmp = byOrder([...powerRangesFor(group).map(r => r.label), UNSPECIFIED]);
      options.sort((a, b) => cmp(a.value, b.value));
    }

    return { ...axis, options };
  });

  return { groupCounts, axes };
}

export { AXES, GROUPS };
