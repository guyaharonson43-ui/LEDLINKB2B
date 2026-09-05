// כותב את רשימת קבצי הדאטהשיט שקיימים בפועל, לשימוש הקטלוג בזמן ריצה.
//
// datasheets_data.js מפנה ל-400 קבצים ו-70 מהם אינם קיימים, ולכן הוצגו
// לינקים שמחזירים 404. הרשימה נגזרת מהתיקייה עצמה ולא נכתבת ביד: ברגע
// שקובץ חסר יתווסף, הלינק אליו יחזור מעצמו בבנייה הבאה.
//
// נוצר לפני vite build (ראו package.json). לא נכתב ביד.
import { readdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT  = join(ROOT, 'src/catalog/utils/datasheetManifest.js');

// שתי התיקיות — datasheets/ (PDF של היצרן) ו-DATASHEET/ (דפי HTML של
// פרופילי LINK). שתיהן מועתקות ל-dist ע"י generate-static.mjs, ולשתיהן יש
// הפניות ב-datasheets_data.js. סריקה של הראשונה בלבד הייתה מסמנת 14 לינקים
// תקינים כחסרים ומורידה אותם.
const DIRS = ['datasheets', 'DATASHEET'];

const files = DIRS.flatMap(dir =>
  existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)).sort().map(f => dir + '/' + f) : []
);

writeFileSync(OUT,
  '// נוצר אוטומטית ע"י scripts/generate-datasheet-manifest.mjs — אין לערוך ביד.\n' +
  'export default ' + JSON.stringify(files, null, 0) + ';\n',
  'utf8');

// דיווח: כמה מהמסמכים המקושרים חסרים
const src = readFileSync(join(ROOT, 'datasheets_data.js'), 'utf8')
  .replace(/^\s*export\s+default\s+PRODUCT_DATASHEETS;?\s*$/m, '');
const map = new Function(src + '\nreturn PRODUCT_DATASHEETS;')();
const have = new Set(files);
const missing = new Set();
for (const list of Object.values(map)) for (const d of list || []) if (!have.has(d.file)) missing.add(d.file);

console.log(`datasheet manifest: ${files.length} files present across ${DIRS.join(', ')}`);
if (missing.size) {
  console.warn(`  ${missing.size} referenced datasheets are missing and will not be linked:`);
  [...missing].sort().slice(0, 10).forEach(f => console.warn('    ' + f));
  if (missing.size > 10) console.warn(`    ...and ${missing.size - 10} more`);
}
