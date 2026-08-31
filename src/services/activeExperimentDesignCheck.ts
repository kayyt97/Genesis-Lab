import type { ActiveExperimentSetup } from '../types/experimentWorkspace';
import type { EnvironmentConditions } from '../types';
import type { DesignCheckItem } from './designCheck';
import { runExperimentalDesignCheck, countChangedVariables } from './designCheck';

/** Design check for the ACTIVE experiment workspace — not teaching examples. */
export function runActiveExperimentDesignCheck(
  setup: ActiveExperimentSetup | null,
  env: EnvironmentConditions,
  controlEnv: EnvironmentConditions,
  replicateCount: number,
): DesignCheckItem[] {
  const controlMode = setup?.control?.mode;
  const hasConfiguredControl = controlMode === 'auto-baseline' || controlMode === 'custom';
  const controlNotApplicable = controlMode === 'none-not-applicable';

  const base = runExperimentalDesignCheck(
    env,
    controlEnv,
    hasConfiguredControl,
    replicateCount,
  ).filter((item) => item.id !== 'control');

  if (controlNotApplicable) {
    base.unshift({
      id: 'control',
      status: 'info',
      label: 'No control — marked not applicable',
      explanation: setup?.control?.reason
        ? `Reason recorded: ${setup.control.reason}`
        : 'The active experiment explicitly marks a control as not applicable.',
    });
  } else if (hasConfiguredControl) {
    base.unshift({
      id: 'control',
      status: 'pass',
      label: 'Control configured',
      explanation: `${setup!.control.sampleId}: ${setup!.control.displayName} (${setup!.control.mode})`,
    });
  } else {
    base.unshift({
      id: 'control',
      status: 'warn',
      label: 'Missing control',
      explanation: 'The active experiment has no configured control and is not marked not applicable.',
    });
  }

  if (setup) {
    base.unshift({
      id: 'experiment',
      status: 'pass',
      label: `Active experiment: ${setup.sampleId}`,
      explanation: `Sample ${setup.sampleDisplayName}; lifecycle ${setup.lifecycle}`,
    });
  }

  const changed = countChangedVariables(env, controlEnv);
  if (changed.length > 0 && hasConfiguredControl) {
    base.push({
      id: 'control-diff',
      status: 'info',
      label: 'Experimental vs control environment differ',
      explanation: `Compared parameters: ${changed.join(', ') || 'none yet'}`,
    });
  }

  return base;
}
