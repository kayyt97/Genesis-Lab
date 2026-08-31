import type { GlossaryEntry } from '../types';
import type { LanguageLevel, TieredText } from '../types/language';

export function resolveTiered(content: TieredText | string, level: LanguageLevel): string {
  if (typeof content === 'string') return content;
  return content[level];
}

export function getGlossaryText(entry: GlossaryEntry, level: LanguageLevel): string {
  if (entry.tiered) return entry.tiered[level];
  switch (level) {
    case 'simple':
      return entry.plainEnglish;
    case 'technical':
      return entry.scientificDefinition;
    default:
      return entry.plainEnglish;
  }
}

export function getGlossaryTitle(entry: GlossaryEntry, level: LanguageLevel): string {
  if (level === 'simple' && entry.simpleTitle) return entry.simpleTitle;
  return entry.term;
}

/** Example tiered explanation pattern for simulation results */
export const SIMULATION_DISCLAIMER: TieredText = {
  simple:
    'These numbers come from a teaching model in Genesis Lab. They are not real lab measurements and cannot be used for medical decisions.',
  standard:
    'Results are produced by a prototype educational simulation using simplified rules. They do not represent validated biological predictions.',
  technical:
    'Outputs derive from a deterministic prototype model with explicit simplifying assumptions. Not suitable for clinical inference or publication without validated methods.',
};

export const GENOME_PRIVACY_NOTICE: TieredText = {
  simple:
    'Your DNA file stays on your computer. Genesis Lab does not send it anywhere else. We only read what is in the file while you use this tool.',
  standard:
    'Uploaded genotype files are processed locally in your browser. No genomic data is transmitted to external servers unless you explicitly export it.',
  technical:
    'Genotype parsing executes client-side via FileReader API. Parsed variants reside in session/local state only; no network egress occurs during upload or analysis.',
};

export const GENOME_NOT_DIAGNOSIS: TieredText = {
  simple:
    'Genesis Lab helps you learn about genes. It does not diagnose illnesses or tell you what medical treatment to use.',
  standard:
    'Genomic features in Genesis Lab are educational. This is not clinical diagnosis or medical advice.',
  technical:
    'Consumer genotype visualisation lacks comprehensive coverage, phasing, and clinical validation required for diagnostic interpretation.',
};
