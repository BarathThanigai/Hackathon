# MemoryMap — Frontend

AI-powered organizational memory platform. Hackathon prototype frontend built with React, Vite, and React Router.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to http://localhost:5173).

## Structure

- `src/pages` — the five main routes (Dashboard, Ask MemoryMap, Knowledge Graph, Sources, Knowledge at Risk)
- `src/components/layout` — Sidebar, PageContainer, ⌘K command palette
- `src/components/ui` — Button, Card, Badge, SearchInput, Modal
- `src/components/knowledge` — DecisionCard, EvidenceCard, EntityCard, Timeline, DecisionDetailModal
- `src/components/graph` — interactive SVG Knowledge Graph, GraphDetails panel, RAG/Knowledge-Graph reconstruction diagram, ingestion pipeline diagram
- `src/services/api.js` — API abstraction layer. Wired to the real `/upload` and `/graph/seed` endpoints; falls back to demo data for the planned `/api/query` endpoint until it's live. Flip `USE_MOCKS = false` once the backend is ready.
- `src/data/mockData.js` — all demo/mock data in one place, matching the shape the backend is expected to return.

## Notes

- Global search: press `⌘K` / `Ctrl+K` anywhere in the app.
- Fonts (IBM Plex Sans / IBM Plex Mono) are self-hosted via `@fontsource`, no external requests at runtime.
- No Tailwind — plain CSS with a small custom design-token system in `src/styles/tokens.css`.
