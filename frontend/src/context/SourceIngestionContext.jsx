import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { fetchSources } from '../services/api';

const SourceIngestionContext = createContext(null);

export function SourceIngestionProvider({ children }) {
  const [sources, setSources] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isInitializingRef = useRef(false);

  const initializeSources = useCallback(async () => {
    if (hasInitialized || isInitializingRef.current) return;

    isInitializingRef.current = true;

    try {
      const loadedSources = await fetchSources();
      setSources((currentSources) => (
        currentSources === null
          ? loadedSources
          : [...currentSources, ...loadedSources]
      ));
      setHasInitialized(true);
    } finally {
      isInitializingRef.current = false;
    }
  }, [hasInitialized]);

  const addSource = useCallback((source) => {
    setSources((currentSources) => [source, ...(currentSources || [])]);
  }, []);

  const replaceSource = useCallback((sourceId, replacement) => {
    setSources((currentSources) => (currentSources || []).map((source) => (
      source.id === sourceId ? replacement : source
    )));
  }, []);

  const failSource = useCallback((sourceId) => {
    setSources((currentSources) => (currentSources || []).map((source) => (
      source.id === sourceId
        ? { ...source, status: 'error', steps: ['Uploaded'] }
        : source
    )));
  }, []);

  return (
    <SourceIngestionContext.Provider value={{
      sources,
      initializeSources,
      addSource,
      replaceSource,
      failSource,
    }}>
      {children}
    </SourceIngestionContext.Provider>
  );
}

export function useSourceIngestion() {
  const context = useContext(SourceIngestionContext);
  if (!context) throw new Error('useSourceIngestion must be used within SourceIngestionProvider');
  return context;
}
