import Card from '../ui/Card';
import { useDecisionModal } from '../../context/DecisionModalContext';
import './DecisionCard.css';

export default function DecisionCard({ decision, onClick, index = 0 }) {
  const { openDecision } = useDecisionModal();
  const handleClick = onClick || (() => openDecision(decision.id));

  return (
    <Card
      interactive
      as="button"
      className="decision-card"
      onClick={handleClick}
      style={{ '--decision-index': index }}
    >
      <div className="decision-card-top">
        <h3 className="decision-card-title">{decision.title}</h3>
        <span className="decision-card-date mono">{decision.date}</span>
      </div>

      <div className="decision-card-meta">
        <div className="decision-card-field">
          <span className="decision-card-field-label">Technology</span>
          <span className="decision-card-field-value">{decision.technology}</span>
        </div>
        <div className="decision-card-field">
          <span className="decision-card-field-label">Decision</span>
          <span className="decision-card-field-value">{decision.decision}</span>
        </div>
        {decision.reason && (
          <div className="decision-card-field">
            <span className="decision-card-field-label">Reason</span>
            <span className="decision-card-field-value">{decision.reason}</span>
          </div>
        )}
        {decision.people && (
          <div className="decision-card-field">
            <span className="decision-card-field-label">People</span>
            <span className="decision-card-field-value">{decision.people.join(', ')}</span>
          </div>
        )}
      </div>

      {decision.implementedBy && (
        <div className="decision-card-foot mono">Implemented by {decision.implementedBy}</div>
      )}
    </Card>
  );
}
