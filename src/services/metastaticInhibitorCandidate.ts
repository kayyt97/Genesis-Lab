/**
 * Metastatic Inhibitor — simulation-only educational candidate.
 * Aims to reduce tumour-cell movement (and conceptually invasion/spread) in the model.
 * Never implies clinical validation or that metastasis was prevented.
 */

import type { EnvironmentConditions, TherapeuticTreatmentConfig } from '../types';
import type { TherapeuticDesign } from '../types/scientific';
import { GENESIS_LAB_VERSION } from './genesisLabVersion';
import { createSimulation, simulationTick, startSimulation, formatPopulation } from '../simulation/engine';
import {
  SIMULATED_ESTIMATE_LABEL,
  designEffectStrengths,
  formatPercentDelta,
  percentDifference,
  therapeuticConfigFromDesign,
} from './tumourCellSimulation';
import { deriveMovementReplicateSeed } from './tumourCellMovementReadout';
import { defaultEnvironment } from '../data/demoData';

export const METASTATIC_INHIBITOR_NAME = 'Metastatic Inhibitor' as const;
export const METASTATIC_INHIBITOR_ID = 'TD-METASTATIC-INHIBITOR' as const;

export const EDUCATIONAL_NO_CLINICAL_NOTICE =
  'Educational simulation — no evidence of clinical efficacy' as const;

export const METASTATIC_INHIBITOR_AIM =
  'Reduce tumour-cell movement, invasion, and spread in the educational model only. This candidate is not a clinically validated therapy and cannot establish that metastasis was prevented in a person.';

/** Slider parameters used by Genesis Lab’s conceptual therapeutic model (0–100 scale). */
export type CandidateParamKey = keyof TherapeuticDesign['variables'];

export interface CandidateParameterSpec {
  key: CandidateParamKey;
  label: string;
  unitOrScale: string;
  min: number;
  max: number;
  /** Model default before candidate curation */
  baselineValue: number;
  /** Value chosen for Metastatic Inhibitor */
  chosenValue: number;
  rationale: string;
  uncertainty: string;
}

/** Baseline (uncurated) slider defaults used elsewhere in Therapeutic Design */
export const MODEL_PARAM_BASELINES: Record<CandidateParamKey, number> = {
  targetingPreference: 70,
  uptake: 50,
  therapeuticEffect: 60,
  immuneResponse: 30,
  clearance: 40,
  offTargetEffect: 15,
  resistance: 10,
  toxicityProxy: 20,
};

