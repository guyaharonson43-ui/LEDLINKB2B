import Chip from './Chip';
import {
  STRIP_IP_OPTIONS, STRIP_TYPE_OPTIONS, STRIP_COLOR_OPTIONS, STRIP_VOLTAGE_OPTIONS,
  STRIP_POWER_RANGES, STRIP_LMW_RANGES, INIT_STRIP,
} from '../utils/filterConstants';

export default function StripFilters({ filters, setFilters, count }) {
  const hasActive = Object.values(filters).some(v => v !== 'הכל');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#999999' }}>{count} מוצרים</span>
        {hasActive && (
          <button onClick={() => setFilters({ ...INIT_STRIP })}
            style={{ fontSize: 12, color: '#E8A020', background: 'none', border: 'none', cursor: 'pointer' }}>
            איפוס
          </button>
        )}
      </div>

      {[
        { title: 'סוג',       options: STRIP_TYPE_OPTIONS,    key: 'type'    },
        { title: 'מתח',       options: STRIP_VOLTAGE_OPTIONS, key: 'voltage' },
        { title: 'הגנה (IP)', options: STRIP_IP_OPTIONS,      key: 'ip'      },
        { title: 'צבע',       options: STRIP_COLOR_OPTIONS,   key: 'color'   },
      ].map(({ title, options, key }) => (
        <div key={key} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {options.map(v => (
              <Chip key={v} label={v} active={filters[key] === v} onClick={() => setFilters(f => ({ ...f, [key]: v }))} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>הספק (W/m)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STRIP_POWER_RANGES.map(r => (
            <Chip key={r.label} label={r.label} active={filters.power === r.label} onClick={() => setFilters(f => ({ ...f, power: r.label }))} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>לומן/וואט</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STRIP_LMW_RANGES.map(r => (
            <Chip key={r.label} label={r.label} active={filters.lmw === r.label} onClick={() => setFilters(f => ({ ...f, lmw: r.label }))} />
          ))}
        </div>
      </div>
    </div>
  );
}
