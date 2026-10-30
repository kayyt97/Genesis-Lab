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

/** Stable seed for a tumour experiment.
 * When `baseSeed` is already committed (dish / baseline), preserve it so applying a
 * design does not silently change the matched treated/control/baseline seed.
 * Only derive from design+cell when no seed has been committed yet.
 */
export function deriveTumourExperimentSeed(
  designId: string | undefined,
  cellModelId: string,
  baseSeed?: number,
): number {
  if (baseSeed !== undefined && baseSeed !== null) {
    const preserved = (baseSeed >>> 0) || 1;
    return preserved;
  }
  let h = 42 >>> 0;
  const str = `${designId ?? 'none'}::${cellModelId}`;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995) >>> 0;
  }
  return h || 1;
}

/**
 * Resolve the single matched seed for baseline + treated + untreated control.
 * Preference: recorded baseline seed → setup.simulationSeed → derive from design/cell.
 */
export function resolvePairedExperimentSeed(
  setup: {
    catalogueEntryId: string;
    simulationSeed?: number;
    recordedBaseline?: { seed: number } | null;
  },
  designId?: string,
): number {
  if (setup.recordedBaseline?.seed != null) return setup.recordedBaseline.seed;
  if (setup.simulationSeed != null) return setup.simulationSeed;
  return deriveTumourExperimentSeed(designId, setup.catalogueEntryId);
}

