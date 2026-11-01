import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { downloadTextFile } from '../../services/exportService';

type Tier = 'well-established biology' | 'context-dependent research' | 'emerging research';
type Node = { id: string; area: string; label: string; role: string; link: string; tier: Tier; phenotype: string };

const NOTICE = 'Educational evidence investigation only. This is not a calibrated asthma simulator, patient-specific endotype test, gene therapy design, or clinical treatment recommendation. No attack-reduction percentages are generated.';

const NODES: Node[] = [
  { id:'epithelium', area:'Airway barrier and trigger sensing', label:'Airway epithelial barrier', role:'The airway lining senses allergens, viruses, smoke, pollution and other irritants while helping protect underlying tissue.', link:'Barrier injury or activation can initiate alarm signalling and influence airway defence.', tier:'well-established biology', phenotype:'Relevant across asthma patterns; the contribution differs between people.' },
  { id:'alarmins', area:'Early alarm signals', label:'TSLP, IL-33 and IL-25', role:'Epithelial “alarmins” released or increased after airway stress can activate downstream immune networks.', link:'Can activate dendritic cells, ILC2s and other immune cells, helping initiate or amplify inflammation.', tier:'well-established biology', phenotype:'Important in several type-2 pathways; not every asthma pattern is alarmin-dominant.' },
  { id:'dendritic', area:'Immune activation', label:'Dendritic cells and Th2 cells', role:'Dendritic cells present allergen information and can promote type-2 helper T-cell responses.', link:'Connect airway exposures with adaptive immune signalling and IL-4, IL-5 and IL-13 production.', tier:'well-established biology', phenotype:'Most relevant to allergic/type-2 immune responses.' },
  { id:'ilc2', area:'Immune activation', label:'Group 2 innate lymphoid cells (ILC2)', role:'Resident immune cells can respond rapidly to epithelial alarmins and release type-2 cytokines.', link:'Can amplify IL-5 and IL-13 signalling, including without conventional allergen-specific adaptive responses.', tier:'well-established biology', phenotype:'Can contribute to allergic and non-allergic type-2-high asthma.' },
  { id:'il4', area:'Type-2 cytokine signalling', label:'IL-4 signalling', role:'Supports type-2 immune differentiation and IgE class switching in B cells.', link:'Connects allergic sensitisation with IgE and mast-cell activation pathways.', tier:'well-established biology', phenotype:'Type-2-high biology; not universal to all asthma.' },
  { id:'il5', area:'Type-2 cytokine signalling', label:'IL-5 and eosinophils', role:'IL-5 supports eosinophil development, recruitment and survival.', link:'Eosinophilic inflammation can contribute to airway injury and exacerbations.', tier:'well-established biology', phenotype:'A key pathway in eosinophilic/type-2-high asthma; blood eosinophils are an imperfect marker.' },
  { id:'il13', area:'Type-2 cytokine signalling', label:'IL-13 signalling', role:'Influences mucus-producing cells, airway responsiveness and structural airway changes.', link:'Can contribute to goblet-cell changes, mucus hypersecretion and bronchial hyperresponsiveness.', tier:'well-established biology', phenotype:'Type-2-high pathway; strength varies between individuals.' },
  { id:'ige', area:'Allergic effector response', label:'IgE and mast cells', role:'IgE bound to mast cells can trigger mediator release after allergen cross-linking.', link:'Histamine, leukotrienes and other mediators can rapidly contribute to bronchoconstriction and symptoms.', tier:'well-established biology', phenotype:'More relevant to allergic asthma; not required for every asthma attack.' },
  { id:'mediators', area:'Airway narrowing and sensitivity', label:'Leukotrienes and other inflammatory mediators', role:'Inflammatory mediators can affect airway smooth muscle, vessels, nerves and mucus secretion.', link:'Contribute to airway narrowing, swelling, mucus and heightened responsiveness.', tier:'well-established biology', phenotype:'Multiple mediator routes can operate across different phenotypes.' },
  { id:'smooth', area:'Airway narrowing and sensitivity', label:'Airway smooth-muscle contraction', role:'Muscle surrounding the airway tightens and reduces the airway opening.', link:'A major immediate contributor to reversible airflow obstruction during an attack.', tier:'well-established biology', phenotype:'Common final pathway despite different upstream triggers.' },
  { id:'mucus', area:'Mucus and airway clearance', label:'Goblet cells and mucus plugging', role:'Goblet-cell expansion and excess mucus can obstruct smaller airways.', link:'IL-13 and epithelial inflammation can promote mucus changes; impaired clearance can worsen obstruction.', tier:'well-established biology', phenotype:'Occurs to varying degrees; mucus plugging is important in some severe disease.' },
  { id:'oedema', area:'Airway narrowing and sensitivity', label:'Airway wall swelling', role:'Inflammation increases vascular leakage and airway-wall oedema.', link:'Adds to narrowing alongside smooth-muscle contraction and mucus.', tier:'well-established biology', phenotype:'Can occur in multiple inflammatory patterns.' },
  { id:'neutro', area:'Non-type-2 and mixed inflammation', label:'Neutrophils, Th17 and IL-17-associated signals', role:'Some asthma involves neutrophilic or mixed inflammatory patterns rather than a dominant eosinophilic type-2 profile.', link:'May contribute to persistent inflammation, airway changes and variable treatment response.', tier:'context-dependent research', phenotype:'More relevant to some type-2-low or mixed patterns; mechanisms remain heterogeneous.' },
  { id:'jakstat', area:'Intracellular signal networks', label:'JAK–STAT signalling', role:'A family of intracellular signalling routes used by several cytokine receptors.', link:'Can transmit cytokine messages into gene-expression changes; the specific cytokine and cell context matter.', tier:'well-established biology', phenotype:'Crosses several inflammatory phenotypes; not a single asthma switch.' },
  { id:'nfkb', area:'Intracellular signal networks', label:'NF-κB inflammatory signalling', role:'A transcriptional network activated by inflammatory and stress signals.', link:'Can regulate inflammatory gene expression and epithelial/immune responses.', tier:'well-established biology', phenotype:'Broad inflammatory pathway, not asthma-specific.' },
  { id:'remodel', area:'Long-term airway changes', label:'Airway remodelling and fibrosis', role:'Persistent inflammation can be associated with thicker airway walls, smooth-muscle changes and altered tissue structure.', link:'Can contribute to persistent airflow limitation and heightened airway responsiveness.', tier:'well-established biology', phenotype:'Varies substantially; not every person develops the same structural changes.' },
  { id:'triggers', area:'Exacerbation and attack dynamics', label:'Triggers: viruses, allergens, smoke, pollution and other exposures', role:'Exposures can irritate or infect the airway and activate different biological pathways.', link:'Can initiate epithelial alarm signalling, mediator release and worsening airway obstruction.', tier:'well-established biology', phenotype:'The relevant triggers differ between individuals.' },
  { id:'exacerbation', area:'Exacerbation and attack dynamics', label:'Asthma exacerbation (attack)', role:'A worsening episode involving variable airflow obstruction and respiratory symptoms.', link:'Can involve a changing mixture of smooth-muscle tightening, swelling, mucus and inflammation.', tier:'well-established biology', phenotype:'Not reducible to one cytokine or one immune-cell type.' },
];

