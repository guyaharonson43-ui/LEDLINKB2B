import Chip from './Chip';
import { ALL, emptyFilters, toggleValue, activeFilterCount } from '../utils/catalogFacets';

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: '#595959',
  letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
};

// ציר עם יותר ערכים מזה נגלל בתוך עצמו, כדי שלא ידחוף את שאר הצירים מתחת לקפל
const LONG_AXIS = 12;

// מתג תת-הקטגוריה יושב בראש הפאנל: הוא קובע אילו ערכים בכלל נשארים בצירים
// שמתחתיו, ולכן הקשר בינו לבינם צריך להיות גלוי.
function CategorySwitch({ categories, filters, setFilters }) {
  return (
    <div role="group" aria-label="תת-קטגוריה"
      style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20,
        paddingBottom: 20, borderBottom: '1px solid #E8E5E0' }}>
      <div style={{ ...labelStyle, marginBottom: 4 }}>תת-קטגוריה</div>
      {[{ value: ALL, label: ALL }, ...categories].map(({ value, label }) => {
        const on = filters.category === value;
        return (
          <button key={value} aria-pressed={on}
            onClick={() => setFilters(f => ({ ...f, category: value }))}
            className="driver-group-btn"
            style={{
              border: on ? '1.5px solid #1C1C1C' : '1.5px solid #E0DDD6',
              background: on ? '#1C1C1C' : '#FFFFFF',
              color: on ? '#FFFFFF' : '#595959',
            }}>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function CatalogFilters({ facets, filters, setFilters, count }) {
  return (
    <div>
      {facets.categories.length > 0 && (
        <CategorySwitch categories={facets.categories} filters={filters} setFilters={setFilters} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#595959' }}>{count} מוצרים</span>
        {activeFilterCount(filters) > 0 && (
          <button onClick={() => setFilters(emptyFilters())}
            style={{ fontSize: 12, color: '#E8A020', background: 'none', border: 'none', cursor: 'pointer' }}>
            איפוס
          </button>
        )}
      </div>

      {facets.axes.map(axis => (
        <div key={axis.key} style={{ marginBottom: 20 }}>
          <div style={labelStyle}>{axis.title}</div>
          <div className={axis.options.length > LONG_AXIS ? 'facet-options long' : 'facet-options'}>
            {axis.options.map(o => (
              <Chip key={o.value} label={o.label} active={o.active}
                onClick={() => setFilters(f => toggleValue(f, axis.key, o.value))} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
