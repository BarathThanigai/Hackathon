import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import DecisionDetail from './DecisionDetail';
import { useDecisionModal } from '../../context/DecisionModalContext';
import { fetchDecisionDetail } from '../../services/api';
import './DecisionDetailModal.css';

export default function DecisionDetailModal() {
  const { openId, closeDecision } = useDecisionModal();
  const navigate = useNavigate();
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

  const openFullDecision = () => {
    closeDecision();
    navigate(`/decisions/${openId}`);
  };

  return (
    <Modal onClose={closeDecision} width={620}>
      <div className="decision-modal">
        {loading ? (
          <div className="decision-modal-loading">Loading decision context…</div>
        ) : !detail ? (
          <div className="decision-modal-loading">
            <p>Detailed context is not available for this decision.</p>
            <div className="decision-modal-actions">
              <Button variant="secondary" onClick={openFullDecision}>Open full decision</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="decision-modal-header">
              <h2>{detail.title}</h2>
              <button className="decision-modal-close" onClick={closeDecision} aria-label="Close">✕</button>
            </div>

            <DecisionDetail decision={detail} />
            <div className="decision-modal-actions">
              <Button variant="secondary" onClick={openFullDecision}>Open full decision</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
