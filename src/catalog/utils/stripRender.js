// הדמיית מוצר אחידה לסטריפי LED — SVG שנבנה מנתוני המוצר במקום צילומים
// לא אחידים. כל הסטריפים מצוירים באותה זווית, תאורה וקנה מידה; מה שמשתנה
// הוא מה שבאמת שונה בין המוצרים, לפי דף הנתונים של היצרן: סוג הלד וגודלו,
// הצפיפות, מספר השורות, רוחב ה-PCB, מקטע החיתוך והגנת ה-IP.

import STRIP_MODELS from '../data/stripModels.js';

// גודל מארז הלד במ"מ: [לאורך הסטריפ, לרוחב הסטריפ]
const LED_SIZE = {
  '2835': [3.5, 2.8], '3528': [3.5, 2.8], '2110': [1.0, 2.1], '2216': [1.6, 2.2],
  '3535': [3.5, 3.5], '5050': [5, 5], '2020': [2, 2],
};

// ── מאפייני המוצר ───────────────────────────────────────────────────────────
// קודם מודל מדויק מדף הנתונים (stripModels.js); אם אין — הערכה מהתיאור.
export function stripSpec(p) {
  const name = (p.name || '').toUpperCase();
  const desc = p.desc || '';
  const ip = +(((p.specs && p.specs.ip) || desc.match(/IP\d+/i)?.[0] || 'IP20').replace(/\D/g, '')) || 20;
  const watts = parseFloat(desc.match(/(\d+(?:\.\d+)?)\s*W/i)?.[1] || p.specs?.power || 10);
  const rgbw = /RGBW|RGB\+W/i.test(name + desc), rgb = !rgbw && /RGB/i.test(name + desc);
  const dob = p.subCategory === 'COB' || /\b(COB|DOB)/i.test(name);
  const zigzag = /\b3D\b|זיגזג/i.test(name + desc);

  const est = {
    ip,
    color: rgbw ? 'rgbw' : rgb ? 'rgb' : 'white',
    led: rgbw || rgb ? '5050' : '2835',
    density: dob ? 288 : rgb || rgbw ? 60 : watts <= 6 ? 60 : watts <= 10 ? 120 : watts <= 15 ? 160 : 240,
    rows: 1, alt: false, widthMm: rgbw ? 12 : 10, cutMm: 50, dob, zigzag,
  };
  const m = STRIP_MODELS[p.id] || {};
  const spec = { ...est, ...m };
  spec.pitch = 1000 / (spec.density / spec.rows);
  return spec;
}

// ── גיאומטריה ───────────────────────────────────────────────────────────────
// הסטריפ הוא סרט במרחב: קו מרכז c(u) לאורך u (מ"מ) וכיוון רוחב w(u).
// סטריפ רגיל מתכופף רק סביב ציר הרוחב — עולה ויורד; זיגזג בלבד מתכופף
// הצידה במישור שלו. כל פרט ממופה על פני הסרט ואז מוקרן בזווית קבועה.
const f = n => Math.round(n * 100) / 100;
const LEN = 120;                     // אורך הקטע במ"מ
const YAW = -0.5, PITCH = 0.62;      // זווית המבט (רדיאנים)

function geometry(spec) {
  const k = 2 * Math.PI / LEN;
  if (spec.zigzag) {
    // קשת עדינה במישור + זיגזג חד (גל משולש מעוגל, מחזור = שני לדים)
    const A = 5, a = 3.2, P = spec.pitch;
    const tri = u => { const x = ((u / P) % 1 + 1) % 1; const t = x < 0.5 ? 4 * x - 1 : 3 - 4 * x; return Math.tanh(3.5 * t) / Math.tanh(3.5); };
    const g = u => A * Math.sin(k * u) + a * tri(u);
    return u => {
      const dg = (g(u + 0.05) - g(u - 0.05)) / 0.1, n = Math.hypot(1, dg);
      return { c: [u, g(u), 0], w: [-dg / n, 1 / n, 0], t: [1 / n, dg / n, 0] };
    };
  }
  const A = 8;
  return u => {
    const h = A * Math.sin(k * u), dh = A * k * Math.cos(k * u), n = Math.hypot(1, dh);
    return { c: [u, 0, h], w: [0, 1, 0], t: [1 / n, 0, dh / n] };
  };
}

