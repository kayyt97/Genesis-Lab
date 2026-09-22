/** Tumour & cancer catalogue barrel */
export {
  TUMOUR_TAXONOMY_ENTRIES,
  TUMOUR_TAXONOMY_META,
  TUMOUR_BODY_SYSTEMS,
  TUMOUR_FAMILIES,
  TUMOUR_BEHAVIOURS,
  isTumourEntry,
  getTumourFields,
  tumourEducationDisclaimer,
} from './tumours';
export type {
  TumourCatalogueEntry,
  TumourCatalogueFields,
  TumourBehaviour,
  TumourTissueForm,
  TumourAgeGroup,
  TumourEntryKind,
} from './tumours';
export {
  TUMOUR_CELL_LINE_ENTRIES,
  SIMULATION_READY_TUMOUR_CELL_LINE_IDS,
} from './tumourCellLines';

import { TUMOUR_TAXONOMY_ENTRIES } from './tumours';
import { TUMOUR_CELL_LINE_ENTRIES } from './tumourCellLines';
import type { TumourCatalogueEntry } from './tumours';

/** Cell lines first so curated ORG-HELA wins over any duplicate taxonomy id */
export const ALL_TUMOUR_CATALOGUE_ENTRIES: TumourCatalogueEntry[] = [
  ...TUMOUR_CELL_LINE_ENTRIES,
  ...TUMOUR_TAXONOMY_ENTRIES,
];
