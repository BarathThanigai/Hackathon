import './GraphDetails.css';

export default function GraphDetails({ entity }) {
  if (!entity) {
    return (
      <div className="graph-details graph-details-empty">
        <p>Select a node to see how it connects to the rest of your organization's knowledge.</p>
      </div>
    );
  }

  return (
    <div className="graph-details">
      <div className="graph-details-eyebrow mono">Entity</div>
      <h3 className="graph-details-name">{entity.name}</h3>

      <div className="graph-details-row">
        <span className="graph-details-label">Type</span>
        <span className="graph-details-value">{entity.type}</span>
      </div>
      <div className="graph-details-row">
        <span className="graph-details-label">Related decisions</span>
        <span className="graph-details-value mono">{entity.relatedDecisions}</span>
      </div>
      <div className="graph-details-row">
        <span className="graph-details-label">Related projects</span>
        <span className="graph-details-value mono">{entity.relatedProjects}</span>
      </div>
      <div className="graph-details-row">
        <span className="graph-details-label">Related people</span>
        <span className="graph-details-value mono">{entity.relatedPeople}</span>
      </div>
    </div>
  );
}
