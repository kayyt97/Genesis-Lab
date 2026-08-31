import type { GeneCatalogueEntry } from '../catalogue/types';
import type { GeneReference, PathwayModel } from '../types/scientific';
import { CURATED_PATHWAYS } from '../data/pathways';
import { GENE_CATALOGUE } from '../catalogue/data/genes';
import { searchGeneReferences } from './geneReferenceService';

export interface PathwaySearchResult {
  type: 'gene' | 'pathway' | 'protein' | 'process' | 'molecule';
  id: string;
  label: string;
  description: string;
  gene?: GeneCatalogueEntry;
  pathway?: PathwayModel;
}

export function searchPathwayExplorer(query: string): PathwaySearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: PathwaySearchResult[] = [];

  for (const ref of searchGeneReferences(query, 20)) {
    if (ref.type === 'gene' && ref.gene) {
      results.push({
        type: 'gene',
        id: ref.gene.id,
        label: ref.gene.symbol,
        description: ref.gene.fullName,
        gene: ref.gene,
      });
    } else if (ref.type === 'region') {
      results.push({
        type: 'process',
        id: `region-${ref.cytoband ?? ref.label}`,
        label: ref.label,
        description: ref.description,
      });
    }
  }

  for (const pathway of CURATED_PATHWAYS) {
    if (
      pathway.name.toLowerCase().includes(q) ||
      pathway.id.toLowerCase().includes(q) ||
      pathway.nodes.some((n) => n.label.toLowerCase().includes(q))
    ) {
      results.push({
        type: 'pathway',
        id: pathway.id,
        label: pathway.name,
        description: pathway.description.standard,
        pathway,
      });
    }
  }

  const aliases: Record<string, string> = {
    htt: 'GEN-HTT', huntingtin: 'GEN-HTT', brca1: 'GEN-BRCA1', brca2: 'GEN-BRCA2',
    tp53: 'GEN-TP53', p53: 'GEN-TP53', cftr: 'GEN-CFTR', apoe: 'GEN-APOE',
    egfr: 'GEN-EGFR', kras: 'GEN-KRAS', app: 'GEN-APP', hbb: 'GEN-HBB',
  };

  if (aliases[q]) {
    const gene = GENE_CATALOGUE.find((g) => g.id === aliases[q]);
    if (gene && !results.some((r) => r.id === gene.id)) {
      results.unshift({ type: 'gene', id: gene.id, label: gene.symbol, description: gene.fullName, gene });
    }
  }

  return results;
}

export function getPathwaysForGene(geneId: string): PathwayModel[] {
  const gene = GENE_CATALOGUE.find((g) => g.id === geneId);
  if (!gene) return [];
  return CURATED_PATHWAYS.filter((p) => gene.pathwayIds.includes(p.id));
}

export function findGeneForVariant(variant: { chromosome: string; position: number }): GeneReference | undefined {
  const g = GENE_CATALOGUE.find(
    (gene) => gene.chromosome === variant.chromosome && variant.position >= gene.start && variant.position <= gene.end,
  );
  if (!g) return undefined;
  return {
    id: g.id, symbol: g.symbol, name: g.fullName, chromosome: g.chromosome,
    start: g.start, end: g.end, description: g.description, function: g.function, pathwayIds: g.pathwayIds,
  };
}
