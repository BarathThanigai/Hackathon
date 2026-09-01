// Demo data for the hackathon prototype.
// This mirrors the shape the real backend (/api/query, /upload, /graph/seed)
// is expected to return. Swap this out in services/api.js once those
// endpoints are live — nothing outside services/api.js should import
// this file directly.

export const metrics = {
  knowledgeSources: 24,
  decisionsCaptured: 137,
  peopleConnected: 42,
  technologiesTracked: 31,
};

export const decisions = [
  {
    id: 'dec-redis-cache',
    title: 'Redis introduced for authentication caching',
    technology: 'Redis',
    decision: 'Caching strategy',
    reason: 'High database load on the authentication service',
    people: ['Rahul'],
    implementedBy: 'PR #428',
    date: 'March 2026',
    source: 'March Architecture Meeting',
  },
  {
    id: 'dec-pg-index',
    title: 'Database indexing strategy changed',
    technology: 'PostgreSQL',
    decision: 'Index optimization',
    reason: 'Slow query performance on the orders table',
    people: ['Meera'],
    implementedBy: 'PR #402',
    date: 'February 2026',
    source: 'Architecture Meeting',
  },
  {
    id: 'dec-queue-migration',
    title: 'Migrated background jobs from cron to a queue',
    technology: 'SQS',
    decision: 'Job scheduling',
    reason: 'Cron jobs were silently failing under load',
    people: ['Dinesh', 'Rahul'],
    implementedBy: 'PR #451',
    date: 'April 2026',
    source: 'Incident postmortem',
  },
];

export const decisionDetail = {
  'dec-redis-cache': {
    id: 'dec-redis-cache',
    title: 'Introduce Redis caching',
    decision: 'Caching strategy',
    why: 'The authentication service was experiencing high database load. Repeated session lookups were hitting Postgres on every request, and response times were degrading under peak traffic.',
    proposedBy: 'Rahul',
    technology: 'Redis',
    discussedIn: 'March Architecture Meeting',
    implementedBy: 'Pull Request #428',
    timeline: [
      'March Architecture Meeting',
      'Decision proposed',
      'Decision approved',
      'PR #428',
      'Implementation',
    ],
    evidence: [
      {
        id: 'ev-1',
        type: 'document',
        title: 'test_decision.md',
        subtitle: 'Decision document',
        excerpt:
          'The team agreed to introduce Redis because the authentication service was experiencing high database load.',
      },
      {
        id: 'ev-2',
        type: 'github',
        title: 'Pull Request #428',
        subtitle: 'GitHub',
      },
      {
        id: 'ev-3',
        type: 'meeting',
        title: 'March Architecture Meeting',
        subtitle: 'Meeting note',
      },
    ],
  },
};

// Answer returned for the canonical demo question.
export const demoAnswer = {
  question: 'Why was Redis introduced?',
  answer:
    "Redis was introduced to reduce repeated database queries in the authentication service after the system experienced high database load.\n\nDuring the March architecture meeting, Rahul proposed Redis caching. The team agreed to the approach, and the decision was implemented through Pull Request #428.",
  evidenceBacked: true,
  timeline: [
    { label: 'March Architecture Meeting' },
    { label: 'High database load identified' },
    { label: 'Rahul proposed Redis caching' },
    { label: 'Team approved decision' },
    { label: 'Pull Request #428' },
    { label: 'Redis introduced' },
  ],
  evidence: [
    {
      id: 'ev-1',
      type: 'document',
      title: 'test_decision.md',
      subtitle: 'Decision document',
      excerpt:
        'The team agreed to introduce Redis because the authentication service was experiencing high database load.',
    },
    {
      id: 'ev-2',
      type: 'github',
      title: 'Pull Request #428',
      subtitle: 'GitHub',
    },
    {
      id: 'ev-3',
      type: 'meeting',
      title: 'March Architecture Meeting',
      subtitle: 'Meeting note',
    },
  ],
  related: {
    people: ['Rahul'],
    technologies: ['Redis'],
    decisions: ['Introduce Redis caching'],
    pullRequests: ['#428'],
  },
};

