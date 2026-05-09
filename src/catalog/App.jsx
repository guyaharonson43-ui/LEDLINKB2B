import { useState, useEffect, useMemo, useCallback } from 'react';
import { cleanName, trackEvent }    from './utils/helpers';
import { getStripMeta }             from './utils/stripMeta';
import {
  INIT_STRIP, INIT_PS,
  STRIP_POWER_RANGES, STRIP_LMW_RANGES,
  PS_POWER_RANGES,
} from './utils/filterConstants';
import Navbar            from './components/Navbar';
import CategoryHeader    from './components/CategoryHeader';
import ProductCard       from './components/ProductCard';
import StripFilters      from './components/StripFilters';
import DriverFilters     from './components/DriverFilters';
import ProfileFilters    from './components/ProfileFilters';
import SkeletonCard      from './components/SkeletonCard';
import Footer            from './components/Footer';
import { Icons }         from './components/Icons';
import ProductModal      from './components/ProductModal';
import ConfiguratorModal from './components/ConfiguratorModal';

const TABS = [
  { id: 'דרייברים',  label: 'דרייברים',  desc: 'ספקי מתח LED מאירופה — קבוע מתח, קבוע זרם, עמעום' },
  { id: 'סטריפ LED', label: 'סטריפ LED', desc: 'סטריפ LED באיכות גבוהה לכל שימוש — COB, Neon, RGB ועוד' },
  { id: 'פרופילים',  label: 'פרופילים',  desc: 'פרופילי אלומיניום לסטריפ LED — ייצור בהזמנה אישית' },
];

const PAGE_SIZE = 30;

