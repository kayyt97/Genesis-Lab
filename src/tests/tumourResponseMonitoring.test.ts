/**
 * Tumour Response Monitoring — matched-run comparison, mismatch flags,
 * separate movement/population/viability channels, persistence, and classification.
 */

import { describe, expect, test } from 'bun:test';
import { organismIndex } from '../catalogue';
import { createSimulation, simulationTick, startSimulation } from '../simulation/engine';
import {
  attachTherapeuticToSetup,
  createExperimentSetup,
  environmentsMatchForComparison,
} from '../services/experimentWorkspaceService';
import {
  MOVEMENT_STOPPED_THRESHOLD,
  buildTumourResponseMonitoring,
  classifyMovementResponse,
  responseMonitoringToCsvRows,
  responseMonitoringToExportPayload,
  savePairedResponseOnSetup,
  toPairedResponseSnapshot,
  validatePairedRunMatch,
} from '../services/tumourResponseMonitoring';
import { therapeuticConfigFromDesign } from '../services/tumourCellSimulation';
import { GENESIS_LAB_VERSION } from '../services/genesisLabVersion';
import type { TherapeuticDesign } from '../types/scientific';
import { defaultEnvironment } from '../data/demoData';

const FIXED_VARS: TherapeuticDesign['variables'] = {
  targetingPreference: 75,
  uptake: 80,
  therapeuticEffect: 85,
  immuneResponse: 5,
  clearance: 20,
  offTargetEffect: 10,
  resistance: 5,
  toxicityProxy: 10,
};

function makeAntiMigrationDesign(overrides: Partial<TherapeuticDesign> = {}): TherapeuticDesign {
  return {
    id: 'TD-TEST-MIG',
    name: 'Conceptual anti-migration vector',
    targetType: 'protein',
    targetDescription: 'Educational motility target',
    deliveryModel: 'viral-vector-analogue',
    payloadEffect: 'inhibitory',
    intendedOutcome: 'reduce-movement',
    targetCellModelId: 'ORG-HELA',
    variables: { ...FIXED_VARS },
    notes: 'Educational test design',
    createdAt: '2026-09-27T00:00:00Z',
    evidence: { level: 'speculative', note: 'educational test' },
    ...overrides,
  };
}

function runPairedHeLa(opts?: {
  ticks?: number;
  mismatchPh?: boolean;
  mismatchSeed?: boolean;
  withTreatment?: boolean;
}) {
  const entry = organismIndex.getById('ORG-HELA')!;
  let setup = createExperimentSetup(entry);
  const design = makeAntiMigrationDesign();
  if (opts?.withTreatment !== false) {
    setup = attachTherapeuticToSetup(setup, design);
  }
  const treatment = setup.attachedTherapeutic ?? null;
  const seed = setup.simulationSeed ?? 42;
  const env = { ...setup.environment };
  const controlEnv = opts?.mismatchPh
    ? { ...setup.control.environment, ph: setup.control.environment.ph + 0.5 }
    : { ...setup.control.environment };

  let experimental = createSimulation('ORG-HELA', env, undefined, {
    seed,
    therapeuticTreatment: treatment ?? undefined,
  });
  let control = createSimulation('ORG-HELA', controlEnv, undefined, {
    seed: opts?.mismatchSeed ? seed + 7 : seed,
    conditionId: 'ctrl',
  });
  experimental = startSimulation(experimental);
  control = startSimulation(control);
  const ticks = opts?.ticks ?? 20;
  for (let i = 0; i < ticks; i++) {
    experimental = simulationTick(experimental);
    control = simulationTick(control);
  }
  return { setup, experimental, control, design, treatment, env, controlEnv, seed };
}

