import { Button } from '../ui/Button';
import type { Simulation } from '../../types';
import type { ActiveExperimentSetup, RecordedDishBaseline } from '../../types/experimentWorkspace';
import type { TherapeuticDesign } from '../../types/scientific';
import { THERAPEUTIC_INTENDED_OUTCOME_LABELS } from '../../types/scientific';
import {
  SIMULATED_ESTIMATE_LABEL,
  buildBeforeAfterResult,
  isTumourCellModel,
} from '../../services/tumourCellSimulation';

interface TumourTestFlowPanelProps {
  setup: ActiveExperimentSetup;
  organismName: string;
  experimentalSim: Simulation | null;
  controlSim: Simulation | null;
  designs: TherapeuticDesign[];
  comparisonAllowed?: boolean;
  comparisonBlockReason?: string;
  onRecordBaseline: () => void;
  onApplyVector: (design: TherapeuticDesign) => void;
  onRunSteps: (n: number) => void;
}

function stepStatus(
  done: boolean,
  active: boolean,
): 'done' | 'active' | 'todo' {
  if (done) return 'done';
  if (active) return 'active';
  return 'todo';
}

export function TumourTestFlowPanel({
  setup,
  organismName,
  experimentalSim,
  controlSim,
  designs,
  comparisonAllowed = true,
  comparisonBlockReason,
  onRecordBaseline,
  onApplyVector,
  onRunSteps,
}: TumourTestFlowPanelProps) {
  if (!isTumourCellModel(setup.catalogueEntryId)) return null;

  const baseline = setup.recordedBaseline ?? null;
  const treatment = setup.attachedTherapeutic ?? experimentalSim?.therapeuticTreatment ?? null;
  const hasCell = !!setup.catalogueEntryId;
  const hasAfterTicks = (experimentalSim?.currentTick ?? 0) > (baseline?.tick ?? 0)
    || ((experimentalSim?.timeHours ?? 0) > (baseline?.timeHours ?? 0) && !!treatment);

  const s1 = stepStatus(hasCell, true);
  const s2 = stepStatus(!!baseline, hasCell && !baseline);
  const s3 = stepStatus(!!treatment, !!baseline && !treatment);
  const s4 = stepStatus(!!baseline && !!treatment && hasAfterTicks, !!baseline && !!treatment);

  const activeSeed = experimentalSim?.seed
    ?? setup.simulationSeed
    ?? baseline?.seed
    ?? null;

  const seedConsistent = !baseline || activeSeed == null || baseline.seed === activeSeed;

  const result = baseline && experimentalSim && comparisonAllowed && seedConsistent
    ? buildBeforeAfterResult({
      cellModelId: setup.catalogueEntryId,
      cellModelName: organismName,
      baseline: {
        timeHours: baseline.timeHours,
        organismState: baseline.organismState,
        seed: baseline.seed,
      },
      after: experimentalSim.organismState,
      control: controlSim?.organismState ?? baseline.controlOrganismState ?? null,
      treatment,
      seed: baseline.seed,
      activeSeed: activeSeed ?? baseline.seed,
      elapsedAfterHours: experimentalSim.timeHours,
    })
    : null;

  const seedMismatchNote = baseline && activeSeed != null && baseline.seed !== activeSeed
    ? `Seed mismatch: baseline seed ${baseline.seed} ≠ active paired seed ${activeSeed}. Before/after comparison is blocked until you record a new baseline (or re-select the cell and restart the matched pair). Never label these as the same seed.`
    : null;

  const tumourDesigns = designs.filter(
    (d) => d.targetType === 'tumour-cell' || d.targetCellModelId || d.intendedOutcome,
  );

  return (
    <section className="tumour-test-flow" aria-label="Tumour-cell dish test flow">
      <h3 className="tumour-test-flow-title">Complete test flow</h3>
      <p className="text-muted tumour-test-flow-lead" role="note">
        One path: dish → baseline → conceptual vector → before/after vs untreated control.
        Every number is a <strong>{SIMULATED_ESTIMATE_LABEL}</strong> — not a real vector construct.
      </p>

      <ol className="tumour-flow-steps">
        <li className={`tumour-flow-step tumour-flow-${s1}`}>
          <span className="tumour-flow-step-label">1. Tumour cell in dish</span>
          <p>{organismName} ({setup.catalogueEntryId}) · sample {setup.sampleId}</p>
        </li>
        <li className={`tumour-flow-step tumour-flow-${s2}`}>
          <span className="tumour-flow-step-label">2. Record baseline</span>
          <p>Capture untreated experimental dish metrics before applying a vector.</p>
          <Button
            size="sm"
            variant={baseline ? 'secondary' : 'primary'}
            onClick={onRecordBaseline}
            disabled={!experimentalSim || !!treatment}
            aria-label="Record pre-vector baseline from experimental dish"
          >
            {baseline ? 'Baseline recorded' : 'Record baseline'}
          </Button>
          {treatment && !baseline && (
            <p className="warn-text">Re-select the cell to start untreated, then record baseline before applying a vector.</p>
          )}
          {baseline && <BaselineSummary baseline={baseline} />}
        </li>
        <li className={`tumour-flow-step tumour-flow-${s3}`}>
          <span className="tumour-flow-step-label">3. Apply conceptual vector</span>
          <p>Links design settings to the experimental dish only. Control stays untreated. Does not change pH.</p>
          {treatment ? (
            <p className="tumour-flow-applied" role="status">
              Applied: <strong>{treatment.designName}</strong>
              {' · '}
              {THERAPEUTIC_INTENDED_OUTCOME_LABELS[treatment.intendedOutcome]}
            </p>
          ) : tumourDesigns.length === 0 ? (
            <p className="text-muted">
              Save a design in Therapeutic Design first (include an intended outcome), then return here.
            </p>
          ) : (
            <ul className="tumour-flow-design-list">
              {tumourDesigns.map((d) => (
                <li key={d.id}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onApplyVector(d)}
                    disabled={!baseline}
                    aria-label={`Apply conceptual vector ${d.name}`}
                  >
                    Apply “{d.name}”
                  </Button>
                  <span className="text-muted">
                    {THERAPEUTIC_INTENDED_OUTCOME_LABELS[d.intendedOutcome ?? 'growth-suppression']}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!baseline && (
            <p className="warn-text">Record a baseline before applying the vector so before/after can be shown.</p>
          )}
        </li>
        <li className={`tumour-flow-step tumour-flow-${s4}`}>
          <span className="tumour-flow-step-label">4. Before / after vs untreated control</span>
          <p>Step the simulation, then read measured values, units, elapsed time, and calculation notes below.</p>
          {!comparisonAllowed && (
            <p className="warn-text" role="alert">
              {comparisonBlockReason
                ?? 'Experimental vs control comparison is blocked because dish conditions do not match. Align environments first.'}
            </p>
          )}
          <div className="tumour-flow-run-actions">
            <Button
              size="sm"
              onClick={() => onRunSteps(8)}
              disabled={!treatment || !experimentalSim}
              aria-label="Step simulation forward eight ticks"
            >
              Step ×8
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onRunSteps(24)}
              disabled={!treatment || !experimentalSim}
              aria-label="Step simulation forward twenty-four ticks"
            >
              Step ×24
            </Button>
          </div>
        </li>
      </ol>

      {seedMismatchNote && (
        <p className="warn-text" role="alert">
          {seedMismatchNote}
        </p>
      )}

      {baseline && experimentalSim && !comparisonAllowed && (
        <p className="warn-text" role="alert">
          Before/after vs control table hidden until experimental and control environments match.
          Baseline time recorded: {baseline.timeHours.toFixed(2)} simulated hours.
          Current time: {experimentalSim.timeHours.toFixed(2)} simulated hours.
        </p>
      )}

      {result && (
        <div className="tumour-before-after" aria-label="Before and after results">
          <h4>Before-and-after result</h4>
          <dl className="detail-dl tumour-before-after-meta">
            <dt>Cell model</dt>
            <dd>{result.cellModelName} ({result.cellModelId})</dd>
            <dt>Conceptual vector</dt>
            <dd>{result.designName ?? 'None'}{result.intendedOutcome ? ` · ${result.intendedOutcome}` : ''}</dd>
            <dt>Seed</dt>
            <dd>
              {result.seedMatched
                ? `${result.activeSeed} (matched baseline, treated, and untreated control)`
                : `baseline ${result.seed} / active ${result.activeSeed} — MISMATCH`}
            </dd>
            <dt>Baseline time</dt>
            <dd>{result.baselineTimeHours.toFixed(2)} simulated hours</dd>
            <dt>Elapsed after vector</dt>
            <dd>{result.elapsedAfterHours.toFixed(2)} simulated hours</dd>
            <dt>Elapsed since baseline</dt>
            <dd>{result.elapsedSinceBaselineHours.toFixed(2)} simulated hours</dd>
            <dt>Control</dt>
            <dd>
              {result.seedMatched
                ? 'Matched untreated dish (same seed; no conceptual vector)'
                : 'Control seed does not match baseline — comparison not labelled as same-seed'}
            </dd>
          </dl>

          {result.seedMismatchMessage && (
            <p className="warn-text" role="alert">{result.seedMismatchMessage}</p>
          )}

          <div className="tumour-before-after-scroll">
            <table className="tumour-report-table" aria-label="Baseline after and control metric table">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Unit</th>
                  <th scope="col">Baseline (before)</th>
                  <th scope="col">After (experimental)</th>
                  <th scope="col">Untreated control</th>
                  <th scope="col">Δ vs baseline</th>
                  <th scope="col">Δ vs control</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{r.metric}</th>
                    <td>{r.unit}</td>
                    <td>{r.baseline}</td>
                    <td>{r.after}</td>
                    <td>{r.control}</td>
                    <td>{r.pctChangeFromBaseline}</td>
                    <td>{r.pctDifferenceVsControl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="tumour-calc-details" open>
            <summary>How each result was calculated</summary>
            <ul className="tumour-calc-list">
              {result.howCalculated.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {result.rows.map((r) => (
              <div key={`calc-${r.key}`} className="tumour-metric-calc">
                <strong>{r.metric}</strong>
                <p>{r.calculation}</p>
                {r.note && <p className="warn-text">{r.note}</p>}
              </div>
            ))}
          </details>

          <p className="text-muted" role="note">
            Label on every value: <strong>{SIMULATED_ESTIMATE_LABEL}</strong>.
          </p>
          <ul className="tumour-limitations">
            {result.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function BaselineSummary({ baseline }: { baseline: RecordedDishBaseline }) {
  const s = baseline.organismState;
  return (
    <p className="tumour-baseline-summary" role="status">
      Baseline at {baseline.timeHours.toFixed(2)} h · movement{' '}
      {s.cellMovement === null ? 'not measured' : `${s.cellMovement.toFixed(1)}%`} · proliferation{' '}
      {s.proliferation === null ? 'not measured' : `${s.proliferation.toFixed(1)}%`} · viability{' '}
      {s.viability.toFixed(1)}% · all {SIMULATED_ESTIMATE_LABEL}s
    </p>
  );
}
