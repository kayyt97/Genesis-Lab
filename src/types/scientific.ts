import type { TieredText } from '../types/language';
import type { EvidenceMeta } from './evidence';
import type { EnvironmentConditions } from './index';

/** Extended scientific object models for cross-module interoperability */

export interface AtomModel {
  id: string;
  element: string;
  symbol: string;
  atomicNumber: number;
  protons: number;
  neutrons: number;
  electrons: number;
  charge: number;
  isotope?: string;
  energyState: 'ground' | 'excited';
}

export interface BondModel {
  id: string;
  type: 'single' | 'double' | 'triple' | 'ionic';
  atomAId: string;
  atomBId: string;
}

export interface MoleculeModel {
  id: string;
  name: string;
  formula: string;
  atoms: AtomModel[];
  bonds: BondModel[];
  molecularMass: number;
  charge: number;
  functionalGroups: string[];
  biologicalRole?: TieredText;
  structure2d?: { x: number; y: number; atomId: string }[];
  evidence: EvidenceMeta;
}

export type VariantObservationStatus = 'observed' | 'not-measured' | 'reference-only';

export interface GenomicVariant {
  id: string;
  chromosome: string;
  position: number;
  rsId?: string;
  referenceAllele: string;
  alternateAllele: string;
  genotype: string;
  observationStatus: VariantObservationStatus;
  geneId?: string;
}

export interface GeneReference {
  id: string;
  symbol: string;
  name: string;
  chromosome: string;
  start: number;
  end: number;
  description: TieredText;
  function: TieredText;
  pathwayIds: string[];
}

export interface GenomeImportReport {
  totalRowsRead: number;
  successfullyParsed: number;
  chromosomeAssigned: number;
  unsupportedUnmapped: number;
  malformedSkipped: number;
  chromosomeCoverage: Record<string, number>;
  detectedBuild: string;
  exclusionReasons: { reason: string; count: number }[];
}

export interface GenomeUpload {
  id: string;
  fileName: string;
  sourceFormat: '23andme' | 'ancestry' | 'vcf' | 'unknown';
  uploadedAt: string;
  variants: GenomicVariant[];
  variantCount: number;
  isPersisted: boolean;
  importReport?: GenomeImportReport;
}

export interface GenomeSimulationCopy {
  id: string;
  sourceUploadId: string;
  name: string;
  createdAt: string;
  variants: GenomicVariant[];
  editedVariantIds: string[];
  isSimulation: true;
}

export interface PathwayNode {
  id: string;
  type: 'gene' | 'rna' | 'protein' | 'pathway' | 'cell' | 'phenotype';
  label: string;
  description: TieredText;
  linkedGeneId?: string;
  linkedMoleculeId?: string;
}

export interface PathwayEdge {
  from: string;
  to: string;
  label?: string;
}

export interface PathwayModel {
  id: string;
  name: string;
  description: TieredText;
  nodes: PathwayNode[];
  edges: PathwayEdge[];
}

export type TherapeuticTargetType =
  | 'tumour-cell'
  | 'infected-cell'
  | 'receptor'
  | 'pathway'
  | 'gene-function';

export type DeliveryModelType =
  | 'non-replicating-vector'
  | 'lipid-carrier'
  | 'nanoparticle'
  | 'other';

export type PayloadEffectType =
  | 'suppress-target'
  | 'restore-function'
  | 'alter-expression'
  | 'conceptual-payload';

/** Conceptual intended outcomes for educational tumour-cell modelling */
export type TherapeuticIntendedOutcome =
  | 'reduce-movement'
  | 'growth-suppression'
  | 'cell-killing';

export const THERAPEUTIC_INTENDED_OUTCOME_LABELS: Record<TherapeuticIntendedOutcome, string> = {
  'reduce-movement': 'Reduce cell movement',
  'growth-suppression': 'Growth suppression',
  'cell-killing': 'Cell killing',
};

export interface TherapeuticDesign {
  id: string;
  name: string;
  targetType: TherapeuticTargetType;
  targetDescription: string;
  deliveryModel: DeliveryModelType;
  payloadEffect: PayloadEffectType;
  /** Educational intended outcome — kept separate from payload effect */
  intendedOutcome?: TherapeuticIntendedOutcome;
  /** Catalogue cell-line id (e.g. ORG-HELA) when targeting a tumour cell model */
  targetCellModelId?: string;
  variables: {
    targetingPreference: number;
    uptake: number;
    therapeuticEffect: number;
    immuneResponse: number;
    clearance: number;
    offTargetEffect: number;
    resistance: number;
    toxicityProxy: number;
  };
  notes: string;
  createdAt: string;
  evidence: EvidenceMeta;
}

export type ExperimentConditionRole = 'control' | 'experiment-a' | 'experiment-b' | 'experiment-c';

export interface ExperimentCondition {
  id: string;
  role: ExperimentConditionRole;
  label: string;
  environment: EnvironmentConditions;
  compoundIds: string[];
  notes: string;
}

export interface SimulationRun {
  id: string;
  experimentId: string;
  conditionId: string;
  seed: number;
  variabilityEnabled: boolean;
  snapshots: import('./index').SimulationSnapshot[];
  finalState: import('./index').OrganismSimulationState;
  startedAt: string;
  completedAt?: string;
}

export interface HypothesisWorkflow {
  observation: string;
  researchQuestion: string;
  hypothesis: string;
  independentVariable: string;
  dependentVariable: string;
  controls: string;
  prediction: string;
  experimentPlan?: string;
  resultSummary?: string;
  conclusion?: string;
  verdict?: 'supports' | 'does-not-support' | 'inconclusive';
}

export interface ResearchProject {
  id: string;
  title: string;
  researchQuestion: string;
  hypothesis: string;
  notes: string;
  experimentIds: string[];
  simulationRunIds: string[];
  notebookEntryIds: string[];
  includeGenomicData: boolean;
  genomeUploadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabHandoffPayload {
  type: 'molecule' | 'genome-variant' | 'therapeutic' | 'pathway-node';
  sourceModule: string;
  targetModule: string;
  entityId: string;
  label: string;
  timestamp: string;
  moleculeRole?: import('./experimentWorkspace').MoleculeTransferRole;
  formula?: string;
}

export interface TeachingScenario {
  id: string;
  title: string;
  description: TieredText;
  problemType: 'incorrect-control' | 'degraded-sample' | 'unexpected-measurement' | 'contamination' | 'parameter-range';
  options: { id: string; label: string; correct: boolean; explanation: TieredText }[];
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  category: string;
  description: TieredText;
  measures: string[];
  status: 'conceptual' | 'interactive';
}

export type MicroscopeMagnification = 40 | 100 | 400 | 1000;

export interface MicroscopeSpecimen {
  id: string;
  label: string;
  sourceType: 'reference' | 'virtual-lab' | 'sample' | 'experiment';
  sourceId?: string;
  organismCategory?: string;
  morphologySupported: boolean;
  simulatedViability?: number;
  notes?: string;
  /** When true, UI must state this is a generated diagram rather than real histology */
  isGeneratedDiagram?: boolean;
}

export interface LabWorkspaceState {
  activeSpecimenId: string | null;
  compareSpecimenId: string | null;
  autoControlEnabled: boolean;
  controlEnvironment?: EnvironmentConditions;
}

export interface ComparisonSummary {
  differingVariables: string[];
  constantVariables: string[];
  outcomeChanges: { metric: string; direction: 'increased' | 'decreased' | 'unchanged'; magnitude: string; uncertainty?: string }[];
  explanation: TieredText;
  evidence: EvidenceMeta;
}
