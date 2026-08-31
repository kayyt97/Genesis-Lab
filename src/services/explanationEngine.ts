import type { EnvironmentConditions, OrganismSimulationState } from '../types';
import type { TieredText } from '../types/language';
import type { ComparisonSummary } from '../types/scientific';
import { resolveTiered } from '../content/language';

interface ChangeAnalysisInput {
  paramName: string;
  beforeValue: number;
  afterValue: number;
  beforeState: OrganismSimulationState;
  afterState: OrganismSimulationState;
  beforeEnv: EnvironmentConditions;
  afterEnv: EnvironmentConditions;
}

export function analyzeParameterChange(input: ChangeAnalysisInput): TieredText | null {
  const { paramName, beforeValue, afterValue, beforeState, afterState } = input;
  if (beforeValue === afterValue) return null;

  const viabilityDelta = afterState.viability - beforeState.viability;
  const popRatio = afterState.population / Math.max(beforeState.population, 1);
  const stressDelta = afterState.stress - beforeState.stress;

  const direction = afterValue > beforeValue ? 'increased' : 'decreased';
  const absChange = Math.abs(afterValue - beforeValue);

  let primaryEffect = '';
  if (Math.abs(viabilityDelta) > 1) {
    primaryEffect = `viability ${viabilityDelta > 0 ? 'rose' : 'fell'} by ${Math.abs(viabilityDelta).toFixed(1)}%`;
  } else if (Math.abs(popRatio - 1) > 0.05) {
    primaryEffect = `population ${popRatio > 1 ? 'increased' : 'decreased'} (${(popRatio * 100).toFixed(0)}% of prior)`;
  } else if (Math.abs(stressDelta) > 1) {
    primaryEffect = `stress index ${stressDelta > 0 ? 'rose' : 'fell'} by ${Math.abs(stressDelta).toFixed(1)}`;
  } else {
    return {
      simple: `Changing ${paramName} did not produce a large change in this teaching model.`,
      standard: `Within this prototype model, changing ${paramName} produced only minor measurable differences.`,
      technical: `Parameter perturbation Δ${paramName}=${absChange.toFixed(2)} yielded sub-threshold state transitions in the deterministic prototype engine.`,
    };
  }

  return {
    simple: `When ${paramName} ${direction === 'increased' ? 'went up' : 'went down'}, ${primaryEffect}. In this teaching model, ${paramName} was the main setting you changed.`,
    standard: `${paramName} ${direction} by ${absChange.toFixed(2)} (model units). Within this educational model, the largest associated change was: ${primaryEffect}. This explanation is derived from model state differences, not clinical evidence.`,
    technical: `Independent perturbation: ${paramName} ${direction} (Δ=${absChange.toFixed(3)}). Model-derived outcome shift: ${primaryEffect}. Causal attribution limited to explicit prototype rules coupling environment → stress → growth/viability.`,
  };
}

export function buildComparisonSummary(
  control: OrganismSimulationState,
  experimental: OrganismSimulationState,
  controlEnv: EnvironmentConditions,
  expEnv: EnvironmentConditions,
): ComparisonSummary {
  const differing: string[] = [];
  const constant: string[] = [];

  (Object.keys(controlEnv) as (keyof EnvironmentConditions)[]).forEach((k) => {
    if (controlEnv[k] !== expEnv[k]) differing.push(k);
    else constant.push(k);
  });

  const outcomeChanges: ComparisonSummary['outcomeChanges'] = [];

  const vDelta = experimental.viability - control.viability;
  outcomeChanges.push({
    metric: 'Viability',
    direction: vDelta > 0.5 ? 'increased' : vDelta < -0.5 ? 'decreased' : 'unchanged',
    magnitude: `${Math.abs(vDelta).toFixed(1)}%`,
    uncertainty: 'Model-derived; not statistically validated',
  });

  const pRatio = experimental.population / Math.max(control.population, 1);
  outcomeChanges.push({
    metric: 'Population',
    direction: pRatio > 1.05 ? 'increased' : pRatio < 0.95 ? 'decreased' : 'unchanged',
    magnitude: `${(pRatio * 100).toFixed(0)}% of control`,
    uncertainty: 'Prototype model estimate',
  });

  const explanation: TieredText = {
    simple: `The test condition differed in: ${differing.join(', ') || 'none'}. Viability and population changed according to the teaching model.`,
    standard: `Conditions differed in ${differing.length} environmental variable(s). Measured outcomes changed in direction and magnitude shown below. Comparison is model-derived, not a clinical trial result.`,
    technical: `Differential environment vector: [${differing.join(', ')}]. Held constant: [${constant.join(', ')}]. Outcome deltas computed from deterministic prototype state functions.`,
  };

  return {
    differingVariables: differing,
    constantVariables: constant,
    outcomeChanges,
    explanation,
    evidence: { level: 'model-derived', note: 'Educational simulation comparison' },
  };
}

export function resolveComparisonText(summary: ComparisonSummary, level: import('../types/language').LanguageLevel): string {
  return resolveTiered(summary.explanation, level);
}

export function explainSimulationResult(
  changedParams: ChangeAnalysisInput[],
  level: import('../types/language').LanguageLevel,
): string {
  if (changedParams.length === 0) {
    return resolveTiered(
      {
        simple: 'No parameter changes were detected to explain.',
        standard: 'No parameter differences found between runs.',
        technical: 'Empty perturbation set; causal attribution unavailable.',
      },
      level,
    );
  }
  const analyses = changedParams
    .map(analyzeParameterChange)
    .filter((a): a is TieredText => a !== null);
  if (analyses.length === 0) {
    return resolveTiered(
      {
        simple: 'The model cannot identify a clear cause for the difference.',
        standard: 'Causality cannot be established from the current model inputs.',
        technical: 'Insufficient state delta for causal attribution within prototype rules.',
      },
      level,
    );
  }
  return analyses.map((a) => resolveTiered(a, level)).join(' ');
}
