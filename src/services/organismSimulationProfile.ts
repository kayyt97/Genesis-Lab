import type { OrganismCatalogueEntry } from '../catalogue/types';
import type { OrganismSimulationState } from '../types';
import { organismIndex } from '../catalogue/index';

export interface OrganismSimulationProfile {
  category: string;
  optimalTemp: number;
  optimalPh: number;
  basePopulation: number;
  baseViability: number;
  replicationRate: number;
  environmentalTolerance: number;
  morphologyType: string;
}

const CATEGORY_PROFILES: Record<string, OrganismSimulationProfile> = {
  bacteria: { category: 'bacteria', optimalTemp: 37, optimalPh: 7, basePopulation: 1_000_000, baseViability: 95, replicationRate: 0.55, environmentalTolerance: 80, morphologyType: 'bacterium' },
  archaea: { category: 'archaea', optimalTemp: 45, optimalPh: 7, basePopulation: 500_000, baseViability: 85, replicationRate: 0.4, environmentalTolerance: 70, morphologyType: 'archaea' },
  fungi: { category: 'fungi', optimalTemp: 30, optimalPh: 5.5, basePopulation: 800_000, baseViability: 92, replicationRate: 0.35, environmentalTolerance: 75, morphologyType: 'yeast' },
  viruses: { category: 'viruses', optimalTemp: 37, optimalPh: 7, basePopulation: 100_000, baseViability: 70, replicationRate: 0.3, environmentalTolerance: 40, morphologyType: 'virus' },
  parasites: { category: 'parasites', optimalTemp: 37, optimalPh: 7.2, basePopulation: 200_000, baseViability: 75, replicationRate: 0.2, environmentalTolerance: 55, morphologyType: 'parasite' },
  'mammalian-cells': { category: 'mammalian-cells', optimalTemp: 37, optimalPh: 7.4, basePopulation: 500_000, baseViability: 90, replicationRate: 0.15, environmentalTolerance: 60, morphologyType: 'adherent-cell' },
  'plant-cells': { category: 'plant-cells', optimalTemp: 25, optimalPh: 6.5, basePopulation: 600_000, baseViability: 88, replicationRate: 0.12, environmentalTolerance: 65, morphologyType: 'plant-cell' },
  tissues: { category: 'tissues', optimalTemp: 37, optimalPh: 7.4, basePopulation: 300_000, baseViability: 85, replicationRate: 0.08, environmentalTolerance: 55, morphologyType: 'tissue' },
  proteins: { category: 'proteins', optimalTemp: 25, optimalPh: 7, basePopulation: 1, baseViability: 100, replicationRate: 0, environmentalTolerance: 70, morphologyType: 'protein' },
  prions: { category: 'prions', optimalTemp: 37, optimalPh: 7, basePopulation: 1000, baseViability: 30, replicationRate: 0.05, environmentalTolerance: 95, morphologyType: 'prion' },
  /** Culture model for tumour-derived cell lines only — never for neoplasm taxonomy */
  'tumours-cancer': { category: 'tumours-cancer', optimalTemp: 37, optimalPh: 7.4, basePopulation: 500_000, baseViability: 90, replicationRate: 0.15, environmentalTolerance: 60, morphologyType: 'tumour-cell-line' },
};

export function getCatalogueEntry(organismId: string): OrganismCatalogueEntry | undefined {
  return organismIndex.getById(organismId);
}

/**
 * Returns a simulation profile only for entries that are simulation-ready.
 * Tumour taxonomy (disease) entries must not silently inherit the E. coli bacterial model.
 */
