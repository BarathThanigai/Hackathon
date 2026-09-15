import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AsyncState from '../components/ui/AsyncState';
import DecisionDetail from '../components/knowledge/DecisionDetail';
import { fetchDecision } from '../services/api';
import './Decisions.css';

export default function DecisionDetailPage() {
  const { id } = useParams();
  const [result, setResult] = useState({
    id: null,
    decision: null,
    error: false,
  });
  const [retryKey, setRetryKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    fetchDecision(id)
      .then((decision) => {
        if (!active) return;

        setResult({
          id,
          decision,
          error: false,
        });
      })
      .catch(() => {
        if (!active) return;

        setResult({
          id,
          decision: null,
          error: true,
        });
      });

    return () => {
      active = false;
    };
  }, [id, retryKey]);

  const loading = result.id !== id;
  const { decision, error } = result;

  const retry = () => {
    setResult({
      id: null,
      decision: null,
      error: false,
    });

    setRetryKey((value) => value + 1);
  };

  if (loading) {
    return (
      <PageContainer eyebrow="Decision" title="Decision">
        <AsyncState
          status="loading"
          title="Loading decision…"
        />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        eyebrow="Decision"
        title="Unable to load decision"
        subtitle="MemoryMap could not retrieve this decision."
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/decisions')}
          >
            Back to decisions
          </Button>
        }
      >
        <AsyncState
          status="error"
          title="Decision could not be loaded"
          message="There was a problem retrieving this decision."
          onRetry={retry}
        />
      </PageContainer>
    );
  }

  if (!decision) {
    return (
      <PageContainer
        eyebrow="Decision"
        title="Decision not found"
        subtitle="This decision is not available in MemoryMap."
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/decisions')}
          >
            Back to decisions
          </Button>
        }
      >
        <AsyncState
          status="empty"
          title="No matching decision"
          message={`No decision matches “${id}”.`}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      eyebrow="Decision"
      title={decision.title}
      subtitle={decision.date ? `Captured ${decision.date}` : undefined}
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate('/decisions')}
        >
          Back to decisions
        </Button>
      }
    >
      <Card className="decision-detail-card">
        <DecisionDetail decision={decision} />
      </Card>
    </PageContainer>
  );
}