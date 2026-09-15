import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import SearchInput from '../components/ui/SearchInput';
import AsyncState from '../components/ui/AsyncState';
import KnowledgeGraphView, { TYPE_META } from '../components/graph/KnowledgeGraphView';
import GraphDetails from '../components/graph/GraphDetails';
import { fetchGraph } from '../services/api';
import './KnowledgeGraphPage.css';

export default function KnowledgeGraphPage() {
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [searchParams] = useSearchParams();
  const requestedEntityId = searchParams.get('entity');

  useEffect(() => {
    let active = true;

    fetchGraph()
      .then((result) => {
        if (!active) return;

        setGraph(result);

        const hasRequestedEntity = result.nodes.some(
          (node) => node.id === requestedEntityId,
        );

        setSelectedId(
          hasRequestedEntity ? requestedEntityId : 'redis',
        );
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      });

    return () => {
      active = false;
    };
  }, [requestedEntityId, retryKey]);

  const retry = () => {
    setGraph(null);
    setError(false);
    setRetryKey((value) => value + 1);
  };

  return (
    <PageContainer
      wide
      eyebrow="Explore"
      title="Knowledge Graph"
      subtitle="Explore how people, decisions, projects and technologies are connected."
      actions={
        <SearchInput
          placeholder="Search entities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      }
    >
      {error && (
        <AsyncState
          status="error"
          title="Unable to load the knowledge graph"
          message="MemoryMap could not retrieve the graph data."
          onRetry={retry}
        />
      )}

      {!graph && !error && (
        <AsyncState
          status="loading"
          title="Loading knowledge graph…"
        />
      )}

      {graph && graph.nodes.length === 0 && (
        <AsyncState
          status="empty"
          title="Your organizational graph is empty"
          message="Add a knowledge source to begin connecting your organization's memory."
        />
      )}

      {graph && graph.nodes.length > 0 && (
        <div className="kg-page-layout">
          <div className="kg-page-canvas-wrap">
            <div className="kg-graph-heading">
              <div>
                <div className="kg-graph-kicker mono">Knowledge topology</div>
                <h2>Connected organizational knowledge</h2>
              </div>
              <div className="kg-graph-count mono">{graph.nodes.length} entities · {graph.edges.length} relationships</div>
            </div>
            <Card className="kg-page-canvas">
              <KnowledgeGraphView
                nodes={graph.nodes}
                edges={graph.edges}
                selectedId={selectedId}
                onSelect={setSelectedId}
                query={query}
              />
            </Card>
            <div className="kg-legend" aria-label="Entity types">
              {Object.entries(TYPE_META).map(([type, meta]) => (
                <span key={type} className={`kg-legend-item type-${type}`}>
                  <span className="kg-legend-mark">{meta.short}</span>
                  {meta.label}
                </span>
              ))}
            </div>
          </div>

          <Card className="kg-page-panel">
            <GraphDetails
              entityId={selectedId}
              entity={selectedId ? graph.details[selectedId] : null}
            />
          </Card>
        </div>
      )}
    </PageContainer>
  );
}