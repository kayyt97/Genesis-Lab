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
  // Matched untreated control: same sample identity and environment as the experimental dish.
  // Do NOT force pH/nutrients — mismatched conditions invalidate treatment isolation.
  return {
    mode: 'auto-baseline',
    sampleId: controlId,
    displayName: `${entry.name} (control)`,
    catalogueEntryId: entry.id,
    environment: { ...baseline },
    updatedAt: new Date().toISOString(),
  };
}

/** True when experimental and control environments match on comparison-critical fields. */
export function environmentsMatchForComparison(
  a: EnvironmentConditions,
  b: EnvironmentConditions,
  epsilon = 1e-6,
): { ok: true } | { ok: false; mismatches: string[] } {
  const keys: (keyof EnvironmentConditions)[] = [
    'temperature',
    'ph',
    'oxygen',
    'carbonDioxide',
    'humidity',
    'pressure',
    'salinity',
    'nutrientAvailability',
    'radiationExposure',
  ];
  const mismatches: string[] = [];
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') {
      if (Math.abs(av - bv) > epsilon) mismatches.push(`${key}: experimental ${av} vs control ${bv}`);
    } else if (av !== bv) {
      mismatches.push(`${String(key)}: experimental ${String(av)} vs control ${String(bv)}`);
    }
  }
  return mismatches.length === 0 ? { ok: true } : { ok: false, mismatches };
}

/** Keep auto-baseline control environment locked to the experimental dish. */
export function syncMatchedControlEnvironment(
  setup: ActiveExperimentSetup,
  experimentalEnv: EnvironmentConditions,
): ActiveExperimentSetup {
  if (setup.control.mode === 'none-not-applicable') return setup;
  if (setup.control.mode === 'custom') return setup;
  const match = environmentsMatchForComparison(experimentalEnv, setup.control.environment);
  if (match.ok) return setup;
  const now = new Date().toISOString();
  return {
    ...setup,
    control: {
      ...setup.control,
      mode: 'auto-baseline',
      environment: { ...experimentalEnv },
      updatedAt: now,
    },
    updatedAt: now,
    history: [
      ...setup.history,
      {
        timestamp: now,
        type: 'control-sync',
        detail: `Matched untreated control environment to experimental dish (${match.mismatches.join('; ')})`,
      },
    ],
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

const SIMULATED_ESTIMATE_HINT = 'simulated educational estimate';

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
    // Preserve any pre-vector baseline so before/after comparison remains available
    recordedBaseline: setup.recordedBaseline ?? null,
    updatedAt: now,
    history: [
      ...asMolecule.history,
      {
        timestamp: now,
        type: 'therapeutic-attach',
        detail: `Conceptual therapeutic “${design.name}” (${design.intendedOutcome ?? 'growth-suppression'}) attached to experimental dish; control remains untreated`,
      },
    ],
  };
}

/** Capture experimental (+ optional control) dish state as the pre-vector baseline. */
export function recordDishBaseline(
  setup: ActiveExperimentSetup,
  experimental: {
    timeHours: number;
    currentTick: number;
    seed?: number;
    organismState: import('../types').OrganismSimulationState;
  },
  controlState?: import('../types').OrganismSimulationState | null,
): ActiveExperimentSetup {
  const now = new Date().toISOString();
  const baseline: import('../types/experimentWorkspace').RecordedDishBaseline = {
    recordedAt: now,
    timeHours: experimental.timeHours,
    tick: experimental.currentTick,
    seed: experimental.seed ?? setup.simulationSeed ?? 42,
    organismState: { ...experimental.organismState },
    controlOrganismState: controlState ? { ...controlState } : null,
    label: 'Pre-vector baseline (untreated experimental dish)',
  };
  return {
    ...setup,
    recordedBaseline: baseline,
    updatedAt: now,
    history: [
      ...setup.history,
      {
        timestamp: now,
        type: 'baseline-recorded',
        detail: `Baseline recorded at ${baseline.timeHours.toFixed(2)} h (tick ${baseline.tick}) — ${SIMULATED_ESTIMATE_HINT}`,
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
