import { useState } from 'react';
import ContactRow, { waLink } from './ContactRow';

export default function CircadianCalc({ onGoToLumen }) {
  const [roomType, setRoomType] = useState('office');
  const [lux, setLux] = useState(500);
  const [kelvin, setKelvin] = useState(4000);

  // טבלת הנגזרות לפי טמפרטורה
  const derTable = [
    { k: 2700, d: 0.45 },
    { k: 3000, d: 0.52 },
    { k: 4000, d: 0.65 },
    { k: 5000, d: 0.90 },
    { k: 6500, d: 1.10 }
  ];

  // אינטרפולציה לנגזרת
  const getDer = (k) => {
    for (let i = 0; i < derTable.length - 1; i++) {
      if (k >= derTable[i].k && k <= derTable[i + 1].k) {
        const r = (k - derTable[i].k) / (derTable[i + 1].k - derTable[i].k);
        return derTable[i].d + r * (derTable[i + 1].d - derTable[i].d);
      }
    }
    return k < 2700 ? 0.45 : 1.10;
  };

  const ROOMS = [
    { type: 'office', label: '🏢 משרד / עבודה (ריכוז)', target: 250, name: 'משרד', maxMode: false },
    { type: 'classroom', label: '🎓 כיתה / הדרכה (למידה)', target: 200, name: 'כיתה', maxMode: false },
    { type: 'healthcare', label: '🏥 רפואה (ערנות גבוהה)', target: 250, name: 'רפואה', maxMode: false },
    { type: 'bedroom', label: '🌙 חדר שינה (הרפיה ושינה)', target: 100, name: 'חדר שינה', maxMode: true },
    { type: 'lobby', label: '🏨 לובי / שהייה (איזון)', target: 150, name: 'לובי', maxMode: false },
  ];

  // מיפוי סוג חלל ביולוגי → סוג חדר במחשבון לומן
  const LUMEN_ROOM_MAP = {
    office:     'משרד',
    classroom:  'משרד',
    healthcare: 'משרד',
    bedroom:    'חדר שינה',
    lobby:      'מסדרון',
  };

  const calc = () => {
    const room = ROOMS.find(r => r.type === roomType);
    const effRatio = 1 + ((kelvin - 2700) / (6500 - 2700)) * 0.12;
    const eLux = lux * effRatio;
    const res = Math.round(eLux * getDer(kelvin));
    const factor = (res / (lux * 0.45)).toFixed(1);

    const isSuccess = room.maxMode ? res <= room.target : res >= room.target;
    const glare = eLux >= 800;
    const status = isSuccess && !glare ? 'ok' : 'warning';

    let summary = '';
    if (roomType === 'office') {
      summary = `עוצמה של ${lux} Lux בגוון ${kelvin}K מעניקה ${res} EML — פי ${(res/room.target).toFixed(1)} מהיעד. זה יעיל להגעה לתקן WELL עם פחות גופי תאורה.`;
    } else if (roomType === 'bedroom') {
      summary = `בחדר שינה, ערב עם ${kelvin}K יכול להדכא מלטונין גם ב-${lux} Lux. דיוק ספקטרלי קריטי למניעת הפרעות שינה.`;
    } else if (roomType === 'healthcare') {
      summary = `במערכת בריאות, ${res} EML מחזק ערנות וקוג'ניציה. הבדל של 173% בין גוונים הוא קריטי לתוצאות טיפול.`;
    } else {
      summary = `כיתה/כלתא או לובי: ${res} EML מעניקה איזון בין ערנות ללא עיוות קוגניטיבי. תכנון מבוסס EML הוא ההבדל בין פרויקט בריא לכזה שנכשל בתקן WELL.`;
    }

    return { eml: res, target: room.target, factor, summary, isSuccess, glare, status, eLux, room };
  };

  const result = calc();

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">🌙</div>
        <div>
          <h3 className="font-black text-lg text-ink">מחשבון ביולוגי (Melanopic Lux)</h3>
          <p className="text-xs text-muted">השפעה בריאותית של אור על הקצב היומי — CIE S 026:2018</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
        <strong className="text-blue-900 block mb-2">🧬 מלטונין והשעון הביולוגי:</strong>
        <p className="text-sm text-blue-800">מלטונין הוא הורמון המשרה שינה. אור קר (כחול) עוצר את הייצור שלו וגורם לערנות שיא. אור חם מאפשר לגוף להפריש מלטונין ולנוח.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-2">סוג החלל:</label>
          <select value={roomType} onChange={e => setRoomType(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm bg-white">
            {ROOMS.map(r => <option key={r.type} value={r.type}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-ink">עוצמת הארה (Lux):</label>
            <span className="text-sm font-bold" style={{ color: result.glare ? '#ff6b6b' : '#1C1C1C' }}>{lux}</span>
          </div>
          <input type="range" min="50" max="1000" step="10" value={lux} onChange={e => setLux(Number(e.target.value))}
            className="w-full" style={{cursor:'pointer'}}/>
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>50</span><span>1000</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-ink">גוון אור (Kelvin):</label>
            <span className="text-sm font-bold" style={{ color: '#E8A020' }}>{kelvin}K</span>
          </div>
          <input type="range" min="2700" max="6500" step="100" value={kelvin} onChange={e => setKelvin(Number(e.target.value))}
            className="w-full" style={{cursor:'pointer'}}/>
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>🟠 2700K (חם)</span><span>🔵 6500K (קר)</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-5 mb-4 border" style={{
        background: result.status === 'ok' ? 'rgba(74,222,128,0.08)' : 'rgba(255,107,107,0.08)',
        borderColor: result.status === 'ok' ? '#4ade80' : '#ff6b6b'
      }}>
        <p className="text-xs text-muted text-center mb-2">Melanopic Lux (EML)</p>
        <p className="font-black text-4xl text-center mb-4" style={{ color: result.status === 'ok' ? '#4ade80' : '#ff6b6b' }}>{result.eml}</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded p-3 border text-center" style={{ borderColor: result.status === 'ok' ? '#4ade80' : '#ff6b6b' }}>
            <p className="text-xs text-muted mb-1">יעד</p>
            <p className="font-bold text-ink">{result.target}</p>
          </div>
          <div className="bg-white rounded p-3 border text-center" style={{ borderColor: result.status === 'ok' ? '#4ade80' : '#ff6b6b' }}>
            <p className="text-xs text-muted mb-1">פקטור</p>
            <p className="font-bold" style={{ color: '#E8A020' }}>x{result.factor}</p>
          </div>
          <div className="bg-white rounded p-3 border text-center" style={{ borderColor: result.status === 'ok' ? '#4ade80' : '#ff6b6b' }}>
            <p className="text-xs text-muted mb-1">אחוז</p>
            <p className="font-bold text-ink">{Math.round((result.eml / result.target) * 100)}%</p>
          </div>
        </div>

        <div className="bg-white rounded p-3 border" style={{ borderColor: result.status === 'ok' ? '#4ade80' : '#ff6b6b' }}>
          <p className="text-xs font-bold text-ink mb-1">סיכום הנדסי:</p>
          <p className="text-sm leading-relaxed" style={{ color: result.status === 'ok' ? '#22863a' : '#6d1919' }}>{result.summary}</p>
          {result.glare && <p className="text-xs mt-2" style={{ color: '#ff6b6b' }}>⚠️ סנוור: עוצמה גבוהה מידי</p>}
          {!result.isSuccess && !result.glare && <p className="text-xs mt-2" style={{ color: '#ff6b6b' }}>⚠️ חלש מידי: לא מגיע ליעד</p>}
        </div>
      </div>

      <div className="rounded-lg p-5 mb-4 border" style={{ background: '#f9f7f2', borderColor: '#E0DDD6' }}>
        <p className="text-xs font-bold text-ink mb-3 uppercase tracking-wide">תובנות יישומיות</p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="font-bold text-lg flex-shrink-0" style={{ color: '#E8A020' }}>●</span>
            <div>
              <strong className="text-ink text-sm">יעילות במשרדים:</strong>
              <p className="text-xs text-muted mt-1">מעבר ל-6500K מאפשר הגעה ליעדי WELL עם פחות גופי תאורה. כל לוקס "שווה" פי 2.7 יותר ביולוגית, מה שחוסך אנרגיה ועלויות.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-lg flex-shrink-0" style={{ color: '#E8A020' }}>●</span>
            <div>
              <strong className="text-ink text-sm">איכות חיים במגורים:</strong>
              <p className="text-xs text-muted mt-1">אור קר בערב מדכא מלטונין גם בעוצמה נמוכה. הדיוק הספקטרלי קריטי למניעת הפרעות שינה.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-lg flex-shrink-0" style={{ color: '#E8A020' }}>●</span>
            <div>
              <strong className="text-ink text-sm">דיוק במפרט:</strong>
              <p className="text-xs text-muted mt-1">הבדל של 173% בין גוונים הוא קריטי. תכנון מבוסס EML הוא ההבדל בין פרויקט בריא לכזה שנכשל בתקן WELL.</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onGoToLumen && onGoToLumen(LUMEN_ROOM_MAP[roomType])}
        className="flex items-center justify-center gap-2 w-full font-bold py-3 rounded transition-colors text-sm"
        style={{ background: '#E8A020', color: '#fff', border: 'none', cursor: 'pointer' }}>
        💡 חשב גוף תאורה מתאים לחלל
      </button>

      <p className="text-center text-xs text-muted mt-4 uppercase tracking-wider">CIE S 026:2018 Standards | Engineered by LEDLink</p>
    </div>
  );
}
