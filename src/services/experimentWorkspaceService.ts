import type { ActiveExperimentSetup, ControlConfiguration, TransferredMolecule } from '../types/experimentWorkspace';
import type { EnvironmentConditions, TherapeuticTreatmentConfig } from '../types';
import type { OrganismCatalogueEntry } from '../catalogue/types';
import type { TherapeuticDesign } from '../types/scientific';
import { nextStableId } from './idGenerator';
import { defaultEnvironment } from '../data/demoData';
import { deriveTumourExperimentSeed, therapeuticConfigFromDesign } from './tumourCellSimulation';

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

/**
 * Map transferred molecules into environment inputs.
 * Therapeutic designs (TD-*) must NOT use the legacy pH-drop treatment shortcut —
 * their effects are applied via attachedTherapeutic + the tumour-cell educational model.
 */
export function environmentFromSetup(setup: ActiveExperimentSetup): EnvironmentConditions {
  const env = { ...setup.environment };
  const hasWater = setup.transferredMolecules.some((m) => m.moleculeId === 'MOL-H2O' || m.name === 'Water');
  if (hasWater) {
    env.nutrientAvailability = Math.min(100, env.nutrientAvailability + 5);
  }
  const moleculeTreatments = setup.transferredMolecules.filter(
    (m) => m.role === 'treatment' && !isTherapeuticDesignId(m.moleculeId),
  );
  if (moleculeTreatments.length) {
    env.ph = Math.max(0, env.ph - moleculeTreatments.length * 0.2);
  }
  return env;
}

export function isTherapeuticDesignId(id: string): boolean {
  return id.startsWith('TD-');
}

/** Attach a saved conceptual therapeutic to the experimental dish only (control stays untreated). */
export function attachTherapeuticToSetup(
  setup: ActiveExperimentSetup,
  design: TherapeuticDesign,
): ActiveExperimentSetup {
  const now = new Date().toISOString();
  const config = therapeuticConfigFromDesign(design);
  const asMolecule = applyMoleculeToSetup(
    setup,
    { id: design.id, name: design.name, formula: 'conceptual-therapeutic' },
    'treatment',
  );
  const seed = deriveTumourExperimentSeed(design.id, setup.catalogueEntryId, setup.simulationSeed);
  return {
    ...asMolecule,
    attachedTherapeutic: config,
    simulationSeed: seed,
    updatedAt: now,
    history: [
      ...asMolecule.history,
      {
        timestamp: now,
        type: 'therapeutic-attach',
        detail: `Conceptual therapeutic “${design.name}” (${design.intendedOutcome}) attached to experimental dish; control remains untreated`,
      },
    ],
  };
}

export function clearAttachedTherapeutic(setup: ActiveExperimentSetup): ActiveExperimentSetup {
  const now = new Date().toISOString();
  return {
    ...setup,
    attachedTherapeutic: null,
    transferredMolecules: setup.transferredMolecules.filter((m) => !isTherapeuticDesignId(m.moleculeId)),
    updatedAt: now,
    history: [
      ...setup.history,
      { timestamp: now, type: 'therapeutic-clear', detail: 'Conceptual therapeutic detached from experimental dish' },
    ],
  };
}

export function getAttachedTherapeutic(setup: ActiveExperimentSetup | null | undefined): TherapeuticTreatmentConfig | null {
  return setup?.attachedTherapeutic ?? null;
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