const LINKS = [
  ['epithelium','alarmins','Airway stress can prompt epithelial alarm signalling.'],
  ['alarmins','dendritic','Alarmins can activate dendritic-cell pathways.'],
  ['alarmins','ilc2','Alarmins can activate resident ILC2 cells.'],
  ['dendritic','il4','Th2 responses can produce IL-4.'],
  ['dendritic','il5','Th2 responses can produce IL-5.'],
  ['dendritic','il13','Th2 responses can produce IL-13.'],
  ['ilc2','il5','ILC2 cells can amplify IL-5 signalling.'],
  ['ilc2','il13','ILC2 cells can amplify IL-13 signalling.'],
  ['il4','ige','IL-4 supports IgE class switching.'],
  ['ige','mediators','Allergen cross-linking of IgE can trigger mast-cell mediator release.'],
  ['il5','exacerbation','Eosinophilic inflammation can contribute to flare risk in susceptible people.'],
  ['il13','mucus','IL-13 can promote mucus-producing cell changes.'],
  ['il13','smooth','IL-13 can contribute to airway hyperresponsiveness.'],
  ['mediators','smooth','Mediators can cause smooth-muscle contraction.'],
  ['mediators','oedema','Mediators can increase airway-wall swelling.'],
  ['mediators','mucus','Inflammatory mediators can increase mucus secretion.'],
  ['neutro','exacerbation','Neutrophilic/mixed inflammation can contribute to some exacerbations.'],
  ['jakstat','il5','Cytokine receptor signalling can use JAK–STAT routes.'],
  ['nfkb','epithelium','Stress and inflammatory signals can activate NF-κB in airway cells.'],
  ['mucus','exacerbation','Mucus plugging can worsen airflow obstruction.'],
  ['smooth','exacerbation','Smooth-muscle tightening is a major component of acute airflow obstruction.'],
  ['oedema','exacerbation','Airway-wall swelling contributes to narrowing.'],
  ['triggers','epithelium','Exposures can injure or activate the airway barrier.'],
  ['exacerbation','remodel','Repeated/chronic airway inflammation can be associated with remodelling over time.'],
];

