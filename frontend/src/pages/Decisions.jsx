import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import DecisionCard from '../components/knowledge/DecisionCard';
import { fetchDecisions } from '../services/api';
import './Decisions.css';

export default function Decisions() {
  const [decisions, setDecisions] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDecisions().then(setDecisions);
  }, []);

  return (
    <PageContainer
      eyebrow="Knowledge"
      title="Decisions"
      subtitle="Explore the choices that shaped your organization and the evidence behind them."
    >
      {!decisions && <div className="decisions-loading">Loading decisions…</div>}
      {decisions?.length === 0 && (
        <Card className="decisions-empty">
          <p>No decisions have been captured yet.</p>
        </Card>
      )}
      <div className="decisions-list">
        {decisions?.map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            onClick={() => navigate(`/decisions/${decision.id}`)}
          />
        ))}
      </div>
    </PageContainer>
  );
}
