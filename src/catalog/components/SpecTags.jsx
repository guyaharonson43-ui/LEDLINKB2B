import { getStripMeta }  from '../utils/stripMeta';
import { getDriverMeta } from '../utils/driverMeta';

export default function SpecTags({ product }) {
  const cat  = product.category;
  const tags = [];

  if (cat === 'דרייברים') {
    const m = getDriverMeta(product);
    if (m.power != null)      tags.push({ label: m.power + 'W', hi: true });
    // ב-CC ערך היציאה הוא זרם ולא מתח. specs.voltage מחזיק את שניהם, ולכן
    // התגית נגזרת מהמפרט המנורמל ולא מהשדה הגולמי.
    if (m.outputCurrent != null) tags.push({ label: m.outputCurrent + 'mA' });
    else if (m.outputVoltage)    tags.push({ label: m.outputVoltage });
    if (m.ip)                 tags.push({ label: m.ip });
    // הזרם נבחר בהתקנה והקטלוג מציג ערך אחד בלבד — מסומן כדי שהמשתמש לא
    // יסיק מהתג שזה הערך היחיד שהדרייבר תומך בו.
    if (m.multiCurrent)       tags.push({ label: 'זרם נבחר', muted: true,
                                          title: 'הזרם נבחר בדרייבר; הקטלוג מציג ערך אחד בלבד' });
    if (m.dimming.length)     tags.push({ label: m.dimming[0] });
  } else if (cat === 'סטריפ LED') {
    const m = getStripMeta(product);
    if (m.power)              tags.push({ label: m.power + 'W/m', hi: true });
    if (m.voltage)            tags.push({ label: m.voltage });
    if (m.ip)                 tags.push({ label: m.ip });
    if (m.type && m.type !== 'סטנדרט') tags.push({ label: m.type });
    if (m.color !== 'לבן')    tags.push({ label: m.color });
  } else if (product.trackType) {
    // פסי צבירה בלבד. סוג הפס הוא ההבחנה הקנייתית העיקרית כאן — מגנטי 48V
    // ומתח גבוה 230V אינם תואמים זה לזה — ולכן הוא מודגש ומופיע ראשון על הכרטיס.
    tags.push({ label: product.trackType, hi: true });
    if (product.itemKind && product.itemKind !== 'גוף תאורה') tags.push({ label: product.itemKind });
    (product.specTags || []).forEach(t => tags.push({ label: t }));
  } else if (cat === 'פרופילים') {
    const d    = product.desc || '';
    const mkat = d.match(/מקט:\s*([^\s|]+)/);
    const mlen = d.match(/(?:אורך[^:]*:\s*)([^\s|]+)/);
    const mip  = d.match(/IP(\d+)/i);
    if (mkat) tags.push({ label: mkat[1], hi: true });
    if (mip)  tags.push({ label: 'IP' + mip[1] });
    if (mlen) tags.push({ label: mlen[1] });
  }

  if (!tags.length) return null;

  return (
    <div className="spec-tags">
      {tags.slice(0, 4).map((t, i) => (
        <span key={i} title={t.title}
          className={`spec-tag${t.hi ? ' highlight' : ''}${t.muted ? ' muted' : ''}`}>{t.label}</span>
      ))}
    </div>
  );
}
