import { useState } from 'react';
import { Icons } from './Icons';

const CATALOG = [
  { label: 'דרייברים',  tab: 'דרייברים'  },
  { label: 'סטריפ LED', tab: 'סטריפ LED' },
  { label: 'פרופילים',  tab: 'פרופילים'  },
];

const TOOLS = [
  { label: '⚡ מפל מתח',        url: 'tools.html?tool=voltage'    },
  { label: '💡 לומן לחלל',      url: 'tools.html?tool=lumen'      },
  { label: '♻️ חיסכון אנרגיה', url: 'tools.html?tool=roi'        },
  { label: '📏 פיזור אלומה',    url: 'tools.html?tool=beam-linear' },
  { label: '🌙 מחשבון ביולוגי', url: 'tools.html?tool=circadian'  },
  { label: '📐 פרופיל LED',     url: 'tools.html?tool=linear'     },
  { label: '🔌 ספק כוח',        url: 'tools.html?tool=power'      },
];

const dropBox = {
  position: 'absolute', top: '100%', right: 0,
  background: '#1A1A1A', border: '1px solid #333',
  borderTop: '2px solid #E8A020', borderRadius: '0 0 8px 8px',
  minWidth: 190, zIndex: 200, padding: '6px 0',
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
};

export default function Navbar({ activeTab, setActiveTab, onOpenConfigurator }) {
  const [openDrop, setOpenDrop] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav style={{ background: '#1A1A1A', borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0, zIndex: 100, height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 32, width: '100%' }}>
          <a href="index.html" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', flexShrink: 0, direction: 'ltr' }}>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1, color: '#E8A020' }}>LED</span>
            <span style={{ fontSize: 22, fontWeight: 300, color: '#FFFFFF' }}>LINK</span>
          </a>

          <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Catalog dropdown */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDrop('catalog')} onMouseLeave={() => setOpenDrop(null)}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#E8A020', background: 'rgba(232,160,32,0.1)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, padding: '6px 14px', borderRadius: 6, fontFamily: 'Heebo,sans-serif' }}>
                קטלוג מוצרים <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: openDrop === 'catalog' ? 'rotate(180deg)' : 'none' }}>▾</span>
              </button>
              {openDrop === 'catalog' && (
                <div style={dropBox}>
                  {CATALOG.map(item => (
                    <button key={item.tab} className="nav-drop-item" onClick={() => { setActiveTab(item.tab); setOpenDrop(null); }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tools dropdown */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDrop('tools')} onMouseLeave={() => setOpenDrop(null)}>
              <a href="tools.html" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 }}>
                כלי תכנון <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: openDrop === 'tools' ? 'rotate(180deg)' : 'none' }}>▾</span>
              </a>
              {openDrop === 'tools' && (
                <div style={dropBox}>
                  {TOOLS.map(item => (
                    <a key={item.url} href={item.url} className="nav-drop-item">{item.label}</a>
                  ))}
                </div>
              )}
            </div>

            <a href="guides.html"       style={{ color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 }}>מדריכים</a>
            <a href="about.html"        style={{ color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 }}>אודות</a>
            <a href="index.html#contact" style={{ color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 }}>צור קשר</a>
          </div>

          <div style={{ flex: 1 }} />
          <button className={menuOpen ? 'hamburger open' : 'hamburger'} aria-label="תפריט" onClick={() => setMenuOpen(m => !m)}>
            <span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={menuOpen ? 'mm-overlay open' : 'mm-overlay'} onClick={() => setMenuOpen(false)} />

      {/* Mobile drawer */}
      <div className={menuOpen ? 'mobile-menu open' : 'mobile-menu'}>
        <div className="mm-header">
          <div style={{ direction: 'ltr', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#E8A020' }}>LED</span>
            <span style={{ fontSize: 18, fontWeight: 300, color: '#fff' }}>LINK</span>
          </div>
          <button className="mm-close" onClick={() => setMenuOpen(false)} aria-label="סגור">✕</button>
        </div>

        <div className="mm-label">קטלוג מוצרים</div>
        {CATALOG.map(item => (
          <span key={item.tab} className={activeTab === item.tab ? 'mm-link active' : 'mm-link'}
            onClick={() => { setActiveTab(item.tab); setMenuOpen(false); }}>
            {item.label}
          </span>
        ))}
        <span className="mm-link sub" style={{ color: '#E8A020', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => { setActiveTab('פרופילים'); onOpenConfigurator(); setMenuOpen(false); }}>
          ✏️ תכנן פרופיל בהתאמה אישית
        </span>

        <div className="mm-divider" />
        <div className="mm-label">כלים ומדריכים</div>
        <a href="tools.html"                    className="mm-link">כלי תכנון</a>
        <a href="tools.html?tool=voltage"       className="mm-link sub">⚡ מפל מתח</a>
        <a href="tools.html?tool=lumen"         className="mm-link sub">💡 לומן לחלל</a>
        <a href="tools.html?tool=roi"           className="mm-link sub">♻️ חיסכון אנרגיה</a>
        <a href="tools.html?tool=beam-linear"   className="mm-link sub">📏 פיזור אלומה</a>
        <a href="tools.html?tool=circadian"     className="mm-link sub">🌙 מחשבון ביולוגי</a>
        <a href="tools.html?tool=linear"        className="mm-link sub">📐 פרופיל LED</a>
        <a href="tools.html?tool=power"         className="mm-link sub">🔌 ספק כוח</a>
        <a href="guides.html"                   className="mm-link">מדריכים</a>

        <div className="mm-divider" />
        <a href="about.html"         className="mm-link">אודות</a>
        <a href="index.html#contact" className="mm-link" onClick={() => setMenuOpen(false)}>צור קשר</a>
      </div>
    </>
  );
}
