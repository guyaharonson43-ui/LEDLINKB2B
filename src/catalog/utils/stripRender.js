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
  // סטריפ זיגזג (3D) הוא היחיד שמתכופף הצידה, במישור שלו
  const zigzag = /\b3D\b|זיגזג/i.test(name + desc);
  return { kind, ip, watts, density, rows, widthMm, zigzag };
}

// ── ציור ────────────────────────────────────────────────────────────────────
// הסטריפ הוא סרט במרחב: קו מרכז c(u) לאורך u (מ"מ), וכיוון רוחב w(u).
// סטריפ רגיל מתכופף רק סביב ציר הרוחב — עולה ויורד (גל אנכי); זיגזג בלבד
// מתכופף הצידה במישור שלו. כל פרט (לד, פד, קו חיתוך) מצויר כמצולע שממופה
// על פני הסרט, ואז הכול מוקרן בזווית מבט קבועה.
const f = n => Math.round(n * 100) / 100;
const LEN = 130;                     // אורך הקטע במ"מ
const YAW = -0.5, PITCH = 0.62;      // זווית המבט (רדיאנים)

function geometry(spec) {
  const A = spec.zigzag ? 11 : 9;    // משרעת הגל במ"מ
  const k = 2 * Math.PI / LEN;
  if (spec.zigzag) {
    // כיפוף במישור: c = (u, A·sin, 0), רוחב בניצב במישור
    return u => {
      const g = A * Math.sin(k * u), dg = A * k * Math.cos(k * u), n = Math.hypot(1, dg);
      return { c: [u, g, 0], w: [-dg / n, 1 / n, 0], t: [1 / n, dg / n, 0] };
    };
  }
  // גל אנכי: c = (u, 0, A·sin), הרוחב תמיד אופקי
  return u => {
    const h = A * Math.sin(k * u), dh = A * k * Math.cos(k * u), n = Math.hypot(1, dh);
    return { c: [u, 0, h], w: [0, 1, 0], t: [1 / n, 0, dh / n] };
  };
}

const ca = Math.cos(YAW), sa = Math.sin(YAW), cb = Math.cos(PITCH), sb = Math.sin(PITCH);
function project([x, y, z]) {
  const x1 = x * ca - y * sa, y1 = x * sa + y * ca;
  return [x1, -z * cb + y1 * sb];
}

function makeSurface(spec) {
  const geo = geometry(spec);
  // נקודה על פני הסרט: u לאורך, v לרוחב (מ"מ מהמרכז), dz גובה מעל הפנים
  const pt = (u, v, dz = 0) => {
    const g = geo(u);
    const nrm = cross(g.t, g.w);
    return project([g.c[0] + g.w[0] * v + nrm[0] * dz, g.c[1] + g.w[1] * v + nrm[1] * dz, g.c[2] + g.w[2] * v + nrm[2] * dz]);
  };
  // מלבן על פני הסרט → מצולע מוקרן
  const quad = (u0, u1, v0, v1, dz = 0) => {
    const P = [];
    const n = Math.max(1, Math.ceil((u1 - u0) / 2));
    for (let i = 0; i <= n; i++) P.push(pt(u0 + (u1 - u0) * i / n, v0, dz));
    for (let i = n; i >= 0; i--) P.push(pt(u0 + (u1 - u0) * i / n, v1, dz));
    return P.map(p => `${f(p[0])},${f(p[1])}`).join(' ');
  };
  // תאורה: אור מלמעלה-קדימה; הפנים מוארות לפי הנורמל
  const light = norm([0.25, 0.35, 1]);
  const shade = u => { const g = geo(u); return Math.max(0, dot(cross(g.t, g.w), light)); };
  return { pt, quad, shade, geo };
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const mix = (c1, c2, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(c1.slice(1 + i, 3 + i), 16) * (1 - t) + parseInt(c2.slice(1 + i, 3 + i), 16) * t).toString(16).padStart(2, '0')).join('');

function ledPackage(q, u, v, kind) {
  if (kind === 'rgb' || kind === 'rgbw') {
    const h = 2.5, dots = kind === 'rgbw' ? ['#E5484D', '#30A46C', '#3E63DD', '#F3DFA2'] : ['#E5484D', '#30A46C', '#3E63DD'];
    const step = 2 * h / (dots.length + 1);
    return `<polygon points="${q(u - h, u + h, v - h, v + h, 0.3)}" fill="url(#pkg)" stroke="#CFCBC2" stroke-width="0.25"/>`
      + `<polygon points="${q(u - 1.9, u + 1.9, v - 1.9, v + 1.9, 0.35)}" fill="#F6F3EC"/>`
      + dots.map((c, i) => `<polygon points="${q(u - h + step * (i + 1) - 0.4, u - h + step * (i + 1) + 0.4, v - 0.4, v + 0.4, 0.4)}" fill="${c}"/>`).join('');
  }
  // 2835: 3.5 לאורך × 2.8 לרוחב
  return `<polygon points="${q(u - 1.75, u + 1.75, v - 1.4, v + 1.4, 0.3)}" fill="url(#pkg)" stroke="#CFCBC2" stroke-width="0.25"/>`
    + `<polygon points="${q(u - 1.3, u + 1.3, v - 1, v + 1, 0.35)}" fill="url(#phos)"/>`;
}

