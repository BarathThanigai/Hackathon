import { createContext, useContext } from 'react';

export const ProjectContext = createContext(null);

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects must be used within ProjectProvider');
  return context;
}
