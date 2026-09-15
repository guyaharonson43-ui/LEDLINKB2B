// סינון הדרייברים והסטריפים — אותם צירים, אותם ערכים ואותה לוגיקה כמו בדפי
// הקטגוריה של היצרן ב-qlt.it:
//
//  • הערכים של כל מוצר מגיעים מ-QLT עצמה (data/qltFacets.js, מסונכרן ע"י
//    npm run sync:qlt). מוצר שאין לו רשומה שם — הסטריפים של LEDLink — מקבל
//    ערכים שנגזרים מהנתונים המקומיים, באותו אוצר מילים.
//  • AND גם בין צירים וגם בתוך ציר. DALI + PUSH מחזיר רק מוצרים שיש להם את
//    שניהם — כך באתר QLT (57 מוצרים עם DALI, 44 עם DALI וגם PUSH).
//  • ערך שלא נשאר לו אף מוצר בסינון הנוכחי מוסתר, כמו שם. בלי זה ציר ההספק
//    לבדו היה 70 צ'יפים שרובם מובילים לתוצאה ריקה. ערך שנבחר נשאר גלוי תמיד,
//    כדי שאפשר יהיה לבטל אותו.
//  • תת-קטגוריה היא בחירה יחידה, כמו כפתורי הרדיו שם.

import QLT_FACETS from '../data/qltFacets';
import { getDriverMeta, GROUPS } from './driverMeta';
import { getStripMeta } from './stripMeta';

export const ALL = 'הכל';

// ---------------------------------------------------------------------------
// נגזרת מקומית — למוצרים שאין להם רשומה ב-QLT
// ---------------------------------------------------------------------------

function localDriverValues(p) {
  const m = getDriverMeta(p);
  const s = p.specs || {};
  const v = {};
  if (s.power) v.power = [s.power];
  if (m.group === GROUPS.CV) v.output_mode = ['CV'];
  else if (m.group === GROUPS.CC) v.output_mode = ['CC'];
  else if ((s.outputMode || '').toUpperCase() === 'DALI') v.output_mode = ['DALI'];
  if (m.outputVoltage) v.constant_voltage = [m.outputVoltage];
  if (m.outputCurrent != null) v.constant_current = [`${m.outputCurrent}mA`];
  if (m.ip) v.insulation_class = [m.ip];
  const iv = (s.inputVoltage || '').trim();
  // "100÷250V AC" מכסה במפורש את שתי רשתות החשמל ש-QLT מתייגת בנפרד
  if (iv) v.input_voltage = iv.includes('÷') ? ['110V', '230V'] : [iv];
  if (m.dimming.length) v.dimmable = m.dimming;
  return { category: null, values: v };
}

