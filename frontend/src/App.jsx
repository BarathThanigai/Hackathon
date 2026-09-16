import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import CommandPalette from './components/layout/CommandPalette';
import DecisionDetailModal from './components/knowledge/DecisionDetailModal';
import { DecisionModalProvider } from './context/DecisionModalContext';
import { SourceIngestionProvider } from './context/SourceIngestionContext';
import { ProjectProvider } from './context/ProjectContext';
import Dashboard from './pages/Dashboard';
import Decisions from './pages/Decisions';
import DecisionDetailPage from './pages/DecisionDetailPage';
import AskMemoryMap from './pages/AskMemoryMap';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import Sources from './pages/Sources';
import KnowledgeRisk from './pages/KnowledgeRisk';
import AuthScreen from './pages/AuthScreen';
import HomePage from './pages/HomePage';

function ProtectedApp() {
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
    <ProjectProvider>
      <DecisionModalProvider>
        <SourceIngestionProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="app-main">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ask" element={<AskMemoryMap />} />
                <Route path="/decisions" element={<Decisions />} />
                <Route path="/decisions/:id" element={<DecisionDetailPage />} />
                <Route path="/graph" element={<KnowledgeGraphPage />} />
                <Route path="/sources" element={<Sources />} />
                <Route path="/risk" element={<KnowledgeRisk />} />
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </main>
          </div>
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
          <DecisionDetailModal />
        </SourceIngestionProvider>
      </DecisionModalProvider>
    </ProjectProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthScreen mode="login" onSwitch={() => window.location.assign('/signup')} onSuccess={() => window.location.assign('/dashboard')} />} />
      <Route path="/signup" element={<AuthScreen mode="signup" onSwitch={() => window.location.assign('/login')} onSuccess={() => window.location.assign('/dashboard')} />} />
      <Route path="*" element={<ProtectedApp />} />
    </Routes>
  );
}