// Keep the UI's existing shapes at this boundary while using live endpoints
// wherever the API provides them. Features without a backend endpoint retain
// their demo data rather than making requests to routes that do not exist.

import {
  metrics,
  decisions,
  decisionDetail,
  graphNodes,
  graphEdges,
  graphEntityDetails,
  sources,
  riskAreas,
} from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const DELAY = 500;

function delay(ms = DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchDashboardOverview() {
  await delay(300);
  return { metrics, recentDecisions: decisions };
}

function normaliseQueryResponse(question, payload) {
  if (payload.answer && Array.isArray(payload.evidence)) return payload;

  const documents = payload.documents?.[0] || [];
  const metadatas = payload.metadatas?.[0] || [];
  const ids = payload.ids?.[0] || [];
  const evidence = documents.map((text, index) => ({
    id: ids[index] || `result-${index}`,
    type: 'document',
    title: metadatas[index]?.filename || 'Indexed document',
    subtitle: 'Semantic search result',
    excerpt: text,
  }));

  return {
    question,
    answer: evidence.length
      ? `I found ${evidence.length} relevant document ${evidence.length === 1 ? 'result' : 'results'} for this question. Review the evidence below for the supporting context.`
      : 'No relevant indexed document was found for this question.',
    evidenceBacked: evidence.length > 0,
    timeline: [],
    evidence,
    related: { people: [], technologies: [], decisions: [], pullRequests: [] },
  };
}

export async function askQuestion(question) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('Query failed');
  return normaliseQueryResponse(question, await res.json());
}

export async function fetchDecisionDetail(id) {
  await delay(200);
  return decisionDetail[id] || null;
}

export async function fetchGraph() {
  await delay(300);
  return { nodes: graphNodes, edges: graphEdges, details: graphEntityDetails };
}

export async function fetchSources() {
  await delay(200);
  return sources;
}

export async function uploadSource(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/ingestion/document`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error((await res.json()).detail || 'Document upload failed');
  const payload = await res.json();
  return {
    id: payload.document_id,
    name: payload.filename,
    kind: 'document',
    status: 'complete',
    steps: ['Uploaded', 'Text extracted', 'Chunked', 'Embedded', 'Added to knowledge graph'],
  };
}

export async function connectRepository(url) {
  await delay(500);
  return { connected: true, url };
}

export async function fetchRiskAreas() {
  await delay(300);
  return riskAreas;
}
