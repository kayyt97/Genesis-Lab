import { CatalogueIndex } from './CatalogueIndex';
import { ORGANISM_CATALOGUE } from './data/organisms';
import { GENE_CATALOGUE } from './data/genes';
import { MOLECULE_CATALOGUE } from './data/molecules';

export const organismIndex = new CatalogueIndex(ORGANISM_CATALOGUE);
export const geneIndex = new CatalogueIndex(GENE_CATALOGUE);
export const moleculeIndex = new CatalogueIndex(MOLECULE_CATALOGUE);

export { ORGANISM_CATALOGUE, ORGANISM_CATEGORIES } from './data/organisms';
export { GENE_CATALOGUE, CYTOBAND_CATALOGUE, geneToLegacyReference } from './data/genes';
export { MOLECULE_CATALOGUE, MOLECULE_LIBRARY_CATEGORIES, moleculesContainingElement } from './data/molecules';
export { dedupeCatalogueById } from './CatalogueIndex';
export type * from './types';
