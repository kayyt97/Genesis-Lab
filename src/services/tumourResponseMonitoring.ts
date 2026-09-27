/**
 * Tumour Response Monitoring — educational paired HeLa (treated vs untreated control).
 * Validates matched starting conditions; reports movement, invasion (not assessed),
 * population, and viability as distinct channels. Never claims metastasis prevented.
 */

import type { EnvironmentConditions, Simulation, TherapeuticTreatmentConfig } from '../types';
import type {
  ActiveExperimentSetup,
  PairedResponseSnapshot,
  RecordedDishBaseline,
} from '../types/experimentWorkspace';
import { GENESIS_LAB_VERSION } from './genesisLabVersion';
import {
  SIMULATED_ESTIMATE_LABEL,
  formatPercentDelta,
  isTumourCellModel,
  percentDifference,
} from './tumourCellSimulation';
import { environmentsMatchForComparison } from './experimentWorkspaceService';
import { THERAPEUTIC_INTENDED_OUTCOME_LABELS } from '../types/scientific';
import { formatPopulation } from '../simulation/engine';

export type { PairedResponseSnapshot };

export const RESPONSE_MONITOR_TITLE = 'Tumour Response Monitoring' as const;
export const EDUCATIONAL_SIMULATION_LABEL = 'Educational simulation' as const;

export const NEVER_METASTASIS_PREVENTED =
  'Reduced movement or invasion in this dish must never be labelled “metastasis prevented” or proof that cancer cannot spread in a person. This is an educational simulation only.';

export const FEWER_CELLS_NOT_MOVEMENT_PROOF =
  'Fewer cells or a viability drop is not proof of reduced movement. Movement and viability are separate outcomes.';

export const INVASION_NOT_ASSESSED =
  'Invasion is not assessed — Genesis Lab does not model invasion for this dish.';

export const HEALTHY_CELL_NOT_ASSESSED =
  'Healthy-cell effects are not assessed — the model has no healthy/normal cell population channel.';

/** Movement at or below this % is treated as stopped within the simulation measurement range. */
export const MOVEMENT_STOPPED_THRESHOLD = 1;

/** Absolute % points vs control below which movement is considered “slowed”. */
export const MOVEMENT_SLOWED_MIN_DELTA_PP = 2;

export type MovementStatusKind = 'slowed' | 'stopped-within-range' | 'continued';

export type ChannelAssessment =
  | 'measured'
  | 'not-assessed'
  | 'comparison-blocked';

export type ResponseChannelKey =
  | 'movement'
  | 'invasion'
  | 'population'
  | 'viability'
  | 'healthyCells';

export interface MatchCheckResult {
  ok: boolean;
  mismatches: string[];
  /** Fields compared for the paired-run contract */
  checked: {
    startingPopulation: { treated: number | null; control: number | null };
    ph: { treated: number; control: number };
    temperature: { treated: number; control: number };
    oxygen: { treated: number; control: number };
    durationHours: { treated: number; control: number };
    simulationVersion: string;
    seed: { treated: number | null; control: number | null };
    treatmentOnlyOnExperimental: boolean;
  };
}

export interface ChannelSeriesPoint {
  timeHours: number;
  treated: number | null;
  control: number | null;
}

export interface ResponseChannelResult {
  key: ResponseChannelKey;
  label: string;
  assessment: ChannelAssessment;
  unit: string;
  /** Numeric start/end when measured; null when not assessed */
  treatedStart: number | null;
  treatedEnd: number | null;
  controlStart: number | null;
  controlEnd: number | null;
  treatedDelta: number | null;
  controlDelta: number | null;
  percentDifferenceVsControl: string;
  displayTreatedStart: string;
  displayTreatedEnd: string;
  displayControlStart: string;
  displayControlEnd: string;
  displayTreatedDelta: string;
  displayControlDelta: string;
  chartTreated: { x: number; y: number }[];
  chartControl: { x: number; y: number }[];
  timeSeries: ChannelSeriesPoint[];
  note: string;
}

export interface MovementStatusReadout {
  status: MovementStatusKind;
  plainEnglish: string;
  treatedEnd: number | null;
  controlEnd: number | null;
  percentDifferenceVsControl: string;
}

