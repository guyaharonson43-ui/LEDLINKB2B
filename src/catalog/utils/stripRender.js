// הדמיית מוצר אחידה לסטריפי LED — SVG שנבנה מנתוני המוצר במקום צילומים
// לא אחידים. כל הסטריפים מצוירים באותה זווית, תאורה וקנה מידה; מה שמשתנה
// הוא מה שבאמת שונה בין המוצרים: סוג הלד, הצפיפות, הגנת ה-IP והצבע.


// ── זיהוי מאפייני המוצר ──────────────────────────────────────────────────────
export function stripSpec(p) {
  const name = (p.name || '').toUpperCase();
  const desc = p.desc || '';
  const sub = p.subCategory || '';
  const ip = +(((p.specs && p.specs.ip) || desc.match(/IP\d+/i)?.[0] || 'IP20').replace(/\D/g, '')) || 20;
  const watts = parseFloat(desc.match(/(\d+(?:\.\d+)?)\s*W/i)?.[1] || p.specs?.power || 10);

  let kind = 'smd';
  if (/RGBW|RGB\+W/i.test(name + desc)) kind = 'rgbw';
  else if (/RGB/i.test(name + desc)) kind = 'rgb';
  if (sub === 'COB' || /\b(COB|DOB)/i.test(name)) kind = kind === 'smd' ? 'cob' : kind;

  // צפיפות: קוד QLT נושא אותה (H24210 → 210 לד/מ'); אחרת לפי הספק
  const code = (name.match(/—\s*([A-Z]+\d{2})(\d{3})/) || [])[2];
  let density = code ? +code : null;
  if (!density || density < 30 || density > 700) {
    density = watts <= 6 ? 60 : watts <= 10 ? 120 : watts <= 15 ? 180 : watts <= 20 ? 240 : 480;
  }
  if (kind === 'rgb' || kind === 'rgbw') density = Math.min(density, 72);

  const rows = density > 300 && kind === 'smd' ? 2 : 1;
  const widthMm = rows === 2 ? 15 : kind === 'rgbw' ? 12 : kind === 'rgb' ? 10 : 10;
  return { kind, ip, watts, density, rows, widthMm };
}

// ── ציור ────────────────────────────────────────────────────────────────────
// הסטריפ מונח על משטח: לולאה אחת (כמו סליל שנפתח) וזנב ישר שיוצא קדימה.
// מציירים במבט-על (x,y במישור) ואז מכווצים את y כדי לקבל זווית מבט של 30°.
const f = n => Math.round(n * 100) / 100;
const S = 2.3;                      // מ"מ → יחידות במבט-על
const C = { x: 236, y: 244 };
const R_OUT = 160;                  // רדיוס הסיבוב החיצוני של הסליל
const TURNS = 2.6;                 // כמה סיבובים בסליל (ספירלה מבפנים החוצה)
const TAIL = 230;                   // אורך הזנב הישר שיוצא קדימה

// המסלול נדגם פעם אחת לכל רוחב סטריפ (הפסיעה בין הסיבובים תלויה ברוחב)
function buildPath(bandW) {
  const pitch = bandW + 4;
  const th1 = Math.PI * 1.9, th0 = th1 - TURNS * 2 * Math.PI;   // הזנב יוצא מימין-למעלה אל הצופה
  const rIn = R_OUT - pitch * TURNS;
  const pts = [];
  let prev = null, d = 0;
  for (let th = th0; th <= th1; th += 0.01) {
    const r = rIn + (R_OUT - rIn) * (th - th0) / (th1 - th0);
    const x = C.x + r * Math.cos(th), y = C.y + r * Math.sin(th);
    if (prev) d += Math.hypot(x - prev.x, y - prev.y);
    prev = { x, y, d }; pts.push(prev);
  }
  const n = pts.length, e = pts[n - 1], q = pts[n - 2];
  const t = Math.atan2(e.y - q.y, e.x - q.x);
  for (let k = 2; k <= TAIL; k += 2) pts.push({ x: e.x + Math.cos(t) * k, y: e.y + Math.sin(t) * k, d: e.d + k });
  return pts;
}
let PATH = buildPath(46);
let TOTAL = PATH[PATH.length - 1].d;
function at(d) {
  let lo = 0, hi = PATH.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (PATH[m].d < d) lo = m; else hi = m; }
  const a = PATH[lo], b = PATH[hi];
  const u = b.d > a.d ? (d - a.d) / (b.d - a.d) : 0;
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, t: Math.atan2(b.y - a.y, b.x - a.x) };
}
function pathD() {
  return 'M' + PATH.filter((_, i) => i % 3 === 0 || i === PATH.length - 1).map(p => `${f(p.x)},${f(p.y)}`).join(' L');
}
const place = (d, off, inner) => {
  const p = at(d), deg = p.t * 180 / Math.PI;
  const nx = -Math.sin(p.t) * off, ny = Math.cos(p.t) * off;
  return `<g transform="translate(${f(p.x + nx)} ${f(p.y + ny)}) rotate(${f(deg)})">${inner}</g>`;
};

