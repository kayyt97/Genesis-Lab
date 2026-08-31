import { REFERENCE_GENES, findGeneForVariant } from '../data/genes';
import { CURATED_PATHWAYS } from '../data/pathways';
import type { GeneReference, PathwayModel } from '../types/scientific';

export interface PathwaySearchResult {
  type: 'gene' | 'pathway' | 'protein' | 'process';
  id: string;
  label: string;
  description: string;
  gene?: GeneReference;
  pathway?: PathwayModel;
}

export function searchPathwayExplorer(query: string): PathwaySearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: PathwaySearchResult[] = [];

  for (const gene of REFERENCE_GENES) {
    if (
      gene.symbol.toLowerCase().includes(q) ||
      gene.name.toLowerCase().includes(q) ||
      gene.id.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'gene',
        id: gene.id,
        label: gene.symbol,
        description: gene.name,
        gene,
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

  // Protein/process aliases
  const aliases: Record<string, string> = {
    htt: 'GEN-HTT',
    huntingtin: 'GEN-HTT',
    brca1: 'GEN-BRCA1',
    tp53: 'GEN-TP53',
    p53: 'GEN-TP53',
    cftr: 'GEN-CFTR',
    apoe: 'GEN-APOE',
  };

  if (aliases[q]) {
    const gene = REFERENCE_GENES.find((g) => g.id === aliases[q]);
    if (gene && !results.some((r) => r.id === gene.id)) {
      results.unshift({
        type: 'gene',
        id: gene.id,
        label: gene.symbol,
        description: gene.name,
        gene,
      });
    }
  }

  return results;
}

export function getPathwaysForGene(geneId: string): PathwayModel[] {
  const gene = REFERENCE_GENES.find((g) => g.id === geneId);
  if (!gene) return [];
  return CURATED_PATHWAYS.filter((p) => gene.pathwayIds.includes(p.id));
}

export { findGeneForVariant };
