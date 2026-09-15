import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Timeline from '../components/knowledge/Timeline';
import EvidenceCard from '../components/knowledge/EvidenceCard';
import EntityCard from '../components/knowledge/EntityCard';
import ReconstructionDiagram from '../components/graph/ReconstructionDiagram';
import { askQuestion, resolveDecision, resolveGraphEntity } from '../services/api';
import { suggestedQuestions } from '../data/mockData';
import './AskMemoryMap.css';

const LOADING_STEPS = ['Searching evidence', 'Connecting relationships', 'Synthesizing explanation'];

export default function AskMemoryMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | answered | error
  const [answer, setAnswer] = useState(null);
  const submittedOnce = useRef(false);

  const runQuery = (q) => {
    const trimmed = (q || question).trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setStatus('loading');
    askQuestion(trimmed)
      .then((res) => {
        setAnswer(res);
        setStatus('answered');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(() => {
    if (location.state?.question && !submittedOnce.current) {
      submittedOnce.current = true;
      setQuestion(location.state.question);
      runQuery(location.state.question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const submit = (e) => {
    e.preventDefault();
    runQuery(question);
  };

  return (
    <PageContainer
      eyebrow="Investigation"
      title="Ask MemoryMap"
      subtitle="Reconstruct the context behind your organization's decisions."
    >
      <form className="ask-bar" onSubmit={submit}>
        <input
          className="ask-bar-input"
          placeholder="Why was Redis introduced?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Investigating…' : 'Investigate'}
        </Button>
      </form>

      {status === 'idle' && (
        <div className="ask-suggestions">
          <div className="ask-suggestions-label mono">Try asking</div>
          <div className="ask-suggestions-list">
            {suggestedQuestions.map((q) => (
              <button key={q} className="ask-suggestion-chip" onClick={() => runQuery(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === 'loading' && (
        <Card className="ask-loading">
          <div className="ask-loading-title">Reconstructing organizational context…</div>
          <ul className="ask-loading-steps">
            {LOADING_STEPS.map((step, i) => (
              <li key={step} style={{ animationDelay: `${i * 260}ms` }}>{step}</li>
            ))}
          </ul>
        </Card>
      )}

      {status === 'error' && (
        <Card className="ask-error">
          <div className="ask-error-title">Unable to reconstruct this context.</div>
          <p>Try another question or check your knowledge sources.</p>
        </Card>
      )}

      {status === 'answered' && answer && (
        <div className="ask-answer">
          <Card className="ask-explanation">
            <div className="ask-explanation-head">
              <h2>AI explanation</h2>
              {answer.evidenceBacked && <Badge tone="success">Evidence-backed</Badge>}
            </div>
            {answer.answer.split('\n\n').map((para, i) => (
              <p key={i} className="ask-explanation-para">{para}</p>
            ))}
          </Card>

          <div className="ask-grid">
            <div className="ask-grid-main">
              <Card>
                <h3 className="ask-block-title">Context timeline</h3>
                <Timeline steps={answer.timeline} />
              </Card>

              <Card>
                <h3 className="ask-block-title">Evidence</h3>
                <div className="ask-evidence-list">
                  {answer.evidence.map((ev, i) => (
                    <EvidenceCard key={ev.id} index={i + 1} evidence={ev} />
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="ask-block-title">How MemoryMap reconstructed this answer</h3>
                <ReconstructionDiagram />
              </Card>
            </div>

            <div className="ask-grid-side">
              <div className="ask-related-label mono">Related knowledge</div>
              <EntityCard label="People" items={relatedItems(answer.related?.people, 'person', navigate)} />
              <EntityCard label="Technology" items={relatedItems(answer.related?.technologies, 'technology', navigate)} />
              <EntityCard label="Decision" items={decisionItems(answer.related?.decisions, navigate)} />
              <EntityCard label="Pull Request" items={answer.related?.pullRequests} />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function relatedItems(items, expectedType, navigate) {
  return (items || []).filter((item) => typeof item === 'string').map((item) => {
    const entityId = resolveGraphEntity(item, expectedType);
    if (!entityId) return item;

    return {
      label: item,
      destination: `/graph?entity=${encodeURIComponent(entityId)}`,
      onClick: () => navigate(`/graph?entity=${encodeURIComponent(entityId)}`),
    };
  });
}

function decisionItems(items, navigate) {
  return (items || []).filter((item) => typeof item === 'string').map((item) => {
    const decisionId = resolveDecision(item);
    if (!decisionId) return item;

    return {
      label: item,
      destination: `/decisions/${encodeURIComponent(decisionId)}`,
      onClick: () => navigate(`/decisions/${encodeURIComponent(decisionId)}`),
    };
  });
}
