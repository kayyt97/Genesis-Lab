import { useState } from 'react';
import { Button } from '../ui/Button';
import { downloadTextFile } from '../../services/exportService';
import {
  OPSCC_PATHWAY_NODES,
  OPSCC_PATHWAY_LINKS,
  OPSCC_PATHWAY_NOTICE,
  OPSCC_PATHWAY_REFERENCES,
  buildOpsccFullSweepReport,
} from '../../services/opsccConnectedPathways';

export function OpsccConnectedPathwayPanel() {
  const [report, setReport] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>('HPV-associated oncogenesis');
  const areas = [...new Set(OPSCC_PATHWAY_NODES.map((node) => node.area))];
  const runSweep = () => setReport(buildOpsccFullSweepReport());

  return (
    <section className="mi-candidate-panel" aria-label="OPSCC connected pathway full sweep">
      <header className="mi-candidate-header">
        <p className="mi-edu-banner">{OPSCC_PATHWAY_NOTICE}</p>
        <h3>OPSCC — Connected pathway map and full evidence sweep</h3>
        <p className="text-muted">A joined-up map of growth, survival, cell killing, movement, each metastatic stage, immune escape, pembrolizumab and treatment resistance. Connections are labelled by evidence tier; no invented treatment-effect numbers are used.</p>
        <p className="text-muted"><strong>HPV status:</strong> both HPV-driven and HPV-independent biology are included as separate branches. Neither branch identifies your dad's actual tumour status.</p>
      </header>
      <div className="mi-actions">
        <Button onClick={runSweep}>Run full OPSCC evidence sweep</Button>
        <Button variant="secondary" disabled={!report} onClick={() => report && downloadTextFile('GenesisLab_OPSCC_Connected_Pathway_Full_Sweep.txt', report, 'text/plain')}>Export full sweep (TXT)</Button>
      </div>
      <p className="text-muted">{OPSCC_PATHWAY_NODES.length} pathway topics · {OPSCC_PATHWAY_LINKS.length} connected relationships · {areas.length} research areas</p>
      <div className="table-scroll">
        <table className="tumour-report-table">
          <thead><tr><th>Research area</th><th>Topics</th><th>Evidence tier</th></tr></thead>
          <tbody>{areas.map((area) => {
            const nodes = OPSCC_PATHWAY_NODES.filter((node) => node.area === area);
            return <tr key={area}><th>{area}</th><td>{nodes.map((node) => node.label).join('; ')}</td><td>{[...new Set(nodes.map((node) => node.tier))].join('; ')}</td></tr>;
          })}</tbody>
        </table>
      </div>
      <h4>Explore the connected biology</h4>
      {areas.map((area) => (
        <details key={area} open={expanded === area} onToggle={(event) => {
          if ((event.currentTarget as HTMLDetailsElement).open) setExpanded(area);
        }}>
          <summary><strong>{area}</strong></summary>
          {OPSCC_PATHWAY_NODES.filter((node) => node.area === area).map((node) => (
            <article key={node.id} className="mi-mechanism-row">
              <h4>{node.label}</h4>
              <p>{node.whatItControls}</p>
              <p className="text-muted">{node.relevance}</p>
              <p className="text-muted"><strong>Evidence:</strong> {node.tier}. <strong>HPV context:</strong> {node.hpvContext}</p>
              <p className="text-muted"><strong>Downstream concepts:</strong> {node.downstream.join(', ')}</p>
            </article>
          ))}
        </details>
      ))}
      <h4>Connected relationships</h4>
      <ul>{OPSCC_PATHWAY_LINKS.map((link) => {
        const from = OPSCC_PATHWAY_NODES.find((node) => node.id === link.from)?.label ?? link.from;
        const to = OPSCC_PATHWAY_NODES.find((node) => node.id === link.to)?.label ?? link.to;
        return <li key={link.from + link.to}><strong>{from} → {to}:</strong> {link.relationship} <span className="text-muted">({link.tier})</span></li>;
      })}</ul>
      <h4>Research references</h4>
      <ul>{OPSCC_PATHWAY_REFERENCES.map((ref) => <li key={ref.url}><a href={ref.url} target="_blank" rel="noreferrer">{ref.label}</a></li>)}</ul>
      {report && <p className="mi-feedback" role="status">Full evidence sweep report generated and ready to export.</p>}
    </section>
  );
}
