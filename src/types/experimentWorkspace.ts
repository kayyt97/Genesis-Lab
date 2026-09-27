import type { EnvironmentConditions } from './index';
import type { WorkspaceProvenanceClass } from './evidence';

export type MoleculeTransferRole =
  | 'environment-component'
  | 'medium-component'
  | 'nutrient'
  | 'treatment'
  | 'analyte'
  | 'sample-component';

export interface TransferredMolecule {
  id: string;
  moleculeId: string;
  name: string;
  formula: string;
  role: MoleculeTransferRole;
  provenance: WorkspaceProvenanceClass;
  addedAt: string;
}

export type ControlMode = 'auto-baseline' | 'custom' | 'none-not-applicable';

export interface ControlConfiguration {
  mode: ControlMode;
  reason?: string;
  sampleId: string;
  displayName: string;
  catalogueEntryId: string;
  environment: EnvironmentConditions;
  updatedAt: string;
}

export type ExperimentLifecycleState =
  | 'draft'
  | 'ready'
  | 'active'
  | 'completed'
  | 'aborted'
  | 'invalid';

export interface ExperimentHistoryEvent {
  timestamp: string;
  type: string;
  detail: string;
}

export interface ActiveExperimentSetup {
  id: string;
  displayId: string;
  lifecycle: ExperimentLifecycleState;
  projectId?: string;
  sampleId: string;
  sampleDisplayName: string;
  catalogueEntryId: string;
  catalogueCategory: string;
  biologicalSystemType: string;
  environment: EnvironmentConditions;
  transferredMolecules: TransferredMolecule[];
  control: ControlConfiguration;
  notes: string;
  history: ExperimentHistoryEvent[];
  provenance: WorkspaceProvenanceClass;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  /** Shared deterministic seed for experimental + control pair */
  simulationSeed?: number;
  /** Conceptual therapeutic attached to the experimental dish only */
  attachedTherapeutic?: import('./index').TherapeuticTreatmentConfig | null;
  /**
   * Pre-vector dish snapshot for before/after educational comparison.
   * Recorded from the experimental dish before (or as) the conceptual vector is applied.
   */
  recordedBaseline?: RecordedDishBaseline | null;
  /**
   * Saved paired tumour response monitoring snapshot (treated vs untreated control).
   * Persisted with the experiment setup so the comparison survives refresh.
   */
  pairedResponseSnapshot?: PairedResponseSnapshot | null;
}

/** Compact persistable paired tumour response comparison (educational simulation). */
export interface PairedResponseSnapshot {
  version: 1;
  savedAt: string;
  genesisLabVersion: string;
  cellModelId: string;
  cellModelName: string;
  designId: string | null;
  designName: string | null;
  intendedOutcome: string | null;
  seed: number | null;
  matchOk: boolean;
  mismatches: string[];
  settings: {
    startingPopulation: number | null;
    ph: number;
    temperature: number;
    oxygen: number;
    durationHours: number;
    simulationVersion: string;
  };
  channelEndpoints: Array<{
    key: string;
    assessment: string;
    treatedStart: number | null;
    treatedEnd: number | null;
    controlStart: number | null;
    controlEnd: number | null;
    percentDifferenceVsControl: string;
  }>;
  movementStatus: string | null;
  movementPlainEnglish: string | null;
}

/** Snapshot of dish metrics before a conceptual vector/treatment is applied */
export interface RecordedDishBaseline {
  recordedAt: string;
  timeHours: number;
  tick: number;
  seed: number;
  organismState: import('./index').OrganismSimulationState;
  /** Matched untreated control state at the same moment, when available */
  controlOrganismState?: import('./index').OrganismSimulationState | null;
  label: string;
}

export interface ScientificReportSection {
  id: string;
  title: string;
  content: string;
  source: 'user-entered' | 'imported' | 'reference' | 'model-generated' | 'not-recorded';
}

export type ReportLanguageLevel = 'simple' | 'standard' | 'technical';

export interface ScientificReport {
  id: string;
  experimentSetupId: string;
  title: string;
  author: string;
  sections: ScientificReportSection[];
  qualityFlags: string[];
  reportLevel: ReportLanguageLevel;
  createdAt: string;
  updatedAt: string;
  finalized: boolean;
}
