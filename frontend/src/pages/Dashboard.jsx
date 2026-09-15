import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DecisionCard from '../components/knowledge/DecisionCard';
import KnowledgeHealthFlow from '../components/knowledge/KnowledgeHealthFlow';
import { fetchDashboardOverview } from '../services/api';
import './Dashboard.css';

const METRICS = [
  { key: 'knowledgeSources', label: 'Knowledge Sources', icon: '◫' },
  { key: 'decisionsCaptured', label: 'Decisions Captured', icon: '◇' },
  { key: 'peopleConnected', label: 'People Connected', icon: '◎' },
  { key: 'technologiesTracked', label: 'Technologies Tracked', icon: '⌘' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchDashboardOverview().then(setData); }, []);
  const submit = (event) => {
    event.preventDefault();
    navigate('/ask', { state: { question: question || 'Why was Redis introduced?' } });
  };

  return <PageContainer>
    <section className="dash-hero">
      <div className="dash-orbit dash-orbit-one" /><div className="dash-orbit dash-orbit-two" />
      <div className="dash-hero-kicker"><span /> LIVE KNOWLEDGE MAP <b>CONNECTED</b></div>
      <h1 className="dash-hero-greeting">Make every <em>connection</em> count.</h1>
      <p className="dash-hero-question">Ask anything. Find the context, people, and decisions behind your team’s work.</p>
      <form className="dash-ask" onSubmit={submit}>
        <input className="dash-ask-input" placeholder={'Ask MemoryMap anything… “Why was Redis introduced?”'} value={question} onChange={(event) => setQuestion(event.target.value)} />
        <Button type="submit" iconAfter="→">Explore knowledge</Button>
      </form>
    </section>

    <section className="dash-section">
      <div className="dash-metrics">{METRICS.map((metric) => <Card key={metric.key} className="dash-metric">
        <div className="dash-metric-top"><span className="dash-metric-icon">{metric.icon}</span><span className="dash-metric-pulse" /></div>
        <div className="dash-metric-value mono">{data ? data.metrics[metric.key] : <span className="dash-metric-skeleton" />}</div>
        <div className="dash-metric-label">{metric.label}</div>
      </Card>)}</div>
    </section>

    <section className="dash-section">
      <div className="dash-section-head"><div><span className="dash-section-kicker">SIGNAL FEED</span><h2>Recent decisions</h2></div><span className="dash-section-count">LATEST INTELLIGENCE</span></div>
      <div className="dash-decisions">{!data && <div className="dash-loading">Loading recent decisions…</div>}{data?.recentDecisions.map((decision) => <DecisionCard key={decision.id} decision={decision} />)}</div>
    </section>

    <section className="dash-section">
      <div className="dash-section-head"><div><span className="dash-section-kicker">SYSTEM VIEW</span><h2>Knowledge health</h2><p>How MemoryMap connects organizational knowledge, rather than simply storing it.</p></div></div>
      <Card><KnowledgeHealthFlow /></Card>
    </section>
  </PageContainer>;
}
