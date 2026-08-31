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
