import type { GeneCatalogueEntry } from '../catalogue/types';
import { GENE_CATALOGUE, CYTOBAND_CATALOGUE } from '../catalogue/data/genes';

export type GeneAbnormalityClass =
  | 'sequence-variant'
  | 'copy-number-structural'
  | 'repeat-expansion'
  | 'methylation-epigenetic'
  | 'imprinting-disorder';

export interface GeneReferenceResult {
  type: 'gene' | 'region';
  gene?: GeneCatalogueEntry;
  label: string;
  description: string;
  chromosome: string;
  cytoband?: string;
}

/** Canonical gene lookup — shared across Genome Explorer, Pathway Explorer, Therapeutic Design. */
export function getGeneById(id: string): GeneCatalogueEntry | undefined {
  return GENE_CATALOGUE.find((g) => g.id === id);
}

export function getGeneBySymbol(symbol: string): GeneCatalogueEntry | undefined {
  return GENE_CATALOGUE.find((g) => g.symbol.toLowerCase() === symbol.toLowerCase());
}

export function searchGeneReferences(query: string, limit = 12): GeneReferenceResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: GeneReferenceResult[] = [];
  for (const g of GENE_CATALOGUE) {
    if (
      g.symbol.toLowerCase() === q ||
      g.symbol.toLowerCase().includes(q) ||
      g.fullName.toLowerCase().includes(q) ||
      g.aliases.some((a) => a.includes(q)) ||
      g.keywords.some((k) => k.includes(q))
    ) {
      results.push({
        type: 'gene',
        gene: g,
        label: g.symbol,
        description: g.fullName,
        chromosome: g.chromosome,
        cytoband: g.cytoband,
      });
    }
  }

  if (q.includes('11p15') || q.includes('imprint') || q.includes('icr1')) {
    const region = CYTOBAND_CATALOGUE.find((c) => c.band === '11p15.5');
    if (region && !results.some((r) => r.label.includes('11p15'))) {
      results.unshift({
        type: 'region',
        label: '11p15.5 imprinted region (ICR1)',
        description: 'Educational reference: H19/IGF2 imprinting control region — epigenetic regulation context',
        chromosome: '11',
        cytoband: '11p15.5',
      });
    }
  }

  return results.slice(0, limit);
}

export function describeAbnormalityClass(type: GeneAbnormalityClass): string {
  switch (type) {
    case 'sequence-variant':
      return 'A change in DNA letter sequence at a specific position (SNP/indels) — distinct from chromosome number or methylation state.';
    case 'copy-number-structural':
      return 'Gain or loss of a DNA segment or whole chromosome — not the same as a single-letter SNP change.';
    case 'repeat-expansion':
      return 'Abnormal increase in repeated DNA units (e.g. CAG repeats) — a specific mutational mechanism.';
    case 'methylation-epigenetic':
      return 'Chemical modification affecting gene activity without changing DNA sequence — e.g. loss of methylation at an imprinting control region.';
    case 'imprinting-disorder':
      return 'Disrupted parent-of-origin gene expression (imprinting) — an epigenetic disorder pattern, not a simple broken gene sequence.';
    default:
      return '';
  }
}

export function imprintingNoteForGene(symbol: string): string | null {
  if (symbol === 'H19' || symbol === 'IGF2') {
    return 'These genes at 11p15.5 are imprinted — only one parental copy is normally active. Silver–Russell syndrome can involve loss of methylation at ICR1 (epigenetic), not simply a sequence variant in H19.';
  }
  return null;
}
