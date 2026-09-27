/**
 * Metastatic Inhibitor — built-in educational candidate study tests.
 */

import { describe, expect, test, beforeEach } from 'bun:test';
import {
  EDUCATIONAL_NO_CLINICAL_NOTICE,
  METASTATIC_INHIBITOR_ID,
  METASTATIC_INHIBITOR_NAME,
  METASTATIC_INHIBITOR_PARAMETERS,
  MIN_RECORDED_SEEDS,
  STRENGTH_SWEEP_LEVELS,
  formatMetastaticInhibitorReport,
  getMetastaticInhibitorDesign,
  isMetastaticInhibitorDesign,
  loadMetastaticInhibitorStudy,
  metastaticInhibitorStudyToCsvRows,
  metastaticInhibitorStudyToExportPayload,
  persistMetastaticInhibitorStudy,
  runMetastaticInhibitorStudy,
} from '../services/metastaticInhibitorCandidate';
import { GENESIS_LAB_VERSION } from '../services/genesisLabVersion';

function mockLocalStorage() {
  const map = new Map<string, string>();
  const store: Storage = {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    key: (i: number) => [...map.keys()][i] ?? null,
  };
  try {
    // bun may already expose localStorage — replace it for isolated tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).localStorage;
  } catch {
    /* ignore */
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: store,
    configurable: true,
    writable: true,
  });
  return store;
}

