import Chip from './Chip';
import {
  PS_VOLTAGE_OPTIONS, PS_INPUT_VOLTAGE_OPTIONS, PS_IP_OPTIONS,
  PS_DIMMING_OPTIONS, PS_POWER_RANGES, INIT_PS,
} from '../utils/filterConstants';

export default function DriverFilters({ filters, setFilters, count }) {
  const hasActive = Object.values(filters).some(v => v !== 'הכל');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#595959' }}>{count} מוצרים</span>
        {hasActive && (
          <button onClick={() => setFilters({ ...INIT_PS })}
            style={{ fontSize: 12, color: '#E8A020', background: 'none', border: 'none', cursor: 'pointer' }}>
            איפוס
          </button>
        )}
      </div>

      {[
        { title: 'מתח כניסה', options: PS_INPUT_VOLTAGE_OPTIONS, key: 'inputVoltage' },
        { title: 'מתח פלט (CV)', options: PS_VOLTAGE_OPTIONS,   key: 'voltage'      },
        { title: 'הגנה (IP)', options: PS_IP_OPTIONS,            key: 'ip'           },
      ].map(({ title, options, key }) => (
        <div key={key} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#595959', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {options.map(v => (
              <Chip key={v} label={v} active={filters[key] === v} onClick={() => setFilters(f => ({ ...f, [key]: v }))} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#595959', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>עמעום</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PS_DIMMING_OPTIONS.map(v => (
            <Chip key={v} label={v} active={filters.dimming === v} onClick={() => setFilters(f => ({ ...f, dimming: v }))} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#595959', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>הספק</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PS_POWER_RANGES.map(r => (
            <Chip key={r.label} label={r.label} active={filters.power === r.label} onClick={() => setFilters(f => ({ ...f, power: r.label }))} />
          ))}
        </div>
      </div>
    </div>
  );
}
