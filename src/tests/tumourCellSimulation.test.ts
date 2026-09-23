import { describe, expect, test } from 'bun:test';
import { defaultEnvironment } from '../data/demoData';
import { organismIndex } from '../catalogue/index';
import {
  applyMoleculeToSetup,
  attachTherapeuticToSetup,
  createExperimentSetup,
  environmentFromSetup,
} from '../services/experimentWorkspaceService';
import {
  applyTherapeuticTick,
  buildComparisonRows,
  deriveTumourExperimentSeed,
  designEffectStrengths,
  formatMetricDisplay,
  initialTumourMetrics,
  isTumourCellModel,
  percentDifference,
  readEducationalMetrics,
  therapeuticConfigFromDesign,
} from '../services/tumourCellSimulation';
import {
  createSimulation,
  simulationTick,
  startSimulation,
} from '../simulation/engine';
import type { TherapeuticDesign } from '../types/scientific';

const FIXED_VARS: TherapeuticDesign['variables'] = {
  targetingPreference: 80,
  uptake: 70,
  therapeuticEffect: 75,
  immuneResponse: 20,
  clearance: 30,
  offTargetEffect: 10,
  resistance: 5,
  toxicityProxy: 15,
};

function makeDesign(partial: Partial<TherapeuticDesign> = {}): TherapeuticDesign {
  return {
    id: 'TD-TEST01',
    name: 'Test reduce-movement design',
    targetType: 'tumour-cell',
    targetDescription: 'Educational HeLa motility concept',
    deliveryModel: 'lipid-carrier',
    payloadEffect: 'suppress-target',
    intendedOutcome: 'reduce-movement',
    targetCellModelId: 'ORG-HELA',
    variables: { ...FIXED_VARS },
    notes: '',
    createdAt: '2026-09-22T00:00:00Z',
    evidence: { level: 'speculative', note: 'test' },
    ...partial,
  };
}

function runTicks(sim: ReturnType<typeof createSimulation>, n: number) {
  let s = startSimulation(sim);
  for (let i = 0; i < n; i++) s = simulationTick(s);
  return s;
}

