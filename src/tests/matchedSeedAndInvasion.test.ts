/**
 * Seed consistency across baseline → design apply → treated/control → report,
 * plus invasion “not measured” (no invented invasion model).
 */

import { describe, expect, test } from 'bun:test';
import { organismIndex } from '../catalogue';
import { defaultEnvironment } from '../data/demoData';
import {
  attachTherapeuticToSetup,
  createExperimentSetup,
  invalidateBaselineIfSeedMismatch,
  recordDishBaseline,
} from '../services/experimentWorkspaceService';
import {
  baselineSeedMatchesActive,
  buildBeforeAfterResult,
  deriveTumourExperimentSeed,
  resolvePairedExperimentSeed,
  therapeuticConfigFromDesign,
} from '../services/tumourCellSimulation';
import {
  buildTumourResponseMonitoring,
  INVASION_NOT_MEASURED,
} from '../services/tumourResponseMonitoring';
import { createSimulation, simulationTick, startSimulation } from '../simulation/engine';
import type { TherapeuticDesign } from '../types/scientific';
import { GENESIS_LAB_VERSION } from '../services/genesisLabVersion';

const VARS: TherapeuticDesign['variables'] = {
  targetingPreference: 80,
  uptake: 70,
  therapeuticEffect: 75,
  immuneResponse: 20,
  clearance: 30,
  offTargetEffect: 10,
  resistance: 5,
  toxicityProxy: 10,
};

function makeDesign(partial: Partial<TherapeuticDesign> = {}): TherapeuticDesign {
  return {
    id: 'TD-SEED-FIX',
    name: 'Conceptual anti-migration vector',
    targetType: 'tumour-cell',
    targetDescription: 'Educational motility target',
    deliveryModel: 'non-replicating-vector',
    payloadEffect: 'suppress-target',
    intendedOutcome: 'reduce-movement',
    targetCellModelId: 'ORG-HELA',
    variables: { ...VARS },
    notes: '',
    createdAt: '2026-09-27T00:00:00Z',
    evidence: { level: 'speculative', note: 'educational test' },
    ...partial,
  };
}

function runTicks(sim: ReturnType<typeof createSimulation>, n: number) {
  let s = startSimulation(sim);
  for (let i = 0; i < n; i++) s = simulationTick(s);
  return s;
}

