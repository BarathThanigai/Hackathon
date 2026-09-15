import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import AsyncState from '../components/ui/AsyncState';
import { fetchEntity } from '../services/api';
import './EntityPage.css';

const ENTITY_TYPES = new Set([
  'person',
  'technology',
  'project',
  'decision',
  'meeting',
  'pullrequest',
  'pull-request',
]);

export default function EntityPage() {
  const { type, id } = useParams();
  const [result, setResult] = useState({ key: null, entity: null, error: false });
  const [retryKey, setRetryKey] = useState(0);
  const typeIsKnown = ENTITY_TYPES.has(type?.toLowerCase());
  const requestKey = `${type}/${id}`;

  useEffect(() => {
    let active = true;

    if (!typeIsKnown) return undefined;

    fetchEntity(id, type)
      .then((entity) => {
        if (!active) return;
        setResult({ key: requestKey, entity, error: false });
      })
      .catch(() => {
        if (!active) return;
        setResult({ key: requestKey, entity: null, error: true });
      });

    return () => {
      active = false;
    };
  }, [id, requestKey, retryKey, type, typeIsKnown]);

  const retry = () => {
    setResult({ key: null, entity: null, error: false });
    setRetryKey((value) => value + 1);
  };

  if (typeIsKnown && result.key !== requestKey) {
    return (
      <PageContainer eyebrow="Entity" title="Loading entity…">
        <AsyncState status="loading" title="Loading entity…" />
      </PageContainer>
    );
  }

  if (result.error) {
    return (
      <PageContainer eyebrow="Entity" title="Unable to load entity">
        <AsyncState
          status="error"
          title="Entity could not be loaded"
          message="MemoryMap could not retrieve this entity."
          onRetry={retry}
        />
      </PageContainer>
    );
  }

  if (!result.entity) {
    return (
      <PageContainer
        eyebrow="Entity"
        title="Entity not found"
        subtitle="This entity is not available in MemoryMap."
        actions={<Link className="entity-page-back" to="/graph">← Back to graph</Link>}
      >
        <AsyncState
          status="empty"
          title="No matching entity"
          message={`No ${type || 'entity'} matches “${id}”.`}
        />
      </PageContainer>
    );
  }

  const { node, detail, connections } = result.entity;

  return (
    <PageContainer
      eyebrow={node.type}
      title={node.label}
      subtitle="Entity details and connected organizational knowledge."
      actions={<Link className="entity-page-back" to="/graph">← Back to graph</Link>}
    >
      <div className="entity-page-grid">
        <Card className="entity-page-hero">
          <div className="entity-page-header">
            <div>
              <div className="entity-page-label mono">ENTITY</div>
              <h2 className="entity-page-name">{node.label}</h2>
            </div>
            <Badge tone="neutral">{node.type}</Badge>
          </div>

          <div className="entity-page-meta">
            <div className="entity-page-meta-item">
              <span className="entity-page-meta-label">ID</span>
              <span className="entity-page-meta-value mono">{node.id}</span>
            </div>
            {detail && (
              <>
                <Meta label="Related decisions" value={detail.relatedDecisions} />
                <Meta label="Related projects" value={detail.relatedProjects} />
                <Meta label="Related people" value={detail.relatedPeople} />
              </>
            )}
          </div>

          {detail?.relatedDecisionId && (
            <Link
              className="entity-page-action"
              to={`/decisions/${encodeURIComponent(detail.relatedDecisionId)}`}
            >
              Open existing decision details
            </Link>
          )}
        </Card>

        <Card className="entity-page-knowledge">
          <div className="entity-page-label mono">CONNECTED KNOWLEDGE</div>
          <h2 className="entity-page-section-title">Relationships</h2>
          {connections.length > 0 ? (
            <div className="entity-page-connections">
              {connections.map((connection) => (
                <Link
                  key={`${connection.relationship}-${connection.id}`}
                  className="entity-page-connection"
                  to={`/entities/${encodeURIComponent(connection.type)}/${encodeURIComponent(connection.id)}`}
                >
                  <span>
                    <strong>{connection.label}</strong>
                    <span className="entity-page-relationship mono">{connection.relationship}</span>
                  </span>
                  <span className="entity-page-connection-type">{connection.type}</span>
                </Link>
              ))}
            </div>
          ) : (
            <AsyncState
              status="empty"
              title="No connected knowledge"
              message="No relationships are available for this entity."
            />
          )}
        </Card>
      </div>
    </PageContainer>
  );
}

function Meta({ label, value }) {
  return (
    <div className="entity-page-meta-item">
      <span className="entity-page-meta-label">{label}</span>
      <span className="entity-page-meta-value mono">{value}</span>
    </div>
  );
}
