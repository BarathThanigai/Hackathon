import { createContext, useCallback, useContext, useState } from 'react';

const DecisionModalContext = createContext(null);

export function DecisionModalProvider({ children }) {
  const [openId, setOpenId] = useState(null);

  const openDecision = useCallback((id) => setOpenId(id), []);
  const closeDecision = useCallback(() => setOpenId(null), []);

  return (
    <DecisionModalContext.Provider value={{ openId, openDecision, closeDecision }}>
      {children}
    </DecisionModalContext.Provider>
  );
}

export function useDecisionModal() {
  const ctx = useContext(DecisionModalContext);
  if (!ctx) throw new Error('useDecisionModal must be used within DecisionModalProvider');
  return ctx;
}
