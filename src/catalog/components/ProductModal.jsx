import { useState, useEffect, useRef } from 'react';
import datasheets    from '../../../datasheets_data';
import { trackEvent, pdfSrc } from '../utils/helpers';
import { getStripMeta }       from '../utils/stripMeta';
import ProductImg             from './ProductImg';
import NeonSchematic          from './NeonSchematics';
import { Icons }              from './Icons';

export default function ProductModal({ product, onClose }) {
  const ds       = (datasheets[product.id] || datasheets[product.name] || []);
  const cat      = product.category;
  const [copied, setCopied] = useState(false);
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
    const url = `${location.href.split('?')[0]}?product=${encodeURIComponent(product.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderSpecs = () => {
    if (cat === 'דרייברים' && product.specs) {
      const s = product.specs;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          {[['הספק', s.power], ['מתח', s.voltage], ['IP', s.ip], ['מצב פלט', s.outputMode],
            ['מתח כניסה', s.inputVoltage], ['עמעום', s.dimming?.join(', ')]
          ].filter(([, v]) => v).map(([k, v]) => (
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
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="סגור"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: 4, marginTop: 2 }}>
            {Icons.close}
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E0DDD6' }}>
              <ProductImg src={product.img} name={product.name} tall />
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
            <a href={`https://wa.me/972524444470?text=${encodeURIComponent('שלום LEDLink, אשמח לקבל מחיר עבור: ' + product.name + ' (מק"ט: ' + product.id + ')')}`}
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
  );
}
