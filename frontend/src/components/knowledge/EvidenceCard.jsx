import Badge from '../ui/Badge';
import './EvidenceCard.css';

const TONE = { document: 'document', github: 'github', meeting: 'meeting' };
const LABEL = { document: 'Document', github: 'GitHub', meeting: 'Meeting' };

export default function EvidenceCard({ index, evidence }) {
  return (
    <div className="evidence-card">
      <div className="evidence-card-head">
        <span className="evidence-card-index mono">{index}</span>
        <div className="evidence-card-titles">
          <div className="evidence-card-title">{evidence.title}</div>
          <div className="evidence-card-subtitle">{evidence.subtitle}</div>
          {evidence.commit_author && (
            <div className="evidence-card-commit">
              Last changed by {evidence.commit_author}
              {evidence.commit_time ? ` · ${formatCommitTime(evidence.commit_time)}` : ''}
            </div>
          )}
        </div>
        <Badge tone={TONE[evidence.type] || 'neutral'}>{LABEL[evidence.type] || evidence.type}</Badge>
      </div>
      {evidence.excerpt && <p className="evidence-card-excerpt">&ldquo;{evidence.excerpt}&rdquo;</p>}
    </div>
  );
}

function formatCommitTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
