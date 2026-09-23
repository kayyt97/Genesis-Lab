import type { OrganismSimulationState, Simulation } from '../../types';
import type { TherapeuticTreatmentConfig } from '../../types';
import {
  SIMULATED_ESTIMATE_LABEL,
  buildComparisonRows,
  buildTumourComparisonReport,
  formatMetricDisplay,
  isTumourCellModel,
  percentDifference,
  readEducationalMetrics,
} from '../../services/tumourCellSimulation';
import { THERAPEUTIC_INTENDED_OUTCOME_LABELS } from '../../types/scientific';
import { SimpleLineChart } from '../ui/Metric';

interface TumourMetricsPanelProps {
  organismId: string;
  organismName: string;
  experimental: OrganismSimulationState | undefined;
  control: OrganismSimulationState | null | undefined;
  experimentalSim: Simulation | null;
  controlSim: Simulation | null;
  treatment: TherapeuticTreatmentConfig | null | undefined;
  seed: number | undefined;
  controlSummary: string;
}

function seriesFromSnapshots(
  sim: Simulation | null,
  key: 'cellMovement' | 'proliferation' | 'viability',
): { x: number; y: number }[] {
  if (!sim) return [];
  const points: { x: number; y: number }[] = [];
  // Include baseline (tick 0) using initial state if no snapshots yet
  if (sim.snapshots.length === 0) {
    const v = sim.organismState[key];
    if (v !== null && v !== undefined) points.push({ x: 0, y: v });
    return points;
  }
  // Baseline before first tick: reconstruct from first snapshot if available isn't tick 0
  const first = sim.snapshots[0];
  if (first && first.tick > 0) {
    // approximate baseline from current untreated path — use first snapshot as earliest recorded
  }
  for (const s of sim.snapshots) {
    const v = s.organismState[key];
    if (v !== null && v !== undefined) points.push({ x: s.timeHours, y: v });
  }
  return points;
}

export function TumourMetricsPanel({
  organismId,
  organismName,
  experimental,
  control,
  experimentalSim,
  controlSim,
  treatment,
  seed,
  controlSummary,
}: TumourMetricsPanelProps) {
  if (!isTumourCellModel(organismId) || !experimental) return null;

  const outcome = treatment?.intendedOutcome;
  const rows = buildComparisonRows(experimental, control ?? null, organismId, outcome);
  const metrics = readEducationalMetrics(experimental, organismId, outcome);
  const controlMetrics = control ? readEducationalMetrics(control, organismId, outcome) : null;

  const timePoints = [
    0,
    ...(experimentalSim?.snapshots.map((s) => s.timeHours) ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const report = buildTumourComparisonReport({
    cellModelId: organismId,
    cellModelName: organismName,
    experimental,
    control: control ?? null,
    treatment,
    seed: seed ?? experimentalSim?.seed ?? 42,
    timePointsHours: timePoints,
    controlSummary,
  });

  return (
    <section className="tumour-metrics-panel" aria-label="Tumour cell educational measurements">
      <h3 className="tumour-metrics-heading">Tumour-cell educational measurements</h3>
      <p className="text-muted tumour-metrics-disclaimer" role="note">
        Every number below is a <strong>{SIMULATED_ESTIMATE_LABEL}</strong>. These values do not predict real
        biological efficacy and do not produce a real vector construct.
      </p>

      {treatment && (
        <p className="tumour-treatment-banner" role="status">
          Experimental treatment: <strong>{treatment.designName}</strong>
          {' · '}
          Intended outcome:{' '}
          <strong>{THERAPEUTIC_INTENDED_OUTCOME_LABELS[treatment.intendedOutcome]}</strong>
          {' · '}
          Control remains untreated.
        </p>
      )}

      <div className="tumour-metric-cards" role="list">
        {metrics.map((m) => {
          const c = controlMetrics?.find((x) => x.key === m.key);
          const pct = percentDifference(m.value, c?.value ?? null);
          return (
            <div key={m.key} className="tumour-metric-card" role="listitem" aria-label={`${m.label} comparison`}>
              <h4>{m.label}</h4>
              <dl className="tumour-metric-dl">
                <div>
                  <dt>Experimental</dt>
                  <dd>{formatMetricDisplay(m)}</dd>
                </div>
                <div>
                  <dt>Control</dt>
                  <dd>{c ? formatMetricDisplay(c) : 'not measured'}</dd>
                </div>
                <div>
                  <dt>% difference vs control</dt>
                  <dd>{pct === null ? 'not measured' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}</dd>
                </div>
              </dl>
              {m.key === 'cellMovement' && (
                <p className="warn-text tumour-metric-note">
                  A drop in viability is not evidence of reduced movement.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="tumour-charts-row" aria-label="Trend charts experimental versus control">
        {(['cellMovement', 'proliferation', 'viability'] as const).map((key) => {
          const label = key === 'cellMovement' ? 'Cell movement' : key === 'proliferation' ? 'Proliferation' : 'Viability';
          const expSeries = seriesFromSnapshots(experimentalSim, key);
          const ctrlSeries = seriesFromSnapshots(controlSim, key);
          const supported = metrics.find((m) => m.key === key)?.status === 'measured'
            || (expSeries.length > 0);
          if (!supported && expSeries.length < 2) {
            return (
              <div key={key} className="chart-empty" aria-label={`${label} not measured`}>
                <span>{label}</span>
                <p>not measured</p>
              </div>
            );
          }
          return (
            <SimpleLineChart
              key={key}
              data={expSeries}
              compareData={ctrlSeries.length >= 2 ? ctrlSeries : undefined}
              compareLabel="Control"
              label={`${label} (exp vs control)`}
              color={key === 'viability' ? '#66bb6a' : key === 'proliferation' ? '#4fc3f7' : '#f9a825'}
              yUnit="%"
            />
          );
        })}
      </div>

      <details className="tumour-comparison-report">
        <summary>Comparison report</summary>
        <div className="tumour-report-body">
          <dl className="detail-dl">
            <dt>Cell model</dt>
            <dd>{report.cellModelName} ({report.cellModelId})</dd>
            <dt>Design name</dt>
            <dd>{report.designName ?? 'None attached'}</dd>
            <dt>Intended outcome</dt>
            <dd>{report.intendedOutcome ?? 'not measured'}</dd>
            <dt>Control conditions</dt>
            <dd>{report.controlConditions}</dd>
            <dt>Seed</dt>
            <dd>{report.seed}</dd>
            <dt>Time points (h)</dt>
            <dd>{report.timePointsHours.map((t) => t.toFixed(1)).join(', ') || '0.0'}</dd>
          </dl>
          <table className="tumour-report-table" aria-label="Experimental versus control metric comparison">
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">Experimental</th>
                <th scope="col">Control</th>
                <th scope="col">% difference</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.metric}>
                  <th scope="row">{r.metric}</th>
                  <td>{r.experimental}</td>
                  <td>{r.control}</td>
                  <td>{r.percentDifference}</td>
                  <td>{r.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4>Limitations</h4>
          <ul>
            {report.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
