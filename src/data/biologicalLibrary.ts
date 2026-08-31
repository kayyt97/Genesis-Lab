/** Backward-compatible re-exports from scalable organism catalogue */
export {
  ORGANISM_CATALOGUE as BIOLOGICAL_LIBRARY,
  ORGANISM_CATEGORIES as LIBRARY_CATEGORIES,
} from '../catalogue/data/organisms';

export type { OrganismCatalogueEntry as BiologicalReferenceEntry } from '../catalogue/types';
export type ReferenceCategory = OrganismCatalogueEntry['category'];

import { organismIndex } from '../catalogue/index';
import type { OrganismCatalogueEntry } from '../catalogue/types';

export function searchBiologicalLibrary(query: string): OrganismCatalogueEntry[] {
  return organismIndex.query({ search: query, pageSize: 500 }).items;
}

export function getReferenceById(id: string): OrganismCatalogueEntry | undefined {
  return organismIndex.getById(id);
}
