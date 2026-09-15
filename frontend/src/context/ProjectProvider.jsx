import { useCallback, useEffect, useState } from 'react';
import { graphNodes } from '../data/mockData';
import { ProjectContext } from './ProjectContext';

const PROJECTS_KEY = 'memorymap-projects';
const ACTIVE_PROJECT_KEY = 'memorymap-active-project';
const projectNode = graphNodes.find((node) => node.id === 'auth-service');
const defaultProject = {
  id: projectNode.id,
  name: projectNode.label,
  description: 'Authentication service knowledge space.',
  teamMembers: ['Rahul'],
  technologies: ['Redis'],
  owner: 'Rahul',
  repositoryUrl: '',
  status: 'Active',
  createdAt: null,
};

function isProject(project) {
  return project
    && typeof project === 'object'
    && typeof project.id === 'string'
    && typeof project.name === 'string'
    && project.name.trim()
    && Array.isArray(project.teamMembers)
    && Array.isArray(project.technologies);
}

function readProjects() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROJECTS_KEY) || 'null');
    if (!Array.isArray(parsed)) return [defaultProject];
    const projects = parsed.filter(isProject);
    return projects.length > 0 ? projects : [defaultProject];
  } catch {
    return [defaultProject];
  }
}

function readActiveProjectId(projects) {
  try {
    const storedId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
    return projects.some((project) => project.id === storedId)
      ? storedId
      : projects[0].id;
  } catch {
    return projects[0].id;
  }
}

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(readProjects);
  const [activeProjectId, setActiveProjectId] = useState(() => (
    readActiveProjectId(readProjects())
  ));

  useEffect(() => {
    try {
      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch {
      // Keep project selection usable when storage is unavailable.
    }
  }, [projects]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
    } catch {
      // Keep project selection usable when storage is unavailable.
    }
  }, [activeProjectId]);

  const selectProject = useCallback((projectId) => {
    setProjects((currentProjects) => {
      if (currentProjects.some((project) => project.id === projectId)) {
        setActiveProjectId(projectId);
      }
      return currentProjects;
    });
  }, []);

  const createProject = useCallback((project) => {
    const createdProject = {
      ...project,
      id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    setProjects((currentProjects) => [...currentProjects, createdProject]);
    setActiveProjectId(createdProject.id);
    return createdProject;
  }, []);

  const activeProject = projects.find((project) => project.id === activeProjectId)
    || projects[0]
    || null;

  return (
    <ProjectContext.Provider value={{ projects, activeProject, selectProject, createProject }}>
      {children}
    </ProjectContext.Provider>
  );
}
