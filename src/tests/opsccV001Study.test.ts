import { describe, expect, test } from 'bun:test';
import { runOpsccV001Study, formatOpsccV001Report, OPSCC_MODEL_ID } from '../services/opsccV001Study';

describe('OPSCC V001 educational study',()=>{
  test('runs both HPV comparator scenarios with matched arms and report output',()=>{
    const report=runOpsccV001Study({baseSeed:123456,replicateCount:100});
    expect(report.modelId).toBe(OPSCC_MODEL_ID);
    expect(report.results).toHaveLength(2);
    for(const scenario of report.results){
      expect(scenario.arms.baseline).toHaveLength(100);
      expect(scenario.arms.sham).toHaveLength(100);
      expect(scenario.arms.v001).toHaveLength(100);
      expect(scenario.arms.v001[0].seed).toBe(scenario.arms.baseline[0].seed);
      expect(Number.isFinite(scenario.differences.tumourBurdenV001VsBaseline)).toBe(true);
    }
    expect(formatOpsccV001Report(report)).toContain('EVIDENCE BOUNDARIES');
    expect(report.evidenceBoundary.join(' ')).toContain('cannot predict');
  });
  test('same seed reproduces the same simulated outcomes',()=>{
    const a=runOpsccV001Study({baseSeed:98765,replicateCount:10});
    const b=runOpsccV001Study({baseSeed:98765,replicateCount:10});
    expect(a.results).toEqual(b.results);
  });
});
