import './IngestionDiagram.css';

export default function IngestionDiagram() {
  return (
    <div className="ingest-diagram">
      <div className="ingest-row ingest-row-doc">
        <div className="ingest-node ingest-node-doc">Document</div>
      </div>
      <div className="ingest-branches">
        <div className="ingest-branch">
          <div className="ingest-branch-line" />
          <div className="ingest-chain">
            <span className="ingest-node">Chunks</span>
            <span className="ingest-arrow">→</span>
            <span className="ingest-node">Embeddings</span>
            <span className="ingest-arrow">→</span>
            <span className="ingest-node ingest-node-end tone-accent">Vector database</span>
          </div>
        </div>
        <div className="ingest-branch">
          <div className="ingest-branch-line" />
          <div className="ingest-chain">
            <span className="ingest-node">Entities</span>
            <span className="ingest-arrow">→</span>
            <span className="ingest-node">Relationships</span>
            <span className="ingest-arrow">→</span>
            <span className="ingest-node ingest-node-end tone-purple">Knowledge graph</span>
          </div>
        </div>
      </div>
    </div>
  );
}
