import type { Simulation } from '../types';
import type { ActiveExperimentSetup, ScientificReport } from '../types/experimentWorkspace';
import type { AppSettings } from '../types';
import { defaultEnvironment } from '../data/demoData';
import { organismIndex } from '../catalogue/index';
import { createExperimentSetup } from './experimentWorkspaceService';

const WORKSPACE_STORAGE_VERSION = 3;

interface PersistedEnvelope {
  workspaceStorageVersion?: number;
  [key: string]: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidSimulation(value: unknown): value is Simulation {
  if (!isObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.organismId === 'string' &&
    isObject(value.environment) &&
    isObject(value.organismState) &&
    typeof value.status === 'string'
  );
}

function isValidExperimentSetup(value: unknown): value is ActiveExperimentSetup {
  if (!isObject(value)) return false;
  const control = value.control;
  return (
    typeof value.id === 'string' &&
    typeof value.sampleId === 'string' &&
    typeof value.sampleDisplayName === 'string' &&
    typeof value.catalogueEntryId === 'string' &&
    isObject(value.environment) &&
    isObject(control) &&
    typeof control.mode === 'string' &&
    Array.isArray(value.transferredMolecules) &&
    Array.isArray(value.history)
  );
}

function isValidReport(value: unknown): value is ScientificReport {
  if (!isObject(value)) return false;
  return typeof value.id === 'string' && Array.isArray(value.sections);
}

/** Repair or discard Phase 5 workspace fields from persisted localStorage. */
export function sanitizePersistedWorkspace(raw: PersistedEnvelope): PersistedEnvelope {
  const next: PersistedEnvelope = { ...raw, workspaceStorageVersion: WORKSPACE_STORAGE_VERSION };

  if (next.activeSimulation !== undefined && next.activeSimulation !== null && !isValidSimulation(next.activeSimulation)) {
    next.activeSimulation = null;
  }

  if (next.controlSimulation !== undefined && next.controlSimulation !== null && !isValidSimulation(next.controlSimulation)) {
    next.controlSimulation = null;
  }

  if (next.activeExperimentSetup !== undefined && next.activeExperimentSetup !== null) {
    if (!isValidExperimentSetup(next.activeExperimentSetup)) {
      const catalogueId = isObject(next.activeExperimentSetup)
        ? String(next.activeExperimentSetup.catalogueEntryId ?? '')
        : '';
      const entry = catalogueId ? organismIndex.getById(catalogueId) : undefined;
      next.activeExperimentSetup = entry ? createExperimentSetup(entry) : null;
    }
  }

  if (next.reportDraft !== undefined && next.reportDraft !== null && !isValidReport(next.reportDraft)) {
    next.reportDraft = null;
  } else if (isValidReport(next.reportDraft)) {
    next.reportDraft = {
      ...next.reportDraft,
      reportLevel: next.reportDraft.reportLevel ?? 'standard',
    };
  }

  // Ensure environment objects always include defaults after schema changes
  if (isValidExperimentSetup(next.activeExperimentSetup)) {
    next.activeExperimentSetup = {
      ...next.activeExperimentSetup,
      environment: { ...defaultEnvironment, ...next.activeExperimentSetup.environment },
      control: {
        ...next.activeExperimentSetup.control,
        environment: {
          ...defaultEnvironment,
          ...next.activeExperimentSetup.control.environment,
        },
      },
      transferredMolecules: next.activeExperimentSetup.transferredMolecules ?? [],
      history: next.activeExperimentSetup.history ?? [],
    };
  }

  if (isValidSimulation(next.activeSimulation)) {
    next.activeSimulation = {
      ...next.activeSimulation,
      environment: { ...defaultEnvironment, ...next.activeSimulation.environment },
      snapshots: next.activeSimulation.snapshots ?? [],
      events: next.activeSimulation.events ?? [],
    };
  }

  if (isValidSimulation(next.controlSimulation)) {
    next.controlSimulation = {
      ...next.controlSimulation,
      environment: { ...defaultEnvironment, ...next.controlSimulation.environment },
      snapshots: next.controlSimulation.snapshots ?? [],
      events: next.controlSimulation.events ?? [],
    };
  }

  return next;
}

export function sanitizePersistedSettings(settings: Partial<AppSettings> | undefined): Partial<AppSettings> {
  if (!settings || !isObject(settings)) return {};
  return settings;
}

export { WORKSPACE_STORAGE_VERSION, isValidExperimentSetup, isValidSimulation };
