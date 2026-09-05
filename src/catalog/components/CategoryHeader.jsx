export default function CategoryHeader({ label, count, desc }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-0.028em',
          lineHeight: 1.08, color: '#1C1C1C', margin: 0 }}>{label}</h1>
        <span className="category-header-count">{count}</span>
      </div>
      {desc && <p style={{ fontSize: 14, color: '#595959', margin: 0, lineHeight: 1.6 }}>{desc}</p>}
      <div style={{ width: 40, height: 2, background: '#E8A020', marginTop: 12 }} />
    </div>
  );
}
