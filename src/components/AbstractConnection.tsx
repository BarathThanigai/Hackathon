import { useState } from "react"
import type { ReactElement } from "react"

type NodeDef = {
  id: string
  type: string
  cx: number
  cy: number
  icon: (color: string) => ReactElement
}

type EdgeDef = {
  source: string
  target: string
  label: string
}

const NODES: NodeDef[] = [
  {
    id: "person",
    type: "PERSON",
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
    id: "institution",
    type: "INSTITUTION",
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
    id: "organization",
    type: "ORGANIZATION",
    cx: 475,
    cy: 68,
    icon: (c) => (
      <>
        <rect
          x="2"
          y="7"
          width="20"
          height="14"
          rx="1.5"
          fill="none"
          stroke={c}
          strokeWidth="1.4"
        />
        <path
          d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
          fill="none"
          stroke={c}
          strokeWidth="1.4"
        />
        <path
          d="M8 13h8M12 13v5"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    id: "certification",
    type: "CERTIFICATION",
    cx: 520,
    cy: 205,
    icon: (c) => (
      <>
        <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.4" />
        <path
          d="M9 12l2 2 4-4"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    id: "project",
    type: "PROJECT",
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
    id: "technology",
    type: "TECHNOLOGY",
    cx: 192,
    cy: 356,
    icon: (c) => (
      <>
        <polyline
          points="16 18 22 12 16 6"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="8 6 2 12 8 18"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    id: "event",
    type: "EVENT",
    cx: 78,
    cy: 318,
    icon: (c) => (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="2"
          fill="none"
          stroke={c}
          strokeWidth="1.4"
        />
        <path
          d="M16 2v4M8 2v4M3 10h18"
          stroke={c}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    id: "document",
    type: "DOCUMENT",
    cx: 62,
    cy: 192,
    icon: (c) => (
      <>
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          fill="none"
          stroke={c}
          strokeWidth="1.4"
        />
        <polyline points="14 2 14 8 20 8" fill="none" stroke={c} strokeWidth="1.4" />
        <line
          x1="16"
          y1="13"
          x2="8"
          y2="13"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="14"
          y1="17"
          x2="8"
          y2="17"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </>
    ),
  },
]

const EDGES: EdgeDef[] = [
  { source: "person", target: "institution", label: "STUDIED_AT" },
  { source: "person", target: "organization", label: "WORKS_AT" },
  { source: "person", target: "certification", label: "EARNED" },
  { source: "person", target: "project", label: "WORKED_ON" },
  { source: "person", target: "event", label: "ATTENDED" },
  { source: "person", target: "document", label: "AUTHORED" },
  { source: "project", target: "technology", label: "USES" },
]

const NODE_MAP = Object.fromEntries(NODES.map((n) => [n.id, n]))
const PERSON_R = 30
const NODE_R = 20

export default function AbstractConnection() {
  const [hovered, setHovered] = useState<string | null>(null)

  const activeNodeIds = new Set<string>()
  const activeEdgeSet = new Set<number>()

  if (hovered) {
    activeNodeIds.add(hovered)
    EDGES.forEach((e, i) => {
      if (e.source === hovered || e.target === hovered) {
        activeNodeIds.add(e.source)
        activeNodeIds.add(e.target)
        activeEdgeSet.add(i)
      }
    })
  }

  const DRIFT_ANIMS = [
    "nd1", "nd2", "nd3", "nd4", "nd5", "nd6", "nd7",
  ]
  const DRIFT_DUR = [9, 11, 8.5, 12, 10, 9.5, 11.5]
  const DRIFT_DELAY = [0, -2.5, -5, -1.5, -4, -3, -6]

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
        @keyframes nd7 { 0%,100%{transform:translate(0,0)} 42%{transform:translate(2px,3px)} 72%{transform:translate(-4px,-2px)} }
      `}</style>

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(45,212,191,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <svg
        viewBox="0 0 600 420"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="mm-glow-s" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="mm-glow-m" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* PERSON ambient glow rings */}
        <circle
          cx={300}
          cy={205}
          r={52}
          fill="rgba(45,212,191,0.04)"
          style={{ animation: "person-glow 4s ease-in-out infinite" }}
        />
        <circle
          cx={300}
          cy={205}
          r={40}
          fill="rgba(45,212,191,0.055)"
          style={{
            animation: "person-glow 4s ease-in-out infinite",
            animationDelay: "-1.6s",
          }}
        />

        {/* ── Edges ─────────────────────────────────────────────────────── */}
        {EDGES.map((edge, i) => {
          const src = NODE_MAP[edge.source]
          const tgt = NODE_MAP[edge.target]
          if (!src || !tgt) return null

          const isEdgeActive = hovered ? activeEdgeSet.has(i) : true
          const isDimmed = hovered ? !isEdgeActive : false

          const dx = tgt.cx - src.cx
          const dy = tgt.cy - src.cy
          const len = Math.sqrt(dx * dx + dy * dy)
          const ux = dx / len
          const uy = dy / len

          const srcTrim = src.id === "person" ? PERSON_R + 5 : NODE_R + 4
          const tgtTrim = tgt.id === "person" ? PERSON_R + 5 : NODE_R + 4
          const x1 = src.cx + ux * srcTrim
          const y1 = src.cy + uy * srcTrim
          const x2 = tgt.cx - ux * tgtTrim
          const y2 = tgt.cy - uy * tgtTrim

          // Perpendicular label offset
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2
          const nx = -uy
          const ny = ux
          const lx = mx + nx * 13
          const ly = my + ny * 13
          const lw = edge.label.length * 5.1 + 12

          return (
            <g
              key={i}
              style={{
                opacity: isDimmed ? 0.08 : 1,
                transition: "opacity 0.35s ease",
              }}
            >
              {/* Static dim baseline */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.055)"
                strokeWidth="1"
              />
              {/* Animated dash flow */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#2dd4bf"
                strokeWidth={isEdgeActive && hovered ? 1.5 : 0.9}
                strokeDasharray="5 15"
                style={{
                  animation: "edge-flow 2.1s linear infinite",
                  animationDelay: `${-i * 0.32}s`,
                  opacity: isEdgeActive
                    ? hovered
                      ? 0.78
                      : 0.3
                    : 0.07,
                  transition:
                    "opacity 0.35s ease, stroke-width 0.3s ease",
                }}
              />
              {/* Terminal dot on target end */}
              <circle
                cx={x2}
                cy={y2}
                r={1.8}
                fill="#2dd4bf"
                style={{
                  opacity: isEdgeActive ? (hovered ? 0.85 : 0.32) : 0.07,
                }}
              />

              {/* Relationship label */}
              <g
                style={{
                  opacity: hovered
                    ? isEdgeActive
                      ? 1
                      : 0.12
                    : 0.82,
                  transition: "opacity 0.35s ease",
                }}
              >
                <rect
                  x={lx - lw / 2}
                  y={ly - 7.5}
                  width={lw}
                  height={14}
                  rx="2.5"
                  fill="#07090b"
                  stroke={
                    isEdgeActive && hovered
                      ? "rgba(45,212,191,0.38)"
                      : "rgba(28,36,41,0.95)"
                  }
                  strokeWidth="0.8"
                />
                <text
                  x={lx}
                  y={ly + 4.5}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontFamily="'JetBrains Mono', monospace"
                  fill={isEdgeActive && hovered ? "#5eead4" : "#56636a"}
                  letterSpacing="0.07em"
                  fontWeight="500"
                  style={{ transition: "fill 0.3s ease" }}
                >
                  {edge.label}
                </text>
              </g>
            </g>
          )
        })}

        {/* ── Nodes ─────────────────────────────────────────────────────── */}
        {NODES.map((node, ni) => {
          const isPerson = node.id === "person"
          const isHov = hovered === node.id
          const isActive = hovered ? activeNodeIds.has(node.id) : true
          const isDimmed = hovered ? !isActive : false

          const strokeColor = isHov
            ? "#2dd4bf"
            : isActive
              ? isPerson
                ? "rgba(45,212,191,0.58)"
                : "rgba(45,212,191,0.38)"
              : "#1c2429"
          const iconColor = isHov
            ? "#2dd4bf"
            : isActive
              ? "rgba(45,212,191,0.72)"
              : "rgba(86,99,106,0.38)"
          const labelFill = isHov ? "#5eead4" : "#7d8b93"
          const r = isPerson ? PERSON_R : NODE_R
          const lw = node.type.length * 5.1 + 12

          // Drift only on secondary nodes
          const dIdx = (ni - 1 + DRIFT_ANIMS.length) % DRIFT_ANIMS.length
          const driftStyle = isPerson
            ? {}
            : {
                animation: `${DRIFT_ANIMS[dIdx]} ${DRIFT_DUR[dIdx]}s ease-in-out infinite`,
                animationDelay: `${DRIFT_DELAY[dIdx]}s`,
              }

          return (
            <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
              <g
                style={{
                  cursor: "pointer",
                  opacity: isDimmed ? 0.14 : 1,
                  transition: "opacity 0.35s ease",
                  ...driftStyle,
                }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Node shape */}
                {isPerson ? (
                  <circle
                    r={r}
                    fill="#0d1114"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    filter={
                      isHov ? "url(#mm-glow-m)" : "url(#mm-glow-s)"
                    }
                    style={{ transition: "stroke 0.3s ease" }}
                  />
                ) : (
                  <rect
                    x={-r}
                    y={-r}
                    width={r * 2}
                    height={r * 2}
                    rx="7"
                    fill="#0d1114"
                    stroke={strokeColor}
                    strokeWidth="1"
                    filter={isHov ? "url(#mm-glow-s)" : undefined}
                    style={{ transition: "stroke 0.3s ease" }}
                  />
                )}

                {/* Icon (nested SVG, 20×20, centered) */}
                <svg
                  x={-10}
                  y={-10}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  overflow="visible"
                  style={{ pointerEvents: "none" }}
                >
                  {node.icon(iconColor)}
                </svg>

                {/* Type label badge */}
                <rect
                  x={-lw / 2}
                  y={r + 5}
                  width={lw}
                  height={13}
                  rx="3"
                  fill="#07090b"
                  stroke="rgba(28,36,41,0.8)"
                  strokeWidth="0.5"
                />
                <text
                  x={0}
                  y={r + 14.5}
                  textAnchor="middle"
                  fontSize="7.8"
                  fontFamily="'JetBrains Mono', monospace"
                  fill={labelFill}
                  letterSpacing="0.09em"
                  fontWeight="500"
                  style={{
                    transition: "fill 0.3s ease",
                    pointerEvents: "none",
                  }}
                >
                  {node.type}
                </text>
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
