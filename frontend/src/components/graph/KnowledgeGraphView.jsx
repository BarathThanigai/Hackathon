import { useMemo, useState } from 'react';
import './KnowledgeGraphView.css';

const TYPE_META = {
  person: { label: 'Person', short: 'P' },
  technology: { label: 'Technology', short: 'T' },
  project: { label: 'Project', short: '◆' },
  decision: { label: 'Decision', short: 'D' },
  meeting: { label: 'Meeting', short: 'M' },
  pullrequest: { label: 'Pull Request', short: '#' },
};

export default function KnowledgeGraphView({ nodes, edges, selectedId, onSelect, query = '' }) {
  const [hoveredId, setHoveredId] = useState(null);

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const matches = (n) => !query || n.label.toLowerCase().includes(query.toLowerCase());

  const activeId = hoveredId || selectedId;

  const connectedIds = useMemo(() => {
    if (!activeId) return null;
    const set = new Set([activeId]);
    edges.forEach((e) => {
      if (e.source === activeId) set.add(e.target);
      if (e.target === activeId) set.add(e.source);
    });
    return set;
  }, [activeId, edges]);

  return (
    <div className="kg-canvas">
      <svg viewBox="0 0 740 520" className="kg-svg">
        <g className="kg-edges">
          {edges.map((edge) => {
            const s = nodeById[edge.source];
            const t = nodeById[edge.target];
            if (!s || !t) return null;
            const dimmed = connectedIds && !(connectedIds.has(edge.source) && connectedIds.has(edge.target));
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2;
            return (
              <g key={edge.id} className={`kg-edge ${dimmed ? 'dimmed' : ''}`}>
                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} />
                <rect x={mx - edge.label.length * 3.1} y={my - 9} width={edge.label.length * 6.2} height={15} rx="4" className="kg-edge-label-bg" />
                <text x={mx} y={my + 2} textAnchor="middle" className="kg-edge-label">{edge.label}</text>
              </g>
            );
          })}
        </g>

        <g className="kg-nodes">
          {nodes.map((node) => {
            const dimmed = (connectedIds && !connectedIds.has(node.id)) || !matches(node);
            const isSelected = node.id === selectedId;
            const meta = TYPE_META[node.type] || {};
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className={`kg-node type-${node.type} ${dimmed ? 'dimmed' : ''} ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(node.id)}
                tabIndex={0}
                role="button"
                aria-label={node.label}
                onKeyDown={(e) => (e.key === 'Enter' ? onSelect(node.id) : null)}
              >
                <circle r="22" className="kg-node-circle" />
                <text textAnchor="middle" dy="5" className="kg-node-glyph">{meta.short}</text>
                <text textAnchor="middle" y="38" className="kg-node-label">{node.label}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export { TYPE_META };
