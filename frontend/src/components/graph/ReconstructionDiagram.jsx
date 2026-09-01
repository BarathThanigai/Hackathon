import './ReconstructionDiagram.css';

export default function ReconstructionDiagram() {
  return (
    <div className="recon-diagram">
      <svg viewBox="0 0 640 300" className="recon-svg" role="img" aria-label="Diagram showing the question flowing through semantic search and the knowledge graph into the AI engine and final answer">
        <DiagramDefs />

        <Node x={320} y={20} w={160} label="Your question" tone="neutral" />

        <Branch fromX={320} fromY={54} toX={190} toY={100} />
        <Branch fromX={320} fromY={54} toX={450} toY={100} />

        <Node x={190} y={100} w={168} label="Semantic search" sub="RAG · vector search" tone="accent" />
        <Node x={450} y={100} w={168} label="Knowledge graph" sub="Neo4j · relationships" tone="purple" />

        <Straight fromX={190} fromY={134} toX={190} toY={172} />
        <Straight fromX={450} fromY={134} toX={450} toY={172} />

        <Node x={190} y={172} w={168} label="Relevant evidence" tone="neutral" />
        <Node x={450} y={172} w={168} label="Relationships" tone="neutral" />

        <Branch fromX={190} fromY={206} toX={320} toY={244} flip />
        <Branch fromX={450} fromY={206} toX={320} toY={244} />

        <Node x={320} y={244} w={160} label="AI engine" tone="accent" />

        <Straight fromX={320} fromY={278} toX={320} toY={294} short />
      </svg>
      <div className="recon-answer-label">Explainable answer, grounded in both evidence and context</div>
    </div>
  );
}

function DiagramDefs() {
  return (
    <defs>
      <marker id="recon-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L8,4 L0,8 Z" className="recon-arrowhead" />
      </marker>
    </defs>
  );
}

function Node({ x, y, w, label, sub, tone = 'neutral' }) {
  const h = sub ? 44 : 34;
  return (
    <g transform={`translate(${x - w / 2}, ${y})`}>
      <rect width={w} height={h} rx="9" className={`recon-node tone-${tone}`} />
      <text x={w / 2} y={sub ? 19 : h / 2 + 4} textAnchor="middle" className="recon-node-label">{label}</text>
      {sub && <text x={w / 2} y={33} textAnchor="middle" className="recon-node-sub mono">{sub}</text>}
    </g>
  );
}

function Straight({ fromX, fromY, toX, toY, short }) {
  return <line x1={fromX} y1={fromY} x2={toX} y2={toY - (short ? 0 : 6)} className="recon-line" markerEnd={short ? undefined : 'url(#recon-arrow)'} />;
}

function Branch({ fromX, fromY, toX, toY }) {
  const midY = (fromY + toY) / 2 + 8;
  const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY - 6}`;
  return <path d={d} className="recon-line" fill="none" markerEnd="url(#recon-arrow)" />;
}
