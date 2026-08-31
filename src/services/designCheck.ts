import type { EnvironmentConditions } from '../types';

export interface DesignCheckItem {
  id: string;
  status: 'pass' | 'warn' | 'info';
  label: string;
  explanation: string;
}

export function runExperimentalDesignCheck(
  env: EnvironmentConditions,
  baselineEnv: EnvironmentConditions,
  hasControl: boolean,
  replicateCount: number,
): DesignCheckItem[] {
  const items: DesignCheckItem[] = [];

  items.push({
    id: 'control',
    status: hasControl ? 'pass' : 'warn',
    label: hasControl ? 'Control included' : 'No control group',
    explanation: hasControl
      ? 'A control condition is defined for comparison.'
      : 'Without a control, it may be difficult to attribute changes to a specific variable.',
  });

  items.push({
    id: 'baseline',
    status: 'pass',
    label: 'Baseline recorded',
    explanation: 'Current environment parameters are captured as the experimental baseline.',
  });

  const changedVars: string[] = [];
  (Object.keys(env) as (keyof EnvironmentConditions)[]).forEach((k) => {
    if (env[k] !== baselineEnv[k]) changedVars.push(k);
  });

  if (changedVars.length === 1) {
    items.push({
      id: 'variable',
      status: 'pass',
      label: `Test variable identified: ${changedVars[0]}`,
      explanation: 'One primary variable differs from baseline — attribution is clearer.',
    });
  } else if (changedVars.length > 1) {
    items.push({
      id: 'multi',
      status: 'warn',
      label: 'Multiple variables changed simultaneously',
      explanation: `Changed: ${changedVars.join(', ')}. Attributing results to one specific variable may be difficult.`,
    });
  } else {
    items.push({
      id: 'variable',
      status: 'info',
      label: 'No variables changed from baseline yet',
      explanation: 'Adjust an environmental parameter to define your test condition.',
    });
  }

  items.push({
    id: 'replicates',
    status: replicateCount >= 2 ? 'pass' : 'info',
    label: replicateCount >= 2 ? `Replicates: ${replicateCount}` : 'Replicates not included',
    explanation:
      replicateCount >= 2
        ? 'Multiple replicate runs help assess modelled variation.'
        : 'Replicates are optional but improve confidence in simulated comparisons.',
  });

  return items;
}

export function generateAutoControlEnvironment(
  experimental: EnvironmentConditions,
): EnvironmentConditions {
  return {
    ...experimental,
    // Control preserves baseline — reset incubation time for fair comparison
    incubationTime: 0,
  };
}

export function countChangedVariables(
  a: EnvironmentConditions,
  b: EnvironmentConditions,
): string[] {
  return (Object.keys(a) as (keyof EnvironmentConditions)[]).filter((k) => a[k] !== b[k]);
}
