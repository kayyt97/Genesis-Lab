/**
 * Paired, replicate-based educational studies for A549 lung adenocarcinoma.
 * These are deterministic computer simulations, not biological experiments.
 */
import type { EnvironmentConditions, TherapeuticTreatmentConfig } from '../types';
import type { TherapeuticDesign, TherapeuticIntendedOutcome } from '../types/scientific';
import { createSimulation, simulationTick, startSimulation } from '../simulation/engine';
import { defaultEnvironment } from '../data/demoData';
import { generateSeed } from './seededRandom';
import { deriveMovementReplicateSeed } from './tumourCellMovementReadout';
import { therapeuticConfigFromDesign } from './tumourCellSimulation';
import { GENESIS_LAB_VERSION } from './genesisLabVersion';

export const LUNG_CANCER_CELL_MODEL_ID = 'ORG-CL-A549';
export const LUNG_CANCER_NOTICE = 'Educational simulation only — not evidence of clinical efficacy';

export type LungStudyKind = 'cell-killing' | 'reduce-movement';

export interface LungReplicate {
  replicate: number;
  seed: number;
  treated: { viability: number; proliferation: number | null; movement: number | null; population: number };
  control: { viability: number; proliferation: number | null; movement: number | null; population: number };
  delta: { viability: number; proliferation: number | null; movement: number | null };
}

export interface LungStudyReport {
  studyId: string;
  title: string;
  kind: LungStudyKind;
  cellModelId: string;
  cellModelName: string;
  candidate: TherapeuticDesign;
  baseSeed: number;
  seeds: number[];
  replicateCount: number;
  ticks: number;
  environment: EnvironmentConditions;
  replicates: LungReplicate[];
  summary: {
    treatedViabilityMean: number;
    controlViabilityMean: number;
    viabilityDifferenceMean: number;
    treatedMovementMean: number;
    controlMovementMean: number;
    movementDifferenceMean: number;
    treatedProliferationMean: number;
    controlProliferationMean: number;
    proliferationDifferenceMean: number;
    viabilityDifferenceSd: number;
    movementDifferenceSd: number;
  };
  methods: string[];
  limitations: string[];
  conclusion: string;
  createdAt: string;
  modelVersion: string;
}

export interface DualLungCancerReport {
  reportId: string;
  createdAt: string;
  cellModel: string;
  notice: string;
  replicateCount: number;
  killing: LungStudyReport;
  spread: LungStudyReport;
}

const commonVariables = {
  targetingPreference: 82,
  uptake: 72,
  therapeuticEffect: 78,
  immuneResponse: 22,
  clearance: 28,
  offTargetEffect: 18,
  resistance: 12,
  toxicityProxy: 16,
};

function makeCandidate(kind: LungStudyKind): TherapeuticDesign {
  const killing = kind === 'cell-killing';
  return {
    id: killing ? 'TD-A549-CYTOTOXIC-EDU' : 'TD-A549-MOTILITY-EDU',
    name: killing ? 'A549 Cytotoxic Candidate' : 'A549 Motility Inhibitor',
    targetType: 'tumour-cell',
    targetDescription: killing
      ? 'Conceptual tumour-cell viability reduction channel in the A549 educational model; no molecular target is claimed.'
      : 'Conceptual tumour-cell motility reduction channel in the A549 educational model; no molecular target is claimed.',
    deliveryModel: 'non-replicating-vector',
    payloadEffect: killing ? 'induce-cell-death' : 'suppress-target',
    intendedOutcome: killing ? 'cell-killing' : 'reduce-movement',
    targetCellModelId: LUNG_CANCER_CELL_MODEL_ID,
    variables: { ...commonVariables },
    notes: `${LUNG_CANCER_NOTICE}. Conceptual parameters only; not a real medicine, vector, or treatment recommendation.`,
    createdAt: '2026-10-30T00:00:00.000Z',
    evidence: { level: 'speculative', note: 'Generated for educational simulation; no experimental or clinical validation.' },
  };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}
function sd(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1));
}

function runOne(kind: LungStudyKind, replicate: number, seed: number, env: EnvironmentConditions, ticks: number): LungReplicate {
  const candidate = makeCandidate(kind);
  const treatment: TherapeuticTreatmentConfig = therapeuticConfigFromDesign(candidate);
  let treated = startSimulation(createSimulation(LUNG_CANCER_CELL_MODEL_ID, env, undefined, { seed, therapeuticTreatment: treatment }));
  let control = startSimulation(createSimulation(LUNG_CANCER_CELL_MODEL_ID, env, undefined, { seed, conditionId: `A549-control-${replicate}` }));
  for (let i = 0; i < ticks; i += 1) {
    treated = simulationTick(treated);
    control = simulationTick(control);
  }
  const t = treated.organismState;
  const c = control.organismState;
  return {
    replicate,
    seed,
    treated: { viability: t.viability, proliferation: t.proliferation, movement: t.cellMovement, population: t.population },
    control: { viability: c.viability, proliferation: c.proliferation, movement: c.cellMovement, population: c.population },
    delta: {
      viability: t.viability - c.viability,
      proliferation: t.proliferation == null || c.proliferation == null ? null : t.proliferation - c.proliferation,
      movement: t.cellMovement == null || c.cellMovement == null ? null : t.cellMovement - c.cellMovement,
    },
  };
}

