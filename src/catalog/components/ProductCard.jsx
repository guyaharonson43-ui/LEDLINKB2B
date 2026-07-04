import ProductImg              from './ProductImg';
import SpecTags               from './SpecTags';
import { getNeonDimLabel }    from './NeonSchematics';

export default function ProductCard({ product, onClick, priority }) {
  const neonDim = getNeonDimLabel(product.id);

  return (
    <article className="product-card">
      <div style={{ position: 'relative' }}>
        <ProductImg src={product.img} name={product.name} priority={priority} />
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
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: 12, color: '#767676', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
          {product.subCategory || product.category}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#1C1C1C', lineHeight: 1.3, minHeight: 36,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.name}
        </div>
        <SpecTags product={product} />
        <button className="btn-outline" onClick={() => onClick(product)}
          style={{ marginTop: 'auto', width: '100%', fontSize: 13, padding: '7px 0' }}>
          פרטים נוספים
        </button>
      </div>
    </article>
  );
}
