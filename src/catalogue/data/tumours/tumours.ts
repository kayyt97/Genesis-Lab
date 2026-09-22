import type { OrganismCatalogueEntry } from '../../types';
import type { TieredText } from '../../../types/language';
import neoplasmBundle from './neoplasm-core.generated.json';

export type TumourBehaviour =
  | 'benign'
  | 'malignant'
  | 'in-situ-or-precancerous'
  | 'borderline-uncertain'
  | 'undetermined';

export type TumourTissueForm = 'solid' | 'blood-lymphoid';
export type TumourAgeGroup = 'any' | 'adult' | 'paediatric';
export type TumourEntryKind = 'neoplasm-taxonomy' | 'tumour-cell-line' | 'educational-specimen';

/** Extended tumour metadata layered onto organism catalogue entries */
export interface TumourCatalogueFields {
  entryKind: TumourEntryKind;
  behaviour: TumourBehaviour;
  behaviourLabel: string;
  neoplasticStatus: string;
  bodySystem?: string;
  tumourFamily?: string;
  morphPath?: string[];
  sitePath?: string[];
  ageGroup: TumourAgeGroup;
  tissueForm: TumourTissueForm;
  ncitCode?: string;
  icdoMorphologyCodes?: string[];
  sourceDefinitionExcerpt?: string | null;
  sourceLinks?: {
    ncitConcept?: string;
    nciCancerSearch?: string;
    icdo4Reference?: string;
    cellLineProvenance?: string;
  };
  sourceVersion?: string;
  reviewDate?: string;
  /** Explicit simulation gate — never infer from E. coli bacterial growth */
  simulationReady: boolean;
  simulationModelNote?: string;
  /** True when microscope view is a generated educational diagram */
  generatedDiagram: boolean;
  relatedTumourIds?: string[];
  relatedCellLineIds?: string[];
}

export type TumourCatalogueEntry = OrganismCatalogueEntry & TumourCatalogueFields;

interface GeneratedNeoplasmEntry {
  ncitCode: string;
  preferredTerm: string;
  synonyms: string[];
  spellingVariants: string[];
  neoplasticStatus: string;
  behaviour: TumourBehaviour;
  behaviourLabel: string;
  bodySystem: string | null;
  tumourFamily: string | null;
  morphPath: string[];
  sitePath: string[];
  parentConceptCode: string | null;
  ageGroup: TumourAgeGroup;
  tissueForm: TumourTissueForm;
  icdoMorphologyCodes: string[];
  sourceDefinitionExcerpt: string | null;
  overview: TieredText;
  sourceLinks: {
    ncitConcept: string;
    nciCancerSearch: string;
    icdo4Reference: string;
  };
  simulationReady: boolean;
  microscopeSupported: boolean;
  entryKind: 'neoplasm-taxonomy';
}

interface GeneratedBundle {
  meta: {
    primarySource: string;
    reviewDate: string;
    entryCount: number;
    publisher: string;
  };
  entries: GeneratedNeoplasmEntry[];
}

const bundle = neoplasmBundle as GeneratedBundle;

function tier(simple: string, standard?: string, technical?: string): TieredText {
  return { simple, standard: standard ?? simple, technical: technical ?? standard ?? simple };
}

function tumourId(ncitCode: string): string {
  return `ORG-TUM-${ncitCode}`;
}

