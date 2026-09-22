import { describe, expect, test } from 'bun:test';
import {
  organismIndex,
  TUMOUR_TAXONOMY_META,
  TUMOUR_CELL_LINE_ENTRIES,
  normalizeSearch,
  isTumourEntry,
} from '../catalogue/index';
import {
  getSimulationProfile,
  assertSimulationAllowed,
  createOrganismStateFromProfile,
} from '../services/organismSimulationProfile';
import { getBuilderOrganismOptions, isSimulationReadyOrganism } from '../services/demoCatalogueIdMap';
import importReport from '../catalogue/data/tumours/import-report.json';

describe('tumour / cancer catalogue', () => {
  test('Tumours & Cancer category is populated from NCI Neoplasm Core import', () => {
    const tumours = organismIndex.query({ category: 'tumours-cancer', pageSize: 1 });
    expect(tumours.total).toBeGreaterThan(1000);
    expect(TUMOUR_TAXONOMY_META.entryCount).toBeGreaterThan(1000);
    expect(importReport.counts.neoplasmCoreConcepts).toBe(TUMOUR_TAXONOMY_META.entryCount);
  });

  test('tumour and tumor searches return equivalent results', () => {
    const a = organismIndex.query({ search: 'tumour', pageSize: 5 });
    const b = organismIndex.query({ search: 'tumor', pageSize: 5 });
    expect(a.total).toBeGreaterThan(50);
    expect(a.total).toBe(b.total);
    expect(normalizeSearch('tumour')).toBe('tumor');
  });

  test('common and rare names / synonyms resolve', () => {
    expect(organismIndex.query({ search: 'glioblastoma', pageSize: 5 }).total).toBeGreaterThan(0);
    expect(organismIndex.query({ search: 'cholangiocarcinoma', pageSize: 5 }).total).toBeGreaterThan(0);
    expect(organismIndex.query({ search: 'acanthoma', pageSize: 5 }).total).toBeGreaterThan(0);
    expect(organismIndex.query({ search: 'hairy cell', pageSize: 5 }).total).toBeGreaterThan(0);
  });

  test('benign versus malignant behaviour filters', () => {
    const benign = organismIndex.query({ category: 'tumours-cancer', behaviour: 'benign', pageSize: 20 });
    const malignant = organismIndex.query({ category: 'tumours-cancer', behaviour: 'malignant', pageSize: 20 });
    expect(benign.total).toBeGreaterThan(50);
    expect(malignant.total).toBeGreaterThan(500);
    expect(benign.items.every((e) => e.behaviour === 'benign')).toBe(true);
    expect(malignant.items.every((e) => e.behaviour === 'malignant')).toBe(true);
  });

  test('blood cancer that does not form a solid tumour', () => {
    const cml = organismIndex.query({ search: 'Chronic Myeloid Leukemia', pageSize: 10 });
    expect(cml.total).toBeGreaterThan(0);
    const entry = cml.items.find((e) => e.name.includes('Chronic Myeloid Leukemia'));
    expect(entry).toBeTruthy();
    expect(entry!.tissueForm).toBe('blood-lymphoid');
    expect(entry!.simulationReady).toBe(false);
    expect(assertSimulationAllowed(entry!.id).ok).toBe(false);
  });

  test('HeLa is labelled as a cervical cancer-derived cell line, not a generic cervical tumour', () => {
    const hela = organismIndex.getById('ORG-HELA');
    expect(hela).toBeTruthy();
    expect(hela!.entryKind).toBe('tumour-cell-line');
    expect(hela!.name.toLowerCase()).toContain('hela');
    expect(hela!.description.standard.toLowerCase()).toContain('cervical');
    expect(hela!.description.standard.toLowerCase()).toContain('cell line');
    expect(hela!.description.standard.toLowerCase()).not.toContain('every cervical');
    expect(hela!.simulationReady).toBe(true);
  });

  test('reference-only taxonomy vs simulation-ready cell lines', () => {
    const refOnly = organismIndex.query({
      category: 'tumours-cancer',
      simulationReady: false,
      pageSize: 5,
    });
    const ready = organismIndex.query({
      category: 'tumours-cancer',
      simulationReady: true,
      pageSize: 20,
    });
    expect(refOnly.total).toBeGreaterThan(1000);
    expect(ready.total).toBe(TUMOUR_CELL_LINE_ENTRIES.filter((e) => e.simulationReady).length);
    expect(ready.items.every((e) => e.simulationReady)).toBe(true);
    expect(refOnly.items.every((e) => !(e.simulationReady))).toBe(true);
  });

  test('microscope-supported tumour specimens include generated-diagram flag', () => {
    const smear = organismIndex.getById('ORG-SPEC-TUM-BLOOD-SMEAR');
    expect(smear?.morphologySupported).toBe(true);
    expect(smear?.generatedDiagram).toBe(true);
    expect(smear?.simulationReady).toBe(false);
    expect(smear?.compatibleModules.includes('microscope')).toBe(true);
  });

  test('does not apply E. coli bacterial growth model to tumour taxonomy', () => {
    const tumour = organismIndex.getById('ORG-TUM-C3174'); // CML taxonomy
    expect(tumour).toBeTruthy();
    expect(isTumourEntry(tumour!)).toBe(true);
    expect(tumour!.entryKind).toBe('neoplasm-taxonomy');
    const profile = getSimulationProfile(tumour!.id);
    expect(profile.morphologyType).toBe('reference-only');
    expect(profile.replicationRate).toBe(0);
    expect(profile.category).not.toBe('bacteria');

    const ecoli = getSimulationProfile('ORG-ECOLI');
    expect(ecoli.category).toBe('bacteria');
    expect(ecoli.replicationRate).toBeGreaterThan(0.5);

    const helaState = createOrganismStateFromProfile('ORG-HELA');
    const ecoliState = createOrganismStateFromProfile('ORG-ECOLI');
    expect(helaState.replicationRate).toBeLessThan(ecoliState.replicationRate);
  });

  test('Experiment Builder options stay simulation-ready and keep E. coli', () => {
    const options = getBuilderOrganismOptions();
    expect(options.some((o) => o.id === 'ORG-ECOLI')).toBe(true);
    expect(options.some((o) => o.id === 'ORG-HELA')).toBe(true);
    expect(options.every((o) => isSimulationReadyOrganism(o.id))).toBe(true);
    expect(options.every((o) => o.entryKind !== 'neoplasm-taxonomy')).toBe(true);
  });

  test('import report documents licensing limits and exclusions', () => {
    expect(importReport.licensingLimits.length).toBeGreaterThan(2);
    expect(importReport.licensingLimits.some((l: string) => l.includes('ICD-O-4'))).toBe(true);
    expect(importReport.counts.withIcdoMapping).toBeGreaterThan(400);
    expect(importReport.counts.simulationReadyTaxonomy).toBe(0);
  });
});
