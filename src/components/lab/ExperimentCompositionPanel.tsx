import type { ActiveExperimentSetup } from '../../types/experimentWorkspace';

const ROLE_LABELS: Record<string, string> = {
  'environment-component': 'Environment component',
  'medium-component': 'Medium component',
  nutrient: 'Nutrient',
  treatment: 'Treatment',
  analyte: 'Analyte',
  'sample-component': 'Sample component',
};

interface ExperimentCompositionPanelProps {
  setup: ActiveExperimentSetup;
  controlConfigured: boolean;
  onEditControl?: () => void;
}

export function ExperimentCompositionPanel({ setup, controlConfigured, onEditControl }: ExperimentCompositionPanelProps) {
  const medium = setup.transferredMolecules.filter((m) => m.role === 'medium-component' || m.role === 'environment-component');
  const added = setup.transferredMolecules.filter((m) => m.role === 'nutrient' || m.role === 'sample-component');
  const treatments = setup.transferredMolecules.filter((m) => m.role === 'treatment');
  const analytes = setup.transferredMolecules.filter((m) => m.role === 'analyte');

  return (
    <div className="experiment-composition">
      <h4 className="composition-heading">Current experiment</h4>
      <dl className="composition-dl">
        <dt>Biological sample</dt>
        <dd>{setup.sampleId}: {setup.sampleDisplayName}</dd>
        <dt>Environment / medium</dt>
        <dd>{medium.length ? medium.map((m) => `${m.name} (${ROLE_LABELS[m.role]})`).join(', ') : 'Default simulated medium'}</dd>
        <dt>Added substances</dt>
        <dd>{added.length ? added.map((m) => m.name).join(', ') : 'None'}</dd>
        <dt>Treatments</dt>
        <dd>{treatments.length ? treatments.map((m) => m.name).join(', ') : 'None'}</dd>
        <dt>Analytes</dt>
        <dd>{analytes.length ? analytes.map((m) => m.name).join(', ') : 'None'}</dd>
        <dt>Controls</dt>
        <dd>
          {setup.control?.mode === 'none-not-applicable'
            ? `Not applicable — ${setup.control?.reason ?? 'reason not recorded'}`
            : controlConfigured
              ? `${setup.control?.sampleId}: ${setup.control?.displayName} (${setup.control?.mode})`
              : 'Not configured'}
          {onEditControl && (
            <button type="button" className="link-btn" onClick={onEditControl}>Edit control settings</button>
          )}
        </dd>
        <dt>Status</dt>
        <dd>{setup.lifecycle}</dd>
      </dl>
    </div>
  );
}
