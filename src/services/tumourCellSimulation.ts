/**
 * Educational tumour-cell + therapeutic design simulation rules.
 * Deterministic for (design, cell model, seed, time). Every numeric output is a
 * simulated educational estimate — not a prediction of real biological efficacy.
 */

import type { TherapeuticDesign, TherapeuticIntendedOutcome } from '../types/scientific';
import type { OrganismSimulationState, TherapeuticTreatmentConfig } from '../types';
import { seededRange } from './seededRandom';
import { getCatalogueEntry } from './organismSimulationProfile';

export const SIMULATED_ESTIMATE_LABEL = 'simulated educational estimate' as const;

export type MetricStatus = 'measured' | 'not-measured';

export interface EducationalMetricReading {
  key: 'cellMovement' | 'proliferation' | 'viability';
  label: string;
  status: MetricStatus;
  /** null when not-measured — never invent a substitute */
  value: number | null;
  unit: string;
  disclaimer: typeof SIMULATED_ESTIMATE_LABEL;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function isTumourCellModel(organismId: string): boolean {
  const entry = getCatalogueEntry(organismId);
  if (!entry) return false;
  return (
    entry.category === 'tumours-cancer'
    && (entry.entryKind === 'tumour-cell-line' || entry.simulationReady === true)
    && entry.entryKind !== 'neoplasm-taxonomy'
    && entry.entryKind !== 'educational-specimen'
  );
}

/** Stable seed derived from design id + cell id + optional base seed */
export function deriveTumourExperimentSeed(
  designId: string | undefined,
  cellModelId: string,
  baseSeed?: number,
): number {
  let h = (baseSeed ?? 42) >>> 0;
  const str = `${designId ?? 'none'}::${cellModelId}`;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995) >>> 0;
  }
  return h || 1;
}

export function therapeuticConfigFromDesign(design: TherapeuticDesign): TherapeuticTreatmentConfig {
  return {
    designId: design.id,
    designName: design.name,
    intendedOutcome: design.intendedOutcome ?? 'growth-suppression',
    targetCellModelId: design.targetCellModelId,
    variables: { ...design.variables },
  };
}

export interface TumourComparisonReport {
  cellModelId: string;
  cellModelName: string;
  designName: string | null;
  intendedOutcome: string | null;
  controlConditions: string;
  seed: number;
  timePointsHours: number[];
  rows: ReturnType<typeof buildComparisonRows>;
  limitations: string[];
  disclaimer: typeof SIMULATED_ESTIMATE_LABEL;
}

/** Structured comparison report for Virtual Lab / export */
export function buildTumourComparisonReport(opts: {
  cellModelId: string;
  cellModelName: string;
  experimental: OrganismSimulationState;
  control: OrganismSimulationState | null;
  treatment?: TherapeuticTreatmentConfig | null;
  seed: number;
  timePointsHours: number[];
  controlSummary: string;
}): TumourComparisonReport {
  const outcome = opts.treatment?.intendedOutcome;
  return {
    cellModelId: opts.cellModelId,
    cellModelName: opts.cellModelName,
    designName: opts.treatment?.designName ?? null,
    intendedOutcome: outcome
      ? (outcome === 'reduce-movement'
        ? 'Reduce cell movement'
        : outcome === 'growth-suppression'
          ? 'Growth suppression'
          : 'Cell killing')
      : null,
    controlConditions: opts.controlSummary,
    seed: opts.seed,
    timePointsHours: opts.timePointsHours,
    rows: buildComparisonRows(opts.experimental, opts.control, opts.cellModelId, outcome),
    limitations: [
      'All numeric outputs are simulated educational estimates.',
      'Values do not predict real biological efficacy or clinical outcomes.',
      'No real vector construct or wet-lab protocol is produced.',
      'A drop in viability is never evidence of reduced cell movement.',
      'Unsupported metrics are reported as “not measured” rather than invented.',
    ],
    disclaimer: SIMULATED_ESTIMATE_LABEL,
  };
}

