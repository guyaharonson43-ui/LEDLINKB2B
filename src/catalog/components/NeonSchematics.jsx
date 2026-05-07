import { useState } from 'react';

const NEON_PROFILES = {
  'h-top': {
    label: 'חתך רוחב — TOP 10×10mm',
    svg: (
      <svg viewBox="0 0 110 125" width="110" height="125" style={{ display: 'block' }}>
        {[28, 50, 72].map(x => (
          <g key={x}>
            <line x1={x} y1="10" x2={x} y2="2" stroke="#E8A020" strokeWidth="1.5" />
            <polygon points={`${x - 3},6 ${x},1 ${x + 3},6`} fill="#E8A020" />
          </g>
        ))}
        <rect x="10" y="12" width="80" height="80" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" rx="2" />
        <rect x="14" y="15" width="72" height="10" fill="#FFFDE7" stroke="#E8A020" strokeWidth="0.6" rx="1" />
        {[24, 40, 56, 72].map(x => <circle key={x} cx={x} cy={20} r="2.5" fill="#FFD54F" />)}
        <line x1="10" y1="103" x2="90" y2="103" stroke="#555" strokeWidth="0.7" />
        <line x1="10" y1="100" x2="10" y2="106" stroke="#555" strokeWidth="0.7" />
        <line x1="90" y1="100" x2="90" y2="106" stroke="#555" strokeWidth="0.7" />
        <text x="50" y="115" fontSize="10" fill="#444" textAnchor="middle">10 mm</text>
        <line x1="97" y1="12" x2="97" y2="92" stroke="#555" strokeWidth="0.7" />
        <line x1="94" y1="12" x2="100" y2="12" stroke="#555" strokeWidth="0.7" />
        <line x1="94" y1="92" x2="100" y2="92" stroke="#555" strokeWidth="0.7" />
        <text x="105" y="55" fontSize="10" fill="#444" textAnchor="middle" transform="rotate(90,105,55)">10 mm</text>
      </svg>
    ),
  },
  'l-side': {
    label: 'חתך רוחב — SIDE 12×7mm',
    svg: (
      <svg viewBox="0 0 120 115" width="120" height="115" style={{ display: 'block' }}>
        {[30, 55, 80].map(x => (
          <g key={x}>
            <line x1={x} y1="8" x2={x} y2="2" stroke="#E8A020" strokeWidth="1.5" />
            <polygon points={`${x - 3},6 ${x},1 ${x + 3},6`} fill="#E8A020" />
          </g>
        ))}
        <rect x="10" y="12" width="90" height="55" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" rx="2" />
        <rect x="14" y="15" width="82" height="10" fill="#FFFDE7" stroke="#E8A020" strokeWidth="0.6" rx="1" />
        {[22, 40, 58, 76, 92].map(x => <circle key={x} cx={x} cy={20} r="2.5" fill="#FFD54F" />)}
        <line x1="10" y1="78" x2="100" y2="78" stroke="#555" strokeWidth="0.7" />
        <line x1="10" y1="75" x2="10" y2="81" stroke="#555" strokeWidth="0.7" />
        <line x1="100" y1="75" x2="100" y2="81" stroke="#555" strokeWidth="0.7" />
        <text x="55" y="91" fontSize="10" fill="#444" textAnchor="middle">12 mm</text>
        <line x1="107" y1="12" x2="107" y2="67" stroke="#555" strokeWidth="0.7" />
        <line x1="104" y1="12" x2="110" y2="12" stroke="#555" strokeWidth="0.7" />
        <line x1="104" y1="67" x2="110" y2="67" stroke="#555" strokeWidth="0.7" />
        <text x="115" y="43" fontSize="10" fill="#444" textAnchor="middle" transform="rotate(90,115,43)">7 mm</text>
      </svg>
    ),
  },
  'f-front': {
    label: 'חתך רוחב — FRONT 12×6mm',
    svg: (
      <svg viewBox="0 0 120 110" width="120" height="110" style={{ display: 'block' }}>
        {[30, 55, 80].map(x => (
          <g key={x}>
            <line x1={x} y1="92" x2={x} y2="100" stroke="#E8A020" strokeWidth="1.5" />
            <polygon points={`${x - 3},96 ${x},101 ${x + 3},96`} fill="#E8A020" />
          </g>
        ))}
        <rect x="10" y="18" width="90" height="50" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" rx="2" />
        <rect x="14" y="56" width="82" height="10" fill="#FFFDE7" stroke="#E8A020" strokeWidth="0.6" rx="1" />
        {[24, 44, 64, 82].map(x => <circle key={x} cx={x} cy={61} r="2.5" fill="#FFD54F" />)}
        <line x1="10" y1="10" x2="100" y2="10" stroke="#555" strokeWidth="0.7" />
        <line x1="10" y1="7" x2="10" y2="13" stroke="#555" strokeWidth="0.7" />
        <line x1="100" y1="7" x2="100" y2="13" stroke="#555" strokeWidth="0.7" />
        <text x="55" y="6" fontSize="10" fill="#444" textAnchor="middle">12 mm</text>
        <line x1="107" y1="18" x2="107" y2="68" stroke="#555" strokeWidth="0.7" />
        <line x1="104" y1="18" x2="110" y2="18" stroke="#555" strokeWidth="0.7" />
        <line x1="104" y1="68" x2="110" y2="68" stroke="#555" strokeWidth="0.7" />
        <text x="115" y="48" fontSize="10" fill="#444" textAnchor="middle" transform="rotate(90,115,48)">6 mm</text>
      </svg>
    ),
  },
  'tube-18': {
    label: 'חתך רוחב — 360° Ø18mm',
    svg: (
      <svg viewBox="0 0 110 120" width="110" height="120" style={{ display: 'block' }}>
        <defs>
          <marker id="arr" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <polygon points="0 0, 4 2, 0 4" fill="#E8A020" />
          </marker>
        </defs>
        {[[50,6,270],[50,94,90],[6,50,180],[94,50,0],[20,20,315],[80,20,45]].map(([x,y,a],i) => {
          const rad = a * Math.PI / 180, ex = x + Math.cos(rad) * 6, ey = y + Math.sin(rad) * 6;
          return <line key={i} x1={x} y1={y} x2={ex} y2={ey} stroke="#E8A020" strokeWidth="1.5" markerEnd="url(#arr)" />;
        })}
        <circle cx="50" cy="50" r="38" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" />
        <circle cx="50" cy="50" r="28" fill="#E8E8E8" stroke="#999" strokeWidth="0.8" />
        {[0,60,120,180,240,300].map((deg, i) => {
          const r = 22, rad = deg * Math.PI / 180;
          return <circle key={i} cx={50 + r * Math.cos(rad)} cy={50 + r * Math.sin(rad)} r="3" fill="#FFD54F" />;
        })}
        <line x1="12" y1="50" x2="88" y2="50" stroke="#555" strokeWidth="0.7" strokeDasharray="3,2" />
        <text x="50" y="108" fontSize="10" fill="#444" textAnchor="middle">Ø 18 mm</text>
      </svg>
    ),
  },
  'tube-23': {
    label: 'חתך רוחב — 360° Ø23mm',
    svg: (
      <svg viewBox="0 0 120 125" width="120" height="125" style={{ display: 'block' }}>
        <defs>
          <marker id="arr2" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <polygon points="0 0, 4 2, 0 4" fill="#E8A020" />
          </marker>
        </defs>
        <circle cx="55" cy="55" r="42" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" />
        <circle cx="55" cy="55" r="31" fill="#E8E8E8" stroke="#999" strokeWidth="0.8" />
        {[0,60,120,180,240,300].map((deg, i) => {
          const r = 25, rad = deg * Math.PI / 180;
          return <circle key={i} cx={55 + r * Math.cos(rad)} cy={55 + r * Math.sin(rad)} r="3.5" fill="#FFD54F" />;
        })}
        <line x1="13" y1="55" x2="97" y2="55" stroke="#555" strokeWidth="0.7" strokeDasharray="3,2" />
        <text x="55" y="113" fontSize="10" fill="#444" textAnchor="middle">Ø 23 mm</text>
      </svg>
    ),
  },
  'triangle': {
    label: 'חתך רוחב — TRIANGLE 24×16mm',
    svg: (
      <svg viewBox="0 0 120 115" width="120" height="115" style={{ display: 'block' }}>
        {[40, 60, 80].map(x => (
          <g key={x}>
            <line x1={x} y1="8" x2={x} y2="2" stroke="#E8A020" strokeWidth="1.5" />
            <polygon points={`${x - 3},6 ${x},1 ${x + 3},6`} fill="#E8A020" />
          </g>
        ))}
        <polygon points="10,85 60,12 110,85" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" />
        <line x1="30" y1="60" x2="90" y2="60" stroke="#FFD54F" strokeWidth="4" strokeLinecap="round" />
        {[38, 55, 72].map(x => <circle key={x} cx={x} cy={60} r="2.5" fill="#FFD54F" />)}
        <line x1="10" y1="96" x2="110" y2="96" stroke="#555" strokeWidth="0.7" />
        <line x1="10" y1="93" x2="10" y2="99" stroke="#555" strokeWidth="0.7" />
        <line x1="110" y1="93" x2="110" y2="99" stroke="#555" strokeWidth="0.7" />
        <text x="60" y="109" fontSize="10" fill="#444" textAnchor="middle">24 mm</text>
      </svg>
    ),
  },
  'mini-3x8': {
    label: 'חתך רוחב — MINI 3×8mm',
    svg: (
      <svg viewBox="0 0 80 120" width="80" height="120" style={{ display: 'block' }}>
        {[30, 50].map(x => (
          <g key={x}>
            <line x1={x} y1="8" x2={x} y2="2" stroke="#E8A020" strokeWidth="1.5" />
            <polygon points={`${x - 3},6 ${x},1 ${x + 3},6`} fill="#E8A020" />
          </g>
        ))}
        <rect x="22" y="12" width="36" height="80" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" rx="2" />
        <rect x="26" y="15" width="28" height="8" fill="#FFFDE7" stroke="#E8A020" strokeWidth="0.6" rx="1" />
        {[32, 48].map(x => <circle key={x} cx={x} cy={19} r="2" fill="#FFD54F" />)}
        <line x1="22" y1="100" x2="58" y2="100" stroke="#555" strokeWidth="0.7" />
        <line x1="22" y1="97" x2="22" y2="103" stroke="#555" strokeWidth="0.7" />
        <line x1="58" y1="97" x2="58" y2="103" stroke="#555" strokeWidth="0.7" />
        <text x="40" y="112" fontSize="10" fill="#444" textAnchor="middle">3 mm</text>
        <line x1="65" y1="12" x2="65" y2="92" stroke="#555" strokeWidth="0.7" />
        <line x1="62" y1="12" x2="68" y2="12" stroke="#555" strokeWidth="0.7" />
        <line x1="62" y1="92" x2="68" y2="92" stroke="#555" strokeWidth="0.7" />
        <text x="72" y="56" fontSize="10" fill="#444" textAnchor="middle" transform="rotate(90,72,56)">8 mm</text>
      </svg>
    ),
  },
  '4x10': {
    label: 'חתך רוחב — 4×10mm',
    svg: (
      <svg viewBox="0 0 90 130" width="90" height="130" style={{ display: 'block' }}>
        {[30, 55].map(x => (
          <g key={x}>
            <line x1={x} y1="8" x2={x} y2="2" stroke="#E8A020" strokeWidth="1.5" />
            <polygon points={`${x - 3},6 ${x},1 ${x + 3},6`} fill="#E8A020" />
          </g>
        ))}
        <rect x="18" y="12" width="54" height="90" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" rx="2" />
        <rect x="22" y="15" width="46" height="10" fill="#FFFDE7" stroke="#E8A020" strokeWidth="0.6" rx="1" />
        {[30, 45, 60].map(x => <circle key={x} cx={x} cy={20} r="2.5" fill="#FFD54F" />)}
        <line x1="18" y1="110" x2="72" y2="110" stroke="#555" strokeWidth="0.7" />
        <line x1="18" y1="107" x2="18" y2="113" stroke="#555" strokeWidth="0.7" />
        <line x1="72" y1="107" x2="72" y2="113" stroke="#555" strokeWidth="0.7" />
        <text x="45" y="122" fontSize="10" fill="#444" textAnchor="middle">4 mm</text>
        <line x1="79" y1="12" x2="79" y2="102" stroke="#555" strokeWidth="0.7" />
        <line x1="76" y1="12" x2="82" y2="12" stroke="#555" strokeWidth="0.7" />
        <line x1="76" y1="102" x2="82" y2="102" stroke="#555" strokeWidth="0.7" />
        <text x="87" y="60" fontSize="10" fill="#444" textAnchor="middle" transform="rotate(90,87,60)">10 mm</text>
      </svg>
    ),
  },
  '8x8': {
    label: 'חתך רוחב — 8×8mm',
    svg: (
      <svg viewBox="0 0 100 115" width="100" height="115" style={{ display: 'block' }}>
        {[35, 65].map(x => (
          <g key={x}>
            <line x1={x} y1="8" x2={x} y2="2" stroke="#E8A020" strokeWidth="1.5" />
            <polygon points={`${x - 3},6 ${x},1 ${x + 3},6`} fill="#E8A020" />
          </g>
        ))}
        <rect x="15" y="12" width="70" height="70" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" rx="2" />
        <rect x="19" y="15" width="62" height="10" fill="#FFFDE7" stroke="#E8A020" strokeWidth="0.6" rx="1" />
        {[27, 42, 58, 73].map(x => <circle key={x} cx={x} cy={20} r="2.5" fill="#FFD54F" />)}
        <line x1="15" y1="92" x2="85" y2="92" stroke="#555" strokeWidth="0.7" />
        <line x1="15" y1="89" x2="15" y2="95" stroke="#555" strokeWidth="0.7" />
        <line x1="85" y1="89" x2="85" y2="95" stroke="#555" strokeWidth="0.7" />
        <text x="50" y="107" fontSize="10" fill="#444" textAnchor="middle">8 mm</text>
        <line x1="92" y1="12" x2="92" y2="82" stroke="#555" strokeWidth="0.7" />
        <line x1="89" y1="12" x2="95" y2="12" stroke="#555" strokeWidth="0.7" />
        <line x1="89" y1="82" x2="95" y2="82" stroke="#555" strokeWidth="0.7" />
        <text x="99" y="50" fontSize="10" fill="#444" textAnchor="middle" transform="rotate(90,99,50)">8 mm</text>
      </svg>
    ),
  },
  'double': {
    label: 'חתך רוחב — DOUBLE STRIP',
    svg: (
      <svg viewBox="0 0 140 115" width="140" height="115" style={{ display: 'block' }}>
        {[35, 55, 85, 105].map(x => (
          <g key={x}>
            <line x1={x} y1="8" x2={x} y2="2" stroke="#E8A020" strokeWidth="1.5" />
            <polygon points={`${x - 3},6 ${x},1 ${x + 3},6`} fill="#E8A020" />
          </g>
        ))}
        <rect x="10" y="12" width="52" height="70" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" rx="2" />
        <rect x="78" y="12" width="52" height="70" fill="#D9D9D9" stroke="#666" strokeWidth="1.2" rx="2" />
        <rect x="14" y="15" width="44" height="10" fill="#FFFDE7" stroke="#E8A020" strokeWidth="0.6" rx="1" />
        <rect x="82" y="15" width="44" height="10" fill="#FFFDE7" stroke="#E8A020" strokeWidth="0.6" rx="1" />
        {[22, 36, 50].map(x => <circle key={x} cx={x} cy={20} r="2.5" fill="#FFD54F" />)}
        {[90, 104, 118].map(x => <circle key={x} cx={x} cy={20} r="2.5" fill="#FFD54F" />)}
        <text x="70" y="60" fontSize="9" fill="#888" textAnchor="middle">+</text>
        <text x="70" y="105" fontSize="9" fill="#888" textAnchor="middle">DUAL</text>
      </svg>
    ),
  },
};

