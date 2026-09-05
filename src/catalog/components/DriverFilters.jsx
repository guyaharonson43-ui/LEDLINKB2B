import Chip from './Chip';
import { INIT_PS } from '../utils/filterConstants';
import { GROUPS, GROUP_ORDER } from '../utils/driverMeta';
import { DIMMING_FAMILIES } from '../utils/driverFacets';

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: '#595959',
  letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
};

// הציר הוא רב-בחירה — לחיצה מוסיפה או מסירה במקום להחליף.
function toggle(list, value) {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

function AxisChip({ axis, option, filters, setFilters }) {
  const multi  = axis.mode === 'multi';
  const active = multi
    ? (filters[axis.key] || []).includes(option.value)
    : filters[axis.key] === option.value;

  // ערך שהצטמצם לאפס בגלל ציר אחר מואפר ולא לחיץ, אבל נשאר במקומו —
  // הסתרה מקפיצה את הצ'יפים מתחת לאצבע בכל לחיצה ומבלבלת יותר משהיא חוסכת.
  const disabled = option.count === 0 && !active;

  return (
    <Chip
      label={option.label}
      count={option.count}
      active={active}
      disabled={disabled}
      title={disabled ? 'אין מוצרים תואמים בסינון הנוכחי' : undefined}
      onClick={() => setFilters(f => ({
        ...f,
        [axis.key]: multi
          ? toggle(f[axis.key] || [], option.value)
          : (f[axis.key] === option.value ? GROUPS.ALL : option.value),
      }))}
    />
  );
}

// ציר העמעום מוצג במשפחות מסומנות. 13 צ'יפים שטוחים הם רשימה שאי אפשר
// לסרוק; "אנלוגי / פאזה / דיגיטלי / אלחוטי" נסרקות במבט.
function DimmingAxis({ axis, filters, setFilters }) {
  const byValue = new Map(axis.options.map(o => [o.value, o]));
  const seen    = new Set();

  const families = DIMMING_FAMILIES
    .map(fam => ({
      name: fam.name,
      options: fam.values.map(v => { seen.add(v); return byValue.get(v); }).filter(Boolean),
    }))
    .filter(f => f.options.length);

  // ערך שהופיע בנתונים ואינו באף משפחה — נכנס לסוף במקום להיעלם
  const rest = axis.options.filter(o => !seen.has(o.value));
  if (rest.length) families.push({ name: 'אחר', options: rest });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {families.map((fam, i) => (
        <div key={fam.name || i}>
          {fam.name && (
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8A8A8A', marginBottom: 5 }}>
              {fam.name}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {fam.options.map(o => (
              <AxisChip key={o.value} axis={axis} option={o} filters={filters} setFilters={setFilters} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// מתג הקבוצה יושב בראש פאנל הסינון ולא מעל הגריד. הוא משנה את מספר התוצאות
// וגם קובע אילו צירים בכלל קיימים מתחתיו — ואם הוא יושב במיכל אחר מהצירים
// שהוא מחליף, הקשר הזה בלתי נראה: המשתמש רואה את הסיידבר מתחלף בלי לקשר
// זאת למה שלחץ. הוא מודגש בתוך הפאנל בגודל ובקו מפריד, לא בהוצאה ממנו.
//
// בעמודה של 240px ארבעה כפתורים בשורה היו נשברים באמצע תווית; שורות מלאות
// ברוחב הפאנל גם קריאות יותר וגם עומדות ביעד ה-44px של שטח נגיעה.
function GroupSwitch({ filters, setFilters, groupCounts }) {
  return (
    <div role="group" aria-label="סוג דרייבר"
      style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20,
        paddingBottom: 20, borderBottom: '1px solid #E8E5E0' }}>
      <div style={{ ...labelStyle, marginBottom: 4 }}>סוג דרייבר</div>
      {GROUP_ORDER.map(value => {
        const on = filters.group === value;
        return (
          <button key={value} aria-pressed={on}
            onClick={() => setFilters({ ...INIT_PS, group: value })}
            className="driver-group-btn"
            style={{
              border: on ? '1.5px solid #1C1C1C' : '1.5px solid #E0DDD6',
              background: on ? '#1C1C1C' : '#FFFFFF',
              color: on ? '#FFFFFF' : '#595959',
            }}>
            <span>{value}</span>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: on ? 0.7 : 1,
              color: on ? '#FFFFFF' : '#8A8A8A' }}>
              {groupCounts[value] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function DriverFilters({ filters, setFilters, facets, count }) {
  // הקבוצה עצמה נבחרת במתג שמעל הגריד ואינה נספרת כאן כסינון פעיל.
  const hasActive = Object.entries(filters).some(([k, v]) =>
    k !== 'group' && (Array.isArray(v) ? v.length > 0 : v !== GROUPS.ALL));

  return (
    <div>
      <GroupSwitch filters={filters} setFilters={setFilters} groupCounts={facets.groupCounts} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#595959' }}>{count} מוצרים</span>
        {hasActive && (
          <button onClick={() => setFilters(f => ({ ...INIT_PS, group: f.group }))}
            style={{ fontSize: 12, color: '#E8A020', background: 'none', border: 'none', cursor: 'pointer' }}>
            איפוס
          </button>
        )}
      </div>

      {facets.axes.map(axis => (
        <div key={axis.key} style={{ marginBottom: 20 }}>
          <div style={labelStyle}>{axis.title}</div>
          {axis.key === 'dimming'
            ? <DimmingAxis axis={axis} filters={filters} setFilters={setFilters} />
            : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {axis.options.map(o => (
                  <AxisChip key={o.value} axis={axis} option={o} filters={filters} setFilters={setFilters} />
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
