import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchSources } from '../services/api';

const SourceIngestionContext = createContext(null);
const STORAGE_KEY = 'memorymap-source-ingestion';

function isSourceRecord(source) {
  return source
    && typeof source === 'object'
    && typeof source.id === 'string'
    && typeof source.name === 'string'
    && typeof source.status === 'string'
    && Array.isArray(source.steps);
}

function readPersistedSources() {
  try {
    const storedSources = window.localStorage.getItem(STORAGE_KEY);
    if (!storedSources) return null;

    const parsedSources = JSON.parse(storedSources);
    if (!Array.isArray(parsedSources)) return null;

    const sourceIds = new Set();
    return parsedSources.filter((source) => (
      isSourceRecord(source) && !sourceIds.has(source.id) && sourceIds.add(source.id)
    ));
  } catch {
    return null;
  }
}

function mergeSources(currentSources, loadedSources) {
  if (currentSources === null) return loadedSources;

  const sourceIds = new Set(currentSources.map((source) => source.id));
  return [
    ...currentSources,
    ...loadedSources.filter((source) => !sourceIds.has(source.id)),
  ];
}

export function SourceIngestionProvider({ children }) {
  const [sources, setSources] = useState(readPersistedSources);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (sources === null) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
    } catch {
      // The app remains usable if localStorage is unavailable or full.
    }
  }, [sources]);

  const initializeSources = useCallback(async () => {
    if (hasInitialized || isInitializingRef.current) return;

    isInitializingRef.current = true;

    try {
      const loadedSources = await fetchSources();
      setSources((currentSources) => mergeSources(currentSources, loadedSources));
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

  const failSource = useCallback((sourceId, error = 'Ingestion failed') => {
    setSources((currentSources) => (currentSources || []).map((source) => (
      source.id === sourceId
        ? { ...source, status: 'error', error }
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
