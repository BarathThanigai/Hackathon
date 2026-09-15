import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import AsyncState from '../components/ui/AsyncState';
import IngestionSteps from '../components/knowledge/IngestionSteps';
import { useSourceIngestion } from '../context/SourceIngestionContext';
import './SourceDetailPage.css';

const STEPS = [
  'Uploaded',
  'Text extracted',
  'Chunked',
  'Embedded',
  'Added to knowledge graph',
];

function getStatus(status) {
  switch (status) {
    case 'complete':
      return { label: 'Completed', tone: 'success' };
    case 'error':
      return { label: 'Failed', tone: 'danger' };
    default:
      return { label: 'Processing', tone: 'warn' };
  }
}

export default function SourceDetailPage() {
  const { id } = useParams();

  const {
    sources,
    sourceError,
    initializeSources,
  } = useSourceIngestion();

  useEffect(() => {
    initializeSources();
  }, [initializeSources]);

  const source = sources?.find((item) => item.id === id);

  if (sources === null && !sourceError) {
    return (
      <PageContainer
        eyebrow="Source"
        title="Loading source"
        subtitle="Retrieving source information from MemoryMap."
      >
        <AsyncState
          status="loading"
          title="Loading source…"
        />
      </PageContainer>
    );
  }

  if (sources === null && sourceError) {
    return (
      <PageContainer
        eyebrow="Source"
        title="Unable to load source"
        subtitle="MemoryMap could not retrieve the requested source."
      >
        <AsyncState
          status="error"
          title="Source information could not be loaded"
          message="Check your connection and try again."
          onRetry={initializeSources}
        />
      </PageContainer>
    );
  }

  if (!source) {
    return (
      <PageContainer
        eyebrow="Source"
        title="Source not found"
        subtitle="The requested knowledge source does not exist in MemoryMap."
      >
        <Card className="source-detail-state">
          <p>
            The source with ID <span className="mono">{id}</span> could not be
            found.
          </p>

          <Link className="source-detail-back" to="/sources">
            ← Back to knowledge sources
          </Link>
        </Card>
      </PageContainer>
    );
  }

  const status = getStatus(source.status);

  return (
    <PageContainer
      eyebrow="Knowledge Source"
      title={source.name}
      subtitle="Source metadata and ingestion status."
      actions={
        <Link className="source-detail-back" to="/sources">
          ← Back to sources
        </Link>
      }
    >
      <div className="source-detail-grid">
        <Card>
          <div className="source-detail-header">
            <div>
              <div className="source-detail-label mono">SOURCE</div>
              <h2 className="source-detail-name">{source.name}</h2>
            </div>

            <Badge tone={status.tone}>{status.label}</Badge>
          </div>

          <div className="source-detail-meta">
            <div className="source-detail-meta-item">
              <span className="source-detail-meta-label">ID</span>
              <span className="source-detail-meta-value mono">
                {source.id}
              </span>
            </div>

            <div className="source-detail-meta-item">
              <span className="source-detail-meta-label">Type</span>
              <span className="source-detail-meta-value">
                {source.kind || 'Unknown'}
              </span>
            </div>

            <div className="source-detail-meta-item">
              <span className="source-detail-meta-label">Status</span>
              <span className="source-detail-meta-value">
                {status.label}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="source-detail-section-head">
            <div>
              <div className="source-detail-label mono">INGESTION</div>
              <h2 className="source-detail-section-title">
                Processing pipeline
              </h2>
            </div>
          </div>

          <IngestionSteps
            steps={STEPS}
            completedSteps={source.steps}
            listClassName="source-detail-steps"
            itemClassName="source-detail-step"
            markerClassName="source-detail-step-marker"
          />
        </Card>
      </div>

      {sourceError && (
        <AsyncState
          status="error"
          title="Source list could not be refreshed"
          message="The information currently displayed is still available."
          onRetry={initializeSources}
        />
      )}

      <Card className="source-detail-note">
        <div className="source-detail-label mono">SOURCE CONTENT</div>

        <p>
          Source content is not currently exposed by the frontend source data.
          This page shows the metadata and ingestion state available to
          MemoryMap.
        </p>
      </Card>
    </PageContainer>
  );
}