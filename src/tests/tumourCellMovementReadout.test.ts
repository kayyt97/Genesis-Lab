import { describe, expect, test } from 'bun:test';
import { organismIndex } from '../catalogue/index';
import {
  attachTherapeuticToSetup,
  createExperimentSetup,
  environmentFromSetup,
} from '../services/experimentWorkspaceService';
import {
  EDUCATIONAL_SIMULATION_LABEL,
  FEWER_CELLS_ALIVE_CAVEAT,
  MOVEMENT_NEVER_METASTASIS_CLAIM,
  MOVEMENT_READOUT_TITLE,
  buildTumourCellMovementReadout,
  deriveMovementReplicateSeed,
  formatMovementReadoutForReport,
  movementReadoutToCsvRows,
  movementReadoutToExportPayload,
} from '../services/tumourCellMovementReadout';
import { buildScientificReport } from '../services/reportGenerator';
import { createSimulation, simulationTick, startSimulation } from '../simulation/engine';
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
    id: 'TD-MOVE-01',
    name: 'Motility Concept Vector Alpha',
    targetType: 'tumour-cell',
    targetDescription: 'Educational HeLa motility concept',
    deliveryModel: 'lipid-carrier',
    payloadEffect: 'suppress-target',
    intendedOutcome: 'reduce-movement',
    targetCellModelId: 'ORG-HELA',
    variables: { ...FIXED_VARS },
    notes: '',
    createdAt: '2026-09-23T00:00:00Z',
    evidence: { level: 'speculative', note: 'educational test' },
    ...partial,
  };
}

function runTicks(sim: ReturnType<typeof createSimulation>, n: number) {
  let s = startSimulation(sim);
  for (let i = 0; i < n; i++) s = simulationTick(s);
  return s;
}

