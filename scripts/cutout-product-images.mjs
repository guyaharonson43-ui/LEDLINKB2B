// מסיר את הרקע הלבן מתמונות המוצר של גופי התאורה וממיר ל-WebP עם שקיפות.
//
// למה: תמונות המקור הן JPEG עם רקע לבן אטום. אריח לבן אטום לא יכול לשבת על
// משטח ולא יכול לקבל צל — ולכן המוצרים "מרחפים" בכרטיס במקום לעמוד. ברגע
// שיש ערוץ אלפא אפשר גם צל מגע וגם משטח אמיתי מתחת למוצר.
//
// האלגוריתם: flood fill מהשוליים בלבד, ולא הסרת לבן גלובלית. זה קריטי —
// הסרה גלובלית הייתה מחוררת כל מוצר לבן (שקוע לבן, צילינדר לבן, עדשה).
// כשזוחלים פנימה רק מהמסגרת, לבן "כלוא" בתוך המוצר נשאר אטום.
//
// בנוסף: פיקסלי רקע שגובלים בתוכן מקבלים שקיפות חלקית לפי בהירותם, אחרת
// נשארת שפה לבנה משוננת סביב המוצר.
//
// המקור יכול להיות כתובת מרוחקת (גופי תאורה מיורולוקס) או קובץ מקומי
// (דרייברים ופרופילים). התוצאה זהה: WebP עם אלפא ב-product-images/.
//
// הרצה:  node scripts/cutout-product-images.mjs [--cat <קטגוריה>] [--only <מק"ט>] [--dry]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'products_data_with_lighting.js');
const OUT_DIR = join(ROOT, 'product-images');
const PUBLIC_PREFIX = 'product-images/';

const args = process.argv.slice(2);
const onlySku = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const onlyCat = args.includes('--cat') ? args[args.indexOf('--cat') + 1] : 'גופי תאורה';
const dry = args.includes('--dry');
const force = args.includes('--force');

// סף בטיחות דו-שלבי. שוליים לבנים לבדם אינם מספיקים: מוצר שנוגע בקצה
// התמונה מקבל אחוז שוליים נמוך אף שהרקע לבן לגמרי. לכן נמדד גם אחוז
// הלבן בכל התמונה — צילום הקשר נכשל בשניהם.
const MIN_WHITE_EDGE = 70;
const MIN_WHITE_ALL = 45;
const MAX_W = 560;

// חריגים לסף השוליים: מוצר על רקע לבן שפשוט נוגע בקצה התמונה. ה-flood fill
// עדיין עובד — הוא זורע מפיקסלי השוליים הלבנים שכן קיימים.
const FORCE_IDS = new Set([
  'qlt-wallwp86k',   // שלושה בקרי קיר, החיצוניים נוגעים בשולי התמונה
]);

// קטגוריות שאינן מקבלות צל מגע. הפרופילים אינם צילומי מוצר אלא שרטוטי
// חתך עם מידות — שרטוט טכני אינו יושב על משטח ואינו מטיל צל.
const NO_SHADOW = new Set(['פרופילים']);

// סף "כמעט לבן". 238 מקל מספיק כדי לתפוס דחיסת JPEG ברקע, ומחמיר מספיק
// כדי לא לאכול גופים לבנים בהירים.
const BG = 238;
// מעליו מרככים שפה: פיקסל תוכן בהיר שגובל ברקע מקבל אלפא חלקית
const FEATHER_FROM = 232;

