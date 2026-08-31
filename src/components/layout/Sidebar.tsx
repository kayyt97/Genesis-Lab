import { Link } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/virtual-lab', label: 'Virtual Lab', icon: '⬡' },
  { path: '/experiment-builder', label: 'Experiment Builder', icon: '⚗' },
  { path: '/samples', label: 'Samples', icon: '◫' },
  { path: '/organisms', label: 'Organisms', icon: '◎' },
  { path: '/molecular-library', label: 'Molecular Library', icon: '⬢' },
  { path: '/results', label: 'Results', icon: '▤' },
  { path: '/notebook', label: 'Research Notebook', icon: '▣' },
  { path: '/glossary', label: 'Glossary', icon: '?' },
  { path: '/safety', label: 'Safety', icon: '⚠' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">GL</div>
        <div>
          <div className="brand-title">Genesis Lab</div>
          <div className="brand-subtitle">Scientific Workstation</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="version-tag">Phase 1 · Prototype</span>
      </div>
    </aside>
  );
}