/** True when baseline seed matches the active paired-run seed. */
export function baselineSeedMatchesActive(
  baselineSeed: number | null | undefined,
  activeSeed: number | null | undefined,
): boolean {
  if (baselineSeed == null || activeSeed == null) return false;
  return baselineSeed === activeSeed;
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
    // Seed-dependent response heterogeneity makes independent seeded replicates
    // meaningfully different while keeping each run exactly reproducible. Treated
    // and control arms retain the same environmental seed; only the treatment
    // response receives this bounded educational variability factor.
    const responseVariation = seededRange(seed, 0.85, 1.15, tick + 700);
    const replicateEffective = effective * responseVariation;
    const replicateDrag = drag * responseVariation;
    const outcome = treatment.intendedOutcome;

    // Outcome-specific channels — keep movement and viability independent.
    if (outcome === 'reduce-movement') {
      const moveDrop = replicateEffective * 8 * dt;
      cellMovement = clamp((cellMovement as number) - moveDrop, 0, 100);
      // Slight proliferation coupling only via off-target drag — never equate viability drop to movement success
      proliferation = clamp((proliferation as number) - replicateDrag * 1.2 * dt, 0, 100);
      viability = clamp(viability - replicateDrag * 0.8 * dt, 0, 100);
    } else if (outcome === 'growth-suppression') {
      const prolifDrop = replicateEffective * 7 * dt;
      proliferation = clamp((proliferation as number) - prolifDrop, 0, 100);
      replicationRate = Math.max(0, replicationRate * (1 - replicateEffective * 0.15 * dt));
      cellMovement = clamp((cellMovement as number) - replicateDrag * 1.0 * dt, 0, 100);
      viability = clamp(viability - replicateDrag * 1.0 * dt - replicateEffective * 0.5 * dt, 0, 100);
    } else if (outcome === 'cell-killing') {
      const kill = replicateEffective * 6 * dt;
      viability = clamp(viability - kill, 0, 100);
      proliferation = clamp((proliferation as number) - replicateEffective * 4 * dt, 0, 100);
      cellMovement = clamp((cellMovement as number) - replicateEffective * 2 * dt - replicateDrag * dt, 0, 100);
      replicationRate = Math.max(0, replicationRate * (1 - replicateEffective * 0.2 * dt));
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

/** Format a percent delta without ever showing “−0.0”. */
export function formatPercentDelta(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return 'not measured';
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0 || Object.is(rounded, -0)) return '0.0%';
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toFixed(1)}%`;
}

export function formatMetricDisplay(reading: EducationalMetricReading): string {
  if (reading.status === 'not-measured' || reading.value === null) return 'not measured';
  return `${reading.value.toFixed(1)}${reading.unit} (${reading.disclaimer})`;
}

export interface BeforeAfterMetricRow {
  key: EducationalMetricReading['key'] | 'invasion';
  metric: string;
  unit: string;
  baseline: string;
  after: string;
  control: string;
  pctChangeFromBaseline: string;
  pctDifferenceVsControl: string;
  calculation: string;
  note: string;
  disclaimer: typeof SIMULATED_ESTIMATE_LABEL;
}

export interface BeforeAfterResult {
  cellModelId: string;
  cellModelName: string;
  designName: string | null;
  intendedOutcome: string | null;
  seed: number;
  /** Active treated/control seed when provided; equals seed when matched */
  activeSeed: number;
  seedMatched: boolean;
  seedMismatchMessage: string | null;
  baselineTimeHours: number;
  elapsedAfterHours: number;
  elapsedSinceBaselineHours: number;
  rows: BeforeAfterMetricRow[];
  howCalculated: string[];
  limitations: string[];
  disclaimer: typeof SIMULATED_ESTIMATE_LABEL;
}

/**
 * Before (recorded baseline) → after (current experimental with vector) vs untreated control.
 * Every numeric display is labelled as a simulated educational estimate.
 */
export function buildBeforeAfterResult(opts: {
  cellModelId: string;
  cellModelName: string;
  baseline: {
    timeHours: number;
    organismState: OrganismSimulationState;
    seed?: number;
  };
  after: OrganismSimulationState;
  control: OrganismSimulationState | null;
  treatment?: TherapeuticTreatmentConfig | null;
  seed: number;
  /** Live paired-run seed (treated/control). When it differs from baseline seed, comparison is flagged. */
  activeSeed?: number;
  elapsedAfterHours: number;
}): BeforeAfterResult {
  const outcome = opts.treatment?.intendedOutcome;
  const strengths = opts.treatment
    ? designEffectStrengths(opts.treatment.variables)
    : null;
  const effective = strengths
    ? strengths.delivery * strengths.potency * strengths.selectivity * (1 - strengths.drag * 0.5)
    : null;

  const baselineSeed = opts.baseline.seed ?? opts.seed;
  const activeSeed = opts.activeSeed ?? opts.seed;
  const seedMatched = baselineSeedMatchesActive(baselineSeed, activeSeed);
  const seedMismatchMessage = seedMatched
    ? null
    : `Seed mismatch: baseline seed ${baselineSeed} ≠ active paired seed ${activeSeed}. Do not treat these as the same run — record a new baseline or re-apply the vector with the matched seed.`;

  const baselineM = readEducationalMetrics(opts.baseline.organismState, opts.cellModelId, outcome);
  const afterM = readEducationalMetrics(opts.after, opts.cellModelId, outcome);
  const controlM = opts.control
    ? readEducationalMetrics(opts.control, opts.cellModelId, outcome)
    : null;

  const rows: BeforeAfterMetricRow[] = afterM.map((afterReading) => {
    const base = baselineM.find((x) => x.key === afterReading.key)!;
    const ctrl = controlM?.find((x) => x.key === afterReading.key);
    const pctBase = percentDifference(afterReading.value, base.value);
    const pctCtrl = percentDifference(afterReading.value, ctrl?.value ?? null);
    const calcParts: string[] = [];
    if (afterReading.value !== null && base.value !== null) {
      calcParts.push(
        `% change from baseline = ((after − baseline) / baseline) × 100 = ((${afterReading.value.toFixed(2)} − ${base.value.toFixed(2)}) / ${base.value.toFixed(2)}) × 100`,
      );
    }
    if (afterReading.value !== null && ctrl?.value !== null && ctrl?.value !== undefined) {
      calcParts.push(
        `% difference vs untreated control = ((after − control) / control) × 100 = ((${afterReading.value.toFixed(2)} − ${ctrl.value.toFixed(2)}) / ${ctrl.value.toFixed(2)}) × 100`,
      );
    }
    if (effective !== null && strengths) {
      calcParts.push(
        `Conceptual vector effective strength ≈ delivery×potency×selectivity×(1−0.5×drag) = ${effective.toFixed(3)} (from design sliders; educational only)`,
      );
    }
    let note = '';
    if (afterReading.key === 'cellMovement') {
      note = 'A drop in viability is not evidence of reduced movement.';
    }
    return {
      key: afterReading.key,
      metric: afterReading.label,
      unit: afterReading.unit,
      baseline: formatMetricDisplay(base),
      after: formatMetricDisplay(afterReading),
      control: ctrl ? formatMetricDisplay(ctrl) : 'not measured',
      pctChangeFromBaseline: formatPercentDelta(pctBase),
      pctDifferenceVsControl: formatPercentDelta(pctCtrl),
      calculation: calcParts.length ? calcParts.join(' · ') : 'not measured — insufficient values',
      note,
      disclaimer: SIMULATED_ESTIMATE_LABEL,
    };
  });

  // Invasion is not modelled — surface explicitly as not measured (never invent from movement/population/viability).
  rows.push({
    key: 'invasion',
    metric: 'Invasion',
    unit: '—',
    baseline: 'not measured',
    after: 'not measured',
    control: 'not measured',
    pctChangeFromBaseline: 'not measured',
    pctDifferenceVsControl: 'not measured',
    calculation:
      'Invasion: not measured — Genesis Lab has no separate invasion model; values are not derived from movement, cell count, or viability.',
    note: 'This simulation cannot establish that metastasis was prevented.',
    disclaimer: SIMULATED_ESTIMATE_LABEL,
  });

  const outcomeLabel = outcome
    ? (outcome === 'reduce-movement'
      ? 'Reduce cell movement'
      : outcome === 'growth-suppression'
        ? 'Growth suppression'
        : 'Cell killing')
    : null;

  return {
    cellModelId: opts.cellModelId,
    cellModelName: opts.cellModelName,
    designName: opts.treatment?.designName ?? null,
    intendedOutcome: outcomeLabel,
    seed: baselineSeed,
    activeSeed,
    seedMatched,
    seedMismatchMessage,
    baselineTimeHours: opts.baseline.timeHours,
    elapsedAfterHours: opts.elapsedAfterHours,
    elapsedSinceBaselineHours: Math.max(0, opts.elapsedAfterHours - opts.baseline.timeHours),
    rows,
    howCalculated: [
      'All metric values are simulated educational estimates from Genesis Lab’s prototype tumour-cell rules — not wet-lab measurements.',
      'Baseline = experimental dish state recorded before the conceptual vector was applied (or at attach if none was recorded earlier).',
      'After = current experimental dish state with the conceptual vector linked (control has no vector).',
      '% change from baseline = ((after − baseline) / baseline) × 100.',
      '% difference vs untreated control = ((after − control) / control) × 100.',
      'Elapsed simulation time is in simulated hours (model clock), not wall-clock time.',
      'Conceptual vector settings (uptake, therapeutic effect, targeting, clearance, off-target proxies) scale an educational “effective strength”; they do not produce a real vector construct.',
      seedMatched
        ? `Matched seed ${activeSeed} is shared by baseline, treated dish, and untreated control.`
        : (seedMismatchMessage as string),
      'Invasion: not measured — no separate invasion channel exists in this model.',
    ],
    limitations: [
      'Values do not predict real biological efficacy or clinical outcomes.',
      'Unsupported metrics appear as “not measured” rather than invented results.',
      'A viability change must never be read as proof of reduced cell movement.',
      'Invasion is not measured and must not be inferred from movement, population, or viability.',
      'Reduced movement in this dish must never be labelled “metastasis prevented”.',
      ...(seedMatched
        ? []
        : ['Baseline and active run seeds differ — re-record baseline before trusting this comparison.']),
    ],
    disclaimer: SIMULATED_ESTIMATE_LABEL,
  };
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
      percentDifference: formatPercentDelta(pct),
      note,
    };
  });
}
