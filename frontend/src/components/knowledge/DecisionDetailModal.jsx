import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Timeline from './Timeline';
import EvidenceCard from './EvidenceCard';
import { useDecisionModal } from '../../context/DecisionModalContext';
import { fetchDecisionDetail } from '../../services/api';
import './DecisionDetailModal.css';

export default function DecisionDetailModal() {
  const { openId, closeDecision } = useDecisionModal();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetchDecisionDetail(openId).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [openId]);

  if (!openId) return null;

  return (
    <Modal onClose={closeDecision} width={620}>
      <div className="decision-modal">
        {loading || !detail ? (
          <div className="decision-modal-loading">Loading decision context…</div>
        ) : (
          <>
            <div className="decision-modal-header">
              <h2>{detail.title}</h2>
              <button className="decision-modal-close" onClick={closeDecision} aria-label="Close">✕</button>
            </div>

            <div className="decision-modal-fields">
              <Field label="Decision" value={detail.decision} />
              <Field label="Why" value={detail.why} wide />
              <Field label="Proposed by" value={detail.proposedBy} />
              <Field label="Technology" value={detail.technology} />
              <Field label="Discussed in" value={detail.discussedIn} />
              <Field label="Implemented by" value={detail.implementedBy} />
            </div>

            <div className="decision-modal-section">
              <h3>Timeline</h3>
              <Timeline steps={detail.timeline} />
            </div>

            <div className="decision-modal-section">
              <h3>Supporting evidence</h3>
              <div className="decision-modal-evidence">
                {detail.evidence.map((ev, i) => (
                  <EvidenceCard key={ev.id} index={i + 1} evidence={ev} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
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
