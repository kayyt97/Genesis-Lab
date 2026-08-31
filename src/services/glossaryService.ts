import { glossaryEntries } from '../data/glossary';
import type { GlossaryEntry, GlossaryCategory } from '../types';

export const GLOSSARY_CATEGORIES: { value: GlossaryCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'atomic', label: 'Atomic' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'genetics', label: 'Genetics' },
  { value: 'biology', label: 'Biology' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'experiments', label: 'Experiments' },
  { value: 'measurements', label: 'Measurements' },
  { value: 'microscopy', label: 'Microscopy' },
  { value: 'pathways', label: 'Pathways' },
  { value: 'results', label: 'Results' },
  { value: 'safety', label: 'Safety' },
];

export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
  const normalized = term.toLowerCase().trim();
  return glossaryEntries.find(
    (e) =>
      e.term.toLowerCase() === normalized ||
      e.id === normalized ||
      e.term.toLowerCase().replace(/\s+/g, '-') === normalized ||
      e.aliases?.some((a) => a.toLowerCase() === normalized),
  );
}

export function searchGlossary(query: string, category: GlossaryCategory | 'all' = 'all'): GlossaryEntry[] {
  const q = query.toLowerCase().trim();
  let pool = category === 'all' ? glossaryEntries : glossaryEntries.filter((e) => e.categories.includes(category));
  if (!q) return pool;
  return pool.filter(
    (e) =>
      e.term.toLowerCase().includes(q) ||
      e.plainEnglish.toLowerCase().includes(q) ||
      e.scientificDefinition.toLowerCase().includes(q) ||
      e.relatedTerms.some((t) => t.toLowerCase().includes(q)) ||
      e.aliases?.some((a) => a.toLowerCase().includes(q)),
  );
}

export function getGlossaryHelpText(term: string, level: 'simple' | 'standard' | 'technical'): string {
  const entry = findGlossaryEntry(term);
  if (!entry) return '';
  if (level === 'simple') return entry.plainEnglish;
  if (level === 'technical') return entry.scientificDefinition;
  return entry.scientificDefinition.length > entry.plainEnglish.length
    ? `${entry.plainEnglish} ${entry.scientificDefinition}`
    : entry.plainEnglish;
}
