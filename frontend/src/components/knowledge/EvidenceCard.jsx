import Badge from '../ui/Badge';
import './EvidenceCard.css';

const TONE = { document: 'document', github: 'github', meeting: 'meeting' };
const LABEL = { document: 'Document', github: 'GitHub', meeting: 'Meeting' };

export default function EvidenceCard({ index, evidence }) {
  return (
    <button className="evidence-card">
      <div className="evidence-card-head">
        <span className="evidence-card-index mono">{index}</span>
        <div className="evidence-card-titles">
          <div className="evidence-card-title">{evidence.title}</div>
          <div className="evidence-card-subtitle">{evidence.subtitle}</div>
        </div>
        <Badge tone={TONE[evidence.type] || 'neutral'}>{LABEL[evidence.type] || evidence.type}</Badge>
      </div>
      {evidence.excerpt && <p className="evidence-card-excerpt">&ldquo;{evidence.excerpt}&rdquo;</p>}
    </button>
  );
}
