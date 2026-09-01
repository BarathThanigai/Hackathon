import { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import SearchInput from '../components/ui/SearchInput';
import KnowledgeGraphView from '../components/graph/KnowledgeGraphView';
import GraphDetails from '../components/graph/GraphDetails';
import { fetchGraph } from '../services/api';
import './KnowledgeGraphPage.css';

export default function KnowledgeGraphPage() {
  const [graph, setGraph] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchGraph().then((g) => {
      setGraph(g);
      setSelectedId('redis');
    });
  }, []);

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
      {!graph ? (
        <div className="kg-page-loading">Loading knowledge graph…</div>
      ) : graph.nodes.length === 0 ? (
        <Card className="kg-page-empty">
          <h3>Your organizational graph is empty.</h3>
          <p>Add a knowledge source to begin connecting your organization's memory.</p>
        </Card>
      ) : (
        <div className="kg-page-layout">
          <Card className="kg-page-canvas">
            <KnowledgeGraphView
              nodes={graph.nodes}
              edges={graph.edges}
              selectedId={selectedId}
              onSelect={setSelectedId}
              query={query}
            />
          </Card>
          <Card className="kg-page-panel">
            <GraphDetails entity={selectedId ? graph.details[selectedId] : null} />
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
