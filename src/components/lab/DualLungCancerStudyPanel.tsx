import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import {
  formatDualLungCancerReport,
  runDualLungCancerStudies,
  type DualLungCancerReport,
} from '../../services/dualLungCancerStudies';
import { downloadTextFile } from '../../services/exportService';

const STORAGE_KEY = 'genesis-lab-a549-dual-study-v1';

function mean(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function DualLungCancerStudyPanel() {
  const [report, setReport] = useState<DualLungCancerReport | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as DualLungCancerReport : null;
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!report) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
    } catch {
      setFeedback('Report created, but browser storage was unavailable. Export the report to keep a copy.');
    }
  }, [report]);

  const run = () => {
    setBusy(true);
    setFeedback(null);
    try {
      const next = runDualLungCancerStudies({ replicateCount: 5, ticks: 16 });
      setReport(next);
      setFeedback(`Both A549 studies completed: ${next.replicateCount} paired replicates per study (10 treated runs and 10 matched controls total). ${next.notice}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The paired studies could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    downloadTextFile('GenesisLab_A549_Dual_Study_Report.txt', formatDualLungCancerReport(report), 'text/plain');
  };
  const exportJson = () => {
    if (!report) return;
    downloadTextFile('GenesisLab_A549_Dual_Study_Report.json', JSON.stringify(report, null, 2), 'application/json');
  };

  return (
    <section className="mi-candidate-panel" aria-label="Dual A549 lung cancer educational studies">
      <header className="mi-candidate-header">
        <p className="mi-edu-banner" role="status">Educational simulation only — not evidence of clinical efficacy</p>
        <h3>Two A549 lung-cancer studies</h3>
        <p className="text-muted">
          Separate paired studies using the A549 lung adenocarcinoma cell-line model: one tests the
          model's cell-viability response, the other tests its cell-movement index. Each replicate
          has a treated run and a seed-matched untreated control.
        </p>
      </header>
      <div className="mi-actions">
        <Button onClick={run} disabled={busy}>{busy ? 'Running both studies…' : 'Run both studies (5 replicates each)'}</Button>
        <Button variant="secondary" onClick={exportReport} disabled={!report}>Export full report (TXT)</Button>
        <Button variant="secondary" onClick={exportJson} disabled={!report}>Export data (JSON)</Button>
      </div>
      {feedback && <p className="mi-feedback" role="status">{feedback}</p>}
      {!report && <p className="text-muted">Run both studies to generate the replicate-level results and combined scientific report.</p>}
      {report && (
        <>
          <p><strong>Report ID:</strong> {report.reportId} · <strong>Base seed:</strong> {report.killing.baseSeed} · <strong>Replicates:</strong> {report.replicateCount} per study · <strong>Model:</strong> {report.cellModel}</p>
          {[report.killing, report.spread].map((study) => (
            <details key={study.studyId} open>
              <summary><strong>{study.title}</strong> — {study.candidate.name}</summary>
              <p className="text-muted">Outcome: {study.candidate.intendedOutcome} · {study.replicateCount} matched replicate pairs · {study.ticks} ticks per run</p>
              <table className="tumour-report-table">
                <thead><tr><th>Replicate</th><th>Seed</th><th>Viability T/C</th><th>Movement T/C</th><th>Proliferation T/C</th></tr></thead>
                <tbody>
                  {study.replicates.map((r) => (
                    <tr key={r.replicate}>
                      <td>{r.replicate}</td><td>{r.seed}</td>
                      <td>{mean(r.treated.viability)} / {mean(r.control.viability)}</td>
                      <td>{r.treated.movement?.toFixed(2) ?? 'n/m'} / {r.control.movement?.toFixed(2) ?? 'n/m'}</td>
                      <td>{r.treated.proliferation?.toFixed(2) ?? 'n/m'} / {r.control.proliferation?.toFixed(2) ?? 'n/m'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4>Mean simulated outcomes</h4>
              <table className="tumour-report-table">
                <tbody>
                  <tr><th>Viability (treated / control)</th><td>{mean(study.summary.treatedViabilityMean)} / {mean(study.summary.controlViabilityMean)}</td></tr>
                  <tr><th>Mean viability difference</th><td>{study.summary.viabilityDifferenceMean.toFixed(2)} percentage points (SD {study.summary.viabilityDifferenceSd.toFixed(2)})</td></tr>
                  <tr><th>Movement index (treated / control)</th><td>{study.summary.treatedMovementMean.toFixed(2)} / {study.summary.controlMovementMean.toFixed(2)}</td></tr>
                  <tr><th>Mean movement difference</th><td>{study.summary.movementDifferenceMean.toFixed(2)} points (SD {study.summary.movementDifferenceSd.toFixed(2)})</td></tr>
                  <tr><th>Proliferation index (treated / control)</th><td>{study.summary.treatedProliferationMean.toFixed(2)} / {study.summary.controlProliferationMean.toFixed(2)}</td></tr>
                </tbody>
              </table>
              <p>{study.conclusion}</p>
              <h4>Limitations</h4>
              <ul>{study.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
            </details>
          ))}
          <p className="text-muted">All outputs are simulated educational estimates. The movement study does not measure invasion, metastatic events, or spread to other organs. A change in viability is not proof of a movement effect.</p>
        </>
      )}
    </section>
  );
}
