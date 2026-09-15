import { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import AsyncState from '../components/ui/AsyncState';
import RiskField from '../components/knowledge/RiskField';
import { fetchRiskAreas, resolveGraphEntity } from '../services/api';
import './KnowledgeRisk.css';

const LEVEL_META = {
  high: { label: 'High risk', tone: 'danger' },
  medium: { label: 'Medium risk', tone: 'warn' },
  low: { label: 'Low risk', tone: 'success' },
};

export default function KnowledgeRisk() {
  const [areas, setAreas] = useState(null);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    fetchRiskAreas()
      .then((result) => {
        if (!active) return;
        setAreas(result);
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
    setAreas(null);
    setError(false);
    setRetryKey((value) => value + 1);
  };

  return (
    <PageContainer
      eyebrow="Knowledge intelligence"
      title="Knowledge at Risk"
      subtitle="Identify organizational knowledge that depends heavily on a small number of contributors."
    >
      <section className="risk-overview" aria-labelledby="risk-overview-title">
        <div className="risk-section-heading">
          <div>
            <div className="risk-section-kicker mono">01 / OVERVIEW</div>
            <h2 id="risk-overview-title">Knowledge health signal</h2>
          </div>
          <span className="risk-overview-scope mono">RULE-BASED REVIEW</span>
        </div>

        <Card className="risk-note">
          <div className="risk-note-status" aria-hidden="true">
            <span />
          </div>
          <div className="risk-note-content">
            <div className="risk-note-label mono">CURRENT SIGNAL</div>
            <p>
              Risk levels below are a rule-based heuristic — how concentrated a
              system's history is in one contributor, and how little of it is
              written down. This is not a machine-learning prediction.
            </p>
          </div>
          {areas && areas.length > 0 && (
            <div className="risk-summary-stats" aria-label="Risk summary">
              <div>
                <strong>{areas.length}</strong>
                <span>areas tracked</span>
              </div>
              <div>
                <strong>{areas.filter((area) => area.level === 'high').length}</strong>
                <span>high risk</span>
              </div>
              <div>
                <strong>
                  {areas.filter((area) => area.documentationCoverage === 'Low').length}
                </strong>
                <span>low coverage</span>
              </div>
            </div>
          )}
        </Card>
      </section>

      {!areas && !error && (
        <AsyncState
          status="loading"
          title="Loading risk areas…"
        />
      )}

      {error && (
        <AsyncState
          status="error"
          title="Unable to load knowledge risk"
          message="MemoryMap could not retrieve the current risk areas."
          onRetry={retry}
        />
      )}

      {areas?.length === 0 && (
        <AsyncState
          status="empty"
          title="No knowledge risks identified"
          message="Risk areas will appear when enough organizational history is available."
        />
      )}

      {areas && areas.length > 0 && (
        <section aria-labelledby="risk-areas-title">
          <div className="risk-section-heading risk-areas-heading">
            <div>
              <div className="risk-section-kicker mono">02 / RISK AREAS</div>
              <h2 id="risk-areas-title">Where context is concentrated</h2>
            </div>
            <span className="risk-area-count mono">
              {String(areas.length).padStart(2, '0')} SIGNALS
            </span>
          </div>

          <div className="risk-list">
            {areas.map((area, index) => {
              const meta = LEVEL_META[area.level];
              const entityId = resolveGraphEntity(
                area.primaryContributor,
                'person',
              );

              return (
                <Card
                  key={area.id}
                  className="risk-card"
                  style={{ '--risk-index': index }}
                >
                  <div className="risk-card-head">
                    <div className="risk-card-title">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <h3>{area.title}</h3>
                    </div>
                    <span className="risk-card-id mono">{area.id}</span>
                  </div>

                  <div className="risk-card-grid">
                    <RiskField
                      label="Primary contributor"
                      value={area.primaryContributor}
                      to={
                        entityId
                          ? `/graph?entity=${encodeURIComponent(entityId)}`
                          : null
                      }
                    />

                    <RiskField
                      label="Related commits"
                      value={area.relatedCommits}
                      mono
                    />

                    <RiskField
                      label="Related discussions"
                      value={area.relatedDiscussions}
                      mono
                    />

                    <RiskField
                      label="Documentation coverage"
                      value={area.documentationCoverage}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </PageContainer>
  );
}