function runStudy(kind: LungStudyKind, baseSeed: number, replicateCount: number, ticks: number, env: EnvironmentConditions): LungStudyReport {
  const candidate = makeCandidate(kind);
  const seeds = Array.from({ length: replicateCount }, (_, index) => deriveMovementReplicateSeed(baseSeed, index + 1));
  const replicates = seeds.map((seed, index) => runOne(kind, index + 1, seed, env, ticks));
  const avg = (select: (r: LungReplicate) => number) => mean(replicates.map(select));
  const viabilityDeltas = replicates.map(r => r.delta.viability);
  const movementDeltas = replicates.map(r => r.delta.movement ?? 0);
  const summary = {
    treatedViabilityMean: avg(r => r.treated.viability),
    controlViabilityMean: avg(r => r.control.viability),
    viabilityDifferenceMean: mean(viabilityDeltas),
    treatedMovementMean: avg(r => r.treated.movement ?? 0),
    controlMovementMean: avg(r => r.control.movement ?? 0),
    movementDifferenceMean: mean(movementDeltas),
    treatedProliferationMean: avg(r => r.treated.proliferation ?? 0),
    controlProliferationMean: avg(r => r.control.proliferation ?? 0),
    proliferationDifferenceMean: avg(r => r.delta.proliferation ?? 0),
    viabilityDifferenceSd: sd(viabilityDeltas),
    movementDifferenceSd: sd(movementDeltas),
  };
  const title = kind === 'cell-killing' ? 'A549 tumour-cell killing study' : 'A549 tumour-cell movement study';
  const primaryEndpoint = kind === 'cell-killing' ? 'viability' : 'movement index';
  const primaryDelta = kind === 'cell-killing' ? summary.viabilityDifferenceMean : summary.movementDifferenceMean;
  return {
    studyId: `A549-${kind.toUpperCase()}-${baseSeed}`,
    title,
    kind,
    cellModelId: LUNG_CANCER_CELL_MODEL_ID,
    cellModelName: 'A549 lung adenocarcinoma cells (catalogue model)',
    candidate,
    baseSeed,
    seeds,
    replicateCount,
    ticks,
    environment: env,
    replicates,
    summary,
    methods: [
      `A549 educational cell model; ${replicateCount} independent seeded replicates.`,
      'Each replicate contains a treated simulation and an untreated control using the same seed and environment.',
      `The conceptual treatment outcome is ${candidate.intendedOutcome}; only the modelled endpoint is interpreted as the primary endpoint.`,
      `Each paired run advances ${ticks} simulation ticks.`,
      `Seeds: ${seeds.join(', ')}.`,
      'Means and sample standard deviations are calculated across paired replicate differences.',
    ],
    limitations: [
      LUNG_CANCER_NOTICE,
      'A549 is a cell-line teaching model and does not represent a whole person, tumour microenvironment, immune system, or clinical disease.',
      'The killing study cannot establish real cell death; the spread study measures only a modelled motility index.',
      'Invasion, distant-organ colonisation, and metastatic events are not simulated and must not be inferred.',
      'Slider values are dimensionless teaching parameters, not doses or real vector specifications.',
      'No real molecular target, compound, vector construct, wet-lab protocol, or clinical recommendation is provided.',
    ],
    conclusion: `Across ${replicateCount} paired simulated replicates, the mean treated-minus-control difference in ${primaryEndpoint} was ${primaryDelta.toFixed(2)} percentage points (sample SD ${(kind === 'cell-killing' ? summary.viabilityDifferenceSd : summary.movementDifferenceSd).toFixed(2)}). This describes only the Genesis Lab model output and does not establish biological or clinical efficacy.`,
    createdAt: new Date().toISOString(),
    modelVersion: GENESIS_LAB_VERSION,
  };
}

export function runDualLungCancerStudies(options?: { baseSeed?: number; replicateCount?: number; ticks?: number; environment?: EnvironmentConditions }): DualLungCancerReport {
  const baseSeed = options?.baseSeed ?? generateSeed();
  const replicateCount = Math.max(5, Math.min(30, Math.floor(options?.replicateCount ?? 5)));
  const ticks = Math.max(1, Math.min(100, Math.floor(options?.ticks ?? 16)));
  const environment = options?.environment ?? { ...defaultEnvironment, temperature: 37, ph: 7.4, oxygen: 21, carbonDioxide: 5 };
  return {
    reportId: `A549-DUAL-${baseSeed}`,
    createdAt: new Date().toISOString(),
    cellModel: 'A549 lung adenocarcinoma cells (catalogue model)',
    notice: LUNG_CANCER_NOTICE,
    replicateCount,
    killing: runStudy('cell-killing', baseSeed, replicateCount, ticks, environment),
    spread: runStudy('reduce-movement', baseSeed, replicateCount, ticks, environment),
  };
}

export function formatDualLungCancerReport(report: DualLungCancerReport): string {
  const lines = [
    'GENESIS LAB — DUAL A549 LUNG CANCER EDUCATIONAL STUDY REPORT',
    report.notice,
    `Report: ${report.reportId}; created: ${report.createdAt}; model: ${report.cellModel}`,
    `Replicates per study: ${report.replicateCount}`,
  ];
  for (const study of [report.killing, report.spread]) {
    lines.push('', `=== ${study.title} ===`, `Candidate: ${study.candidate.name}; outcome: ${study.candidate.intendedOutcome}`, ...study.methods, '',
      'Replicate results (treated / untreated control; simulated estimates):',
      ...study.replicates.map(r => `Replicate ${r.replicate}, seed ${r.seed}: viability ${r.treated.viability.toFixed(2)} / ${r.control.viability.toFixed(2)}; movement ${r.treated.movement?.toFixed(2) ?? 'not measured'} / ${r.control.movement?.toFixed(2) ?? 'not measured'}; proliferation ${r.treated.proliferation?.toFixed(2) ?? 'not measured'} / ${r.control.proliferation?.toFixed(2) ?? 'not measured'}`),
      '', 'Aggregate means:', JSON.stringify(study.summary, null, 2), '', 'Limitations:', ...study.limitations, '', 'Conclusion:', study.conclusion);
  }
  return lines.join('\n');
}