export const METASTATIC_INHIBITOR_PARAMETERS: CandidateParameterSpec[] = [
  {
    key: 'targetingPreference',
    label: 'Targeting preference',
    unitOrScale: '0–100 educational selectivity index',
    min: 0,
    max: 100,
    baselineValue: MODEL_PARAM_BASELINES.targetingPreference,
    chosenValue: 82,
    rationale: 'Favour tumour-cell association in the educational delivery model so the motility channel is preferentially engaged.',
    uncertainty: 'High — selectivity has no wet-lab assay backing; off-target drag still applies.',
  },
  {
    key: 'uptake',
    label: 'Uptake',
    unitOrScale: '0–100 educational delivery index',
    min: 0,
    max: 100,
    baselineValue: MODEL_PARAM_BASELINES.uptake,
    chosenValue: 72,
    rationale: 'Raise conceptual delivery so reduce-movement can register within short simulated incubations.',
    uncertainty: 'High — uptake is a teaching slider, not a measured cellular entry rate.',
  },
  {
    key: 'therapeuticEffect',
    label: 'Therapeutic effect (strength)',
    unitOrScale: '0–100 educational potency index (dose/strength axis)',
    min: 0,
    max: 100,
    baselineValue: MODEL_PARAM_BASELINES.therapeuticEffect,
    chosenValue: 78,
    rationale: 'Primary strength knob for the reduce-movement outcome; swept in dose–response runs.',
    uncertainty: 'High — potency does not map to a real drug concentration.',
  },
  {
    key: 'immuneResponse',
    label: 'Immune response',
    unitOrScale: '0–100 educational noticeability index',
    min: 0,
    max: 100,
    baselineValue: MODEL_PARAM_BASELINES.immuneResponse,
    chosenValue: 22,
    rationale: 'Keep immune noticeability moderate so educational drag does not dominate the motility readout.',
    uncertainty: 'High — no immune compartment is simulated beyond a drag term.',
  },
  {
    key: 'clearance',
    label: 'Clearance',
    unitOrScale: '0–100 educational clearance index',
    min: 0,
    max: 100,
    baselineValue: MODEL_PARAM_BASELINES.clearance,
    chosenValue: 28,
    rationale: 'Lower clearance to sustain educational exposure during the short model clock.',
    uncertainty: 'High — clearance is not pharmacokinetic modelling.',
  },
  {
    key: 'offTargetEffect',
    label: 'Off-target effect',
    unitOrScale: '0–100 educational off-target risk index',
    min: 0,
    max: 100,
    baselineValue: MODEL_PARAM_BASELINES.offTargetEffect,
    chosenValue: 18,
    rationale: 'Retain some off-target drag so adverse viability effects can be inspected rather than assumed zero.',
    uncertainty: 'High — adverse effects are proxy drag on the tumour dish only (no healthy-cell channel).',
  },
  {
    key: 'resistance',
    label: 'Resistance',
    unitOrScale: '0–100 educational resistance index',
    min: 0,
    max: 100,
    baselineValue: MODEL_PARAM_BASELINES.resistance,
    chosenValue: 12,
    rationale: 'Modest resistance so strength sweeps remain informative without saturating the model.',
    uncertainty: 'High — resistance is a teaching term, not clonal evolution.',
  },
  {
    key: 'toxicityProxy',
    label: 'Toxicity proxy',
    unitOrScale: '0–100 educational toxicity proxy',
    min: 0,
    max: 100,
    baselineValue: MODEL_PARAM_BASELINES.toxicityProxy,
    chosenValue: 16,
    rationale: 'Include a toxicity proxy so viability caveats can be checked against movement reductions.',
    uncertainty: 'High — not organ toxicity; dish viability drag only.',
  },
];

export function metastaticInhibitorVariables(): TherapeuticDesign['variables'] {
  const v = { ...MODEL_PARAM_BASELINES };
  for (const p of METASTATIC_INHIBITOR_PARAMETERS) {
    v[p.key] = p.chosenValue;
  }
  return v;
}

/** Stable built-in TherapeuticDesign — name must remain exactly “Metastatic Inhibitor”. */
export function getMetastaticInhibitorDesign(): TherapeuticDesign {
  return {
    id: METASTATIC_INHIBITOR_ID,
    name: METASTATIC_INHIBITOR_NAME,
    targetType: 'tumour-cell',
    targetDescription:
      'Educational motility / migration pathways in tumour cell culture (HeLa). Conceptual only — not a molecular target nomination for clinical use.',
    deliveryModel: 'non-replicating-vector',
    payloadEffect: 'suppress-target',
    intendedOutcome: 'reduce-movement',
    targetCellModelId: 'ORG-HELA',
    variables: metastaticInhibitorVariables(),
    notes: `${METASTATIC_INHIBITOR_AIM} ${EDUCATIONAL_NO_CLINICAL_NOTICE}.`,
    createdAt: '2026-09-27T00:00:00.000Z',
    evidence: {
      level: 'speculative',
      note: 'Simulation-only candidate. Not a clinically validated therapy. Not a real vector construct.',
    },
  };
}

export function isMetastaticInhibitorDesign(design: { id?: string; name?: string } | null | undefined): boolean {
  if (!design) return false;
  return design.id === METASTATIC_INHIBITOR_ID || design.name === METASTATIC_INHIBITOR_NAME;
}

/** Strength levels swept within the model’s 0–100 therapeuticEffect range. */
export const STRENGTH_SWEEP_LEVELS = [20, 40, 60, 78, 100] as const;

export const MIN_RECORDED_SEEDS = 5;

export type EndpointAvailability = 'measured' | 'unavailable';

export interface EndpointReading {
  key: string;
  label: string;
  availability: EndpointAvailability;
  unit: string;
  treated: number | null;
  control: number | null;
  percentDifferenceVsControl: string;
  note: string;
}

