import { useEffect, useRef, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import IngestionDiagram from '../components/graph/IngestionDiagram';
import { fetchSources, uploadSource, connectRepository } from '../services/api';
import './Sources.css';

export default function Sources() {
  const [sources, setSources] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSources().then(setSources);
  }, []);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    for (const file of files) {
      const placeholder = { id: `temp-${file.name}`, name: file.name, kind: 'document', status: 'processing', steps: ['Uploaded'] };
      setSources((prev) => [placeholder, ...(prev || [])]);
      await uploadSource(file);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const submitRepo = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setConnecting(true);
    await connectRepository(repoUrl.trim());
    setConnecting(false);
    setConnected(true);
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
        onChange={(e) => handleFiles(e.target.files)}
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
            {connected && <div className="src-github-connected">Connected — commits and pull requests will sync into the graph.</div>}
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
          {sources?.map((s) => (
            <Card key={s.id} className="src-item">
              <div className="src-item-head">
                <span className="src-item-name mono">{s.name}</span>
                <Badge tone={s.status === 'complete' ? 'success' : 'warn'}>
                  {s.status === 'complete' ? 'Indexed' : 'Processing'}
                </Badge>
              </div>
              <ul className="src-item-steps">
                {['Uploaded', 'Text extracted', 'Chunked', 'Embedded', 'Added to knowledge graph'].map((step) => (
                  <li key={step} className={s.steps.includes(step) ? 'done' : ''}>
                    <span className="src-item-check">{s.steps.includes(step) ? '✓' : '·'}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
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
