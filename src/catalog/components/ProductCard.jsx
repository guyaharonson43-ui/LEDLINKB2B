import ProductImg from './ProductImg';
import SpecTags   from './SpecTags';

export default function ProductCard({ product, onClick }) {
  return (
    <article className="product-card">
      <ProductImg src={product.img} name={product.name} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 12, color: '#767676', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
          {product.subCategory || product.category}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1C', lineHeight: 1.3, minHeight: 36 }}>
          {product.name}
        </div>
        <SpecTags product={product} />
        <button className="btn-outline" onClick={() => onClick(product)}
          style={{ marginTop: 12, width: '100%', fontSize: 13, padding: '7px 0' }}>
          פרטים נוספים
        </button>
      </div>
    </article>
  );
}