export interface MetastaticInhibitorRunRecord {
  runId: string;
  seed: number;
  strength: number;
  ticks: number;
  timeHours: number;
  timestamp: string;
  genesisLabVersion: string;
  cellModelId: string;
  candidateName: typeof METASTATIC_INHIBITOR_NAME;
  candidateId: typeof METASTATIC_INHIBITOR_ID;
  initialConditions: {
    temperature: number;
    ph: number;
    oxygen: number;
    startingPopulation: number;
  };
  endpoints: EndpointReading[];
  /** True when treated viability is lower than control — movement drop may reflect fewer viable cells */
  viabilityCaveat: boolean;
  timeSeries: Array<{
    timeHours: number;
    treatedMovement: number | null;
    controlMovement: number | null;
    treatedViability: number;
    controlViability: number;
    treatedPopulation: number;
    controlPopulation: number;
    treatedProliferation: number | null;
    controlProliferation: number | null;
  }>;
}

export interface StrengthAggregate {
  strength: number;
  seeds: number[];
  movementMeanTreated: number | null;
  movementMeanControl: number | null;
  movementMeanPctVsControl: number | null;
  movementSpreadPct: number | null;
  viabilityMeanTreated: number | null;
  viabilityMeanControl: number | null;
  populationMeanTreated: number | null;
  populationMeanControl: number | null;
  proliferationMeanTreated: number | null;
  proliferationMeanControl: number | null;
  effectSizeMovement: number | null;
  viabilityCaveatCount: number;
  invasion: 'unavailable';
  movementDistanceUm: 'unavailable';
  spreadEvents: 'unavailable';
}

export interface MetastaticInhibitorStudy {
  studyId: string;
  title: string;
  educationalNotice: typeof EDUCATIONAL_NO_CLINICAL_NOTICE;
  aim: typeof METASTATIC_INHIBITOR_AIM;
  genesisLabVersion: string;
  createdAt: string;
  cellModelId: string;
  cellModelName: string;
  candidate: TherapeuticDesign;
  parameterSheet: CandidateParameterSpec[];
  baseSeed: number;
  seedCount: number;
  seeds: number[];
  strengthLevels: number[];
  ticks: number;
  environment: EnvironmentConditions;
  runs: MetastaticInhibitorRunRecord[];
  aggregates: StrengthAggregate[];
  methods: string[];
  limitations: string[];
  conclusion: string;
  consistencyAcrossSeeds: string;
  sensitivityToStrength: string;
}

