/**
 * תמונות אחידות לכל מוצרי הנאון: נאון דולק על רקע שחור.
 *
 *  1. מקור לכל מוצר: הצילום הדולק של היצרן, או הדמיה של נאון דולק כשאין
 *     ליצרן צילום כזה (N2416H, N2412B RGB, N2412L, N2412F).
 *  2. עיבוד אחיד: חיתוך 3:2, רקע נדחס לשחור מלא, והבהירות מיושרת כך
 *     שהנאון הבהיר ביותר בכל תמונה מגיע לאותה רמה.
 *  3. פלט: strips/neon/<name>.webp, ועדכון שדה img בשלושת קבצי הנתונים.
 *
 * הרצה: node scripts/build-neon-images.mjs
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'strips/neon');
const W = 1200, H = 800;

// ── הדמיה של נאון דולק ──────────────────────────────────────────────────────
// סליל רופף בפרספקטיבה (כמו בצילומי היצרן): כניסה משמאל, לולאה וזנב ימינה.
// לכל דגם צורה משלו, כדי שההדמיות לא ייראו כהעתק זו של זו.
const PATHS = {
  loop: 'M -60 640 C 140 600, 250 560, 300 500 C 360 420, 500 270, 700 262 '
    + 'C 930 254, 1010 380, 900 452 C 790 524, 500 540, 430 468 C 372 408, 520 342, 720 350 '
    + 'C 930 358, 1110 440, 1280 560',
  // S רחב — סליל שנפתח משמאל-למטה ויוצא ימינה-למעלה
  wave: 'M -60 560 C 160 600, 320 610, 470 520 C 620 430, 560 250, 760 230 '
    + 'C 960 210, 1010 380, 880 430 C 760 476, 650 380, 760 330 C 900 268, 1100 300, 1280 250',
  // שתי לולאות מקבילות, כמו סליל שהונח על השולחן
  coil: 'M -60 470 C 180 470, 250 330, 520 300 C 800 270, 1010 340, 980 440 '
    + 'C 950 540, 600 580, 420 520 C 260 466, 330 380, 560 368 C 790 356, 900 420, 860 480 '
    + 'C 820 540, 900 600, 1280 610',
};

function neonSVG({ color, rgb, shape = 'loop', w = 1 }) {
  const PATH = PATHS[shape];
  const stroke = rgb ? 'url(#rgb)' : color;
  const layer = (w, c, op, blur, extra = '') =>
    `<path d="${PATH}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}" ${blur ? `filter="url(#b${blur})"` : ''} ${extra}/>`;
  const blurs = [2, 8, 22, 46].map(s => `<filter id="b${s}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${blurs}
  <radialGradient id="bg" cx="0.5" cy="0.55" r="0.75"><stop offset="0" stop-color="#101012"/><stop offset="1" stop-color="#000"/></radialGradient>
  <linearGradient id="rgb" x1="0" y1="0" x2="1" y2="0.3">
    <stop offset="0" stop-color="#ff2d55"/><stop offset="0.25" stop-color="#ff9f1c"/><stop offset="0.5" stop-color="#2bd66a"/>
    <stop offset="0.75" stop-color="#2d8cff"/><stop offset="1" stop-color="#b44dff"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<g transform="translate(0 58)" opacity="0.28">${layer(60, stroke, 0.5, 46)}${layer(22, stroke, 0.6, 8)}</g>
${layer(120 * w, stroke, 0.22, 46)}
${layer(56 * w, stroke, 0.38, 22)}
${layer(34 * w, '#2a2a2a', 0.9, 0)}
${layer(30 * w, stroke, 0.95, 2)}
${layer(18 * w, rgb ? stroke : '#fffaf0', 0.95, 2)}
${layer(8 * w, '#ffffff', rgb ? 0.55 : 0.9, 2)}
</svg>`;
}

// ── מקורות ──────────────────────────────────────────────────────────────────
const SOURCES = {
  'n2416h':  { svg: neonSVG({ color: '#ffe2ae' }) },            // אין צילום דולק ליצרן
  'n2412b':  { svg: neonSVG({ rgb: true }) },                   // RGB — אין צילום דולק ליצרן
  // N2412L (פנים מוארות 6 מ"מ) ו-N2412F (8 מ"מ): צילומי היצרן לא דולקים — הדמיה
  'n2412l':  { svg: neonSVG({ color: '#fff0d2', shape: 'wave', w: 0.72 }) },
  'n2412f':  { svg: neonSVG({ color: '#ffeccb', shape: 'coil', w: 0.9 }) },
  'n2414rg': { file: 'strips/NEON-RGB-nuova-1024x683.webp' },
  'n0308':   { file: 'strips/N0308-1024x683.webp' },
  'n4x10':   { file: 'strips/N4X10-1024x444.webp' },
  'n4x10t':  { file: 'strips/0410T_6J9A0119.webp', black: 80, desat: true },  // משטח ירקרק
  'n0808':   { file: 'strips/0808_6J9A0486-1024x683.webp' },
  'nt':      { file: 'strips/O23MM_FEN14WR-P5-G1-28AH9x-24V280D-R23L052-1024x683.webp' },
  'ntr':     { file: 'strips/triangle-1-1-1024x576.webp' },
  'spi-rgbw':{ file: 'strips/SPI-NEON-RGBW-1024x500.webp' },
  'spi-wh':  { file: 'strips/SPI-NEON-WHITE-1024x683.webp' },
};

const PRODUCTS = {
  'ledlink-neon-top': 'n2416h', 'qlt-n2416h': 'n2416h', 'qlt-n2414h1': 'n2416h',
  'ledlink-neon-rgb': 'n2412b', 'qlt-n2412b0rg': 'n2412b', 'qlt-n2412b1rg': 'n2412b',
  'ledlink-neon-side': 'n2412l', 'qlt-n2412l': 'n2412l',
  'qlt-n2412f': 'n2412f',
  'qlt-n2414h0rg': 'n2414rg', 'qlt-n2414h1rg': 'n2414rg',
  'qlt-n3x8-mini-neon': 'n0308', 'qlt-n4x10': 'n4x10', 'qlt-n4x10t': 'n4x10t', 'qlt-n3x8': 'n0808',
  'qlt-nt1811-360-strip-neon-led-tube': 'nt', 'qlt-nt2314-360-strip-neon-led-tube': 'nt',
  'qlt-ntr2416-neon-triangle': 'ntr', 'qlt-spi-neon-rgbw': 'spi-rgbw', 'qlt-spi-neon-wh': 'spi-wh',
};

async function load(src) {
  if (src.svg) return sharp(Buffer.from(src.svg));
  if (src.file) return sharp(join(ROOT, src.file));
  throw new Error('unknown source');
}

// ── עיבוד אחיד ──────────────────────────────────────────────────────────────
async function normalize(img, src = {}) {
  const base = img.resize(W, H, { fit: 'cover', position: 'centre' }).removeAlpha();
  const { data } = await base.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
  const hist = new Array(256).fill(0);
  for (const v of data) hist[v]++;
  const pct = p => { let acc = 0; const n = data.length * p; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= n) return i; } return 255; };
  // נקודת השחור: הרקע (החציון, רוב התמונה) נדחס לשחור; נקודת הלבן: הנאון עצמו
  const black = src.black ?? Math.min(90, Math.round(pct(0.55) * 1.05));
  const white = Math.max(black + 40, pct(0.995));
  const a = 248 / (white - black), b = -black * a;
  return base.linear(a, b).modulate({ saturation: src.desat ? 0.35 : 0.95 });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const [name, src] of Object.entries(SOURCES)) {
    const img = await normalize(await load(src), src);
    await img.webp({ quality: 84 }).toFile(join(OUT, `${name}.webp`));
    console.log('wrote', `strips/neon/${name}.webp`);
  }
  // עדכון img בקבצי הנתונים; שדות החיתוך (cutout וכו') לא רלוונטיים לצילום מלא
  for (const f of ['products_data_with_lighting.js', 'products_data.js', 'lighting_products.js']) {
    let s = readFileSync(join(ROOT, f), 'utf8');
    for (const [id, name] of Object.entries(PRODUCTS)) {
      const i = s.indexOf(`"id": "${id}"`);
      if (i < 0) continue;
      const end = s.indexOf('\n  }', i);
      let blk = s.slice(i, end);
      blk = blk.replace(/"img": "[^"]*"/, `"img": "strips/neon/${name}.webp"`)
        .replace(/,\s*"imgCutout": true/, '').replace(/,\s*"imgWidth": [\d.]+/, '')
        .replace(/,\s*"imgScale": [\d.]+/, '').replace(/,\s*"imgBase": [\d.]+/, '');
      s = s.slice(0, i) + blk + s.slice(end);
    }
    writeFileSync(join(ROOT, f), s);
  }
}

main();
