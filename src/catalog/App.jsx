import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cleanName, trackEvent }    from './utils/helpers';
import { getStripMeta }             from './utils/stripMeta';
import {
  INIT_STRIP, INIT_PS, INIT_TRACK,
  STRIP_POWER_RANGES, STRIP_LMW_RANGES,
  TRACK_TYPE_OPTIONS, TRACK_SUBCATEGORY, SUBCATEGORY_ALIASES,
} from './utils/filterConstants';
import { GROUPS }                          from './utils/driverMeta';
import { buildDriverFacets, matchesDriver } from './utils/driverFacets';
import Navbar            from './components/Navbar';
import CategoryHeader    from './components/CategoryHeader';
import ProductCard       from './components/ProductCard';
import StripFilters      from './components/StripFilters';
import DriverFilters     from './components/DriverFilters';
import ProfileFilters    from './components/ProfileFilters';
import TrackFilters      from './components/TrackFilters';
import SkeletonCard      from './components/SkeletonCard';
import Footer            from './components/Footer';
import { Icons }         from './components/Icons';
import ProductModal      from './components/ProductModal';
import ConfiguratorModal from './components/ConfiguratorModal';
import productsDataRaw   from '../../products_data_with_lighting';

// Pre-process once at module init — products are available before first render
const allProducts = productsDataRaw.map(p => ({ ...p, name: cleanName(p.name) }));

const TABS = [
  { id: 'דרייברים',    label: 'דרייברים',    desc: 'ספקי מתח LED מאירופה — מתח קבוע, זרם קבוע, עמעום' },
  { id: 'סטריפ LED',  label: 'סטריפ LED',   desc: 'סטריפ LED באיכות גבוהה לכל שימוש — COB, Neon, RGB ועוד' },
  { id: 'פרופילים',   label: 'פרופילים',    desc: 'פרופילי אלומיניום לסטריפ LED — ייצור בהזמנה אישית' },
  { id: 'גופי תאורה', label: 'גופי תאורה', desc: 'פסי צבירה, ספוטים ושקועים, בקרה וחיישנים' },
];

const LIGHTING_SUBCAT_ORDER = ['פסי צבירה מגנטים ומתח גבוה', 'ספוטים ושקועים', 'צמודי תקרה', 'גופי תלייה', 'בקרה וחיישנים'];

const PAGE_SIZE = 30;

// שם תת-הקטגוריה השתנה. קישורים עם ?sub= הישן כבר באוויר (sitemap, דף הבית,
// שיתופים של לקוחות) — ממפים אותם לשם החדש כדי שלא ייפלו ל"הכל".
const resolveSubCat = sub => (sub ? (SUBCATEGORY_ALIASES[sub] || sub) : sub);

