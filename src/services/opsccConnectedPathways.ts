/**
 * OPSCC connected-pathway evidence map.
 * This is a literature-organised teaching map, not a calibrated quantitative model.
 * It deliberately does not assign efficacy values or predict an individual tumour.
 */
export const OPSCC_PATHWAY_NOTICE =
  'Educational evidence map only. Pathway relationships are drawn from published HNSCC/OPSCC research; no intervention effect, patient biomarker, or clinical outcome is simulated.';

export type EvidenceTier = 'well-established biology' | 'context-dependent research' | 'emerging research';
export interface PathwayNode {
  id: string;
  area: string;
  label: string;
  whatItControls: string;
  relevance: string;
  tier: EvidenceTier;
  hpvContext: string;
  downstream: string[];
}
export interface PathwayLink {
  from: string;
  to: string;
  relationship: string;
  tier: EvidenceTier;
}
export const OPSCC_PATHWAY_NODES: PathwayNode[] = [
  { id:'hpv-e6-e7', area:'HPV-associated oncogenesis', label:'High-risk HPV E6 / E7', whatItControls:'Viral oncoproteins disrupt host tumour-suppressor checkpoints.', relevance:'E6 promotes p53 degradation; E7 disables RB-family control and releases E2F-driven cell-cycle progression.', tier:'well-established biology', hpvContext:'Relevant only to HPV-driven disease; this is not evidence that the family-reported tumour is HPV-positive.', downstream:['cell-cycle','survival','apoptosis'] },
  { id:'tp53-rb', area:'HPV-independent oncogenesis', label:'TP53 / RB / CDKN2A checkpoint disruption', whatItControls:'DNA-damage response, cell-cycle arrest and senescence.', relevance:'HPV-independent HNSCC commonly has genomic disruption of TP53 and cell-cycle control; exact alterations vary by tumour.', tier:'well-established biology', hpvContext:'A broad HPV-independent disease pattern, not a test result for this patient.', downstream:['cell-cycle','survival','apoptosis'] },
  { id:'cell-cycle', area:'Growth and proliferation', label:'Cyclin D–CDK4/6–RB–E2F cell-cycle control', whatItControls:'Whether cells pass the G1/S checkpoint and copy DNA.', relevance:'Disrupted checkpoint control can permit continued proliferation.', tier:'well-established biology', hpvContext:'Can be disrupted through different routes in HPV-positive and HPV-independent tumours.', downstream:['tumour-growth','tumour-burden'] },
  { id:'egfr-mapk', area:'Growth and survival signalling', label:'EGFR → RAS/RAF/MEK/ERK → AP-1', whatItControls:'Growth signals, transcription and invasion-associated programmes.', relevance:'EGFR-linked ERK/AP-1 signalling is implicated in HNSCC growth and invasion, including regulation of matrix-remodelling enzymes.', tier:'well-established biology', hpvContext:'Can occur in either HPV context; activity in an individual tumour is unknown.', downstream:['tumour-growth','local-invasion','angiogenesis'] },
  { id:'pi3k-akt-mtor', area:'Growth and survival signalling', label:'PI3K → AKT → mTOR', whatItControls:'Cell growth, protein synthesis, metabolism and survival.', relevance:'Frequently altered in HNSCC; can support proliferation, survival and resistance to cell-death signals.', tier:'well-established biology', hpvContext:'Alterations occur across HPV groups; frequencies and drivers differ.', downstream:['tumour-growth','cell-survival','apoptosis-resistance','motility'] },
  { id:'stat3', area:'Growth and survival signalling', label:'JAK / STAT3 inflammatory signalling', whatItControls:'Survival, proliferation, cytokines and immune-suppressive signalling.', relevance:'STAT3 activity is reported in HNSCC and can link tumour-cell survival with the surrounding immune environment.', tier:'context-dependent research', hpvContext:'Not a patient-specific finding; activity varies across tumours.', downstream:['tumour-growth','cell-survival','immune-evasion','angiogenesis'] },
  { id:'apoptosis', area:'Cell killing and treatment response', label:'p53, BCL-2 family and caspase apoptosis machinery', whatItControls:'Intrinsic and extrinsic programmed cell death after cellular stress or damage.', relevance:'Cancer cells may evade apoptosis; chemotherapy and radiotherapy can cause damage that should trigger cell death, but surviving subclones may persist.', tier:'well-established biology', hpvContext:'HPV E6 can impair p53 function; HPV-independent tumours may have TP53 pathway alterations by other routes.', downstream:['tumour-burden','treatment-response','residual-disease'] },
  { id:'emt-mmp', area:'Movement and local invasion', label:'Partial EMT, adhesion change and MMP-mediated matrix remodelling', whatItControls:'Cell plasticity, detachment, migration and movement through surrounding tissue.', relevance:'EGFR/ERK, PI3K/AKT, TGF-β and Notch-associated programmes can contribute to invasion and partial EMT in HNSCC.', tier:'context-dependent research', hpvContext:'Biology is heterogeneous and not a binary HPV-only process.', downstream:['local-invasion','intravasation','motility'] },
  { id:'hypoxia-vegf', area:'Tumour microenvironment and blood supply', label:'Hypoxia → HIF signalling → VEGF / angiogenesis', whatItControls:'Adaptation to low oxygen and formation of tumour-associated blood vessels.', relevance:'Hypoxia can alter survival, invasion and vascular biology; effects depend on tumour context.', tier:'context-dependent research', hpvContext:"Not enough information to infer the oxygen state or angiogenic profile of the patient's tumour.", downstream:['cell-survival','local-invasion','intravasation'] },
  { id:'metastatic-cascade', area:'Metastatic spread', label:'Invasion → intravasation → circulation → extravasation → colonisation', whatItControls:'The sequential barriers a tumour cell must cross to establish a distant metastasis.', relevance:'Each step is biologically distinct. A lung-colonisation readout must not be treated as proof that the earlier steps occurred.', tier:'well-established biology', hpvContext:'The reported right-lung secondary disease is family context; this map does not reconstruct how it happened.', downstream:['intravasation','circulation-survival','extravasation','lung-colonisation'] },
  { id:'anoikis-platelets', area:'Metastatic spread', label:'Anoikis resistance and circulation survival', whatItControls:'Survival after detachment and while travelling through blood or lymph.', relevance:'Survival signalling and tumour-microenvironment crosstalk can help detached cells resist cell death; platelet interactions are an active research area.', tier:'context-dependent research', hpvContext:'No patient-specific circulating tumour-cell data are available.', downstream:['circulation-survival','extravasation'] },
  { id:'lung-niche', area:'Metastatic spread', label:'Distant-organ niche and lung colonisation', whatItControls:'Adhesion, immune escape, adaptation and outgrowth at a distant site.', relevance:'A distant metastasis requires successful establishment in a new tissue environment, not just movement.', tier:'context-dependent research', hpvContext:"This is a conceptual lung-site module, not a model of the father's lung lesion.", downstream:['lung-colonisation','secondary-tumour-growth'] },
  { id:'antigen-presentation', area:'Immune recognition', label:'Tumour antigens → MHC-I / HLA → T-cell recognition', whatItControls:'Whether tumour-derived antigens can be displayed and recognised by cytotoxic T cells.', relevance:'Antigen presentation and T-cell access/function are prerequisites for effective tumour-directed immune killing.', tier:'well-established biology', hpvContext:'HPV-derived antigens can be targets in HPV-driven disease; actual antigen presentation is unknown here.', downstream:['t-cell-killing','immune-evasion'] },
  { id:'pd1-pdl1', area:'Pembrolizumab and immune checkpoint', label:'PD-1 on T cells ↔ PD-L1 / PD-L2 checkpoint ligands', whatItControls:'An inhibitory checkpoint that can suppress T-cell activity in the tumour environment.', relevance:'Pembrolizumab binds PD-1 and blocks checkpoint signalling, potentially restoring anti-tumour T-cell activity; it does not directly poison tumour cells.', tier:'well-established biology', hpvContext:'Relevant to either HPV context. PD-L1 CPS and tumour immune context are unknown for this patient.', downstream:['t-cell-killing','immune-evasion','tumour-burden'] },
  { id:'immune-resistance', area:'Treatment resistance', label:'Antigen loss, impaired presentation, T-cell exclusion and bypass signalling', whatItControls:'Ways a tumour may remain or become less susceptible to immune attack or other treatment.', relevance:'Resistance is multi-factorial; candidate mechanisms include altered antigen presentation, interferon-pathway defects, suppressive microenvironment and pathway bypass.', tier:'context-dependent research', hpvContext:"These are candidate mechanisms to investigate, not evidence of why this patient's disease has behaved as it has.", downstream:['immune-evasion','treatment-resistance','residual-disease'] },
  { id:'clonal-selection', area:'Treatment resistance', label:'Clonal heterogeneity and selection under treatment pressure', whatItControls:'Which tumour-cell subpopulations persist after therapy.', relevance:'Treatment can reduce sensitive populations while resistant populations survive; this is a general evolutionary principle, not a patient-specific explanation.', tier:'well-established biology', hpvContext:'No tumour sequencing or serial biopsy data are available to identify resistant clones.', downstream:['residual-disease','treatment-resistance','secondary-tumour-growth'] },
];

