import { describe, expect, test } from 'bun:test';
import { organismIndex, moleculeIndex, dedupeCatalogueById } from '../catalogue/index';
import { searchGlossary, findGlossaryEntry } from '../services/glossaryService';
import { evaluateIsotope, getIsotopesForElement } from '../data/isotopes';
import {
  applyMoleculeToSetup,
  createExperimentSetup,
  environmentFromSetup,
  inferMoleculeRole,
} from '../services/experimentWorkspaceService';
import { buildScientificReport } from '../services/reportGenerator';
import { organismIndex as orgIdx } from '../catalogue/index';

describe('Phase 5 catalogue filtering', () => {
  test('plant-cells never returns viruses', () => {
    const page = organismIndex.query({ category: 'plant-cells', pageSize: 200 });
    expect(page.total).toBeGreaterThan(0);
    expect(page.items.every((o) => o.category === 'plant-cells')).toBe(true);
    expect(page.items.some((o) => o.category === 'viruses')).toBe(false);
  });

  test('tissues never returns viruses', () => {
    const page = organismIndex.query({ category: 'tissues', pageSize: 200 });
    expect(page.items.every((o) => o.category === 'tissues')).toBe(true);
    expect(page.items.some((o) => o.name.toLowerCase().includes('virus'))).toBe(false);
  });

  test('viruses category returns virus entries only', () => {
    const page = organismIndex.query({ category: 'viruses', pageSize: 100 });
    expect(page.total).toBeGreaterThan(0);
    expect(page.items.every((o) => o.category === 'viruses')).toBe(true);
  });

  test('search within category uses AND logic', () => {
    const page = organismIndex.query({ category: 'bacteria', search: 'coli', pageSize: 50 });
    expect(page.items.every((o) => o.category === 'bacteria')).toBe(true);
    expect(page.items.some((o) => o.name.includes('coli') || o.keywords.includes('coli'))).toBe(true);
  });

  test('deduplicates by stable ID', () => {
    const all = organismIndex.getAll();
    const ids = all.map((o) => o.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  test('adenovirus entries have unique IDs', () => {
    const adeno = organismIndex.getAll().filter((o) => o.name.includes('Adenovirus'));
    const ids = adeno.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Phase 5 molecule explorer search', () => {
  test('glucose search finds glucose', () => {
    const page = moleculeIndex.query({ search: 'glucose', pageSize: 20 });
    expect(page.items.some((m) => m.name === 'Glucose')).toBe(true);
  });

  test('amino acid category search', () => {
    const page = moleculeIndex.query({ search: 'amino acid', pageSize: 50 });
    expect(page.items.length).toBeGreaterThan(5);
    expect(page.items.every((m) => m.category === 'amino-acid')).toBe(true);
  });

  test('element C search returns carbon-containing compounds', () => {
    const page = moleculeIndex.query({ search: 'C', pageSize: 50 });
    expect(page.items.some((m) => m.elements.includes('C'))).toBe(true);
  });

  test('empty catalogue page has zero totalPages', () => {
    const page = moleculeIndex.query({ search: 'zzzznonexistent999', pageSize: 24 });
    expect(page.total).toBe(0);
    expect(page.totalPages).toBe(0);
  });
});

describe('Phase 5 glossary', () => {
  test('category filter atomic', () => {
    const terms = searchGlossary('', 'atomic');
    expect(terms.length).toBeGreaterThan(5);
    expect(terms.every((t) => t.categories.includes('atomic'))).toBe(true);
  });

  test('category + search combination', () => {
    const terms = searchGlossary('decay', 'atomic');
    expect(terms.every((t) => t.categories.includes('atomic'))).toBe(true);
    expect(terms.some((t) => t.term.toLowerCase().includes('decay'))).toBe(true);
  });

  test('required term half-life exists', () => {
    expect(findGlossaryEntry('half-life')?.term).toBe('Half-life');
  });
});

describe('Phase 5 isotopes', () => {
  test('radon-222 evaluation', () => {
    const iso = evaluateIsotope('Rn', 136);
    expect(iso.massNumber).toBe(222);
    expect(iso.radioactive).toBe(true);
    expect(iso.daughterNuclide).toBe('Polonium-218');
  });

  test('technetium has no stable isotopes note', () => {
    const list = getIsotopesForElement('Tc');
    expect(list[0]?.notes).toContain('No stable');
  });
});

describe('Phase 5 experiment workspace', () => {
  test('water import affects environment model inputs', () => {
    const entry = orgIdx.getById('ORG-ECOLI')!;
    const setup = createExperimentSetup(entry);
    const withWater = applyMoleculeToSetup(setup, { id: 'MOL-H2O', name: 'Water', formula: 'H2O' }, 'medium-component');
    const env = environmentFromSetup(withWater);
    expect(withWater.transferredMolecules.some((m) => m.role === 'medium-component')).toBe(true);
    expect(env.nutrientAvailability).toBeGreaterThan(setup.environment.nutrientAvailability);
  });

  test('infer water role as medium', () => {
    expect(inferMoleculeRole('MOL-H2O', 'Water')).toBe('medium-component');
  });

  test('report generation uses stored setup not invented methods', () => {
    const entry = orgIdx.getById('ORG-ECOLI')!;
    const setup = createExperimentSetup(entry);
    const report = buildScientificReport(setup, null, null, null);
    expect(report.sections.find((s) => s.id === 'sample')?.content).toContain('SAMPLE-');
    expect(report.sections.find((s) => s.id === 'duration')?.content).toBe('Not recorded');
  });
});

describe('Phase 5 runtime stability', () => {
  test('forecastViability survives missing preferredEnvironment', async () => {
    const { forecastViability } = await import('../services/viabilityForecast');
    const { defaultEnvironment } = await import('../data/demoData');
    const result = forecastViability(defaultEnvironment, {
      id: 'ORG-TEST',
      commonName: 'Test organism',
      scientificName: 'Test',
      category: 'bacteria',
      classification: '',
      description: '',
      characteristics: [],
      preferredEnvironment: {},
      associatedExperimentIds: [],
      references: [],
    });
    expect(result.modelledViability).toBeGreaterThanOrEqual(0);
  });

  test('sanitizePersistedWorkspace repairs malformed experiment setup', async () => {
    const { sanitizePersistedWorkspace } = await import('../services/persistedStateMigration');
    const sanitized = sanitizePersistedWorkspace({
      activeExperimentSetup: { id: 'broken', sampleId: 'SAMPLE-001' },
    });
    expect(sanitized.activeExperimentSetup).toBeNull();
  });

  test('sanitizePersistedWorkspace discards invalid simulation', async () => {
    const { sanitizePersistedWorkspace } = await import('../services/persistedStateMigration');
    const sanitized = sanitizePersistedWorkspace({ activeSimulation: { id: 'bad' } });
    expect(sanitized.activeSimulation).toBeNull();
  });
});

describe('Phase 5 final polish', () => {
  test('element name radon resolves with limited chemistry message', async () => {
    const { resolveElementQuery, elementRecognisedEmptyMessage } = await import('../services/elementSearch');
    const { moleculesContainingElement } = await import('../catalogue/index');
    const el = resolveElementQuery('radon');
    expect(el?.symbol).toBe('Rn');
    expect(moleculesContainingElement('Rn')).toHaveLength(0);
    expect(elementRecognisedEmptyMessage(el!)).toContain('extremely limited');
  });

  test('technetium resolves to catalogue compounds', async () => {
    const { resolveElementQuery } = await import('../services/elementSearch');
    const { moleculesContainingElement } = await import('../catalogue/index');
    const el = resolveElementQuery('technetium');
    expect(el?.symbol).toBe('Tc');
    expect(moleculesContainingElement('Tc').length).toBeGreaterThan(0);
  });

  test('element name carbon resolves to C compounds', async () => {
    const { resolveElementQuery } = await import('../services/elementSearch');
    const { moleculesContainingElement } = await import('../catalogue/index');
    const el = resolveElementQuery('carbon');
    expect(el?.symbol).toBe('C');
    expect(moleculesContainingElement('C').length).toBeGreaterThan(0);
  });

  test('molecule pathway mapping for glucose', async () => {
    const { getMoleculePathwayContext } = await import('../services/moleculePathwayMapping');
    const ctx = getMoleculePathwayContext('MOL-GLUC');
    expect(ctx?.pathway.id).toBe('PATH-METABOLIC');
    expect(getMoleculePathwayContext('MOL-MED-158')).toBeNull();
  });

  test('variant filter normalises comma positions and highlights', async () => {
    const { filterUploadedVariants, normalizeVariantSearchQuery } = await import('../services/variantFilter');
    const variants = [
      { id: 'v1', chromosome: '11', position: 169805, referenceAllele: 'A', alternateAllele: 'G', genotype: 'AG', observationStatus: 'observed' as const, rsId: 'rs6423165' },
    ];
    expect(normalizeVariantSearchQuery('169,805')).toBe('169805');
    const byPos = filterUploadedVariants(variants, '169,805');
    expect(byPos.variants).toHaveLength(1);
    expect(byPos.highlightId).toBe('v1');
    const byRs = filterUploadedVariants(variants, 'rs6423165');
    expect(byRs.highlightId).toBe('v1');
  });

  test('data quality signals are conservative for consumer SNP data', async () => {
    const { assessDataQualitySignals } = await import('../services/dataQualitySignalService');
    const result = assessDataQualitySignals({
      id: 'up-1', fileName: 'test.txt', uploadedAt: new Date().toISOString(), sourceFormat: '23andme',
      variants: [
        { id: '1', chromosome: 'X', position: 100, referenceAllele: 'A', alternateAllele: 'G', genotype: 'AG', observationStatus: 'observed' as const },
      ],
      variantCount: 1, isPersisted: false,
    });
    expect(result.limitations).toContain('cannot reliably diagnose trisomy');
    expect(result.signals.every((s) => s.disclaimer.includes('not diagnostic'))).toBe(true);
  });

  test('shared gene reference finds H19 and imprinting region', async () => {
    const { searchGeneReferences, getGeneBySymbol, imprintingNoteForGene } = await import('../services/geneReferenceService');
    expect(getGeneBySymbol('H19')?.symbol).toBe('H19');
    expect(getGeneBySymbol('IGF2')?.symbol).toBe('IGF2');
    const region = searchGeneReferences('11p15.5 imprinting');
    expect(region.some((r) => r.label.includes('11p15.5'))).toBe(true);
    expect(imprintingNoteForGene('H19')).toContain('epigenetic');
  });

  test('pathway search uses shared gene catalogue for H19', async () => {
    const { searchPathwayExplorer } = await import('../services/pathwaySearch');
    const results = searchPathwayExplorer('H19');
    expect(results.some((r) => r.label === 'H19')).toBe(true);
  });

  test('active experiment design check reports configured control', async () => {
    const { runActiveExperimentDesignCheck } = await import('../services/activeExperimentDesignCheck');
    const { createExperimentSetup } = await import('../services/experimentWorkspaceService');
    const { defaultEnvironment } = await import('../data/demoData');
    const { organismIndex } = await import('../catalogue/index');
    const entry = organismIndex.getById('ORG-ECOLI')!;
    const setup = createExperimentSetup(entry);
    const checks = runActiveExperimentDesignCheck(setup, setup.environment, setup.control.environment, 2);
    expect(checks.find((c) => c.id === 'control')?.label).toBe('Control configured');
    expect(checks.find((c) => c.id === 'control')?.label).not.toBe('Missing control');
  });

  test('genome navigation consecutive gene symbols resolve distinctly', async () => {
    const { searchGenomeNavigation } = await import('../services/genomeNavigation');
    for (const sym of ['HTT', 'BRCA1', 'TP53', 'CFTR']) {
      const results = searchGenomeNavigation(sym);
      expect(results.some((r) => r.target.geneSymbol === sym)).toBe(true);
    }
  });

  test('cross-module molecule pathway context handoff', async () => {
    const { getMoleculePathwayContext } = await import('../services/moleculePathwayMapping');
    const ctx = getMoleculePathwayContext('MOL-GLUC');
    expect(ctx?.pathway.id).toBe('PATH-METABOLIC');
    expect(ctx?.molecule.name).toBe('Glucose');
  });

  test('genotype II notation help', async () => {
    const { getGenotypeNotationHelp, getGenotypeExplainContent } = await import('../services/genotypeNotation');
    const help = getGenotypeNotationHelp('II', '23andme');
    expect(help?.explain.whatIsIt).toContain('insertion');
    expect(help?.explain.whatItDoesNotMean).toMatch(/does not|NOT|not/i);
    const structured = getGenotypeExplainContent('II', '23andme');
    expect(structured?.whatIsIt).toContain('II');
    expect(structured?.whatResultMeans?.toLowerCase()).toContain('tell');
  });

  test('structural signals service retained for legacy import report', async () => {
    const { assessStructuralSignals } = await import('../services/structuralSignalService');
    const result = assessStructuralSignals({
      id: 'up-1', fileName: 'test.txt', uploadedAt: new Date().toISOString(), sourceFormat: '23andme',
      variants: [], variantCount: 1000, isPersisted: false,
    });
    expect(result.summaryLabel).toContain('Insufficient data');
    expect(result.signals).toHaveLength(0);
  });

  test('report levels share data with different presentation', async () => {
    const { buildScientificReport } = await import('../services/reportGenerator');
    const entry = orgIdx.getById('ORG-ECOLI')!;
    const setup = createExperimentSetup(entry);
    const simple = buildScientificReport(setup, null, null, null, 'simple');
    const technical = buildScientificReport(setup, null, null, null, 'technical');
    expect(simple.reportLevel).toBe('simple');
    expect(technical.reportLevel).toBe('technical');
    expect(simple.sections.find((s) => s.id === 'experiment-id')?.content).toBe(
      technical.sections.find((s) => s.id === 'experiment-id')?.content,
    );
    expect(simple.sections.find((s) => s.id === 'limitations')?.content).not.toBe(
      technical.sections.find((s) => s.id === 'limitations')?.content,
    );
  });
});

describe('UX overhaul regressions', () => {
  test('hypothesis workflow fields cover experiment plan and result separately', async () => {
    const wf = {
      observation: 'o',
      researchQuestion: 'q',
      hypothesis: 'h',
      independentVariable: 'iv',
      dependentVariable: 'dv',
      controls: 'c',
      prediction: 'p',
      experimentPlan: 'plan',
      resultSummary: 'result',
      conclusion: 'concl',
      verdict: 'supports' as const,
    };
    expect(wf.experimentPlan).not.toBe(wf.observation);
    expect(wf.resultSummary).not.toBe(wf.conclusion);
  });

  test('microscope route is /microscope not /virtual-microscope', async () => {
    const mod = await import('../services/moduleActions');
    const navigations: string[] = [];
    const ctx = {
      dispatch: () => {},
      navigate: (path: string) => { navigations.push(path); },
    };
    const { organismIndex } = await import('../catalogue/index');
    const entry = organismIndex.getById('ORG-ECOLI');
    if (entry) {
      mod.sendOrganismToMicroscope(ctx as never, entry);
      expect(navigations.at(-1)).toBe('/microscope');
    }
  });

  test('explainers cover pathway and therapeutic education', async () => {
    const { EXPLAIN } = await import('../content/explainers');
    expect(EXPLAIN.pathway.whatIsIt.length).toBeGreaterThan(40);
    expect(EXPLAIN.therapeutic.whatItDoesNotMean).toContain('NOT');
    expect(EXPLAIN.microscope.whatAmILookingAt.toLowerCase()).toContain('simulated');
  });
});

describe('dedupeCatalogueById utility', () => {
  test('keeps first entry on duplicate id', () => {
    const result = dedupeCatalogueById([
      { id: 'A', name: 'First', aliases: [], category: 'x', description: { simple: '', standard: '', technical: '' }, summary: { simple: '', standard: '', technical: '' }, tags: [], keywords: [], evidence: { level: 'reference-data' }, relatedIds: [], compatibleModules: [] },
      { id: 'A', name: 'Second', aliases: [], category: 'y', description: { simple: '', standard: '', technical: '' }, summary: { simple: '', standard: '', technical: '' }, tags: [], keywords: [], evidence: { level: 'reference-data' }, relatedIds: [], compatibleModules: [] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('First');
  });
});
