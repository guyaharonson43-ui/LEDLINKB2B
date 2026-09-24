import { useState, cloneElement } from 'react';

// שרטוטי חתך לפי דפי הנתונים של QLT (datasheets/DS_*.pdf, עמוד "Dimensions").
// כל פרופיל מצויר ביחידות מ"מ ו-Section מוסיף מסגרת, קווי מידה וזוהר אור.

const INK = '#4A4A4A';
const C = {
  body: '#E4E2DC', bodyEdge: '#8E8B84',   // סיליקון לבן/אפור
  black: '#262626', blackEdge: '#111',    // סיליקון שחור (SPI, 3×8, 8×8)
  dif: '#FFF2C2', difEdge: '#D8B45A',     // מפזר אור
  pcb: '#D98A2B', led: '#FFD23F', ledEdge: '#B7790A',
  cavity: '#FAFAF7',
};
const SW = { vectorEffect: 'non-scaling-stroke' };

function ArrowH({ x1, x2, y, label, above }) {
  const ty = above ? y - 5 : y + 12;
  return (
    <g stroke={INK} fill={INK} strokeWidth="0.8">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <polygon points={`${x1},${y} ${x1 + 5},${y - 2.2} ${x1 + 5},${y + 2.2}`} stroke="none" />
      <polygon points={`${x2},${y} ${x2 - 5},${y - 2.2} ${x2 - 5},${y + 2.2}`} stroke="none" />
      <text x={(x1 + x2) / 2} y={ty} fontSize="9.5" fontFamily="Heebo, Arial, sans-serif" textAnchor="middle" stroke="none">{label}</text>
    </g>
  );
}

function ArrowV({ y1, y2, x, label }) {
  const my = (y1 + y2) / 2;
  return (
    <g stroke={INK} fill={INK} strokeWidth="0.8">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <polygon points={`${x},${y1} ${x - 2.2},${y1 + 5} ${x + 2.2},${y1 + 5}`} stroke="none" />
      <polygon points={`${x},${y2} ${x - 2.2},${y2 - 5} ${x + 2.2},${y2 - 5}`} stroke="none" />
      <text x={x + 5} y={my} fontSize="9.5" fontFamily="Heebo, Arial, sans-serif" textAnchor="middle" stroke="none"
        transform={`rotate(90,${x + 5},${my})`} dy="-1">{label}</text>
    </g>
  );
}

// w,h — מידות המעטפת במ"מ. dims — אילו קווי מידה לצייר ובאיזה טווח.
// glow — כיוון יציאת האור: 'top' | 'ring' | 'bevel'
function Section({ id, w, h, dims, glow = 'top', size, children }) {
  const S = 88 / Math.max(w, h);          // קנה מידה: הצלע הארוכה = 88px
  const pl = 16, pt = dims.top ? 40 : 30, pr = 30, pb = 26;
  const W = w * S, H = h * S;
  const vw = pl + W + pr, vh = pt + H + pb;
  const X = mm => pl + mm * S, Y = mm => pt + mm * S;
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} height={size} width={size * vw / vh} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`${id}-up`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFD54F" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFD54F" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-ring`}>
          <stop offset="0.6" stopColor="#FFD54F" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFD54F" stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow === 'top' && (
        <polygon fill={`url(#${id}-up)`}
          points={`${X(glowSpan(dims).a)},${pt} ${X(glowSpan(dims).b)},${pt} ${X(glowSpan(dims).b) + 10},${pt - 22} ${X(glowSpan(dims).a) - 10},${pt - 22}`} />
      )}
      {glow === 'ring' && <circle cx={X(w / 2)} cy={Y(h / 2)} r={W / 2 + 14} fill={`url(#${id}-ring)`} />}
      {glow === 'bevel' && (
        <polygon fill={`url(#${id}-up)`} transform={`rotate(-55,${X(w * 0.28)},${Y(h * 0.33)})`}
          points={`${X(w * 0.28) - 26},${Y(h * 0.33)} ${X(w * 0.28) + 26},${Y(h * 0.33)} ${X(w * 0.28) + 34},${Y(h * 0.33) - 22} ${X(w * 0.28) - 34},${Y(h * 0.33) - 22}`} />
      )}
      <g transform={`translate(${pl},${pt}) scale(${S})`} strokeLinejoin="round">{children}</g>
      {dims.top && <ArrowH x1={X(dims.top[0])} x2={X(dims.top[1])} y={pt - 8} label={dims.top[2]} above />}
      {dims.bottom && <ArrowH x1={X(dims.bottom[0])} x2={X(dims.bottom[1])} y={pt + H + 9} label={dims.bottom[2]} />}
      {dims.right && <ArrowV y1={Y(dims.right[0])} y2={Y(dims.right[1])} x={pl + W + 10} label={dims.right[2]} />}
    </svg>
  );
}
const glowSpan = dims => ({ a: dims.glowFrom ?? 0, b: dims.glowTo ?? dims.bottom?.[1] ?? 0 });