/**
 * Which metrics this intended outcome can defensibly influence in Genesis Lab.
 * Unsupported claims must surface as not-measured — never invent a result.
 */
export function supportedMetricsForOutcome(
  outcome: TherapeuticIntendedOutcome | undefined,
  organismId: string,
): Record<'cellMovement' | 'proliferation' | 'viability', boolean> {
  const tumour = isTumourCellModel(organismId);
  if (!tumour) {
    return { cellMovement: false, proliferation: true, viability: true };
  }
  if (!outcome) {
    return { cellMovement: true, proliferation: true, viability: true };
  }
  switch (outcome) {
    case 'reduce-movement':
      return { cellMovement: true, proliferation: true, viability: true };
    case 'growth-suppression':
      return { cellMovement: true, proliferation: true, viability: true };
    case 'cell-killing':
      return { cellMovement: true, proliferation: true, viability: true };
    default:
      return { cellMovement: false, proliferation: false, viability: false };
  }
}

/**
 * Effect strengths from design sliders (0–1 scale). Deterministic given variables.
 */
export function designEffectStrengths(variables: TherapeuticDesign['variables']): {
  delivery: number;
  potency: number;
  selectivity: number;
  drag: number;
} {
  const delivery = clamp((variables.uptake / 100) * (1 - variables.clearance / 200), 0, 1);
  const potency = clamp(variables.therapeuticEffect / 100, 0, 1);
  const selectivity = clamp(variables.targetingPreference / 100, 0, 1);
  const drag = clamp(
    (variables.offTargetEffect + variables.toxicityProxy + variables.resistance + variables.immuneResponse) / 400,
    0,
    1,
  );
  return { delivery, potency, selectivity, drag };
}

export function initialTumourMetrics(
  organismId: string,
  seed: number,
): Pick<OrganismSimulationState, 'cellMovement' | 'proliferation'> {
  if (!isTumourCellModel(organismId)) {
    return { cellMovement: null, proliferation: null };
  }
  // Baseline culture motility / proliferation indices — educational starting points
  const movement = clamp(70 + seededRange(seed, -4, 4, 11), 40, 95);
  const proliferation = clamp(65 + seededRange(seed, -5, 5, 17), 35, 95);
  return { cellMovement: movement, proliferation };
}

/**
 * Apply one educational timestep of a conceptual therapeutic on tumour cells.
 * Control path: pass treatment=undefined — metrics drift only with environment stress.
 */
export function applyTherapeuticTick(opts: {
  organismId: string;
  prev: OrganismSimulationState;
  stress: number; // 0–1 environmental
  dt: number;
  tick: number;
  seed: number;
  treatment?: TherapeuticTreatmentConfig | null;
}): OrganismSimulationState {
  const { organismId, prev, stress, dt, tick, seed, treatment } = opts;
  const tumour = isTumourCellModel(organismId);

  let cellMovement = prev.cellMovement;
  let proliferation = prev.proliferation;
  let viability = prev.viability;
  let replicationRate = prev.replicationRate;

  if (!tumour) {
    return {
      ...prev,
      cellMovement: null,
      proliferation: null,
    };
  }

  // Ensure baselines exist
  if (cellMovement === null || proliferation === null) {
    const init = initialTumourMetrics(organismId, seed);
    cellMovement = cellMovement ?? init.cellMovement;
    proliferation = proliferation ?? init.proliferation;
  }

  // Mild environmental drift (shared by experimental + control)
  const envDrift = seededRange(seed, -0.15, 0.15, tick + 50) * dt;
  cellMovement = clamp((cellMovement as number) - stress * 1.5 * dt + envDrift, 0, 100);
  proliferation = clamp((proliferation as number) * (1 - stress * 0.08 * dt) + envDrift * 0.5, 0, 100);

  if (treatment) {
    const { delivery, potency, selectivity, drag } = designEffectStrengths(treatment.variables);
    const effective = delivery * potency * selectivity * (1 - drag * 0.5);
    const outcome = treatment.intendedOutcome;

    // Outcome-specific channels — keep movement and viability independent.
    if (outcome === 'reduce-movement') {
      const moveDrop = effective * 8 * dt;
      cellMovement = clamp((cellMovement as number) - moveDrop, 0, 100);
      // Slight proliferation coupling only via off-target drag — never equate viability drop to movement success
      proliferation = clamp((proliferation as number) - drag * 1.2 * dt, 0, 100);
      viability = clamp(viability - drag * 0.8 * dt, 0, 100);
    } else if (outcome === 'growth-suppression') {
      const prolifDrop = effective * 7 * dt;
      proliferation = clamp((proliferation as number) - prolifDrop, 0, 100);
      replicationRate = Math.max(0, replicationRate * (1 - effective * 0.15 * dt));
      cellMovement = clamp((cellMovement as number) - drag * 1.0 * dt, 0, 100);
      viability = clamp(viability - drag * 1.0 * dt - effective * 0.5 * dt, 0, 100);
    } else if (outcome === 'cell-killing') {
      const kill = effective * 6 * dt;
      viability = clamp(viability - kill, 0, 100);
      proliferation = clamp((proliferation as number) - effective * 4 * dt, 0, 100);
      cellMovement = clamp((cellMovement as number) - effective * 2 * dt - drag * dt, 0, 100);
      replicationRate = Math.max(0, replicationRate * (1 - effective * 0.2 * dt));
    }
  }

  return {
    ...prev,
    viability,
    replicationRate,
    cellMovement,
    proliferation,
  };
}

