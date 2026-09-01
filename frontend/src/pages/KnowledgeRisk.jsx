import { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { fetchRiskAreas } from '../services/api';
import './KnowledgeRisk.css';

const LEVEL_META = {
  high: { label: 'High risk', tone: 'danger' },
  medium: { label: 'Medium risk', tone: 'warn' },
  low: { label: 'Low risk', tone: 'success' },
};

export default function KnowledgeRisk() {
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    fetchRiskAreas().then(setAreas);
  }, []);

  return (
    <PageContainer
      eyebrow="Planned feature"
      title="Knowledge at Risk"
      subtitle="Identify organizational knowledge that depends heavily on a small number of contributors."
    >
      <Card className="risk-note">
        <p>
          Risk levels below are a rule-based heuristic — how concentrated a system's history is
          in one contributor, and how little of it is written down. This is not a machine-learning
          prediction.
        </p>
      </Card>

      {!areas && <div className="risk-loading">Loading risk areas…</div>}

      <div className="risk-list">
        {areas?.map((area) => {
          const meta = LEVEL_META[area.level];
          return (
            <Card key={area.id} className="risk-card">
              <div className="risk-card-head">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <h3>{area.title}</h3>
              </div>
              <div className="risk-card-grid">
                <RiskField label="Primary contributor" value={area.primaryContributor} />
                <RiskField label="Related commits" value={area.relatedCommits} mono />
                <RiskField label="Related discussions" value={area.relatedDiscussions} mono />
                <RiskField label="Documentation coverage" value={area.documentationCoverage} />
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}

function RiskField({ label, value, mono = false }) {
  return (
    <div className="risk-field">
      <div className="risk-field-label">{label}</div>
      <div className={`risk-field-value ${mono ? 'mono' : ''}`}>{value}</div>
    </div>
  );
}
