import { Link } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/virtual-lab', label: 'Virtual Lab', icon: '⬡' },
  { path: '/experiment-builder', label: 'Experiment Builder', icon: '⚗' },
  { path: '/hypothesis-builder', label: 'Hypothesis Builder', icon: '◆' },
  { path: '/projects', label: 'Research Projects', icon: '▦' },
  { path: '/samples', label: 'Samples', icon: '◫' },
  { path: '/organisms', label: 'Organisms', icon: '◎' },
  { path: '/atomic-lab', label: 'Atomic Lab', icon: '⚛' },
  { path: '/molecule-explorer', label: 'Molecule Explorer', icon: '⬢' },
  { path: '/molecular-library', label: 'Molecular Library', icon: '⬡' },
  { path: '/genome-explorer', label: 'Genome Explorer', icon: '🧬' },
  { path: '/pathway-explorer', label: 'Pathway Explorer', icon: '↯' },
  { path: '/therapeutic-design', label: 'Therapeutic Design', icon: '✚' },
  { path: '/microscope', label: 'Virtual Microscope', icon: '🔬' },
  { path: '/equipment', label: 'Equipment', icon: '⚙' },
  { path: '/results', label: 'Results', icon: '▤' },
  { path: '/notebook', label: 'Research Notebook', icon: '▣' },
  { path: '/assistant', label: 'Research Assistant', icon: '💬' },
  { path: '/teaching', label: 'Teaching Mode', icon: '📖' },
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
      <nav className="sidebar-nav" aria-label="Main">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span className="version-tag">Phase 5 · Polish</span>
      </div>
    </aside>
  );
}