export const OPSCC_PATHWAY_LINKS: PathwayLink[] = [
  {from:'hpv-e6-e7',to:'cell-cycle',relationship:'E7 disables RB control; E6 impairs p53 checkpoint function.',tier:'well-established biology'},
  {from:'tp53-rb',to:'cell-cycle',relationship:'Loss of checkpoint control can permit inappropriate cell-cycle progression.',tier:'well-established biology'},
  {from:'egfr-mapk',to:'local-invasion',relationship:'ERK/AP-1 signalling can promote matrix-remodelling and invasion programmes.',tier:'well-established biology'},
  {from:'pi3k-akt-mtor',to:'cell-survival',relationship:'AKT/mTOR signalling supports growth and survival.',tier:'well-established biology'},
  {from:'pi3k-akt-mtor',to:'motility',relationship:'PI3K/AKT can contribute to EMT-associated motility and invasion.',tier:'context-dependent research'},
  {from:'stat3',to:'immune-evasion',relationship:'STAT3-associated cytokine programmes can contribute to immune suppression.',tier:'context-dependent research'},
  {from:'emt-mmp',to:'intravasation',relationship:'Local invasion and tissue/vascular access are upstream requirements for intravasation.',tier:'well-established biology'},
  {from:'hypoxia-vegf',to:'intravasation',relationship:'Hypoxia-associated adaptation and angiogenesis can alter vascular access and invasion.',tier:'context-dependent research'},
  {from:'apoptosis',to:'residual-disease',relationship:'Cells that evade treatment-associated death may contribute to residual disease.',tier:'well-established biology'},
  {from:'metastatic-cascade',to:'lung-colonisation',relationship:'Distant colonisation is downstream of multiple distinct metastatic barriers.',tier:'well-established biology'},
  {from:'anoikis-platelets',to:'circulation-survival',relationship:'Anoikis resistance can support survival after detachment.',tier:'context-dependent research'},
  {from:'lung-niche',to:'secondary-tumour-growth',relationship:'Successful adaptation to the distant tissue can permit metastatic outgrowth.',tier:'context-dependent research'},
  {from:'antigen-presentation',to:'t-cell-killing',relationship:'Antigen display enables recognition by tumour-reactive T cells.',tier:'well-established biology'},
  {from:'pd1-pdl1',to:'t-cell-killing',relationship:'PD-1 blockade can release inhibitory signalling and restore T-cell function in some contexts.',tier:'well-established biology'},
  {from:'immune-resistance',to:'treatment-resistance',relationship:'Loss of recognition or T-cell access can reduce sensitivity to immune attack.',tier:'context-dependent research'},
  {from:'clonal-selection',to:'residual-disease',relationship:'Treatment pressure can select for surviving subpopulations.',tier:'well-established biology'},
];

