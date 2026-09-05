export default function Chip({ label, active, onClick, count, title }) {
  return (
    <button
      type="button"
      className={`filter-chip${active ? ' active' : ''}`}
      aria-pressed={active}
      title={title}
      onClick={onClick}
    >
      {label}
      {count != null && <span className="filter-chip-count">{count}</span>}
    </button>
  );
}
