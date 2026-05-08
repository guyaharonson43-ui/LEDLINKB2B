// src/tools/App.jsx
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import ToolsNavbar from './components/ToolsNavbar';
import ToolsFooter from './components/ToolsFooter';
import TabBar, { TOOLS } from './components/TabBar';
import { WA_NUMBER, WaIcon } from './components/ContactRow';

const VoltageDropCalc   = lazy(() => import('./components/VoltageDropCalc'));
const LumenCalc         = lazy(() => import('./components/LumenCalc'));
const EnergyCalc        = lazy(() => import('./components/EnergyCalc'));
const BeamLinearCalc    = lazy(() => import('./components/BeamLinearCalc'));
const CircadianCalc     = lazy(() => import('./components/CircadianCalc'));
const LinearProfileCalc = lazy(() => import('./components/LinearProfileCalc'));
const PowerCalc         = lazy(() => import('./components/PowerCalc'));

export default function App() {
  const [tool, setTool] = useState(() => {
    const t = new URLSearchParams(window.location.search).get('tool');
    return TOOLS.find(x => x.id === t) ? t : 'voltage';
  });
  const [lumenPreset,  setLumenPreset]  = useState(null);
  const [linearPreset, setLinearPreset] = useState(null);
  const tabsRef = useRef(null);

  const goToTool = (id) => {
    setTool(id);
    const url = new URL(window.location.href);
    url.searchParams.set('tool', id);
    window.history.pushState({ tool: id }, '', url.toString());
  };

  useEffect(() => {
    if (!tabsRef.current) return;
    const active = tabsRef.current.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [tool]);

  useEffect(() => {
    const initId = new URLSearchParams(window.location.search).get('tool') || 'voltage';
    window.history.replaceState({ tool: initId }, '', window.location.href);

    const onPop = (e) => {
      const id = (e.state && e.state.tool)
        || new URLSearchParams(window.location.search).get('tool')
        || 'voltage';
      setTool(id);
      setLumenPreset(null);
      setLinearPreset(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F0' }}>
      <ToolsNavbar onGoToTool={goToTool} />

      {/* Page header */}
      <div style={{ background: '#1A1A1A', padding: '48px 32px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: '#E8A020', marginBottom: 12 }}>LEDLink · רחובות</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 12 }}>
            כלי תכנון הנדסיים
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.9)', fontWeight: 500, lineHeight: 1.7, maxWidth: 520 }}>
            חשב, תכנן, קבל הצעת מחיר — הכל במקום אחד. הכלים חינמיים ומיועדים לאנשי מקצוע ובעלי בתים.
          </p>
        </div>
      </div>

      <TabBar tool={tool} onGoToTool={goToTool} tabsRef={tabsRef} />

      {/* Tool content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {/* Disclaimer banner */}
        <div className="rounded-lg border p-4 mb-6 flex gap-3 items-start"
          style={{ background: '#fffbf0', borderColor: 'rgba(232,160,32,0.4)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4880A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: '#C4880A' }}>כלי תכנון — להערכה ראשונית בלבד</p>
            <p className="text-xs leading-relaxed" style={{ color: '#5a4a1a' }}>
              החישובים מבוססים על נוסחאות תקן EN 12464 עם פרמטרים ממוצעים. התוצאות אינן תחליף לתכנון תאורה מקצועי ואינן מהוות התחייבות מצד LEDLink לתוצאות בשטח.
            </p>
          </div>
        </div>

        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#888' }}>טוען...</div>}>
          {tool === 'voltage'     && <VoltageDropCalc />}
          {tool === 'lumen'       && <LumenCalc
            preset={lumenPreset}
            onGoBack={lumenPreset ? () => { setLumenPreset(null); goToTool('circadian'); } : null}
            fromLabel="מחשבון ביולוגי"
            onGoToLinear={(p) => { setLinearPreset(p); goToTool('linear'); }}
          />}
          {tool === 'roi'         && <EnergyCalc />}
          {tool === 'beam-linear' && <BeamLinearCalc />}
          {tool === 'circadian'   && <CircadianCalc onGoToLumen={(room) => { setLumenPreset(room); goToTool('lumen'); }} />}
          {tool === 'linear'      && <LinearProfileCalc
            preset={linearPreset}
            onGoBack={linearPreset ? () => { setLinearPreset(null); goToTool('lumen'); } : null}
            fromLabel="מחשבון לומן לחלל"
          />}
          {tool === 'power'       && <PowerCalc />}
        </Suspense>
      </div>

      <ToolsFooter />

      {/* WhatsApp float */}
      <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" className="wa-float" aria-label="פתח שיחת WhatsApp">
        <WaIcon />
      </a>
    </div>
  );
}
