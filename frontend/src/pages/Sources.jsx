import { useCallback, useEffect, useRef, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import IngestionDiagram from '../components/graph/IngestionDiagram';
import { useSourceIngestion } from '../context/SourceIngestionContext';
import { uploadSource, connectRepository, fetchIngestionStatus } from '../services/api';
import './Sources.css';

export default function Sources() {
  const {
    sources,
    initializeSources,
    addSource,
    replaceSource,
    failSource,
  } = useSourceIngestion();
  const [dragOver, setDragOver] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [repoError, setRepoError] = useState('');
  const fileInputRef = useRef(null);
  const pollingIdsRef = useRef(new Set());

  useEffect(() => {
    initializeSources();
  }, [initializeSources]);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    for (const file of files) {
      const placeholder = {
        id: `temp-${crypto.randomUUID()}`,
        name: file.name,
        kind: 'document',
        status: 'uploading',
        steps: ['Uploaded'],
      };
      addSource(placeholder);
      try {
        const completedSource = await uploadSource(file);
        replaceSource(placeholder.id, completedSource);
        pollIngestion(completedSource.id);
      } catch (error) {
        failSource(placeholder.id, error.message);
      }
    }
  };

  const pollIngestion = useCallback(async function pollIngestion(sourceId, attempt = 0) {
    if (attempt === 0 && pollingIdsRef.current.has(sourceId)) return;
    pollingIdsRef.current.add(sourceId);
    try {
      const source = await fetchIngestionStatus(sourceId);
      replaceSource(sourceId, source);
      if (source.status === 'processing') {
        if (attempt >= 600) {
          pollingIdsRef.current.delete(sourceId);
          failSource(sourceId, 'Ingestion timed out after 10 minutes. Check the backend logs.');
          return;
        }
        window.setTimeout(() => pollIngestion(sourceId, attempt + 1), 1000);
      } else {
        pollingIdsRef.current.delete(sourceId);
      }
    } catch (error) {
      pollingIdsRef.current.delete(sourceId);
      failSource(sourceId, error.message);
    }
  }, [failSource, replaceSource]);

  useEffect(() => {
    sources?.filter((source) => source.status === 'processing').forEach((source) => {
      pollIngestion(source.id);
    });
  }, [pollIngestion, sources]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const submitRepo = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setConnecting(true);
    setRepoError('');
    try {
      const source = await connectRepository(repoUrl.trim());
      addSource(source);
      pollIngestion(source.id);
      setConnected(true);
    } catch (error) {
      setConnected(false);
      setRepoError(error.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <PageContainer
      eyebrow="Ingestion"
      title="Knowledge Sources"
      subtitle="Everything MemoryMap has read, indexed, and connected into your organizational graph."
      actions={<Button onClick={() => fileInputRef.current?.click()}>+ Add Knowledge</Button>}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="src-intro">
        <span>Supports</span>
        <Badge tone="neutral">GitHub</Badge>
        <Badge tone="neutral">Documents</Badge>
        <Badge tone="neutral">Meeting Notes</Badge>
      </div>

      <div className="src-top-grid">
        <Card
          className={`src-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="src-dropzone-icon">▣</div>
          <div className="src-dropzone-title">Drop files here</div>
          <div className="src-dropzone-types">
            <Badge tone="document">PDF</Badge>
            <Badge tone="document">TXT</Badge>
            <Badge tone="document">Markdown</Badge>
            <Badge tone="document">DOCX</Badge>
          </div>
        </Card>

        <Card className="src-github">
          <div className="src-github-title">GitHub repository</div>
          <form onSubmit={submitRepo} className="src-github-form">
            {repoError && <div className="src-item-error">{repoError}</div>}
            <label className="src-github-label mono">Repository URL</label>
            <input
              className="src-github-input"
              placeholder="https://github.com/org/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={connecting}>
              {connecting ? 'Connecting…' : connected ? 'Reconnect repository' : 'Connect repository'}
            </Button>
            {connected && <div className="src-github-connected">Repository ingestion started. Progress appears below.</div>}
          </form>
        </Card>
      </div>

      <section className="src-section">
        <h2 className="src-section-title">Ingestion status</h2>
        {!sources && <div className="src-loading">Loading sources…</div>}
        {sources?.length === 0 && (
          <Card className="src-empty">
            <p>No knowledge sources yet. Drop a document above to begin.</p>
          </Card>
        )}
        <div className="src-list">
          {sources?.map((s) => {
            const status = s.status === 'complete'
              ? { label: 'Completed', tone: 'success' }
              : s.status === 'error'
                ? { label: 'Failed', tone: 'danger' }
                : { label: 'Processing', tone: 'warn' };

            return (
              <Card key={s.id} className="src-item">
                <div className="src-item-head">
                  <span className="src-item-name mono">{s.name}</span>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>
                <ul className="src-item-steps">
                  {(s.kind === 'repository'
                    ? ['Repository queued', 'Finding supported repository files', 'Processing repository file', 'Chunked repository file', 'Extracting knowledge with AI', 'Storing knowledge graph', 'Indexing repository file', 'Completed']
                    : ['Uploaded', 'Text extracted', 'Chunked', 'Embedded', 'Added to knowledge graph']
                  ).map((step) => (
                    <li key={step} className={s.steps.includes(step) ? 'done' : ''}>
                      <span className="src-item-check">{s.steps.includes(step) ? '✓' : '·'}</span>
                      {step}
                    </li>
                  ))}
                </ul>
                {s.checkpoint && <div className="src-item-current">Current checkpoint: {s.checkpoint.replaceAll('_', ' ')}</div>}
                {s.result?.vector_chunks && (
                  <div className="src-item-progress">
                    {s.result.vector_chunks} vector chunk{s.result.vector_chunks === 1 ? '' : 's'} indexed
                    {s.result.embedding_dimensions ? ` · ${s.result.embedding_dimensions} dimensions` : ''}
                  </div>
                )}
                {s.error && <div className="src-item-error">{s.error}</div>}
              </Card>
            );
          })}
        </div>
      </section>

      <section className="src-section">
        <h2 className="src-section-title">How ingestion works</h2>
        <p className="src-section-sub">Every source feeds both semantic retrieval and the knowledge graph at the same time.</p>
        <Card>
          <IngestionDiagram />
        </Card>
      </section>
    </PageContainer>
  );
}
