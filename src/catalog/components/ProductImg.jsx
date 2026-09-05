import { useState } from 'react';
import { imgSrc } from '../utils/helpers';

// מקור התמונות של גופי התאורה הוא 250x250 בלבד (יורולוקס לא מגישים גדול יותר,
// גם לא בדף המוצר שלהם). לכן העיקרון כאן הוא לא להגדיל מעבר לרזולוציה הזו אלא
// לתת למוצר לתפוס כמה שיותר מהשטח שכן יש, על משטח שמבליט אותו.
export default function ProductImg({ src, name, tall, priority, scale, base, width, cutout }) {
  const [err, setErr] = useState(false);
  // התמונות ריבועיות. מסגרת 3:2 השאירה כשליש מרוחב הכרטיס ריק והמוצר נראה קטן
  // ומהוסס — יחס כמעט ריבועי נותן לו נוכחות בלי לחתוך אותו.
  const pt = tall ? '82%' : '88%';

  if (!src || err) {
    return (
      <div className="product-img-frame" style={{ paddingTop: pt }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#C8C4BC', letterSpacing: 2 }}>LEDLINK</span>
        </div>
      </div>
    );
  }

  // --img-scale  מיישר את כל המוצרים לאותו משקל חזותי (ראו apply-image-scale.mjs)
  // --img-base   בסיס המוצר בתוך התמונה — נקודת העגינה של צל המגע
  // --img-width  רוחב המוצר — קובע את רוחב הצל
  const vars = {};
  if (scale && scale !== 1) vars['--img-scale'] = scale;
  if (base) vars['--img-base'] = base;
  if (width) vars['--img-width'] = width;

  return (
    <div className="product-img-frame" style={{ paddingTop: pt }}>
      {/* הבמה ריבועית בכוונה: כשהיא ריבועית, אחוז בתוכה מתאים אחד-לאחד
          לקואורדינטה בתמונת המקור הריבועית, וזה מה שמאפשר למקם את הצל
          מתחת לבסיס האמיתי של כל מוצר במקום במרכז שרירותי. */}
      <div className="product-img-stage" style={vars}>
        {/* רק לתמונה עם ערוץ אלפא. מתחת ל-JPEG אטום הצל מוסתר לחלוטין. */}
        {cutout && base != null && <span className="product-img-shadow" aria-hidden="true" />}
        <img
          className="product-img"
          src={imgSrc(src)}
          alt={name}
          width={250}
          height={250}
          // תמונת המוצר בחלון היא התוכן שהמשתמש ביקש בלחיצה, לא תוכן מתחת לקיפול.
          // עם lazy היא נטענה באיחור והשאירה מלבן ריק ברגע הפתיחה.
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : undefined}
          decoding={priority ? 'sync' : 'async'}
          onError={() => setErr(true)}
        />
      </div>
    </div>
  );
}
