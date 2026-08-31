/** Global language complexity control */

export type LanguageLevel = 'simple' | 'standard' | 'technical';

export interface TieredText {
  simple: string;
  standard: string;
  technical: string;
}

export const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, string> = {
  simple: 'Basic',
  standard: 'Standard',
  technical: 'Technical',
};
