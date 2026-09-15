import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DecisionDetail from '../components/knowledge/DecisionDetail';
import { fetchDecision } from '../services/api';
import './Decisions.css';

export default function DecisionDetailPage() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, decision: null });
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    fetchDecision(id).then((decision) => {
      if (!active) return;
      setResult({ id, decision });
    });

    return () => {
      active = false;
    };
  }, [id]);

  const loading = result.id !== id;
  const { decision } = result;

  if (loading) {
    return (
      <PageContainer eyebrow="Decision" title="Decision">
        <div className="decisions-loading">Loading decision…</div>
      </PageContainer>
    );
  }

  if (!decision) {
    return (
      <PageContainer
        eyebrow="Decision"
        title="Decision not found"
        subtitle="This decision is not available in MemoryMap."
        actions={<Button variant="secondary" onClick={() => navigate('/decisions')}>Back to decisions</Button>}
      >
        <Card className="decisions-empty">
          <p>No decision matches “{id}”.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      eyebrow="Decision"
      title={decision.title}
      subtitle={decision.date ? `Captured ${decision.date}` : undefined}
      actions={<Button variant="secondary" onClick={() => navigate('/decisions')}>Back to decisions</Button>}
    >
      <Card className="decision-detail-card">
        <DecisionDetail decision={decision} />
      </Card>
    </PageContainer>
  );
}
