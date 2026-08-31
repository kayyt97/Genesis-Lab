import type { TieredText } from '../types/language';
import type { EvidenceMeta } from '../types/evidence';

/** Shared catalogue entity fields for scalable scientific libraries */
export interface CatalogueEntityBase {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  subcategory?: string;
  description: TieredText;
  summary: TieredText;
  tags: string[];
  keywords: string[];
  evidence: EvidenceMeta;
  relatedIds: string[];
  compatibleModules: GenesisModule[];
}

export type GenesisModule =
  | 'virtual-lab'
  | 'microscope'
  | 'genome-explorer'
  | 'pathway-explorer'
  | 'molecule-explorer'
  | 'molecular-library'
  | 'experiment-builder'
  | 'notebook'
  | 'project'
  | 'therapeutic-design';

export type SortField = 'name' | 'category' | 'id';
export type SortDirection = 'asc' | 'desc';

export interface CatalogueQuery {
  search?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  compatibleModule?: GenesisModule;
  page?: number;
  pageSize?: number;
  sortBy?: SortField;
  sortDir?: SortDirection;
}

export interface CataloguePage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrganismCatalogueEntry extends CatalogueEntityBase {
  scientificName: string;
  taxonomy: string;
  morphology: string;
  cellularOrganisation: string;
  characteristics: string[];
  preferredEnvironment?: Record<string, number>;
  morphologySupported: boolean;
  relatedGenes?: string[];
  relatedPathways?: string[];
  relatedMolecules?: string[];
  pathogenInfo?: 'educational-reference-only';
  safetyClass?: 'non-pathogenic' | 'reference-pathogen' | 'toxin-reference' | 'standard';
}

export interface GeneCatalogueEntry extends CatalogueEntityBase {
  symbol: string;
  fullName: string;
  chromosome: string;
  cytoband?: string;
  start: number;
  end: number;
  function: TieredText;
  pathwayIds: string[];
  proteinId?: string;
  diseaseContext?: string[];
}

export interface MoleculeCatalogueEntry extends CatalogueEntityBase {
  formula: string;
  molecularMass: number;
  charge: number;
  elements: string[];
  functionalGroups: string[];
  biologicalRole: TieredText;
  pathwayIds: string[];
  category: MoleculeCategory;
  safetyNote?: string;
}

export type MoleculeCategory =
  | 'water-solvent'
  | 'gas'
  | 'salt'
  | 'acid-base'
  | 'buffer'
  | 'carbohydrate'
  | 'amino-acid'
  | 'lipid'
  | 'nucleobase'
  | 'nucleotide'
  | 'metabolic'
  | 'neurotransmitter'
  | 'hormone'
  | 'vitamin'
  | 'cofactor'
  | 'lab-compound'
  | 'medicine'
  | 'environmental'
  | 'inorganic'
  | 'organic'
  | 'biochemistry'
  | 'cell-biology'
  | 'genetics'
  | 'pharmacology';

export interface CytobandReference {
  id: string;
  chromosome: string;
  band: string;
  start: number;
  end: number;
  label: string;
}

export interface GenomeNavigationTarget {
  type: 'genome' | 'chromosome' | 'cytoband' | 'gene' | 'variant';
  chromosome?: string;
  cytoband?: string;
  geneId?: string;
  geneSymbol?: string;
  variantId?: string;
  position?: number;
  label: string;
}