function localStripValues(p) {
  const m = getStripMeta(p);
  const desc = p.desc || '';
  const segment = re => desc.split('|').find(s => re.test(s)) || '';
  const v = {};

  if (m.voltage) v.operating_voltage = [m.voltage];
  if (m.power != null) v.watt_mt = [`${m.power}W`];
  if (p.cri) v.cri = [`>${p.cri}`];

  // "גוון: 3000/4000/6000K" או "גוון: 2700K/3000K"
  const temps = [...segment(/גוון/).matchAll(/\d{4}/g)].map(x => `${x[0]}K`);
  if (m.color === 'RGB' || m.color === 'RGBW') temps.push(m.color);
  if (temps.length) v.color_temperature = temps;

  // getStripMeta מאחד DOB תחת COB; ב-QLT אלה שני סוגי LED נפרדים
  const ledType = (p.name || '').match(/\b(DOB|COB)\b/i)?.[1].toUpperCase();
  if (ledType) v.led_type = [ledType];
  if (m.ip) v.ip_class = [m.ip];

  // "83-92 Lm/W" — QLT מתייגת לפי הערך העליון ("UP TO 92 lm/W")
  const lmw = (segment(/lm\/w/i).match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (lmw.length) v.lumen_watt = [`UP TO ${Math.max(...lmw)} lm/W`];

  const category = m.type === 'נאון' ? 'Strip Neon'
    : (m.color === 'RGB' || m.color === 'RGBW') ? 'Strip RGB/RGBW'
    : m.type === 'דיגיטלי' ? null
    : 'Strip Monocromatiche';

  return { category, values: v };
}

// ---------------------------------------------------------------------------
// הגדרת הצירים לכל טאב — בסדר שבו הם מופיעים ב-qlt.it
// ---------------------------------------------------------------------------

const TABS = {
  'דרייברים': {
    // [שם תת-הקטגוריה ב-QLT, תווית]
    categories: [
      ['Alimentatore Barra DIN', 'פס DIN'],
      ['Alimentatori Dimmerabili', 'דרייברים עם עמעום'],
      ['Alimentatori On/Off', 'דרייברים ON/OFF'],
      ['Alimentatori RGB e Tunable White', 'RGB ו-Tunable White'],
      ['Convertitori LED per BINARI', 'קונברטורים למסילות'],
      ['Smart Light Controls', 'בקרה חכמה'],
      ['Trasformatori Elettronici per Lampadine LED', 'שנאים לנורות LED'],
    ],
    axes: [
      { key: 'power',            title: 'הספק' },
      { key: 'output_mode',      title: 'מצב יציאה' },
      { key: 'constant_voltage', title: 'מתח יציאה' },
      { key: 'constant_current', title: 'זרם יציאה' },
      { key: 'insulation_class', title: 'הגנה (IP)' },
      { key: 'input_voltage',    title: 'מתח כניסה' },
      { key: 'dimmable',         title: 'עמעום' },
    ],
    local: localDriverValues,
  },
  'סטריפ LED': {
    categories: [
      ['Strip Monocromatiche', 'חד-גוני'],
      ['Strip Neon', 'נאון'],
      ['Strip RGB/RGBW', 'RGB / RGBW'],
      ['Strip Tunable White', 'Tunable White'],
    ],
    axes: [
      { key: 'operating_voltage', title: 'מתח עבודה' },
      { key: 'watt_mt',           title: 'הספק למטר' },
      { key: 'cri',               title: 'CRI' },
      { key: 'color_temperature', title: 'גוון' },
      { key: 'led_type',          title: 'סוג LED' },
      { key: 'ip_class',          title: 'הגנה (IP)' },
      { key: 'lumen_watt',        title: 'יעילות (lm/W)' },
    ],
    local: localStripValues,
  },
};

export const hasFacets = tabId => Boolean(TABS[tabId]);

// קטגוריות-אב שמוצמדות למוצר לצד תת-הקטגוריה ואינן בחירה בפני עצמן
const PARENT_CATEGORIES = new Set(['Strip LED', 'Alimentatori LED']);

function pickCategory(tab, names = []) {
  return names.find(n => tab.categories.some(([c]) => c === n))
    || names.find(n => !PARENT_CATEGORIES.has(n))
    || null;
}

// ---------------------------------------------------------------------------
// נורמליזציה, תוויות וסדר
// ---------------------------------------------------------------------------

// אותו ערך נכתב ב-QLT בכמה צורות: "Dali" ו-"DALI", "14" ו-"14W", "0,24W".
// המיזוג מתבצע כאן ולא בסקריפט, כדי שגם הנגזרת המקומית תעבור דרכו.
const DIMMING_ALIASES = {
  'RF 2.4GHZ': 'RF 2.4GHz',
  'RF-24GHZ': 'RF 2.4GHz',
  'PWM 250..400HZ': 'PWM',
  'PWM-250-400HZ': 'PWM',
};

function normValue(key, raw) {
  const v = String(raw).trim().replace(/(\d),(\d)/g, '$1.$2');
  switch (key) {
    case 'power':
    case 'watt_mt':
      return /^\d+(?:\.\d+)?$/.test(v) ? `${v}W` : v;
    case 'dimmable': {
      const up = v.toUpperCase();
      return DIMMING_ALIASES[up] || up;
    }
    case 'lumen_watt': {
      const n = v.match(/\d+(?:\.\d+)?/)?.[0];
      return n ? `עד ${n} lm/W` : v;
    }
    default:
      return v;
  }
}

// DALI ו-DMX מופיעים גם בעמעום וגם במצב יציאה, ומשמעותם שונה: בעמעום זה
// הפרוטוקול שבו שולטים בדרייבר, במצב יציאה זה ממשק שהיציאה שלו היא אפיק
// בקרה. בלי התווית הזו שני הצ'יפים נראים זהים ומחזירים תוצאות שונות.
const LABELS = {
  output_mode: {
    CV: 'מתח קבוע (CV)',
    CC: 'זרם קבוע (CC)',
    DALI: 'אפיק DALI',
    DMX512: 'אפיק DMX512',
  },
};

const labelFor = (key, value) => LABELS[key]?.[value] ?? value;

const ORDER = {
  output_mode: ['CV', 'CC', 'DALI', 'DMX512'],
  input_voltage: ['230V', '110V', '48V', '24V', '12V', '12VAC'],
  dimmable: ['0-10V', '1-10V', 'PWM', 'TRIAC', 'IGBT', 'MOSFET', 'DALI', 'PUSH', 'DMX', 'ZIGBEE', 'BLE', 'RF 2.4GHz'],
};

const firstNumber = v => {
  const m = String(v).match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : Infinity;
};

// ערכים מספריים בסדר עולה (IP20 < IP65, 350mA < 1000mA), שאר הערכים אחריהם
function compareFor(key) {
  const order = ORDER[key] || [];
  return (a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia !== ib) return (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib);
    const na = firstNumber(a), nb = firstNumber(b);
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
  };
}

