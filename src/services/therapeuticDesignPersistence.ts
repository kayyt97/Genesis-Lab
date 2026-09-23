/**
 * Dedicated persistence for conceptual therapeutic designs.
 * Kept separate from the large workspace blob so QuotaExceeded on simulation
 * snapshots cannot silently drop saved designs.
 */

import type { TherapeuticDesign, TherapeuticIntendedOutcome } from '../types/scientific';

export const THERAPEUTIC_DESIGNS_STORAGE_KEY = 'genesis-lab-therapeutic-designs-v1';

export type PersistResult =
  | { ok: true }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const OUTCOMES: TherapeuticIntendedOutcome[] = [
  'reduce-movement',
  'growth-suppression',
  'cell-killing',
];

/** Validate and normalise one persisted design; returns null if unusable. */
export function sanitizeTherapeuticDesign(raw: unknown): TherapeuticDesign | null {
  if (!isObject(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id.startsWith('TD-')) return null;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  if (typeof raw.targetType !== 'string') return null;
  if (typeof raw.targetDescription !== 'string') return null;
  if (typeof raw.deliveryModel !== 'string') return null;
  if (typeof raw.payloadEffect !== 'string') return null;
  if (!isObject(raw.variables)) return null;

  const variables = {
    targetingPreference: Number(raw.variables.targetingPreference) || 0,
    uptake: Number(raw.variables.uptake) || 0,
    therapeuticEffect: Number(raw.variables.therapeuticEffect) || 0,
    immuneResponse: Number(raw.variables.immuneResponse) || 0,
    clearance: Number(raw.variables.clearance) || 0,
    offTargetEffect: Number(raw.variables.offTargetEffect) || 0,
    resistance: Number(raw.variables.resistance) || 0,
    toxicityProxy: Number(raw.variables.toxicityProxy) || 0,
  };

  const intendedOutcome = OUTCOMES.includes(raw.intendedOutcome as TherapeuticIntendedOutcome)
    ? (raw.intendedOutcome as TherapeuticIntendedOutcome)
    : 'growth-suppression';

  const evidence = isObject(raw.evidence)
    ? {
      level: (typeof raw.evidence.level === 'string' ? raw.evidence.level : 'speculative') as TherapeuticDesign['evidence']['level'],
      note: typeof raw.evidence.note === 'string'
        ? raw.evidence.note
        : 'Conceptual therapeutic model — not a real vector construct',
    }
    : { level: 'speculative' as const, note: 'Conceptual therapeutic model — not a real vector construct' };

  return {
    id: raw.id,
    name: raw.name.trim(),
    targetType: raw.targetType as TherapeuticDesign['targetType'],
    targetDescription: raw.targetDescription,
    deliveryModel: raw.deliveryModel as TherapeuticDesign['deliveryModel'],
    payloadEffect: raw.payloadEffect as TherapeuticDesign['payloadEffect'],
    intendedOutcome,
    targetCellModelId: typeof raw.targetCellModelId === 'string' ? raw.targetCellModelId : undefined,
    variables,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    evidence,
  };
}

export function sanitizeTherapeuticDesigns(raw: unknown): TherapeuticDesign[] {
  if (!Array.isArray(raw)) return [];
  const out: TherapeuticDesign[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const design = sanitizeTherapeuticDesign(item);
    if (!design || seen.has(design.id)) continue;
    seen.add(design.id);
    out.push(design);
  }
  return out;
}

export function loadTherapeuticDesignsFromStorage(): TherapeuticDesign[] {
  try {
    const raw = localStorage.getItem(THERAPEUTIC_DESIGNS_STORAGE_KEY);
    if (!raw) return [];
    return sanitizeTherapeuticDesigns(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function persistTherapeuticDesigns(designs: TherapeuticDesign[]): PersistResult {
  try {
    const clean = sanitizeTherapeuticDesigns(designs);
    localStorage.setItem(THERAPEUTIC_DESIGNS_STORAGE_KEY, JSON.stringify(clean));
    // Read-back verifies the browser actually accepted the write
    const verify = loadTherapeuticDesignsFromStorage();
    if (verify.length < clean.length) {
      return {
        ok: false,
        error: 'Save appeared incomplete after write — browser storage may be full or blocked. Try clearing old simulations in Settings, then save again.',
      };
    }
    const missing = clean.filter((d) => !verify.some((v) => v.id === d.id));
    if (missing.length) {
      return {
        ok: false,
        error: `Could not confirm saved design “${missing[0]!.name}” in browser storage. Storage may be blocked.`,
      };
    }
    return { ok: true };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return {
        ok: false,
        error: 'Browser storage is full (QuotaExceeded). Clear demo data or old simulation runs in Settings, then save the design again.',
      };
    }
    return {
      ok: false,
      error: 'Could not save to browser storage. Check that cookies/local storage are allowed for this site, then try again.',
    };
  }
}

/** Merge workspace-blob designs with the dedicated designs key (dedicated wins on id conflict). */
export function mergeTherapeuticDesignLists(
  fromWorkspace: unknown,
  fromDedicated: TherapeuticDesign[],
): TherapeuticDesign[] {
  const workspace = sanitizeTherapeuticDesigns(fromWorkspace);
  const byId = new Map<string, TherapeuticDesign>();
  for (const d of workspace) byId.set(d.id, d);
  for (const d of fromDedicated) byId.set(d.id, d);
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