function ledPackage(kind) {
  const s = S;
  if (kind === 'rgb' || kind === 'rgbw') {
    const w = 5 * s, dots = kind === 'rgbw' ? ['#E5484D', '#30A46C', '#3E63DD', '#F3DFA2'] : ['#E5484D', '#30A46C', '#3E63DD'];
    const step = w / (dots.length + 1);
    return `<rect x="${f(-w / 2)}" y="${f(-w / 2)}" width="${f(w)}" height="${f(w)}" rx="${f(0.6 * s)}" fill="url(#pkg)" stroke="#CFCBC2" stroke-width="0.7"/>`
      + `<circle r="${f(2 * s)}" fill="#F6F3EC" stroke="#DCD7CC" stroke-width="0.6"/>`
      + dots.map((c, i) => `<rect x="${f(-w / 2 + step * (i + 1) - 0.4 * s)}" y="${f(-0.4 * s)}" width="${f(0.8 * s)}" height="${f(0.8 * s)}" fill="${c}"/>`).join('');
  }
  const w = 3.5 * s, h = 2.8 * s;
  return `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(0.35 * s)}" fill="url(#pkg)" stroke="#CFCBC2" stroke-width="0.7"/>`
    + `<rect x="${f(-w / 2 + 0.45 * s)}" y="${f(-h / 2 + 0.4 * s)}" width="${f(w - 0.9 * s)}" height="${f(h - 0.8 * s)}" rx="${f(0.3 * s)}" fill="url(#phos)"/>`;
}

function band(width, color, extra = '') {
  return `<path d="${pathD()}" fill="none" stroke="${color}" stroke-width="${f(width)}" stroke-linecap="butt" ${extra}/>`;
}

