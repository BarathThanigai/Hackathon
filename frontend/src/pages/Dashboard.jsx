import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AsyncState from '../components/ui/AsyncState';
import DecisionCard from '../components/knowledge/DecisionCard';
import KnowledgeHealthFlow from '../components/knowledge/KnowledgeHealthFlow';
import { fetchDashboardOverview } from '../services/api';
import './Dashboard.css';

const METRIC_LABELS = [
  { key: 'knowledgeSources', label: 'Knowledge Sources' },
  { key: 'decisionsCaptured', label: 'Decisions Captured' },
  { key: 'peopleConnected', label: 'People Connected' },
  { key: 'technologiesTracked', label: 'Technologies Tracked' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [question, setQuestion] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    fetchDashboardOverview()
      .then((result) => {
        if (!active) return;
        setData(result);
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
    setData(null);
    setError(false);
    setRetryKey((value) => value + 1);
  };

  const submit = (e) => {
    e.preventDefault();
    navigate('/ask', {
      state: {
        question: question || 'Why was Redis introduced?',
      },
    });
  };

  return (
    <PageContainer>
      <div className="dash-hero">
        <h1 className="dash-hero-greeting">Good morning.</h1>
        <p className="dash-hero-question">
          What organizational knowledge are you looking for?
        </p>

        <form className="dash-ask" onSubmit={submit}>
          <input
            className="dash-ask-input"
            placeholder='Ask MemoryMap anything… "Why was Redis introduced?"'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button type="submit" iconAfter="→">
            Ask MemoryMap
          </Button>
        </form>
      </div>

      <section className="dash-section">
        <div className="dash-metrics">
          {METRIC_LABELS.map((metric) => (
            <Card key={metric.key} className="dash-metric">
              <div className="dash-metric-value mono">
                {data ? (
                  data.metrics[metric.key]
                ) : (
                  <span className="dash-metric-skeleton" />
                )}
              </div>
              <div className="dash-metric-label">{metric.label}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="dash-section">
        <div className="dash-section-head">
          <h2>Recent decisions</h2>
        </div>

        <div className="dash-decisions">
          {error && (
            <AsyncState
              status="error"
              title="Unable to load recent decisions"
              message="MemoryMap could not retrieve the dashboard data."
              onRetry={retry}
            />
          )}

          {!data && !error && (
            <AsyncState
              status="loading"
              title="Loading recent decisions…"
            />
          )}

          {data?.recentDecisions?.length === 0 && (
            <AsyncState
              status="empty"
              title="No recent decisions"
              message="Captured decisions will appear here."
            />
          )}

          {data?.recentDecisions?.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      </section>

      <section className="dash-section">
        <div className="dash-section-head">
          <h2>Knowledge health</h2>
          <p>
            How MemoryMap connects organizational knowledge, rather than simply
            storing it.
          </p>
        </div>

        <Card>
          <KnowledgeHealthFlow />
        </Card>
      </section>
    </PageContainer>
  );
}