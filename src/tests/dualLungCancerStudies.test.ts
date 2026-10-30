import { describe, expect, test } from 'bun:test';
import { runDualLungCancerStudies } from '../services/dualLungCancerStudies';

describe('seed-dependent paired A549 educational studies', () => {
  test('independent seeds produce variable paired treatment responses', () => {
    const report = runDualLungCancerStudies({ baseSeed: 123456789, replicateCount: 8, ticks: 16 });

    expect(report.killing.replicates).toHaveLength(8);
    expect(report.spread.replicates).toHaveLength(8);
    expect(report.killing.summary.viabilityDifferenceSd).toBeGreaterThan(0);
    expect(report.spread.summary.movementDifferenceSd).toBeGreaterThan(0);

    for (const study of [report.killing, report.spread]) {
      for (const replicate of study.replicates) {
        expect(replicate.seed).toBeGreaterThan(0);
        expect(Number.isFinite(replicate.delta.viability)).toBe(true);
        expect(Number.isFinite(replicate.delta.movement)).toBe(true);
      }
    }

    expect(report.killing.summary.viabilityDifferenceMean).toBeLessThan(0);
    expect(report.spread.summary.movementDifferenceMean).toBeLessThan(0);
  });

  test('the same base seed reproduces identical replicate outputs', () => {
    const options = { baseSeed: 987654321, replicateCount: 7, ticks: 16 };
    const first = runDualLungCancerStudies(options);
    const second = runDualLungCancerStudies(options);

    expect(first.killing.replicates).toEqual(second.killing.replicates);
    expect(first.spread.replicates).toEqual(second.spread.replicates);
    expect(first.killing.summary).toEqual(second.killing.summary);
    expect(first.spread.summary).toEqual(second.spread.summary);
  });
});
