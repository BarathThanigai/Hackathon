import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: '⌂', end: true },
  { to: '/ask', label: 'Ask', icon: '⌕' },
  { to: '/decisions', label: 'Decisions', icon: '◇' },
  { to: '/graph', label: 'Knowledge Graph', icon: '◈' },
  { to: '/sources', label: 'Sources', icon: '▣' },
  { to: '/risk', label: 'Knowledge at Risk', icon: '⚠' },
];

export default function Sidebar() {
  const { projectId, setProjectId, projects, addProject } = useProject();
  const [addingProject, setAddingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const submitProject = (event) => {
    event.preventDefault();
    if (addProject(projectName)) { setProjectName(''); setAddingProject(false); }
  };
  return <aside className="sidebar">
    <div className="sidebar-brand"><span className="sidebar-brand-mark">◇</span><span className="sidebar-brand-name">MemoryMap</span></div>
    <label className="project-picker">
      <span className="project-picker-label">ACTIVE CONTEXT</span>
      <span className="project-picker-control"><span className="project-picker-mark">◈</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)} aria-label="Choose project context">{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><span className="project-picker-arrow">⌄</span></span>
    </label>
    <div className="project-add">
      {addingProject ? <form onSubmit={submitProject} className="project-add-form"><input autoFocus value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" aria-label="New project name" /><button type="submit" aria-label="Save project">+</button><button type="button" onClick={() => setAddingProject(false)} aria-label="Cancel">×</button></form> : <button className="project-add-button" onClick={() => setAddingProject(true)}><span>+</span> Add project</button>}
    </div>
    <nav className="sidebar-nav">{NAV_ITEMS.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}><span className="sidebar-link-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav>
    <div className="sidebar-divider" />
    <div className="sidebar-system"><div className="sidebar-system-label">System</div><div className="sidebar-system-status"><span className="status-dot" />Connected</div></div>
    <div className="sidebar-footer"><div className="sidebar-user"><UserButton /><div><div className="sidebar-footer-name">Your account</div><div className="sidebar-footer-sub">Manage profile</div></div></div></div>
  </aside>;
}
