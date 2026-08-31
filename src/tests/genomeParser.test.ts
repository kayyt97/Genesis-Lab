import { describe, expect, test } from 'bun:test';
import { parseGenomeFile, validateImportReconciliation } from '../services/genomeParser';
import { normalizeChromosome } from '../services/chromosomeUtils';

/** Synthetic 23andMe-style fixture — NOT real human genomic data */
function buildSynthetic23andMe(rows: string[]): string {
  const header = `# synthetic fixture for parser tests
# This file contains fabricated data only
rsid\tchromosome\tposition\tgenotype
`;
  return header + rows.join('\n');
}

describe('normalizeChromosome', () => {
  test('autosomes 1-22', () => {
    for (let i = 1; i <= 22; i++) {
      expect(normalizeChromosome(String(i)).normalized).toBe(String(i));
      expect(normalizeChromosome(`chr${i}`).normalized).toBe(String(i));
    }
  });

  test('sex and mitochondrial chromosomes', () => {
    expect(normalizeChromosome('X').normalized).toBe('X');
    expect(normalizeChromosome('Y').normalized).toBe('Y');
    expect(normalizeChromosome('MT').normalized).toBe('MT');
    expect(normalizeChromosome('M').normalized).toBe('MT');
  });

  test('legacy numeric codes', () => {
    expect(normalizeChromosome('23').normalized).toBe('X');
    expect(normalizeChromosome('24').normalized).toBe('Y');
  });
});

describe('parse23andMe synthetic fixtures', () => {
  test('assigns variants across all chromosomes', async () => {
    const rows: string[] = [];
    for (let chr = 1; chr <= 22; chr++) {
      for (let j = 0; j < 5; j++) {
        rows.push(`rs${chr}${j}\t${chr}\t${100000 + j}\tAG`);
      }
    }
    rows.push('rsX1\tX\t120000\tCT');
    rows.push('rsY1\tY\t2500000\tG');
    rows.push('rsMT1\tMT\t1000\tA');
    rows.push('rsMT2\tM\t2000\tCC');

    const content = buildSynthetic23andMe(rows);
    const file = new File([content], 'synthetic-test.txt', { type: 'text/plain' });
    const result = await parseGenomeFile(file);

    expect(result.success).toBe(true);
    expect(result.upload!.variantCount).toBe(rows.length);
    expect(result.upload!.variants.length).toBe(rows.length);

    const coverage = result.upload!.importReport!.chromosomeCoverage;
    for (let chr = 1; chr <= 22; chr++) {
      expect(coverage[String(chr)]).toBe(5);
    }
    expect(coverage['X']).toBe(1);
    expect(coverage['Y']).toBe(1);
    expect(coverage['MT']).toBe(2);

    expect(validateImportReconciliation(result.upload!.importReport!)).toBe(true);
  });

  test('does not truncate large files at 50000', async () => {
    const rows: string[] = [];
    // 60000 synthetic rows distributed across chromosomes
    for (let i = 0; i < 60000; i++) {
      const chr = (i % 22) + 1;
      rows.push(`rs${i}\t${chr}\t${1000 + i}\tAA`);
    }
    const content = buildSynthetic23andMe(rows);
    const file = new File([content], 'synthetic-large.txt', { type: 'text/plain' });
    const result = await parseGenomeFile(file);

    expect(result.success).toBe(true);
    expect(result.upload!.variantCount).toBe(60000);
    expect(result.upload!.variants.length).toBe(60000);

    const coverage = result.upload!.importReport!.chromosomeCoverage;
    const chr1Count = coverage['1'] ?? 0;
    const chr2Count = coverage['2'] ?? 0;
    // Should be roughly equal distribution (~2727 each), NOT chr1=49000+ chr2=1000
    expect(chr1Count).toBeGreaterThan(2000);
    expect(chr2Count).toBeGreaterThan(2000);
    expect(Math.abs(chr1Count - chr2Count)).toBeLessThan(100);
  });

  test('tracks malformed and no-call exclusions', async () => {
    const rows = [
      'rs1\t1\t1000\tAG',
      'rs2\t1\t2000\t--',
      'rs3\t\t3000\tAG',
      'rs4\t99\t4000\tAG',
    ];
    const content = buildSynthetic23andMe(rows);
    const file = new File([content], 'synthetic-exclusions.txt', { type: 'text/plain' });
    const result = await parseGenomeFile(file);

    expect(result.success).toBe(true);
    expect(result.upload!.variantCount).toBe(1);
    expect(result.upload!.importReport!.malformedSkipped + result.upload!.importReport!.unsupportedUnmapped).toBeGreaterThan(0);
  });
});
