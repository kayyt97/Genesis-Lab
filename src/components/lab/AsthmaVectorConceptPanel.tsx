import { useState } from 'react';
import { Button } from '../ui/Button';
import { downloadTextFile } from '../../services/exportService';

const NOTICE = 'Educational research concept only. No real vector, genetic sequence, construct, dose, delivery protocol or treatment recommendation is designed or tested.';

const CONCEPTS = [
  { title: 'Target airway cell', detail: 'Which airway cells would need to be reached — surface epithelial cells, mucus-producing goblet cells, or other relevant cell populations? Cell targeting is a research question, not an assumed capability.' },
  { title: 'Choose a biological message', detail: 'Explore broad, literature-backed pathway hypotheses such as reducing excessive epithelial alarm signalling (TSLP / IL-33), type-2 cytokine signalling (IL-4 / IL-13), or eosinophil-supporting signals (IL-5). No sequence or genetic instruction is specified.' },
  { title: 'Understand the delivery barrier', detail: 'Airway mucus, ciliary clearance, epithelial tight junctions, receptor availability and immune responses can prevent delivery or make it unpredictable.' },
  { title: 'Check safety before benefit', detail: 'Consider off-target delivery, immune reactions, duration and reversibility of expression, effects on normal airway defence, and whether repeated delivery would be possible.' },
  { title: 'Define meaningful outcomes', detail: 'Potential research readouts include inflammatory signalling, epithelial integrity, mucus-related markers and airway smooth-muscle responses. These are not equivalent to preventing real asthma attacks.' },
];

const REFERENCES = [
  { label: 'Pulmonary gene delivery — realities and possibilities', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7876645/' },
  { label: 'Effective viral-mediated lung gene therapy: airway barriers', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10284697/' },
  { label: 'Asthma pathway overview — NICE NG244', url: 'https://www.nice.org.uk/guidance/ng244' },
  { label: 'Mechanisms and therapeutic strategies of asthma (2026 review)', url: 'https://www.nature.com/articles/s41392-026-02853-8' },
];

function buildReport() {
  return [
    'GENESIS LAB — ASTHMA GENE-DELIVERY CONCEPT (A / V001)',
    NOTICE,
    '',
    'PURPOSE: Explore, at a high conceptual level, whether a future airway-targeted gene-delivery approach could influence asthma-related biology.',
    '',
    ...CONCEPTS.flatMap((item, index) => [`${index + 1}. ${item.title}`, item.detail, '']),
    'IMPORTANT: No vector type, capsid, sequence, promoter, genetic construct, dose, administration route or laboratory protocol is proposed. This panel does not simulate a real gene therapy or estimate attack reduction.',
    '',
    'REFERENCES',
    ...REFERENCES.map((ref) => `- ${ref.label}: ${ref.url}`),
    '',
    'LIMITATIONS: Asthma is biologically heterogeneous. Pathways differ between people and asthma phenotypes. Any future computational pathway model must keep hypothetical effects separate from measured evidence. Existing asthma treatments and prescribed preventer medication must not be stopped or changed on the basis of this research.',
  ].join('\\n');
}

export function AsthmaVectorConceptPanel() {
  const [reportReady, setReportReady] = useState(false);
  return (
    <section className="mi-candidate-panel" aria-label="Asthma gene delivery concept study">
      <header className="mi-candidate-header">
        <p className="mi-edu-banner">{NOTICE}</p>
        <h3>ASTHMA — Gene-delivery concept investigation (A / V001)</h3>
        <p className="text-muted">First, examine the idea of delivering a protective biological instruction to relevant airway cells. This is a feasibility and safety map, not a designed or working gene therapy.</p>
      </header>
      <div className="mi-actions">
        <Button onClick={() => setReportReady(true)}>Run concept review</Button>
        <Button variant="secondary" disabled={!reportReady} onClick={() => downloadTextFile('GenesisLab_Asthma_Vector_Concept_V001.txt', buildReport(), 'text/plain')}>Export concept review (TXT)</Button>
      </div>
      <div className="table-scroll">
        <table className="tumour-report-table">
          <thead><tr><th>Research question</th><th>What we need to understand</th></tr></thead>
          <tbody>{CONCEPTS.map((item) => <tr key={item.title}><th>{item.title}</th><td>{item.detail}</td></tr>)}</tbody>
        </table>
      </div>
      <h4>Pathways worth investigating — not assumed targets for a treatment</h4>
      <ul>
        <li><strong>TSLP and IL-33:</strong> early airway “alarm” signals that can help initiate type-2 inflammation.</li>
        <li><strong>IL-4 and IL-13:</strong> signals involved in allergic inflammation, mucus production and airway responsiveness.</li>
        <li><strong>IL-5:</strong> supports eosinophil development and survival.</li>
        <li><strong>JAK–STAT and NF-κB:</strong> intracellular signalling networks that connect inflammatory messages to cell responses.</li>
      </ul>
      <h4>Evidence references</h4>
      <ul>{REFERENCES.map((ref) => <li key={ref.url}><a href={ref.url} target="_blank" rel="noreferrer">{ref.label}</a></li>)}</ul>
      {reportReady && <p className="mi-feedback" role="status">Concept review generated. No biological vector has been constructed or tested.</p>}
    </section>
  );
}