export interface TumourResponseMonitoring {
  title: typeof RESPONSE_MONITOR_TITLE;
  educationalSimulationLabel: typeof EDUCATIONAL_SIMULATION_LABEL;
  disclaimer: typeof SIMULATED_ESTIMATE_LABEL;
  genesisLabVersion: string;
  cellModelId: string;
  cellModelName: string;
  designName: string | null;
  intendedOutcome: string | null;
  treatedGroupLabel: string;
  controlGroupLabel: 'Untreated control';
  seed: number | null;
  match: MatchCheckResult;
  /** False when mismatch — UI/report must not present a clean paired comparison */
  comparisonAllowed: boolean;
  channels: ResponseChannelResult[];
  movementStatus: MovementStatusReadout | null;
  healthyCellEffects: typeof HEALTHY_CELL_NOT_ASSESSED;
  limitations: string[];
  settingsSummary: string;
  savedAt: string | null;
}

/** Persistable snapshot stored on ActiveExperimentSetup — see types/experimentWorkspace PairedResponseSnapshot */

function clampRound(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function startingState(sim: Simulation | null, baseline?: RecordedDishBaseline | null) {
  if (baseline?.organismState) return baseline.organismState;
  if (!sim) return null;
  if (sim.snapshots.length > 0) {
    // Prefer earliest snapshot; approximate start when first tick already advanced
    return sim.snapshots[0]!.organismState;
  }
  return sim.organismState;
}

function endingState(sim: Simulation | null) {
  return sim?.organismState ?? null;
}

function seriesFor(
  sim: Simulation | null,
  key: 'cellMovement' | 'viability' | 'population' | 'proliferation',
): { x: number; y: number }[] {
  if (!sim) return [];
  const points: { x: number; y: number }[] = [];
  if (sim.snapshots.length === 0) {
    const v = sim.organismState[key];
    if (typeof v === 'number') points.push({ x: sim.timeHours, y: v });
    return points;
  }
  for (const s of sim.snapshots) {
    const v = s.organismState[key];
    if (typeof v === 'number') points.push({ x: s.timeHours, y: v });
  }
  const last = points[points.length - 1];
  const live = sim.organismState[key];
  if (typeof live === 'number' && (!last || last.x !== sim.timeHours)) {
    points.push({ x: sim.timeHours, y: live });
  }
  return points;
}

function alignSeries(
  treated: { x: number; y: number }[],
  control: { x: number; y: number }[],
): ChannelSeriesPoint[] {
  const times = Array.from(
    new Set([...treated.map((p) => p.x), ...control.map((p) => p.x)]),
  ).sort((a, b) => a - b);
  const tMap = new Map(treated.map((p) => [p.x, p.y]));
  const cMap = new Map(control.map((p) => [p.x, p.y]));
  return times.map((timeHours) => ({
    timeHours,
    treated: tMap.has(timeHours) ? tMap.get(timeHours)! : null,
    control: cMap.has(timeHours) ? cMap.get(timeHours)! : null,
  }));
}

function fmtMeasured(
  value: number | null,
  unit: string,
  assessment: ChannelAssessment,
  population = false,
): string {
  if (assessment === 'not-assessed') return 'not assessed';
  if (assessment === 'comparison-blocked') return 'comparison blocked';
  if (value === null) return 'not measured';
  if (population) return `${formatPopulation(value)} (${SIMULATED_ESTIMATE_LABEL})`;
  return `${value.toFixed(1)}${unit} (${SIMULATED_ESTIMATE_LABEL})`;
}

function fmtDelta(delta: number | null, unit: string, population = false): string {
  if (delta === null) return 'not measured';
  if (population) {
    const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
    return `${sign}${formatPopulation(Math.abs(delta))}`;
  }
  const rounded = clampRound(delta, 1);
  if (rounded === 0 || Object.is(rounded, -0)) return `0.0${unit}`;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toFixed(1)}${unit}`;
}

/**
 * Validate that treated and control runs share identical comparison-critical settings.
 * Treatment on the experimental dish is the only allowed difference.
 */
export function validatePairedRunMatch(opts: {
  experimental: Simulation | null;
  control: Simulation | null;
  experimentalEnv: EnvironmentConditions;
  controlEnv: EnvironmentConditions;
  treatment?: TherapeuticTreatmentConfig | null;
  expectedVersion?: string;
  baseline?: RecordedDishBaseline | null;
}): MatchCheckResult {
  const version = opts.expectedVersion ?? GENESIS_LAB_VERSION;
  const mismatches: string[] = [];
  const expStart = startingState(opts.experimental, opts.baseline);
  const ctrlStart = startingState(
    opts.control,
    opts.baseline?.controlOrganismState
      ? { ...opts.baseline, organismState: opts.baseline.controlOrganismState }
      : null,
  );

  const startPopT = expStart?.population ?? null;
  const startPopC = ctrlStart?.population ?? null;
  if (startPopT !== null && startPopC !== null && startPopT !== startPopC) {
    mismatches.push(
      `starting cell count: treated ${formatPopulation(startPopT)} vs control ${formatPopulation(startPopC)}`,
    );
  } else if (startPopT === null || startPopC === null) {
    if (opts.experimental || opts.control) {
      mismatches.push('starting cell count: missing on one or both dishes');
    }
  }

  const env = environmentsMatchForComparison(opts.experimentalEnv, opts.controlEnv);
  if (!env.ok) {
    for (const m of env.mismatches) {
      // Focus messaging on the three user-called-out fields plus any other env drift
      mismatches.push(`environment ${m}`);
    }
  }

  const durT = opts.experimental?.timeHours ?? null;
  const durC = opts.control?.timeHours ?? null;
  if (durT !== null && durC !== null && Math.abs(durT - durC) > 1e-6) {
    mismatches.push(
      `incubation duration: treated ${durT.toFixed(2)} h vs control ${durC.toFixed(2)} h`,
    );
  }

  const seedT = opts.experimental?.seed ?? null;
  const seedC = opts.control?.seed ?? null;
  if (seedT !== null && seedC !== null && seedT !== seedC) {
    mismatches.push(`random seed: treated ${seedT} vs control ${seedC}`);
  } else if ((opts.experimental || opts.control) && (seedT === null || seedC === null)) {
    mismatches.push('random seed: missing on one or both dishes');
  }

  // Version is a lab-wide constant; flag if a saved snapshot claimed a different build
  // (caller may pass a foreign expectedVersion when rehydrating old snapshots).
  if (opts.expectedVersion && opts.expectedVersion !== GENESIS_LAB_VERSION) {
    mismatches.push(
      `simulation version: snapshot ${opts.expectedVersion} vs current ${GENESIS_LAB_VERSION}`,
    );
  }

  const treatmentOnlyOnExperimental = !opts.control?.therapeuticTreatment;
  if (opts.control?.therapeuticTreatment) {
    mismatches.push('control has a therapeutic attached — paired comparison requires untreated control');
  }
  if (opts.experimental?.therapeuticTreatment && opts.treatment
    && opts.experimental.therapeuticTreatment.designId !== opts.treatment.designId) {
    mismatches.push('experimental therapeutic does not match attached design');
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    checked: {
      startingPopulation: { treated: startPopT, control: startPopC },
      ph: { treated: opts.experimentalEnv.ph, control: opts.controlEnv.ph },
      temperature: {
        treated: opts.experimentalEnv.temperature,
        control: opts.controlEnv.temperature,
      },
      oxygen: { treated: opts.experimentalEnv.oxygen, control: opts.controlEnv.oxygen },
      durationHours: {
        treated: durT ?? 0,
        control: durC ?? 0,
      },
      simulationVersion: version,
      seed: { treated: seedT, control: seedC },
      treatmentOnlyOnExperimental,
    },
  };
}

/**
 * Classify movement response using actual end values (educational measurement range).
 */
export function classifyMovementResponse(
  treatedEnd: number | null,
  controlEnd: number | null,
): MovementStatusReadout {
  const pct = formatPercentDelta(percentDifference(treatedEnd, controlEnd));
  if (treatedEnd === null || controlEnd === null) {
    return {
      status: 'continued',
      plainEnglish:
        'Movement could not be classified because one or both dishes lack a measured movement value.',
      treatedEnd,
      controlEnd,
      percentDifferenceVsControl: pct,
    };
  }

  if (treatedEnd <= MOVEMENT_STOPPED_THRESHOLD && controlEnd > MOVEMENT_STOPPED_THRESHOLD) {
    return {
      status: 'stopped-within-range',
      plainEnglish:
        `Treated movement reached ${treatedEnd.toFixed(1)}%, at or below the simulation’s measurement floor of ${MOVEMENT_STOPPED_THRESHOLD}%, while the untreated control remained at ${controlEnd.toFixed(1)}%. Within this educational model’s range, treated motility is classified as stopped. This does not mean metastasis was prevented in a person.`,
      treatedEnd,
      controlEnd,
      percentDifferenceVsControl: pct,
    };
  }

  const deltaPp = controlEnd - treatedEnd;
  if (deltaPp >= MOVEMENT_SLOWED_MIN_DELTA_PP) {
    return {
      status: 'slowed',
      plainEnglish:
        `Treated movement ended at ${treatedEnd.toFixed(1)}% versus ${controlEnd.toFixed(1)}% in the untreated control (${pct} vs control). Movement slowed relative to control in this educational simulation. This does not mean metastasis was prevented.`,
      treatedEnd,
      controlEnd,
      percentDifferenceVsControl: pct,
    };
  }

  return {
    status: 'continued',
    plainEnglish:
      `Treated movement ended at ${treatedEnd.toFixed(1)}% versus ${controlEnd.toFixed(1)}% in the untreated control (${pct} vs control). Movement continued at a similar level to control within this simulation’s measurement range.`,
    treatedEnd,
    controlEnd,
    percentDifferenceVsControl: pct,
  };
}

function buildMeasuredChannel(opts: {
  key: ResponseChannelKey;
  label: string;
  unit: string;
  treatedStart: number | null;
  treatedEnd: number | null;
  controlStart: number | null;
  controlEnd: number | null;
  chartTreated: { x: number; y: number }[];
  chartControl: { x: number; y: number }[];
  comparisonAllowed: boolean;
  note: string;
  population?: boolean;
}): ResponseChannelResult {
  const assessment: ChannelAssessment = opts.comparisonAllowed ? 'measured' : 'comparison-blocked';
  const treatedDelta =
    opts.treatedStart !== null && opts.treatedEnd !== null
      ? opts.treatedEnd - opts.treatedStart
      : null;
  const controlDelta =
    opts.controlStart !== null && opts.controlEnd !== null
      ? opts.controlEnd - opts.controlStart
      : null;
  const pct = opts.comparisonAllowed
    ? formatPercentDelta(percentDifference(opts.treatedEnd, opts.controlEnd))
    : 'comparison blocked';
  const pop = !!opts.population;

  return {
    key: opts.key,
    label: opts.label,
    assessment,
    unit: opts.unit,
    treatedStart: opts.treatedStart,
    treatedEnd: opts.treatedEnd,
    controlStart: opts.controlStart,
    controlEnd: opts.controlEnd,
    treatedDelta,
    controlDelta,
    percentDifferenceVsControl: pct,
    displayTreatedStart: fmtMeasured(opts.treatedStart, opts.unit, assessment, pop),
    displayTreatedEnd: fmtMeasured(opts.treatedEnd, opts.unit, assessment, pop),
    displayControlStart: fmtMeasured(opts.controlStart, opts.unit, assessment, pop),
    displayControlEnd: fmtMeasured(opts.controlEnd, opts.unit, assessment, pop),
    displayTreatedDelta: assessment === 'measured' ? fmtDelta(treatedDelta, opts.unit, pop) : assessment,
    displayControlDelta: assessment === 'measured' ? fmtDelta(controlDelta, opts.unit, pop) : assessment,
    chartTreated: opts.chartTreated,
    chartControl: opts.chartControl,
    timeSeries: alignSeries(opts.chartTreated, opts.chartControl),
    note: opts.note,
  };
}

function notAssessedChannel(
  key: ResponseChannelKey,
  label: string,
  note: string,
): ResponseChannelResult {
  return {
    key,
    label,
    assessment: 'not-assessed',
    unit: '',
    treatedStart: null,
    treatedEnd: null,
    controlStart: null,
    controlEnd: null,
    treatedDelta: null,
    controlDelta: null,
    percentDifferenceVsControl: 'not assessed',
    displayTreatedStart: 'not assessed',
    displayTreatedEnd: 'not assessed',
    displayControlStart: 'not assessed',
    displayControlEnd: 'not assessed',
    displayTreatedDelta: 'not assessed',
    displayControlDelta: 'not assessed',
    chartTreated: [],
    chartControl: [],
    timeSeries: [],
    note,
  };
}

/**
 * Build the Tumour Response Monitoring view for Virtual Lab, report, and export.
 */
export function buildTumourResponseMonitoring(opts: {
  cellModelId: string;
  cellModelName: string;
  experimental: Simulation | null;
  control: Simulation | null;
  experimentalEnv: EnvironmentConditions;
  controlEnv: EnvironmentConditions;
  treatment?: TherapeuticTreatmentConfig | null;
  baseline?: RecordedDishBaseline | null;
  savedAt?: string | null;
}): TumourResponseMonitoring | null {
  if (!isTumourCellModel(opts.cellModelId)) return null;

  const match = validatePairedRunMatch({
    experimental: opts.experimental,
    control: opts.control,
    experimentalEnv: opts.experimentalEnv,
    controlEnv: opts.controlEnv,
    treatment: opts.treatment,
    baseline: opts.baseline,
  });

  const designName = opts.treatment?.designName ?? null;
  const intendedOutcome = opts.treatment?.intendedOutcome
    ? THERAPEUTIC_INTENDED_OUTCOME_LABELS[opts.treatment.intendedOutcome]
    : null;
  const treatedGroupLabel = designName
    ? `Treated — ${designName}`
    : 'Treated (no conceptual therapeutic attached)';

  const expStart = startingState(opts.experimental, opts.baseline);
  const ctrlStart = startingState(
    opts.control,
    opts.baseline?.controlOrganismState
      ? { ...opts.baseline, organismState: opts.baseline.controlOrganismState }
      : null,
  );
  const expEnd = endingState(opts.experimental);
  const ctrlEnd = endingState(opts.control);

  const moveT = seriesFor(opts.experimental, 'cellMovement');
  const moveC = seriesFor(opts.control, 'cellMovement');
  const popT = seriesFor(opts.experimental, 'population');
  const popC = seriesFor(opts.control, 'population');
  const viaT = seriesFor(opts.experimental, 'viability');
  const viaC = seriesFor(opts.control, 'viability');

  const channels: ResponseChannelResult[] = [
    buildMeasuredChannel({
      key: 'movement',
      label: 'Movement / migration',
      unit: '%',
      treatedStart: expStart?.cellMovement ?? null,
      treatedEnd: expEnd?.cellMovement ?? null,
      controlStart: ctrlStart?.cellMovement ?? null,
      controlEnd: ctrlEnd?.cellMovement ?? null,
      chartTreated: moveT,
      chartControl: moveC,
      comparisonAllowed: match.ok,
      note: FEWER_CELLS_NOT_MOVEMENT_PROOF,
    }),
    notAssessedChannel('invasion', 'Invasion', INVASION_NOT_ASSESSED),
    buildMeasuredChannel({
      key: 'population',
      label: 'Cell population',
      unit: '',
      treatedStart: expStart?.population ?? null,
      treatedEnd: expEnd?.population ?? null,
      controlStart: ctrlStart?.population ?? null,
      controlEnd: ctrlEnd?.population ?? null,
      chartTreated: popT,
      chartControl: popC,
      comparisonAllowed: match.ok,
      note: 'Population / growth is reported separately from movement and viability.',
      population: true,
    }),
    buildMeasuredChannel({
      key: 'viability',
      label: 'Viability',
      unit: '%',
      treatedStart: expStart?.viability ?? null,
      treatedEnd: expEnd?.viability ?? null,
      controlStart: ctrlStart?.viability ?? null,
      controlEnd: ctrlEnd?.viability ?? null,
      chartTreated: viaT,
      chartControl: viaC,
      comparisonAllowed: match.ok,
      note: FEWER_CELLS_NOT_MOVEMENT_PROOF,
    }),
    notAssessedChannel('healthyCells', 'Healthy-cell effects', HEALTHY_CELL_NOT_ASSESSED),
  ];

  const movementChannel = channels.find((c) => c.key === 'movement')!;
  const movementStatus = match.ok
    ? classifyMovementResponse(movementChannel.treatedEnd, movementChannel.controlEnd)
    : null;

  const seed = opts.experimental?.seed ?? opts.control?.seed ?? null;
  const settingsSummary = [
    `Cell model: ${opts.cellModelName} (${opts.cellModelId})`,
    `Treated: ${treatedGroupLabel}`,
    'Control: Untreated control',
    `Seed: ${seed ?? 'n/a'}`,
    `Simulation version: ${GENESIS_LAB_VERSION}`,
    `pH ${opts.experimentalEnv.ph}; T ${opts.experimentalEnv.temperature}°C; O₂ ${opts.experimentalEnv.oxygen}%`,
    `Duration: treated ${match.checked.durationHours.treated.toFixed(2)} h / control ${match.checked.durationHours.control.toFixed(2)} h`,
    `Starting population: treated ${match.checked.startingPopulation.treated === null ? 'n/a' : formatPopulation(match.checked.startingPopulation.treated)} / control ${match.checked.startingPopulation.control === null ? 'n/a' : formatPopulation(match.checked.startingPopulation.control)}`,
    match.ok ? 'Match: paired settings identical (treatment only difference)' : `Match FAILED: ${match.mismatches.join('; ')}`,
  ].join(' · ');

  return {
    title: RESPONSE_MONITOR_TITLE,
    educationalSimulationLabel: EDUCATIONAL_SIMULATION_LABEL,
    disclaimer: SIMULATED_ESTIMATE_LABEL,
    genesisLabVersion: GENESIS_LAB_VERSION,
    cellModelId: opts.cellModelId,
    cellModelName: opts.cellModelName,
    designName,
    intendedOutcome,
    treatedGroupLabel,
    controlGroupLabel: 'Untreated control',
    seed,
    match,
    comparisonAllowed: match.ok,
    channels,
    movementStatus,
    healthyCellEffects: HEALTHY_CELL_NOT_ASSESSED,
    limitations: [
      'All values are simulated educational estimates — not wet-lab measurements.',
      NEVER_METASTASIS_PREVENTED,
      FEWER_CELLS_NOT_MOVEMENT_PROOF,
      INVASION_NOT_ASSESSED,
      HEALTHY_CELL_NOT_ASSESSED,
      'Movement, invasion, population/growth, and viability are distinct measures and must not be substituted for one another.',
      'The matched control receives no conceptual therapeutic; treatment should be the only difference.',
    ],
    settingsSummary,
    savedAt: opts.savedAt ?? null,
  };
}

/** Build a persistable snapshot from a live monitoring result. */
export function toPairedResponseSnapshot(
  monitoring: TumourResponseMonitoring,
  designId: string | null,
): PairedResponseSnapshot {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    genesisLabVersion: monitoring.genesisLabVersion,
    cellModelId: monitoring.cellModelId,
    cellModelName: monitoring.cellModelName,
    designId,
    designName: monitoring.designName,
    intendedOutcome: monitoring.intendedOutcome,
    seed: monitoring.seed,
    matchOk: monitoring.match.ok,
    mismatches: [...monitoring.match.mismatches],
    settings: {
      startingPopulation: monitoring.match.checked.startingPopulation.treated,
      ph: monitoring.match.checked.ph.treated,
      temperature: monitoring.match.checked.temperature.treated,
      oxygen: monitoring.match.checked.oxygen.treated,
      durationHours: monitoring.match.checked.durationHours.treated,
      simulationVersion: monitoring.genesisLabVersion,
    },
    channelEndpoints: monitoring.channels.map((c) => ({
      key: c.key,
      assessment: c.assessment,
      treatedStart: c.treatedStart,
      treatedEnd: c.treatedEnd,
      controlStart: c.controlStart,
      controlEnd: c.controlEnd,
      percentDifferenceVsControl: c.percentDifferenceVsControl,
    })),
    movementStatus: monitoring.movementStatus?.status ?? null,
    movementPlainEnglish: monitoring.movementStatus?.plainEnglish ?? null,
  };
}

/** Attach snapshot onto experiment setup for localStorage persistence. */
export function savePairedResponseOnSetup(
  setup: ActiveExperimentSetup,
  snapshot: PairedResponseSnapshot,
): ActiveExperimentSetup {
  const now = new Date().toISOString();
  return {
    ...setup,
    pairedResponseSnapshot: snapshot,
    updatedAt: now,
    history: [
      ...setup.history,
      {
        timestamp: now,
        type: 'paired-response-saved',
        detail: snapshot.matchOk
          ? `Paired tumour response comparison saved (seed ${snapshot.seed ?? 'n/a'}; ${GENESIS_LAB_VERSION})`
          : `Paired tumour response saved with MISMATCH flags: ${snapshot.mismatches.join('; ')}`,
      },
    ],
  };
}

export function formatResponseMonitoringForReport(monitoring: TumourResponseMonitoring): string {
  const lines = [
    `${monitoring.title} — ${monitoring.educationalSimulationLabel}`,
    monitoring.settingsSummary,
    monitoring.comparisonAllowed
      ? 'Paired comparison allowed (matched settings).'
      : `COMPARISON BLOCKED — mismatches: ${monitoring.match.mismatches.join('; ')}`,
    ...monitoring.channels.map((c) => {
      if (c.assessment === 'not-assessed') {
        return `${c.label}: not assessed — ${c.note}`;
      }
      return `${c.label}: treated start ${c.displayTreatedStart} → end ${c.displayTreatedEnd} (Δ ${c.displayTreatedDelta}); control start ${c.displayControlStart} → end ${c.displayControlEnd} (Δ ${c.displayControlDelta}); % vs control ${c.percentDifferenceVsControl}`;
    }),
    monitoring.movementStatus
      ? `Movement status: ${monitoring.movementStatus.status} — ${monitoring.movementStatus.plainEnglish}`
      : 'Movement status: not classified (comparison blocked or unavailable)',
    monitoring.healthyCellEffects,
    NEVER_METASTASIS_PREVENTED,
  ];
  return lines.join(' · ');
}

export function responseMonitoringToCsvRows(monitoring: TumourResponseMonitoring): string[][] {
  const rows: string[][] = [
    ['responseMonitorTitle', monitoring.title, 'model'],
    ['responseEducationalLabel', monitoring.educationalSimulationLabel, 'model'],
    ['responseGenesisLabVersion', monitoring.genesisLabVersion, 'model'],
    ['responseMatchOk', monitoring.match.ok ? 'yes' : 'no', 'model'],
    ['responseMismatches', monitoring.match.mismatches.join('; '), 'model'],
    ['responseTreatedGroup', monitoring.treatedGroupLabel, 'model'],
    ['responseControlGroup', monitoring.controlGroupLabel, 'model'],
    ['responseDesignName', monitoring.designName ?? '', 'imported'],
    ['responseSeed', monitoring.seed === null ? '' : String(monitoring.seed), 'model'],
    ['responseNeverMetastasisClaim', NEVER_METASTASIS_PREVENTED, 'model'],
    ['responseHealthyCellEffects', monitoring.healthyCellEffects, 'model'],
  ];
  for (const c of monitoring.channels) {
    rows.push(
      [`response_${c.key}_assessment`, c.assessment, 'model'],
      [`response_${c.key}_treatedStart`, c.treatedStart === null ? c.displayTreatedStart : String(c.treatedStart), 'model'],
      [`response_${c.key}_treatedEnd`, c.treatedEnd === null ? c.displayTreatedEnd : String(c.treatedEnd), 'model'],
      [`response_${c.key}_treatedDelta`, c.displayTreatedDelta, 'model'],
      [`response_${c.key}_controlStart`, c.controlStart === null ? c.displayControlStart : String(c.controlStart), 'model'],
      [`response_${c.key}_controlEnd`, c.controlEnd === null ? c.displayControlEnd : String(c.controlEnd), 'model'],
      [`response_${c.key}_controlDelta`, c.displayControlDelta, 'model'],
      [`response_${c.key}_pctVsControl`, c.percentDifferenceVsControl, 'model'],
      [`response_${c.key}_note`, c.note, 'model'],
    );
  }
  if (monitoring.movementStatus) {
    rows.push(
      ['response_movement_status', monitoring.movementStatus.status, 'model'],
      ['response_movement_plainEnglish', monitoring.movementStatus.plainEnglish, 'model'],
    );
  }
  return rows;
}

export function responseMonitoringToExportPayload(monitoring: TumourResponseMonitoring) {
  return {
    title: monitoring.title,
    educationalSimulationLabel: monitoring.educationalSimulationLabel,
    disclaimer: monitoring.disclaimer,
    genesisLabVersion: monitoring.genesisLabVersion,
    cellModelId: monitoring.cellModelId,
    cellModelName: monitoring.cellModelName,
    treatedGroupLabel: monitoring.treatedGroupLabel,
    controlGroupLabel: monitoring.controlGroupLabel,
    designName: monitoring.designName,
    intendedOutcome: monitoring.intendedOutcome,
    seed: monitoring.seed,
    match: monitoring.match,
    comparisonAllowed: monitoring.comparisonAllowed,
    channels: monitoring.channels,
    movementStatus: monitoring.movementStatus,
    healthyCellEffects: monitoring.healthyCellEffects,
    limitations: monitoring.limitations,
    settingsSummary: monitoring.settingsSummary,
    savedAt: monitoring.savedAt,
    neverMetastasisClaim: NEVER_METASTASIS_PREVENTED,
  };
}
