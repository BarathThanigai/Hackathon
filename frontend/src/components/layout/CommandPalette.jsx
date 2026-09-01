import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { useDecisionModal } from '../../context/DecisionModalContext';
import './CommandPalette.css';

const INDEX = [
  { category: 'Decisions', label: 'Introduce Redis caching', action: { type: 'decision', id: 'dec-redis-cache' } },
  { category: 'Decisions', label: 'Database indexing strategy changed', action: { type: 'route', to: '/' } },
  { category: 'People', label: 'Rahul', action: { type: 'route', to: '/graph' } },
  { category: 'People', label: 'Meera', action: { type: 'route', to: '/graph' } },
  { category: 'Technologies', label: 'Redis', action: { type: 'route', to: '/graph' } },
  { category: 'Technologies', label: 'PostgreSQL', action: { type: 'route', to: '/graph' } },
  { category: 'Documents', label: 'test_decision.md', action: { type: 'route', to: '/sources' } },
  { category: 'Pull Requests', label: 'PR #428', action: { type: 'route', to: '/graph' } },
  { category: 'Projects', label: 'Authentication Service', action: { type: 'route', to: '/risk' } },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { openDecision } = useDecisionModal();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? INDEX.filter((i) => i.label.toLowerCase().includes(q)) : INDEX;
    const grouped = {};
    filtered.forEach((item) => {
      grouped[item.category] = grouped[item.category] || [];
      grouped[item.category].push(item);
    });
    return grouped;
  }, [query]);

  if (!open) return null;

  const runAction = (action) => {
    if (action.type === 'decision') openDecision(action.id);
    else navigate(action.to);
    onClose();
  };

  return (
    <Modal onClose={onClose} width={560} align="top">
      <div className="cmdk">
        <div className="cmdk-input-row">
          <span className="cmdk-icon">⌕</span>
          <input
            autoFocus
            placeholder="Search decisions, people, technologies, documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="mono">Esc</kbd>
        </div>
        <div className="cmdk-results">
          {Object.keys(results).length === 0 && (
            <div className="cmdk-empty">No results for “{query}”</div>
          )}
          {Object.entries(results).map(([category, items]) => (
            <div key={category} className="cmdk-group">
              <div className="cmdk-group-label">{category}</div>
              {items.map((item) => (
                <button key={item.label} className="cmdk-item" onClick={() => runAction(item.action)}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
