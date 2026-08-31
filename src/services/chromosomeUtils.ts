/** Normalise chromosome identifiers from consumer genotype formats */

const MITO_IDS = new Set(['MT', 'M', 'MITO', 'MITOCHONDRIAL', 'CHRMT', 'CHRM']);

/** Map legacy/alternate numeric codes sometimes seen in older exports */
const LEGACY_NUMERIC: Record<string, string> = {
  '23': 'X',
  '24': 'Y',
  '25': 'MT',
  '26': 'MT',
};

export interface ChromosomeNormalizeResult {
  normalized: string | null;
  reason?: 'unsupported' | 'malformed';
}

export function normalizeChromosome(raw: string): ChromosomeNormalizeResult {
  if (!raw || typeof raw !== 'string') {
    return { normalized: null, reason: 'malformed' };
  }

  let c = raw.trim();
  if (!c) return { normalized: null, reason: 'malformed' };

  // Strip quotes sometimes present in exports
  c = c.replace(/^["']|["']$/g, '');

  // Remove chr prefix
  c = c.replace(/^chr/i, '');

  const upper = c.toUpperCase();

  if (MITO_IDS.has(upper)) {
    return { normalized: 'MT' };
  }

  if (upper === 'X' || upper === 'Y') {
    return { normalized: upper };
  }

  if (LEGACY_NUMERIC[c]) {
    return { normalized: LEGACY_NUMERIC[c] };
  }

  // Autosomes 1-22
  const num = parseInt(c, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 22) {
    return { normalized: String(num) };
  }

  // XY pseudo-autosome regions sometimes labelled oddly — skip
  if (upper === 'XY' || upper === 'PAR') {
    return { normalized: null, reason: 'unsupported' };
  }

  return { normalized: null, reason: 'unsupported' };
}

export function buildChromosomeCounts(variants: { chromosome: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of variants) {
    counts[v.chromosome] = (counts[v.chromosome] ?? 0) + 1;
  }
  return counts;
}

export function getChromosomeVariants<T extends { chromosome: string }>(
  variants: T[],
  chromosome: string,
): T[] {
  const target = chromosome.replace(/^chr/i, '').toUpperCase();
  return variants.filter((v) => {
    const c = v.chromosome.toUpperCase();
    return c === target || (target === 'MT' && c === 'MT');
  });
}
