import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: '⌂', end: true },
  { to: '/ask', label: 'Ask', icon: '⌕' },
  { to: '/decisions', label: 'Decisions', icon: '◇' },
  { to: '/graph', label: 'Knowledge Graph', icon: '◈' },
  { to: '/sources', label: 'Sources', icon: '▣' },
  { to: '/risk', label: 'Knowledge at Risk', icon: '⚠' },
];

export default function Sidebar() {
  const { project, projectId, setProjectId, projects, addProject } = useProject();
  const [addingProject, setAddingProject] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const projectPickerRef = useRef(null);

  useEffect(() => {
    const closeProjectMenu = (event) => {
      if (!projectPickerRef.current?.contains(event.target)) setProjectMenuOpen(false);
    };
    const closeProjectMenuOnEscape = (event) => {
      if (event.key === 'Escape') setProjectMenuOpen(false);
    };
    document.addEventListener('mousedown', closeProjectMenu);
    document.addEventListener('keydown', closeProjectMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeProjectMenu);
      document.removeEventListener('keydown', closeProjectMenuOnEscape);
    };
  }, []);

  const submitProject = (event) => {
    event.preventDefault();
    if (addProject(projectName)) { setProjectName(''); setAddingProject(false); }
  };
  return <aside className="sidebar">
    <div className="sidebar-brand"><span className="sidebar-brand-mark">◇</span><span className="sidebar-brand-name">MemoryMap</span></div>
    <div className="project-picker" ref={projectPickerRef}>
      <span className="project-picker-label">ACTIVE CONTEXT</span>
      <button
        type="button"
        className={`project-picker-control${projectMenuOpen ? ' open' : ''}`}
        onClick={() => setProjectMenuOpen((isOpen) => !isOpen)}
        aria-expanded={projectMenuOpen}
        aria-haspopup="listbox"
        aria-controls="project-context-menu"
      >
        <span className="project-picker-mark">◈</span>
        <span className="project-picker-current">
          <span className="project-picker-current-name">{project.name}</span>
          <span className="project-picker-current-meta">Workspace context</span>
        </span>
        <span className="project-picker-arrow">⌄</span>
      </button>
      {projectMenuOpen && (
        <div id="project-context-menu" className="project-picker-menu" role="listbox" aria-label="Choose project context">
          <div className="project-picker-menu-heading">SWITCH CONTEXT</div>
          {projects.map((item) => (
            <button
              type="button"
              role="option"
              aria-selected={item.id === projectId}
              className={`project-picker-option${item.id === projectId ? ' selected' : ''}`}
              key={item.id}
              onClick={() => { setProjectId(item.id); setProjectMenuOpen(false); }}
            >
              <span className="project-picker-option-icon">{item.id === projectId ? '✓' : '◈'}</span>
              <span className="project-picker-option-copy">
                <span className="project-picker-option-name">{item.name}</span>
                <span className="project-picker-option-description">{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
    <div className="project-add">
      {addingProject ? <form onSubmit={submitProject} className="project-add-form"><input autoFocus value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" aria-label="New project name" /><button type="submit" aria-label="Save project">+</button><button type="button" onClick={() => setAddingProject(false)} aria-label="Cancel">×</button></form> : <button className="project-add-button" onClick={() => setAddingProject(true)}><span>+</span> Add project</button>}
    </div>
    <nav className="sidebar-nav">{NAV_ITEMS.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}><span className="sidebar-link-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav>
    <div className="sidebar-divider" />
    <div className="sidebar-system"><div className="sidebar-system-label">System</div><div className="sidebar-system-status"><span className="status-dot" />Connected</div></div>
    <div className="sidebar-footer"><div className="sidebar-user"><UserButton /><div><div className="sidebar-footer-name">Your account</div><div className="sidebar-footer-sub">Manage profile</div></div></div></div>
  </aside>;
}