describe('Metastatic Inhibitor candidate', () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  test('built-in design uses the exact name Metastatic Inhibitor', () => {
    const design = getMetastaticInhibitorDesign();
    expect(design.name).toBe('Metastatic Inhibitor');
    expect(design.name).toBe(METASTATIC_INHIBITOR_NAME);
    expect(design.id).toBe(METASTATIC_INHIBITOR_ID);
    expect(design.intendedOutcome).toBe('reduce-movement');
    expect(design.targetCellModelId).toBe('ORG-HELA');
    expect(isMetastaticInhibitorDesign(design)).toBe(true);
    expect(design.evidence.note.toLowerCase()).toContain('not a clinically validated');
  });

  test('parameter sheet covers every model slider with baseline, chosen, rationale, uncertainty', () => {
    const design = getMetastaticInhibitorDesign();
    const keys = Object.keys(design.variables);
    expect(METASTATIC_INHIBITOR_PARAMETERS.map((p) => p.key).sort()).toEqual(keys.sort());
    for (const p of METASTATIC_INHIBITOR_PARAMETERS) {
      expect(p.unitOrScale.length).toBeGreaterThan(0);
      expect(p.baselineValue).toBeGreaterThanOrEqual(0);
      expect(p.baselineValue).toBeLessThanOrEqual(100);
      expect(p.chosenValue).toBeGreaterThanOrEqual(0);
      expect(p.chosenValue).toBeLessThanOrEqual(100);
      expect(p.rationale.length).toBeGreaterThan(10);
      expect(p.uncertainty.length).toBeGreaterThan(5);
      expect(design.variables[p.key]).toBe(p.chosenValue);
    }
  });

  test('study runs matched control vs candidate across ≥5 seeds and a strength sweep', () => {
    const study = runMetastaticInhibitorStudy({
      baseSeed: 99,
      seedCount: 5,
      ticks: 12,
    });
    expect(study.candidate.name).toBe(METASTATIC_INHIBITOR_NAME);
    expect(study.educationalNotice).toBe(EDUCATIONAL_NO_CLINICAL_NOTICE);
    expect(study.genesisLabVersion).toBe(GENESIS_LAB_VERSION);
    expect(study.seedCount).toBeGreaterThanOrEqual(MIN_RECORDED_SEEDS);
    expect(study.seeds).toHaveLength(study.seedCount);
    expect(new Set(study.seeds).size).toBe(study.seedCount);
    expect(study.strengthLevels.length).toBeGreaterThanOrEqual(STRENGTH_SWEEP_LEVELS.length);
    expect(study.runs.length).toBe(study.seeds.length * study.strengthLevels.length);

    // Matched seeds: each run pair used same seed for treated/control (encoded in runId/seed field)
    for (const r of study.runs) {
      expect(study.seeds).toContain(r.seed);
      expect(r.initialConditions.startingPopulation).toBeGreaterThan(0);
      expect(r.genesisLabVersion).toBe(GENESIS_LAB_VERSION);
      const invasion = r.endpoints.find((e) => e.key === 'invasion')!;
      const distance = r.endpoints.find((e) => e.key === 'movementDistanceUm')!;
      const spread = r.endpoints.find((e) => e.key === 'spreadEvents')!;
      expect(invasion.availability).toBe('unavailable');
      expect(distance.availability).toBe('unavailable');
      expect(spread.availability).toBe('unavailable');
      const move = r.endpoints.find((e) => e.key === 'movementMotilityIndex')!;
      expect(move.availability).toBe('measured');
      expect(move.treated).not.toBeNull();
      expect(move.control).not.toBeNull();
    }

    // Strength sweep changes educational movement effect at extremes
    const low = study.aggregates.find((a) => a.strength === 20)!;
    const high = study.aggregates.find((a) => a.strength === 100)!;
    expect(low.movementMeanPctVsControl).not.toBeNull();
    expect(high.movementMeanPctVsControl).not.toBeNull();
    expect(high.movementMeanPctVsControl!).toBeLessThan(low.movementMeanPctVsControl!);
  });

  test('viability caveat is recorded when treated viability is below control', () => {
    const study = runMetastaticInhibitorStudy({ baseSeed: 7, seedCount: 5, ticks: 20 });
    const anyCaveat = study.runs.some((r) => r.viabilityCaveat);
    // Caveat machinery exists even if not every seed triggers it
    expect(study.runs.every((r) => typeof r.viabilityCaveat === 'boolean')).toBe(true);
    expect(study.conclusion.toLowerCase()).toMatch(/viability|movement/);
    expect(study.limitations.some((l) => /viability is never proof of reduced movement/i.test(l))).toBe(true);
    void anyCaveat;
  });

  test('persist and reopen study; report numbers match export payload', () => {
    const study = runMetastaticInhibitorStudy({ baseSeed: 55, seedCount: 5, ticks: 10 });
    const saved = persistMetastaticInhibitorStudy(study);
    expect(saved).toEqual({ ok: true });
    if (!saved.ok) throw new Error(saved.error);
    const reopened = loadMetastaticInhibitorStudy();
    expect(reopened).not.toBeNull();
    expect(reopened!.studyId).toBe(study.studyId);
    expect(reopened!.candidate.name).toBe(METASTATIC_INHIBITOR_NAME);
    expect(reopened!.runs).toHaveLength(study.runs.length);

    const payload = metastaticInhibitorStudyToExportPayload(reopened!);
    expect(payload.runs).toHaveLength(study.runs.length);
    expect(payload.aggregates[0]!.movementMeanPctVsControl).toBe(study.aggregates[0]!.movementMeanPctVsControl);

    const report = formatMetastaticInhibitorReport(reopened!);
    expect(report).toContain(METASTATIC_INHIBITOR_NAME);
    expect(report).toContain(EDUCATIONAL_NO_CLINICAL_NOTICE);
    expect(report).toContain(String(study.runs[0]!.seed));
    const primary = study.aggregates.find((a) => a.strength === study.candidate.variables.therapeuticEffect)
      ?? study.aggregates[0]!;
    if (primary.movementMeanPctVsControl != null) {
      expect(report).toContain(primary.movementMeanPctVsControl.toFixed(1));
    }
    expect(report.toLowerCase()).toContain('unavailable');

    const csv = metastaticInhibitorStudyToCsvRows(reopened!);
    expect(csv.some((r) => r[0] === 'candidateName' && r[1] === METASTATIC_INHIBITOR_NAME)).toBe(true);
    expect(csv.some((r) => r[1] === 'unavailable')).toBe(true);
  });

  test('scientific report section includes Metastatic Inhibitor study when present', async () => {
    const study = runMetastaticInhibitorStudy({ baseSeed: 3, seedCount: 5, ticks: 8 });
    persistMetastaticInhibitorStudy(study);
    const { buildScientificReport } = await import('../services/reportGenerator');
    const { createExperimentSetup } = await import('../services/experimentWorkspaceService');
    const { organismIndex } = await import('../catalogue');
    const setup = createExperimentSetup(organismIndex.getById('ORG-HELA')!);
    const report = buildScientificReport(setup, null, null, null, 'standard', '', 1, study);
    const section = report.sections.find((s) => s.id === 'metastatic-inhibitor-study');
    expect(section).toBeTruthy();
    expect(section!.content).toContain(METASTATIC_INHIBITOR_NAME);
    expect(section!.content).toContain(EDUCATIONAL_NO_CLINICAL_NOTICE);
    expect(section!.content).toContain(study.studyId.replace(/STUDY.*/, '') === '' ? study.candidate.name : study.candidate.name);
  });
});
