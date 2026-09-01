// src/tools/components/ToolsNavbar.jsx
import { useState } from 'react';
import { TOOLS } from './TabBar';

const CATALOG = [
  { label: 'דרייברים',   url: 'catalog.html?tab=דרייברים'  },
  { label: 'סטריפ LED',  url: 'catalog.html?tab=סטריפ LED' },
  { label: 'פרופילים',   url: 'catalog.html?tab=פרופילים'  },
  { label: 'גופי תאורה ✦', url: 'catalog.html?tab=גופי תאורה'},
];

const dropBox = {
  position: 'absolute', top: '100%', right: 0,
  background: '#1A1A1A', border: '1px solid #333',
  borderTop: '2px solid #E8A020', borderRadius: '0 0 8px 8px',
  minWidth: 190, zIndex: 200, padding: '6px 0',
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
};

export default function ToolsNavbar({ onGoToTool }) {
  const [openDrop, setOpenDrop] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav style={{ background: '#1A1A1A', borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0, zIndex: 100, height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 32, width: '100%' }}>
          <a href="index.html" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', flexShrink: 0, direction: 'ltr' }}>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1, color: '#E8A020' }}>LED</span>
            <span style={{ fontSize: 22, fontWeight: 300, color: '#FFFFFF' }}>Link</span>
          </a>
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* קטלוג מוצרים dropdown */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDrop('catalog')} onMouseLeave={() => setOpenDrop(null)}>
              <a href="catalog.html" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 }}>
                קטלוג מוצרים <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: openDrop === 'catalog' ? 'rotate(180deg)' : 'none' }}>▾</span>
              </a>
              {openDrop === 'catalog' && (
                <div style={dropBox}>
                  {CATALOG.map(item => (
                    <a key={item.url} href={item.url} className="nav-drop-item">{item.label}</a>
                  ))}
                </div>
              )}
            </div>

            {/* כלי תכנון dropdown */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDrop('tools')} onMouseLeave={() => setOpenDrop(null)}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#E8A020', background: 'rgba(232,160,32,0.1)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, padding: '6px 14px', borderRadius: 6, fontFamily: 'Heebo,sans-serif' }}>
                כלי תכנון <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: openDrop === 'tools' ? 'rotate(180deg)' : 'none' }}>▾</span>
              </button>
              {openDrop === 'tools' && (
                <div style={dropBox}>
                  {TOOLS.map(item => (
                    <button key={item.id} className="nav-drop-item" onClick={() => { onGoToTool(item.id); setOpenDrop(null); }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a href="guides.html" style={{ color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 }}>מדריכים</a>
            <a href="about.html" style={{ color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 }}>אודות</a>
            <a href="index.html#contact" style={{ color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 }}>צור קשר</a>
          </div>
          <div style={{ flex: 1 }}></div>
          <button className={menuOpen ? 'hamburger open' : 'hamburger'} aria-label="תפריט" onClick={() => setMenuOpen(m => !m)}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={menuOpen ? 'mm-overlay open' : 'mm-overlay'} onClick={() => setMenuOpen(false)}></div>

      {/* Mobile Menu Drawer */}
      <div className={menuOpen ? 'mobile-menu open' : 'mobile-menu'}>
        <div className="mm-header">
          <div style={{ direction: 'ltr', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#E8A020' }}>LED</span>
            <span style={{ fontSize: 18, fontWeight: 300, color: '#fff' }}>LINK</span>
          </div>
          <button className="mm-close" onClick={() => setMenuOpen(false)} aria-label="סגור">✕</button>
        </div>
        <div className="mm-label">קטלוג</div>
        <a href="catalog.html" className="mm-link">קטלוג מוצרים</a>
        <a href="catalog.html?tab=דרייברים" className="mm-link sub">דרייברים</a>
        <a href="catalog.html?tab=סטריפ LED" className="mm-link sub">סטריפ LED</a>
        <a href="catalog.html?tab=פרופילים" className="mm-link sub">פרופילים</a>
        <a href="catalog.html?tab=גופי תאורה" className="mm-link sub" style={{ color: '#E8A020' }}>גופי תאורה ✦</a>
        <div className="mm-divider"></div>
        <div className="mm-label">כלים ומדריכים</div>
        <span className="mm-link active" style={{ cursor: 'default' }}>כלי תכנון</span>
        {TOOLS.map(item => {
          const ItemIc = item.Icon;
          return (
            <a key={item.id} className="mm-link sub" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => { onGoToTool(item.id); setMenuOpen(false); }}>
              <ItemIc s={13} />
              {item.label}
            </a>
          );
        })}
        <a href="guides.html" className="mm-link">מדריכים</a>
        <div className="mm-divider"></div>
        <a href="about.html" className="mm-link">אודות</a>
        <a href="index.html#contact" className="mm-link" onClick={() => setMenuOpen(false)}>צור קשר</a>
      </div>
    </>
  );
}
