import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppFooter } from './AppFooter';
import { DisclaimerBanner } from '../ui/DisclaimerBanner';
import { LanguageControl } from '../ui/LanguageControl';
import { useAppState } from '../../store/AppContext';

export function AppLayout() {
  const location = useLocation();
  const { state } = useAppState();

  return (
    <div className="app-layout">
      <Sidebar currentPath={location.pathname} />
      <main className="main-content">
        <div className="top-bar">
          <LanguageControl compact />
        </div>
        {state.settings.showDisclaimers && <DisclaimerBanner />}
        <div className="page-container">
          <Outlet />
        </div>
        <AppFooter />
      </main>
    </div>
  );
}
