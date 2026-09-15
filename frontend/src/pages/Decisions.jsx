import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import AsyncState from '../components/ui/AsyncState';
import DecisionCard from '../components/knowledge/DecisionCard';
import { fetchDecisions } from '../services/api';
import './Decisions.css';

export default function Decisions() {
  const [decisions, setDecisions] = useState(null);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    fetchDecisions()
      .then((result) => {
        if (!active) return;
        setDecisions(result);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      });

    return () => {
      active = false;
    };
  }, [retryKey]);

  const retry = () => {
    setDecisions(null);
    setError(false);
    setRetryKey((value) => value + 1);
  };

  const loading = decisions === null && !error;
  const empty = decisions?.length === 0;

  return (
    <PageContainer
      eyebrow="Knowledge"
      title="Decisions"
      subtitle="Explore the choices that shaped your organization and the evidence behind them."
    >
      {loading && (
        <AsyncState
          status="loading"
          title="Loading decisions…"
        />
      )}

      {error && (
        <AsyncState
          status="error"
          title="Unable to load decisions"
          message="MemoryMap could not retrieve the decision history."
          onRetry={retry}
        />
      )}

      {empty && (
        <AsyncState
          status="empty"
          title="No decisions have been captured yet"
          message="Captured organizational decisions will appear here."
        />
      )}

      {!loading && !error && !empty && (
        <>
          <div className="decisions-overview">
            <span className="decisions-overview-label mono">DECISION REGISTER</span>
            <span className="decisions-overview-count mono">
              {String(decisions.length).padStart(2, '0')} CAPTURED
            </span>
          </div>
          <div className="decisions-list">
            {decisions.map((decision, index) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                index={index}
                onClick={() => navigate(`/decisions/${decision.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}