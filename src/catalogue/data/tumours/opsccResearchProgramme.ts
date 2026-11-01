/**
 * Evidence-led educational research specification.
 * This is a study plan and patient-context boundary record, not a clinical
 * record, diagnostic inference, prognosis, or executable treatment simulator.
 */
export type ResearchEvidenceClass = 'established-evidence' | 'model-assumption' | 'research-hypothesis';

export interface CancerResearchProgramme {
  id: string;
  title: string;
  disease: {
    primary: string;
    parentClassification: string;
    primaryAnatomicalRegion: string;
    knownInvolvement: string[];
    metastaticSite: string;
    metastaticRelationship: string;
    hpvStatus: 'unknown' | 'positive' | 'negative';
    p16Status: 'unknown' | 'positive' | 'negative';
    primarySubsitePrecision: string;
  };
  reportedTreatmentContext: {
    previousTreatments: string[];
    currentTreatment: string;
    treatmentIntent: string;
    predictiveBiomarkers: Record<string, 'unknown' | 'positive' | 'negative' | 'not-reported'>;
  };
  researchWorkstreams: Array<{
    id: string;
    title: string;
    questions: string[];
    evidenceClass: ResearchEvidenceClass[];
  }>;
  comparisonScenarios: Array<{
    id: string;
    label: string;
    patientStatus: 'unknown' | 'not-applicable';
    purpose: string;
  }>;
  clinicalBoundary: string[];
}

