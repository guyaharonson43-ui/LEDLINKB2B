import Chip from './Chip';
import { TRACK_TYPE_OPTIONS } from '../utils/filterConstants';

// שורת המיון של "פסי צבירה מגנטים ומתח גבוה", בראש העמוד מעל רשת התוצאות.
// ציר אחד, בחירה יחידה: מגנטי 48V מול תלת פאזי 230V — שתי מערכות שאינן תואמות
// זו לזו, וזו ההבחנה הראשונה שקונה צריך לעשות.
//
// צ'יפ ללא מוצרים אינו מוצג כלל (למעט אם הוא הבחירה הפעילה), כדי שלא תיווצר
// לחיצה שמובילה למסך ריק.
export default function TrackFilters({ filters, setFilters, counts }) {
  const visible = TRACK_TYPE_OPTIONS.filter(
    o => o === 'הכל' || o === filters.type || counts[o] > 0
  );
  // ציר עם אפשרות ממשית אחת בלבד אינו מסנן כלום — אין טעם להציג אותו
  if (visible.length < 3) return null;

  return (
    <div className="track-filters">
      <div className="track-filter-row">
        <span className="track-filter-label">סוג פס</span>
        <div className="track-filter-chips" role="group" aria-label="סינון לפי סוג פס צבירה">
          {visible.map(o => (
            <Chip
              key={o}
              label={o}
              active={filters.type === o}
              onClick={() => setFilters(f => ({ ...f, type: o }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
