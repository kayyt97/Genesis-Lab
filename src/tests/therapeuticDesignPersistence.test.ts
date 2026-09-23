import { describe, expect, test, beforeEach } from 'bun:test';
import {
  THERAPEUTIC_DESIGNS_STORAGE_KEY,
  loadTherapeuticDesignsFromStorage,
  mergeTherapeuticDesignLists,
  persistTherapeuticDesigns,
  sanitizeTherapeuticDesign,
  sanitizeTherapeuticDesigns,
} from '../services/therapeuticDesignPersistence';
import {
  attachTherapeuticToSetup,
  createExperimentSetup,
} from '../services/experimentWorkspaceService';
import { therapeuticConfigFromDesign } from '../services/tumourCellSimulation';
import { organismIndex } from '../catalogue/index';
import type { TherapeuticDesign } from '../types/scientific';
import { createSimulation } from '../simulation/engine';

const memory = new Map<string, string>();

function installMemoryStorage() {
  memory.clear();
  const store = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memory.set(k, String(v));
    },
    removeItem: (k: string) => {
      memory.delete(k);
    },
    clear: () => memory.clear(),
    key: (i: number) => Array.from(memory.keys())[i] ?? null,
    get length() {
      return memory.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
}

function makeDesign(partial: Partial<TherapeuticDesign> = {}): TherapeuticDesign {
  return {
    id: 'TD-ABC123',
    name: 'Motility concept',
    targetType: 'tumour-cell',
    targetDescription: 'HeLa educational motility',
    deliveryModel: 'non-replicating-vector',
    payloadEffect: 'suppress-target',
    intendedOutcome: 'reduce-movement',
    targetCellModelId: 'ORG-HELA',
    variables: {
      targetingPreference: 88,
      uptake: 77,
      therapeuticEffect: 66,
      immuneResponse: 20,
      clearance: 30,
      offTargetEffect: 10,
      resistance: 5,
      toxicityProxy: 15,
    },
    notes: '',
    createdAt: '2026-09-23T00:00:00Z',
    evidence: { level: 'speculative', note: 'educational' },
    ...partial,
  };
}

describe('therapeutic design persistence and Virtual Lab handoff', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  test('saved design survives dedicated storage round-trip (navigation/refresh stand-in)', () => {
    const design = makeDesign();
    const result = persistTherapeuticDesigns([design]);
    expect(result.ok).toBe(true);
    expect(memory.has(THERAPEUTIC_DESIGNS_STORAGE_KEY)).toBe(true);

    const loaded = loadTherapeuticDesignsFromStorage();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.id).toBe(design.id);
    expect(loaded[0]!.name).toBe('Motility concept');
    expect(loaded[0]!.variables.uptake).toBe(77);
    expect(loaded[0]!.intendedOutcome).toBe('reduce-movement');
    expect(loaded[0]!.targetCellModelId).toBe('ORG-HELA');
  });

  test('merge prefers dedicated storage over stale workspace blob', () => {
    const older = makeDesign({ name: 'Old name', variables: { ...makeDesign().variables, uptake: 10 } });
    const newer = makeDesign({ name: 'New name', variables: { ...makeDesign().variables, uptake: 90 } });
    const merged = mergeTherapeuticDesignLists([older], [newer]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.name).toBe('New name');
    expect(merged[0]!.variables.uptake).toBe(90);
  });

  test('sanitize drops corrupt entries and keeps valid TD- designs', () => {
    const clean = sanitizeTherapeuticDesigns([
      makeDesign(),
      { id: 'NOT-TD', name: 'bad' },
      null,
      makeDesign({ id: 'TD-SECOND', name: 'Second' }),
    ]);
    expect(clean.map((d) => d.id)).toEqual(['TD-ABC123', 'TD-SECOND']);
  });

  test('persist failure returns a useful QuotaExceeded message', () => {
    const boom = {
      getItem: () => null,
      setItem: () => {
        const err = new DOMException('quota', 'QuotaExceededError');
        throw err;
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
    Object.defineProperty(globalThis, 'localStorage', { value: boom, configurable: true });
    const result = persistTherapeuticDesigns([makeDesign()]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.toLowerCase()).toContain('quota');
    }
  });

  test('handoff-embedded design settings are passed into simulation treatment config', () => {
    const design = makeDesign();
    const entry = organismIndex.getById('ORG-HELA')!;
    let setup = createExperimentSetup(entry);
    setup = attachTherapeuticToSetup(setup, design);
    const treatment = therapeuticConfigFromDesign(design);

    expect(setup.attachedTherapeutic?.designId).toBe(design.id);
    expect(setup.attachedTherapeutic?.designName).toBe(design.name);
    expect(setup.attachedTherapeutic?.intendedOutcome).toBe('reduce-movement');
    expect(setup.attachedTherapeutic?.variables.uptake).toBe(77);
    expect(setup.attachedTherapeutic?.variables.therapeuticEffect).toBe(66);
    expect(setup.attachedTherapeutic?.variables.targetingPreference).toBe(88);

    expect(treatment.variables.uptake).toBe(77);
    const sim = createSimulation('ORG-HELA', setup.environment, undefined, {
      seed: setup.simulationSeed,
      therapeuticTreatment: treatment,
    });
    expect(sim.therapeuticTreatment?.variables.uptake).toBe(77);
    expect(sim.therapeuticTreatment?.designName).toBe('Motility concept');
  });

  test('sanitizeTherapeuticDesign recovers a handoff payload design', () => {
    const design = makeDesign();
    const recovered = sanitizeTherapeuticDesign(JSON.parse(JSON.stringify(design)));
    expect(recovered).not.toBeNull();
    expect(recovered!.variables.therapeuticEffect).toBe(66);
  });
});