describe('Tumour Cell Movement readout', () => {
  test('handoff names the conceptual therapeutic on the treated group; control is untreated', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const design = makeDesign();
    const setup = attachTherapeuticToSetup(createExperimentSetup(entry), design);
    const seed = 9001;
    const treatment = setup.attachedTherapeutic!;

    const readout = buildTumourCellMovementReadout({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment,
      baseSeed: seed,
      replicateCount: 1,
      ticks: 12,
    });

    expect(readout).not.toBeNull();
    expect(readout!.title).toBe(MOVEMENT_READOUT_TITLE);
    expect(readout!.educationalSimulationLabel).toBe(EDUCATIONAL_SIMULATION_LABEL);
    expect(readout!.designName).toBe('Motility Concept Vector Alpha');
    expect(readout!.treatedGroupLabel).toContain('Motility Concept Vector Alpha');
    expect(readout!.controlGroupLabel).toBe('Untreated control');
    expect(readout!.intendedOutcome).toBe('Reduce cell movement');
  });

  test('control comparison reports movement values and % difference vs untreated control', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const design = makeDesign();
    const setup = attachTherapeuticToSetup(createExperimentSetup(entry), design);
    const seed = 4242;

    const readout = buildTumourCellMovementReadout({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment: setup.attachedTherapeutic,
      baseSeed: seed,
      replicateCount: 1,
      ticks: 20,
    })!;

    expect(readout.treatedMovement).not.toBeNull();
    expect(readout.controlMovement).not.toBeNull();
    expect(readout.treatedMovement!).toBeLessThan(readout.controlMovement!);
    expect(readout.percentDifferenceVsControl).not.toBe('not measured');
    expect(readout.percentDifferenceVsControl).toMatch(/-/);
    expect(readout.disclaimer).toBe('simulated educational estimate');
  });

  test('time-series chart data includes treated and control over simulated time', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const setup = attachTherapeuticToSetup(createExperimentSetup(entry), makeDesign());
    const readout = buildTumourCellMovementReadout({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment: setup.attachedTherapeutic,
      baseSeed: 111,
      replicateCount: 1,
      ticks: 10,
    })!;

    expect(readout.chartTreated.length).toBeGreaterThanOrEqual(2);
    expect(readout.chartControl.length).toBeGreaterThanOrEqual(2);
    expect(readout.timeSeries.length).toBeGreaterThanOrEqual(2);
    expect(readout.timeSeries[0]!.timeHours).toBeLessThan(readout.timeSeries[readout.timeSeries.length - 1]!.timeHours);
    const last = readout.timeSeries[readout.timeSeries.length - 1]!;
    expect(last.treated).not.toBeNull();
    expect(last.control).not.toBeNull();
    expect(last.percentDifference).not.toBeNull();
  });

  test('seeded replicates are reproducible and report per-replicate results', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const setup = attachTherapeuticToSetup(createExperimentSetup(entry), makeDesign());
    const opts = {
      cellModelId: 'ORG-HELA' as const,
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment: setup.attachedTherapeutic,
      baseSeed: 5555,
      replicateCount: 3,
      ticks: 14,
    };

    const a = buildTumourCellMovementReadout(opts)!;
    const b = buildTumourCellMovementReadout(opts)!;

    expect(a.replicates).toHaveLength(3);
    expect(b.replicates).toHaveLength(3);
    expect(a.replicates.map((r) => r.seed)).toEqual(b.replicates.map((r) => r.seed));
    expect(a.replicates.map((r) => r.treatedMovement)).toEqual(b.replicates.map((r) => r.treatedMovement));
    expect(a.replicates.map((r) => r.controlMovement)).toEqual(b.replicates.map((r) => r.controlMovement));
    expect(a.replicates.map((r) => r.percentDifferenceVsControl)).toEqual(
      b.replicates.map((r) => r.percentDifferenceVsControl),
    );

    for (let i = 0; i < 3; i++) {
      expect(a.replicates[i]!.replicate).toBe(i + 1);
      expect(a.replicates[i]!.seed).toBe(deriveMovementReplicateSeed(5555, i + 1));
      expect(a.replicates[i]!.percentDifferenceVsControl).not.toBe('not measured');
    }
    // Distinct seeds across replicates
    expect(new Set(a.replicates.map((r) => r.seed)).size).toBe(3);
  });

  test('uses live experimental/control sims as replicate 1 when available', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const design = makeDesign();
    const setup = attachTherapeuticToSetup(createExperimentSetup(entry), design);
    const seed = 777;
    const treatment = setup.attachedTherapeutic!;
    const experimental = runTicks(
      createSimulation('ORG-HELA', environmentFromSetup(setup), undefined, {
        seed,
        therapeuticTreatment: treatment,
      }),
      8,
    );
    const control = runTicks(
      createSimulation('ORG-HELA', setup.control.environment, undefined, { seed }),
      8,
    );

    const readout = buildTumourCellMovementReadout({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment,
      baseSeed: seed,
      replicateCount: 2,
      liveExperimental: experimental,
      liveControl: control,
    })!;

    expect(readout.replicates[0]!.treatedMovement).toBe(experimental.organismState.cellMovement);
    expect(readout.replicates[0]!.controlMovement).toBe(control.organismState.cellMovement);
    expect(readout.replicates).toHaveLength(2);
    expect(readout.replicates[1]!.seed).toBe(deriveMovementReplicateSeed(seed, 2));
  });

  test('keeps movement separate from growth and viability; never claims metastasis stopped', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const setup = attachTherapeuticToSetup(createExperimentSetup(entry), makeDesign());
    const readout = buildTumourCellMovementReadout({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment: setup.attachedTherapeutic,
      baseSeed: 12,
      replicateCount: 1,
      ticks: 16,
    })!;

    const reportText = formatMovementReadoutForReport(readout);
    expect(reportText).toContain(MOVEMENT_NEVER_METASTASIS_CLAIM);
    expect(reportText.toLowerCase()).not.toContain('metastasis has stopped');
    expect(reportText.toLowerCase()).not.toContain('metastasis was stopped');
    expect(readout.limitations.some((l) => l.includes('cannot establish that metastasis stopped'))).toBe(true);
    expect(readout.separateOutcomesNote.toLowerCase()).toContain('growth');
    expect(readout.separateOutcomesNote.toLowerCase()).toContain('viability');
    // Readout surface is movement-only (no proliferation field on the payload)
    expect('proliferation' in readout).toBe(false);
  });

  test('flags fewer living cells as a possible reason for apparent movement reduction', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    // Cell-killing outcome tends to lower viability more strongly
    const design = makeDesign({
      intendedOutcome: 'cell-killing',
      name: 'Kill Concept',
      variables: { ...FIXED_VARS, therapeuticEffect: 95, uptake: 90, targetingPreference: 90 },
    });
    const setup = attachTherapeuticToSetup(createExperimentSetup(entry), design);
    const readout = buildTumourCellMovementReadout({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment: setup.attachedTherapeutic,
      baseSeed: 99,
      replicateCount: 1,
      ticks: 24,
    })!;

    expect(readout.treatedViability!).toBeLessThan(readout.controlViability!);
    expect(readout.fewerCellsAliveCaveat).toBe(FEWER_CELLS_ALIVE_CAVEAT);
    expect(readout.replicates[0]!.fewerCellsAliveCaveat).toBe(true);
  });

  test('report and export include the same movement figures, replicates, and chart series', () => {
    const entry = organismIndex.getById('ORG-HELA')!;
    const design = makeDesign();
    const setup = attachTherapeuticToSetup(
      { ...createExperimentSetup(entry), simulationSeed: 3333 },
      design,
    );
    const experimental = runTicks(
      createSimulation('ORG-HELA', environmentFromSetup(setup), undefined, {
        seed: 3333,
        therapeuticTreatment: setup.attachedTherapeutic!,
      }),
      10,
    );
    const control = runTicks(
      createSimulation('ORG-HELA', setup.control.environment, undefined, { seed: 3333 }),
      10,
    );

    const readout = buildTumourCellMovementReadout({
      cellModelId: 'ORG-HELA',
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment: setup.attachedTherapeutic,
      baseSeed: 3333,
      replicateCount: 2,
      liveExperimental: experimental,
      liveControl: control,
    })!;

    const report = buildScientificReport(setup, experimental, control, null, 'standard', '', 2);
    const movementSection = report.sections.find((s) => s.id === 'tumour-cell-movement')!;
    expect(movementSection.title).toBe('Tumour Cell Movement');
    expect(movementSection.content).toContain(EDUCATIONAL_SIMULATION_LABEL);
    expect(movementSection.content).toContain('Motility Concept Vector Alpha');
    expect(movementSection.content).toContain(readout.percentDifferenceVsControl);
    expect(movementSection.content).toContain(MOVEMENT_NEVER_METASTASIS_CLAIM);
    expect(movementSection.content).toContain(`R1 seed=`);
    expect(movementSection.content.toLowerCase()).not.toContain('metastasis has stopped');
    expect(movementSection.content.toLowerCase()).not.toContain('metastasis was stopped');

    const csvRows = movementReadoutToCsvRows(readout);
    const fields = Object.fromEntries(csvRows.map((r) => [r[0], r[1]]));
    expect(fields.movementReadoutTitle).toBe(MOVEMENT_READOUT_TITLE);
    expect(fields.movementDesignName).toBe('Motility Concept Vector Alpha');
    expect(fields.movementPercentDifferenceVsControl).toBe(readout.percentDifferenceVsControl);
    expect(fields.movementReplicate1Treated).toBe(
      readout.replicates[0]!.treatedMovement!.toFixed(2),
    );
    expect(fields.movementReplicate2Treated).toBe(
      readout.replicates[1]!.treatedMovement!.toFixed(2),
    );
    expect(csvRows.some((r) => r[0]!.startsWith('movementTimeSeries_'))).toBe(true);
    expect(fields.movementNeverMetastasisClaim).toBe(MOVEMENT_NEVER_METASTASIS_CLAIM);

    const payload = movementReadoutToExportPayload(readout);
    expect(payload.chartTreated).toEqual(readout.chartTreated);
    expect(payload.chartControl).toEqual(readout.chartControl);
    expect(payload.replicates).toHaveLength(2);
    expect(payload.percentDifferenceVsControl).toBe(readout.percentDifferenceVsControl);
    expect(payload.neverMetastasisClaim).toContain('metastasis stopped');
  });

  test('E. coli yields no movement readout', () => {
    const entry = organismIndex.getById('ORG-ECOLI')!;
    const setup = createExperimentSetup(entry);
    const readout = buildTumourCellMovementReadout({
      cellModelId: 'ORG-ECOLI',
      cellModelName: entry.name,
      experimentalEnv: environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment: null,
      baseSeed: 1,
      replicateCount: 2,
      ticks: 8,
    });
    expect(readout).toBeNull();
  });
});
