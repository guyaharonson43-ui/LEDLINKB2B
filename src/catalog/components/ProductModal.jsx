import { useState, useEffect, useRef } from 'react';
import datasheets    from '../../../datasheets_data';
import { trackEvent, pdfSrc } from '../utils/helpers';
import { getDriverMeta } from '../utils/driverMeta';
import { getStripMeta }       from '../utils/stripMeta';
import ProductImg             from './ProductImg';
import NeonSchematic          from './NeonSchematics';
import { Icons }              from './Icons';
import drawings              from '../data/drawings';

// הלייטבוקס ניסה קודם גרסאות (2) ואז (1) של הקובץ בהנחה שהן ברזולוציה גבוהה
// יותר. נבדק מול השרת על מדגם של 12 תמונות: אף אחת מהן לא קיימת — כלומר כל
// פתיחה עשתה שתי בקשות כושלות לפני שהתמונה הופיעה. ההסתעפות הוסרה.
function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.88)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 24
    }}>
      {/* התמונה מוצגת בגודלה הטבעי ולא נמתחת. קודם היא נמתחה ל-60vw/60vh —
          מקור של 250px הוצג ב-864px ויצא מרוח. עדיף קטן וחד מגדול ומטושטש,
          והכרטיס הלבן מסביב נותן להצגה נוכחות במקום תמונה קטנה שמרחפת. */}
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FFFFFF', borderRadius: 12, padding: 28,
        boxShadow: '0 24px 70px rgba(0,0,0,0.55)', cursor: 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img src={src} alt={alt}
          style={{ display: 'block', width: 'auto', height: 'auto',
                   maxWidth: 'min(82vw, 640px)', maxHeight: 'min(72vh, 640px)' }} />
      </div>
      <button onClick={onClose} aria-label="סגור תצוגה מוגדלת" style={{
        position: 'absolute', top: 20, left: 20,
        background: 'rgba(255,255,255,0.15)', border: 'none',
        color: '#fff', fontSize: 28, width: 44, height: 44,
        borderRadius: '50%', cursor: 'pointer', lineHeight: 1
      }}>✕</button>
    </div>
  );
}

// היה כאן fullImg() שהחליף /Media/Resize/250_250/ ב-/Media/Uploads/ כדי לקבל
// תמונה גדולה יותר. נבדק מול השרת: שני הנתיבים מחזירים בדיוק את אותו קובץ
// 250x250 — ליורולוקס אין מקור גדול יותר בשום נתיב, גם לא בדף המוצר שלהם.
// התוצאה הייתה הורדה כפולה של אותם בייטים תחת URL שני, במקום שימוש במה
// שכבר במטמון מהכרטיס.