export const OPSCC_PATHWAY_REFERENCES = [
  {label:'Head and neck squamous cell carcinoma — molecular biology review',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7944998/'},
  {label:'Mechanisms of invasion in head and neck cancer',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7469951/'},
  {label:'Targeted therapy and signalling pathways in head and neck cancer',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9842704/'},
  {label:'NCI — immune checkpoint inhibitors',url:'https://www.cancer.gov/about-cancer/treatment/types/immunotherapy/checkpoint-inhibitors'},
  {label:'NCI — pembrolizumab drug information',url:'https://www.cancer.gov/about-cancer/treatment/drugs/pembrolizumab'},
  {label:'KEYNOTE-048 trial record',url:'https://www.cancer.gov/research/participate/clinical-trials-search/v?id=NCT02358031'},
];

export function buildOpsccFullSweepReport(): string {
  const lines = [
    'GENESIS LAB — OPSCC CONNECTED PATHWAY FULL SWEEP',
    OPSCC_PATHWAY_NOTICE,
    '',
    'SCOPE: tumour initiation, growth, survival, apoptosis/cell killing, local invasion and movement, vascular entry, circulation survival, exit into distant tissue, lung-site colonisation, immune recognition, PD-1/PD-L1 checkpoint biology and treatment resistance.',
    '',
    'IMPORTANT PATIENT CONTEXT: Family-reported OPSCC with right-lung secondary metastasis; prior chemotherapy/radiotherapy and current pembrolizumab. Exact primary subsite, HPV/p16 status, PD-L1 CPS, tumour genomic alterations and immune-microenvironment profile are unknown.',
    '',
    'HPV COMPARISON: HPV-driven and HPV-independent disease are both represented as separate literature-based biological branches. This is a comparison of two disease contexts, not a test of the patient tumour. The existing UPCI-SCC-090 model is an HPV16-positive comparator cell line, not the patient sample.',
    '',
    'PATHWAY SWEEP',
  ];
  for (const area of [...new Set(OPSCC_PATHWAY_NODES.map(n => n.area))]) {
    lines.push('', '## ' + area);
    for (const n of OPSCC_PATHWAY_NODES.filter(x => x.area === area)) {
      lines.push('- ' + n.label + ' [' + n.tier + ']', '  Controls: ' + n.whatItControls, '  Relevance: ' + n.relevance, '  HPV context: ' + n.hpvContext);
    }
  }
  lines.push('', 'CONNECTED RELATIONSHIPS');
  for (const link of OPSCC_PATHWAY_LINKS) {
    const from = OPSCC_PATHWAY_NODES.find(n => n.id === link.from)?.label ?? link.from;
    const to = OPSCC_PATHWAY_NODES.find(n => n.id === link.to)?.label ?? link.to;
    lines.push('- ' + from + ' → ' + to + ': ' + link.relationship + ' [' + link.tier + ']');
  }
  lines.push('', 'REFERENCES', ...OPSCC_PATHWAY_REFERENCES.map(r => '- ' + r.label + ': ' + r.url), '',
    'LIMITATIONS',
    '- This is a connected evidence map, not a calibrated mathematical simulation. No numeric treatment effects or efficacy rankings are generated.',
    '- Literature-supported relationships are general; they do not establish which pathways are active in this individual tumour.',
    '- HPV-positive and HPV-independent branches are not patient test results. Obtain the actual pathology report for HPV/p16 status.',
    '- PD-L1 CPS is distinct from HPV status. Pembrolizumab targets PD-1; its response cannot be inferred from HPV status alone.',
    '- Metastatic stages are linked conceptually, not simulated as physical cells travelling through the body.',
    '- No treatment recommendation, dose, wet-lab protocol, individual prognosis or response prediction is produced.'
  );
  return lines.join('\n');
}
