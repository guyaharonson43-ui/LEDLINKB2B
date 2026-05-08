import { useState, useEffect } from 'react';
import ContactRow, { waLink } from './ContactRow';

export default function LumenCalc({ preset, onGoToLinear, onGoBack, fromLabel }) {
  const [room,   setRoom]   = useState('סלון');
  const [width,  setWidth]  = useState('');
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('2.7');

  // כשמגיע preset מהמחשבון הביולוגי — מגדיר חדר אוטומטית
  useEffect(() => {
    if (preset) setRoom(preset);
  }, [preset]);

  const ROOMS = [
    { name: 'סלון',     lux: 150, cu: 0.70 },
    { name: 'מטבח',     lux: 300, cu: 0.65 },
    { name: 'חדר שינה', lux: 100, cu: 0.70 },
    { name: 'משרד',     lux: 500, cu: 0.70 },
    { name: 'מסדרון',   lux: 100, cu: 0.60 },
    { name: 'אמבטיה',   lux: 200, cu: 0.60 },
    { name: 'חנות',     lux: 500, cu: 0.65 },
    { name: 'מחסן',     lux: 150, cu: 0.60 },
  ];

  const calc = () => {
    const W = parseFloat(width), L = parseFloat(length), H = parseFloat(height);
    if (!W || !L || !H) return null;
    const area = +(W * L).toFixed(1);
    const r = ROOMS.find(r => r.name === room);
    const totalLm = Math.ceil(r.lux * area / (r.cu * 0.8));
    const spacing = +(H * 0.75).toFixed(1);
    return { lux: r.lux, totalLm, spacing, area };
  };

  const result = calc();

  const waText = result
    ? `💡 חישוב תאורה — LEDLink\n──────────────────────\n🏠 חדר: ${room} | ${width}×${length} מ׳ (${result.area} מ"ר) | גובה: ${height} מ׳\n📊 דרישה: ${result.lux} לוקס (תקן EN 12464)\n✨ סה"כ לומן נדרש: ${result.totalLm.toLocaleString()} lm\n📐 ריווח מומלץ: ${result.spacing} מ׳\n\nאשמח לקבל המלצה מדויקת לחלל`
    : '';

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">
      {/* כפתור חזרה */}
      {onGoBack && (
        <button onClick={onGoBack}
          className="flex items-center gap-1 text-xs font-bold mb-4 transition-colors"
          style={{color:'#E8A020', background:'none', border:'none', cursor:'pointer', padding:0}}>
          ▶ חזרה ל{fromLabel}
        </button>
      )}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">💡</div>
        <div>
          <h3 className="font-black text-lg text-ink">מחשבון לומן לחלל</h3>
          <p className="text-xs text-muted">דרישת תאורה מקצועית לפי תקן EN 12464</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-ink mb-1">סוג חדר</label>
          <div className="flex flex-wrap gap-2">
            {ROOMS.map(r => (
              <button key={r.name} onClick={() => setRoom(r.name)}
                className={`px-3 py-1.5 rounded border text-xs font-bold transition-all ${room === r.name ? 'bg-ink text-white border-ink' : 'border-border text-ink hover:border-gold'}`}>
                {r.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">רוחב חדר (מ׳)</label>
          <input type="number" value={width} onChange={e=>setWidth(e.target.value)} placeholder="לדוגמה: 4"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">אורך חדר (מ׳)</label>
          <input type="number" value={length} onChange={e=>setLength(e.target.value)} placeholder="לדוגמה: 5"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-ink mb-1">גובה תקרה (מ׳)</label>
          <input type="number" value={height} onChange={e=>setHeight(e.target.value)} step="0.1"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
      </div>
      {result && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded p-3 border border-amber-200">
                <p className="font-black text-xl text-ink">{result.lux}</p>
                <p className="text-xs text-muted mt-0.5">לוקס נדרש</p>
              </div>
              <div className="bg-white rounded p-3 border border-amber-200">
                <p className="font-black text-xl text-amber-700">{result.totalLm.toLocaleString()}</p>
                <p className="text-xs text-muted mt-0.5">לומן כולל</p>
              </div>
              <div className="bg-white rounded p-3 border border-amber-200">
                <p className="font-black text-xl text-ink">{result.spacing}מ׳</p>
                <p className="text-xs text-muted mt-0.5">ריווח בין גופים</p>
              </div>
            </div>
          </div>
          <ContactRow waHref={waLink(waText)}/>
          {onGoToLinear && (
            <button onClick={() => onGoToLinear({ roomType: room, width, length })}
              className="flex items-center justify-center gap-2 w-full font-bold py-3 rounded text-sm mt-2 transition-colors"
              style={{background:'#E8A020', color:'#fff'}}>
              🔆 חשב אורך פרופיל LED ◀
            </button>
          )}
        </>
      )}
    </div>
  );
}
