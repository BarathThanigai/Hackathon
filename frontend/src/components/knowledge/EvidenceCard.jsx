import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import { sources } from '../../data/mockData';
import './EvidenceCard.css';

const TONE = {
  document: 'document',
  github: 'github',
  meeting: 'meeting',
};

const LABEL = {
  document: 'Document',
  github: 'GitHub',
  meeting: 'Meeting',
};

function findSourceForEvidence(evidence) {
  if (evidence.type !== 'document') return null;

  return sources.find((source) => (
    source.name === evidence.title
  )) || null;
}

export default function EvidenceCard({ index, evidence }) {
  const source = findSourceForEvidence(evidence);

  const content = (
    <>
      <div className="evidence-card-head">
        <span className="evidence-card-index mono">{index}</span>

        <div className="evidence-card-titles">
          <div className="evidence-card-title">{evidence.title}</div>
          <div className="evidence-card-subtitle">{evidence.subtitle}</div>
        </div>

        <Badge tone={TONE[evidence.type] || 'neutral'}>
          {LABEL[evidence.type] || evidence.type}
        </Badge>
      </div>

      {evidence.excerpt && (
        <p className="evidence-card-excerpt">
          &ldquo;{evidence.excerpt}&rdquo;
        </p>
      )}
    </>
  );

  if (source) {
    return (
      <Link
        to={`/sources/${encodeURIComponent(source.id)}`}
        className="evidence-card evidence-card-link"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="evidence-card">
      {content}
    </div>
  );
}