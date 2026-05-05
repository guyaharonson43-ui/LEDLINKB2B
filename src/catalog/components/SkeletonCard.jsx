export default function SkeletonCard() {
  return (
    <div className="product-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton-pulse" style={{ height: 180 }} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div className="skeleton-pulse" style={{ height: 10, width: '40%', marginBottom: 8 }} />
        <div className="skeleton-pulse" style={{ height: 13, width: '90%', marginBottom: 6 }} />
        <div className="skeleton-pulse" style={{ height: 13, width: '70%', marginBottom: 14 }} />
        <div className="skeleton-pulse" style={{ height: 10, width: '55%', marginBottom: 12 }} />
        <div className="skeleton-pulse" style={{ height: 30, width: '100%' }} />
      </div>
    </div>
  );
}
