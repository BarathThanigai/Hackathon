// Thin API layer. Every call is written against the endpoints that exist
// or are planned on the backend:
//
//   POST /upload        — implemented
//   POST /graph/seed     — implemented (test data)
//   POST /api/query      — planned
//
// Until an endpoint is live, the corresponding function resolves with
// demo data from src/data/mockData.js instead of throwing, so the UI
// can be built and demoed against a realistic shape. Swap the body of
// each function for a real `fetch` when the backend is ready — callers
// don't need to change.

import {
  metrics,
  decisions,
  decisionDetail,
  demoAnswer,
  graphNodes,
  graphEdges,
  graphEntityDetails,
  sources,
  riskAreas,
} from '../data/mockData';

const USE_MOCKS = true; // flip once /api/query is live
const BASE_URL = '';
const DELAY = 500;

function delay(ms = DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchDashboardOverview() {
  if (USE_MOCKS) {
    await delay(300);
    return { metrics, recentDecisions: decisions };
  }
  const res = await fetch(`${BASE_URL}/api/overview`);
  return res.json();
}

// POST /api/query — planned endpoint. Falls back to demo answer.
export async function askQuestion(question) {
  if (USE_MOCKS) {
    await delay(1100);
    return { ...demoAnswer, question };
  }
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('Query failed');
  return res.json();
}

export async function fetchDecisionDetail(id) {
  if (USE_MOCKS) {
    await delay(200);
    return decisionDetail[id] || null;
  }
  const res = await fetch(`${BASE_URL}/api/decisions/${id}`);
  return res.json();
}

export async function fetchGraph() {
  if (USE_MOCKS) {
    await delay(300);
    return { nodes: graphNodes, edges: graphEdges, details: graphEntityDetails };
  }
  const res = await fetch(`${BASE_URL}/graph/seed`);
  return res.json();
}

export async function fetchSources() {
  if (USE_MOCKS) {
    await delay(200);
    return sources;
  }
  const res = await fetch(`${BASE_URL}/api/sources`);
  return res.json();
}

// POST /upload — implemented on the backend.
export async function uploadSource(file) {
  if (USE_MOCKS) {
    await delay(600);
    return { id: `src-${Date.now()}`, name: file.name, status: 'processing' };
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
  return res.json();
}

export async function connectRepository(url) {
  if (USE_MOCKS) {
    await delay(500);
    return { connected: true, url };
  }
  const res = await fetch(`${BASE_URL}/api/github/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function fetchRiskAreas() {
  if (USE_MOCKS) {
    await delay(300);
    return riskAreas;
  }
  const res = await fetch(`${BASE_URL}/api/risk`);
  return res.json();
}