export const suggestedQuestions = [
  'Why was Redis introduced?',
  'Who owns the authentication service?',
  'Why did we switch from cron to a queue?',
  'What changed in the Postgres indexing strategy?',
];

// --- Knowledge Graph ---

export const graphNodes = [
  { id: 'rahul', label: 'Rahul', type: 'person', x: 120, y: 260 },
  { id: 'redis', label: 'Redis', type: 'technology', x: 430, y: 90 },
  { id: 'auth-service', label: 'Authentication Service', type: 'project', x: 620, y: 260 },
  { id: 'redis-decision', label: 'Redis Decision', type: 'decision', x: 330, y: 260 },
  { id: 'march-meeting', label: 'March Architecture Meeting', type: 'meeting', x: 330, y: 430 },
  { id: 'pr-428', label: 'PR #428', type: 'pullrequest', x: 560, y: 430 },
];

export const graphEdges = [
  { id: 'e1', source: 'rahul', target: 'redis-decision', label: 'PROPOSED' },
  { id: 'e2', source: 'redis-decision', target: 'redis', label: 'USES' },
  { id: 'e3', source: 'redis-decision', target: 'march-meeting', label: 'DISCUSSED_IN' },
  { id: 'e4', source: 'redis-decision', target: 'pr-428', label: 'IMPLEMENTED_BY' },
  { id: 'e5', source: 'redis', target: 'auth-service', label: 'USED_BY' },
  { id: 'e6', source: 'pr-428', target: 'auth-service', label: 'MODIFIES' },
];

export const graphEntityDetails = {
  redis: {
    name: 'Redis',
    type: 'Technology',
    relatedDecisions: 3,
    relatedProjects: 2,
    relatedPeople: 8,
  },
  rahul: {
    name: 'Rahul',
    type: 'Person',
    relatedDecisions: 6,
    relatedProjects: 3,
    relatedPeople: 5,
  },
  'auth-service': {
    name: 'Authentication Service',
    type: 'Project',
    relatedDecisions: 4,
    relatedProjects: 1,
    relatedPeople: 8,
  },
  'redis-decision': {
    name: 'Redis Decision',
    type: 'Decision',
    relatedDecisions: 1,
    relatedProjects: 1,
    relatedPeople: 1,
  },
  'march-meeting': {
    name: 'March Architecture Meeting',
    type: 'Meeting',
    relatedDecisions: 2,
    relatedProjects: 1,
    relatedPeople: 4,
  },
  'pr-428': {
    name: 'PR #428',
    type: 'Pull Request',
    relatedDecisions: 1,
    relatedProjects: 1,
    relatedPeople: 1,
  },
};

// --- Knowledge Sources / ingestion ---

export const sources = [
  {
    id: 'src-1',
    name: 'test_decision.md',
    kind: 'document',
    steps: ['Uploaded', 'Text extracted', 'Chunked', 'Embedded', 'Added to knowledge graph'],
    status: 'complete',
  },
  {
    id: 'src-2',
    name: 'incident-postmortem-2026-04-12.md',
    kind: 'document',
    steps: ['Uploaded', 'Text extracted', 'Chunked', 'Embedded', 'Added to knowledge graph'],
    status: 'complete',
  },
  {
    id: 'src-3',
    name: 'q1-architecture-notes.pdf',
    kind: 'document',
    steps: ['Uploaded', 'Text extracted', 'Chunked'],
    status: 'processing',
  },
];

// --- Knowledge at Risk ---

export const riskAreas = [
  {
    id: 'risk-auth',
    level: 'high',
    title: 'Authentication System',
    primaryContributor: 'Rahul',
    relatedCommits: 43,
    relatedDiscussions: 18,
    documentationCoverage: 'Low',
  },
  {
    id: 'risk-billing',
    level: 'medium',
    title: 'Billing & Invoicing',
    primaryContributor: 'Meera',
    relatedCommits: 27,
    relatedDiscussions: 9,
    documentationCoverage: 'Medium',
  },
  {
    id: 'risk-search',
    level: 'low',
    title: 'Search Indexing',
    primaryContributor: 'Dinesh',
    relatedCommits: 15,
    relatedDiscussions: 12,
    documentationCoverage: 'High',
  },
];