describe('tumour-cell therapeutic simulation', () => {
  test('simulation-ready tumour cell lines are recognised; E. coli is not', () => {
    expect(isTumourCellModel('ORG-HELA')).toBe(true);
    expect(isTumourCellModel('ORG-CL-MCF7')).toBe(true);
    expect(isTumourCellModel('ORG-CL-A549')).toBe(true);
    expect(isTumourCellModel('ORG-ECOLI')).toBe(false);
    const taxonomy = organismIndex.query({
      category: 'tumours-cancer',
      simulationReady: false,
      pageSize: 1,
    }).items[0];
    if (taxonomy) expect(isTumourCellModel(taxonomy.id)).toBe(false);
  });

  test('therapeutic handoff does not change modelled pH (removes 0.2 shortcut)', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const setup = createExperimentSetup(entry);
    const baselinePh = environmentFromSetup(setup).ph;
    const withDesign = attachTherapeuticToSetup(setup, makeDesign());
    const afterPh = environmentFromSetup(withDesign).ph;
    expect(withDesign.attachedTherapeutic?.designId).toBe('TD-TEST01');
    expect(withDesign.attachedTherapeutic?.intendedOutcome).toBe('reduce-movement');
    expect(afterPh).toBe(baselinePh);
    expect(withDesign.control.mode).toBe('auto-baseline');
  });

  test('matched untreated control shares seed and omits therapeutic treatment', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const design = makeDesign();
    const setup = attachTherapeuticToSetup(createExperimentSetup(entry), design);
    const seed = setup.simulationSeed!;
    const treatment = therapeuticConfigFromDesign(design);

    const experimental = createSimulation(setup.catalogueEntryId, environmentFromSetup(setup), undefined, {
      seed,
      therapeuticTreatment: treatment,
    });
    const control = createSimulation(setup.catalogueEntryId, setup.control.environment, undefined, {
      seed,
      conditionId: setup.control.sampleId,
    });

    expect(experimental.seed).toBe(control.seed);
    expect(experimental.therapeuticTreatment?.designId).toBe('TD-TEST01');
    expect(control.therapeuticTreatment).toBeUndefined();
    expect(experimental.organismState.cellMovement).not.toBeNull();
    expect(control.organismState.cellMovement).not.toBeNull();
    // Matched baselines for the same seed
    expect(experimental.organismState.cellMovement).toBe(control.organismState.cellMovement);
    expect(experimental.organismState.proliferation).toBe(control.organismState.proliferation);
  });

  test('results are deterministic for design + cell model + seed', () => {
    const design = makeDesign();
    const treatment = therapeuticConfigFromDesign(design);
    const seed = deriveTumourExperimentSeed(design.id, 'ORG-HELA', 42);
    const env = { ...defaultEnvironment, temperature: 37, ph: 7.4, oxygen: 21, nutrientAvailability: 100 };

    const a = runTicks(createSimulation('ORG-HELA', env, undefined, { seed, therapeuticTreatment: treatment }), 20);
    const b = runTicks(createSimulation('ORG-HELA', env, undefined, { seed, therapeuticTreatment: treatment }), 20);

    expect(a.organismState.viability).toBe(b.organismState.viability);
    expect(a.organismState.cellMovement).toBe(b.organismState.cellMovement);
    expect(a.organismState.proliferation).toBe(b.organismState.proliferation);
    expect(a.organismState.population).toBe(b.organismState.population);

    // Different seed changes outputs
    const c = runTicks(createSimulation('ORG-HELA', env, undefined, { seed: seed + 1, therapeuticTreatment: treatment }), 20);
    const same =
      a.organismState.cellMovement === c.organismState.cellMovement
      && a.organismState.viability === c.organismState.viability;
    expect(same).toBe(false);
  });

  test('reduce-movement lowers movement without equating viability drop to movement success', () => {
    const design = makeDesign({ intendedOutcome: 'reduce-movement' });
    const treatment = therapeuticConfigFromDesign(design);
    const seed = 12345;
    const init = initialTumourMetrics('ORG-HELA', seed);
    const base = {
      population: 500_000,
      viability: 90,
      replicationRate: 0.15,
      stress: 5,
      mutationIndicator: 1,
      environmentalTolerance: 60,
      cellMovement: init.cellMovement,
      proliferation: init.proliferation,
    };

    let treated = base;
    let control = base;
    for (let tick = 1; tick <= 40; tick++) {
      treated = applyTherapeuticTick({
        organismId: 'ORG-HELA',
        prev: treated,
        stress: 0.05,
        dt: 0.25,
        tick,
        seed,
        treatment,
      });
      control = applyTherapeuticTick({
        organismId: 'ORG-HELA',
        prev: control,
        stress: 0.05,
        dt: 0.25,
        tick,
        seed,
        treatment: null,
      });
    }

    expect(treated.cellMovement!).toBeLessThan(control.cellMovement!);

    const rows = buildComparisonRows(treated, control, 'ORG-HELA', 'reduce-movement');
    const movement = rows.find((r) => r.metric === 'Cell movement')!;
    const viability = rows.find((r) => r.metric === 'Viability')!;

    expect(movement.note).toContain('viability');
    expect(movement.experimental).toContain('simulated educational estimate');
    // Movement and viability are separate labelled channels
    expect(movement.metric).not.toBe(viability.metric);
    // A viability reading must never be used as the movement display
    expect(formatMetricDisplay(readEducationalMetrics(treated, 'ORG-HELA', 'reduce-movement')[0])).not.toBe(
      formatMetricDisplay(readEducationalMetrics(treated, 'ORG-HELA', 'reduce-movement')[2]),
    );
  });

  test('growth-suppression and cell-killing remain separate outcomes', () => {
    const seed = 99;
    const envBase = {
      population: 500_000,
      viability: 90,
      replicationRate: 0.15,
      stress: 5,
      mutationIndicator: 1,
      environmentalTolerance: 60,
      ...initialTumourMetrics('ORG-HELA', seed),
    };

    const growthDesign = therapeuticConfigFromDesign(makeDesign({
      id: 'TD-GROW',
      intendedOutcome: 'growth-suppression',
      variables: { ...FIXED_VARS, therapeuticEffect: 90, uptake: 90 },
    }));
    const killDesign = therapeuticConfigFromDesign(makeDesign({
      id: 'TD-KILL',
      intendedOutcome: 'cell-killing',
      variables: { ...FIXED_VARS, therapeuticEffect: 90, uptake: 90 },
    }));

    let growth = envBase;
    let kill = envBase;
    for (let tick = 1; tick <= 30; tick++) {
      growth = applyTherapeuticTick({ organismId: 'ORG-HELA', prev: growth, stress: 0.05, dt: 0.25, tick, seed, treatment: growthDesign });
      kill = applyTherapeuticTick({ organismId: 'ORG-HELA', prev: kill, stress: 0.05, dt: 0.25, tick, seed, treatment: killDesign });
    }

    // Cell-killing emphasises viability drop more than growth-suppression at matched potency
    expect(kill.viability).toBeLessThan(growth.viability);
    // Growth-suppression emphasises proliferation drop
    expect(growth.proliferation!).toBeLessThan(envBase.proliferation!);
  });

  test('design settings influence educational outputs', () => {
    const weak = designEffectStrengths({ ...FIXED_VARS, therapeuticEffect: 10, uptake: 10, targetingPreference: 10 });
    const strong = designEffectStrengths({ ...FIXED_VARS, therapeuticEffect: 95, uptake: 95, targetingPreference: 95 });
    expect(strong.potency).toBeGreaterThan(weak.potency);
    expect(strong.delivery * strong.potency * strong.selectivity)
      .toBeGreaterThan(weak.delivery * weak.potency * weak.selectivity);
  });

  test('E. coli does not invent cell-movement measurements', () => {
    const state = {
      population: 1e6,
      viability: 95,
      replicationRate: 0.6,
      stress: 5,
      mutationIndicator: 1,
      environmentalTolerance: 80,
      cellMovement: null as number | null,
      proliferation: null as number | null,
    };
    const metrics = readEducationalMetrics(state, 'ORG-ECOLI', 'reduce-movement');
    const movement = metrics.find((m) => m.key === 'cellMovement')!;
    expect(movement.status).toBe('not-measured');
    expect(movement.value).toBeNull();
    expect(formatMetricDisplay(movement)).toBe('not measured');
    expect(percentDifference(null, 50)).toBeNull();
  });

  test('molecule treatment still can adjust pH; therapeutic TD- ids do not', () => {
    const entry = organismIndex.getById('ORG-ECOLI')!;
    const setup = createExperimentSetup(entry);
    const withMol = applyMoleculeToSetup(setup, { id: 'MOL-ACID', name: 'Acid buffer', formula: 'H+' }, 'treatment');
    expect(environmentFromSetup(withMol).ph).toBeLessThan(environmentFromSetup(setup).ph);

    const withTd = applyMoleculeToSetup(setup, { id: 'TD-FAKE', name: 'Fake therapeutic', formula: 'x' }, 'treatment');
    expect(environmentFromSetup(withTd).ph).toBe(environmentFromSetup(setup).ph);
  });
});