const ca = Math.cos(YAW), sa = Math.sin(YAW), cb = Math.cos(PITCH), sb = Math.sin(PITCH);
const project = ([x, y, z]) => { const x1 = x * ca - y * sa, y1 = x * sa + y * ca; return [x1, -z * cb + y1 * sb]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const mix = (c1, c2, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(c1.slice(1 + i, 3 + i), 16) * (1 - t) + parseInt(c2.slice(1 + i, 3 + i), 16) * t).toString(16).padStart(2, '0')).join('');
const pts = P => P.map(p => `${f(p[0])},${f(p[1])}`).join(' ');

function makeSurface(spec) {
  const geo = geometry(spec);
  const pt = (u, v, dz = 0) => {
    const g = geo(u), n = cross(g.t, g.w);
    return project([0, 1, 2].map(i => g.c[i] + g.w[i] * v + n[i] * dz));
  };
  // מלבן על פני הסרט → מצולע מוקרן (מחולק כדי לעקוב אחרי הכיפוף)
  const quad = (u0, u1, v0, v1, dz = 0) => {
    const n = Math.max(1, Math.ceil((u1 - u0) / 1.5)), P = [];
    for (let i = 0; i <= n; i++) P.push(pt(u0 + (u1 - u0) * i / n, v0, dz));
    for (let i = n; i >= 0; i--) P.push(pt(u0 + (u1 - u0) * i / n, v1, dz));
    return pts(P);
  };
  const circle = (u, v, r, dz = 0) => {
    const P = [];
    for (let i = 0; i < 14; i++) { const a = i / 14 * 2 * Math.PI; P.push(pt(u + r * Math.cos(a), v + r * Math.sin(a), dz)); }
    return pts(P);
  };
  const light = norm([0.25, 0.35, 1]);
  const shade = u => { const g = geo(u); return Math.max(0, dot(cross(g.t, g.w), light)); };
  return { pt, quad, circle, shade };
}

// ── רכיבים ──────────────────────────────────────────────────────────────────
function led(S, u, v, spec, warm) {
  const [la, lw] = LED_SIZE[spec.led] || LED_SIZE['2835'];
  const a = la / 2, b = lw / 2;
  const body = `<polygon points="${S.quad(u - a, u + a, v - b, v + b, 0.25)}" fill="#F7F5EF" stroke="#C9C4B8" stroke-width="0.12"/>`;
  if (spec.color !== 'white') {
    const dots = spec.color === 'rgbw' ? ['#D9443F', '#2E9A5E', '#3A5BD0', '#F2D98C'] : ['#D9443F', '#2E9A5E', '#3A5BD0'];
    const r = Math.min(a, b) * 0.78, step = (2 * r) / (dots.length + 1);
    return body + `<polygon points="${S.circle(u, v, r, 0.3)}" fill="#FBFAF6" stroke="#DAD5CA" stroke-width="0.08"/>`
      + dots.map((c, i) => { const du = -r + step * (i + 1); return `<polygon points="${S.quad(u + du - 0.28, u + du + 0.28, v - 0.28, v + 0.28, 0.35)}" fill="${c}"/>`; }).join('');
  }
  // חלון הזרחן: צהוב-כתום לגוון חם, צהוב בהיר לגוון קר (בסטריפ דו-גווני הם מתחלפים)
  const ph = warm ? 'url(#phosW)' : 'url(#phosC)';
  const ia = a - Math.min(0.35, a * 0.2), ib = b - Math.min(0.35, b * 0.2);
  return body + `<polygon points="${S.quad(u - ia, u + ia, v - ib, v + ib, 0.3)}" fill="${ph}"/>`;
}