function mapGenerated(e: GeneratedNeoplasmEntry): TumourCatalogueEntry {
  const aliases = [...new Set([...e.synonyms, ...e.spellingVariants])];
  const keywords = [
    'tumour',
    'tumor',
    'cancer',
    'neoplasm',
    e.behaviour,
    e.tissueForm,
    e.ageGroup,
    ...(e.bodySystem ? [e.bodySystem.toLowerCase()] : []),
    ...(e.tumourFamily ? [e.tumourFamily.toLowerCase()] : []),
    ...e.icdoMorphologyCodes,
    e.ncitCode.toLowerCase(),
    ...aliases.map((a) => a.toLowerCase()),
  ];

  const taxonomyParts = [
    e.bodySystem,
    e.tumourFamily,
    e.preferredTerm,
  ].filter(Boolean);

  return {
    id: tumourId(e.ncitCode),
    name: e.preferredTerm,
    scientificName: e.preferredTerm,
    aliases,
    category: 'tumours-cancer',
    subcategory: e.tissueForm === 'blood-lymphoid' ? 'blood-lymphoid' : 'solid-tumour',
    description: e.overview,
    summary: e.overview,
    tags: [
      'tumour',
      'tumor',
      'neoplasm',
      e.behaviour,
      e.tissueForm,
      e.simulationReady ? 'simulation-ready' : 'reference-only',
      e.ageGroup === 'paediatric' ? 'paediatric' : 'age-any',
    ],
    keywords,
    evidence: {
      level: 'reference-data',
      note: 'NCI Thesaurus Neoplasm Core classification entry — educational reference.',
    },
    relatedIds: e.parentConceptCode ? [tumourId(e.parentConceptCode)] : [],
    compatibleModules: e.microscopeSupported
      ? ['microscope', 'notebook', 'project']
      : ['notebook', 'project'],
    taxonomy: taxonomyParts.join(' → '),
    morphology:
      e.tissueForm === 'blood-lymphoid'
        ? 'Blood / lymphoid neoplasm (typically non-solid mass-forming)'
        : 'Solid neoplasm classification (site and histology per source hierarchy)',
    cellularOrganisation: e.tissueForm === 'blood-lymphoid' ? 'Haematopoietic / lymphoid' : 'Tissue neoplasm',
    characteristics: [
      e.behaviourLabel,
      e.neoplasticStatus,
      ...(e.bodySystem ? [e.bodySystem] : []),
      ...(e.icdoMorphologyCodes.length ? [`ICD-O morph: ${e.icdoMorphologyCodes.slice(0, 3).join(', ')}`] : []),
    ],
    morphologySupported: e.microscopeSupported,
    pathogenInfo: undefined,
    safetyClass: 'standard',
    entryKind: 'neoplasm-taxonomy',
    behaviour: e.behaviour,
    behaviourLabel: e.behaviourLabel,
    neoplasticStatus: e.neoplasticStatus,
    bodySystem: e.bodySystem ?? undefined,
    tumourFamily: e.tumourFamily ?? undefined,
    morphPath: e.morphPath,
    sitePath: e.sitePath,
    ageGroup: e.ageGroup,
    tissueForm: e.tissueForm,
    ncitCode: e.ncitCode,
    icdoMorphologyCodes: e.icdoMorphologyCodes,
    sourceDefinitionExcerpt: e.sourceDefinitionExcerpt,
    sourceLinks: e.sourceLinks,
    sourceVersion: `${bundle.meta.primarySource} (${bundle.meta.reviewDate})`,
    reviewDate: bundle.meta.reviewDate,
    simulationReady: false,
    simulationModelNote:
      'Simulation not available for neoplasm taxonomy entries. Use a documented tumour cell line when a culture model exists.',
    generatedDiagram: true,
  };
}

export const TUMOUR_TAXONOMY_META = {
  primarySource: bundle.meta.primarySource,
  publisher: bundle.meta.publisher,
  reviewDate: bundle.meta.reviewDate,
  entryCount: bundle.meta.entryCount,
  sourceVersionLabel: `${bundle.meta.primarySource} — reviewed ${bundle.meta.reviewDate}`,
};

export const TUMOUR_TAXONOMY_ENTRIES: TumourCatalogueEntry[] = bundle.entries.map(mapGenerated);

export const TUMOUR_BODY_SYSTEMS = [
  ...new Set(TUMOUR_TAXONOMY_ENTRIES.map((e) => e.bodySystem).filter(Boolean) as string[]),
].sort();

export const TUMOUR_FAMILIES = [
  ...new Set(TUMOUR_TAXONOMY_ENTRIES.map((e) => e.tumourFamily).filter(Boolean) as string[]),
].sort();

export const TUMOUR_BEHAVIOURS: { value: TumourBehaviour | 'all'; label: string }[] = [
  { value: 'all', label: 'All behaviours' },
  { value: 'benign', label: 'Benign' },
  { value: 'malignant', label: 'Malignant' },
  { value: 'in-situ-or-precancerous', label: 'In situ / precancerous' },
  { value: 'borderline-uncertain', label: 'Borderline / uncertain' },
  { value: 'undetermined', label: 'Undetermined' },
];

export function isTumourEntry(entry: OrganismCatalogueEntry): entry is TumourCatalogueEntry {
  return entry.category === 'tumours-cancer' || (entry as TumourCatalogueEntry).entryKind !== undefined;
}

export function getTumourFields(entry: OrganismCatalogueEntry): TumourCatalogueFields | undefined {
  if (!isTumourEntry(entry)) return undefined;
  return entry;
}

/** Build a short educational fact / simulation distinction block */
export function tumourEducationDisclaimer(entry: TumourCatalogueEntry): TieredText {
  if (entry.simulationReady) {
    return tier(
      'This entry has a limited educational culture simulation — not a disease model.',
      'Simulation models culture conditions for a documented cell line. It does not simulate tumour progression, metastasis, or treatment response.',
      'Defensible model scope: mammalian cell-culture viability under temperature/pH/nutrient stress. Not oncology therapeutics modelling.',
    );
  }
  return tier(
    'Reference only — Genesis Lab has no simulation for this tumour type.',
    'This catalogue entry is searchable educational reference from authoritative terminology. Simulation is not available; the E. coli growth model is never applied to tumour entries.',
    'simulationReady=false. Taxonomy entities remain outside Virtual Lab organism options.',
  );
}