// אלמנטים חוזרים (ביחידות מ"מ)
const Led = ({ x, y, w, h }) => <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.15} fill={C.led} stroke={C.ledEdge} strokeWidth="0.6" {...SW} />;
const Pcb = ({ x, y, w, h }) => <rect x={x} y={y} width={w} height={h} fill={C.pcb} />;

const NEON_PROFILES = {
  // N2412B0RG / B1RG — 9.4×10, מפזר ממלא את הגוף, הסטריפ בתעלה בתחתית
  'b-9x10': {
    label: 'חתך רוחב — 9.4×10mm',
    svg: (
      <Section id="nb" w={9.4} h={10} dims={{ bottom: [0, 9.4, '9.4 mm'], right: [0, 10, '10 mm'] }}>
        <path d="M0.3,0 H9.1 Q9.4,0 9.4,0.3 V10 H0 V0.3 Q0,0 0.3,0 Z" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <rect x="0.35" y="0.35" width="8.7" height="7.9" rx="0.2" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <path d="M0.6,8.25 H8.8 V9.4 H0.6 Z" fill={C.cavity} stroke={C.bodyEdge} strokeWidth="0.5" {...SW} />
        <Pcb x={0.9} y={8.6} w={7.6} h={0.45} />
        <Led x={3.1} y={7.7} w={3.2} h={0.9} />
      </Section>
    ),
  },
  // N2414H0RG / H1 / H1RG / N2416H — 10×10, אור מלמעלה, לד במרכז התחתית
  'h-10x10': {
    label: 'חתך רוחב — 10×10mm',
    svg: (
      <Section id="nh" w={10} h={10} dims={{ bottom: [0, 10, '10 mm'], right: [0, 10, '10 mm'] }}>
        <path d="M0.8,0 H9.2 Q10,0 10,0.8 V10 H0 V0.8 Q0,0 0.8,0 Z" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <path d="M0.6,0.5 Q0.6,0.4 1,0.4 H9 Q9.4,0.4 9.4,0.5 V6.4 Q9.4,6.9 8.9,6.9 H6.2 V7.6 H3.8 V6.9 H1.1 Q0.6,6.9 0.6,6.4 Z"
          fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <rect x="3.4" y="7.6" width="3.2" height="1.4" fill={C.cavity} stroke={C.bodyEdge} strokeWidth="0.5" {...SW} />
        <Pcb x={3.4} y={8.1} w={3.2} h={0.4} />
        <Led x={4.1} y={7.4} w={1.8} h={0.7} />
        <circle cx="1.8" cy="8.4" r="0.45" fill={C.cavity} stroke={C.bodyEdge} strokeWidth="0.5" {...SW} />
        <circle cx="8.2" cy="8.4" r="0.45" fill={C.cavity} stroke={C.bodyEdge} strokeWidth="0.5" {...SW} />
      </Section>
    ),
  },
  // N2412F — 8×16, סטריפ אנכי על דופן, חריצי תפיסה בצדדים
  'f-8x16': {
    label: 'חתך רוחב — 8×16mm',
    svg: (
      <Section id="nf" w={8} h={16} dims={{ bottom: [0, 8, '8 mm'], right: [0, 16, '16 mm'] }}>
        <path d="M1,0 H7 L8,1 V7 Q7.3,7.6 8,8.2 V16 H0 V8.2 Q0.7,7.6 0,7 V1 Z" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <path d="M1.1,0.4 H6.9 L7.6,1.1 V6.2 H5.4 V15.2 H3.4 V6.2 H0.4 V1.1 Z" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <Pcb x={2.8} y={8.4} w={0.5} h={6.6} />
        <Led x={3.3} y={10.2} w={0.8} h={2.8} />
      </Section>
    ),
  },
  // N2412L — 6×12, סטריפ אנכי על דופן, חריצים בחלק העליון
  'l-6x12': {
    label: 'חתך רוחב — 6×12mm',
    svg: (
      <Section id="nl" w={6} h={12} dims={{ bottom: [0, 6, '6 mm'], right: [0, 12, '12 mm'] }}>
        <path d="M0.5,0 H5.5 Q6,0 6,0.5 V1.3 Q5.5,1.8 6,2.3 V12 H0 V2.3 Q0.5,1.8 0,1.3 V0.5 Q0,0 0.5,0 Z" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <path d="M0.6,0.35 H5.4 V1.2 L4.6,2.4 V11.3 H2.3 V2.4 L0.6,1.2 Z" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <Pcb x={1.8} y={3} w={0.45} h={8.3} />
        <Led x={2.25} y={5} w={0.7} h={2.8} />
      </Section>
    ),
  },
  // N3X8 MINI — 3×8, גוף שחור, מפזר בצורת V, סטריפ על הדופן הימנית
  'mini-3x8': {
    label: 'חתך רוחב — 3×8mm',
    svg: (
      <Section id="nm" w={3} h={8} dims={{ bottom: [0, 3, '3 mm'], right: [0, 8, '8 mm'] }}>
        <path d="M0,0 H3 V4.3 H2.6 V5.4 H3 V8 H0 Z" fill={C.black} stroke={C.blackEdge} strokeWidth="1" {...SW} />
        <path d="M0,0 H3 L2.1,2.4 V7.2 H0.75 V2.4 Z" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <Pcb x={2.1} y={3.1} w={0.3} h={4.2} />
        <Led x={1.45} y={3.6} w={0.65} h={2.2} />
      </Section>
    ),
  },
  // N8X8 NEON 3D — 8×8, גוף שחור, מפזר מתרחב כלפי מעלה, לד בתחתית
  '8x8': {
    label: 'חתך רוחב — 8×8mm',
    svg: (
      <Section id="n8" w={8} h={8} dims={{ bottom: [0, 8, '8 mm'], right: [0, 8, '8 mm'] }}>
        <path d="M0,0 H8 V2.2 Q7.5,2.7 8,3.2 V8 H5 V6.9 H3 V8 H0 V3.2 Q0.5,2.7 0,2.2 Z" fill={C.black} stroke={C.blackEdge} strokeWidth="1" {...SW} />
        <path d="M0,0 H8 L6.9,2 V5.5 Q6.9,6.2 6.2,6.2 H1.8 Q1.1,6.2 1.1,5.5 V2 Z" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <rect x="3" y="6.2" width="2" height="1.8" fill="#BDBAB2" />
        <Pcb x={2.4} y={5.55} w={3.2} h={0.4} />
        <Led x={3} y={5.05} w={2} h={0.5} />
      </Section>
    ),
  },
  // N4X10 — 4×10, סטריפ על הדופן, האור יוצא דרך הפס העליון
  '4x10': {
    label: 'חתך רוחב — 4×10mm',
    svg: (
      <Section id="n4" w={4} h={10} dims={{ bottom: [0, 4, '4 mm'], right: [0, 10, '10 mm'] }}>
        <rect x="0" y="0" width="4" height="10" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <path d="M0,0 H4 V1.25 H3 L2.75,2.25 H2.1 V1.5 H1 L0.4,0.75 H0 Z" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <rect x="1.25" y="2" width="0.85" height="7" fill={C.cavity} stroke={C.bodyEdge} strokeWidth="0.5" {...SW} />
        <rect x="0.2" y="3.75" width="0.9" height="3.25" fill={C.dif} stroke={C.difEdge} strokeWidth="0.5" {...SW} />
        <Led x={0.38} y={4.75} w={0.55} h={1.25} />
      </Section>
    ),
  },
  // N4X10T — פרופיל T: כנף 6 מ"מ, גוף 4 מ"מ, גובה 10 מ"מ, לד על דופן הצד
  't-4x10': {
    label: 'חתך רוחב — T 6/4×10mm',
    svg: (
      <Section id="nt" w={6} h={10} dims={{ top: [0, 6, '6 mm'], bottom: [1, 5, '4 mm'], right: [0, 10, '10 mm'], glowTo: 6 }}>
        <path d="M0,1.25 V0.4 Q0,0 0.4,0 H5.6 Q6,0 6,0.4 V1.25 L5,2.25 V10 H1 V2.25 Z" fill={C.dif} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <line x1="1" y1="2.25" x2="5" y2="2.25" stroke={C.difEdge} strokeWidth="0.5" strokeDasharray="2 2" {...SW} />
        <Pcb x={4.35} y={3.2} w={0.35} h={5.8} />
        <Led x={3.8} y={5} w={0.55} h={1.8} />
      </Section>
    ),
  },
  // SPI NEON (SPIN12 / SPIN12RW3) — 12×20, גוף שחור, סטריפ על הדופן השמאלית
  'spi-12x20': {
    label: 'חתך רוחב — 12×20mm',
    svg: (
      <Section id="ns" w={12} h={20} dims={{ bottom: [0, 12, '12 mm'], right: [0, 20, '20 mm'] }}>
        <path d="M0,0 H12 V20 H0 V13 H1.2 V11.2 H0 Z" fill={C.black} stroke={C.blackEdge} strokeWidth="1" {...SW} />
        <path d="M0,0 H12 L10.6,3.6 V17.6 H1.9 V3.6 Z" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <rect x="3.8" y="1.2" width="4.2" height="1.8" rx="0.3" fill={C.cavity} stroke={C.bodyEdge} strokeWidth="0.6" {...SW} />
        <rect x="2.5" y="7.5" width="4.5" height="10.1" fill={C.cavity} stroke={C.difEdge} strokeWidth="0.5" {...SW} />
        <Pcb x={1.9} y={6.8} w={0.55} h={10.8} />
        <Led x={2.45} y={10.6} w={1} h={2.8} />
      </Section>
    ),
  },
  // NT1811 — צינור 360° Ø18
  'tube-18': {
    label: 'חתך רוחב — 360° Ø18mm',
    svg: (
      <Section id="t18" w={18} h={18} glow="ring" dims={{ top: [0, 18, 'Ø 18 mm'] }}>
        <circle cx="9" cy="9" r="9" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <circle cx="9" cy="9" r="6" fill={C.led} opacity="0.85" />
        <circle cx="9" cy="9" r="6" fill="none" stroke={C.ledEdge} strokeWidth="0.6" strokeDasharray="1.5 1.5" {...SW} />
        <path d="M7.6,5.2 H10.4 V7.4 H11.4 V10.6 H10.4 V12.8 H7.6 V10.6 H6.6 V7.4 H7.6 Z" fill={C.cavity} stroke={C.bodyEdge} strokeWidth="0.6" {...SW} />
      </Section>
    ),
  },
  // NT2314 — צינור 360° Ø23
  'tube-23': {
    label: 'חתך רוחב — 360° Ø23mm',
    svg: (
      <Section id="t23" w={23} h={23} glow="ring" dims={{ top: [0, 23, 'Ø 23 mm'] }}>
        <circle cx="11.5" cy="11.5" r="11.5" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <ellipse cx="11.5" cy="11.5" rx="6.6" ry="8" fill={C.led} opacity="0.85" />
        <ellipse cx="11.5" cy="11.5" rx="6.6" ry="8" fill="none" stroke={C.ledEdge} strokeWidth="0.6" strokeDasharray="1.5 1.5" {...SW} />
        <path d="M10,6 H13 V8.6 H14.2 V14.4 H13 V17 H10 V14.4 H8.8 V8.6 H10 Z" fill={C.cavity} stroke={C.bodyEdge} strokeWidth="0.6" {...SW} />
      </Section>
    ),
  },
  // NTR2416 — משולש: עובי 5.6, רוחב 15, פאה מוארת ב-35°. האור יוצא בניצב לפאה
  'triangle': {
    label: 'חתך רוחב — TRIANGLE 15×5.6mm',
    svg: (
      <Section id="ntr" w={16.1} h={15} glow="none" dims={{ top: [10.5, 16.1, '5.6 mm'], right: [0, 15, '15 mm'] }}>
        <defs>
          <linearGradient id="ntr-face" gradientUnits="userSpaceOnUse" x1="7" y1="5" x2="3.7" y2="2.7">
            <stop offset="0" stopColor="#FFD54F" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFD54F" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="10.5,0 3.5,10 0.2,7.7 7.2,-2.3" fill="url(#ntr-face)" />
        <path d="M10.5,0 H16.1 V15 L3.5,10 Z" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <path d="M10.5,0 L3.5,10 L4.8,10.5 L11.4,1.1 Z" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <path d="M11.7,2.4 L6.1,10.4 L6.7,10.65 L12.2,2.8 Z" fill={C.pcb} />
        <path d="M10.9,3.9 L8.1,7.9 L8.8,8.4 L11.6,4.4 Z" fill={C.led} stroke={C.ledEdge} strokeWidth="0.5" {...SW} />
        <path d="M3.5,10 V13" stroke={INK} strokeWidth="0.6" strokeDasharray="1.5 1.5" {...SW} />
        <text x="1.2" y="12.6" fontSize="1.5" fill={INK} fontFamily="Heebo, Arial, sans-serif">35°</text>
      </Section>
    ),
  },
  // נאון LEDLINK TOP — 10×10, אור מלמעלה
  'h-top': {
    label: 'חתך רוחב — TOP 10×10mm',
    svg: (
      <Section id="lt" w={10} h={10} dims={{ bottom: [0, 10, '10 mm'], right: [0, 10, '10 mm'] }}>
        <rect x="0" y="0" width="10" height="10" rx="0.8" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <rect x="0.6" y="0.4" width="8.8" height="6.6" rx="0.5" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <Pcb x={2.2} y={7.9} w={5.6} h={0.45} />
        <Led x={3.6} y={7.2} w={2.8} h={0.7} />
      </Section>
    ),
  },
  // נאון LEDLINK SIDE — 12×7
  'l-side': {
    label: 'חתך רוחב — SIDE 12×7mm',
    svg: (
      <Section id="ls" w={12} h={7} dims={{ bottom: [0, 12, '12 mm'], right: [0, 7, '7 mm'] }}>
        <rect x="0" y="0" width="12" height="7" rx="0.7" fill={C.body} stroke={C.bodyEdge} strokeWidth="1" {...SW} />
        <rect x="0.5" y="0.4" width="11" height="3.8" rx="0.4" fill={C.dif} stroke={C.difEdge} strokeWidth="0.6" {...SW} />
        <Pcb x={2.5} y={5.1} w={7} h={0.45} />
        <Led x={4.6} y={4.4} w={2.8} h={0.7} />
      </Section>
    ),
  },
};

const NEON_ID_MAP = {
  'ledlink-neon-top':     'h-top',
  'ledlink-neon-side':    'l-side',
  'ledlink-neon-rgb':     'h-top',
  'qlt-n2412b0rg':        'b-9x10',
  'qlt-n2412b1rg':        'b-9x10',
  'qlt-n2412f':           'f-8x16',
  'qlt-n2412l':           'l-6x12',
  'qlt-n2414h0rg':        'h-10x10',
  'qlt-n2414h1':          'h-10x10',
  'qlt-n2414h1rg':        'h-10x10',
  'qlt-n2416h':           'h-10x10',
  'qlt-n3x8-mini-neon':   'mini-3x8',
  'qlt-n4x10':            '4x10',
  'qlt-n4x10t':           't-4x10',
  'qlt-n3x8':             '8x8',
  'qlt-nt1811-360-strip-neon-led-tube': 'tube-18',
  'qlt-nt2314-360-strip-neon-led-tube': 'tube-23',
  'qlt-ntr2416-neon-triangle':          'triangle',
  'qlt-spi-neon-rgbw':    'spi-12x20',
  'qlt-spi-neon-wh':      'spi-12x20',
};

// Returns short dimension label for card badge, e.g. "3×8mm" or "Ø18mm"
export function getNeonDimLabel(productId) {
  const key = NEON_ID_MAP[productId];
  if (!key) return null;
  const profile = NEON_PROFILES[key];
  if (!profile) return null;
  // Extract the part after "— " from the label
  const match = profile.label.match(/—\s*(.+)$/);
  return match ? match[1] : null;
}

// "חתך רוחב — 8×16mm": בלי bdi הדפדפן הופך את המידה ל-"16mm×8"
function Label({ text }) {
  const [he, dim] = text.split(' — ');
  return <>{he} — <bdi dir="ltr">{dim}</bdi></>;
}

export default function NeonSchematic({ product }) {
  const [open, setOpen] = useState(false);
  const key = NEON_ID_MAP[product.id];
  if (!key) return null;
  const profile = NEON_PROFILES[key];
  if (!profile) return null;

  return (
    <>
      <div onClick={() => setOpen(true)} title="לחץ להגדלה"
        style={{ marginTop: 12, background: '#F8F8F6', border: '1px solid #E0DDD6', borderRadius: 8,
          padding: '10px 16px 6px', textAlign: 'center', cursor: 'zoom-in' }}>
        <div style={{ fontSize: 10, color: '#595959', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>חתך רוחב</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'ltr' }}>
          {cloneElement(profile.svg, { size: 130 })}
        </div>
        <div style={{ fontSize: 10, color: '#888888', marginTop: 4 }}><Label text={profile.label} /></div>
      </div>

      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: '36px 40px 28px',
              position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', textAlign: 'center', maxWidth: '90vw' }}>
            <button onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: 12, left: 16, background: 'none', border: 'none',
                cursor: 'pointer', color: '#999', fontSize: 22, lineHeight: 1, padding: 4 }}>✕</button>
            <div style={{ fontSize: 11, color: '#595959', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>חתך רוחב</div>
            <div style={{ display: 'flex', justifyContent: 'center', direction: 'ltr' }}>
              {cloneElement(profile.svg, { size: 300 })}
            </div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 8, fontWeight: 600 }}><Label text={profile.label} /></div>
          </div>
        </div>
      )}
    </>
  );
}
