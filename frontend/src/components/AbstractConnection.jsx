import { useState } from 'react';

const NODES = [
  {
    id: 'person',
    type: 'PERSON',
    cx: 300,
    cy: 205,
    icon: (c) => (
      <>
        <path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="7" r="4" fill="none" stroke={c} strokeWidth="1.5" />
      </>
    ),
  },
  {
    id: 'institution',
    type: 'INSTITUTION',
    cx: 105,
    cy: 68,
    icon: (c) => (
      <>
        <path
          d="M3 10.5L12 3l9 7.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8.5z"
          fill="none"
          stroke={c}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M9 20v-6h6v6" fill="none" stroke={c} strokeWidth="1.4" />
      </>
    ),
  },
  {
    id: 'organization',
    type: 'ORGANIZATION',
    cx: 475,
    cy: 68,
    icon: (c) => (
      <>
        <rect x="2" y="7" width="20" height="14" rx="1.5" fill="none" stroke={c} strokeWidth="1.4" />
        <path
          d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
          fill="none"
          stroke={c}
          strokeWidth="1.4"
        />
        <path d="M8 13h8M12 13v5" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'certification',
    type: 'CERTIFICATION',
    cx: 520,
    cy: 205,
    icon: (c) => (
      <>
        <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.4" />
        <path d="M9 12l2 2 4-4" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: 'project',
    type: 'PROJECT',
    cx: 418,
    cy: 338,
    icon: (c) => (
      <path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        fill="none"
        stroke={c}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: 'technology',
    type: 'TECHNOLOGY',
    cx: 192,
    cy: 356,
    icon: (c) => (
      <>
        <polyline points="16 18 22 12 16 6" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="8 6 2 12 8 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: 'event',
    type: 'EVENT',
    cx: 78,
    cy: 318,
    icon: (c) => (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke={c} strokeWidth="1.4" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'document',
    type: 'DOCUMENT',
    cx: 62,
    cy: 192,
    icon: (c) => (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke={c} strokeWidth="1.4" />
        <polyline points="14 2 14 8 20 8" fill="none" stroke={c} strokeWidth="1.4" />
        <line x1="16" y1="13" x2="8" y2="13" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="14" y1="17" x2="8" y2="17" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
];

const EDGES = [
  { source: 'person', target: 'institution', label: 'STUDIED_AT' },
  { source: 'person', target: 'organization', label: 'WORKS_AT' },
  { source: 'person', target: 'certification', label: 'EARNED' },
  { source: 'person', target: 'project', label: 'WORKED_ON' },
  { source: 'person', target: 'event', label: 'ATTENDED' },
  { source: 'person', target: 'document', label: 'AUTHORED' },
  { source: 'project', target: 'technology', label: 'USES' },
];

const NODE_MAP = Object.fromEntries(NODES.map((n) => [n.id, n]));

export default function AbstractConnection() {
  const [hovered, setHovered] = useState(null);

  const activeNodeIds = new Set();
  const activeEdgeSet = new Set();

  if (hovered) {
    activeNodeIds.add(hovered);
    EDGES.forEach((edge, index) => {
      if (edge.source === hovered || edge.target === hovered) {
        activeNodeIds.add(edge.source);
        activeNodeIds.add(edge.target);
        activeEdgeSet.add(index);
      }
    });
  }

  const DRIFT_ANIMS = ['nd1', 'nd2', 'nd3', 'nd4', 'nd5', 'nd6', 'nd7'];
  const DRIFT_DUR = [9, 11, 8.5, 12, 10, 9.5, 11.5];
  const DRIFT_DELAY = [0, -2.5, -5, -1.5, -4, -3, -6];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes edge-flow { to { stroke-dashoffset: -20; } }
        @keyframes person-glow { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
        @keyframes nd1 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(3px,-4px)} 70%{transform:translate(-2px,3px)} }
        @keyframes nd2 { 0%,100%{transform:translate(0,0)} 35%{transform:translate(-4px,3px)} 65%{transform:translate(2px,-3px)} }
        @keyframes nd3 { 0%,100%{transform:translate(0,0)} 45%{transform:translate(3px,4px)} 75%{transform:translate(-3px,-2px)} }
        @keyframes nd4 { 0%,100%{transform:translate(0,0)} 30%{transform:translate(-3px,-4px)} 60%{transform:translate(4px,2px)} }
        @keyframes nd5 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(4px,-2px)} 80%{transform:translate(-2px,4px)} }
        @keyframes nd6 { 0%,100%{transform:translate(0,0)} 38%{transform:translate(-2px,4px)} 68%{transform:translate(3px,-3px)} }
        @keyframes nd7 { 0%,100%{transform:translate(2px,3px)} 42%{transform:translate(2px,3px)} 72%{transform:translate(-4px,-2px)} }
      `}</style>

      <svg viewBox="0 0 600 420" className="h-full w-full" aria-label="Knowledge graph visualization">
        <defs>
          <linearGradient id="edgeGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {EDGES.map((edge, index) => {
          const source = NODE_MAP[edge.source];
          const target = NODE_MAP[edge.target];
          const active = activeEdgeSet.has(index);
          return (
            <g key={`${edge.source}-${edge.target}`}>
              <path
                d={`M ${source.cx} ${source.cy} Q ${(source.cx + target.cx) / 2} ${Math.min(source.cy, target.cy) - 30} ${target.cx} ${target.cy}`}
                fill="none"
                stroke={active ? 'url(#edgeGlow)' : 'rgba(147, 197, 253, 0.28)'}
                strokeWidth={active ? 2.2 : 1.4}
                strokeDasharray={active ? '8 10' : '5 12'}
                strokeLinecap="round"
                style={{ animation: 'edge-flow 2.5s linear infinite', opacity: active ? 1 : 0.7 }}
              />
              <text
                x={(source.cx + target.cx) / 2}
                y={(source.cy + target.cy) / 2 - 14}
                fill={active ? '#9ae6d7' : '#7d8b93'}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
                letterSpacing="1.3"
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {NODES.map((node, index) => {
          const active = hovered ? activeNodeIds.has(node.id) : true;
          const isPerson = node.id === 'person';
          return (
            <g
              key={node.id}
              transform={`translate(${node.cx}, ${node.cy})`}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <g
              style={{
                opacity: active ? 1 : 0.45,
                filter: isPerson ? 'drop-shadow(0 0 18px rgba(45,212,191,0.5))' : 'none',
                animation: `${DRIFT_ANIMS[index % DRIFT_ANIMS.length]} ${DRIFT_DUR[index % DRIFT_DUR.length]}s ease-in-out infinite alternate`,
                animationDelay: `${DRIFT_DELAY[index % DRIFT_DELAY.length]}s`,
              }}
              >
              <circle
                r={isPerson ? 32 : 24}
                fill={isPerson ? 'rgba(45,212,191,0.12)' : 'rgba(34,211,238,0.06)'}
                stroke={isPerson ? '#2dd4bf' : 'rgba(148,163,184,0.35)'}
                strokeWidth={isPerson ? 1.5 : 1}
              />
              <g fill="none" stroke={isPerson ? '#5eead4' : '#78d6e5'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" transform="translate(-12, -12)">
              {node.icon(isPerson ? '#5eead4' : '#9fe7f5')}
            </g>
              <text
                y={isPerson ? 48 : 40}
                textAnchor="middle"
                fill="#e6edf1"
                fontSize="9"
                letterSpacing="1.2"
                fontFamily="JetBrains Mono, monospace"
              >
                {node.type}
              </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
