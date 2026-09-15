import { NavLink } from 'react-router-dom';
import ProjectSelector from '../project/ProjectSelector';
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
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">◆</span>
        <span className="sidebar-brand-name">MemoryMap</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-divider" />

      <ProjectSelector />

      <div className="sidebar-system">
        <div className="sidebar-system-label">System</div>
        <div className="sidebar-system-status">
          <span className="status-dot" />
          Connected
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-name">MemoryMap</div>
        <div className="sidebar-footer-sub">AI Organizational Memory</div>
      </div>
    </aside>
  );
}