const REFERENCES = [
  { label:'The immunology of asthma — Nature Immunology (2025)', url:'https://www.nature.com/articles/s41590-025-02212-9' },
  { label:'Asthma biologics across the T2 spectrum — 2025 review', url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11742565/' },
  { label:'Mechanisms and therapeutic strategies of asthma — review', url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC13454633/' },
  { label:'GINA 2026 Global Strategy for Asthma Management and Prevention', url:'https://ginasthma.org/2026-gina-strategy-report/' },
  { label:'Airway remodelling and the epithelium — European Respiratory Journal', url:'https://publications.ersnet.org/content/erj/63/4/2301619.full' },
];

function buildReport() {
  const lines = [
    'GENESIS LAB — ASTHMA CONNECTED PATHWAY INVESTIGATION (B / V001)',
    NOTICE,
    '',
    'SCOPE: epithelial barrier and triggers; alarmins; Th2 and ILC2 activation; IL-4, IL-5 and IL-13; IgE/mast cells; eosinophils; neutrophilic/type-2-low patterns; JAK–STAT and NF-κB; mucus, oedema, smooth-muscle contraction, airway remodelling and exacerbations.',
    '',
    'PHENOTYPE WARNING: Type-2-high/eosinophilic asthma is not the only asthma pattern. Type-2-low, neutrophilic, mixed and other patterns exist. No personal phenotype is assigned by this educational map.',
    '',
    'PATHWAY TOPICS',
    ...NODES.flatMap(n => [`## ${n.label} [${n.tier}]`, `Area: ${n.area}`, `Role: ${n.role}`, `Connection: ${n.link}`, `Phenotype context: ${n.phenotype}`, '']),
    'CONNECTED RELATIONSHIPS',
    ...LINKS.map(([from,to,why]) => `- ${NODES.find(n=>n.id===from)?.label} → ${NODES.find(n=>n.id===to)?.label}: ${why}`),
    '',
    'REFERENCES',
    ...REFERENCES.map(r => `- ${r.label}: ${r.url}`),
    '',
    'LIMITATIONS',
    '- This is a qualitative evidence map, not a calibrated mathematical or biological simulation.',
    '- It does not measure airway cells, cytokines, lung function, attack frequency, severity or treatment response.',
    '- It does not establish which pathways are active in any particular person.',
    '- It does not calculate gene-vector effects, efficacy percentages or a way to stop attacks.',
    '- No treatment, dose, vector design, genetic sequence, delivery route or wet-lab protocol is recommended.',
    '- Do not stop or change prescribed asthma treatment based on this educational project.',
  ];
  return lines.join('\\n');
}

export function AsthmaPathwayInvestigationPanel() {
  const [hasRun, setHasRun] = useState(false);
  const [selectedArea, setSelectedArea] = useState('All areas');
  const areas = useMemo(() => [...new Set(NODES.map(n => n.area))], []);
  const visible = selectedArea === 'All areas' ? NODES : NODES.filter(n => n.area === selectedArea);
  return (
    <section className="mi-candidate-panel" aria-label="Asthma connected pathway investigation">
      <header className="mi-candidate-header">
        <p className="mi-edu-banner">{NOTICE}</p>
        <h3>ASTHMA — Connected pathway investigation (B / V001)</h3>
        <p className="text-muted">A joined-up evidence map of how airway triggers, immune signalling and airway structure can contribute to symptoms and attacks. It includes both type-2-high and non-type-2 biology rather than assuming one asthma subtype.</p>
      </header>
      <div className="mi-actions">
        <Button onClick={() => setHasRun(true)}>Run full asthma pathway sweep</Button>
        <Button variant="secondary" disabled={!hasRun} onClick={() => downloadTextFile('GenesisLab_Asthma_Connected_Pathway_V001.txt', buildReport(), 'text/plain')}>Export full sweep (TXT)</Button>
      </div>
      <p className="text-muted">{NODES.length} pathway topics · {LINKS.length} connected relationships · {areas.length} research areas</p>
      <label className="text-muted" htmlFor="asthma-area-filter">Filter research area</label>
      <select id="asthma-area-filter" value={selectedArea} onChange={e => setSelectedArea(e.target.value)}>
        <option>All areas</option>
        {areas.map(area => <option key={area}>{area}</option>)}
      </select>
      <div className="table-scroll">
        <table className="tumour-report-table">
          <thead><tr><th>Research area</th><th>Topics</th><th>Evidence tier</th></tr></thead>
          <tbody>{areas.map(area => {
            const group = NODES.filter(n => n.area === area);
            return <tr key={area}><th>{area}</th><td>{group.map(n => n.label).join('; ')}</td><td>{[...new Set(group.map(n => n.tier))].join('; ')}</td></tr>;
          })}</tbody>
        </table>
      </div>
      <h4>Explore pathway topics</h4>
      {visible.map(n => (
        <article key={n.id} className="mi-mechanism-row">
          <h4>{n.label}</h4>
          <p>{n.role}</p>
          <p className="text-muted">{n.link}</p>
          <p className="text-muted"><strong>Evidence:</strong> {n.tier}. <strong>Phenotype context:</strong> {n.phenotype}</p>
        </article>
      ))}
      <h4>Connected biology</h4>
      <ul>{LINKS.map(([from,to,why]) => <li key={from+to}><strong>{NODES.find(n=>n.id===from)?.label} → {NODES.find(n=>n.id===to)?.label}:</strong> {why}</li>)}</ul>
      <h4>Research references</h4>
      <ul>{REFERENCES.map(r => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.label}</a></li>)}</ul>
      {hasRun && <p className="mi-feedback" role="status">Asthma pathway sweep generated: {NODES.length} topics and {LINKS.length} relationships. Qualitative evidence review only — no attack-reduction score is calculated.</p>}
    </section>
  );
}
