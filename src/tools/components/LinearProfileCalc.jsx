import { useState, useEffect } from 'react';
import ContactRow, { waLink } from './ContactRow';

export default function LinearProfileCalc({ preset, onGoBack, fromLabel }) {
  const [roomType,   setRoomType]   = useState('משרד');
  const [width,      setWidth]      = useState('');
  const [length,     setLength]     = useState('');
  const [profileIdx, setProfileIdx] = useState(1);

  // כשמגיע preset מלומן לחלל — ממלא הכל אוטומטית
  useEffect(() => {
    if (!preset) return;
    if (preset.roomType) setRoomType(preset.roomType);
    if (preset.width)    setWidth(preset.width);
    if (preset.length)   setLength(preset.length);
  }, [preset]);

  const ROOMS = [
    { name: 'סלון',     lux: 150 },
    { name: 'מטבח',     lux: 300 },
    { name: 'חדר שינה', lux: 120 },
    { name: 'משרד',     lux: 500 },
    { name: 'מסדרון',   lux: 100 },
    { name: 'חנות',     lux: 500 },
    { name: 'אמבטיה',   lux: 200 },
  ];

  const PROFILES = [
    { id: 0, label: '10W/m', sub: '1730 Lm/m', lmM: 1730, wM: 10 },
    { id: 1, label: '15W/m', sub: '2800 Lm/m', lmM: 2800, wM: 15 },
    { id: 2, label: '30W/m', sub: '4000 Lm/m', lmM: 4000, wM: 30 },
  ];

  const calc = () => {
    const W = parseFloat(width), L = parseFloat(length);
    if (!W || !L) return null;
    const profile  = PROFILES[profileIdx];
    const room     = ROOMS.find(r => r.name === roomType);
    const area     = +(W * L).toFixed(1);
    const totalLm      = (room.lux * area) / (0.7 * 0.8);
    const effectiveLmM = profile.lmM * 0.70;          // ניכוי 30% הפסדי דיפוזר
    const meters       = +(totalLm / effectiveLmM).toFixed(1);
    const watt     = Math.ceil(meters * profile.wM);
    const efficacy = (profile.lmM / profile.wM).toFixed(0);
    return { meters, watt, efficacy, lux: room.lux, area };
  };

  const result = calc();

  const waText = result
    ? `🔆 מחשבון פרופיל LED ליניארי — LEDLink\n──────────────────────\n🏠 חלל: ${roomType} | ${width}×${length} מ׳ (${result.area} מ"ר)\n💡 יעד: ${result.lux} לוקס | פרופיל: ${PROFILES[profileIdx].label} (${PROFILES[profileIdx].sub})\n\n📏 אורך נדרש: ${result.meters} מ׳\n⚡ הספד: ${result.watt}W\n✨ נצילות: ${result.efficacy} Lm/W\n\nאשמח לקבל הצעת מחיר לפרופיל LED מתאים`
    : '';

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">

      {/* ─ כפתור חזרה ─ */}
      {onGoBack && (
        <button onClick={onGoBack}
          className="flex items-center gap-1 text-xs font-bold mb-4 transition-colors"
          style={{color:'#E8A020', background:'none', border:'none', cursor:'pointer', padding:0}}>
          ▶ חזרה ל{fromLabel}
        </button>
      )}

      {/* ─ Header ─ */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{background:'rgba(232,160,32,0.12)'}}>🔆</div>
        <div>
          <h3 className="font-black text-lg text-ink">מחשבון פרופיל LED ליניארי</h3>
          <p className="text-xs text-muted">אורך פרופיל נדרש לפי גודל חלל ועוצמת הסטריפ</p>
        </div>
      </div>

      {/* ─ Info box ─ */}
      <div className="rounded-lg p-4 mb-5 border" style={{background:'rgba(232,160,32,0.07)', borderColor:'rgba(232,160,32,0.35)'}}>
        <strong className="block mb-1 text-sm" style={{color:'#C4880A'}}>🔆 איך זה עובד:</strong>
        <p className="text-sm text-muted leading-relaxed">
          בוחר סוג חלל ← מזין ממדים ← בוחר עוצמת הסטריפ — המחשבון מחשב כמה מטרים של פרופיל LED נדרשים לעמוד בדרישת הלוקס לפי תקן EN 12464.
        </p>
      </div>

      {/* ─ Room type ─ */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-ink mb-2">סוג החלל</label>
        <div className="flex flex-wrap gap-2">
          {ROOMS.map(r => (
            <button key={r.name} onClick={() => setRoomType(r.name)}
              className={`px-3 py-1.5 rounded border text-xs font-bold transition-all ${roomType === r.name ? 'bg-ink text-white border-ink' : 'border-border text-ink hover:border-gold'}`}>
              {r.name} <span style={{opacity:0.6, fontWeight:400}}>{r.lux} lx</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─ Dimensions ─ */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-1">רוחב חדר (מ׳)</label>
          <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="לדוגמה: 4"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1">אורך חדר (מ׳)</label>
          <input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="לדוגמה: 5"
            className="w-full border border-border rounded px-3 py-2 text-sm"/>
        </div>
      </div>

      {/* ─ Profile selection ─ */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-ink mb-2">סוג סטריפ LED</label>
        <div className="flex flex-col gap-2">
          {PROFILES.map(p => (
            <button key={p.id} onClick={() => setProfileIdx(p.id)}
              className={`p-3 rounded-lg border text-right transition-all ${profileIdx === p.id ? 'border-gold' : 'border-border hover:border-gold'}`}
              style={{background: profileIdx === p.id ? 'rgba(232,160,32,0.07)' : '#fff'}}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm" style={{color: profileIdx === p.id ? '#E8A020' : '#1C1C1C'}}>{p.label}</span>
                <span className="text-xs text-muted font-mono">נומינלי: {p.sub} · אפקטיבי: {Math.round(p.lmM * 0.70)} Lm/m</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─ Result ─ */}
      {result && (
        <div className="rounded-lg p-5 mb-4 border" style={{background:'rgba(232,160,32,0.08)', borderColor:'#E8A020'}}>
          <p className="text-xs text-muted text-center mb-1">אורך פרופיל כולל נדרש</p>
          <p className="font-black text-center mb-1" style={{fontSize:52, lineHeight:1.1, color:'#E8A020'}}>
            {result.meters}<span style={{fontSize:22, fontWeight:700}}>מ׳</span>
          </p>
          <p className="text-xs text-center text-muted mb-4">עבור {result.lux} לוקס בחלל {width}×{length}מ׳ ({result.area} מ"ר)</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded p-3 border border-amber-200 text-center">
              <p className="font-black text-2xl text-ink">{result.watt}W</p>
              <p className="text-xs text-muted mt-0.5">הספק ספק כוח</p>
            </div>
            <div className="bg-white rounded p-3 border border-amber-200 text-center">
              <p className="font-black text-2xl" style={{color:'#E8A020'}}>{result.efficacy} <span className="text-sm">Lm/W</span></p>
              <p className="text-xs text-muted mt-0.5">נצילות אנרגטית</p>
            </div>
          </div>

          <div className="bg-white rounded p-3 border border-amber-200">
            <p className="text-xs font-bold text-ink mb-1">📋 הערה למפרט:</p>
            <p className="text-xs text-muted leading-relaxed">
              מומלץ לחלק את {result.meters}מ׳ למספר גופים לאחידות מקסימלית ומניעת שטחים מתים בפינות החדר.
            </p>
          </div>
        </div>
      )}

      {/* ─ Contact ─ */}
      <ContactRow waHref={result ? waLink(waText) : undefined} disabled={!result}/>

      <p className="text-center text-xs text-muted mt-4 uppercase tracking-wider">EN 12464 Standards | LEDLink</p>
    </div>
  );
}