export default function App() {
  const [products]              = useState(allProducts);
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const productId = p.get('product');
    if (productId) {
      const found = allProducts.find(q => q.id === decodeURIComponent(productId));
      if (found) return found.category;
    }
    const qParam = p.get('q');
    if (qParam) {
      const term = qParam.trim().toLowerCase();
      const match = allProducts.find(pr => pr.name.toLowerCase().includes(term) || (pr.desc || '').toLowerCase().includes(term));
      if (match) return match.category;
    }
    // Bare landing (e.g. hero "view catalog" button) — send visitors into an
    // approachable, visual category instead of the filter-heavy "דרייברים" tab.
    return p.get('tab') || 'גופי תאורה';
  });
  const [selected, setSelected] = useState(() => {
    const productId = new URLSearchParams(window.location.search).get('product');
    if (!productId) return null;
    return allProducts.find(p => p.id === decodeURIComponent(productId)) || null;
  });
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
  // כל חיפוש נשמר עם הקטגוריה שבה בוצע. החיפוש עצמו מסונן לפי הקטגוריה
  // הפעילה, ולכן חיפוש מקטגוריה אחרת מחזיר תמיד אפס תוצאות — הצגתו
  // בקטגוריה הנוכחית רק מטעה. רשומות בפורמט הישן (מחרוזות בלי קטגוריה)
  // נזרקות בטעינה, כי אי אפשר לדעת לאן הן שייכות.
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ledlink_recent_searches') || '[]');
      return Array.isArray(raw) ? raw.filter(r => r && typeof r === 'object' && r.q && r.tab) : [];
    } catch { return []; }
  });
  const [stripF, setStripF]     = useState({ ...INIT_STRIP });
  const [psF, setPsF]           = useState({ ...INIT_PS });
  const [lightingSubCat, setLightingSubCat] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('sub')) return resolveSubCat(p.get('sub'));
    if (!p.get('tab') && !p.get('q') && !p.get('product')) return TRACK_SUBCATEGORY;
    return 'הכל';
  });
  const [trackF, setTrackF] = useState(() => {
    const type = new URLSearchParams(window.location.search).get('type');
    return { type: TRACK_TYPE_OPTIONS.includes(type) ? type : 'הכל' };
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCfg, setShowCfg]   = useState(false);
  const [page, setPage]         = useState(1);
  const [loading]               = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Sync history state once on mount
  useEffect(() => {
    window.history.replaceState({ tab: activeTab }, '', window.location.href);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser back/forward
  useEffect(() => {
    const onPop = e => {
      const p   = new URLSearchParams(window.location.search);
      const id  = (e.state && e.state.tab) || p.get('tab') || 'גופי תאורה';
      const sub = resolveSubCat((e.state && e.state.sub) || p.get('sub')) || 'הכל';
      setActiveTab(id);
      setLightingSubCat(sub);
      setSearch('');
      setStripF({ ...INIT_STRIP });
      setPsF({ ...INIT_PS });
      setTrackF({ type: TRACK_TYPE_OPTIONS.includes(p.get('type')) ? p.get('type') : 'הכל' });
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

  const saveSearch = useCallback((q, tab) => {
    q = (q || '').trim();
    if (q.length < 2) return;
    setRecentSearches(prev => {
      // חמש רשומות אחרונות בסך הכול, על פני כל הקטגוריות
      const next = [{ q, tab }, ...prev.filter(r => !(r.q === q && r.tab === tab))].slice(0, 5);
      localStorage.setItem('ledlink_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRecent = useCallback((q, tab) => {
    setRecentSearches(prev => {
      const next = prev.filter(r => !(r.q === q && r.tab === tab));
      localStorage.setItem('ledlink_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const switchTab = useCallback(id => {
    setActiveTab(id);
    setSearch('');
    setStripF({ ...INIT_STRIP });
    setPsF({ ...INIT_PS });
    setTrackF({ ...INIT_TRACK });
    setLightingSubCat('הכל');
    setSidebarOpen(false);
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    url.searchParams.delete('sub');
    url.searchParams.delete('type');
    window.history.pushState({ tab: id }, '', url.toString());
  }, []);

  // החלפת תת-קטגוריה מאפסת את מיון פסי הצבירה — הצירים שלו רלוונטיים רק לתת-קטגוריה
  // אחת, והשארת בחירה "דביקה" בין קטגוריות מייצרת תוצאות ריקות בלי סיבה נראית לעין.
  const switchSubCat = useCallback((sc, tab) => {
    setLightingSubCat(sc);
    setTrackF({ ...INIT_TRACK });
    setSidebarOpen(false);
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    if (sc === 'הכל') url.searchParams.delete('sub');
    else url.searchParams.set('sub', sc);
    url.searchParams.delete('type');
    window.history.pushState({ tab, sub: sc }, '', url.toString());
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
        if (stripF.cri !== 'הכל') {
          const pCri = p.cri ?? null;
          const minCri = parseInt(stripF.cri.replace('>', ''), 10);
          if (pCri === null || pCri < minCri) return false;
        }
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

    // כל לוגיקת הסינון של הדרייברים יושבת ב-driverFacets, כדי שאותו כלל
    // בדיוק ישרת גם את הסינון וגם את חישוב המונים שליד כל צ'יפ.
    if (activeTab === 'דרייברים') {
      r = r.filter(p => matchesDriver(p, psF));
    }

    if (activeTab === 'גופי תאורה') {
      if (lightingSubCat !== 'הכל') r = r.filter(p => p.subCategory === lightingSubCat);
      if (lightingSubCat === TRACK_SUBCATEGORY) {
        if (trackF.type !== 'הכל') r = r.filter(p => p.trackType === trackF.type);
      }
    }

    return r;
  }, [products, activeTab, search, stripF, psF, lightingSubCat, trackF]);

  const showTrackFilters = activeTab === 'גופי תאורה' && lightingSubCat === TRACK_SUBCATEGORY;

  // בסיס המיון: כל מוצרי תת-הקטגוריה אחרי החיפוש החופשי בלבד, לפני שני צירי המיון.
  const trackBase = useMemo(() => {
    if (!showTrackFilters) return [];
    const q = search.trim().toLowerCase();
    return products.filter(p =>
      p.category === 'גופי תאורה' &&
      p.subCategory === TRACK_SUBCATEGORY &&
      // סופר כרטיסים ולא מק"טים, כדי שהמונה בצ'יפ יתאים למספר הכרטיסים
      // שבאמת יוצגו אחרי הלחיצה
      (!p.variantFamily || p.variantPrimary) &&
      (!q || p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q))
    );
  }, [products, showTrackFilters, search]);

  // מונה לכל צ'יפ — מספר התוצאות שיתקבלו אם ילחצו עליו.
  const trackCounts = useMemo(() => trackBase.reduce((acc, p) => {
    if (p.trackType) acc[p.trackType] = (acc[p.trackType] || 0) + 1;
    return acc;
  }, {}), [trackBase]);

  // כל הדרייברים אחרי החיפוש החופשי בלבד — הבסיס שממנו נבנים הצירים והמונים,
  // לפני שהצירים עצמם מסננים. אחרת כל בחירה הייתה מוחקת את שאר האפשרויות.
  const driverBase = useMemo(() => {
    let r = products.filter(p => p.category === 'דרייברים');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q));
    }
    return r;
  }, [products, search]);

  const driverFacets = useMemo(() => buildDriverFacets(driverBase, psF), [driverBase, psF]);

  // הרמז השני: אם שורת הטאבים כן גולשת, הטאב הפעיל נגלל לתצוגה כדי
  // שלעולם לא ייחתך מחוץ למסך — הכשל שבגללו הגלילה בוטלה בפעם הקודמת.
  // inline: 'nearest' לא מזיז כלום כשהכול כבר נראה.
  const activeTabRef = useRef(null);
  useEffect(() => {
    const el = activeTabRef.current;
    if (!el?.parentElement) return;
    if (el.parentElement.scrollWidth <= el.parentElement.clientWidth) return;
    el.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  const tabRecentSearches = useMemo(
    () => recentSearches.filter(r => r.tab === activeTab).map(r => r.q),
    [recentSearches, activeTab]);

  const activeFilterCount = useMemo(() => {
    if (activeTab === 'סטריפ LED')   return Object.values(stripF).filter(v => v !== 'הכל').length;
    if (activeTab === 'דרייברים') {
      // group נבחר במתג שמעל הגריד ולא בסיידבר, ולכן אינו נספר כאן.
      return Object.entries(psF).filter(([k, v]) =>
        k !== 'group' && (Array.isArray(v) ? v.length > 0 : v !== 'הכל')).length;
    }
    if (activeTab === 'גופי תאורה') {
      return (lightingSubCat !== 'הכל' ? 1 : 0)
        + (showTrackFilters ? Object.values(trackF).filter(v => v !== 'הכל').length : 0);
    }
    return 0;
  }, [activeTab, stripF, psF, lightingSubCat, showTrackFilters, trackF]);

  // סנכרון ?type= לכתובת כדי שקישור למיון ספציפי יהיה ניתן לשיתוף.
  // replaceState ולא pushState — כדי שכל לחיצה על צ'יפ לא תיצור צעד נוסף בהיסטוריה.
  useEffect(() => {
    const url = new URL(window.location.href);
    const active = showTrackFilters && trackF.type !== 'הכל';
    if (active) {
      // הכתובת חייבת לתאר את עצמה במלואה — קישור עם ?type= בלבד לא ישחזר את
      // תת-הקטגוריה אצל מי שיפתח אותו, ולכן tab ו-sub נכתבים יחד איתו.
      url.searchParams.set('tab', activeTab);
      url.searchParams.set('sub', lightingSubCat);
      url.searchParams.set('type', trackF.type);
    } else {
      url.searchParams.delete('type');
    }
    if (url.toString() !== window.location.href) {
      window.history.replaceState(window.history.state, '', url.toString());
    }
  }, [showTrackFilters, trackF, activeTab, lightingSubCat]);

  useEffect(() => { setPage(1); }, [filtered]);

  // במסך צר שורת הטאבים נגללת אופקית, והטאב הפעיל עלול לשבת מחוץ לתצוגה —
  // בעיקר בכניסה עם ?tab= לקטגוריה האחרונה. block:'nearest' מונע מהדפדפן
  // לגלול גם אנכית ולדלג על ראש העמוד.
  useEffect(() => {
    const strip = document.querySelector('.tab-strip');
    if (!strip || strip.scrollWidth <= strip.clientWidth) return;
    const active = strip.querySelector('[aria-selected="true"]');
    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [activeTab]);

  // איחוד וריאנטים לכרטיס אחד. הקיבוץ קורה *אחרי* הסינון בכוונה: אם המשתמש
  // סינן 40W, הכרטיס יציג את וריאנט ה-40W כנציג ולא את ברירת המחדל.
  const cards = useMemo(() => {
    const out = [];
    const seen = new Map();
    for (const p of filtered) {
      if (!p.variantFamily) { out.push({ key: p.id, product: p, variants: null }); continue; }
      const hit = seen.get(p.variantFamily);
      if (hit) { hit.variants.push(p); continue; }
      const card = { key: p.variantFamily, product: p, variants: [p] };
      seen.set(p.variantFamily, card);
      out.push(card);
    }
    for (const c of out) {
      if (!c.variants) continue;
      c.variants.sort((a, b) => a.variantOrder - b.variantOrder);
      c.product = c.variants[0];
      if (c.variants.length === 1) c.variants = null;
    }
    return out;
  }, [filtered]);

  const visibleCards = cards.slice(0, page * PAGE_SIZE);
  const hasMore      = visibleCards.length < cards.length;

  const openProduct = useCallback(p => {
    trackEvent('product_view', { product_id: p.id, product_name: p.name, category: p.category });
    setSelected(p);
  }, []);

  // כל הווריאנטים של המשפחה הפתוחה. נגזר מ-products ולא מ-filtered — מי שפתח
  // מוצר צריך לראות את כל האפשרויות, גם כאלה שסינון פעיל הסתיר מהרשת.
  const selectedVariants = useMemo(() => {
    if (!selected || !selected.variantFamily) return null;
    return products
      .filter(p => p.variantFamily === selected.variantFamily)
      .sort((a, b) => a.variantOrder - b.variantOrder);
  }, [products, selected]);

  const tabInfo    = TABS.find(t => t.id === activeTab);
  const showFilters = activeTab !== 'פרופילים';

  const lightingSubCats = useMemo(() => {
    if (activeTab !== 'גופי תאורה') return [];
    const present = new Set(products.filter(p => p.category === 'גופי תאורה').map(p => p.subCategory).filter(Boolean));
    const ordered = LIGHTING_SUBCAT_ORDER.filter(sc => present.has(sc));
    const extra   = [...present].filter(sc => !LIGHTING_SUBCAT_ORDER.includes(sc));
    return ['הכל', ...ordered, ...extra];
  }, [products, activeTab]);

  const renderSidebar = () => {
    if (activeTab === 'פרופילים')   return <ProfileFilters count={filtered.length} />;
    if (activeTab === 'סטריפ LED')  return <StripFilters filters={stripF} setFilters={setStripF} count={filtered.length} />;
    if (activeTab === 'דרייברים')   return <DriverFilters filters={psF} setFilters={setPsF} facets={driverFacets} count={filtered.length} />;
    if (activeTab === 'גופי תאורה') return (
      <div style={{ padding: '20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', color: '#595959', marginBottom: 12 }}>קטגוריה</div>
        {lightingSubCats.map(sc => (
          <button key={sc} onClick={() => switchSubCat(sc, activeTab)} aria-pressed={lightingSubCat === sc}
            style={{ display: 'block', width: '100%', textAlign: 'right', background: 'none', border: 'none',
              padding: '8px 0', cursor: 'pointer', fontFamily: 'Heebo,sans-serif', fontSize: 14,
              color: lightingSubCat === sc ? '#E8A020' : '#1C1C1C', fontWeight: lightingSubCat === sc ? 700 : 400 }}>
            {sc}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F0' }}>
      <Navbar activeTab={activeTab} setActiveTab={switchTab} onOpenConfigurator={() => setShowCfg(true)} />

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid #E0DDD6', background: '#FFFFFF', position: 'sticky', top: 64, zIndex: 90, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div role="tablist" aria-label="קטגוריות מוצרים" className="tab-strip"
          style={{ maxWidth: 1280, margin: '0 auto' }}>
          {TABS.map(t => {
            // סופר כרטיסים ולא מק"טים, כדי שהמונה בטאב יתאים למה שנספר בכותרת
            // הקטגוריה ולמה שבאמת מוצג ברשת
            const cnt    = products.filter(p => p.category === t.id && (!p.variantFamily || p.variantPrimary)).length;
            const active = activeTab === t.id;
            // הפריסה כולה ב-CSS ולא ב-inline: במסך צר ארבעת הטאבים נערכים
            // מחדש לרשת של ארבע עמודות עם המונה מתחת לשם, וזה אפשרי רק אם
            // media query יכול לגעת בהם.
            return (
              <button key={t.id} role="tab" aria-selected={active} id={`tab-${t.id}`}
                aria-controls="products-panel"
                onClick={() => switchTab(t.id)}
                ref={active ? activeTabRef : null}
                className={active ? 'tab-button active' : 'tab-button'}>
                <span className="tab-label">{t.label}</span>
                <span className="tab-count">{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="catalog-content-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        <CategoryHeader label={tabInfo.label} count={cards.length} desc={tabInfo.desc} />

        {/* Search + mobile filter button */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <input
              type="text"
              aria-label={`חיפוש ב${tabInfo.label}`}
              placeholder={`חיפוש ב${tabInfo.label}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => saveSearch(search, activeTab)}
              onKeyDown={e => e.key === 'Enter' && saveSearch(search, activeTab)}
              className="search-input"
            />
            {search && (
              <button onClick={() => { saveSearch(search, activeTab); setSearch(''); }}
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

        {/* Recent searches — של הקטגוריה הנוכחית בלבד */}
        {!search && tabRecentSearches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#595959', flexShrink: 0 }}>חיפושים אחרונים:</span>
            {tabRecentSearches.map(q => (
              <span key={q} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setSearch(q)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFFFFF',
                    border: '1px solid #E0DDD6', borderRadius: 20, padding: '3px 10px 3px 10px',
                    fontSize: 12, color: '#555555', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                  {q}
                </button>
                <button onClick={() => removeRecent(q, activeTab)}
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

        {/* מיון פסי צבירה — בראש העמוד, צמוד מעל רשת התוצאות שהוא משנה */}
        {showTrackFilters && (
          <TrackFilters
            filters={trackF}
            setFilters={setTrackF}
            counts={trackCounts}
            total={trackBase.length}
          />
        )}

        {/* Layout: sidebar + grid */}
        <div className={showFilters ? 'catalog-layout with-sidebar' : 'catalog-layout no-sidebar'}>

          {/* Desktop sidebar */}
          {showFilters && (
            <div className="sidebar-mobile-hidden catalog-sidebar"
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
                  הצג {cards.length} מוצרים
                </button>
              </div>
            </div>
          )}

          {/* Products + configurator CTA */}
          <div id="products-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
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
                  {visibleCards.map((c, i) => (
                    <ProductCard key={c.key} product={c.product} variants={c.variants}
                      onClick={openProduct} priority={i === 0} />
                  ))}
                </div>
                {hasMore && (
                  <div style={{ textAlign: 'center', padding: '32px 0 16px' }}>
                    <button onClick={() => setPage(p => p + 1)}
                      style={{ background: '#1C1C1C', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                      הצג עוד ({cards.length - visibleCards.length} נותרו)
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
      <a href="https://wa.me/972504722550" target="_blank" rel="noopener noreferrer"
        className="wa-float" aria-label="פתח שיחת WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      </a>

      {/* Scroll-to-top */}
      <button id="scroll-top-btn" className={showScrollTop ? 'visible' : ''}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="חזרה לראש העמוד">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
      </button>

      {selected && (
        <ProductModal product={selected} variants={selectedVariants} onClose={() => {
          setSelected(null);
          // מסירים רק את ?product= — בנייה מחדש של הכתובת מאפסת גם את ?sub=/?type=
          // ומחזירה את המשתמש לתחילת הקטגוריה אחרי סגירת חלון מוצר.
          const url = new URL(window.location.href);
          url.searchParams.delete('product');
          if (activeTab) url.searchParams.set('tab', activeTab);
          history.replaceState(history.state, '', url.toString());
        }} />
      )}

      {showCfg && (
        <ConfiguratorModal onClose={() => setShowCfg(false)} />
      )}
    </div>
  );
}
