import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import CommandPalette from './components/layout/CommandPalette';
import DecisionDetailModal from './components/knowledge/DecisionDetailModal';
import { DecisionModalProvider } from './context/DecisionModalContext';
import Dashboard from './pages/Dashboard';
import AskMemoryMap from './pages/AskMemoryMap';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import Sources from './pages/Sources';
import KnowledgeRisk from './pages/KnowledgeRisk';

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
        <div className="app-shell">
          <Sidebar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ask" element={<AskMemoryMap />} />
              <Route path="/graph" element={<KnowledgeGraphPage />} />
              <Route path="/sources" element={<Sources />} />
              <Route path="/risk" element={<KnowledgeRisk />} />
            </Routes>
          </main>
        </div>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <DecisionDetailModal />
      </DecisionModalProvider>
    </BrowserRouter>
  );
}
