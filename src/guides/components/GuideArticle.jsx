// src/guides/components/GuideArticle.jsx
import { useEffect } from 'react';
import { renderParagraph } from './renderParagraph';

const WA_NUMBER = '972524444470';

const WaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export default function GuideArticle({ guide, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px' }} onClick={onClose}>
        <div style={{ background: '#fff', width: '100%', maxWidth: 760, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

          {/* Hero image */}
          <div style={{ position: 'relative', aspectRatio: '21/9', overflow: 'hidden', maxHeight: 280 }}>
            <img src={guide.img} alt={guide.title} loading="lazy" decoding="async" width="760" height="327" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: '32px' }}>
              <span style={{ display: 'inline-block', background: '#E8A020', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', padding: '3px 12px', borderRadius: 4, marginBottom: 12 }}>
                {guide.cat}
              </span>
              <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, margin: 0 }}>{guide.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500, marginTop: 10 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {guide.readTime} קריאה
              </div>
            </div>
            <button onClick={onClose} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Article body */}
          <div style={{ padding: '32px 40px', direction: 'rtl' }}>
            {guide.body.map((block, i) => {
              if (block.type === 'h') return (
                <h3 key={i} style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1C', marginTop: 32, marginBottom: 8 }}>{block.text}</h3>
              );
              if (block.type === 'table') return (
                <div key={i} style={{ overflowX: 'auto', marginTop: 24, marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, direction: 'rtl' }}>
                    <thead>
                      <tr style={{ background: '#F4F4F0', borderBottom: '2px solid #E8A020' }}>
                        {block.headers.map((h, hi) => (
                          <th key={hi} style={{ padding: '10px 14px', fontWeight: 700, color: '#1C1C1C', textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid #E8E8E4', background: ri % 2 === 1 ? '#FAFAF8' : '#fff' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: '10px 14px', color: '#444', lineHeight: 1.5 }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
              if (block.type === 'tip') return (
                <div key={i} style={{ background: 'rgba(232,160,32,0.08)', borderRight: '4px solid #E8A020', borderRadius: 8, padding: 20, marginTop: 24 }}>
                  <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: 0 }}><span style={{ fontWeight: 700, color: '#E8A020', marginLeft: 6 }}>💡</span>{block.text}</p>
                </div>
              );
              return (
                <p key={i} style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginBottom: 12 }}>
                  {renderParagraph(block.text, block.links)}
                </p>
              );
            })}

            {/* CTA */}
            <div style={{ background: '#1A1A1A', borderRadius: 12, padding: 28, textAlign: 'center', marginTop: 40 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>צריך עזרה בתכנון?</p>
              <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, fontWeight: 500, marginBottom: 20 }}>שלח לנו הודעה ומהנדס התאורה שלנו יחזור אליך תוך שעות.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('שלום LEDLink, קראתי את המדריך ואשמח לעזרה בתכנון התאורה שלי.')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
                  <WaIcon /> שלח WhatsApp
                </a>
                {guide.catalogLink && (
                  <a href={guide.catalogLink}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E8A020', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                    {guide.catalogLabel}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
