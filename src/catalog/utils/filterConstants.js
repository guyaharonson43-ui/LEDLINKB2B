export const STRIP_IP_OPTIONS      = ['הכל', 'IP20', 'IP65', 'IP67', 'IP68'];
export const STRIP_TYPE_OPTIONS    = ['הכל', 'סטנדרט', 'COB', 'נאון', 'זיגזג', 'דיגיטלי'];
export const STRIP_COLOR_OPTIONS   = ['הכל', 'לבן', 'RGB', 'RGBW'];
export const STRIP_VOLTAGE_OPTIONS = ['הכל', '12V', '24V', '48V'];
export const STRIP_POWER_RANGES    = [
  { label: 'הכל',   min: 0,  max: 99999 },
  { label: 'עד 10W', min: 0,  max: 10    },
  { label: '10–15W', min: 10, max: 15    },
  { label: '15–20W', min: 15, max: 20    },
  { label: '20W+',   min: 20, max: 99999 },
];
export const STRIP_LMW_RANGES = [
  { label: 'הכל',    min: 0,   max: 99999 },
  { label: 'עד 100', min: 0,   max: 100   },
  { label: '100–150', min: 100, max: 150   },
  { label: '150–200', min: 150, max: 200   },
  { label: '200+',   min: 200, max: 99999 },
];

// צירי הדרייברים אינם מוגדרים כאן. הם נגזרים מהנתונים בזמן ריצה
// ב-driverFacets.js, כי הרשימות הכתובות ביד נסחפו: הן הציעו IP67, IP68
// ו-Resistor שאין להם אף מוצר, ושכחו את IGBT, MOSFET, 1-10V, BLE, ZIGBEE,
// RF ו-DMX. ראו docs/superpowers/specs/2026-09-05-driver-filters-design.md

export const STRIP_CRI_OPTIONS = ['הכל', '>80', '>90', '>94', '>95'];

// פסי צבירה מגנטים ומתח גבוה — מיון לפי סוג הפס, נגזר מ-product.trackType
// (מסווג ע"י scripts/classify-track-products.mjs).
// שתי מערכות שאינן תואמות זו לזו: מגנטי 48V מול פס 230V רגיל. מספר הפאזות
// לא מוצג בכוונה — לקוח שצריך לדעת מתקשר.
// "מסילה לינארית" (HiLINE) אינו צ'יפ בכוונה — המוצרים האלה מוצגים תחת "הכל".
export const TRACK_TYPE_OPTIONS = ['הכל', 'מגנטי 48V', 'מתח גבוה 230V'];

// תת-הקטגוריה היחידה שעבורה מוצגת שורת המיון הזו
export const TRACK_SUBCATEGORY = 'פסי צבירה מגנטים ומתח גבוה';
// השם הקודם. קישורים עם ?sub= הישן כבר באוויר (sitemap, דף הבית, שיתופים),
// ולכן הם ממופים לשם החדש במקום ליפול ל"הכל".
export const SUBCATEGORY_ALIASES = { 'פסי צבירה ומסילות': 'פסי צבירה מגנטים ומתח גבוה' };

export const INIT_TRACK = { type: 'הכל' };

export const INIT_STRIP = { ip: 'הכל', type: 'הכל', color: 'הכל', voltage: 'הכל', cri: 'הכל', power: 'הכל', lmw: 'הכל' };
// מחרוזת = בחירה יחידה (בלעדית מטבעה), מערך = רב-בחירה (OR בתוך הציר).
// group נבחר במתג שמעל הגריד, לא בסיידבר, ולכן אינו מאופס ב"איפוס".
export const INIT_PS    = { group: 'הכל', voltage: 'הכל', current: [], inputVoltage: 'הכל', ip: [], dimming: [], power: 'הכל' };