const NEON_ID_MAP = {
  'ledlink-neon-top':     'h-top',
  'ledlink-neon-side':    'l-side',
  'ledlink-neon-rgb':     'h-top',
  'qlt-n2412b0rg':        'l-side',
  'qlt-n2412b1rg':        'l-side',
  'qlt-n2412f':           'f-front',
  'qlt-n2412l':           'l-side',
  'qlt-n2414h0rg':        'h-top',
  'qlt-n2414h1':          'h-top',
  'qlt-n2414h1rg':        'h-top',
  'qlt-n2416h':           'h-top',
  'qlt-n3x8-mini-neon':   'mini-3x8',
  'qlt-n4x10':            '4x10',
  'qlt-n4x10t':           '4x10',
  'qlt-n3x8':             '8x8',
  'qlt-np2436834':        'double',
  'qlt-nt1811-360-strip-neon-led-tube': 'tube-18',
  'qlt-nt2314-360-strip-neon-led-tube': 'tube-23',
  'qlt-ntr2416-neon-triangle':          'triangle',
  'qlt-spi-neon-rgbw':    '4x10',
  'qlt-spi-neon-wh':      '4x10',
};

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
          transform: 'scale(0.62)', transformOrigin: 'center top', marginBottom: '-30px' }}>
          {profile.svg}
        </div>
        <div style={{ fontSize: 10, color: '#888888', marginTop: 4 }}>{profile.label}</div>
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
            <div style={{ display: 'flex', justifyContent: 'center', transform: 'scale(1.6)', transformOrigin: 'center top', marginBottom: 60 }}>
              {profile.svg}
            </div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 8, fontWeight: 600 }}>{profile.label}</div>
          </div>
        </div>
      )}
    </>
  );
}