async function cutout(buf) {
  const img = sharp(buf).ensureAlpha();
  const { width: W, height: H } = await img.metadata();
  const raw = await img.raw().toBuffer();          // RGBA
  const N = W * H;

  const isBg = (i) => raw[i * 4] > BG && raw[i * 4 + 1] > BG && raw[i * 4 + 2] > BG;

  // כמה מהשוליים כמעט-לבנים — מדד לשאלה אם זה בכלל אובייקט על רקע לבן
  let edgePx = 0, edgeWhite = 0;
  const edgeCheck = (x, y) => { edgePx++; if (isBg(y * W + x)) edgeWhite++; };
  for (let x = 0; x < W; x++) { edgeCheck(x, 0); edgeCheck(x, H - 1); }
  for (let y = 0; y < H; y++) { edgeCheck(0, y); edgeCheck(W - 1, y); }
  const edgeWhitePct = Math.round((edgeWhite / edgePx) * 100);

  // דגימה כל 7 פיקסלים — מספיקה לאבחנה, וחוסכת מעבר מלא נוסף
  let sampled = 0, whiteAll = 0;
  for (let i = 0; i < N; i += 7) { sampled++; if (isBg(i)) whiteAll++; }
  const whiteAllPct = Math.round((whiteAll / sampled) * 100);

  // flood fill מהשוליים
  const seen = new Uint8Array(N);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || !isBg(i)) continue;
    seen[i] = 1;
    const x = i % W, y = (i / W) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }

  let removed = 0, feathered = 0;
  for (let i = 0; i < N; i++) if (seen[i]) { raw[i * 4 + 3] = 0; removed++; }

  // ריכוך שפה
  for (let i = 0; i < N; i++) {
    if (raw[i * 4 + 3] !== 255) continue;
    const x = i % W, y = (i / W) | 0;
    const nb = [];
    if (x > 0) nb.push(i - 1);
    if (x < W - 1) nb.push(i + 1);
    if (y > 0) nb.push(i - W);
    if (y < H - 1) nb.push(i + W);
    if (!nb.some((n) => seen[n])) continue;
    const lum = raw[i * 4] * 0.299 + raw[i * 4 + 1] * 0.587 + raw[i * 4 + 2] * 0.114;
    if (lum > FEATHER_FROM) {
      raw[i * 4 + 3] = Math.round(255 * (1 - (lum - FEATHER_FROM) / (255 - FEATHER_FROM)));
      feathered++;
    }
  }

  // התיבה התוחמת של הפיקסלים שנשארו — ממנה נגזרים עוגן הצל ורוחבו.
  // עם ערוץ אלפא זה מדויק, בלי ניחוש על בהירות.
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let i = 0; i < N; i++) {
    if (raw[i * 4 + 3] <= 16) continue;
    const x = i % W, y = (i / W) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const r2 = (n) => Math.round(n * 1000) / 1000;

  // אותם קבועים כמו apply-image-scale.mjs — כדי שהמראה יהיה זהה בין הקטגוריות
  const extent = Math.max(bw / W, bh / H);
  const scale = +Math.min(1.25, Math.max(0.62, 0.82 / extent)).toFixed(2);

  // הכרטיס מציג את התמונה ברוחב ~232px; מסך Retina מכפיל ל-464. 560 מכסה
  // גם את חלון המוצר בלי ריכוך. נמדד על כל 101 תמונות הדרייברים:
  // 700px גדל ב-33%, 640 ב-12%, 560 חוסך 9%. גופי התאורה (250px) לא מושפעים.
  let enc = sharp(raw, { raw: { width: W, height: H, channels: 4 } });
  if (W > MAX_W) enc = enc.resize({ width: MAX_W });
  const out = await enc.webp({ quality: 86, alphaQuality: 100, effort: 6 }).toBuffer();

  return {
    out, removedPct: Math.round((removed / N) * 100), feathered, W, H,
    base: r2((maxY + 1) / H), width: r2(bw / W), scale, edgeWhitePct, whiteAllPct,
  };
}

const src = readFileSync(FILE, 'utf8');
const PREFIX = 'const __PRODUCTS__ = ';
const bodyStart = src.indexOf(PREFIX) + PREFIX.length;
const bodyEnd = src.lastIndexOf('];') + 1;
const products = JSON.parse(src.slice(bodyStart, bodyEnd));

// imgSource נשמר בהרצה הראשונה כדי שהסקריפט יישאר ניתן להרצה חוזרת:
// אחרי הכתיבה img מצביע לקובץ המקומי, והמקור המקורי היה אובד בלעדיו.
const sourceOf = (p) => p.imgSource || p.img || null;
const isRemote = (u) => /^https?:/.test(u);

const load = async (u) =>
  isRemote(u)
    ? Buffer.from(await (await fetch(u)).arrayBuffer())
    : readFileSync(join(ROOT, u));