function stripLayers(spec) {
  const s = S, W = spec.widthMm * s;
  const sleeve = spec.ip >= 67 ? 2.4 * s : 0;
  const L = [];
  if (sleeve) L.push(band(W + 2 * sleeve, '#E6ECEE', 'stroke-opacity="0.75"'), band(W + 2 * sleeve - 1.6, '#F3F6F7', 'stroke-opacity="0.6"'));
  L.push(band(W + 1.4, '#C9C3B6'), band(W, '#F7F5F0'));
  L.push(band(0.4 * s, '#E6D8BF', `transform="translate(0 0)"`));
  // מסילות נחושת בשוליים — כקווים מקבילים
  ;[-(W / 2 - 1.1 * s), W / 2 - 1.1 * s].forEach(o => {
    for (let d = 0; d < TOTAL; d += 6) L.push(place(d, o, `<rect x="-3.2" y="${f(-0.18 * s)}" width="6.4" height="${f(0.36 * s)}" fill="#E4D5BA"/>`));
  });
  if (spec.kind === 'cob') {
    L.push(band(W * 0.44, 'url(#phosLin)'), band(W * 0.12, '#FFF1C2', 'stroke-opacity="0.7"'));
  } else {
    const pitch = 1000 / spec.density * s * (spec.rows === 2 ? 2 : 1);
    const offs = spec.rows === 2 ? [-W * 0.18, W * 0.18] : [0];
    const group = spec.kind === 'smd' ? Math.max(3, Math.round(spec.density / 40)) : 3;
    let i = 0;
    for (let d = pitch / 2; d < TOTAL - pitch / 2; d += pitch, i++) {
      offs.forEach((o, r) => L.push(place(d + (r ? pitch / 2 : 0), o, ledPackage(spec.kind))));
      if (spec.kind === 'smd' && i % group === group - 1) {
        L.push(place(d + pitch / 2, spec.rows === 2 ? 0 : W * 0.3, `<rect x="${f(-0.8 * s)}" y="${f(-0.5 * s)}" width="${f(1.6 * s)}" height="${f(s)}" fill="#2B2B2B"/>`));
      }
    }
  }
  const cutMm = spec.kind === 'cob' ? 50 : spec.kind === 'smd' ? Math.max(25, 3000 / spec.density) : 100 / 3;
  for (let d = cutMm * s; d < TOTAL - 4 * s; d += cutMm * s) {
    const pad = x => `<rect x="${f(x)}" y="${f(-0.95 * s)}" width="${f(1.3 * s)}" height="${f(1.9 * s)}" rx="${f(0.3 * s)}" fill="url(#cu)"/>`;
    L.push(place(d, 0, `<line x1="0" y1="${f(-W / 2)}" x2="0" y2="${f(W / 2)}" stroke="#9A9489" stroke-width="0.8" stroke-dasharray="2.5 2"/>`));
    [-W * 0.3, W * 0.3].forEach(o => L.push(place(d, o, pad(-1.7 * s) + pad(0.4 * s))));
  }
  if (spec.ip >= 65 && spec.ip < 67) L.push(band(W, '#D7E7EE', 'stroke-opacity="0.25"'));
  if (spec.ip >= 65) L.push(band(W * 0.14, '#FFFFFF', `stroke-opacity="0.55" transform="translate(0 ${f(-W * 0.3)})"`));
  return { layers: L.join(''), W, sleeve };
}

export function renderStripSVG(p) {
  const spec = stripSpec(p);
  const bandW = spec.widthMm * S + (spec.ip >= 67 ? 4.8 * S : 0);
  PATH = buildPath(bandW); TOTAL = PATH[PATH.length - 1].d;
  const { layers, W, sleeve } = stripLayers(spec);
  const T = 1.4 * S + (sleeve ? sleeve * 0.7 : 0);
  // מבט-על → מבט מזווית: כיווץ אנכי + סיבוב קל
  // ממרכזים את הסליל במסגרת לפי תיבת הגבול שלו אחרי הכיווץ
  const K = 0.6, m = bandW / 2 + 8;
  const xs = PATH.map(p => p.x), ys = PATH.map(p => p.y * K);
  const x0 = Math.min(...xs) - m, x1 = Math.max(...xs) + m;
  const y0 = Math.min(...ys) - m * K, y1 = Math.max(...ys) + m * K + T + 20;
  const fit = Math.min(440 / (x1 - x0), 440 / (y1 - y0));
  const tx = 250 - fit * (x0 + x1) / 2, ty = 250 - fit * (y0 + y1) / 2;
  const view = `translate(${f(tx)} ${f(ty)}) scale(${f(fit)} ${f(fit * K)})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
<defs>
  <linearGradient id="pkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4E0D6"/></linearGradient>
  <radialGradient id="phos" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#FFE489"/><stop offset="1" stop-color="#E7B53A"/></radialGradient>
  <linearGradient id="phosLin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6CD55"/><stop offset="1" stop-color="#EDBA3F"/></linearGradient>
  <linearGradient id="cu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9B36A"/><stop offset="1" stop-color="#B7792E"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>
<g transform="${view}">
  <g transform="translate(10 34)" filter="url(#soft)">${band(W + 2 * sleeve + 10, '#5E564A', 'stroke-opacity="0.32"')}</g>
  <g transform="translate(0 ${f(T / 0.52)})">${band(W + 2 * sleeve, '#B9B2A4')}</g>
  ${layers}
</g>
</svg>`;
}

export function stripImageURI(p) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderStripSVG(p));
}
