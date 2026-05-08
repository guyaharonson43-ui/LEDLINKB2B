// src/tools/components/TabBar.jsx
const Ic = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: 'block' }}>
    {children}
  </svg>
);
const IcVoltage   = ({ s = 16 }) => <Ic size={s}><path d="m13 2-10 12h9l-1 8 10-12h-9l1-8z"/></Ic>;
const IcLumen     = ({ s = 16 }) => <Ic size={s}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></Ic>;
const IcRoi       = ({ s = 16 }) => <Ic size={s}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></Ic>;
const IcBeam      = ({ s = 16 }) => <Ic size={s}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></Ic>;
const IcCircadian = ({ s = 16 }) => <Ic size={s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Ic>;
const IcLinear    = ({ s = 16 }) => <Ic size={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ic>;
const IcPower     = ({ s = 16 }) => <Ic size={s}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></Ic>;

export const TOOLS = [
  { id: 'voltage',     label: 'מפל מתח',       Icon: IcVoltage   },
  { id: 'lumen',       label: 'לומן לחלל',      Icon: IcLumen     },
  { id: 'roi',         label: 'חיסכון אנרגיה',  Icon: IcRoi       },
  { id: 'beam-linear', label: 'פיזור אלומה',    Icon: IcBeam      },
  { id: 'circadian',   label: 'מחשבון ביולוגי', Icon: IcCircadian },
  { id: 'linear',      label: 'פרופיל LED',     Icon: IcLinear    },
  { id: 'power',       label: 'ספק כוח',        Icon: IcPower     },
];

export default function TabBar({ tool, onGoToTool, tabsRef }) {
  return (
    <div style={{ borderBottom: '1px solid #E0DDD6', background: '#FFFFFF', position: 'sticky', top: 64, zIndex: 90, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Desktop: scrollable tabs */}
        <div className="tabs-fade-wrap">
          <div ref={tabsRef} className="tabs-scroll" style={{ padding: '0 24px', display: 'flex', gap: 0 }}>
            {TOOLS.map(t => {
              const ToolIc = t.Icon;
              return (
                <button key={t.id} onClick={() => onGoToTool(t.id)}
                  data-active={tool === t.id ? 'true' : 'false'}
                  style={{
                    padding: '14px 16px', border: 'none',
                    borderBottom: tool === t.id ? '2px solid #E8A020' : '2px solid transparent',
                    background: 'none', cursor: 'pointer',
                    color: tool === t.id ? '#E8A020' : '#888888',
                    fontFamily: 'Heebo,sans-serif', fontSize: 13,
                    fontWeight: tool === t.id ? 700 : 500,
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <ToolIc s={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* Mobile: select dropdown */}
        <div className="tool-select-wrap" style={{ padding: '10px 16px' }}>
          <select className="tool-select" value={tool} onChange={e => onGoToTool(e.target.value)}>
            {TOOLS.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
