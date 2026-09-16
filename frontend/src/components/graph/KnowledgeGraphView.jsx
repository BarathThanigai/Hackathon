import { useCallback, useMemo, useRef, useState } from 'react';
import './KnowledgeGraphView.css';

const TYPE_META = {
  person: { label: 'Person', short: 'P', color: 'person' },
  technology: { label: 'Technology', short: 'T', color: 'technology' },
  project: { label: 'Project', short: '◆', color: 'project' },
  decision: { label: 'Decision', short: 'D', color: 'decision' },
  meeting: { label: 'Meeting', short: 'M', color: 'meeting' },
  pullrequest: { label: 'Pull Request', short: '#', color: 'pullrequest' },
};

const LEGEND_TYPES = ['person', 'project', 'technology', 'decision', 'meeting', 'pullrequest'];

const VIEW_W = 740;
const VIEW_H = 520;
const MIN_K = 0.35;
const MAX_K = 4;

function truncateLabel(label, max = 18) {
  if (!label) return '';
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export default function KnowledgeGraphView({ nodes, edges, selectedId, onSelect, query = '' }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const svgRef = useRef(null);
  const panState = useRef(null); // { pointerId, startClientX, startClientY, startViewX, startViewY }

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

  // --- pan / zoom helpers -------------------------------------------------

  const clampK = (k) => Math.min(MAX_K, Math.max(MIN_K, k));

  const clientToViewBox = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW_W,
      y: ((clientY - rect.top) / rect.height) * VIEW_H,
    };
  }, []);

  const zoomAt = useCallback((clientX, clientY, factor) => {
    setView((prev) => {
      const nextK = clampK(prev.k * factor);
      if (nextK === prev.k) return prev;
      const p = clientToViewBox(clientX, clientY);
      // keep the point under the cursor fixed while zooming
      const nextX = p.x - ((p.x - prev.x) / prev.k) * nextK;
      const nextY = p.y - ((p.y - prev.y) / prev.k) * nextK;
      return { x: nextX, y: nextY, k: nextK };
    });
  }, [clientToViewBox]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0016);
    zoomAt(e.clientX, e.clientY, factor);
  }, [zoomAt]);

  const handlePointerDown = useCallback((e) => {
    // ignore clicks that started on a node (handled by node's own onClick)
    if (e.target.closest('.kg-node')) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    panState.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startViewX: view.x,
      startViewY: view.y,
    };
  }, [view.x, view.y]);

  const handlePointerMove = useCallback((e) => {
    const ps = panState.current;
    if (!ps || ps.pointerId !== e.pointerId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = ((e.clientX - ps.startClientX) / rect.width) * VIEW_W;
    const dy = ((e.clientY - ps.startClientY) / rect.height) * VIEW_H;
    setView((prev) => ({ ...prev, x: ps.startViewX + dx, y: ps.startViewY + dy }));
  }, []);

  const endPan = useCallback((e) => {
    if (panState.current && panState.current.pointerId === e.pointerId) {
      svgRef.current?.releasePointerCapture(e.pointerId);
      panState.current = null;
    }
  }, []);

  const resetView = useCallback(() => setView({ x: 0, y: 0, k: 1 }), []);
  const zoomButton = (factor) => () => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : 0;
    const cy = rect ? rect.top + rect.height / 2 : 0;
    zoomAt(cx, cy, factor);
  };

  const isPanning = panState.current != null;

  return (
    <div className="kg-canvas">
      <div className="kg-canvas-topline">
        <span className="kg-canvas-kicker mono">LIVE KNOWLEDGE MAP</span>
        <span className="kg-canvas-count">{nodes.length} entities · {edges.length} relationships</span>
      </div>

      <div className="kg-zoom-controls" role="group" aria-label="Zoom controls">
        <button type="button" className="kg-zoom-btn" onClick={zoomButton(1.25)} aria-label="Zoom in">+</button>
        <button type="button" className="kg-zoom-btn" onClick={zoomButton(0.8)} aria-label="Zoom out">−</button>
        <button type="button" className="kg-zoom-btn kg-zoom-reset" onClick={resetView} aria-label="Reset view">⤾</button>
      </div>

      <div className="kg-legend" aria-label="Entity types">
        {LEGEND_TYPES.map((type) => (
          <span key={type} className="kg-legend-item">
            <span className={`kg-legend-dot type-${type}`} />
            {TYPE_META[type].label}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={`kg-svg ${isPanning ? 'panning' : ''}`}
        role="img"
        aria-label="Interactive knowledge graph"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerLeave={endPan}
        onDoubleClick={resetView}
      >
        <defs>
          <marker id="kg-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L7,3.5 L0,7 z" className="kg-arrow-head" />
          </marker>
          <filter id="kg-selected-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <g className="kg-edges">
            {edges.map((edge) => {
              const s = nodeById[edge.source];
              const t = nodeById[edge.target];
              if (!s || !t) return null;
              const dimmed = connectedIds && !(connectedIds.has(edge.source) && connectedIds.has(edge.target));
              const mx = (s.x + t.x) / 2;
              const my = (s.y + t.y) / 2;
              // hide edge labels when zoomed out and not part of the active focus, to cut clutter
              const showLabel = view.k > 0.65 || (connectedIds && connectedIds.has(edge.source) && connectedIds.has(edge.target));
              return (
                <g key={edge.id} className={`kg-edge ${dimmed ? 'dimmed' : ''}`}>
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} markerEnd="url(#kg-arrow)" />
                  {showLabel && (
                    <>
                      <rect x={mx - edge.label.length * 3.1 - 4} y={my - 10} width={edge.label.length * 6.2 + 8} height={17} rx="5" className="kg-edge-label-bg" />
                      <text x={mx} y={my + 2} textAnchor="middle" className="kg-edge-label">{edge.label}</text>
                    </>
                  )}
                </g>
              );
            })}
          </g>

          <g className="kg-nodes">
            {nodes.map((node) => {
              const dimmed = (connectedIds && !connectedIds.has(node.id)) || !matches(node);
              const isSelected = node.id === selectedId;
              const meta = TYPE_META[node.type] || { short: '?', label: 'Entity', color: 'entity' };
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
                  <title>{node.label}</title>
                  <circle r="30" className="kg-node-halo" />
                  <circle r="22" className="kg-node-circle" />
                  <text textAnchor="middle" dy="5" className="kg-node-glyph">{meta.short}</text>
                  <text textAnchor="middle" y="38" className="kg-node-label">{truncateLabel(node.label)}</text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}

export { TYPE_META };