export const GENESIS_OPSCC_001: CancerResearchProgramme = {
  id: 'GENESIS-OPSCC-001',
  title: 'Oropharyngeal squamous cell carcinoma with pulmonary metastasis',
  disease: {
    primary: 'Oropharyngeal squamous cell carcinoma (OPSCC)',
    parentClassification: 'Head and neck squamous cell carcinoma (HNSCC)',
    primaryAnatomicalRegion: 'Oropharynx',
    knownInvolvement: ['Soft palate involvement reported; exact point of origin not confirmed'],
    metastaticSite: 'Right lung',
    metastaticRelationship: 'Reported secondary pulmonary metastasis from the oropharyngeal primary; do not classify as a new primary lung cancer without contrary pathology evidence.',
    hpvStatus: 'unknown',
    p16Status: 'unknown',
    primarySubsitePrecision: 'Oropharynx confirmed; soft palate involved; precise mucosal origin unknown',
  },
  reportedTreatmentContext: {
    previousTreatments: ['Chemotherapy', 'Radiotherapy'],
    currentTreatment: 'Pembrolizumab (PD-1 immune checkpoint inhibitor), as reported by family',
    treatmentIntent: 'Family reports treatment is no longer considered curative; this is contextual information, not a model-derived prognosis.',
    predictiveBiomarkers: {
      'HPV': 'unknown',
      'p16 immunohistochemistry': 'unknown',
      'PD-L1 combined positive score (CPS)': 'not-reported',
      'PD-L1 tumour proportion score (TPS)': 'not-reported',
    },
  },
  researchWorkstreams: [
    {
      id: 'OPSCC-01-ONCOGENESIS',
      title: 'Oropharyngeal epithelial transformation',
      questions: ['What molecular alterations and exposures are associated with OPSCC development?', 'How do HPV-associated and HPV-independent pathways differ?', 'How do cell-cycle control, DNA damage response and apoptosis change during malignant transformation?'],
      evidenceClass: ['established-evidence', 'model-assumption', 'research-hypothesis'],
    },
    {
      id: 'OPSCC-02-LOCAL-INVASION',
      title: 'Local invasion and tumour microenvironment',
      questions: ['How do tumour cells interact with stromal, endothelial and immune cells?', 'Which adhesion, extracellular-matrix remodelling and invasion processes are implicated?', 'How do hypoxia and nutrient limitation influence tumour states?'],
      evidenceClass: ['established-evidence', 'model-assumption', 'research-hypothesis'],
    },
    {
      id: 'OPSCC-03-METASTATIC-CASCADE',
      title: 'Lymphatic and haematogenous dissemination',
      questions: ['What are the stages of local invasion, intravasation, circulation survival, extravasation and metastatic colonisation?', 'Which steps are supported by OPSCC-specific evidence versus general metastatic-cancer evidence?', 'What is known and unknown about adaptation to the pulmonary microenvironment?'],
      evidenceClass: ['established-evidence', 'model-assumption', 'research-hypothesis'],
    },
    {
      id: 'OPSCC-04-THERAPY-RESISTANCE',
      title: 'Chemotherapy and radiotherapy response and resistance',
      questions: ['How do DNA damage, repair, cell-cycle checkpoints and apoptosis contribute to treatment effects?', 'What mechanisms are associated with radioresistance and chemotherapy resistance?', 'How might clonal selection and tumour heterogeneity contribute to persistence or recurrence?'],
      evidenceClass: ['established-evidence', 'model-assumption', 'research-hypothesis'],
    },
    {
      id: 'OPSCC-05-IMMUNE-CHECKPOINT',
      title: 'PD-1 / PD-L1 immune checkpoint biology',
      questions: ['How does PD-1 signalling restrain activated T-cell activity?', 'How can PD-L1 expression in tumour and immune cells contribute to immune escape?', 'How does pembrolizumab block PD-1 signalling, and what biological factors may contribute to response or resistance?', 'How should PD-L1 CPS and other biomarkers be represented when patient results are unknown?'],
      evidenceClass: ['established-evidence', 'model-assumption', 'research-hypothesis'],
    },
    {
      id: 'OPSCC-06-SYSTEMIC-CONSEQUENCES',
      title: 'Mechanisms of advanced-cancer morbidity',
      questions: ['How can local disease affect swallowing, airway protection, nutrition, bleeding and aspiration risk?', 'How can pulmonary metastatic burden, airway obstruction, pleural disease or infection impair respiratory function?', 'How do inflammatory signalling and altered metabolism contribute to cancer cachexia?', 'How can immune dysfunction, infection, sepsis, thrombosis and organ dysfunction arise in advanced cancer?', 'How can treatment toxicities, including immune-mediated pneumonitis and other immune-related adverse events, affect normal organs?'],
      evidenceClass: ['established-evidence', 'model-assumption'],
    },
  ],
  comparisonScenarios: [
    {
      id: 'OPSCC-HPV16-POSITIVE',
      label: 'HPV16-positive OPSCC comparator scenario',
      patientStatus: 'unknown',
      purpose: 'A separate literature-grounded comparison scenario only; not an assertion about the reported patient.',
    },
    {
      id: 'OPSCC-HPV-INDEPENDENT',
      label: 'HPV-independent / HPV-negative OPSCC comparator scenario',
      patientStatus: 'unknown',
      purpose: 'A separate literature-grounded comparison scenario only; not an assertion about the reported patient.',
    },
  ],
  clinicalBoundary: [
    'This programme is educational and computational; it is not a digital twin of an individual patient.',
    'The family-reported clinical context is not independently verified and must not be used to calculate an individual prognosis or cause of death.',
    'HPV, p16 and PD-L1 status remain unknown unless confirmed by pathology or oncology records.',
    'A cell line is not interchangeable with the patient tumour. Record anatomical origin, HPV status, provenance and model limitations for every selected line.',
    'A computational change in a pathway score is not evidence of therapeutic efficacy, safety, dose, or clinical benefit.',
    'Do not simulate pembrolizumab response as a patient-specific prediction. Model only published, well-defined immune mechanisms with explicit assumptions.',
    'Distinguish direct cancer effects, treatment adverse effects, infection, thromboembolism and unrelated comorbidity in educational complication maps.',
    'No prediction of the individual patient’s survival, deterioration timeline, or cause of death is within scope.',
  ],
};

export const GENESIS_OPSCC_RESEARCH_PHASES = [
  'Evidence and provenance map',
  'OPSCC primary-site biology',
  'HPV-positive and HPV-independent comparison scenarios',
  'Local invasion and metastatic cascade',
  'Pulmonary metastatic microenvironment',
  'Chemotherapy and radiotherapy response mechanisms',
  'PD-1 / PD-L1 checkpoint biology and pembrolizumab mechanism',
  'Resistance and tumour heterogeneity',
  'Systemic complications and organ-function mechanisms',
  'Hypothesis register and literature cross-check',
] as const;