const targets = products.filter(
  (p) => p.category === onlyCat && sourceOf(p) && (!onlySku || p.sku === onlySku || p.id === onlySku)
);

if (!targets.length) {
  console.error(onlySku ? `לא נמצא מוצר עם מק"ט ${onlySku}` : 'אין תמונות מרוחקות לעיבוד');
  process.exit(1);
}

if (!dry) mkdirSync(OUT_DIR, { recursive: true });

const done = new Map();
// מוצרים רבים חולקים תמונת מקור אחת (241 דרייברים → 101 קבצים). מעבדים
// כל מקור פעם אחת; הפלט עדיין נכתב תחת ה-id של כל מוצר כדי לא לשנות את
// שמות 150 הקבצים שכבר קיימים.
const cache = new Map();
let bytesIn = 0, bytesOut = 0, failed = [], skipped = [];

for (const p of targets) {
  const src = sourceOf(p);
  try {
    let res = cache.get(src);
    if (!res) {
      const buf = await load(src);
      res = await cutout(buf);
      res.inBytes = buf.length;
      cache.set(src, res);
      bytesIn += buf.length;
      const isObject = res.edgeWhitePct >= MIN_WHITE_EDGE && res.whiteAllPct >= MIN_WHITE_ALL;
      if (!isObject && !force && !FORCE_IDS.has(p.id)) {
        skipped.push(`${p.sku || p.id} → שוליים ${res.edgeWhitePct}% / לבן כללי ${res.whiteAllPct}%`);
        res.skip = true;
      }
    }
    if (res.skip) continue;

    // הקובץ נכתב פעם אחת לכל מקור. מוצרים שחולקים תמונה מצביעים לאותו
    // קובץ — 241 דרייברים נשענים על 101 תמונות בלבד.
    if (!res.file) {
      res.file = `${p.id}.webp`;
      if (!dry) writeFileSync(join(OUT_DIR, res.file), res.out);
      bytesOut += res.out.length;
      console.log(`  ${String(p.sku || p.id).padEnd(26)} הוסר ${String(res.removedPct).padStart(3)}%  בסיס ${String(res.base).padEnd(5)} רוחב ${String(res.width).padEnd(5)} ×${res.scale}`);
    }
    done.set(p.id, { img: PUBLIC_PREFIX + res.file, src, base: res.base, width: res.width, scale: res.scale });
  } catch (e) {
    failed.push(`${p.sku || p.id} → ${e.message}`);
  }
}

if (!dry) {
  // imgCutout מסמן שיש לתמונה ערוץ אלפא — רק אז מותר לצייר מתחתיה צל מגע.
  // בלי הדגל, מוצר שעדיין JPEG אטום היה מקבל צל מוסתר מתחת לאריח לבן.
  const next = products.map((p) => {
    const d = done.get(p.id);
    if (!d) return p;
    const next = { ...p, img: d.img, imgSource: d.src, imgCutout: true,
                   imgWidth: d.width, imgScale: d.scale };
    // imgBase הוא עוגן צל המגע. בלעדיו ProductImg לא מצייר צל כלל.
    if (NO_SHADOW.has(p.category)) delete next.imgBase;
    else next.imgBase = d.base;
    return next;
  });
  writeFileSync(FILE, src.slice(0, bodyStart) + JSON.stringify(next, null, 2) + src.slice(bodyEnd));
}

console.log(`\nעובדו ${done.size} תמונות${dry ? ' (יבש — לא נכתב דבר)' : ''}`);
console.log(`מקורות ייחודיים: ${cache.size}`);
console.log(`נפח: ${Math.round(bytesIn / 1024)}KB → ${Math.round(bytesOut / 1024)}KB (${Math.round((1 - bytesOut / bytesIn) * 100)}% חיסכון)`);
if (skipped.length) {
  console.log(`
דולגו — לא אובייקט על רקע לבן (${skipped.length}):`);
  skipped.slice(0, 12).forEach((x) => console.log(`  ${x}`));
  if (skipped.length > 12) console.log(`  ...ועוד ${skipped.length - 12}`);
}
if (failed.length) {
  console.log(`\nנכשלו (${failed.length}):`);
  failed.forEach((f) => console.log(`  ${f}`));
}
