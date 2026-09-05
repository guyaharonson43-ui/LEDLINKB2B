// אילו קבצי דאטהשיט באמת קיימים בריפו.
//
// datasheets_data.js מפנה ל-400 קבצים, אך 70 מהם אינם קיימים על הדיסק —
// ולכן גם לא ב-dist, שנבנית מהעתקה שלה. התוצאה הייתה לינק "דף נתונים"
// שנראה תקין ומחזיר 404. אומתו מול האתר החי: DS_WALL.pdf, DS_ZBX.pdf
// ו-DS_CPL.pdf כולם 404.
//
// המניפסט נוצר מהתיקייה עצמה לפני כל בנייה, ולכן קובץ שיתווסף יחזיר את
// הלינק שלו מעצמו בלי לזכור לעדכן דבר.
import manifest from './datasheetManifest';

const EXISTING = new Set(manifest);

/** מסנן רשימת מסמכים של מוצר לאלה שהקובץ שלהם באמת קיים. */
export function existingDatasheets(list) {
  return (list || []).filter(d => EXISTING.has(d.file));
}

export { EXISTING };
