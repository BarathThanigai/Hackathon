import './EntityCard.css';

export default function EntityCard({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="entity-card">
      <div className="entity-card-label mono">{label}</div>
      <div className="entity-card-items">
        {items.map((item) => (
          <span key={item} className="entity-chip">{item}</span>
        ))}
      </div>
    </div>
  );
}