export default function ProductModal({ product: initialProduct, variants, onClose }) {
  // הווריאנט הנבחר יושב ב-state מקומי, ושאר הקומפוננטה ממשיכה לקרוא ל-`product`.
  // כך תמונה, מפרט, datasheet, לינק השיתוף וטקסט הוואטסאפ מתחלפים יחד.
  const [product, setProduct] = useState(initialProduct);
  useEffect(() => { setProduct(initialProduct); }, [initialProduct]);
  const ds       = (datasheets[product.id] || datasheets[product.name] || []);
  const drawing  = drawings[product.id] || null;
  const productImgFull = product.img;
  const cat      = product.category;
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const copyLink = () => {
    const base = location.href.split('?')[0].replace(/\/catalog\.html$/, '');
    const url = `${base}/share/${encodeURIComponent(product.id)}.html`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderSpecs = () => {
    if (cat === 'גופי תאורה') {
      const ex   = product.extractedSpecs || {};
      const tags = product.specTags || [];
      const rows = Object.entries(ex);
      // add any specTags not already captured
      tags.forEach(t => {
        const already = rows.some(([, v]) => v === t);
        if (!already) rows.push([t, t]);
      });
      return (
        <div style={{ marginTop: 0 }}>
          {product.sku && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#767676', letterSpacing: 1, textTransform: 'uppercase' }}>מק"ט</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1C', fontFamily: 'monospace' }}>{product.sku}</span>
            </div>
          )}
          {rows.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: '#767676', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>מפרט טכני</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {rows.map(([k, v]) => (
                  <div key={k} style={{ background: '#F4F4F0', borderRadius: 6, padding: '10px 14px', border: '1px solid #E0DDD6' }}>
                    <div style={{ fontSize: 10, color: '#767676', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1C' }}>{v}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {(product.family || product.subCategory) && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.subCategory && (
                <span style={{ fontSize: 12, background: '#1A1A1A', color: '#E8A020', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                  {product.subCategory}
                </span>
              )}
              {product.family && product.family !== product.subCategory && (
                <span style={{ fontSize: 12, background: '#F0EDE8', color: '#555', padding: '3px 10px', borderRadius: 20 }}>
                  {product.family}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    if (cat === 'דרייברים' && product.specs) {
      // מהמפרט המנורמל ולא מ-specs הגולמי: שם השדה voltage מחזיק וולט במתח-קבוע
      // ומיליאמפר בזרם-קבוע, ותגית outputMode שגויה ב-27 מוצרים. בלי זה החלון
      // היה מציג "מתח: 350MA", ו"מצב יציאה: CC" על דרייבר 24V.
      const m = getDriverMeta(product);
      const isCC = m.outputCurrent != null;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          {[['הספק', m.power != null ? m.power + 'W' : null],
            [isCC ? 'זרם יציאה' : 'מתח יציאה', isCC ? m.outputCurrent + 'mA' : m.outputVoltage],
            ['IP', m.ip],
            ['מצב יציאה', m.group],
            ['מתח כניסה', m.inputVoltage],
            ['עמעום', m.dimming.length ? m.dimming.join(', ') : 'ללא'],
            // הזרם נבחר בהתקנה; הקטלוג מציג ערך אחד מתוך כמה שהדרייבר תומך בהם
            m.multiCurrent ? ['הערה', 'זרם נבחר בדרייבר — מוצג ערך אחד בלבד'] : null,
          ].filter(Boolean).filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ background: '#F4F4F0', borderRadius: 6, padding: '10px 14px', border: '1px solid #E0DDD6' }}>
              <div style={{ fontSize: 10, color: '#767676', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1C' }}>{v}</div>
            </div>
          ))}
        </div>
      );
    }

    if (cat === 'סטריפ LED') {
      const m    = getStripMeta(product);
      const desc = product.desc || '';
      const lmwM   = desc.match(/(\d+(?:\.\d+)?)\s*Lm\/W/i);
      const lmM    = desc.match(/(\d+(?:\.\d+)?)\s*Lm\/m/i);
      const kelvinM = desc.match(/([\d\/]+)\s*K/);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          {[
            ['הספק',          m.power ? m.power + 'W/m' : null],
            ['מתח',           m.voltage],
            ['הגנה',          m.ip],
            ['סוג',           m.type],
            ['צבע',           m.color],
            ['לומן/וואט',     lmwM ? lmwM[1] + ' Lm/W' : null],
            ['לומן/מטר',     lmM  ? lmM[1]  + ' Lm/m' : null],
            ['טמפרטורת צבע', kelvinM ? kelvinM[1] + 'K' : null],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ background: '#F4F4F0', borderRadius: 6, padding: '10px 14px', border: '1px solid #E0DDD6' }}>
              <div style={{ fontSize: 10, color: '#767676', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1C' }}>{v}</div>
            </div>
          ))}
        </div>
      );
    }

    if (cat === 'פרופילים' && product.desc) {
      const parts = product.desc.split('|').map(s => s.trim()).filter(Boolean);
      return (
        <div style={{ marginTop: 16 }}>
          {parts.map((p, i) => (
            <div key={i} style={{ borderBottom: '1px solid #E8E5E0', padding: '10px 0', fontSize: 14, color: '#444444' }}>{p}</div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #E8E5E0' }}>
          <div>
            <div style={{ fontSize: 11, color: '#767676', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
              {product.subCategory || product.category}
            </div>
            <h2 id="product-modal-title" style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1C', margin: 0 }}>{product.name}</h2>
            {variants && variants.length > 1 && (
              <div style={{ marginTop: 12 }} role="group" aria-label={`בחירת ${product.variantAxis}`}>
                <div style={{ fontSize: 11, color: '#767676', letterSpacing: 1, marginBottom: 6 }}>
                  {product.variantAxis}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {variants.map(v => (
                    <button key={v.id} type="button"
                      className={`filter-chip${v.id === product.id ? ' active' : ''}`}
                      aria-pressed={v.id === product.id}
                      onClick={() => setProduct(v)}>
                      {v.variantLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="סגור"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: 4, marginTop: 2 }}>
            {Icons.close}
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <div>
              <div onClick={() => setLightbox({ src: productImgFull, alt: product.name })}
                style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E0DDD6', cursor: 'zoom-in' }}>
                <ProductImg src={productImgFull} name={product.name} tall priority
                  scale={product.imgScale} base={product.imgBase} width={product.imgWidth}
                  cutout={product.imgCutout} />
              </div>
              {drawing && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: '#767676', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>שרטוט טכני</div>
                  <div onClick={() => setLightbox({ src: drawing, alt: `שרטוט ${product.name}` })}
                    style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E0DDD6', background: '#fff', cursor: 'zoom-in' }}>
                    <img src={drawing} alt={`שרטוט ${product.name}`}
                      style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>
              )}
            </div>
            <div>
              {renderSpecs()}
              <NeonSchematic product={product} />
            </div>
          </div>

          {product.desc && cat !== 'פרופילים' && (
            <div style={{ marginTop: 20, background: '#F4F4F0', borderRadius: 8, padding: '14px 16px', border: '1px solid #E0DDD6' }}>
              <div style={{ fontSize: 11, color: '#767676', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>תיאור</div>
              <p style={{ fontSize: 13, color: '#555555', lineHeight: 1.7, margin: 0 }}>{product.desc}</p>
            </div>
          )}

          {ds.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: '#767676', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>מסמכים טכניים</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ds.map((d, i) => (
                  <a key={i} href={pdfSrc(d.file)} target="_blank" rel="noopener noreferrer"
                    onClick={() => trackEvent('datasheet_download', { product_id: product.id, datasheet: d.file })}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F4F4F0',
                      border: '1px solid #E0DDD6', borderRadius: 6, color: '#E8A020', textDecoration: 'none',
                      fontSize: 13, fontWeight: 600, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#E8A020'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E0DDD6'}>
                    {Icons.download}
                    {d.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <a href={`https://wa.me/972504722550?text=${encodeURIComponent('שלום LEDLink, אשמח לקבל מחיר עבור: ' + product.name + ' (מק"ט: ' + product.id + ')')}`}
              target="_blank" rel="noopener noreferrer" className="btn-gold"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
              onClick={() => trackEvent('whatsapp_click', { product_id: product.id, product_name: product.name })}>
              {Icons.wa} בקש מחיר
            </a>
            <button onClick={copyLink} className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none' }}>
              {copied ? '✓ הועתק' : '🔗 העתק לינק'}
            </button>
          </div>
        </div>
      </div>
    </div>
    {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </>
  );
}
