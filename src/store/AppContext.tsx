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
import {
  demoSamples,
  demoExperiments,
  demoNotebookEntries,
  demoSimulationResults,
} from '../data/demoData';
import { simulationTick } from '../simulation/engine';

const STORAGE_KEY = 'genesis-lab-state-v1';

interface AppState {
  samples: Sample[];
  experiments: Experiment[];
  notebookEntries: NotebookEntry[];
  simulationResults: SimulationResult[];
  activeSimulation: Simulation | null;
  settings: AppSettings;
}

type AppAction =
  | { type: 'SET_SAMPLES'; payload: Sample[] }
  | { type: 'ADD_SAMPLE'; payload: Sample }
  | { type: 'UPDATE_SAMPLE'; payload: Sample }
  | { type: 'SET_EXPERIMENTS'; payload: Experiment[] }
  | { type: 'ADD_EXPERIMENT'; payload: Experiment }
  | { type: 'UPDATE_EXPERIMENT'; payload: Experiment }
  | { type: 'DELETE_EXPERIMENT'; payload: string }
  | { type: 'SET_NOTEBOOK'; payload: NotebookEntry[] }
  | { type: 'ADD_NOTEBOOK'; payload: NotebookEntry }
  | { type: 'UPDATE_NOTEBOOK'; payload: NotebookEntry }
  | { type: 'DELETE_NOTEBOOK'; payload: string }
  | { type: 'SET_SIMULATION'; payload: Simulation | null }
  | { type: 'TICK_SIMULATION' }
  | { type: 'ADD_SIMULATION_RESULT'; payload: SimulationResult }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const defaultSettings: AppSettings = {
  theme: 'dark',
  autosaveNotebook: true,
  simulationSpeedDefault: 1,
  showDisclaimers: true,
  currentProjectName: 'Demonstration Project',
};

const initialState: AppState = {
  samples: demoSamples,
  experiments: demoExperiments,
  notebookEntries: demoNotebookEntries,
  simulationResults: demoSimulationResults,
  activeSimulation: null,
  settings: defaultSettings,
};

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
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
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
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppState>;
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
