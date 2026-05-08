import { useState } from 'react';
import ContactRow, { waLink } from './ContactRow';

export default function VoltageDropCalc() {
  const [distance, setDistance] = useState('');
  const [totalW,   setTotalW]   = useState('');
  const [volt,     setVolt]     = useState('24');
  const [gauge,    setGauge]    = useState('1.5');
  const GAUGES = [
    { v: '0.5',  label: '0.5 ממ"ר', r: 36.0  },
    { v: '0.75', label: '0.75 ממ"ר', r: 24.5 },
    { v: '1',    label: '1.0 ממ"ר', r: 18.1  },
    { v: '1.5',  label: '1.5 ממ"ר', r: 12.1  },
    { v: '2.5',  label: '2.5 ממ"ר', r: 7.41  },
  ];

  const calc = () => {
    if (distance === '' && totalW === '') return null; // שדות ריקים — אין תוצאה עדיין
    const D = parseFloat(distance), W = parseFloat(totalW), V = parseFloat(volt);
    if (isNaN(D) || isNaN(W)) return null;
    if (D <= 0) return { error: 'מרחק חייב להיות גדול מ-0' };
    if (W <= 0) return { error: 'עומס חייב להיות גדול מ-0 ואט' };
    const g = GAUGES.find(g => g.v === gauge);
    const I = W / V;
    const Vdrop = (2 * D * I * g.r) / 1000;
    const Varrival = V - Vdrop;
    const pct = (Vdrop / V) * 100;
    let status, color, rec;
    if (pct <= 3)      { status = 'תקין';   color = 'green'; rec = 'הכבל מתאים לעומס הנדרש.'; }
    else if (pct <= 5) { status = 'גבולי';  color = 'amber'; rec = `שקול מעבר ל-${volt === '12' ? '24V' : '48V'} או הגדלת ממ"ר.`; }
    else               { status = 'בעייתי'; color = 'red';   rec = `נדרש שינוי: ${volt === '12' ? 'עבור ל-24V' : volt === '24' ? 'עבור ל-48V או הזן כבל עבה יותר' : 'הוסף נקודת הזנה נוספת'}.`; }
    return { pct: pct.toFixed(1), Vdrop: Vdrop.toFixed(2), Varrival: Varrival.toFixed(2), status, color, rec, I: I.toFixed(2) };
  };

  const result = calc();

  const waText = result
    ? `🔆 בדיקת מפל מתח — LEDLink\n──────────────────────\n📏 מרחק מהספק למקור: ${distance} מ׳\n⚡ מתח: ${volt}V | עומס: ${totalW}W\n🔌 כבל: ${gauge} ממ"ר\n\nתוצאה: מפל ${result.pct}% (${result.Vdrop}V) — מתח שמגיע למקור האור: ${result.Varrival}V — ${result.status}\n${result.rec}\n\nאשמח לקבל הצעת מחיר למקור אור ומתח מתאים`
    : '';

  const colors = { green: 'bg-green-50 border-green-200 text-green-800', amber: 'bg-amber-50 border-amber-200 text-amber-800', red: 'bg-red-50 border-red-200 text-red-800' };
  const icons  = { green: '✅', amber: '⚠️', red: '❌' };

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl">⚡</div>
        <div>
          <h3 className="font-black text-lg text-ink">מחשבון מפל מתח</h3>
          <p className="text-xs text-muted">בדוק כמה מתח יגיע למקור האור (סטריפ, ספוט, או כל גוף DC)</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-1">מרחק מהספק למקור האור (מ׳)</label>
          <input type="number" value={distance} onChange={e=>setDistance(e.target.value)} placeholder="לדוגמה: 8"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">סה"כ עומס (ואט)</label>
          <input type="number" value={totalW} onChange={e=>setTotalW(e.target.value)} placeholder="לדוגמה: 72"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">מתח</label>
          <select value={volt} onChange={e=>setVolt(e.target.value)} className="w-full border border-border rounded px-3 py-2 text-sm bg-white">
            {['12','24','48'].map(v => <option key={v} value={v}>{v}V</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">עובי כבל</label>
          <select value={gauge} onChange={e=>setGauge(e.target.value)} className="w-full border border-border rounded px-3 py-2 text-sm bg-white">
            {GAUGES.map(g => <option key={g.v} value={g.v}>{g.label}</option>)}
          </select>
        </div>
      </div>
      {result && result.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-4 flex items-center gap-2">
          <span>⚠️</span>
          <p className="text-sm font-bold text-red-700">{result.error}</p>
        </div>
      )}
      {result && !result.error && (
        <div className={`rounded-lg border p-4 mb-4 ${colors[result.color]}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{icons[result.color]}</span>
            <span className="font-black text-lg">{result.status} — מפל {result.pct}% ({result.Vdrop}V)</span>
          </div>
          <p className="text-sm mb-1">זרם: {result.I}A | מתח שמגיע למקור האור: <strong>{result.Varrival}V</strong> מתוך {volt}V</p>
          <p className="text-sm font-bold">{result.rec}</p>
        </div>
      )}
      {result && !result.error && (
        <ContactRow waHref={waLink(waText)}/>
      )}
    </div>
  );
}
