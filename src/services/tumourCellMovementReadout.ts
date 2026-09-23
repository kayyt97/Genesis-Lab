/**
 * Tumour Cell Movement readout — educational simulation only.
 * Treated vs matched untreated control over simulated time, with seeded replicates.
 * Never claims “metastasis stopped” or equates viability drop with movement reduction.
 */

import type { EnvironmentConditions, Simulation, TherapeuticTreatmentConfig } from '../types';
import { createSimulation, startSimulation, simulationTick } from '../simulation/engine';
import {
  SIMULATED_ESTIMATE_LABEL,
  formatPercentDelta,
  isTumourCellModel,
  percentDifference,
} from './tumourCellSimulation';
import { THERAPEUTIC_INTENDED_OUTCOME_LABELS } from '../types/scientific';

export const MOVEMENT_READOUT_TITLE = 'Tumour Cell Movement' as const;
export const EDUCATIONAL_SIMULATION_LABEL = 'Educational simulation' as const;

export const MOVEMENT_NEVER_METASTASIS_CLAIM =
  'This simulation cannot establish that metastasis stopped. Reduced movement here is only a simulated educational estimate.';

export const FEWER_CELLS_ALIVE_CAVEAT =
  'Fewer cells remain alive in the treated group than in the untreated control. An apparent reduction in movement may partly reflect lower viability rather than a specific motility effect.';

export interface MovementSeriesPoint {
  timeHours: number;
  treated: number | null;
  control: number | null;
  percentDifference: number | null;
}

export interface MovementReplicateResult {
  replicate: number;
  seed: number;
  treatedMovement: number | null;
  controlMovement: number | null;
  percentDifferenceVsControl: string;
  treatedViability: number;
  controlViability: number;
  fewerCellsAliveCaveat: boolean;
  timeSeries: MovementSeriesPoint[];
}

export interface TumourCellMovementReadout {
  title: typeof MOVEMENT_READOUT_TITLE;
  educationalSimulationLabel: typeof EDUCATIONAL_SIMULATION_LABEL;
  disclaimer: typeof SIMULATED_ESTIMATE_LABEL;
  cellModelId: string;
  cellModelName: string;
  /** Visible design name on the treated group; null when no therapeutic attached */
  designName: string | null;
  intendedOutcome: string | null;
  treatedGroupLabel: string;
  controlGroupLabel: 'Untreated control';
  baseSeed: number;
  replicateCount: number;
  /** Primary (live or replicate 1) endpoint values */
  treatedMovement: number | null;
  controlMovement: number | null;
  percentDifferenceVsControl: string;
  treatedViability: number | null;
  controlViability: number | null;
  fewerCellsAliveCaveat: string | null;
  /** Chart series for treated vs control (primary run) */
  chartTreated: { x: number; y: number }[];
  chartControl: { x: number; y: number }[];
  timeSeries: MovementSeriesPoint[];
  replicates: MovementReplicateResult[];
  limitations: string[];
  separateOutcomesNote: string;
}

