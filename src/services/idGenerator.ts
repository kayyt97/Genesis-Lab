/** Human-readable stable IDs for samples, controls, runs, and experiments */

const counters: Record<string, number> = {
  SAMPLE: 0,
  CTRL: 0,
  RUN: 0,
  EXP: 0,
};

export function nextStableId(prefix: 'SAMPLE' | 'CTRL' | 'RUN' | 'EXP', existingIds: string[] = []): string {
  const maxFromExisting = existingIds
    .filter((id) => id.startsWith(`${prefix}-`))
    .map((id) => parseInt(id.split('-')[1] ?? '0', 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  counters[prefix] = Math.max(counters[prefix], maxFromExisting) + 1;
  return `${prefix}-${String(counters[prefix]).padStart(3, '0')}`;
}

export function formatDisplayId(id: string, displayName: string): string {
  return `${id} — ${displayName}`;
}
