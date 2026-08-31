import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  Experiment,
  Sample,
  NotebookEntry,
  Simulation,
  SimulationResult,
  AppSettings,
} from '../types';
import type {
  ResearchProject,
  GenomeUpload,
  GenomeSimulationCopy,
  TherapeuticDesign,
  LabHandoffPayload,
  SimulationRun,
  MicroscopeSpecimen,
} from '../types/scientific';
import {
  demoSamples,
  demoExperiments,
  demoNotebookEntries,
  demoSimulationResults,
} from '../data/demoData';
import { simulationTick } from '../simulation/engine';

const STORAGE_KEY = 'genesis-lab-state-v2';

interface AppState {
  samples: Sample[];
  experiments: Experiment[];
  notebookEntries: NotebookEntry[];
  simulationResults: SimulationResult[];
  simulationRuns: SimulationRun[];
  activeSimulation: Simulation | null;
  settings: AppSettings;
  projects: ResearchProject[];
  genomeUpload: GenomeUpload | null;
  genomeSimulationCopies: GenomeSimulationCopy[];
  therapeuticDesigns: TherapeuticDesign[];
  labHandoff: LabHandoffPayload | null;
  priorSimulationSnapshot: Simulation | null;
  microscopeSpecimen: MicroscopeSpecimen | null;
}

type AppAction =
  | { type: 'SET_SAMPLES'; payload: Sample[] }
  | { type: 'ADD_SAMPLE'; payload: Sample }
  | { type: 'UPDATE_SAMPLE'; payload: Sample }
  | { type: 'SET_EXPERIMENTS'; payload: Experiment[] }
  | { type: 'ADD_EXPERIMENT'; payload: Experiment }
  | { type: 'UPDATE_EXPERIMENT'; payload: Experiment }
  | { type: 'DELETE_EXPERIMENT'; payload: string }
  | { type: 'DUPLICATE_EXPERIMENT'; payload: string }
  | { type: 'SET_NOTEBOOK'; payload: NotebookEntry[] }
  | { type: 'ADD_NOTEBOOK'; payload: NotebookEntry }
  | { type: 'UPDATE_NOTEBOOK'; payload: NotebookEntry }
  | { type: 'DELETE_NOTEBOOK'; payload: string }
  | { type: 'SET_SIMULATION'; payload: Simulation | null }
  | { type: 'SAVE_SIMULATION_SNAPSHOT' }
  | { type: 'TICK_SIMULATION' }
  | { type: 'ADD_SIMULATION_RESULT'; payload: SimulationResult }
  | { type: 'ADD_SIMULATION_RUN'; payload: SimulationRun }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_PROJECT'; payload: ResearchProject }
  | { type: 'UPDATE_PROJECT'; payload: ResearchProject }
  | { type: 'SET_ACTIVE_PROJECT'; payload: string | null }
  | { type: 'SET_GENOME_UPLOAD'; payload: GenomeUpload | null }
  | { type: 'ADD_GENOME_SIM_COPY'; payload: GenomeSimulationCopy }
  | { type: 'UPDATE_GENOME_SIM_COPY'; payload: GenomeSimulationCopy }
  | { type: 'ADD_THERAPEUTIC'; payload: TherapeuticDesign }
  | { type: 'UPDATE_THERAPEUTIC'; payload: TherapeuticDesign }
  | { type: 'SET_LAB_HANDOFF'; payload: LabHandoffPayload | null }
  | { type: 'SET_MICROSCOPE_SPECIMEN'; payload: MicroscopeSpecimen | null }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const defaultSettings: AppSettings = {
  theme: 'dark',
  autosaveNotebook: true,
  simulationSpeedDefault: 1,
  showDisclaimers: true,
  currentProjectName: 'Demonstration Project',
  languageLevel: 'standard',
  activeProjectId: null,
  autoControlEnabled: true,
  replicateCount: 1,
};

