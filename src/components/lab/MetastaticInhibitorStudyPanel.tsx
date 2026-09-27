import { Button } from '../ui/Button';
import { SimpleLineChart } from '../ui/Metric';
import type { MetastaticInhibitorStudy } from '../../services/metastaticInhibitorCandidate';
import {
  EDUCATIONAL_NO_CLINICAL_NOTICE,
  METASTATIC_INHIBITOR_NAME,
  fmtEndpointDisplay,
} from '../../services/metastaticInhibitorCandidate';

interface MetastaticInhibitorStudyPanelProps {
  study: MetastaticInhibitorStudy | null;
  onRunStudy: () => void;
  onSaveStudy: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  feedback?: string | null;
  busy?: boolean;
}

export function MetastaticInhibitorStudyPanel({
  study,
  onRunStudy,
  onSaveStudy,
  onExportJson,
  onExportCsv,
  feedback,
  busy,
}: MetastaticInhibitorStudyPanelProps) {
  const primaryStrength = study?.candidate.variables.therapeuticEffect ?? 78;
  const primaryRuns = study?.runs.filter((r) => r.strength === primaryStrength) ?? [];
  const chartTreated = primaryRuns[0]?.timeSeries
    .filter((p) => p.treatedMovement != null)
    .map((p) => ({ x: p.timeHours, y: p.treatedMovement as number })) ?? [];
  const chartControl = primaryRuns[0]?.timeSeries
    .filter((p) => p.controlMovement != null)
    .map((p) => ({ x: p.timeHours, y: p.controlMovement as number })) ?? [];
  const strengthChart = study?.aggregates
    .filter((a) => a.movementMeanPctVsControl != null)
    .map((a) => ({ x: a.strength, y: a.movementMeanPctVsControl as number })) ?? [];

  return (
    <section className="mi-candidate-panel" aria-label={`${METASTATIC_INHIBITOR_NAME} educational candidate study`}>
      <header className="mi-candidate-header">
        <p className="mi-edu-banner" role="status">{EDUCATIONAL_NO_CLINICAL_NOTICE}</p>
        <h3>{METASTATIC_INHIBITOR_NAME}</h3>
        <p className="text-muted">
          Simulation-only candidate aiming to reduce tumour-cell movement, invasion, and spread in the
          educational model. Not a clinically validated therapy.
        </p>
      </header>

      <div className="mi-actions">
        <Button onClick={onRunStudy} disabled={busy}>
          {busy ? 'Running study…' : `Run ${METASTATIC_INHIBITOR_NAME} study (≥5 seeds + strength sweep)`}
        </Button>
        <Button variant="secondary" onClick={onSaveStudy} disabled={!study || busy}>
          Save study (reopen after refresh)
        </Button>
        <Button variant="secondary" onClick={onExportJson} disabled={!study}>
          Export JSON
        </Button>
        <Button variant="secondary" onClick={onExportCsv} disabled={!study}>
          Export CSV
        </Button>
      </div>
      {feedback && (
        <p className="mi-feedback" role="status">
          {feedback}
        </p>
      )}

      {!study && (
        <p className="text-muted">
          Run the study to generate matched untreated-control comparisons, multi-seed replicates, a
          strength sweep, and an exportable report.
        </p>
      )}

      {study && (
        <>
          <details className="mi-param-sheet" open>
            <summary>Full candidate specification &amp; parameter sheet</summary>
            <p>
              Exact name: <strong>{study.candidate.name}</strong> · study {study.studyId} · candidate id{' '}
              {study.candidate.id} · outcome {study.candidate.intendedOutcome} · model {study.genesisLabVersion} ·
              recorded {study.createdAt}
            </p>
            <table className="tumour-report-table" aria-label="Metastatic Inhibitor parameter sheet">
              <thead>
                <tr>
                  <th scope="col">Parameter</th>
                  <th scope="col">Unit / scale</th>
                  <th scope="col">Baseline</th>
                  <th scope="col">Chosen</th>
                  <th scope="col">Rationale</th>
                  <th scope="col">Uncertainty</th>
                </tr>
              </thead>
              <tbody>
                {study.parameterSheet.map((p) => (
                  <tr key={p.key}>
                    <th scope="row">{p.label}</th>
                    <td>{p.unitOrScale}</td>
                    <td>{p.baselineValue}</td>
                    <td>{p.chosenValue}</td>
                    <td>{p.rationale}</td>
                    <td>{p.uncertainty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <p className="mi-methods">
            <strong>Methods (summary):</strong> {study.methods.slice(0, 3).join(' ')}
          </p>

          <div className="mi-charts">
            <SimpleLineChart
              data={chartTreated}
              compareData={chartControl.length >= 2 ? chartControl : undefined}
              compareLabel="Untreated control"
              label={`Control vs ${METASTATIC_INHIBITOR_NAME} movement (primary strength ${primaryStrength})`}
              color="#f9a825"
              yUnit="%"
            />
            {strengthChart.length >= 2 && (
              <SimpleLineChart
                data={strengthChart}
                label="Sensitivity to strength (mean movement %Δ vs control)"
                color="#4fc3f7"
                yUnit="%"
              />
            )}
          </div>

          <details className="mi-run-table" open>
            <summary>Table of every run ({study.runs.length})</summary>
            <div className="mi-table-scroll">
              <table className="tumour-report-table" aria-label="Metastatic Inhibitor every run">
                <thead>
                  <tr>
                    <th scope="col">Run</th>
                    <th scope="col">Seed</th>
                    <th scope="col">Strength</th>
                    <th scope="col">Movement</th>
                    <th scope="col">Viability</th>
                    <th scope="col">Population</th>
                    <th scope="col">Invasion</th>
                    <th scope="col">Viability caveat</th>
                  </tr>
                </thead>
                <tbody>
                  {study.runs.map((r) => {
                    const move = r.endpoints.find((e) => e.key === 'movementMotilityIndex')!;
                    const via = r.endpoints.find((e) => e.key === 'viability')!;
                    const pop = r.endpoints.find((e) => e.key === 'population')!;
                    const inv = r.endpoints.find((e) => e.key === 'invasion')!;
                    return (
                      <tr key={r.runId}>
                        <th scope="row">{r.runId}</th>
                        <td>{r.seed}</td>
                        <td>{r.strength}</td>
                        <td>{fmtEndpointDisplay(move)}</td>
                        <td>{fmtEndpointDisplay(via)}</td>
                        <td>{fmtEndpointDisplay(pop)}</td>
                        <td>{inv.availability}</td>
                        <td>{r.viabilityCaveat ? 'Yes — check movement vs viability' : 'No'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>

          <details className="mi-aggregates" open>
            <summary>Mean, spread, and effect size by strength</summary>
            <table className="tumour-report-table" aria-label="Metastatic Inhibitor aggregates">
              <thead>
                <tr>
                  <th scope="col">Strength</th>
                  <th scope="col">Mean movement %Δ</th>
                  <th scope="col">Spread (SD)</th>
                  <th scope="col">Cohen&apos;s d</th>
                  <th scope="col">Viability caveat seeds</th>
                  <th scope="col">Invasion</th>
                </tr>
              </thead>
              <tbody>
                {study.aggregates.map((a) => (
                  <tr key={a.strength}>
                    <th scope="row">{a.strength}</th>
                    <td>{a.movementMeanPctVsControl?.toFixed(2) ?? 'unavailable'}</td>
                    <td>{a.movementSpreadPct?.toFixed(2) ?? 'unavailable'}</td>
                    <td>{a.effectSizeMovement?.toFixed(2) ?? 'unavailable'}</td>
                    <td>
                      {a.viabilityCaveatCount}/{a.seeds.length}
                    </td>
                    <td>{a.invasion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>{study.consistencyAcrossSeeds}</p>
            <p>{study.sensitivityToStrength}</p>
          </details>

          <details className="mi-full-report">
            <summary>Large report (specification, methods, limitations, conclusion)</summary>
            <div className="mi-report-body">
              <h4>Methods</h4>
              <ul>
                {study.methods.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <h4>Limitations</h4>
              <ul>
                {study.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <h4>Conclusion (simulation only)</h4>
              <p>{study.conclusion}</p>
              <p className="mi-edu-banner" role="note">
                {study.educationalNotice}
              </p>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