export function getSimulationProfile(organismId: string): OrganismSimulationProfile {
  const entry = getCatalogueEntry(organismId);
  if (entry) {
    const simReady = entry.simulationReady ?? entry.compatibleModules.includes('virtual-lab');

    if (entry.category === 'tumours-cancer') {
      if (!simReady || entry.entryKind === 'neoplasm-taxonomy' || entry.entryKind === 'educational-specimen') {
        // Explicit non-bacterial stub — callers should not run disease taxonomy in Virtual Lab.
        return {
          category: 'tumours-cancer',
          optimalTemp: 37,
          optimalPh: 7.4,
          basePopulation: 0,
          baseViability: 0,
          replicationRate: 0,
          environmentalTolerance: 0,
          morphologyType: 'reference-only',
        };
      }
      const base = CATEGORY_PROFILES['tumours-cancer'];
      if (
        entry.tissueForm === 'blood-lymphoid'
        || (entry.subcategory === 'tumour-cell-line' && /jurkat|k-562|k562|leukemia|leukaemia/i.test(entry.name))
      ) {
        return { ...base, morphologyType: 'suspension-lymphoid', replicationRate: 0.18 };
      }
      if (entry.id === 'ORG-HELA') {
        return { ...base, morphologyType: 'hela' };
      }
      return { ...base, morphologyType: 'tumour-cell-line' };
    }

    const base = CATEGORY_PROFILES[entry.category] ?? CATEGORY_PROFILES.bacteria;
    if (entry.subcategory === 'neuron') {
      return { ...base, morphologyType: 'neuron', replicationRate: 0.05 };
    }
    if (entry.subcategory === 'yeast') {
      return { ...base, morphologyType: 'yeast' };
    }
    if (entry.subcategory === 'cocci' || entry.subcategory === 'gram-positive') {
      return { ...base, morphologyType: 'coccus' };
    }
    if (entry.id === 'ORG-ECOLI' || entry.name.includes('E. coli')) {
      return { ...CATEGORY_PROFILES.bacteria, replicationRate: 0.6 };
    }
    return base;
  }
  return legacyProfile(organismId);
}

function legacyProfile(organismId: string): OrganismSimulationProfile {
  switch (organismId) {
    case 'ORG-002': return CATEGORY_PROFILES.viruses;
    case 'ORG-003': return CATEGORY_PROFILES.fungi;
    case 'ORG-004': return { ...CATEGORY_PROFILES['tumours-cancer'], morphologyType: 'hela' };
    case 'ORG-005': return CATEGORY_PROFILES.proteins;
    case 'ORG-006': return CATEGORY_PROFILES.prions;
    default: return CATEGORY_PROFILES.bacteria;
  }
}

export function createOrganismStateFromProfile(organismId: string): OrganismSimulationState {
  const p = getSimulationProfile(organismId);
  return {
    population: p.basePopulation,
    viability: p.baseViability,
    replicationRate: p.replicationRate,
    stress: p.category === 'prions' ? 50 : p.category === 'viruses' ? 15 : 5,
    mutationIndicator: p.category === 'viruses' ? 5 : p.category === 'prions' ? 20 : 1,
    environmentalTolerance: p.environmentalTolerance,
  };
}

export function biologicalSystemTypeLabel(category: string): string {
  const labels: Record<string, string> = {
    bacteria: 'Organism (bacterium)',
    archaea: 'Organism (archaeon)',
    fungi: 'Organism (fungus)',
    viruses: 'Virus',
    parasites: 'Parasite',
    'mammalian-cells': 'Cell culture',
    'plant-cells': 'Plant cell',
    tissues: 'Tissue',
    proteins: 'Protein',
    prions: 'Prion (reference)',
    'tumours-cancer': 'Tumour / cancer catalogue',
  };
  return labels[category] ?? 'Biological system';
}

export function assertSimulationAllowed(organismId: string): { ok: true } | { ok: false; reason: string } {
  const entry = getCatalogueEntry(organismId);
  if (!entry) return { ok: false, reason: 'Unknown catalogue organism.' };
  const simReady = entry.simulationReady ?? entry.compatibleModules.includes('virtual-lab');
  if (!simReady) {
    return {
      ok: false,
      reason: 'Simulation not available for this catalogue entry. The E. coli growth model is never applied to tumour taxonomy entries.',
    };
  }
  return { ok: true };
}
