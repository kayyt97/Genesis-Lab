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
import { AtomicLabPage } from './pages/AtomicLab';
import { MoleculeExplorerPage } from './pages/MoleculeExplorer';
import { GenomeExplorerPage } from './pages/GenomeExplorer';
import { PathwayExplorerPage } from './pages/PathwayExplorer';
import { TherapeuticDesignPage } from './pages/TherapeuticDesign';
import { ResearchProjectsPage } from './pages/ResearchProjects';
import { HypothesisBuilderPage } from './pages/HypothesisBuilder';
import { VirtualMicroscopePage } from './pages/VirtualMicroscope';
import { EquipmentLabPage } from './pages/EquipmentLab';
import { TeachingModePage } from './pages/TeachingMode';
import { ResearchAssistantPage } from './pages/ResearchAssistant';

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
            <Route path="atomic-lab" element={<AtomicLabPage />} />
            <Route path="molecule-explorer" element={<MoleculeExplorerPage />} />
            <Route path="genome-explorer" element={<GenomeExplorerPage />} />
            <Route path="pathway-explorer" element={<PathwayExplorerPage />} />
            <Route path="therapeutic-design" element={<TherapeuticDesignPage />} />
            <Route path="projects" element={<ResearchProjectsPage />} />
            <Route path="hypothesis-builder" element={<HypothesisBuilderPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="notebook" element={<ResearchNotebookPage />} />
            <Route path="microscope" element={<VirtualMicroscopePage />} />
            <Route path="equipment" element={<EquipmentLabPage />} />
            <Route path="teaching" element={<TeachingModePage />} />
            <Route path="assistant" element={<ResearchAssistantPage />} />
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
