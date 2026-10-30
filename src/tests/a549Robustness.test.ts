import { describe, expect, test } from 'bun:test';
import { defaultEnvironment } from '../data/demoData';
import { runDualLungCancerStudies } from '../services/dualLungCancerStudies';

const BASE_SEED = 20261030;
const BASE_ENVIRONMENT = {
  ...defaultEnvironment,
  temperature: 37,
  ph: 7.4,
  oxygen: 21,
  carbonDioxide: 5,
};

const ENVIRONMENT_SCENARIOS = [
  { name: 'cooler temperature', environment: { ...BASE_ENVIRONMENT, temperature: 36 } },
  { name: 'warmer temperature', environment: { ...BASE_ENVIRONMENT, temperature: 38 } },
  { name: 'lower pH', environment: { ...BASE_ENVIRONMENT, ph: 7.2 } },
  { name: 'higher pH', environment: { ...BASE_ENVIRONMENT, ph: 7.6 } },
  { name: 'lower oxygen', environment: { ...BASE_ENVIRONMENT, oxygen: 18 } },
  { name: 'higher oxygen', environment: { ...BASE_ENVIRONMENT, oxygen: 24 } },
] as const;

describe('A549 dual-study robustness checks', () => {
  test('runs 30 paired replicates per study with reproducible, variable outputs', () => {
    const options = {
      baseSeed: BASE_SEED,
      replicateCount: 30,
      ticks: 16,
      environment: BASE_ENVIRONMENT,
    };
    const first = runDualLungCancerStudies(options);
    const second = runDualLungCancerStudies(options);

    expect(first.killing.replicates).toHaveLength(30);
    expect(first.spread.replicates).toHaveLength(30);
    expect(first.killing.replicates).toEqual(second.killing.replicates);
    expect(first.spread.replicates).toEqual(second.spread.replicates);
    expect(first.killing.summary).toEqual(second.killing.summary);
    expect(first.spread.summary).toEqual(second.spread.summary);

    for (const study of [first.killing, first.spread]) {
      expect(new Set(study.seeds).size).toBe(30);
      for (const replicate of study.replicates) {
        expect(Number.isFinite(replicate.treated.viability)).toBe(true);
        expect(Number.isFinite(replicate.control.viability)).toBe(true);
        expect(Number.isFinite(replicate.delta.viability)).toBe(true);
        expect(replicate.treated.viability).toBeGreaterThanOrEqual(0);
        expect(replicate.treated.viability).toBeLessThanOrEqual(100);
        expect(replicate.control.viability).toBeGreaterThanOrEqual(0);
        expect(replicate.control.viability).toBeLessThanOrEqual(100);
        expect(replicate.delta.movement).not.toBeNull();
        expect(replicate.delta.proliferation).not.toBeNull();
      }
    }

    expect(first.killing.summary.viabilityDifferenceSd).toBeGreaterThan(0);
    expect(first.spread.summary.movementDifferenceSd).toBeGreaterThan(0);
  });

  test.each(ENVIRONMENT_SCENARIOS)(
    'keeps outputs valid and reproducible under $name',
    ({ environment }) => {
      const options = {
        baseSeed: BASE_SEED,
        replicateCount: 30,
        ticks: 16,
        environment,
      };
      const first = runDualLungCancerStudies(options);
      const second = runDualLungCancerStudies(options);

      expect(first.killing.replicates).toEqual(second.killing.replicates);
      expect(first.spread.replicates).toEqual(second.spread.replicates);
      expect(first.killing.summary).toEqual(second.killing.summary);
      expect(first.spread.summary).toEqual(second.spread.summary);

      for (const study of [first.killing, first.spread]) {
        expect(study.replicateCount).toBe(30);
        expect(study.replicates).toHaveLength(30);
        expect(study.seeds).toHaveLength(30);
        expect(new Set(study.seeds).size).toBe(30);
        for (const replicate of study.replicates) {
          for (const value of [
            replicate.treated.viability,
            replicate.control.viability,
            replicate.delta.viability,
            replicate.treated.population,
            replicate.control.population,
          ]) {
            expect(Number.isFinite(value)).toBe(true);
          }
        }
      }
    },
  );
});