// ── ציור ────────────────────────────────────────────────────────────────────
export function renderStripSVG(p) {
  const spec = stripSpec(p);
  const S = makeSurface(spec);
  const W = spec.zigzag ? 5.2 : spec.widthMm, hw = W / 2;
  const sleeve = spec.ip >= 67 ? 2 : 0;
  const PCB_T = 1.2;
  const out = [];
  const STEP = 1.2;

  // קצה קרוב: עובי ה-PCB ומתחתיו פס נייר הדבק האדום
  for (let u = 0; u < LEN; u += STEP) {
    const e = u + STEP + 0.3, v = hw + sleeve;
    const band = (z0, z1, c) => `<polygon points="${pts([S.pt(u, v, z0), S.pt(e, v, z0), S.pt(e, v, z1), S.pt(u, v, z1)])}" fill="${c}"/>`;
    if (sleeve) out.push(band(0.2, -3.8, mix('#E3E8EA', '#B8C1C4', 0.5 - S.shade(u) * 0.4)));
    out.push(band(0, -PCB_T, mix('#D9D4C8', '#B3AC9E', 0.5 - S.shade(u) * 0.4)));
    out.push(band(-PCB_T, -PCB_T - 0.35, '#8A2F2A'));
  }
  // שרוול סיליקון (IP67/68) — חלבי-שקוף, מעט רחב מה-PCB
  if (sleeve) for (let u = 0; u < LEN; u += STEP) out.push(`<polygon points="${S.quad(u, u + STEP + 0.2, -hw - sleeve, hw + sleeve, 0.05)}" fill="${mix('#F1F4F5', '#CDD5D8', 1 - S.shade(u))}"/>`);
  // PCB לבן עם הצללה לפי זווית הפנים
  for (let u = 0; u < LEN; u += STEP) out.push(`<polygon points="${S.quad(u, u + STEP + 0.2, -hw, hw, 0.1)}" fill="${mix('#FCFBF8', '#D2CDC2', 1 - S.shade(u))}"/>`);

  if (spec.dob) {
    // DOB: הלדים הצפופים נראים דרך שכבת ציפוי חלבית רציפה
    for (let u = spec.pitch / 2; u < LEN; u += spec.pitch) out.push(`<polygon points="${S.quad(u - 0.6, u + 0.6, -1.3, 1.3, 0.2)}" fill="#E9B84A"/>`);
    out.push(`<polygon points="${S.quad(0, LEN, -hw * 0.72, hw * 0.72, 0.6)}" fill="url(#milk)" fill-opacity="0.94"/>`);
    out.push(`<polygon points="${S.quad(0, LEN, -hw * 0.5, -hw * 0.18, 0.7)}" fill="#FFFFFF" fill-opacity="0.35"/>`);
  } else {
    const rows = spec.rows === 2 ? [-W * 0.2, W * 0.2] : [0];
    const perCut = Math.round(spec.cutMm / spec.pitch);
    let i = 0;
    for (let u = spec.pitch / 2; u < LEN - 1; u += spec.pitch, i++) {
      const k = i % perCut;
      // נגד בכל קבוצה, בשורה של הלדים (כמו בשרטוט היצרן)
      if (!spec.zigzag && perCut >= 3 && k === Math.floor(perCut / 2) - 1 && spec.rows === 1) {
        out.push(`<polygon points="${S.quad(u - 0.45, u + 0.45, -0.9, 0.9, 0.25)}" fill="#2A2A2A"/>`);
        continue;
      }
      rows.forEach((v, r) => out.push(led(S, u, v, spec, spec.alt ? (i + r) % 2 === 0 : true)));
    }
  }
  // נקודות חיתוך: קו, ומשני צדיו פדי נחושת עגולים (למעלה ולמטה)
  if (!spec.zigzag) {
    for (let u = spec.cutMm; u < LEN - 3; u += spec.cutMm) {
      out.push(`<polygon points="${S.quad(u - 0.08, u + 0.08, -hw, hw, 0.2)}" fill="#A39D92"/>`);
      [-(hw - 1.5), hw - 1.5].forEach(v => {
        out.push(`<polygon points="${S.circle(u - 1.4, v, 0.95, 0.25)}" fill="url(#cu)"/>`);
        out.push(`<polygon points="${S.circle(u + 1.4, v, 0.95, 0.25)}" fill="url(#cu)"/>`);
      });
      // סימון "+DC24V" קטן ליד הפד
      out.push(`<polygon points="${S.quad(u + 2.8, u + 6, -(hw - 1.1), -(hw - 1.6), 0.2)}" fill="#B4AEA3"/>`);
    }
  }
  // ציפוי IP65 שקוף והברקה
  if (spec.ip >= 65 && spec.ip < 67) out.push(`<polygon points="${S.quad(0, LEN, -hw, hw, 1)}" fill="#DCEAF0" fill-opacity="0.22"/>`);
  if (spec.ip >= 65) out.push(`<polygon points="${S.quad(0, LEN, -hw * 0.8 - sleeve, -hw * 0.5 - sleeve, 1.2)}" fill="#FFFFFF" fill-opacity="0.5"/>`);

  // צל רך על המשטח
  const ground = [];
  for (let u = 0; u <= LEN; u += 4) ground.push(project([u, -hw, -13]));
  for (let u = LEN; u >= 0; u -= 4) ground.push(project([u, hw + 4, -13]));

  // התאמה למסגרת
  const all = [];
  for (let u = 0; u <= LEN; u += 2) all.push(S.pt(u, -hw - sleeve), S.pt(u, hw + sleeve, -PCB_T - 4));
  const xs = all.map(q => q[0]), ys = all.map(q => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  // מסגרת צמודה לסטריפ (לא ריבועית), כדי שימלא את רוחב הכרטיס
  const fit = 480 / (x1 - x0);
  const VH = Math.round((y1 - y0) * fit + 60);
  const tx = 250 - fit * (x0 + x1) / 2, ty = VH / 2 - 12 - fit * (y0 + y1) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 ${VH}" width="500" height="${VH}">
<defs>
  <radialGradient id="phosW" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#FFD978"/><stop offset="1" stop-color="#E9A53A"/></radialGradient>
  <radialGradient id="phosC" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#FFF4C4"/><stop offset="1" stop-color="#EFD27A"/></radialGradient>
  <linearGradient id="milk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF3DC"/><stop offset="0.5" stop-color="#F6E6B8"/><stop offset="1" stop-color="#EFD89A"/></linearGradient>
  <radialGradient id="cu" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#EDBE7A"/><stop offset="1" stop-color="#B2742C"/></radialGradient>
  <filter id="soft" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3.5"/></filter>
</defs>
<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(fit)})">
  <polygon points="${pts(ground)}" fill="#5E564A" fill-opacity="0.2" filter="url(#soft)"/>
  ${out.join('')}
