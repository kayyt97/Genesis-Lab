import { describe, expect, test } from 'bun:test';
import { resolveSampleSelectorCategory } from '../services/sampleSelectorSync';
import { organismIndex } from '../catalogue/index';
import { createExperimentSetup } from '../services/experimentWorkspaceService';

describe('HeLa / Bacteria category sync', () => {
  test('dish tumours-cancer wins over a bacteria selected category', () => {
    expect(resolveSampleSelectorCategory('bacteria', 'tumours-cancer')).toBe('tumours-cancer');
  });

  test('falls back to selected category when no dish category is set', () => {
    expect(resolveSampleSelectorCategory('bacteria', undefined)).toBe('bacteria');
    expect(resolveSampleSelectorCategory('tumours-cancer', undefined)).toBe('tumours-cancer');
  });

  test('HeLa experiment setup carries tumours-cancer catalogue category', () => {
    const hela = organismIndex.getById('ORG-HELA')!;
    const setup = createExperimentSetup(hela);
    expect(hela.category).toBe('tumours-cancer');
    expect(setup.catalogueCategory).toBe('tumours-cancer');
    expect(setup.catalogueEntryId).toBe('ORG-HELA');
    expect(resolveSampleSelectorCategory('bacteria', setup.catalogueCategory)).toBe('tumours-cancer');
  });
});
