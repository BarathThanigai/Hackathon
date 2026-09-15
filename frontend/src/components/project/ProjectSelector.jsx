import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import './ProjectSelector.css';

export default function ProjectSelector() {
  const { projects, activeProject, selectProject } = useProjects();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!selectorRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="project-selector" ref={selectorRef}>
      <button
        type="button"
        className="project-selector-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="project-selector-icon">◇</span>
        <span className="project-selector-current">
          <span className="project-selector-name">{activeProject?.name || 'Select project'}</span>
          <span className="project-selector-caption">Current project</span>
        </span>
        <span className="project-selector-chevron">⌄</span>
      </button>

      {open && (
        <div className="project-selector-menu" role="menu">
          <div className="project-selector-heading mono">Projects</div>
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="project-selector-option"
              role="menuitem"
              onClick={() => {
                selectProject(project.id);
                setOpen(false);
              }}
            >
              <span className="project-selector-option-icon">◇</span>
              <span>{project.name}</span>
              {project.id === activeProject?.id && <span className="project-selector-check">✓</span>}
            </button>
          ))}
          <div className="project-selector-menu-divider" />
          <Link
            className="project-selector-add"
            to="/projects/new"
            state={{ from: `${location.pathname}${location.search}` }}
            onClick={() => setOpen(false)}
          >
            + Add new project
          </Link>
        </div>
      )}
    </div>
  );
}