function clampStrength(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function mean(xs: number[]): number | null {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sampleStd(xs: number[]): number | null {
  if (xs.length < 2) return xs.length === 1 ? 0 : null;
  const m = mean(xs)!;
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

/** Cohen's d (treated − control) / pooled SD — educational effect size only. */
function cohensD(treated: number[], control: number[]): number | null {
  if (treated.length < 2 || control.length < 2) return null;
  const mt = mean(treated)!;
  const mc = mean(control)!;
  const st = sampleStd(treated)!;
  const sc = sampleStd(control)!;
  const pooled = Math.sqrt((st ** 2 + sc ** 2) / 2);
  if (pooled === 0) return mt === mc ? 0 : null;
  return (mt - mc) / pooled;
}

function designAtStrength(base: TherapeuticDesign, strength: number): TherapeuticDesign {
  return {
    ...base,
    variables: {
      ...base.variables,
      therapeuticEffect: clampStrength(strength),
    },
  };
}

function treatmentFrom(design: TherapeuticDesign): TherapeuticTreatmentConfig {
  return therapeuticConfigFromDesign(design);
}

function endpoint(
  key: string,
  label: string,
  availability: EndpointAvailability,
  unit: string,
  treated: number | null,
  control: number | null,
  note: string,
): EndpointReading {
  return {
    key,
    label,
    availability,
    unit,
    treated,
    control,
    percentDifferenceVsControl:
      availability === 'unavailable' || treated === null || control === null
        ? 'unavailable'
        : formatPercentDelta(percentDifference(treated, control)),
    note,
  };
}

function runPairedOnce(opts: {
  cellModelId: string;
  environment: EnvironmentConditions;
  treatment: TherapeuticTreatmentConfig;
  seed: number;
  ticks: number;
  strength: number;
}): MetastaticInhibitorRunRecord {
  let treated = createSimulation(opts.cellModelId, opts.environment, undefined, {
    seed: opts.seed,
    therapeuticTreatment: opts.treatment,
  });
  let control = createSimulation(opts.cellModelId, opts.environment, undefined, {
    seed: opts.seed,
    conditionId: 'mi-control',
  });
  const startingPopulation = treated.organismState.population;
  treated = startSimulation(treated);
  control = startSimulation(control);

  const timeSeries: MetastaticInhibitorRunRecord['timeSeries'] = [
    {
      timeHours: 0,
      treatedMovement: treated.organismState.cellMovement,
      controlMovement: control.organismState.cellMovement,
      treatedViability: treated.organismState.viability,
      controlViability: control.organismState.viability,
      treatedPopulation: treated.organismState.population,
      controlPopulation: control.organismState.population,
      treatedProliferation: treated.organismState.proliferation,
      controlProliferation: control.organismState.proliferation,
    },
  ];

  for (let i = 0; i < opts.ticks; i++) {
    treated = simulationTick(treated);
    control = simulationTick(control);
    timeSeries.push({
      timeHours: treated.timeHours,
      treatedMovement: treated.organismState.cellMovement,
      controlMovement: control.organismState.cellMovement,
      treatedViability: treated.organismState.viability,
      controlViability: control.organismState.viability,
      treatedPopulation: treated.organismState.population,
      controlPopulation: control.organismState.population,
      treatedProliferation: treated.organismState.proliferation,
      controlProliferation: control.organismState.proliferation,
    });
  }

  const t = treated.organismState;
  const c = control.organismState;
  const viableT = t.population * (t.viability / 100);
  const viableC = c.population * (c.viability / 100);
  const viabilityCaveat = t.viability < c.viability;

  const endpoints: EndpointReading[] = [
    endpoint(
      'movementMotilityIndex',
      'Movement (motility index)',
      'measured',
      '%',
      t.cellMovement,
      c.cellMovement,
      'Educational motility index from the tumour-cell model — not physical path length.',
    ),
    endpoint(
      'movementDistanceUm',
      'Movement distance',
      'unavailable',
      'µm',
      null,
      null,
      'Unavailable — the model does not record spatial migration distance.',
    ),
    endpoint(
      'invasion',
      'Invasion',
      'unavailable',
      'events',
      null,
      null,
      'Unavailable — Genesis Lab does not model invasion; not derived from movement or viability.',
    ),
    endpoint(
      'spreadEvents',
      'Spread events',
      'unavailable',
      'events',
      null,
      null,
      'Unavailable — no metastatic spread event counter exists in this educational model.',
    ),
    endpoint(
      'viableCellCount',
      'Viable cell count',
      'measured',
      'cells (population × viability/100)',
      viableT,
      viableC,
      'Educational estimate = modelled population × (viability/100).',
    ),
    endpoint(
      'population',
      'Cell population',
      'measured',
      'cells',
      t.population,
      c.population,
      'Modelled dish population.',
    ),
    endpoint(
      'growthProliferation',
      'Growth (proliferation index)',
      'measured',
      '%',
      t.proliferation,
      c.proliferation,
      'Educational proliferation index — separate from movement.',
    ),
    endpoint(
      'viability',
      'Viability',
      'measured',
      '%',
      t.viability,
      c.viability,
      viabilityCaveat
        ? 'Treated viability is lower than control — an apparent movement reduction may partly reflect fewer viable cells.'
        : 'Viability tracked separately from movement.',
    ),
    endpoint(
      'adverseEffects',
      'Adverse effects (model-defined)',
      'measured',
      'viability Δ pp vs control',
      t.viability - c.viability,
      0,
      'Proxy adverse signal on the tumour dish only (off-target/toxicity drag). Healthy-cell effects are unavailable.',
    ),
  ];

  return {
    runId: `MI-RUN-${opts.seed}-S${opts.strength}`,
    seed: opts.seed,
    strength: opts.strength,
    ticks: opts.ticks,
    timeHours: treated.timeHours,
    timestamp: new Date().toISOString(),
    genesisLabVersion: GENESIS_LAB_VERSION,
    cellModelId: opts.cellModelId,
    candidateName: METASTATIC_INHIBITOR_NAME,
    candidateId: METASTATIC_INHIBITOR_ID,
    initialConditions: {
      temperature: opts.environment.temperature,
      ph: opts.environment.ph,
      oxygen: opts.environment.oxygen,
      startingPopulation,
    },
    endpoints,
    viabilityCaveat,
    timeSeries,
  };
}

function aggregateForStrength(strength: number, runs: MetastaticInhibitorRunRecord[]): StrengthAggregate {
  const subset = runs.filter((r) => r.strength === strength);
  const moveT = subset.map((r) => r.endpoints.find((e) => e.key === 'movementMotilityIndex')?.treated).filter((n): n is number => n != null);
  const moveC = subset.map((r) => r.endpoints.find((e) => e.key === 'movementMotilityIndex')?.control).filter((n): n is number => n != null);
  const viaT = subset.map((r) => r.endpoints.find((e) => e.key === 'viability')?.treated).filter((n): n is number => n != null);
  const viaC = subset.map((r) => r.endpoints.find((e) => e.key === 'viability')?.control).filter((n): n is number => n != null);
  const popT = subset.map((r) => r.endpoints.find((e) => e.key === 'population')?.treated).filter((n): n is number => n != null);
  const popC = subset.map((r) => r.endpoints.find((e) => e.key === 'population')?.control).filter((n): n is number => n != null);
  const prolT = subset.map((r) => r.endpoints.find((e) => e.key === 'growthProliferation')?.treated).filter((n): n is number => n != null);
  const prolC = subset.map((r) => r.endpoints.find((e) => e.key === 'growthProliferation')?.control).filter((n): n is number => n != null);
  const pcts = subset.map((r) => {
    const e = r.endpoints.find((x) => x.key === 'movementMotilityIndex');
    if (!e || e.treated == null || e.control == null || e.control === 0) return null;
    return ((e.treated - e.control) / e.control) * 100;
  }).filter((n): n is number => n != null);

  return {
    strength,
    seeds: subset.map((r) => r.seed),
    movementMeanTreated: mean(moveT),
    movementMeanControl: mean(moveC),
    movementMeanPctVsControl: mean(pcts),
    movementSpreadPct: sampleStd(pcts),
    viabilityMeanTreated: mean(viaT),
    viabilityMeanControl: mean(viaC),
    populationMeanTreated: mean(popT),
    populationMeanControl: mean(popC),
    proliferationMeanTreated: mean(prolT),
    proliferationMeanControl: mean(prolC),
    effectSizeMovement: cohensD(moveT, moveC),
    viabilityCaveatCount: subset.filter((r) => r.viabilityCaveat).length,
    invasion: 'unavailable',
    movementDistanceUm: 'unavailable',
    spreadEvents: 'unavailable',
  };
}

/**
 * Run the Metastatic Inhibitor educational study:
 * matched untreated control vs candidate, ≥5 seeds, strength sweep.
 */
export function runMetastaticInhibitorStudy(opts?: {
  cellModelId?: string;
  cellModelName?: string;
  environment?: EnvironmentConditions;
  baseSeed?: number;
  seedCount?: number;
  strengthLevels?: number[];
  ticks?: number;
}): MetastaticInhibitorStudy {
  const design = getMetastaticInhibitorDesign();
  const cellModelId = opts?.cellModelId ?? design.targetCellModelId ?? 'ORG-HELA';
  const cellModelName = opts?.cellModelName ?? 'HeLa cells';
  const env: EnvironmentConditions = opts?.environment ?? {
    ...defaultEnvironment,
    temperature: 37,
    ph: 7.4,
    oxygen: 21,
    carbonDioxide: 5,
  };
  const baseSeed = opts?.baseSeed ?? 42;
  const seedCount = Math.max(MIN_RECORDED_SEEDS, opts?.seedCount ?? MIN_RECORDED_SEEDS);
  const strengthLevels = (opts?.strengthLevels ?? [...STRENGTH_SWEEP_LEVELS]).map(clampStrength);
  const ticks = opts?.ticks ?? 16;
  const seeds = Array.from({ length: seedCount }, (_, i) => deriveMovementReplicateSeed(baseSeed, i + 1));

  const runs: MetastaticInhibitorRunRecord[] = [];
  for (const strength of strengthLevels) {
    const d = designAtStrength(design, strength);
    const treatment = treatmentFrom(d);
    for (const seed of seeds) {
      runs.push(
        runPairedOnce({
          cellModelId,
          environment: env,
          treatment,
          seed,
          ticks,
          strength,
        }),
      );
    }
  }

  const aggregates = strengthLevels.map((s) => aggregateForStrength(s, runs));
  const primary = aggregates.find((a) => a.strength === design.variables.therapeuticEffect)
    ?? aggregates[Math.floor(aggregates.length / 2)]!;

  const strengthTrend = aggregates
    .map((a) => `S${a.strength}: mean movement Δ vs control ${a.movementMeanPctVsControl == null ? 'n/a' : `${a.movementMeanPctVsControl.toFixed(1)}%`}`)
    .join('; ');

  const seedConsistency = primary.movementSpreadPct == null
    ? 'Insufficient seeds to summarise spread.'
    : `At strength ${primary.strength}, movement %Δ vs control SD across ${primary.seeds.length} seeds was ${primary.movementSpreadPct.toFixed(2)} percentage points (educational only).`;

  const viabilityNote = primary.viabilityCaveatCount > 0
    ? `${primary.viabilityCaveatCount}/${primary.seeds.length} primary-strength seeds showed lower treated viability than control — movement reductions must not be read as pure motility effects.`
    : 'At primary strength, treated viability was not lower than control in these seeds; still do not equate movement with clinical anti-metastatic efficacy.';

  const conclusion =
    `In this educational simulation (${GENESIS_LAB_VERSION}), “${METASTATIC_INHIBITOR_NAME}” on ${cellModelName} produced a mean movement (motility index) change of `
    + `${primary.movementMeanPctVsControl == null ? 'unavailable' : `${primary.movementMeanPctVsControl.toFixed(1)}%`} vs matched untreated control `
    + `at strength ${primary.strength} across ${primary.seeds.length} seeds (effect size d=${primary.effectSizeMovement == null ? 'unavailable' : primary.effectSizeMovement.toFixed(2)}). `
    + `Invasion, spatial movement distance, and spread events remain unavailable. ${viabilityNote} `
    + `${EDUCATIONAL_NO_CLINICAL_NOTICE}. This does not demonstrate that metastasis was prevented in a person.`;

  const strengths = designEffectStrengths(design.variables);

  return {
    studyId: `MI-STUDY-${Date.now().toString(36).toUpperCase()}`,
    title: `${METASTATIC_INHIBITOR_NAME} — educational candidate study`,
    educationalNotice: EDUCATIONAL_NO_CLINICAL_NOTICE,
    aim: METASTATIC_INHIBITOR_AIM,
    genesisLabVersion: GENESIS_LAB_VERSION,
    createdAt: new Date().toISOString(),
    cellModelId,
    cellModelName,
    candidate: design,
    parameterSheet: METASTATIC_INHIBITOR_PARAMETERS,
    baseSeed,
    seedCount,
    seeds,
    strengthLevels,
    ticks,
    environment: env,
    runs,
    aggregates,
    methods: [
      `Candidate “${METASTATIC_INHIBITOR_NAME}” (${METASTATIC_INHIBITOR_ID}) with intended outcome reduce-movement.`,
      `Matched untreated control shares environment, starting population stream, and seed; treatment is the only intentional difference.`,
      `Seeds: ${seeds.join(', ')} (n=${seedCount}, derived from baseSeed ${baseSeed}).`,
      `Strength sweep on therapeuticEffect within 0–100: ${strengthLevels.join(', ')}.`,
      `Each run: ${ticks} simulation ticks (~educational hours on the model clock).`,
      `Effective educational strength at chosen parameters ≈ delivery×potency×selectivity×(1−0.5×drag) = ${(strengths.delivery * strengths.potency * strengths.selectivity * (1 - 0.5 * strengths.drag)).toFixed(3)}.`,
      'Endpoints: motility index, viable cell count (population×viability/100), population, proliferation, viability, adverse viability Δ; invasion / distance µm / spread events unavailable.',
      'Viability caveat flagged whenever treated viability < control viability.',
      `Model version ${GENESIS_LAB_VERSION}. All values are ${SIMULATED_ESTIMATE_LABEL}s.`,
    ],
    limitations: [
      EDUCATIONAL_NO_CLINICAL_NOTICE,
      'Not a clinically validated therapy; not a real vector construct.',
      'Invasion, spatial movement distance (µm), and metastatic spread events are unavailable — never invent them from movement or cell counts.',
      'Healthy-cell / off-tumour organ toxicity is unavailable; adverse effects are dish viability proxies only.',
      'A drop in viability is never proof of reduced movement.',
      'Reduced dish motility must never be labelled “metastasis prevented”.',
      'Dose/strength is an educational slider (therapeuticEffect), not a clinical dose.',
    ],
    conclusion,
    consistencyAcrossSeeds: seedConsistency,
    sensitivityToStrength: `Strength sweep movement means: ${strengthTrend}.`,
  };
}

export function metastaticInhibitorStudyToCsvRows(study: MetastaticInhibitorStudy): string[][] {
  const rows: string[][] = [
    ['field', 'value', 'source'],
    ['studyId', study.studyId, 'model'],
    ['candidateName', study.candidate.name, 'imported'],
    ['candidateId', study.candidate.id, 'imported'],
    ['educationalNotice', study.educationalNotice, 'model'],
    ['genesisLabVersion', study.genesisLabVersion, 'model'],
    ['createdAt', study.createdAt, 'model'],
    ['baseSeed', String(study.baseSeed), 'model'],
    ['seeds', study.seeds.join(';'), 'model'],
    ['strengthLevels', study.strengthLevels.join(';'), 'model'],
    ['ticks', String(study.ticks), 'model'],
    ['conclusion', study.conclusion, 'model'],
  ];
  for (const p of study.parameterSheet) {
    rows.push(
      [`param_${p.key}_baseline`, String(p.baselineValue), 'model'],
      [`param_${p.key}_chosen`, String(p.chosenValue), 'imported'],
      [`param_${p.key}_unit`, p.unitOrScale, 'model'],
      [`param_${p.key}_rationale`, p.rationale, 'model'],
      [`param_${p.key}_uncertainty`, p.uncertainty, 'model'],
    );
  }
  for (const r of study.runs) {
    for (const e of r.endpoints) {
      rows.push([
        `run_${r.runId}_${e.key}`,
        e.availability === 'unavailable'
          ? 'unavailable'
          : `treated=${e.treated};control=${e.control};pct=${e.percentDifferenceVsControl};caveat=${r.viabilityCaveat}`,
        'model',
      ]);
    }
    rows.push([
      `run_${r.runId}_meta`,
      `seed=${r.seed};strength=${r.strength};t=${r.timeHours};version=${r.genesisLabVersion};ts=${r.timestamp}`,
      'model',
    ]);
  }
  for (const a of study.aggregates) {
    rows.push([
      `aggregate_S${a.strength}`,
      `movePct=${a.movementMeanPctVsControl};spread=${a.movementSpreadPct};d=${a.effectSizeMovement};viaCaveat=${a.viabilityCaveatCount};invasion=${a.invasion}`,
      'model',
    ]);
  }
  return rows;
}

export function metastaticInhibitorStudyToExportPayload(study: MetastaticInhibitorStudy) {
  return {
    studyId: study.studyId,
    title: study.title,
    educationalNotice: study.educationalNotice,
    aim: study.aim,
    genesisLabVersion: study.genesisLabVersion,
    createdAt: study.createdAt,
    cellModelId: study.cellModelId,
    cellModelName: study.cellModelName,
    candidate: study.candidate,
    parameterSheet: study.parameterSheet,
    baseSeed: study.baseSeed,
    seeds: study.seeds,
    strengthLevels: study.strengthLevels,
    ticks: study.ticks,
    environment: study.environment,
    runs: study.runs,
    aggregates: study.aggregates,
    methods: study.methods,
    limitations: study.limitations,
    conclusion: study.conclusion,
    consistencyAcrossSeeds: study.consistencyAcrossSeeds,
    sensitivityToStrength: study.sensitivityToStrength,
  };
}

export function formatMetastaticInhibitorReport(study: MetastaticInhibitorStudy): string {
  const lines: string[] = [
    study.title,
    study.educationalNotice,
    `Aim: ${study.aim}`,
    `Model version: ${study.genesisLabVersion}; created ${study.createdAt}`,
    `Cell model: ${study.cellModelName} (${study.cellModelId})`,
    '',
    '=== Full candidate specification ===',
    `Name: ${study.candidate.name} (exact); id=${study.candidate.id}`,
    `Intended outcome: ${study.candidate.intendedOutcome}`,
    `Delivery: ${study.candidate.deliveryModel}; payload: ${study.candidate.payloadEffect}`,
    `Evidence: ${study.candidate.evidence.level} — ${study.candidate.evidence.note}`,
    ...study.parameterSheet.map(
      (p) =>
        `${p.label}: scale ${p.unitOrScale}; baseline ${p.baselineValue}; chosen ${p.chosenValue}; rationale: ${p.rationale}; uncertainty: ${p.uncertainty}`,
    ),
    '',
    '=== Methods ===',
    ...study.methods,
    '',
    '=== Table of every run ===',
    ...study.runs.map((r) => {
      const move = r.endpoints.find((e) => e.key === 'movementMotilityIndex');
      const via = r.endpoints.find((e) => e.key === 'viability');
      const inv = r.endpoints.find((e) => e.key === 'invasion');
      return (
        `${r.runId}: seed=${r.seed} strength=${r.strength} t=${r.timeHours.toFixed(2)}h `
        + `move T/C=${move?.treated?.toFixed(1)}/${move?.control?.toFixed(1)} (${move?.percentDifferenceVsControl}); `
        + `viability T/C=${via?.treated?.toFixed(1)}/${via?.control?.toFixed(1)}; `
        + `invasion=${inv?.availability}; viabilityCaveat=${r.viabilityCaveat}; ts=${r.timestamp}`
      );
    }),
    '',
    '=== Aggregates (mean, spread, effect size) ===',
    ...study.aggregates.map(
      (a) =>
        `Strength ${a.strength}: movement mean Δ% ${a.movementMeanPctVsControl?.toFixed(2) ?? 'unavailable'} `
        + `(SD ${a.movementSpreadPct?.toFixed(2) ?? 'unavailable'}); Cohen's d=${a.effectSizeMovement?.toFixed(2) ?? 'unavailable'}; `
        + `viability caveat seeds=${a.viabilityCaveatCount}; invasion=${a.invasion}; distanceµm=${a.movementDistanceUm}; spreadEvents=${a.spreadEvents}`,
    ),
    '',
    `Consistency across seeds: ${study.consistencyAcrossSeeds}`,
    `Sensitivity to strength: ${study.sensitivityToStrength}`,
    '',
    '=== Limitations ===',
    ...study.limitations,
    '',
    '=== Conclusion (simulation only) ===',
    study.conclusion,
  ];
  return lines.join('\n');
}

const STUDY_STORAGE_KEY = 'genesis-lab-metastatic-inhibitor-study-v1';

export function persistMetastaticInhibitorStudy(study: MetastaticInhibitorStudy): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(study));
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'storage failed';
    return { ok: false, error: msg };
  }
}

export function loadMetastaticInhibitorStudy(): MetastaticInhibitorStudy | null {
  try {
    const raw = localStorage.getItem(STUDY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetastaticInhibitorStudy;
    if (!parsed || parsed.candidate?.name !== METASTATIC_INHIBITOR_NAME) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function fmtEndpointDisplay(e: EndpointReading): string {
  if (e.availability === 'unavailable') return 'unavailable';
  if (e.treated === null || e.control === null) return 'unavailable';
  if (e.key === 'population' || e.key === 'viableCellCount') {
    return `T ${formatPopulation(e.treated)} / C ${formatPopulation(e.control)} (${e.percentDifferenceVsControl})`;
  }
  return `T ${e.treated.toFixed(1)}${e.unit} / C ${e.control.toFixed(1)}${e.unit} (${e.percentDifferenceVsControl})`;
}
