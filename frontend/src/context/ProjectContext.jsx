import { createContext, useContext, useEffect, useState } from 'react';

const ProjectContext = createContext(null);

export const PROJECTS = [
  { id: 'all', name: 'All workspace', description: 'Use every available source' },
  { id: 'auth-service', name: 'Authentication Service', description: 'Identity, Redis and access decisions' },
  { id: 'platform', name: 'Platform Foundation', description: 'Shared infrastructure context' },
  { id: 'data', name: 'Data Intelligence', description: 'Data and analytics context' },
];

export function ProjectProvider({ children }) {
  const [projectId, setProjectId] = useState(() => localStorage.getItem('memorymap-project') || 'all');
  const [customProjects, setCustomProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem('memorymap-custom-projects') || '[]'); } catch { return []; }
  });
  useEffect(() => localStorage.setItem('memorymap-project', projectId), [projectId]);
  useEffect(() => localStorage.setItem('memorymap-custom-projects', JSON.stringify(customProjects)), [customProjects]);
  const projects = [...PROJECTS, ...customProjects];
  const addProject = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const id = `project-${Date.now()}`;
    const project = { id, name: trimmed, description: 'Custom project context' };
    setCustomProjects((items) => [...items, project]);
    setProjectId(id);
    return true;
  };
  const project = projects.find((item) => item.id === projectId) || PROJECTS[0];
  return <ProjectContext.Provider value={{ project, projectId, setProjectId, projects, addProject }}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
}
