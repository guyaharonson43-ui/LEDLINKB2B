export default function Chip({ label, active, onClick }) {
  return (
    <button className={`filter-chip${active ? ' active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}