export default function App() {
  const [products, setProducts]           = useState([]);
  const [activeTab, setActiveTab]         = useState('דרייברים');
  const [selected, setSelected]           = useState(null);
  const [search, setSearch]               = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ledlink_recent_searches') || '[]'); }
    catch { return []; }
  });
  const [stripF, setStripF]     = useState({ ...INIT_STRIP });
  const [psF, setPsF]           = useState({ ...INIT_PS });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCfg, setShowCfg]   = useState(false);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load products dynamically — keeps products_data out of the main bundle
  useEffect(() => {
    import('../../products_data').then(m => {
      const params  = new URLSearchParams(window.location.search);
      const loaded  = m.default.map(p => ({ ...p, name: cleanName(p.name) }));
      setProducts(loaded);
      setLoading(false);

      const productId = params.get('product');
      if (productId) {
        const found = loaded.find(p => p.id === decodeURIComponent(productId));
        if (found) { setSelected(found); setActiveTab(found.category); }
      }

      const tab     = params.get('tab');
      const initTab = tab || 'דרייברים';
      if (tab) setActiveTab(tab);
      window.history.replaceState({ tab: initTab }, '', window.location.href);
    });
  }, []);

  // Browser back/forward
  useEffect(() => {
    const onPop = e => {
      const id = (e.state && e.state.tab)
        || new URLSearchParams(window.location.search).get('tab')
        || 'דרייברים';
      setActiveTab(id);
      setSearch('');
      setStripF({ ...INIT_STRIP });
      setPsF({ ...INIT_PS });
      setPage(1);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const saveSearch = useCallback(q => {
    q = (q || '').trim();
    if (q.length < 2) return;
    setRecentSearches(prev => {
      const next = [q, ...prev.filter(s => s !== q)].slice(0, 5);
      localStorage.setItem('ledlink_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRecent = useCallback(q => {
    setRecentSearches(prev => {
      const next = prev.filter(s => s !== q);
      localStorage.setItem('ledlink_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const switchTab = useCallback(id => {
    setActiveTab(id);
    setSearch('');
    setStripF({ ...INIT_STRIP });
    setPsF({ ...INIT_PS });
    setSidebarOpen(false);
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    window.history.pushState({ tab: id }, '', url.toString());
  }, []);

  const filtered = useMemo(() => {
    let r = products.filter(p => p.category === activeTab);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q));
    }

    if (activeTab === 'סטריפ LED') {
      r = r.filter(p => {
        const m = getStripMeta(p);
        if (stripF.ip !== 'הכל' && m.ip !== stripF.ip) return false;
        if (stripF.type !== 'הכל' && m.type !== stripF.type) return false;
        if (stripF.color !== 'הכל' && m.color !== stripF.color) return false;
        if (stripF.voltage !== 'הכל' && m.voltage !== stripF.voltage) return false;
        if (stripF.power !== 'הכל') {
          const range = STRIP_POWER_RANGES.find(x => x.label === stripF.power);
          if (range && (m.power === null || m.power < range.min || m.power > range.max)) return false;
        }
        if (stripF.lmw !== 'הכל') {
          const lmwM = (p.desc || '').match(/(\d+(?:\.\d+)?)\s*Lm\/W/i);
          const val  = lmwM ? parseFloat(lmwM[1]) : null;
          const range = STRIP_LMW_RANGES.find(x => x.label === stripF.lmw);
          if (range && (val === null || val < range.min || val > range.max)) return false;
        }
        return true;
      });
    }

    if (activeTab === 'דרייברים') {
      r = r.filter(p => {
        const s = p.specs || {};
        if (psF.smartType === 'מוצרים חכמים') {
          const dimming = s.dimming || [];
          if (!dimming.some(d => /ZIGBEE|BLE|RF|SMART/i.test(d))) return false;
        }
        if (psF.smartType === 'קונברטורים') {
          if (!p.name.toUpperCase().includes('INTERFACE')) return false;
        }
        if (psF.voltage !== 'הכל') {
          if (s.outputMode === 'CC') return false;
          if (s.voltage !== psF.voltage) return false;
        }
        if (psF.inputVoltage !== 'הכל' && s.inputVoltage !== psF.inputVoltage) return false;
        if (psF.ip !== 'הכל' && s.ip !== psF.ip) return false;
        if (psF.output !== 'הכל') {
          if (psF.output === 'DMX')  { if (!(s.dimming || []).includes('DMX') && s.outputMode !== 'DMX') return false; }
          else if (psF.output === 'DALI') { if (s.outputMode !== 'DALI') return false; }
          else { if (s.outputMode !== psF.output) return false; }
        }
        if (psF.dimming !== 'הכל' && !(s.dimming || []).some(d => d.toLowerCase().includes(psF.dimming.toLowerCase()))) return false;
        if (psF.power !== 'הכל') {
          const range = PS_POWER_RANGES.find(x => x.label === psF.power);
          const pw    = s.power ? parseFloat(s.power) : null;
          if (range && (pw === null || pw < range.min || pw > range.max)) return false;
        }
        return true;
      });
    }

    return r;
  }, [products, activeTab, search, stripF, psF]);

  const activeFilterCount = useMemo(() => {
    if (activeTab === 'סטריפ LED') return Object.values(stripF).filter(v => v !== 'הכל').length;
    if (activeTab === 'דרייברים')  return Object.values(psF).filter(v => v !== 'הכל').length;
    return 0;
  }, [activeTab, stripF, psF]);

  useEffect(() => { setPage(1); }, [filtered]);

  const visibleProducts = filtered.slice(0, page * PAGE_SIZE);
  const hasMore         = visibleProducts.length < filtered.length;

  const openProduct = useCallback(p => {
    trackEvent('product_view', { product_id: p.id, product_name: p.name, category: p.category });
    setSelected(p);
  }, []);

  const tabInfo    = TABS.find(t => t.id === activeTab);
  const showFilters = activeTab !== 'פרופילים';

  const renderSidebar = () => {
    if (activeTab === 'פרופילים') return <ProfileFilters count={filtered.length} />;
    if (activeTab === 'סטריפ LED') return <StripFilters filters={stripF} setFilters={setStripF} count={filtered.length} />;
    if (activeTab === 'דרייברים')  return <DriverFilters filters={psF}    setFilters={setPsF}    count={filtered.length} />;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F0' }}>
      <Navbar activeTab={activeTab} setActiveTab={switchTab} onOpenConfigurator={() => setShowCfg(true)} />

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid #E0DDD6', background: '#FFFFFF', position: 'sticky', top: 64, zIndex: 90, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div role="tablist" aria-label="קטגוריות מוצרים"
          style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0 }}>
          {TABS.map(t => {
            const cnt    = products.filter(p => p.category === t.id).length;
            const active = activeTab === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active} id={`tab-${t.id}`}
                aria-controls="products-panel"
                onClick={() => switchTab(t.id)} className="tab-button"
                style={{ padding: '16px 24px', border: 'none', borderBottom: active ? '2px solid #E8A020' : '2px solid transparent',
                  background: 'none', cursor: 'pointer', color: active ? '#1C1C1C' : '#595959',
                  fontFamily: 'Heebo,sans-serif', fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8 }}>
                {t.label}
                <span style={{ fontSize: 11, background: active ? 'rgba(232,160,32,0.12)' : '#F0EDE8',
                  color: active ? '#1C1C1C' : '#595959', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="catalog-content-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        <CategoryHeader label={tabInfo.label} count={filtered.length} desc={tabInfo.desc} />

        {/* Search + mobile filter button */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <input
              type="text"
              aria-label={`חיפוש ב${tabInfo.label}`}
              placeholder={`חיפוש ב${tabInfo.label}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => saveSearch(search)}
              onKeyDown={e => e.key === 'Enter' && saveSearch(search)}
              className="search-input"
            />
            {search && (
              <button onClick={() => { saveSearch(search); setSearch(''); }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA',
                  padding: 4, display: 'flex', alignItems: 'center', lineHeight: 1 }}
                aria-label="נקה חיפוש">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#BBBBBB', pointerEvents: 'none' }}>
              {Icons.search}
            </span>
          </div>

          {showFilters && (
            <button onClick={() => setSidebarOpen(o => !o)}
              className={`mobile-filter-btn${activeFilterCount > 0 ? ' has-filters' : ''}`}
              aria-expanded={sidebarOpen} aria-controls="mobile-filter-panel"
              id="mobile-filter-btn">
              {Icons.filter}
              סינון
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>
          )}
        </div>

        {/* Recent searches */}
        {!search && recentSearches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#595959', flexShrink: 0 }}>חיפושים אחרונים:</span>
            {recentSearches.map(q => (
              <span key={q} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setSearch(q)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFFFFF',
                    border: '1px solid #E0DDD6', borderRadius: 20, padding: '3px 10px 3px 10px',
                    fontSize: 12, color: '#555555', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                  {q}
                </button>
                <button onClick={() => removeRecent(q)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#767676',
                    padding: 0, display: 'flex', alignItems: 'center' }}
                  aria-label={`הסר חיפוש ${q}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Layout: sidebar + grid */}
        <div className={showFilters ? 'catalog-layout with-sidebar' : 'catalog-layout no-sidebar'}>

          {/* Desktop sidebar */}
          {showFilters && (
            <div className="sidebar-mobile-hidden"
              style={{ background: '#FFFFFF', border: '1px solid #E0DDD6', borderRadius: 10,
                padding: '24px 20px', position: 'sticky', top: 130, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #E8E5E0' }}>
                <span style={{ color: '#E8A020' }}>{Icons.filter}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1C' }}>סינון</span>
              </div>
              {renderSidebar()}
            </div>
          )}

          {/* Mobile filter drawer */}
          {showFilters && sidebarOpen && (
            <div className="mobile-filter-drawer">
              <div className="mobile-filter-backdrop" onClick={() => setSidebarOpen(false)} />
              <div id="mobile-filter-panel" className="mobile-filter-panel"
                role="dialog" aria-modal="true" aria-label="סינון מוצרים">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #E8E5E0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#E8A020' }}>{Icons.filter}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1C' }}>סינון</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} aria-label="סגור סינון"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#888', padding: '0 4px', lineHeight: 1 }}>
                    ×
                  </button>
                </div>
                {renderSidebar()}
                <button onClick={() => setSidebarOpen(false)}
                  style={{ width: '100%', marginTop: 20, padding: '14px', background: '#E8A020',
                    color: '#1C1C1C', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'Heebo, sans-serif' }}>
                  הצג {filtered.length} מוצרים
                </button>
              </div>
            </div>
          )}

          {/* Products + configurator CTA */}
          <div id="products-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'דרייברים' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'הכל', value: 'הכל' },
                  { label: 'מוצרים חכמים', value: 'מוצרים חכמים' },
                  { label: 'קונברטורים', value: 'קונברטורים' },
                ].map(({ label, value }) => (
                  <button key={value} onClick={() => setPsF(f => ({ ...f, smartType: value }))}
                    style={{
                      padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      fontFamily: 'Heebo, sans-serif', cursor: 'pointer', transition: 'all 0.15s',
                      border: psF.smartType === value ? 'none' : '1.5px solid #E0DDD6',
                      background: psF.smartType === value ? '#1C1C1C' : '#FFFFFF',
                      color: psF.smartType === value ? '#FFFFFF' : '#595959',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'פרופילים' && (
              <div style={{ marginBottom: 24, background: '#FFFFFF', border: '1px solid #E0DDD6',
                borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <ProfileFilters count={filtered.length} />
                <div className="cfg-cta-card" role="button" tabIndex={0}
                  onClick={() => setShowCfg(true)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setShowCfg(true)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, background: 'rgba(232,160,32,0.15)', borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>✏️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1C', marginBottom: 3 }}>תכנן פרופיל בהתאמה אישית</div>
                      <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.4 }}>שרטוט מידות, בחירת גימור ו-BOM אוטומטי — ארבעה שלבים פשוטים</div>
                    </div>
                    <div style={{ color: '#E8A020', fontSize: 22, flexShrink: 0 }}>←</div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="products-grid">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#BBBBBB' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>◯</div>
                <div style={{ fontSize: 16, color: '#888888' }}>לא נמצאו מוצרים</div>
                <button onClick={() => { setSearch(''); setStripF({ ...INIT_STRIP }); setPsF({ ...INIT_PS }); }}
                  style={{ marginTop: 16, color: '#E8A020', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                  נקה סינון
                </button>
              </div>
            ) : (
              <div>
                <div className="products-grid">
                  {visibleProducts.map(p => <ProductCard key={p.id} product={p} onClick={openProduct} />)}
                </div>
                {hasMore && (
                  <div style={{ textAlign: 'center', padding: '32px 0 16px' }}>
                    <button onClick={() => setPage(p => p + 1)}
                      style={{ background: '#1C1C1C', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                      הצג עוד ({filtered.length - visibleProducts.length} נותרו)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating WhatsApp */}
      <a href="https://wa.me/972524444470" target="_blank" rel="noopener noreferrer"
        className="wa-float" aria-label="פתח שיחת WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      </a>

      {/* Scroll-to-top */}
      <button id="scroll-top-btn" className={showScrollTop ? 'visible' : ''}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="חזרה לראש העמוד">↑</button>

      {selected && (
        <ProductModal product={selected} onClose={() => {
          setSelected(null);
          history.replaceState(null, '', location.pathname + (activeTab ? '?tab=' + encodeURIComponent(activeTab) : ''));
        }} />
      )}

      {showCfg && (
        <ConfiguratorModal onClose={() => setShowCfg(false)} />
      )}
    </div>
  );
}