describe('tumourResponseMonitoring', () => {
  test('matched HeLa pair allows comparison; treatment lowers movement vs control', () => {
    const { setup, experimental, control, treatment, env, controlEnv } = runPairedHeLa();
    const monitoring = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: 'HeLa cells',
      experimental,
      control,
      experimentalEnv: env,
      controlEnv,
      treatment,
      baseline: setup.recordedBaseline ?? null,
    });
    expect(monitoring).not.toBeNull();
    expect(monitoring!.comparisonAllowed).toBe(true);
    expect(monitoring!.match.ok).toBe(true);
    expect(monitoring!.match.mismatches).toEqual([]);
    expect(monitoring!.genesisLabVersion).toBe(GENESIS_LAB_VERSION);
    expect(monitoring!.designName).toBe('Conceptual anti-migration vector');

    const movement = monitoring!.channels.find((c) => c.key === 'movement')!;
    const population = monitoring!.channels.find((c) => c.key === 'population')!;
    const viability = monitoring!.channels.find((c) => c.key === 'viability')!;
    const invasion = monitoring!.channels.find((c) => c.key === 'invasion')!;
    const healthy = monitoring!.channels.find((c) => c.key === 'healthyCells')!;

    expect(movement.assessment).toBe('measured');
    expect(population.assessment).toBe('measured');
    expect(viability.assessment).toBe('measured');
    expect(invasion.assessment).toBe('not-assessed');
    expect(healthy.assessment).toBe('not-assessed');
    expect(invasion.displayTreatedEnd).toBe('not assessed');
    expect(healthy.note.toLowerCase()).toContain('not assessed');

    expect(movement.treatedEnd).not.toBeNull();
    expect(movement.controlEnd).not.toBeNull();
    expect(movement.treatedEnd!).toBeLessThan(movement.controlEnd!);
    expect(movement.treatedStart).not.toBeNull();
    expect(movement.treatedDelta).not.toBeNull();
    expect(movement.percentDifferenceVsControl).not.toBe('not measured');
    expect(movement.percentDifferenceVsControl).not.toBe('comparison blocked');
    expect(movement.note.toLowerCase()).toContain('not proof of reduced movement');

    // Population and viability are separate — do not require them to mirror movement
    expect(population.treatedEnd).not.toBeNull();
    expect(viability.treatedEnd).not.toBeNull();
    expect(population.key).not.toBe(movement.key);

    expect(monitoring!.movementStatus).not.toBeNull();
    expect(['slowed', 'stopped-within-range', 'continued']).toContain(
      monitoring!.movementStatus!.status,
    );
    expect(monitoring!.movementStatus!.plainEnglish.toLowerCase()).not.toContain('metastasis prevented');
    expect(monitoring!.limitations.some((l) => l.includes('metastasis prevented'))).toBe(true);
  });

  test('mismatched pH blocks comparison instead of presenting a clean pair', () => {
    const { experimental, control, treatment, env, controlEnv } = runPairedHeLa({
      mismatchPh: true,
    });
    expect(environmentsMatchForComparison(env, controlEnv).ok).toBe(false);
    const match = validatePairedRunMatch({
      experimental,
      control,
      experimentalEnv: env,
      controlEnv,
      treatment,
    });
    expect(match.ok).toBe(false);
    expect(match.mismatches.some((m) => m.includes('ph') || m.includes('environment'))).toBe(true);

    const monitoring = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: 'HeLa cells',
      experimental,
      control,
      experimentalEnv: env,
      controlEnv,
      treatment,
    })!;
    expect(monitoring.comparisonAllowed).toBe(false);
    expect(monitoring.movementStatus).toBeNull();
    const movement = monitoring.channels.find((c) => c.key === 'movement')!;
    expect(movement.assessment).toBe('comparison-blocked');
    expect(movement.percentDifferenceVsControl).toBe('comparison blocked');
  });

  test('mismatched seed is flagged', () => {
    const { experimental, control, treatment, env, controlEnv } = runPairedHeLa({
      mismatchSeed: true,
    });
    const match = validatePairedRunMatch({
      experimental,
      control,
      experimentalEnv: env,
      controlEnv,
      treatment,
    });
    expect(match.ok).toBe(false);
    expect(match.mismatches.some((m) => m.includes('seed'))).toBe(true);
  });

  test('movement classification: slowed, stopped-within-range, continued', () => {
    const slowed = classifyMovementResponse(40, 70);
    expect(slowed.status).toBe('slowed');
    expect(slowed.plainEnglish).toContain('slowed');
    expect(slowed.plainEnglish.toLowerCase()).not.toContain('metastasis prevented in a person');
    // slowed message says "does not mean metastasis was prevented"
    expect(slowed.plainEnglish).toMatch(/does not mean metastasis/i);

    const stopped = classifyMovementResponse(MOVEMENT_STOPPED_THRESHOLD, 65);
    expect(stopped.status).toBe('stopped-within-range');
    expect(stopped.plainEnglish).toContain('measurement floor');

    const continued = classifyMovementResponse(69, 70);
    expect(continued.status).toBe('continued');
    expect(continued.plainEnglish).toContain('continued');
  });

  test('separate movement / population / viability calculations stay independent', () => {
    const { experimental, control, treatment, env, controlEnv } = runPairedHeLa({ ticks: 24 });
    const monitoring = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: 'HeLa cells',
      experimental,
      control,
      experimentalEnv: env,
      controlEnv,
      treatment,
    })!;
    const movement = monitoring.channels.find((c) => c.key === 'movement')!;
    const population = monitoring.channels.find((c) => c.key === 'population')!;
    const viability = monitoring.channels.find((c) => c.key === 'viability')!;

    // All three measured with their own start/end/Δ
    for (const ch of [movement, population, viability]) {
      expect(ch.treatedStart).not.toBeNull();
      expect(ch.treatedEnd).not.toBeNull();
      expect(ch.treatedDelta).toBe(ch.treatedEnd! - ch.treatedStart!);
      expect(ch.controlDelta).toBe(ch.controlEnd! - ch.controlStart!);
    }

    // Movement drop must not be inferred solely from viability — channels report separately
    expect(movement.note).toMatch(/not proof of reduced movement/i);
    expect(viability.note).toMatch(/not proof of reduced movement/i);
    expect(population.note.toLowerCase()).toContain('separately');
  });

  test('persistence: snapshot saves onto setup and reopens endpoints', () => {
    const { setup, experimental, control, treatment, env, controlEnv, design } = runPairedHeLa();
    const monitoring = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: 'HeLa cells',
      experimental,
      control,
      experimentalEnv: env,
      controlEnv,
      treatment,
    })!;
    const snapshot = toPairedResponseSnapshot(monitoring, design.id);
    expect(snapshot.version).toBe(1);
    expect(snapshot.matchOk).toBe(true);
    expect(snapshot.genesisLabVersion).toBe(GENESIS_LAB_VERSION);
    expect(snapshot.settings.ph).toBe(env.ph);
    expect(snapshot.channelEndpoints.length).toBe(5);

    const saved = savePairedResponseOnSetup(setup, snapshot);
    expect(saved.pairedResponseSnapshot).toEqual(snapshot);
    expect(saved.history.some((h) => h.type === 'paired-response-saved')).toBe(true);

    const reopened = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: 'HeLa cells',
      experimental,
      control,
      experimentalEnv: env,
      controlEnv,
      treatment,
      savedAt: saved.pairedResponseSnapshot!.savedAt,
    })!;
    expect(reopened.savedAt).toBe(snapshot.savedAt);
  });

  test('CSV and JSON export payloads include match flags and not-assessed channels', () => {
    const { experimental, control, treatment, env, controlEnv } = runPairedHeLa();
    const monitoring = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: 'HeLa cells',
      experimental,
      control,
      experimentalEnv: env,
      controlEnv,
      treatment,
    })!;
    const csv = responseMonitoringToCsvRows(monitoring);
    const fields = csv.map((r) => r[0]);
    expect(fields).toContain('responseMatchOk');
    expect(fields).toContain('response_invasion_assessment');
    expect(fields).toContain('response_healthyCells_assessment');
    expect(fields).toContain('responseNeverMetastasisClaim');
    expect(csv.find((r) => r[0] === 'response_invasion_assessment')?.[1]).toBe('not-assessed');

    const payload = responseMonitoringToExportPayload(monitoring);
    expect(payload.comparisonAllowed).toBe(true);
    expect(payload.channels.some((c) => c.key === 'invasion' && c.assessment === 'not-assessed')).toBe(true);
    expect(payload.neverMetastasisClaim).toMatch(/metastasis prevented/i);
  });

  test('report section includes tumour response monitoring', async () => {
    const { setup, experimental, control } = runPairedHeLa();
    const { buildScientificReport } = await import('../services/reportGenerator');
    const report = buildScientificReport(setup, experimental, control, null, 'standard', '', 1);
    const section = report.sections.find((s) => s.id === 'tumour-response-monitoring');
    expect(section).toBeTruthy();
    expect(section!.source).toBe('model-generated');
    expect(section!.content).toContain('Tumour Response Monitoring');
    expect(section!.content.toLowerCase()).toContain('invasion');
    expect(section!.content).toMatch(/not assessed/i);
    expect(section!.content).toMatch(/metastasis prevented/i);
  });

  test('validatePairedRunMatch requires identical starting population', () => {
    const env = { ...defaultEnvironment };
    const experimental = createSimulation('ORG-HELA', env, undefined, { seed: 11 });
    const control = createSimulation('ORG-HELA', env, undefined, { seed: 11 });
    const baseline = {
      recordedAt: '2026-09-27T00:00:00Z',
      timeHours: 0,
      tick: 0,
      seed: 11,
      organismState: { ...experimental.organismState, population: 999_999 },
      controlOrganismState: { ...control.organismState, population: 100_000 },
      label: 'Divergent baseline populations',
    };
    const match = validatePairedRunMatch({
      experimental,
      control,
      experimentalEnv: env,
      controlEnv: env,
      treatment: therapeuticConfigFromDesign(makeAntiMigrationDesign()),
      baseline,
      cellModelId: 'ORG-HELA',
    });
    expect(match.ok).toBe(false);
    expect(match.mismatches.some((m) => m.includes('starting cell count'))).toBe(true);
  });
});
