import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { useDecisionModal } from '../../context/DecisionModalContext';
import { fetchDecisions, fetchGraph } from '../../services/api';
import './CommandPalette.css';

const NAVIGATION_ITEMS = [
  {
    category: 'Navigation',
    label: 'Overview',
    action: { type: 'route', to: '/' },
  },
  {
    category: 'Navigation',
    label: 'Ask MemoryMap',
    action: { type: 'route', to: '/ask' },
  },
  {
    category: 'Navigation',
    label: 'Decisions',
    action: { type: 'route', to: '/decisions' },
  },
  {
    category: 'Navigation',
    label: 'Knowledge Graph',
    action: { type: 'route', to: '/graph' },
  },
  {
    category: 'Navigation',
    label: 'Sources',
    action: { type: 'route', to: '/sources' },
  },
  {
    category: 'Navigation',
    label: 'Knowledge at Risk',
    action: { type: 'route', to: '/risk' },
  },
];

function getGraphCategory(type) {
  switch (type) {
    case 'person':
      return 'People';
    case 'technology':
      return 'Technologies';
    case 'project':
      return 'Projects';
    case 'decision':
      return 'Decisions';
    case 'meeting':
      return 'Meetings';
    case 'pullrequest':
      return 'Pull Requests';
    default:
      return 'Knowledge';
  }
}

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const navigate = useNavigate();
  const { openDecision } = useDecisionModal();

  useEffect(() => {
    if (!open) return;

    let active = true;

    Promise.all([fetchGraph(), fetchDecisions()]).then(([graph, decisions]) => {
      if (!active) return;

      const graphItems = graph.nodes.map((node) => ({
        category: getGraphCategory(node.type),
        label: node.label,
        action: {
          type: 'route',
          to: `/graph?entity=${encodeURIComponent(node.id)}`,
        },
      }));

      const decisionItems = decisions.map((decision) => ({
        category: 'Decisions',
        label: decision.title,
        action: {
          type: 'decision',
          id: decision.id,
        },
      }));

      const combined = [...graphItems, ...decisionItems];

      const seen = new Set();

      const uniqueItems = combined.filter((item) => {
        const key = `${item.category}:${item.label}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });

      setKnowledgeItems(uniqueItems);
    });

    return () => {
      active = false;
    };
  }, [open]);

  const index = useMemo(
    () => [...NAVIGATION_ITEMS, ...knowledgeItems],
    [knowledgeItems]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = q
      ? index.filter((item) => {
          const searchableText = item.label.toLowerCase();
          const queryTerms = q.split(/\s+/).filter(Boolean);

          return queryTerms.every((term) => searchableText.includes(term));
        })
      : index;

    const grouped = {};

    filtered.forEach((item) => {
      grouped[item.category] = grouped[item.category] || [];
      grouped[item.category].push(item);
    });

    return grouped;
  }, [query, index]);

  if (!open) return null;

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const runAction = (action) => {
    if (action.type === 'decision') {
      openDecision(action.id);
    } else {
      navigate(action.to);
    }

    handleClose();
  };

  return (
    <Modal onClose={handleClose} width={560} align="top">
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
            <div className="cmdk-empty">
              No results for “{query}”
            </div>
          )}

          {Object.entries(results).map(([category, items]) => (
            <div key={category} className="cmdk-group">
              <div className="cmdk-group-label">{category}</div>

              {items.map((item) => (
                <button
                  key={`${category}-${item.label}`}
                  className="cmdk-item"
                  onClick={() => runAction(item.action)}
                >
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