export function readEducationalMetrics(
  state: OrganismSimulationState,
  organismId: string,
  outcome?: TherapeuticIntendedOutcome,
): EducationalMetricReading[] {
  const support = supportedMetricsForOutcome(outcome, organismId);
  const mk = (
    key: EducationalMetricReading['key'],
    label: string,
    raw: number | null | undefined,
    supported: boolean,
  ): EducationalMetricReading => ({
    key,
    label,
    status: supported && raw !== null && raw !== undefined ? 'measured' : 'not-measured',
    value: supported && raw !== null && raw !== undefined ? raw : null,
    unit: '%',
    disclaimer: SIMULATED_ESTIMATE_LABEL,
  });

  return [
    mk('cellMovement', 'Cell movement', state.cellMovement, support.cellMovement),
    mk('proliferation', 'Proliferation', state.proliferation, support.proliferation),
    mk('viability', 'Viability', state.viability, support.viability),
  ];
}

export function percentDifference(experimental: number | null, control: number | null): number | null {
  if (experimental === null || control === null) return null;
  if (control === 0) return experimental === 0 ? 0 : null;
  return ((experimental - control) / control) * 100;
}

export function formatMetricDisplay(reading: EducationalMetricReading): string {
  if (reading.status === 'not-measured' || reading.value === null) return 'not measured';
  return `${reading.value.toFixed(1)}${reading.unit} (${reading.disclaimer})`;
}

/** Build comparison rows for report / UI */
export function buildComparisonRows(
  experimental: OrganismSimulationState,
  control: OrganismSimulationState | null,
  organismId: string,
  outcome?: TherapeuticIntendedOutcome,
): Array<{
  metric: string;
  experimental: string;
  control: string;
  percentDifference: string;
  note: string;
}> {
  const expM = readEducationalMetrics(experimental, organismId, outcome);
  const ctrlM = control
    ? readEducationalMetrics(control, organismId, outcome)
    : null;

  return expM.map((e) => {
    const c = ctrlM?.find((x) => x.key === e.key);
    const pct = percentDifference(e.value, c?.value ?? null);
    let note = '';
    if (e.key === 'cellMovement' && e.status === 'measured') {
      note = 'A drop in viability is not evidence of reduced movement.';
    }
    return {
      metric: e.label,
      experimental: formatMetricDisplay(e),
      control: c ? formatMetricDisplay(c) : 'not measured',
      percentDifference: pct === null ? 'not measured' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
      note,
    };
  });
}