export function renderStripSVG(p) {
  const spec = stripSpec(p);
  const { quad: q, pt, shade } = makeSurface(spec);
  const W = spec.widthMm, hw = W / 2;
  const sleeve = spec.ip >= 67 ? 2.2 : 0;
  const T = 0.9 + sleeve * 1.2;                         // עובי הקצה הנראה
  const STEP = 1.5;
  const out = [];

  // קצה קדמי (עובי) — הדופן בצד הקרוב לצופה
  for (let u = 0; u < LEN; u += STEP) {
    const e = u + STEP + 0.3, a = pt(u, hw + sleeve), b = pt(e, hw + sleeve), c = pt(e, hw + sleeve, -T), d = pt(u, hw + sleeve, -T);
    out.push(`<polygon points="${[a, b, c, d].map(p => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="${mix('#B9B2A4', '#8F887B', 0.4 - shade(u) * 0.4)}"/>`);
  }
  // שרוול סיליקון (IP67/68)
  if (sleeve) for (let u = 0; u < LEN; u += STEP) out.push(`<polygon points="${q(u, u + STEP + 0.2, -hw - sleeve, hw + sleeve, 0.05)}" fill="${mix('#EEF2F3', '#C9D2D5', 1 - shade(u))}"/>`);
  // PCB עם הצללה לפי הזווית
  for (let u = 0; u < LEN; u += STEP) out.push(`<polygon points="${q(u, u + STEP + 0.2, -hw, hw, 0.1)}" fill="${mix('#FBFAF6', '#CFCAC0', 1 - shade(u))}"/>`);
  // מסילות נחושת
  ;[-(hw - 1), hw - 1.35].forEach(v => out.push(`<polygon points="${q(0, LEN, v, v + 0.35, 0.15)}" fill="#E4D5BA"/>`));

  if (spec.kind === 'cob') {
    out.push(`<polygon points="${q(0, LEN, -W * 0.22, W * 0.22, 0.4)}" fill="url(#phosLin)"/>`);
    out.push(`<polygon points="${q(0, LEN, -W * 0.08, W * 0.02, 0.45)}" fill="#FFF1C2" fill-opacity="0.6"/>`);
  } else {
    const pitch = 1000 / spec.density * (spec.rows === 2 ? 2 : 1);
    const vs = spec.rows === 2 ? [-W * 0.18, W * 0.18] : [0];
    const group = spec.kind === 'smd' ? Math.max(3, Math.round(spec.density / 40)) : 3;
    let i = 0;
    for (let u = pitch / 2; u < LEN - 2; u += pitch, i++) {
      vs.forEach((v, r) => out.push(ledPackage(q, u + (r ? pitch / 2 : 0), v, spec.kind)));
      if (spec.kind === 'smd' && i % group === group - 1) {
        const v = spec.rows === 2 ? 0 : W * 0.3, uu = u + pitch / 2;
        out.push(`<polygon points="${q(uu - 0.8, uu + 0.8, v - 0.5, v + 0.5, 0.3)}" fill="#2B2B2B"/>`);
      }
    }
  }
  // נקודות חיתוך
  const cutMm = spec.kind === 'cob' ? 50 : spec.kind === 'smd' ? Math.max(25, 3000 / spec.density) : 100 / 3;
  for (let u = cutMm; u < LEN - 4; u += cutMm) {
    out.push(`<polygon points="${q(u - 0.12, u + 0.12, -hw, hw, 0.2)}" fill="#9A9489"/>`);
    [-W * 0.3, W * 0.3].forEach(v => out.push(
      `<polygon points="${q(u - 1.7, u - 0.4, v - 0.95, v + 0.95, 0.25)}" fill="url(#cu)"/>`,
      `<polygon points="${q(u + 0.4, u + 1.7, v - 0.95, v + 0.95, 0.25)}" fill="url(#cu)"/>`));
  }
  // ציפוי IP65 והברקה
  if (spec.ip >= 65 && spec.ip < 67) out.push(`<polygon points="${q(0, LEN, -hw, hw, 0.6)}" fill="#D7E7EE" fill-opacity="0.25"/>`);
  if (spec.ip >= 65) out.push(`<polygon points="${q(0, LEN, -hw * 0.75 - sleeve, -hw * 0.45 - sleeve, 0.8)}" fill="#FFFFFF" fill-opacity="0.5"/>`);

  // צל על המשטח מתחת לסרט
  const ground = [];
  for (let u = 0; u <= LEN; u += 4) ground.push(project([u, -hw, -14]));
  for (let u = LEN; u >= 0; u -= 4) ground.push(project([u, hw + 4, -14]));

  // התאמה למסגרת לפי תיבת הגבול של כל הנקודות
  const all = [];
  for (let u = 0; u <= LEN; u += 2) all.push(pt(u, -hw - sleeve), pt(u, hw + sleeve, -T));
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const fit = Math.min(430 / (x1 - x0), 330 / (y1 - y0));
  const tx = 250 - fit * (x0 + x1) / 2, ty = 240 - fit * (y0 + y1) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
<defs>
  <linearGradient id="pkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4E0D6"/></linearGradient>
  <radialGradient id="phos" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#FFE489"/><stop offset="1" stop-color="#E7B53A"/></radialGradient>
  <linearGradient id="phosLin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6CD55"/><stop offset="1" stop-color="#EDBA3F"/></linearGradient>
  <linearGradient id="cu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9B36A"/><stop offset="1" stop-color="#B7792E"/></linearGradient>
  <filter id="soft" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="${f(3.5)}"/></filter>
</defs>
<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(fit)})">
  <polygon points="${ground.map(p => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="#5E564A" fill-opacity="0.22" filter="url(#soft)"/>
  ${out.join('')}
</g>
</svg>`;
}

export function stripImageURI(p) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderStripSVG(p));
}
