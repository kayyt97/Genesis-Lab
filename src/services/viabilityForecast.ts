import type { EnvironmentConditions } from '../types';
import type { BiologicalEntity } from '../types';
import type { TieredText } from '../types/language';
import type { EvidenceMeta } from '../types/evidence';
import { resolveTiered } from '../content/language';
import type { LanguageLevel } from '../types/language';

export type ViabilityCategory =
  | 'favourable'
  | 'moderate'
  | 'stressful'
  | 'critical'
  | 'insufficient-data';

export interface ViabilityForecast {
  modelledViability: number;
  modelledDieOff: number;
  category: ViabilityCategory;
  limitingFactors: string[];
  explanation: TieredText;
  evidence: EvidenceMeta;
  confidence: 'high' | 'moderate' | 'low' | 'insufficient';
}

function computeStress(
  env: EnvironmentConditions,
  organism: BiologicalEntity | undefined,
): { stress: number; factors: { name: string; contribution: number }[] } {
  if (!organism) {
    return { stress: 0.5, factors: [{ name: 'Unknown organism preferences', contribution: 0.5 }] };
  }

  const pref = organism.preferredEnvironment ?? {};
  const factors: { name: string; contribution: number }[] = [];
  let stress = 0;

  const optimalTemp = pref.temperature ?? 37;
  const tempDiff = Math.abs(env.temperature - optimalTemp);
  const tempStress = Math.min(tempDiff / 20, 0.4);
  if (tempStress > 0.05) factors.push({ name: 'Temperature', contribution: tempStress });
  stress += tempStress;

  const optimalPh = pref.ph ?? 7.0;
  const phDiff = Math.abs(env.ph - optimalPh);
  const phStress = Math.min(phDiff / 4, 0.3);
  if (phStress > 0.05) factors.push({ name: 'pH', contribution: phStress });
  stress += phStress;

  if (pref.oxygen !== undefined) {
    const o2Diff = Math.abs(env.oxygen - pref.oxygen);
    const o2Stress = Math.min(o2Diff / 50, 0.2);
    if (o2Stress > 0.05) factors.push({ name: 'Oxygen', contribution: o2Stress });
    stress += o2Stress;
  }

  if (env.nutrientAvailability < 30) {
    const nStress = (30 - env.nutrientAvailability) / 100;
    factors.push({ name: 'Nutrient availability', contribution: nStress });
    stress += nStress;
  }

  if (env.salinity > 20 && (pref.salinity ?? 0) < 10) {
    const sStress = Math.min((env.salinity - 20) / 80, 0.25);
    factors.push({ name: 'Salinity', contribution: sStress });
    stress += sStress;
  }

  if (env.radiationExposure > 0) {
    const rStress = Math.min(env.radiationExposure / 10, 0.5);
    factors.push({ name: 'Radiation exposure', contribution: rStress });
    stress += rStress;
  }

  factors.sort((a, b) => b.contribution - a.contribution);
  return { stress: Math.min(stress, 1), factors };
}

function categoryFromViability(v: number): ViabilityCategory {
  if (v >= 80) return 'favourable';
  if (v >= 60) return 'moderate';
  if (v >= 35) return 'stressful';
  return 'critical';
}

export function forecastViability(
  env: EnvironmentConditions,
  organism: BiologicalEntity | undefined,
): ViabilityForecast {
  if (!organism) {
    return {
      modelledViability: 0,
      modelledDieOff: 0,
      category: 'insufficient-data',
      limitingFactors: [],
      explanation: {
        simple: 'Select an organism to see a modelled viability estimate for the current environment.',
        standard: 'Insufficient organism metadata to produce a modelled viability forecast.',
        technical: 'Organism reference absent; forecast requires preferredEnvironment profile.',
      },
      evidence: { level: 'insufficient-information' },
      confidence: 'insufficient',
    };
  }

  const { stress, factors } = computeStress(env, organism);
  const pref = organism.preferredEnvironment ?? {};
  const modelledViability = Math.max(0, Math.min(100, 95 - stress * 85));
  const modelledDieOff = 100 - modelledViability;
  const limitingFactors = factors.slice(0, 3).map((f) => f.name);

  const topFactor = limitingFactors[0] ?? 'environmental balance';
  const o2Note =
    env.oxygen < 5
      ? 'Low oxygen may limit aerobic metabolism in organisms that depend on oxygen for energy production.'
      : env.oxygen > 30
        ? 'High oxygen can increase oxidative stress in some cell types.'
        : '';

  const explanation: TieredText = {
    simple: `Under these settings, the teaching model estimates about ${modelledViability.toFixed(0)}% viability for ${organism.commonName}. The main concern is ${topFactor.toLowerCase()}. ${o2Note} This is a model guess, not a measured result.`,
    standard: `Modelled viability estimate: ${modelledViability.toFixed(1)}% for ${organism.commonName} under current parameters. Primary limiting factor: ${topFactor}. Stress index (prototype): ${(stress * 100).toFixed(0)}%. Educational model only — not experimentally validated.`,
    technical: `Deterministic stress function σ=${stress.toFixed(3)} derived from ΔT, ΔpH, O₂, nutrients, salinity, radiation vs organism preferredEnvironment. Forecast viability V=95−85σ. Dominant terms: ${limitingFactors.join(', ') || 'none'}. Model-derived; not probabilistic survival data.`,
  };

  return {
    modelledViability,
    modelledDieOff,
    category: categoryFromViability(modelledViability),
    limitingFactors,
    explanation,
    evidence: {
      level: 'model-derived',
      note: 'Predicted survival under current parameters — educational prototype model',
    },
    confidence: pref.temperature !== undefined ? 'moderate' : 'low',
  };
}

export function formatForecastExplanation(
  forecast: ViabilityForecast,
  level: LanguageLevel,
): string {
  return resolveTiered(forecast.explanation, level);
}

export function getCategoryLabel(cat: ViabilityCategory): string {
  const labels: Record<ViabilityCategory, string> = {
    favourable: 'Favourable (modelled)',
    moderate: 'Moderate stress (modelled)',
    stressful: 'Stressful (modelled)',
    critical: 'Critical (modelled)',
    'insufficient-data': 'Insufficient data',
  };
  return labels[cat];
}
