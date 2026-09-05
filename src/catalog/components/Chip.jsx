export default function Chip({ label, active, onClick, count, title, disabled }) {
  return (
    <button
      type="button"
      className={`filter-chip${active ? ' active' : ''}`}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {label}
      {count != null && <span className="filter-chip-count">{count}</span>}
    </button>
  );
}
