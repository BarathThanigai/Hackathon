import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import CommandPalette from './components/layout/CommandPalette';
import DecisionDetailModal from './components/knowledge/DecisionDetailModal';
import { DecisionModalProvider } from './context/DecisionModalContext';
import { SourceIngestionProvider } from './context/SourceIngestionContext';
import Dashboard from './pages/Dashboard';
import Decisions from './pages/Decisions';
import DecisionDetailPage from './pages/DecisionDetailPage';
import AskMemoryMap from './pages/AskMemoryMap';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import Sources from './pages/Sources';
import SourceDetailPage from './pages/SourceDetailPage';
import KnowledgeRisk from './pages/KnowledgeRisk';
import EntityPage from './pages/EntityPage';
import NewProjectPage from './pages/NewProjectPage';
import { ProjectProvider } from './context/ProjectProvider';

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      const isK = e.key.toLowerCase() === 'k';
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <BrowserRouter>
      <DecisionModalProvider>
        <SourceIngestionProvider>
          <ProjectProvider>
            <div className="app-shell">
              <Sidebar />

            <main className="app-main">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ask" element={<AskMemoryMap />} />
                <Route path="/decisions" element={<Decisions />} />
                <Route path="/decisions/:id" element={<DecisionDetailPage />} />
                <Route path="/graph" element={<KnowledgeGraphPage />} />
                <Route path="/entities/:type/:id" element={<EntityPage />} />
                <Route path="/projects/new" element={<NewProjectPage />} />
                <Route path="/sources" element={<Sources />} />
                <Route path="/sources/:id" element={<SourceDetailPage />} />
                <Route path="/risk" element={<KnowledgeRisk />} />
              </Routes>
            </main>
            </div>

          <CommandPalette
            open={paletteOpen}
            onClose={() => setPaletteOpen(false)}
          />

          <DecisionDetailModal />
          </ProjectProvider>
        </SourceIngestionProvider>
      </DecisionModalProvider>
    </BrowserRouter>
  );
}