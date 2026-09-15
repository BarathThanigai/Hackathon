import './EntityCard.css';

export default function EntityCard({ label, items }) {
  const validItems = (items || []).filter((item) => (
    typeof item === 'string' || (item && typeof item.label === 'string')
  ));

  if (validItems.length === 0) return null;
  return (
    <div className="entity-card">
      <div className="entity-card-label mono">{label}</div>
      <div className="entity-card-items">
        {validItems.map((item) => {
          const itemLabel = typeof item === 'string' ? item : item.label;
          const isNavigable = typeof item !== 'string'
            && item.destination
            && typeof item.onClick === 'function';

          return isNavigable ? (
            <button
              key={itemLabel}
              type="button"
              className="entity-chip entity-chip-link"
              onClick={item.onClick}
            >
              {itemLabel}
            </button>
          ) : (
            <span key={itemLabel} className="entity-chip">{itemLabel}</span>
          );
        })}
      </div>
    </div>
  );
}
