import { describe, expect, test } from 'bun:test';
import { organismIndex, geneIndex, moleculeIndex } from '../catalogue/index';
import { searchGenomeNavigation, getGeneBySymbol } from '../services/genomeNavigation';
import { normalizeChromosome } from '../services/chromosomeUtils';

describe('catalogue index', () => {
  test('organism catalogue has hundreds of entries', () => {
    expect(organismIndex.size).toBeGreaterThan(200);
  });

  test('gene catalogue has expanded reference set', () => {
    expect(geneIndex.size).toBeGreaterThan(40);
  });

  test('molecule catalogue search by element', () => {
    const page = moleculeIndex.query({ search: 'C', pageSize: 50 });
    expect(page.total).toBeGreaterThan(10);
  });

  test('organism filter by category', () => {
    const bacteria = organismIndex.query({ category: 'bacteria', pageSize: 100 });
    expect(bacteria.total).toBeGreaterThan(20);
    expect(bacteria.items.every((o) => o.category === 'bacteria')).toBe(true);
  });

  test('pagination works', () => {
    const p1 = organismIndex.query({ page: 1, pageSize: 10 });
    const p2 = organismIndex.query({ page: 2, pageSize: 10 });
    expect(p1.items[0]?.id).not.toBe(p2.items[0]?.id);
  });
});

describe('genome navigation', () => {
  test('finds gene by symbol', () => {
    expect(getGeneBySymbol('HTT')?.symbol).toBe('HTT');
    expect(getGeneBySymbol('TP53')?.chromosome).toBe('17');
  });

  test('chromosome search chr4', () => {
    const results = searchGenomeNavigation('chr4');
    expect(results.some((r) => r.matchType === 'chromosome')).toBe(true);
  });

  test('cytoband search 11p15.5', () => {
    const results = searchGenomeNavigation('11p15.5');
    expect(results.some((r) => r.matchType === 'cytoband' || r.matchType === 'gene')).toBe(true);
  });

  test('gene search returns HTT', () => {
    const results = searchGenomeNavigation('HTT');
    expect(results.some((r) => r.target.geneSymbol === 'HTT')).toBe(true);
  });
});

describe('chromosome normalisation', () => {
  test('MT aliases', () => {
    expect(normalizeChromosome('MT').normalized).toBe('MT');
    expect(normalizeChromosome('M').normalized).toBe('MT');
  });
});