// ---------------------------------------------------------------------------
// ערכי המוצר
// ---------------------------------------------------------------------------

const EMPTY = { category: null, values: {}, source: null };
const cache = new WeakMap();

/**
 * @returns {{ category: string|null, values: Record<string, string[]>, source: 'qlt'|'local'|null }}
 */
export function getProductFacets(product) {
  const hit = cache.get(product);
  if (hit) return hit;

  const tab = TABS[product.category];
  if (!tab) return EMPTY;

  // בכוונה בלי השלמה מהנתונים המקומיים: ערך שחסר אצל QLT חסר גם כאן, כדי
  // שתוצאת סינון אצלנו תהיה זהה לתוצאה באתר היצרן.
  const synced = QLT_FACETS[product.id];
  const raw = synced
    ? { category: pickCategory(tab, synced.products_category), values: synced }
    : tab.local(product);

  const values = {};
  for (const { key } of tab.axes) {
    const list = raw.values[key];
    if (list?.length) values[key] = [...new Set(list.map(v => normValue(key, v)))];
  }

  const result = { category: raw.category, values, source: synced ? 'qlt' : 'local' };
  cache.set(product, result);
  return result;
}

// ---------------------------------------------------------------------------
// מצב הסינון והתאמה
// ---------------------------------------------------------------------------

export const emptyFilters = () => ({ category: ALL, selected: {} });

export function activeFilterCount(filters) {
  return (filters.category !== ALL ? 1 : 0)
    + Object.values(filters.selected).filter(v => v.length).length;
}

export function toggleValue(filters, key, value) {
  const list = filters.selected[key] || [];
  const next = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
  return { ...filters, selected: { ...filters.selected, [key]: next } };
}

export function matchesFacets(product, filters) {
  const { category, values } = getProductFacets(product);
  if (filters.category !== ALL && category !== filters.category) return false;
  for (const [key, chosen] of Object.entries(filters.selected)) {
    if (!chosen.length) continue;
    const have = values[key] || [];
    if (!chosen.every(v => have.includes(v))) return false;   // AND בתוך הציר
  }
  return true;
}

/**
 * בונה את תתי-הקטגוריות והצירים לטאב.
 * @param base    מוצרי הטאב אחרי החיפוש החופשי בלבד
 * @param filters מצב הסינון הנוכחי
 */
export function buildFacets(base, filters, tabId) {
  const tab = TABS[tabId];
  if (!tab) return { categories: [], axes: [] };

  const present = new Set(base.map(p => getProductFacets(p).category).filter(Boolean));
  const categories = [
    ...tab.categories.filter(([name]) => present.has(name)),
    ...[...present].filter(n => !tab.categories.some(([name]) => name === n)).map(n => [n, n]),
  ].map(([value, label]) => ({ value, label }));

  // הצירים נבנים מהתוצאה הנוכחית, כולל הציר של עצמם — ב-AND כל בחירה
  // מצמצמת גם את הערכים שנשארו באותו ציר.
  const result = base.filter(p => matchesFacets(p, filters));

  const axes = tab.axes.map(axis => {
    const present = new Set();
    for (const p of result) for (const v of getProductFacets(p).values[axis.key] || []) present.add(v);
    const chosen = filters.selected[axis.key] || [];
    for (const v of chosen) present.add(v);

    const options = [...present].sort(compareFor(axis.key)).map(value => ({
      value,
      label: labelFor(axis.key, value),
      active: chosen.includes(value),
    }));
    return { key: axis.key, title: axis.title, options };
  }).filter(axis => axis.options.length);

  return { categories, axes };
}
