import { useState } from 'react';
import ContactRow, { waLink } from './ContactRow';

export default function PowerCalc() {
  const [load, setLoad]   = useState('100');
  const [volt, setVolt]   = useState('24');

  const INVENTORY = [25, 50, 75, 100, 150, 200, 350];

  const calc = () => {
    const W = parseFloat(load), V = parseFloat(volt);
    if (!W || W <= 0) return null;
    const safety = +(W * 1.2).toFixed(0);
    let recommended = null;
    for (let w of INVENTORY) {
      if (w >= safety) { recommended = w; break; }
    }
    const split = recommended === null;
    if (split) recommended = INVENTORY[INVENTORY.length - 1];
    const current     = (W / V).toFixed(2);
    const utilization = Math.round((W / recommended) * 100);
    return { recommended, split, safety, current, utilization };
  };

  const result = calc();

  const waText = result
    ? `🔌 התאמת ספק כוח — LEDLink\n──────────────────────\n⚡ עומס מחושב: ${load}W ב-${volt}V\n✅ ספק נדרש מהמלאי: ${result.split ? 'נדרש פיצול (מעל 350W)' : result.recommended + 'W'}\n🔌 זרם עבודה: ${result.current}A\n\nאשמח לקבל הצעת מחיר בהתאם למפרט.`
    : '';

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">

      {/* ─ Header ─ */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{background:'rgba(232,160,32,0.12)'}}>🔌</div>
        <div>
          <h3 className="font-black text-lg text-ink">מחשבון התאמת ספק כוח</h3>
          <p className="text-xs text-muted">בחירת ספק כוח מהמלאי לפי עומס — INVENTORY-BASED</p>
        </div>
      </div>

      {/* ─ Info box ─ */}
      <div className="rounded-lg p-4 mb-5 border" style={{background:'rgba(232,160,32,0.07)', borderColor:'rgba(232,160,32,0.35)'}}>
        <strong className="block mb-1 text-sm" style={{color:'#C4880A'}}>🔌 איך זה עובד:</strong>
        <p className="text-sm text-muted leading-relaxed">
          מזין עומס תאורה ומתח עבודה — המחשבון מוצא את ספק הכוח המתאים ממלאי LEDLink עם מקדם בטיחות 120%.
        </p>
      </div>

      {/* ─ Inputs ─ */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-bold text-ink mb-1">עומס תאורה (W)</label>
          <input type="number" value={load} onChange={e => setLoad(e.target.value)} placeholder="לדוגמה: 100"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">מתח עבודה (DC)</label>
          <select value={volt} onChange={e => setVolt(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm">
            <option value="12">12V DC</option>
            <option value="24">24V DC</option>
            <option value="48">48V DC</option>
          </select>
        </div>
      </div>

      {/* ─ Result ─ */}
      {result && (
        <div className="rounded-lg p-5 mb-4 border" style={{background:'rgba(232,160,32,0.08)', borderColor:'#E8A020'}}>
          <p className="text-xs text-muted text-center mb-1">ספק כוח מומלץ מהמלאי</p>
          {result.split ? (
            <p className="font-black text-center mb-1" style={{fontSize:36, lineHeight:1.2, color:'#E8A020'}}>נדרש פיצול</p>
          ) : (
            <p className="font-black text-center mb-1" style={{fontSize:52, lineHeight:1.1, color:'#E8A020'}}>
              {result.recommended}<span style={{fontSize:22, fontWeight:700}}>W</span>
            </p>
          )}
          <p className="text-xs text-center text-muted mb-4">עומס בטיחות מחושב: {result.safety}W (×1.2)</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded p-3 border border-amber-200 text-center">
              <p className="font-black text-2xl text-ink">{result.current}A</p>
              <p className="text-xs text-muted mt-0.5">זרם עבודה</p>
            </div>
            <div className="bg-white rounded p-3 border border-amber-200 text-center">
              <p className="font-black text-2xl" style={{color:'#E8A020'}}>{result.utilization}%</p>
              <p className="text-xs text-muted mt-0.5">ניצולת ספק</p>
            </div>
          </div>

          {result.split && (
            <div className="bg-white rounded p-3 border border-amber-200">
              <p className="text-xs font-bold text-ink mb-1">⚠️ עומס חורג ממקסימום:</p>
              <p className="text-xs text-muted leading-relaxed">
                עומס הבטיחות ({result.safety}W) עולה על הספק הגבוה במלאי (350W). יש לפצל לשני ספקים או יותר.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─ Contact ─ */}
      <ContactRow waHref={result ? waLink(waText) : undefined} disabled={!result}/>

      <p className="text-center text-xs text-muted mt-4 uppercase tracking-wider">INVENTORY-BASED SPECIFICATION | LEDLink</p>
    </div>
  );
}