/** Deterministic per-replicate seed from experiment base seed */
export function deriveMovementReplicateSeed(baseSeed: number, replicateIndex: number): number {
  const r = Math.max(1, replicateIndex) >>> 0;
  let h = (baseSeed >>> 0) ^ Math.imul(r, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  return h || 1;
}

function seriesFromSim(sim: Simulation | null, key: 'cellMovement' | 'viability'): { x: number; y: number }[] {
  if (!sim) return [];
  const points: { x: number; y: number }[] = [];
  if (sim.snapshots.length === 0) {
    const v = key === 'cellMovement' ? sim.organismState.cellMovement : sim.organismState.viability;
    if (v !== null && v !== undefined) points.push({ x: sim.timeHours, y: v });
    return points;
  }
  for (const s of sim.snapshots) {
    const v = key === 'cellMovement' ? s.organismState.cellMovement : s.organismState.viability;
    if (v !== null && v !== undefined) points.push({ x: s.timeHours, y: v });
  }
  // Ensure latest state is included if clock advanced past last snapshot
  const last = points[points.length - 1];
  const live = key === 'cellMovement' ? sim.organismState.cellMovement : sim.organismState.viability;
  if (live !== null && live !== undefined && (!last || last.x !== sim.timeHours)) {
    points.push({ x: sim.timeHours, y: live });
  }
  return points;
}

function alignTimeSeries(
  treated: { x: number; y: number }[],
  control: { x: number; y: number }[],
): MovementSeriesPoint[] {
  const times = Array.from(
    new Set([...treated.map((p) => p.x), ...control.map((p) => p.x)]),
  ).sort((a, b) => a - b);
  const tMap = new Map(treated.map((p) => [p.x, p.y]));
  const cMap = new Map(control.map((p) => [p.x, p.y]));
  return times.map((timeHours) => {
    const t = tMap.has(timeHours) ? tMap.get(timeHours)! : null;
    const c = cMap.has(timeHours) ? cMap.get(timeHours)! : null;
    return {
      timeHours,
      treated: t,
      control: c,
      percentDifference: percentDifference(t, c),
    };
  });
}

function runPairedMovement(
  organismId: string,
  environment: EnvironmentConditions,
  controlEnvironment: EnvironmentConditions,
  treatment: TherapeuticTreatmentConfig | null | undefined,
  seed: number,
  ticks: number,
): { treated: Simulation; control: Simulation } {
  let treated = createSimulation(organismId, environment, undefined, {
    seed,
    therapeuticTreatment: treatment ?? undefined,
  });
  let control = createSimulation(organismId, controlEnvironment, undefined, {
    seed,
    conditionId: 'movement-control',
  });
  treated = startSimulation(treated);
  control = startSimulation(control);
  for (let i = 0; i < ticks; i++) {
    treated = simulationTick(treated);
    control = simulationTick(control);
  }
  return { treated, control };
}

function replicateFromPair(
  replicate: number,
  seed: number,
  treated: Simulation,
  control: Simulation,
): MovementReplicateResult {
  const treatedMovement = treated.organismState.cellMovement;
  const controlMovement = control.organismState.cellMovement;
  const treatedViability = treated.organismState.viability;
  const controlViability = control.organismState.viability;
  const fewerCellsAliveCaveat = treatedViability < controlViability;
  const chartT = seriesFromSim(treated, 'cellMovement');
  const chartC = seriesFromSim(control, 'cellMovement');
  return {
    replicate,
    seed,
    treatedMovement,
    controlMovement,
    percentDifferenceVsControl: formatPercentDelta(percentDifference(treatedMovement, controlMovement)),
    treatedViability,
    controlViability,
    fewerCellsAliveCaveat,
    timeSeries: alignTimeSeries(chartT, chartC),
  };
}

/**
 * Build the Tumour Cell Movement readout for Virtual Lab, report, and export.
 * When live sims are provided they become replicate 1; additional replicates are seeded offline.
 */
export function buildTumourCellMovementReadout(opts: {
  cellModelId: string;
  cellModelName: string;
  experimentalEnv: EnvironmentConditions;
  controlEnv: EnvironmentConditions;
  treatment?: TherapeuticTreatmentConfig | null;
  baseSeed: number;
  replicateCount: number;
  /** Preferred tick count for offline replicates (defaults from live sim or 16) */
  ticks?: number;
  liveExperimental?: Simulation | null;
  liveControl?: Simulation | null;
}): TumourCellMovementReadout | null {
  if (!isTumourCellModel(opts.cellModelId)) return null;

  const count = Math.max(1, Math.min(5, Math.floor(opts.replicateCount) || 1));
  const liveTicks = opts.liveExperimental?.currentTick ?? 0;
  const ticks = opts.ticks ?? (liveTicks > 0 ? liveTicks : 16);
  const designName = opts.treatment?.designName ?? null;
  const outcome = opts.treatment?.intendedOutcome
    ? THERAPEUTIC_INTENDED_OUTCOME_LABELS[opts.treatment.intendedOutcome]
    : null;

  const treatedGroupLabel = designName
    ? `Treated — ${designName}`
    : 'Treated (no conceptual therapeutic attached)';

  const replicates: MovementReplicateResult[] = [];

  for (let i = 1; i <= count; i++) {
    const seed = deriveMovementReplicateSeed(opts.baseSeed, i);
    const liveReady = !!(
      i === 1
      && opts.liveExperimental
      && opts.liveControl
      && opts.liveExperimental.organismId === opts.cellModelId
      && (opts.liveExperimental.currentTick > 0 || opts.liveExperimental.snapshots.length > 0)
    );
    if (liveReady) {
      replicates.push(replicateFromPair(1, opts.liveExperimental!.seed ?? seed, opts.liveExperimental!, opts.liveControl!));
      continue;
    }
    // Idle dish (not started): project with the live dish seed when available so Start continues the same run.
    const runSeed = i === 1 && opts.liveExperimental?.seed != null
      ? opts.liveExperimental.seed
      : seed;
    const { treated, control } = runPairedMovement(
      opts.cellModelId,
      opts.experimentalEnv,
      opts.controlEnv,
      opts.treatment,
      runSeed,
      ticks,
    );
    replicates.push(replicateFromPair(i, runSeed, treated, control));
  }

  const primary = replicates[0]!;
  const chartTreated = primary.timeSeries
    .filter((p) => p.treated !== null)
    .map((p) => ({ x: p.timeHours, y: p.treated as number }));
  const chartControl = primary.timeSeries
    .filter((p) => p.control !== null)
    .map((p) => ({ x: p.timeHours, y: p.control as number }));

  const anyViabilityCaveat = replicates.some((r) => r.fewerCellsAliveCaveat)
    || (primary.treatedViability < primary.controlViability);

  return {
    title: MOVEMENT_READOUT_TITLE,
    educationalSimulationLabel: EDUCATIONAL_SIMULATION_LABEL,
    disclaimer: SIMULATED_ESTIMATE_LABEL,
    cellModelId: opts.cellModelId,
    cellModelName: opts.cellModelName,
    designName,
    intendedOutcome: outcome,
    treatedGroupLabel,
    controlGroupLabel: 'Untreated control',
    baseSeed: opts.baseSeed,
    replicateCount: count,
    treatedMovement: primary.treatedMovement,
    controlMovement: primary.controlMovement,
    percentDifferenceVsControl: primary.percentDifferenceVsControl,
    treatedViability: primary.treatedViability,
    controlViability: primary.controlViability,
    fewerCellsAliveCaveat: anyViabilityCaveat ? FEWER_CELLS_ALIVE_CAVEAT : null,
    chartTreated,
    chartControl,
    timeSeries: primary.timeSeries,
    replicates,
    limitations: [
      'All movement values are simulated educational estimates — not wet-lab measurements.',
      MOVEMENT_NEVER_METASTASIS_CLAIM,
      'Movement, cell growth (proliferation), and viability are separate outcomes and must not be substituted for one another.',
      'A drop in viability is never evidence of reduced cell movement.',
      'The matched control receives no conceptual therapeutic.',
      'Replicate runs are deterministic given the base seed and replicate index.',
    ],
    separateOutcomesNote:
      'Movement is reported separately from cell growth and viability. Do not read one channel as another.',
  };
}

/** Plain-text summary for scientific report section */
export function formatMovementReadoutForReport(readout: TumourCellMovementReadout): string {
  const fmt = (v: number | null) =>
    v === null ? 'not measured' : `${v.toFixed(1)}% (${readout.disclaimer})`;
  const lines = [
    `${readout.title} — ${readout.educationalSimulationLabel}`,
    `Cell model: ${readout.cellModelName} (${readout.cellModelId})`,
    `Treated group: ${readout.treatedGroupLabel}`,
    `Control: ${readout.controlGroupLabel}`,
    designLine(readout),
    `Base seed: ${readout.baseSeed}; replicates: ${readout.replicateCount}`,
    `Treated movement: ${fmt(readout.treatedMovement)}`,
    `Control movement: ${fmt(readout.controlMovement)}`,
    `% difference vs control: ${readout.percentDifferenceVsControl}`,
    readout.fewerCellsAliveCaveat ?? '',
    `Time series (h → treated / control / %Δ): ${formatTimeSeriesBrief(readout.timeSeries)}`,
    `Per replicate: ${readout.replicates
      .map(
        (r) =>
          `R${r.replicate} seed=${r.seed} treated=${fmt(r.treatedMovement)} control=${fmt(r.controlMovement)} Δ=${r.percentDifferenceVsControl}${r.fewerCellsAliveCaveat ? ' [fewer cells alive caveat]' : ''}`,
      )
      .join(' | ')}`,
    readout.separateOutcomesNote,
    MOVEMENT_NEVER_METASTASIS_CLAIM,
  ];
  return lines.filter(Boolean).join(' · ');
}

function designLine(readout: TumourCellMovementReadout): string {
  if (!readout.designName) return 'Conceptual therapeutic: none attached';
  return `Conceptual therapeutic: “${readout.designName}”${readout.intendedOutcome ? ` (${readout.intendedOutcome})` : ''}; control untreated`;
}

function formatTimeSeriesBrief(series: MovementSeriesPoint[]): string {
  if (!series.length) return 'none';
  const step = Math.max(1, Math.floor(series.length / 6));
  const picked = series.filter((_, i) => i % step === 0 || i === series.length - 1);
  return picked
    .map((p) => {
      const t = p.treated === null ? 'n/a' : p.treated.toFixed(1);
      const c = p.control === null ? 'n/a' : p.control.toFixed(1);
      return `${p.timeHours.toFixed(1)}h:${t}/${c}/${formatPercentDelta(p.percentDifference)}`;
    })
    .join(', ');
}

/** CSV rows for export (field, value, source) */
export function movementReadoutToCsvRows(readout: TumourCellMovementReadout): string[][] {
  const rows: string[][] = [
    ['movementReadoutTitle', readout.title, 'model'],
    ['movementEducationalLabel', readout.educationalSimulationLabel, 'model'],
    ['movementDisclaimer', readout.disclaimer, 'model'],
    ['movementTreatedGroup', readout.treatedGroupLabel, 'model'],
    ['movementControlGroup', readout.controlGroupLabel, 'model'],
    ['movementDesignName', readout.designName ?? '', 'imported'],
    ['movementIntendedOutcome', readout.intendedOutcome ?? '', 'imported'],
    ['movementBaseSeed', String(readout.baseSeed), 'model'],
    ['movementReplicateCount', String(readout.replicateCount), 'model'],
    [
      'movementTreated',
      readout.treatedMovement === null ? 'not measured' : readout.treatedMovement.toFixed(2),
      'model',
    ],
    [
      'movementControl',
      readout.controlMovement === null ? 'not measured' : readout.controlMovement.toFixed(2),
      'model',
    ],
    ['movementPercentDifferenceVsControl', readout.percentDifferenceVsControl, 'model'],
    ['movementFewerCellsAliveCaveat', readout.fewerCellsAliveCaveat ?? '', 'model'],
    ['movementNeverMetastasisClaim', MOVEMENT_NEVER_METASTASIS_CLAIM, 'model'],
  ];
  for (const r of readout.replicates) {
    rows.push(
      [`movementReplicate${r.replicate}Seed`, String(r.seed), 'model'],
      [
        `movementReplicate${r.replicate}Treated`,
        r.treatedMovement === null ? 'not measured' : r.treatedMovement.toFixed(2),
        'model',
      ],
      [
        `movementReplicate${r.replicate}Control`,
        r.controlMovement === null ? 'not measured' : r.controlMovement.toFixed(2),
        'model',
      ],
      [`movementReplicate${r.replicate}PercentDifference`, r.percentDifferenceVsControl, 'model'],
      [
        `movementReplicate${r.replicate}FewerCellsAlive`,
        r.fewerCellsAliveCaveat ? 'yes' : 'no',
        'model',
      ],
    );
  }
  for (const p of readout.timeSeries) {
    rows.push([
      `movementTimeSeries_${p.timeHours.toFixed(2)}h`,
      `treated=${p.treated === null ? 'n/a' : p.treated.toFixed(2)};control=${p.control === null ? 'n/a' : p.control.toFixed(2)};pct=${formatPercentDelta(p.percentDifference)}`,
      'model',
    ]);
  }
  return rows;
}

/** Structured payload embedded in experiment JSON export */
export function movementReadoutToExportPayload(readout: TumourCellMovementReadout) {
  return {
    title: readout.title,
    educationalSimulationLabel: readout.educationalSimulationLabel,
    disclaimer: readout.disclaimer,
    cellModelId: readout.cellModelId,
    cellModelName: readout.cellModelName,
    treatedGroupLabel: readout.treatedGroupLabel,
    controlGroupLabel: readout.controlGroupLabel,
    designName: readout.designName,
    intendedOutcome: readout.intendedOutcome,
    baseSeed: readout.baseSeed,
    replicateCount: readout.replicateCount,
    treatedMovement: readout.treatedMovement,
    controlMovement: readout.controlMovement,
    percentDifferenceVsControl: readout.percentDifferenceVsControl,
    treatedViability: readout.treatedViability,
    controlViability: readout.controlViability,
    fewerCellsAliveCaveat: readout.fewerCellsAliveCaveat,
    timeSeries: readout.timeSeries,
    chartTreated: readout.chartTreated,
    chartControl: readout.chartControl,
    replicates: readout.replicates,
    limitations: readout.limitations,
    neverMetastasisClaim: MOVEMENT_NEVER_METASTASIS_CLAIM,
    separateOutcomesNote: readout.separateOutcomesNote,
  };
}
