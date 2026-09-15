import Timeline from './Timeline';
import EvidenceCard from './EvidenceCard';
import './DecisionDetailModal.css';

export default function DecisionDetail({ decision }) {
  const reason = decision.why || decision.reason;

  return (
    <>
      <div className="decision-modal-fields">
        <Field label="Date" value={decision.date} />
        <Field label="Decision" value={decision.decision} />
        <Field label="Why" value={reason} wide />
        <Field label="Proposed by" value={decision.proposedBy} />
        <Field label="People" value={decision.people?.join(', ')} />
        <Field label="Technology" value={decision.technology} />
        <Field label="Context" value={decision.source} />
        <Field label="Discussed in" value={decision.discussedIn} />
        <Field label="Implemented by" value={decision.implementedBy} />
      </div>

      {decision.timeline?.length > 0 && (
        <div className="decision-modal-section">
          <h3>Timeline</h3>
          <Timeline steps={decision.timeline} />
        </div>
      )}

      {decision.evidence?.length > 0 && (
        <div className="decision-modal-section">
          <h3>Supporting evidence</h3>
          <div className="decision-modal-evidence">
            {decision.evidence.map((evidence, index) => (
              <EvidenceCard key={evidence.id} index={index + 1} evidence={evidence} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, wide = false }) {
  if (!value) return null;
  return (
    <div className={`decision-modal-field${wide ? ' wide' : ''}`}>
      <div className="decision-modal-field-label mono">{label}</div>
      <div className="decision-modal-field-value">{value}</div>
    </div>
  );
}
