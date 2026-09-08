import { organismIndex } from '../catalogue/index';

/**
 * Legacy Experiment Builder / demo seed organism IDs → catalogue organism IDs.
 * Kept for backwards compatibility with saved experiments and demo seeds.
 * Do not rename catalogue IDs to match these legacy values.
 */
export const DEMO_ORGANISM_TO_CATALOGUE: Readonly<Record<string, string>> = {
  'ORG-001': 'ORG-ECOLI',
  'ORG-002': 'ORG-VIR-RNA-VIRUS-CORONAVIRUS-REFERENCE',
  'ORG-003': 'ORG-YEAST',
  'ORG-004': 'ORG-HELA',
  'ORG-005': 'ORG-PRO-GFP',
  'ORG-006': 'ORG-PRI-MISFOLDED-PRION-CONCEPT-',
};

/** Demo sample seeds → default catalogue organism for Builder auto-fill / review. */
export const DEMO_SAMPLE_TO_CATALOGUE_ORGANISM: Readonly<Record<string, string>> = {
  'SMP-001': 'ORG-ECOLI',
  'SMP-002': 'ORG-HELA',
  'SMP-003': 'ORG-ECOLI',
  'SMP-004': 'ORG-PRO-GFP',
};

/** Curated catalogue IDs offered in Experiment Builder / Organisms simulation list. */
export const BUILDER_ORGANISM_CATALOGUE_IDS: readonly string[] = [
  ...new Set(Object.values(DEMO_ORGANISM_TO_CATALOGUE)),
];

export function isLegacyDemoOrganismId(id: string | undefined | null): boolean {
  return Boolean(id && id in DEMO_ORGANISM_TO_CATALOGUE);
}

/** Resolve a stored organism id to the catalogue id Virtual Lab expects. */
export function resolveCatalogueOrganismId(id: string | undefined | null): string | undefined {
  if (!id) return undefined;
  return DEMO_ORGANISM_TO_CATALOGUE[id] ?? id;
}

export function resolveCatalogueOrganismFromSample(
  sampleId: string | undefined | null,
): string | undefined {
  if (!sampleId) return undefined;
  return DEMO_SAMPLE_TO_CATALOGUE_ORGANISM[sampleId];
}

export function getCatalogueOrganismLabel(id: string | undefined | null): string | undefined {
  const catalogueId = resolveCatalogueOrganismId(id);
  if (!catalogueId) return undefined;
  return organismIndex.getById(catalogueId)?.name;
}

export function getBuilderOrganismOptions() {
  return BUILDER_ORGANISM_CATALOGUE_IDS.map((id) => organismIndex.getById(id)).filter(
    (e): e is NonNullable<typeof e> => Boolean(e),
  );
}
