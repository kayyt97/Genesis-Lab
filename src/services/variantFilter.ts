import type { GenomicVariant } from '../types/scientific';

export interface VariantFilterResult {
  variants: GenomicVariant[];
  message: string | null;
  highlightId: string | null;
}

/** Filter uploaded variants on the current chromosome by position, rsID, or genotype. */
export function normalizeVariantSearchQuery(query: string): string {
  return query.trim().replace(/,/g, '');
}

export function filterUploadedVariants(variants: GenomicVariant[], query: string): VariantFilterResult {
  const q = normalizeVariantSearchQuery(query);
  if (!q) return { variants, message: null, highlightId: null };

  const lower = q.toLowerCase();

  const rangeMatch = q.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    const filtered = variants.filter((v) => v.position >= start && v.position <= end);
    return {
      variants: filtered,
      message: filtered.length === 0
        ? `No uploaded variants in range ${start.toLocaleString()}–${end.toLocaleString()} on this chromosome.`
        : null,
      highlightId: filtered.length === 1 ? filtered[0].id : null,
    };
  }

  if (/^rs?\d+$/i.test(q)) {
    const rsNorm = lower.startsWith('rs') ? lower : `rs${lower}`;
    const filtered = variants.filter((v) => v.rsId?.toLowerCase() === rsNorm);
    return {
      variants: filtered,
      message: filtered.length === 0 ? `No uploaded variant matching ${rsNorm.toUpperCase()} on this chromosome.` : null,
      highlightId: filtered.length === 1 ? filtered[0].id : null,
    };
  }

  if (/^\d+$/.test(q)) {
    const pos = parseInt(q, 10);
    const filtered = variants.filter((v) => v.position === pos);
    return {
      variants: filtered,
      message: filtered.length === 0
        ? 'No uploaded variant at this position. The genomic coordinate may exist in reference data but is not represented in this uploaded dataset.'
        : null,
      highlightId: filtered.length === 1 ? filtered[0].id : null,
    };
  }

  const filtered = variants.filter((v) => v.genotype.toUpperCase() === q.toUpperCase());
  return {
    variants: filtered,
    message: filtered.length === 0 ? `No uploaded variants with genotype “${q.toUpperCase()}” on this chromosome.` : null,
    highlightId: filtered.length === 1 ? filtered[0].id : null,
  };
}
