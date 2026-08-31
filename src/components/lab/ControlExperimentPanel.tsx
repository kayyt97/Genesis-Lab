import type { ControlConfiguration } from '../../types/experimentWorkspace';
import type { EnvironmentConditions, Simulation } from '../../types';

interface ControlExperimentPanelProps {
  experimentalName: string;
  controlConfig: ControlConfiguration | null;
  experimentalSim: Simulation | null;
  controlSim: Simulation | null;
  experimentalEnv: EnvironmentConditions;
  onModeChange: (mode: ControlConfiguration['mode'], reason?: string) => void;
  onUseBaseline: () => void;
}

export function ControlExperimentPanel({
  experimentalName,
  controlConfig,
  experimentalSim,
  controlSim,
  experimentalEnv,
  onModeChange,
  onUseBaseline,
}: ControlExperimentPanelProps) {
  const expV = experimentalSim?.organismState.viability;
  const ctrlV = controlSim?.organismState.viability;
  const isNa = controlConfig?.mode === 'none-not-applicable';

  return (
    <div className="control-workstation">
      <h4 className="control-workstation-title">Control experiment</h4>

      {isNa ? (
        <p className="text-muted control-na-msg">
          No control — marked not applicable{controlConfig?.reason ? `: ${controlConfig.reason}` : ''}.
        </p>
      ) : controlConfig ? (
        <dl className="control-meta-dl">
          <dt>Control ID</dt>
          <dd>{controlConfig.sampleId}</dd>
          <dt>Biological sample</dt>
          <dd>{controlConfig.displayName}</dd>
          <dt>Conditions</dt>
          <dd>pH {controlConfig.environment.ph} · {controlConfig.environment.temperature}°C · O₂ {controlConfig.environment.oxygen}% · No treatment</dd>
          {ctrlV !== undefined && (
            <>
              <dt>Viability</dt>
              <dd>{ctrlV.toFixed(1)}%</dd>
            </>
          )}
        </dl>
      ) : (
        <p className="text-muted">Control not configured.</p>
      )}

      <div className="control-comparison compact">
        <div className="control-pill experimental">
          <span className="pill-label">Experimental</span>
          <span>{experimentalName}</span>
          <span>T: {experimentalEnv.temperature}°C · pH: {experimentalEnv.ph}</span>
          {expV !== undefined && <span>Viability: {expV.toFixed(1)}%</span>}
        </div>
        {!isNa && controlConfig && (
          <div className="control-pill control">
            <span className="pill-label">Control</span>
            <span>{controlConfig.displayName}</span>
            <span>T: {controlConfig.environment.temperature}°C · pH: {controlConfig.environment.ph}</span>
            {ctrlV !== undefined && <span>Viability: {ctrlV.toFixed(1)}%</span>}
          </div>
        )}
      </div>

      <div className="control-actions">
        <button type="button" className="filter-btn" onClick={onUseBaseline}>Use baseline as control</button>
        <button type="button" className="filter-btn" onClick={() => onModeChange('custom')}>Edit control settings</button>
        <button
          type="button"
          className="filter-btn"
          onClick={() => {
            const reason = window.prompt('Reason control is not applicable:');
            if (reason?.trim()) onModeChange('none-not-applicable', reason.trim());
          }}
        >
          No control / Not applicable
        </button>
      </div>
    </div>
  );
}
