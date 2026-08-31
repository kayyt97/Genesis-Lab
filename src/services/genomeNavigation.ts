import type { GenomeNavigationTarget } from '../catalogue/types';
import { GENE_CATALOGUE, CYTOBAND_CATALOGUE } from '../catalogue/data/genes';
import { CHROMOSOMES } from '../data/genes';
import { normalizeChromosome } from './chromosomeUtils';
import { getGeneBySymbol as getCanonicalGene, searchGeneReferences } from './geneReferenceService';
import type { GenomicVariant } from '../types/scientific';

export interface GenomeSearchResult {
  target: GenomeNavigationTarget;
  matchType: 'gene' | 'chromosome' | 'cytoband' | 'variant' | 'region';
  detail: string;
}

export function searchGenomeNavigation(
  query: string,
  variants: GenomicVariant[] = [],
): GenomeSearchResult[] {
  const q = query.trim();
  if (!q) return [];
  const results: GenomeSearchResult[] = [];
  const lower = q.toLowerCase();

  // Gene symbol / name — canonical shared catalogue
  for (const ref of searchGeneReferences(q, 15)) {
    if (ref.type === 'gene' && ref.gene) {
      const g = ref.gene;
      results.push({
        matchType: 'gene',
        detail: `${g.symbol} — ${g.fullName}`,
        target: {
          type: 'gene',
          chromosome: g.chromosome,
          cytoband: g.cytoband,
          geneId: g.id,
          geneSymbol: g.symbol,
          label: g.symbol,
        },
      });
    } else if (ref.type === 'region') {
      results.push({
        matchType: 'region',
        detail: ref.description,
        target: {
          type: 'cytoband',
          chromosome: ref.chromosome,
          cytoband: ref.cytoband,
          label: ref.label,
        },
      });
    }
  }

  // Chromosome queries: chr4, chr 4, chromosome 4, 4
  const chrMatch = q.match(/^(?:chr(?:omosome)?\s*)?(\d{1,2}|[xy]|mt|m)$/i);
  if (chrMatch) {
    const { normalized } = normalizeChromosome(chrMatch[1]);
    if (normalized) {
      const chrMeta = CHROMOSOMES.find((c) => c.id === normalized);
      results.push({
        matchType: 'chromosome',
        detail: chrMeta?.label ?? `Chromosome ${normalized}`,
        target: { type: 'chromosome', chromosome: normalized, label: `Chr ${normalized}` },
      });
    }
  }

  // Cytoband: 11p15.5, 17q21.31
  const bandMatch = q.match(/^(\d{1,2}|[xy])(p|q)(\d+(?:\.\d+)?)$/i);
  if (bandMatch) {
    const chr = bandMatch[1].toUpperCase() === 'X' || bandMatch[1].toUpperCase() === 'Y'
      ? bandMatch[1].toUpperCase()
      : bandMatch[1];
    const band = `${chr}${bandMatch[2]}${bandMatch[3]}`;
    const ref = CYTOBAND_CATALOGUE.find((c) => c.band.toLowerCase() === band.toLowerCase());
    results.push({
      matchType: 'cytoband',
      detail: ref ? `Cytoband ${ref.band}` : `Region ${band}`,
      target: {
        type: 'cytoband',
        chromosome: String(chr),
        cytoband: band,
        label: band,
      },
    });
    // Also find genes in cytoband
    for (const g of GENE_CATALOGUE.filter((gene) => gene.cytoband?.toLowerCase().startsWith(band.toLowerCase().slice(0, 4)))) {
      if (!results.some((r) => r.target.geneId === g.id)) {
        results.push({
          matchType: 'gene',
          detail: `${g.symbol} in ${g.cytoband}`,
          target: { type: 'gene', chromosome: g.chromosome, cytoband: g.cytoband, geneId: g.id, geneSymbol: g.symbol, label: g.symbol },
        });
      }
    }
  }

  // Variant rsID in uploaded data
  if (lower.startsWith('rs') && variants.length) {
    const matched = variants.filter((v) => v.rsId?.toLowerCase() === lower).slice(0, 5);
    for (const v of matched) {
      results.push({
        matchType: 'variant',
        detail: `${v.rsId} on Chr ${v.chromosome}:${v.position}`,
        target: {
          type: 'variant',
          chromosome: v.chromosome,
          variantId: v.id,
          position: v.position,
          label: v.rsId ?? v.id,
        },
      });
    }
  }

  return results;
}

export function getGenesOnChromosome(chromosome: string) {
  const norm = normalizeChromosome(chromosome).normalized ?? chromosome;
  return GENE_CATALOGUE.filter((g) => g.chromosome === norm);
}

export function getGeneBySymbol(symbol: string) {
  return getCanonicalGene(symbol) ?? GENE_CATALOGUE.find((g) => g.symbol.toLowerCase() === symbol.toLowerCase());
}
