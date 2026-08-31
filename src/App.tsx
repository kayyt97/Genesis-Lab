import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/Dashboard';
import { VirtualLabPage } from './pages/VirtualLab';
import { ExperimentBuilderPage } from './pages/ExperimentBuilder';
import { SamplesPage } from './pages/Samples';
import { OrganismsPage } from './pages/Organisms';
import { MolecularLibraryPage } from './pages/MolecularLibrary';
import { ResultsPage } from './pages/Results';
import { ResearchNotebookPage } from './pages/ResearchNotebook';
import { GlossaryPage } from './pages/Glossary';
import { SafetyPage } from './pages/Safety';
import { SettingsPage } from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="virtual-lab" element={<VirtualLabPage />} />
            <Route path="experiment-builder" element={<ExperimentBuilderPage />} />
            <Route path="samples" element={<SamplesPage />} />
            <Route path="organisms" element={<OrganismsPage />} />
            <Route path="molecular-library" element={<MolecularLibraryPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="notebook" element={<ResearchNotebookPage />} />
            <Route path="glossary" element={<GlossaryPage />} />
            <Route path="safety" element={<SafetyPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
