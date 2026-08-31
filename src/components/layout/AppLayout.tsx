import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DisclaimerBanner } from '../ui/DisclaimerBanner';
import { useAppState } from '../../store/AppContext';

export function AppLayout() {
  const location = useLocation();
  const { state } = useAppState();

  return (
    <div className="app-layout">
      <Sidebar currentPath={location.pathname} />
      <main className="main-content">
        {state.settings.showDisclaimers && <DisclaimerBanner />}
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
