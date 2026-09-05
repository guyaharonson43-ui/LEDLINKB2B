import ProductImg              from './ProductImg';
import SpecTags               from './SpecTags';
import { getNeonDimLabel }    from './NeonSchematics';

export default function ProductCard({ product, variants, onClick, priority }) {
  const neonDim = getNeonDimLabel(product.id);
  const title   = variants ? product.familyName : product.name;

  // הכרטיס כולו הוא יעד הלחיצה — אין עוד כפתור "פרטים נוספים" בתוכו.
  // role/tabIndex/onKeyDown נחוצים כדי שהוא יישאר נגיש במקלדת ולא רק בעכבר.
  const open = () => onClick(product);
  const onKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  };

  return (
    <article className="product-card" role="button" tabIndex={0}
      aria-label={`${title} — פרטים נוספים`} onClick={open} onKeyDown={onKeyDown}>
      <div style={{ position: 'relative' }}>
        <ProductImg src={product.img} name={product.name} priority={priority}
          scale={product.imgScale} base={product.imgBase} width={product.imgWidth}
          cutout={product.imgCutout} />
        {neonDim && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(28,28,28,0.78)', color: '#FFFFFF',
            fontSize: 11, fontWeight: 700, padding: '3px 8px',
            borderRadius: 6, letterSpacing: 0.5, backdropFilter: 'blur(4px)',
            fontFamily: 'Heebo, sans-serif', pointerEvents: 'none',
          }}>
            {neonDim}
          </div>
        )}
      </div>
      <div className="product-card-body">
        <div className="product-card-sub">
          {product.subCategory || product.category}
        </div>
        <div className="product-card-title">
          {title}
        </div>
        {variants && (
          // רמז בלבד — הבחירה עצמה נעשית בחלון המוצר, כדי לא להעמיס את הרשת.
          // תוויות ארוכות (למשל "120 · 64W · 4000K · שחור") מקוצרות למונה,
          // אחרת השורה נשברת ושוברת את גובה הכרטיס.
          <div className="product-card-variants">
            <span className="product-card-variant-axis">{product.variantAxis}:</span>
            <span className="product-card-variant-value">
              {(() => {
                const joined = variants.map(v => v.variantLabel).join(' · ');
                return joined.length <= 30 ? joined : `${variants.length} אפשרויות`;
              })()}
            </span>
          </div>
        )}
        <SpecTags product={product} />
      </div>
    </article>
  );
}