</g>
</svg>`;
}

export function stripImageURI(p) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderStripSVG(p));
}

// ── שילוב בקטלוג (בשלב בדיקה) ───────────────────────────────────────────────
// ההדמיות מוצגות רק למי שנכנס עם ?renders=1 (נשמר ללשונית עד ?renders=0),
// כדי לבדוק אותן באתר החי בלי לשנות את מה שמבקרים רגילים רואים.
export const RENDERS_ON = (() => {
  try {
    const q = new URLSearchParams(window.location.search).get('renders');
    if (q === '1') sessionStorage.setItem('stripRenders', '1');
    if (q === '0') sessionStorage.removeItem('stripRenders');
    return sessionStorage.getItem('stripRenders') === '1';
  } catch { return false; }
})();

// נאון מקבל שרטוט חתך משלו (NeonSchematics) ונשאר עם צילום היצרן
const NEON_ID = /^(ledlink-neon|qlt-n\d|qlt-nt|qlt-spi-neon)/;
const cache = new Map();
export function stripRenderFor(p) {
  if (!RENDERS_ON || !p || p.category !== 'סטריפ LED') return null;
  if (NEON_ID.test(p.id) || p.subCategory === 'Neon' || /נאון|NEON/i.test(p.name || '')) return null;
  if (!cache.has(p.id)) cache.set(p.id, stripImageURI(p));
  return cache.get(p.id);
}
