import {
  EDUCATIONAL_SIMULATION_LABEL,
  MOVEMENT_NEVER_METASTASIS_CLAIM,
  type TumourCellMovementReadout,
} from '../../services/tumourCellMovementReadout';
import { formatPercentDelta } from '../../services/tumourCellSimulation';
import { SimpleLineChart } from '../ui/Metric';

interface TumourCellMovementReadoutPanelProps {
  readout: TumourCellMovementReadout;
}

function fmtMovement(value: number | null, disclaimer: string): string {
  if (value === null) return 'not measured';
  return `${value.toFixed(1)}% (${disclaimer})`;
}

export function TumourCellMovementReadoutPanel({ readout }: TumourCellMovementReadoutPanelProps) {
  return (
    <section
      className="tumour-movement-readout"
      aria-label={`${readout.title} educational simulation readout`}
    >
      <header className="tumour-movement-header">
        <p className="tumour-movement-edu-badge" role="status">
          {EDUCATIONAL_SIMULATION_LABEL}
        </p>
        <h3 className="tumour-movement-title">{readout.title}</h3>
        <p className="text-muted tumour-movement-disclaimer" role="note">
          Every movement value is a <strong>{readout.disclaimer}</strong>. Movement, cell growth, and
          viability are separate outcomes. {MOVEMENT_NEVER_METASTASIS_CLAIM}
        </p>
      </header>

      <div className="tumour-movement-groups" role="group" aria-label="Treated versus untreated control">
        <div className="tumour-movement-group treated">
          <h4>{readout.treatedGroupLabel}</h4>
          <dl className="tumour-metric-dl">
            <div>
              <dt>Cell movement</dt>
              <dd>{fmtMovement(readout.treatedMovement, readout.disclaimer)}</dd>
            </div>
            {readout.designName && (
              <div>
                <dt>Conceptual therapeutic</dt>
                <dd>
                  {readout.designName}
                  {readout.intendedOutcome ? ` · ${readout.intendedOutcome}` : ''}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="tumour-movement-group control">
          <h4>{readout.controlGroupLabel}</h4>
          <dl className="tumour-metric-dl">
            <div>
              <dt>Cell movement</dt>
              <dd>{fmtMovement(readout.controlMovement, readout.disclaimer)}</dd>
            </div>
            <div>
              <dt>Treatment</dt>
              <dd>None — matched untreated control</dd>
            </div>
          </dl>
        </div>
      </div>

      <dl className="tumour-movement-summary">
        <div>
          <dt>% difference vs control</dt>
          <dd>{readout.percentDifferenceVsControl}</dd>
        </div>
        <div>
          <dt>Base seed</dt>
          <dd>{readout.baseSeed}</dd>
        </div>
        <div>
          <dt>Replicates</dt>
          <dd>{readout.replicateCount}</dd>
        </div>
      </dl>

      {readout.fewerCellsAliveCaveat && (
        <p className="warn-text tumour-movement-caveat" role="status">
          {readout.fewerCellsAliveCaveat}
        </p>
      )}

      <div className="tumour-movement-chart" aria-label="Movement over simulated time">
        <SimpleLineChart
          data={readout.chartTreated}
          compareData={readout.chartControl.length >= 2 ? readout.chartControl : undefined}
          compareLabel={readout.controlGroupLabel}
          label={`${readout.title} over simulated time (treated vs control)`}
          color="#f9a825"
          yUnit="%"
        />
      </div>

      {readout.timeSeries.length > 0 && (
        <details className="tumour-movement-timeseries">
          <summary>Movement time-series values</summary>
          <table className="tumour-report-table" aria-label="Movement time series treated versus control">
            <thead>
              <tr>
                <th scope="col">Simulated time (h)</th>
                <th scope="col">Treated</th>
                <th scope="col">Untreated control</th>
                <th scope="col">% difference</th>
              </tr>
            </thead>
            <tbody>
              {readout.timeSeries.map((p) => (
                <tr key={p.timeHours}>
                  <th scope="row">{p.timeHours.toFixed(2)}</th>
                  <td>{fmtMovement(p.treated, readout.disclaimer)}</td>
                  <td>{fmtMovement(p.control, readout.disclaimer)}</td>
                  <td>{formatPercentDelta(p.percentDifference)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <div className="tumour-movement-replicates">
        <h4>Replicate results</h4>
        <table className="tumour-report-table" aria-label="Movement results per replicate">
          <thead>
            <tr>
              <th scope="col">Replicate</th>
              <th scope="col">Seed</th>
              <th scope="col">Treated movement</th>
              <th scope="col">Control movement</th>
              <th scope="col">% vs control</th>
              <th scope="col">Fewer cells alive?</th>
            </tr>
          </thead>
          <tbody>
            {readout.replicates.map((r) => (
              <tr key={r.replicate}>
                <th scope="row">{r.replicate}</th>
                <td>{r.seed}</td>
                <td>{fmtMovement(r.treatedMovement, readout.disclaimer)}</td>
                <td>{fmtMovement(r.controlMovement, readout.disclaimer)}</td>
                <td>{r.percentDifferenceVsControl}</td>
                <td>{r.fewerCellsAliveCaveat ? 'Yes — possible contributor to apparent movement drop' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted tumour-movement-separate">{readout.separateOutcomesNote}</p>
      <ul className="tumour-movement-limitations">
        {readout.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </section>
  );
}
