/** Core data models for Genesis Lab */

import type { TieredText } from './language';
import type { ExperimentCondition, HypothesisWorkflow } from './scientific';

export type { LanguageLevel, TieredText } from './language';
export type { EvidenceLevel, EvidenceMeta, DataProvenance } from './evidence';
export * from './scientific';

export type DataSourceType =
  | 'simulation'
  | 'educational'
  | 'hypothesis'
  | 'user-entered'
  | 'validated-evidence';

export interface DataSourceMeta {
  sourceType: DataSourceType;
  label: string;
  disclaimer?: string;
}

export type SampleType =
  | 'bacterial-culture'
  | 'cell-culture'
  | 'tissue'
  | 'environmental'
  | 'protein'
  | 'dna'
  | 'rna';

export type SampleStatus = 'active' | 'stored' | 'depleted' | 'archived';

export interface Sample {
  id: string;
  name: string;
  sampleType: SampleType;
  source: string;
  dateCreated: string;
  storageCondition: string;
  status: SampleStatus;
  associatedExperimentIds: string[];
  notes: string;
}

export type OrganismCategory =
  | 'bacteria'
  | 'viruses'
  | 'fungi'
  | 'mammalian-cells'
  | 'plant-cells'
  | 'proteins'
  | 'prions';

export interface BiologicalEntity {
  id: string;
  commonName: string;
  scientificName: string;
  category: OrganismCategory;
  classification: string;
  description: string;
  characteristics: string[];
  preferredEnvironment: Partial<EnvironmentConditions>;
  associatedExperimentIds: string[];
  references: string[];
}

export interface Compound {
  id: string;
  name: string;
  formula: string;
  molecularMass: number;
  massUnit: string;
  category: string;
  description: string;
  knownInteractions: string[];
  experimentalNotes: string;
  references: string[];
}

export interface EnvironmentConditions {
  temperature: number; // °C
  ph: number;
  oxygen: number; // %
  carbonDioxide: number; // %
  humidity: number; // %
  pressure: number; // kPa
  salinity: number; // ppt
  nutrientAvailability: number; // 0-100
  radiationExposure: number; // mSv/h (demonstration scale)
  incubationTime: number; // hours elapsed
}

export type VariableRole = 'independent' | 'dependent' | 'controlled';

export interface ExperimentVariable {
  name: string;
  role: VariableRole;
  value: string;
  unit?: string;
}

export interface Experiment {
  id: string;
  name: string;
  researchQuestion: string;
  hypothesis: string;
  sampleId?: string;
  organismId?: string;
  controlGroup: string;
  experimentalGroup: string;
  independentVariables: ExperimentVariable[];
  dependentVariables: ExperimentVariable[];
  controlledVariables: ExperimentVariable[];
  compoundIds: string[];
  environment: EnvironmentConditions;
  durationHours: number;
  observations: string[];
  notes: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  conditions?: ExperimentCondition[];
  hypothesisWorkflow?: HypothesisWorkflow;
  simulationSeed?: number;
  variabilityEnabled?: boolean;
  parentExperimentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface OrganismSimulationState {
  population: number;
  viability: number; // 0-100
  replicationRate: number; // per hour
  stress: number; // 0-100
  mutationIndicator: number; // 0-100 (educational indicator)
  environmentalTolerance: number; // 0-100
  /**
   * Tumour-cell educational metrics (0–100).
   * null = not measured for this organism / outcome (never invent a value).
   */
  cellMovement: number | null;
  proliferation: number | null;
}

export interface SimulationEvent {
  tick: number;
  timeHours: number;
  message: string;
  type: 'info' | 'warning' | 'change';
}

export interface SimulationSnapshot {
  tick: number;
  timeHours: number;
  organismState: OrganismSimulationState;
  environment: EnvironmentConditions;
}

/** Attached conceptual therapeutic treatment (experimental dish only) */
export interface TherapeuticTreatmentConfig {
  designId: string;
  designName: string;
  intendedOutcome: import('./scientific').TherapeuticIntendedOutcome;
  targetCellModelId?: string;
  variables: import('./scientific').TherapeuticDesign['variables'];
}

export interface Simulation {
  id: string;
  experimentId?: string;
  organismId: string;
  status: SimulationStatus;
  speed: number;
  currentTick: number;
  timeHours: number;
  organismState: OrganismSimulationState;
  environment: EnvironmentConditions;
  events: SimulationEvent[];
  snapshots: SimulationSnapshot[];
  metadata: DataSourceMeta;
  startedAt?: string;
  completedAt?: string;
  seed?: number;
  variabilityEnabled?: boolean;
  conditionId?: string;
  /** Present only on experimental condition when a therapeutic design is attached */
  therapeuticTreatment?: TherapeuticTreatmentConfig;
}

export interface SimulationResult {
  id: string;
  simulationId: string;
  experimentId?: string;
  summary: string;
  finalState: OrganismSimulationState;
  timeline: SimulationSnapshot[];
  events: SimulationEvent[];
  controlComparison?: {
    controlLabel: string;
    experimentalLabel: string;
    metrics: { name: string; control: number; experimental: number; unit: string }[];
  };
  metadata: DataSourceMeta;
  createdAt: string;
}

export interface NotebookEntry {
  id: string;
  title: string;
  dateTime: string;
  experimentId?: string;
  notes: string;
  observations: string;
  hypothesis: string;
  conclusions: string;
  tags: string[];
  updatedAt: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  plainEnglish: string;
  scientificDefinition: string;
  unit?: string;
  example: string;
  appearsIn: string[];
  relatedTerms: string[];
  categories: GlossaryCategory[];
  aliases?: string[];
  tiered?: TieredText;
  simpleTitle?: string;
}

export type GlossaryCategory =
  | 'atomic'
  | 'chemistry'
  | 'genetics'
  | 'biology'
  | 'equipment'
  | 'experiments'
  | 'measurements'
  | 'microscopy'
  | 'pathways'
  | 'results'
  | 'safety';

export interface AppSettings {
  theme: 'dark';
  autosaveNotebook: boolean;
  simulationSpeedDefault: number;
  showDisclaimers: boolean;
  currentProjectName: string;
  languageLevel: import('./language').LanguageLevel;
  activeProjectId: string | null;
  autoControlEnabled: boolean;
  replicateCount: number;
  showDemoContent: boolean;
}
