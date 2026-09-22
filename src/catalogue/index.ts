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
export {
  TUMOUR_TAXONOMY_ENTRIES,
  TUMOUR_TAXONOMY_META,
  TUMOUR_BODY_SYSTEMS,
  TUMOUR_FAMILIES,
  TUMOUR_BEHAVIOURS,
  TUMOUR_CELL_LINE_ENTRIES,
  SIMULATION_READY_TUMOUR_CELL_LINE_IDS,
  ALL_TUMOUR_CATALOGUE_ENTRIES,
  isTumourEntry,
  getTumourFields,
  tumourEducationDisclaimer,
} from './data/tumours/index';
export { dedupeCatalogueById, normalizeSearch } from './CatalogueIndex';
export type * from './types';
export type {
  TumourCatalogueEntry,
  TumourCatalogueFields,
  TumourBehaviour,
  TumourTissueForm,
  TumourAgeGroup,
  TumourEntryKind,
} from './data/tumours/index';
