import { useState } from 'react';
import ContactRow, { waLink } from './ContactRow';

export default function EnergyCalc() {
  const [fixtures, setFixtures] = useState('');
  const [oldWatt,  setOldWatt]  = useState('');
  const [newWatt,  setNewWatt]  = useState('');
  const [hours,    setHours]    = useState('8');
  const [rate,     setRate]     = useState('0.65');
  const [invest,   setInvest]   = useState('');

  const calc = () => {
    const N = parseFloat(fixtures), Wo = parseFloat(oldWatt), Wn = parseFloat(newWatt);
    const H = parseFloat(hours), R = parseFloat(rate), Inv = parseFloat(invest) || 0;
    if (!N || !Wo || !Wn || !H || !R) return null;
    const costOld = N * Wo * H * 365 * R / 1000;
    const costNew = N * Wn * H * 365 * R / 1000;
    const saving  = costOld - costNew;
    const payback = Inv > 0 ? (Inv / (saving / 12)).toFixed(1) : null;
    return { costOld: costOld.toFixed(0), costNew: costNew.toFixed(0), saving: saving.toFixed(0), payback, savePct: ((saving/costOld)*100).toFixed(0) };
  };

  const result = calc();

  const waText = result
    ? `♻️ חישוב חיסכון אנרגיה — LEDLink\n──────────────────────\n🔴 לפני: ${fixtures} גופים × ${oldWatt}W — עלות שנתית: ₪${parseInt(result.costOld).toLocaleString()}\n🟢 אחרי LED: ${fixtures} גופים × ${newWatt}W — עלות שנתית: ₪${parseInt(result.costNew).toLocaleString()}\n\n💰 חיסכון שנתי: ₪${parseInt(result.saving).toLocaleString()} (${result.savePct}%)${result.payback ? `\n📅 החזר השקעה: ${result.payback} חודשים` : ''}\n\nאשמח לקבל הצעת מחיר לשדרוג LED`
    : '';

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">♻️</div>
        <div>
          <h3 className="font-black text-lg text-ink">מחשבון חיסכון אנרגיה</h3>
          <p className="text-xs text-muted">כמה כסף תחסוך במעבר לתאורת LED</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-1">מספר גופים</label>
          <input type="number" value={fixtures} onChange={e=>setFixtures(e.target.value)} placeholder="לדוגמה: 10"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">ואט נוכחי לגוף</label>
          <input type="number" value={oldWatt} onChange={e=>setOldWatt(e.target.value)} placeholder="לדוגמה: 60"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">ואט LED חדש לגוף</label>
          <input type="number" value={newWatt} onChange={e=>setNewWatt(e.target.value)} placeholder="לדוגמה: 9"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">שעות שימוש ביום</label>
          <input type="number" value={hours} onChange={e=>setHours(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">תעריף חשמל (₪/קוט"ש)</label>
          <input type="number" value={rate} onChange={e=>setRate(e.target.value)} step="0.01"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">עלות השקעה (₪) — אופציונלי</label>
          <input type="number" value={invest} onChange={e=>setInvest(e.target.value)} placeholder="לחישוב החזר"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
      </div>
      {result && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-3 text-center mb-3">
              <div className="bg-white rounded p-2 border border-green-200">
                <p className="text-xs text-muted mb-1">לפני</p>
                <p className="font-black text-ink">₪{parseInt(result.costOld).toLocaleString()}</p>
                <p className="text-xs text-muted">לשנה</p>
              </div>
              <div className="bg-white rounded p-2 border border-green-200">
                <p className="text-xs text-muted mb-1">אחרי LED</p>
                <p className="font-black text-green-700">₪{parseInt(result.costNew).toLocaleString()}</p>
                <p className="text-xs text-muted">לשנה</p>
              </div>
              <div className="bg-green-600 rounded p-2 text-white">
                <p className="text-xs opacity-80 mb-1">חיסכון</p>
                <p className="font-black">₪{parseInt(result.saving).toLocaleString()}</p>
                <p className="text-xs opacity-80">{result.savePct}% פחות</p>
              </div>
            </div>
            {result.payback && <p className="text-sm text-green-800 font-bold text-center">📅 החזר השקעה תוך {result.payback} חודשים</p>}
          </div>
          <ContactRow waHref={waLink(waText)}/>
        </>
      )}
    </div>
  );
}
