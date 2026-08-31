import type { ActiveExperimentSetup, ControlConfiguration, TransferredMolecule } from '../types/experimentWorkspace';
import type { EnvironmentConditions } from '../types';
import type { OrganismCatalogueEntry } from '../catalogue/types';
import { nextStableId } from './idGenerator';
import { defaultEnvironment } from '../data/demoData';

export function createExperimentSetup(
  entry: OrganismCatalogueEntry,
  existingSampleIds: string[] = [],
): ActiveExperimentSetup {
  const now = new Date().toISOString();
  const sampleId = nextStableId('SAMPLE', existingSampleIds);
  const controlId = nextStableId('CTRL', []);
  const env = {
    ...defaultEnvironment,
    ...(entry.preferredEnvironment ?? {}),
  } as EnvironmentConditions;

  return {
    id: nextStableId('EXP', []),
    displayId: sampleId,
    lifecycle: 'draft',
    sampleId,
    sampleDisplayName: entry.name,
    catalogueEntryId: entry.id,
    catalogueCategory: entry.category,
    biologicalSystemType: entry.category,
    environment: env,
    transferredMolecules: [],
    control: createDefaultControl(entry, controlId, env),
    notes: '',
    history: [{ timestamp: now, type: 'created', detail: `Sample ${sampleId} selected: ${entry.name}` }],
    provenance: 'user-created',
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultControl(
  entry: OrganismCatalogueEntry,
  controlId: string,
  baseline: EnvironmentConditions,
): ControlConfiguration {
  return {
    mode: 'auto-baseline',
    sampleId: controlId,
    displayName: `${entry.name} (control)`,
    catalogueEntryId: entry.id,
    environment: { ...baseline, ph: 7, nutrientAvailability: 100 },
    updatedAt: new Date().toISOString(),
  };
}

export function applyMoleculeToSetup(
  setup: ActiveExperimentSetup,
  molecule: { id: string; name: string; formula: string },
  role: TransferredMolecule['role'],
): ActiveExperimentSetup {
  const now = new Date().toISOString();
  const transferred: TransferredMolecule = {
    id: `TM-${Date.now().toString(36)}`,
    moleculeId: molecule.id,
    name: molecule.name,
    formula: molecule.formula,
    role,
    provenance: 'user-created',
    addedAt: now,
  };
  const filtered = setup.transferredMolecules.filter(
    (m) => !(m.moleculeId === molecule.id && m.role === role),
  );
  return {
    ...setup,
    transferredMolecules: [...filtered, transferred],
    updatedAt: now,
    history: [
      ...setup.history,
      { timestamp: now, type: 'molecule-import', detail: `${molecule.name} added as ${role}` },
    ],
  };
}

export function environmentFromSetup(setup: ActiveExperimentSetup): EnvironmentConditions {
  const env = { ...setup.environment };
  const hasWater = setup.transferredMolecules.some((m) => m.moleculeId === 'MOL-H2O' || m.name === 'Water');
  if (hasWater) {
    env.nutrientAvailability = Math.min(100, env.nutrientAvailability + 5);
  }
  const treatments = setup.transferredMolecules.filter((m) => m.role === 'treatment');
  if (treatments.length) {
    env.ph = Math.max(0, env.ph - treatments.length * 0.2);
  }
  return env;
}

export function inferMoleculeRole(moleculeId: string, name: string): TransferredMolecule['role'] {
  if (moleculeId === 'MOL-H2O' || name.toLowerCase() === 'water') return 'medium-component';
  if (name.toLowerCase().includes('glucose') || name.toLowerCase().includes('nutrient')) return 'nutrient';
  return 'environment-component';
}

export function filterDemoFromWorkspace<T extends { provenance?: string; id?: string }>(
  items: T[],
  showDemo: boolean,
  hasUserData: boolean,
): T[] {
  if (showDemo || !hasUserData) return items;
  return items.filter((i) => i.provenance !== 'demo' && !String(i.id ?? '').includes('DEMO'));
}
