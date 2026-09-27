import {
  EDUCATIONAL_SIMULATION_LABEL,
  NEVER_METASTASIS_PREVENTED,
  type TumourResponseMonitoring,
  type MovementStatusKind,
} from '../../services/tumourResponseMonitoring';
import { SimpleLineChart } from '../ui/Metric';
import { Button } from '../ui/Button';

interface TumourResponseMonitoringPanelProps {
  monitoring: TumourResponseMonitoring;
  onSavePairedComparison?: () => void;
  saveFeedback?: string | null;
}

function statusLabel(status: MovementStatusKind): string {
  switch (status) {
    case 'slowed':
      return 'Slowed';
    case 'stopped-within-range':
      return 'Stopped within measurement range';
    case 'continued':
      return 'Continued';
    default:
      return status;
  }
}

export function TumourResponseMonitoringPanel({
  monitoring,
  onSavePairedComparison,
  saveFeedback,
}: TumourResponseMonitoringPanelProps) {
  return (
    <section
      className="tumour-response-monitor"
      aria-label={`${monitoring.title} educational paired comparison`}
    >
      <header className="tumour-response-header">
        <p className="tumour-movement-edu-badge" role="status">
          {EDUCATIONAL_SIMULATION_LABEL}
        </p>
        <h3 className="tumour-response-title">{monitoring.title}</h3>
        <p className="text-muted tumour-response-disclaimer" role="note">
          Every value is a <strong>{monitoring.disclaimer}</strong>. Movement, invasion, population,
          and viability are distinct measures. {NEVER_METASTASIS_PREVENTED}
        </p>
      </header>

      <div className="tumour-response-groups" role="group" aria-label="Treated versus untreated control">
        <div className="tumour-movement-group treated">
          <h4>{monitoring.treatedGroupLabel}</h4>
          <dl className="tumour-metric-dl">
            {monitoring.designName && (
              <div>
                <dt>Conceptual therapeutic</dt>
                <dd>
                  {monitoring.designName}
                  {monitoring.intendedOutcome ? ` · ${monitoring.intendedOutcome}` : ''}
                </dd>
              </div>
            )}
            <div>
              <dt>Seed</dt>
              <dd>{monitoring.seed ?? 'n/a'}</dd>
            </div>
            <div>
              <dt>Simulation version</dt>
              <dd>{monitoring.genesisLabVersion}</dd>
            </div>
          </dl>
        </div>
        <div className="tumour-movement-group control">
          <h4>{monitoring.controlGroupLabel}</h4>
          <dl className="tumour-metric-dl">
            <div>
              <dt>Treatment</dt>
              <dd>None — matched untreated control</dd>
            </div>
            <div>
              <dt>Seed</dt>
              <dd>{monitoring.match.checked.seed.control ?? 'n/a'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {!monitoring.comparisonAllowed ? (
        <div className="tumour-response-mismatch" role="alert">
          <strong>Paired comparison blocked — settings mismatch</strong>
          <p>
            Treatment should be the only difference. The following starting conditions do not match;
            results below are flagged so they are not read as a clean treated-versus-control comparison.
          </p>
          <ul>
            {monitoring.match.mismatches.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="tumour-response-match-ok" role="status">
          Matched pair: identical starting cell count, pH, temperature, oxygen, duration, simulation
          version, and seed. Treatment is the only difference.
        </p>
      )}

      {monitoring.movementStatus && monitoring.comparisonAllowed && (
        <div className="tumour-response-movement-status" role="status">
          <h4>Movement status: {statusLabel(monitoring.movementStatus.status)}</h4>
          <p>{monitoring.movementStatus.plainEnglish}</p>
          <dl className="tumour-movement-summary">
            <div>
              <dt>Treated end</dt>
              <dd>
                {monitoring.movementStatus.treatedEnd === null
                  ? 'not measured'
                  : `${monitoring.movementStatus.treatedEnd.toFixed(1)}%`}
              </dd>
            </div>
            <div>
              <dt>Control end</dt>
              <dd>
                {monitoring.movementStatus.controlEnd === null
                  ? 'not measured'
                  : `${monitoring.movementStatus.controlEnd.toFixed(1)}%`}
              </dd>
            </div>
            <div>
              <dt>% vs control</dt>
              <dd>{monitoring.movementStatus.percentDifferenceVsControl}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="tumour-response-channels" role="list">
        {monitoring.channels.map((ch) => (
          <article
            key={ch.key}
            className={`tumour-response-channel assessment-${ch.assessment}`}
            role="listitem"
            aria-label={`${ch.label} response channel`}
          >
            <h4>{ch.label}</h4>
            {ch.assessment === 'not-assessed' ? (
              <p className="tumour-response-not-assessed">{ch.note}</p>
            ) : (
              <>
                <table className="tumour-report-table" aria-label={`${ch.label} start end change`}>
                  <thead>
                    <tr>
                      <th scope="col">Group</th>
                      <th scope="col">Start</th>
                      <th scope="col">End</th>
                      <th scope="col">Change (Δ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Treated</th>
                      <td>{ch.displayTreatedStart}</td>
                      <td>{ch.displayTreatedEnd}</td>
                      <td>{ch.displayTreatedDelta}</td>
                    </tr>
                    <tr>
                      <th scope="row">Untreated control</th>
                      <td>{ch.displayControlStart}</td>
                      <td>{ch.displayControlEnd}</td>
                      <td>{ch.displayControlDelta}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="tumour-response-pct">
                  Treated vs control difference:{' '}
                  <strong>{ch.percentDifferenceVsControl}</strong>
                </p>
                {ch.chartTreated.length >= 1 && (
                  <div className="tumour-response-chart">
                    <SimpleLineChart
                      data={ch.chartTreated}
                      compareData={ch.chartControl.length >= 2 ? ch.chartControl : undefined}
                      compareLabel="Untreated control"
                      label={`${ch.label} over simulated time`}
                      color={
                        ch.key === 'viability'
                          ? '#66bb6a'
                          : ch.key === 'population'
                            ? '#4fc3f7'
                            : '#f9a825'
                      }
                      yUnit={ch.key === 'population' ? '' : '%'}
                    />
                  </div>
                )}
                <p className="text-muted tumour-response-channel-note">{ch.note}</p>
              </>
            )}
          </article>
        ))}
      </div>

      <p className="text-muted" role="note">
        {monitoring.healthyCellEffects}
      </p>

      {onSavePairedComparison && (
        <div className="tumour-response-save">
          <Button variant="secondary" onClick={onSavePairedComparison}>
            Save paired comparison
          </Button>
          {monitoring.savedAt && (
            <p className="text-muted">Last saved: {new Date(monitoring.savedAt).toLocaleString()}</p>
          )}
          {saveFeedback && (
            <p className="tumour-response-save-feedback" role="status">
              {saveFeedback}
            </p>
          )}
        </div>
      )}

      <details className="tumour-response-settings">
        <summary>Paired-run settings</summary>
        <p>{monitoring.settingsSummary}</p>
      </details>

      <ul className="tumour-movement-limitations">
        {monitoring.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </section>
  );
}
