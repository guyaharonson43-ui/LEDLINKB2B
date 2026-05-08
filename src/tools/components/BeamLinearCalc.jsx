import { useState } from 'react';
import ContactRow, { waLink } from './ContactRow';

export default function BeamLinearCalc() {
  const [height,  setHeight]  = useState('');
  const [angle,   setAngle]   = useState('');
  const [length,  setLength]  = useState('');
  const [surface, setSurface] = useState('רצפה');

  const NARROW   = [10, 24, 36];
  const WIDE     = [60, 90, 110, 120];
  const SURFACES = [
    { label: 'רצפה',         offset: 0.00, note: '' },
    { label: 'שולחן אוכל',   offset: 0.75, note: '−75 ס"מ' },
    { label: 'אי מטבח',      offset: 0.90, note: '−90 ס"מ' },
    { label: 'משטח עבודה',   offset: 0.75, note: '−75 ס"מ' },
    { label: 'קיר',           offset: 0.00, note: '' },
  ];

  const calc = () => {
    const H = parseFloat(height), A = parseFloat(angle);
    if (!H || !A || A <= 0 || A >= 180) return null;
    const surfaceObj  = SURFACES.find(s => s.label === surface) || SURFACES[0];
    const effectiveH  = +(H - surfaceObj.offset).toFixed(2);
    if (effectiveH <= 0) return { error: true, effectiveH, offset: surfaceObj.offset };
    const width   = +(2 * effectiveH * Math.tan((A / 2) * Math.PI / 180)).toFixed(2);
    const spacing = +(width * 0.8).toFixed(2);
    const L       = parseFloat(length);
    const area    = (L && L > 0) ? +(width * L).toFixed(2) : null;
    return { width, spacing, area, effectiveH, offset: surfaceObj.offset };
  };

  const result = calc();

  const waText = (result && !result.error)
    ? `📏 חישוב פיזור אלומה ליניארי — LEDLink\n──────────────────────\n📐 גובה מקור: ${height}מ׳ | משטח: ${surface}${result.offset > 0 ? ` (אפקטיבי: ${result.effectiveH}מ׳)` : ''} | זווית: ${angle}°${length ? ` | אורך גוף: ${length}מ׳` : ''}\n\nתוצאה: רצועת אור ברוחב ${result.width}מ׳${result.area ? ` | שטח מואר: ${result.area}מ"ר` : ''}\nריווח מומלץ בין גופים מקביליים: ${result.spacing}מ׳\n\nאשמח לקבל המלצה על גוף ליניארי מתאים`
    : '';

  const activePreset = [...NARROW, ...WIDE].includes(Number(angle)) ? Number(angle) : null;

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{background:'rgba(232,160,32,0.12)'}}>📏</div>
        <div>
          <h3 className="font-black text-lg text-ink">מחשבון פיזור אלומה — גוף ליניארי</h3>
          <p className="text-xs text-muted">פרופיל LED, פנדנט, בטן, גוף מסלול — רוחב רצועת האור</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-1">גובה מקור האור מהרצפה (מ׳)</label>
          <input type="number" value={height} onChange={e=>setHeight(e.target.value)} placeholder="לדוגמה: 2.5"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">אורך הגוף (מ׳) — אופציונלי</label>
          <input type="number" value={length} onChange={e=>setLength(e.target.value)} placeholder="לדוגמה: 1.2"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-ink mb-1">משטח המטרה (מה מואר)</label>
          <div className="flex flex-wrap gap-2">
            {SURFACES.map(s => (
              <button key={s.label} onClick={() => setSurface(s.label)}
                className={`px-3 py-1.5 rounded border text-xs font-bold transition-all ${surface === s.label ? 'bg-ink text-white border-ink' : 'border-border text-ink hover:border-gold'}`}>
                {s.label}{s.note ? <span style={{fontWeight:400, opacity:0.7}}> {s.note}</span> : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-ink mb-2">זווית אלומה (°)</label>
          <p className="text-xs text-muted mb-1.5">צר — מסלול / וול ווושר / פנדנט עם לוברים</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {NARROW.map(p => (
              <button key={p} onClick={() => setAngle(String(p))}
                className={`px-3 py-1.5 rounded border text-xs font-bold transition-all ${activePreset === p ? 'bg-ink text-white border-ink' : 'border-border text-ink hover:border-gold'}`}>
                {p}°
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mb-1.5">רחב — פרופיל LED / בטן / פאנל שקוע</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {WIDE.map(p => (
              <button key={p} onClick={() => setAngle(String(p))}
                className={`px-3 py-1.5 rounded border text-xs font-bold transition-all ${activePreset === p ? 'bg-ink text-white border-ink' : 'border-border text-ink hover:border-gold'}`}>
                {p}°
              </button>
            ))}
          </div>
          <input type="number" value={angle} onChange={e=>setAngle(e.target.value)} placeholder="או הזן ידנית..."
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
      </div>
      {result && result.error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm font-bold text-red-700">⚠️ גובה המשטח ({SURFACES.find(s=>s.label===surface)?.offset}מ׳) גבוה ממיקום הגוף ({height}מ׳)</p>
          <p className="text-xs text-red-500 mt-1">הזן גובה גוף גדול יותר</p>
        </div>
      )}
      {result && !result.error && (
        <>
          <div className="rounded-lg p-5 mb-4 border" style={{background:'rgba(232,160,32,0.08)', borderColor:'#E8A020'}}>
            <p className="text-sm font-bold text-ink mb-1 text-center">
              בגובה {height}מ׳ עם זווית {angle}° על {surface}:
            </p>
            {result.offset > 0 && (
              <p className="text-xs text-center mb-3" style={{color:'#C4880A'}}>
                גובה אפקטיבי לחישוב: {result.effectiveH}מ׳ ({height} − {result.offset} ס"מ מגובה המשטח)
              </p>
            )}
            <div className={`grid gap-3 text-center ${result.area ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div className="bg-white rounded p-3 border border-amber-200">
                <p className="font-black text-2xl" style={{color:'#E8A020'}}>{result.width}מ׳</p>
                <p className="text-xs text-muted mt-0.5">רוחב רצועת האור</p>
              </div>
              <div className="bg-white rounded p-3 border border-amber-200">
                <p className="font-black text-2xl text-ink">{result.spacing}מ׳</p>
                <p className="text-xs text-muted mt-0.5">ריווח בין גופים מקביליים</p>
              </div>
              {result.area && (
                <div className="bg-white rounded p-3 border border-amber-200">
                  <p className="font-black text-2xl" style={{color:'#E8A020'}}>{result.area}מ"ר</p>
                  <p className="text-xs text-muted mt-0.5">שטח מואר כולל</p>
                </div>
              )}
            </div>
          </div>
          <ContactRow waHref={waLink(waText)}/>
        </>
      )}
    </div>
  );
}