describe('matched seed after design apply + invasion not measured', () => {
  test('deriveTumourExperimentSeed preserves a committed base seed', () => {
    const preserved = deriveTumourExperimentSeed('TD-ANY', 'ORG-HELA', 2178677731);
    expect(preserved).toBe(2178677731);
    // Without a base seed, design+cell still yields a stable derived value
    const derived = deriveTumourExperimentSeed('TD-ANY', 'ORG-HELA');
    expect(derived).not.toBe(2178677731);
    expect(deriveTumourExperimentSeed('TD-ANY', 'ORG-HELA')).toBe(derived);
  });

  test('applying a saved design after baseline keeps the same matched seed', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    let setup = createExperimentSetup(entry);
    const committedSeed = 2178677731;
    setup = { ...setup, simulationSeed: committedSeed };

    let experimental = createSimulation('ORG-HELA', setup.environment, undefined, {
      seed: committedSeed,
    });
    let control = createSimulation('ORG-HELA', setup.control.environment, undefined, {
      seed: committedSeed,
      conditionId: 'ctrl',
    });
    experimental = runTicks(experimental, 4);
    control = runTicks(control, 4);

    setup = recordDishBaseline(setup, experimental, control.organismState);
    expect(setup.recordedBaseline!.seed).toBe(committedSeed);
    expect(setup.simulationSeed).toBe(committedSeed);

    const design = makeDesign();
    // Old bug: hashing design into seed changed 2178677731 → a different value while keeping baseline
    const wronglyRetargeted = (() => {
      let h = (committedSeed >>> 0);
      const str = `${design.id}::ORG-HELA`;
      for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995) >>> 0;
      return h || 1;
    })();
    expect(wronglyRetargeted).not.toBe(committedSeed);

    setup = attachTherapeuticToSetup(setup, design);
    expect(setup.simulationSeed).toBe(committedSeed);
    expect(setup.recordedBaseline!.seed).toBe(committedSeed);
    expect(resolvePairedExperimentSeed(setup, design.id)).toBe(committedSeed);

    experimental = {
      ...experimental,
      seed: setup.simulationSeed!,
      therapeuticTreatment: therapeuticConfigFromDesign(design),
    };
    control = { ...control, seed: setup.simulationSeed!, therapeuticTreatment: undefined };
    experimental = runTicks(experimental, 12);
    control = runTicks(control, 12);

    const beforeAfter = buildBeforeAfterResult({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      baseline: {
        timeHours: setup.recordedBaseline!.timeHours,
        organismState: setup.recordedBaseline!.organismState,
        seed: setup.recordedBaseline!.seed,
      },
      after: experimental.organismState,
      control: control.organismState,
      treatment: setup.attachedTherapeutic,
      seed: setup.recordedBaseline!.seed,
      activeSeed: experimental.seed,
      elapsedAfterHours: experimental.timeHours,
    });

    expect(beforeAfter.seedMatched).toBe(true);
    expect(beforeAfter.seed).toBe(committedSeed);
    expect(beforeAfter.activeSeed).toBe(committedSeed);
    expect(beforeAfter.seedMismatchMessage).toBeNull();
    expect(beforeAfter.howCalculated.some((h) => h.includes(`Matched seed ${committedSeed}`))).toBe(true);

    const invasion = beforeAfter.rows.find((r) => r.key === 'invasion')!;
    expect(invasion.metric).toBe('Invasion');
    expect(invasion.after).toBe('not measured');
    expect(invasion.baseline).toBe('not measured');
    expect(invasion.control).toBe('not measured');
    expect(invasion.calculation.toLowerCase()).toContain('not measured');
    expect(invasion.calculation.toLowerCase()).toContain('not derived from movement');
    expect(invasion.note.toLowerCase()).toContain('metastasis');

    const monitoring = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimental,
      control,
      experimentalEnv: setup.environment,
      controlEnv: setup.control.environment,
      treatment: setup.attachedTherapeutic,
      baseline: setup.recordedBaseline,
    })!;
    expect(monitoring.comparisonAllowed).toBe(true);
    expect(monitoring.seed).toBe(committedSeed);
    expect(monitoring.match.checked.seed.treated).toBe(committedSeed);
    expect(monitoring.match.checked.seed.control).toBe(committedSeed);
    const inv = monitoring.channels.find((c) => c.key === 'invasion')!;
    expect(inv.assessment).toBe('not-measured');
    expect(inv.displayTreatedEnd).toBe('not measured');
    expect(inv.note).toBe(INVASION_NOT_MEASURED);
  });

  test('refresh / reopen paired run keeps consistent seeds in monitoring and report', async () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    let setup = { ...createExperimentSetup(entry), simulationSeed: 129494736 };
    const design = makeDesign({ id: 'TD-REOPEN' });
    let experimental = createSimulation('ORG-HELA', setup.environment, undefined, {
      seed: 129494736,
    });
    let control = createSimulation('ORG-HELA', setup.control.environment, undefined, {
      seed: 129494736,
      conditionId: 'c',
    });
    experimental = runTicks(experimental, 3);
    control = runTicks(control, 3);
    setup = recordDishBaseline(setup, experimental, control.organismState);
    setup = attachTherapeuticToSetup(setup, design);
    expect(setup.simulationSeed).toBe(129494736);
    expect(setup.recordedBaseline!.seed).toBe(129494736);

    experimental = {
      ...experimental,
      seed: 129494736,
      therapeuticTreatment: therapeuticConfigFromDesign(design),
    };
    control = { ...control, seed: 129494736 };
    experimental = runTicks(experimental, 10);
    control = runTicks(control, 10);

    // Persist-like reopen: rebuild monitoring + report from saved setup + sims
    const reopened = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimental,
      control,
      experimentalEnv: experimental.environment,
      controlEnv: control.environment,
      treatment: setup.attachedTherapeutic,
      baseline: setup.recordedBaseline,
      savedAt: new Date().toISOString(),
    })!;
    expect(reopened.seed).toBe(129494736);
    expect(reopened.comparisonAllowed).toBe(true);
    expect(reopened.genesisLabVersion).toBe(GENESIS_LAB_VERSION);

    const { buildScientificReport } = await import('../services/reportGenerator');
    const report = buildScientificReport(setup, experimental, control, null, 'standard', '', 1);
    const movement = report.sections.find((s) => s.id === 'tumour-cell-movement')!;
    const response = report.sections.find((s) => s.id === 'tumour-response-monitoring')!;
    expect(movement.content).toContain('129494736');
    expect(response.content).toContain('129494736');
    // Must not claim a different baseline seed
    expect(response.content).not.toContain('2178677731');
    expect(response.content.toLowerCase()).toMatch(/invasion: not measured|invasion.*not measured/);
    expect(baselineSeedMatchesActive(setup.recordedBaseline!.seed, experimental.seed)).toBe(true);
  });

  test('seed mismatch invalidates baseline rather than labelling runs as same seed', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    let setup = createExperimentSetup(entry);
    setup = {
      ...setup,
      simulationSeed: 100,
      recordedBaseline: {
        recordedAt: '2026-09-27T00:00:00Z',
        timeHours: 1,
        tick: 4,
        seed: 2178677731,
        organismState: createSimulation('ORG-HELA', defaultEnvironment, undefined, { seed: 2178677731 }).organismState,
        controlOrganismState: null,
        label: 'stale baseline',
      },
    };
    const { setup: cleared, invalidated, reason } = invalidateBaselineIfSeedMismatch(setup, 129494736);
    expect(invalidated).toBe(true);
    expect(cleared.recordedBaseline).toBeNull();
    expect(reason).toMatch(/2178677731/);
    expect(reason).toMatch(/129494736/);

    const mismatched = buildBeforeAfterResult({
      cellModelId: 'ORG-HELA',
      cellModelName: 'HeLa cells',
      baseline: {
        timeHours: 1,
        organismState: setup.recordedBaseline!.organismState,
        seed: 2178677731,
      },
      after: setup.recordedBaseline!.organismState,
      control: null,
      seed: 2178677731,
      activeSeed: 129494736,
      elapsedAfterHours: 2,
    });
    expect(mismatched.seedMatched).toBe(false);
    expect(mismatched.seedMismatchMessage).toMatch(/Seed mismatch/);
    expect(mismatched.howCalculated.some((h) => /same seed/i.test(h) && !/mismatch/i.test(h))).toBe(false);
  });

  test('invasion stays not measured and is never derived from movement or viability', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const design = makeDesign();
    let setup = attachTherapeuticToSetup(
      { ...createExperimentSetup(entry), simulationSeed: 42 },
      design,
    );
    const seed = setup.simulationSeed!;
    let experimental = runTicks(
      createSimulation('ORG-HELA', setup.environment, undefined, {
        seed,
        therapeuticTreatment: setup.attachedTherapeutic!,
      }),
      16,
    );
    let control = runTicks(
      createSimulation('ORG-HELA', setup.control.environment, undefined, { seed, conditionId: 'c' }),
      16,
    );
    const monitoring = buildTumourResponseMonitoring({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimental,
      control,
      experimentalEnv: setup.environment,
      controlEnv: setup.control.environment,
      treatment: setup.attachedTherapeutic,
    })!;
    const invasion = monitoring.channels.find((c) => c.key === 'invasion')!;
    const movement = monitoring.channels.find((c) => c.key === 'movement')!;
    expect(invasion.assessment).toBe('not-measured');
    expect(invasion.treatedEnd).toBeNull();
    expect(invasion.chartTreated).toEqual([]);
    // Movement is measured — must not be copied into invasion
    expect(movement.assessment).toBe('measured');
    expect(invasion.treatedEnd).not.toBe(movement.treatedEnd);
    expect(INVASION_NOT_MEASURED.toLowerCase()).toContain('not derived from movement');
  });
});