const demoProject: ResearchProject = {
  id: 'PRJ-DEMO',
  title: 'Demonstration Project',
  researchQuestion: 'How do environmental variables affect microbial growth in prototype simulations?',
  hypothesis: 'Temperature and pH will significantly alter viability in the educational model.',
  notes: 'Phase 2 demonstration project with linked experiments and notebook entries.',
  experimentIds: ['EXP-001', 'EXP-002'],
  simulationRunIds: [],
  notebookEntryIds: ['NB-001', 'NB-002'],
  includeGenomicData: false,
  createdAt: '2026-08-28T08:00:00Z',
  updatedAt: '2026-08-31T12:00:00Z',
};

const initialState: AppState = {
  samples: demoSamples,
  experiments: demoExperiments,
  notebookEntries: demoNotebookEntries,
  simulationResults: demoSimulationResults,
  simulationRuns: [],
  activeSimulation: null,
  settings: defaultSettings,
  projects: [demoProject],
  genomeUpload: null,
  genomeSimulationCopies: [],
  therapeuticDesigns: [],
  labHandoff: null,
  priorSimulationSnapshot: null,
  microscopeSpecimen: null,
};

function duplicateExperiment(exp: Experiment): Experiment {
  const now = new Date().toISOString();
  return {
    ...JSON.parse(JSON.stringify(exp)) as Experiment,
    id: `EXP-${Date.now().toString(36).toUpperCase()}`,
    name: `${exp.name} (Copy)`,
    status: 'draft',
    parentExperimentId: exp.id,
    createdAt: now,
    updatedAt: now,
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SAMPLES':
      return { ...state, samples: action.payload };
    case 'ADD_SAMPLE':
      return { ...state, samples: [...state.samples, action.payload] };
    case 'UPDATE_SAMPLE':
      return {
        ...state,
        samples: state.samples.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };
    case 'SET_EXPERIMENTS':
      return { ...state, experiments: action.payload };
    case 'ADD_EXPERIMENT':
      return { ...state, experiments: [...state.experiments, action.payload] };
    case 'UPDATE_EXPERIMENT':
      return {
        ...state,
        experiments: state.experiments.map((e) =>
          e.id === action.payload.id ? action.payload : e,
        ),
      };
    case 'DELETE_EXPERIMENT':
      return {
        ...state,
        experiments: state.experiments.filter((e) => e.id !== action.payload),
      };
    case 'DUPLICATE_EXPERIMENT': {
      const source = state.experiments.find((e) => e.id === action.payload);
      if (!source) return state;
      const copy = duplicateExperiment(source);
      return { ...state, experiments: [...state.experiments, copy] };
    }
    case 'SET_NOTEBOOK':
      return { ...state, notebookEntries: action.payload };
    case 'ADD_NOTEBOOK':
      return {
        ...state,
        notebookEntries: [action.payload, ...state.notebookEntries],
      };
    case 'UPDATE_NOTEBOOK':
      return {
        ...state,
        notebookEntries: state.notebookEntries.map((n) =>
          n.id === action.payload.id ? action.payload : n,
        ),
      };
    case 'DELETE_NOTEBOOK':
      return {
        ...state,
        notebookEntries: state.notebookEntries.filter(
          (n) => n.id !== action.payload,
        ),
      };
    case 'SET_SIMULATION':
      return { ...state, activeSimulation: action.payload };
    case 'SAVE_SIMULATION_SNAPSHOT':
      return {
        ...state,
        priorSimulationSnapshot: state.activeSimulation
          ? JSON.parse(JSON.stringify(state.activeSimulation))
          : null,
      };
    case 'TICK_SIMULATION':
      if (!state.activeSimulation) return state;
      return {
        ...state,
        activeSimulation: simulationTick(state.activeSimulation),
      };
    case 'ADD_SIMULATION_RESULT':
      return {
        ...state,
        simulationResults: [action.payload, ...state.simulationResults],
      };
    case 'ADD_SIMULATION_RUN':
      return {
        ...state,
        simulationRuns: [action.payload, ...state.simulationRuns],
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case 'SET_ACTIVE_PROJECT':
      return {
        ...state,
        settings: { ...state.settings, activeProjectId: action.payload },
      };
    case 'SET_GENOME_UPLOAD':
      return { ...state, genomeUpload: action.payload };
    case 'ADD_GENOME_SIM_COPY':
      return {
        ...state,
        genomeSimulationCopies: [...state.genomeSimulationCopies, action.payload],
      };
    case 'UPDATE_GENOME_SIM_COPY':
      return {
        ...state,
        genomeSimulationCopies: state.genomeSimulationCopies.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };
    case 'ADD_THERAPEUTIC':
      return {
        ...state,
        therapeuticDesigns: [...state.therapeuticDesigns, action.payload],
      };
    case 'UPDATE_THERAPEUTIC':
      return {
        ...state,
        therapeuticDesigns: state.therapeuticDesigns.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      };
    case 'SET_LAB_HANDOFF':
      return { ...state, labHandoff: action.payload };
    case 'SET_MICROSCOPE_SPECIMEN':
      return { ...state, microscopeSpecimen: action.payload };
    case 'LOAD_STATE': {
      const loaded = action.payload;
      return {
        ...state,
        ...loaded,
        settings: { ...defaultSettings, ...loaded.settings },
        genomeUpload: loaded.genomeUpload ?? null,
      };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadPersistedState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Partial<AppState>;
    const legacy = localStorage.getItem('genesis-lab-state-v1');
    if (legacy) {
      const v1 = JSON.parse(legacy) as Partial<AppState>;
      return {
        ...v1,
        settings: {
          ...defaultSettings,
          ...v1.settings,
          languageLevel: v1.settings?.languageLevel ?? 'standard',
          activeProjectId: v1.settings?.activeProjectId ?? null,
        },
      };
    }
    return null;
  } catch {
    return null;
  }
}

function persistState(state: AppState) {
  try {
    const toSave = {
      experiments: state.experiments,
      notebookEntries: state.notebookEntries,
      samples: state.samples,
      settings: state.settings,
      simulationResults: state.simulationResults,
      simulationRuns: state.simulationRuns,
      projects: state.projects,
      therapeuticDesigns: state.therapeuticDesigns,
      genomeSimulationCopies: state.genomeSimulationCopies,
      ...(state.genomeUpload?.isPersisted ? { genomeUpload: state.genomeUpload } : {}),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage unavailable
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const saved = loadPersistedState();
    if (saved) {
      dispatch({ type: 'LOAD_STATE', payload: saved });
    }
  }, []);

  useEffect(() => {
    persistState(state);
  }, [
    state.experiments,
    state.notebookEntries,
    state.samples,
    state.settings,
    state.simulationResults,
    state.simulationRuns,
    state.projects,
    state.therapeuticDesigns,
    state.genomeSimulationCopies,
    state.genomeUpload,
  ]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function sendToVirtualLab(
  dispatch: Dispatch<AppAction>,
  entityId: string,
  label: string,
  type: LabHandoffPayload['type'],
) {
  dispatch({
    type: 'SET_LAB_HANDOFF',
    payload: {
      type,
      sourceModule: type === 'molecule' ? 'Molecule Explorer' : 'Cross-Lab',
      targetModule: 'Virtual Lab',
      entityId,
      label,
      timestamp: new Date().toISOString(),
    },
  });
}

export function sendToMicroscope(
  dispatch: Dispatch<AppAction>,
  specimen: MicroscopeSpecimen,
) {
  dispatch({ type: 'SET_MICROSCOPE_SPECIMEN', payload: specimen });
  dispatch({
    type: 'SET_LAB_HANDOFF',
    payload: {
      type: 'molecule',
      sourceModule: 'Virtual Lab',
      targetModule: 'Virtual Microscope',
      entityId: specimen.id,
      label: specimen.label,
      timestamp: new Date().toISOString(),
    },
  });
}
