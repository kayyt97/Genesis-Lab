import type { GeneReference } from '../types/scientific';
import { GENE_CATALOGUE, geneToLegacyReference } from '../catalogue/data/genes';
import type { GenomicVariant } from '../types/scientific';

export const CHROMOSOMES = [
  { id: '1', label: 'Chr 1', length: 249000000 },
  { id: '2', label: 'Chr 2', length: 242000000 },
  { id: '3', label: 'Chr 3', length: 198000000 },
  { id: '4', label: 'Chr 4', length: 190000000 },
  { id: '5', label: 'Chr 5', length: 181000000 },
  { id: '6', label: 'Chr 6', length: 170000000 },
  { id: '7', label: 'Chr 7', length: 158000000 },
  { id: '8', label: 'Chr 8', length: 145000000 },
  { id: '9', label: 'Chr 9', length: 138000000 },
  { id: '10', label: 'Chr 10', length: 133000000 },
  { id: '11', label: 'Chr 11', length: 135000000 },
  { id: '12', label: 'Chr 12', length: 133000000 },
  { id: '13', label: 'Chr 13', length: 114000000 },
  { id: '14', label: 'Chr 14', length: 107000000 },
  { id: '15', label: 'Chr 15', length: 101000000 },
  { id: '16', label: 'Chr 16', length: 90000000 },
  { id: '17', label: 'Chr 17', length: 81000000 },
  { id: '18', label: 'Chr 18', length: 78000000 },
  { id: '19', label: 'Chr 19', length: 63000000 },
  { id: '20', label: 'Chr 20', length: 63000000 },
  { id: '21', label: 'Chr 21', length: 48000000 },
  { id: '22', label: 'Chr 22', length: 51000000 },
  { id: 'X', label: 'Chr X', length: 156000000 },
  { id: 'Y', label: 'Chr Y', length: 57000000 },
  { id: 'MT', label: 'Chr MT (mitochondrial)', length: 16569 },
];

/** Legacy export — full catalogue in catalogue/data/genes.ts */
export const REFERENCE_GENES: GeneReference[] = GENE_CATALOGUE.map(geneToLegacyReference);

export function findGeneForVariant(variant: GenomicVariant): GeneReference | undefined {
  return REFERENCE_GENES.find(
    (g) =>
      g.chromosome === variant.chromosome &&
      variant.position >= g.start &&
      variant.position <= g.end,
  );
}

export function findVariantsInGene(geneId: string, variants: GenomicVariant[]): GenomicVariant[] {
  const gene = REFERENCE_GENES.find((g) => g.id === geneId);
  if (!gene) return [];
  return variants.filter(
    (v) => v.chromosome === gene.chromosome && v.position >= gene.start && v.position <= gene.end,
  );
}

export { GENE_CATALOGUE, CYTOBAND_CATALOGUE } from '../catalogue/data/genes';
