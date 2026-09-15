import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
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
import KnowledgeRisk from './pages/KnowledgeRisk';
import AuthPage from './pages/AuthPage';

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
    <>
      <SignedIn>
        <DecisionModalProvider>
          <SourceIngestionProvider>
            <div className="app-shell">
              <Sidebar />
              <main className="app-main">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/ask" element={<AskMemoryMap />} />
                  <Route path="/decisions" element={<Decisions />} />
                  <Route path="/decisions/:id" element={<DecisionDetailPage />} />
                  <Route path="/graph" element={<KnowledgeGraphPage />} />
                  <Route path="/sources" element={<Sources />} />
                  <Route path="/risk" element={<KnowledgeRisk />} />
                </Routes>
              </main>
            </div>
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
            <DecisionDetailModal />
          </SourceIngestionProvider>
        </DecisionModalProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
      <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />
      <Route path="*" element={<ProtectedApp />} />
    </Routes>
  );
}
