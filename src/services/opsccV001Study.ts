/**
 * GENESIS-OPSCC-V001: deterministic educational scenario simulator.
 * This is an abstract mathematical teaching model, not a biological, vector,
 * delivery, wet-lab, patient-specific or clinical-response model.
 */
export const OPSCC_MODEL_ID = 'ORG-CL-UPCI-SCC090';
export const OPSCC_MODEL_NAME = 'UPCI-SCC-090 (HPV16-positive base-of-tongue OPSCC comparator)';
export const OPSCC_NOTICE = 'Educational computational simulation only — not biological evidence or clinical efficacy.';
export const OPSCC_CANDIDATE_ID = 'GENESIS-OPSCC-V001';

export type OpsccScenario = 'hpv16-positive-comparator' | 'hpv-independent-hypothesis';
type Arm = 'baseline' | 'sham' | 'v001';

export interface OpsccReplicate {
  replicate: number;
  seed: number;
  arm: Arm;
  tumourBurdenIndex: number;
  apoptosisIndex: number;
  invasionIndex: number;
  immuneRecognitionIndex: number;
  lungColonisationIndex: number;
}
export interface OpsccArmSummary {
  tumourBurdenMean: number;
  apoptosisMean: number;
  invasionMean: number;
  immuneRecognitionMean: number;
  lungColonisationMean: number;
  tumourBurdenSd: number;
  apoptosisSd: number;
  invasionSd: number;
  immuneRecognitionSd: number;
  lungColonisationSd: number;
}
export interface OpsccScenarioResult {
  scenario: OpsccScenario;
  title: string;
  replicates: number;
  arms: Record<Arm, OpsccReplicate[]>;
  summaries: Record<Arm, OpsccArmSummary>;
  differences: {
    tumourBurdenV001VsBaseline: number;
    apoptosisV001VsBaseline: number;
    invasionV001VsBaseline: number;
    immuneRecognitionV001VsBaseline: number;
    lungColonisationV001VsBaseline: number;
  };
}
export interface OpsccStudyReport {
  reportId: string;
  createdAt: string;
  modelId: string;
  modelName: string;
  candidateId: string;
  candidateDescription: string;
  replicateCount: number;
  baseSeed: number;
  notice: string;
  familyContext: string;
  personalPurpose: string;
  evidenceBoundary: string[];
  results: OpsccScenarioResult[];
}

function rng(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
function mean(values: number[]) { return values.reduce((a,b)=>a+b,0)/Math.max(1,values.length); }
function sampleSd(values: number[]) { if(values.length<2)return 0; const m=mean(values); return Math.sqrt(values.reduce((sum,value)=>sum+(value-m)**2,0)/(values.length-1)); }
function clamp(v: number, min=0, max=100) { return Math.max(min,Math.min(max,v)); }
function summarise(rows: OpsccReplicate[]): OpsccArmSummary {
  return {
    tumourBurdenMean: mean(rows.map(x=>x.tumourBurdenIndex)),
    apoptosisMean: mean(rows.map(x=>x.apoptosisIndex)),
    invasionMean: mean(rows.map(x=>x.invasionIndex)),
    immuneRecognitionMean: mean(rows.map(x=>x.immuneRecognitionIndex)),
    lungColonisationMean: mean(rows.map(x=>x.lungColonisationIndex)),
    tumourBurdenSd: sampleSd(rows.map(x=>x.tumourBurdenIndex)),
    apoptosisSd: sampleSd(rows.map(x=>x.apoptosisIndex)),
    invasionSd: sampleSd(rows.map(x=>x.invasionIndex)),
    immuneRecognitionSd: sampleSd(rows.map(x=>x.immuneRecognitionIndex)),
    lungColonisationSd: sampleSd(rows.map(x=>x.lungColonisationIndex)),
  };
}
function runScenario(scenario: OpsccScenario, baseSeed: number, replicateCount: number): OpsccScenarioResult {
  const positive = scenario === 'hpv16-positive-comparator';
  const arms: Record<Arm, OpsccReplicate[]> = { baseline: [], sham: [], v001: [] };
  for (let i=0;i<replicateCount;i++) {
    const seed = (baseSeed + (i+1)*104729 + (positive?17:7919)) >>> 0;
    const random = rng(seed);
    const noise = () => (random()-0.5)*10;
    const startingBurden = clamp(70+noise());
    const startingApoptosis = clamp(24+noise());
    const startingInvasion = clamp(62+noise());
    const startingImmune = clamp((positive?34:28)+noise());
    const startingColonisation = clamp(48+noise());
    const baseline: OpsccReplicate = {
      replicate:i+1,seed,arm:'baseline',
      tumourBurdenIndex:startingBurden,
      apoptosisIndex:startingApoptosis,
      invasionIndex:startingInvasion,
      immuneRecognitionIndex:startingImmune,
      lungColonisationIndex:startingColonisation,
    };
    // Sham is a matched no-effect intervention. It shares the replicate's
    // starting state and adds only a small, explicitly synthetic perturbation.
    const sham: OpsccReplicate = {
      ...baseline,arm:'sham',
      tumourBurdenIndex:clamp(startingBurden+noise()*0.04),
      apoptosisIndex:clamp(startingApoptosis+noise()*0.04),
      invasionIndex:clamp(startingInvasion+noise()*0.04),
      immuneRecognitionIndex:clamp(startingImmune+noise()*0.04),
      lungColonisationIndex:clamp(startingColonisation+noise()*0.04),
    };
    // V001 is an abstract, dimensionless hypothesis switch, not a vector
    // sequence, target specification, delivery design, dose or protocol.
    const strength = 0.55;
    const immuneGain = (positive?0.72:0.58)*strength;
    const apoptosisGain = (positive?0.48:0.52)*strength;
    const invasionReduction = 0.38*strength;
    const v001: OpsccReplicate = {
      ...baseline,arm:'v001',
      tumourBurdenIndex:clamp(startingBurden*(1-apoptosisGain*0.20-immuneGain*0.12)+noise()*0.08),
      apoptosisIndex:clamp(startingApoptosis+apoptosisGain*22+noise()*0.08),
      invasionIndex:clamp(startingInvasion*(1-invasionReduction*0.24)+noise()*0.08),
      immuneRecognitionIndex:clamp(startingImmune+immuneGain*28+noise()*0.08),
      lungColonisationIndex:clamp(startingColonisation*(1-invasionReduction*0.18-immuneGain*0.10)+noise()*0.08),
    };
    arms.baseline.push(baseline); arms.sham.push(sham); arms.v001.push(v001);
  }
  const summaries = {baseline:summarise(arms.baseline),sham:summarise(arms.sham),v001:summarise(arms.v001)};
  const b=summaries.baseline, v=summaries.v001;
  return {
    scenario,
    title:positive?'HPV16-positive comparator scenario':'HPV-independent / HPV-negative hypothesis scenario (not patient status)',
    replicates:replicateCount,arms,summaries,
    differences:{
      tumourBurdenV001VsBaseline:v.tumourBurdenMean-b.tumourBurdenMean,
      apoptosisV001VsBaseline:v.apoptosisMean-b.apoptosisMean,
      invasionV001VsBaseline:v.invasionMean-b.invasionMean,
      immuneRecognitionV001VsBaseline:v.immuneRecognitionMean-b.immuneRecognitionMean,
      lungColonisationV001VsBaseline:v.lungColonisationMean-b.lungColonisationMean,
    },
  };
}
export function runOpsccV001Study(options?: {baseSeed?:number;replicateCount?:number}): OpsccStudyReport {
  const baseSeed=options?.baseSeed??Math.floor(Math.random()*2_000_000_000)+1;
  const replicateCount=Math.max(10,Math.min(500,Math.floor(options?.replicateCount??100)));
  return {
    reportId:`OPSCC-V001-${baseSeed}`,createdAt:new Date().toISOString(),
    modelId:OPSCC_MODEL_ID,modelName:OPSCC_MODEL_NAME,candidateId:OPSCC_CANDIDATE_ID,
    candidateDescription:'Abstract computational hypothesis combining simulated tumour-survival, invasion and immune-recognition effects. No physical vector or molecular construct is specified.',
    replicateCount,baseSeed,notice:OPSCC_NOTICE,
    familyContext:'Family-reported oropharyngeal squamous cell carcinoma with reported right-lung secondary metastasis; prior chemotherapy/radiotherapy and current pembrolizumab. Exact primary subsite, HPV/p16 and PD-L1 status are not available in this model.',
    personalPurpose:'This run is motivated by a wish to understand the biology behind a real family experience. The personal story is the reason for asking the questions; it is not used to calibrate or predict an individual outcome.',
    evidenceBoundary:[
      'UPCI-SCC-090 is an HPV16-positive base-of-tongue cell-line comparator, not the patient’s tumour.',
      'The HPV-independent scenario is a separate hypothetical comparison; the patient’s HPV/p16 status remains unknown.',
      'All intervention effects, indices, noise distributions and equations are invented teaching assumptions, not fitted to biological datasets.',
      'The lung-colonisation index is a conceptual proxy only; no invasion assay, circulation, extravasation, organ microenvironment or metastatic event is simulated.',
      'PD-1/PD-L1 and pembrolizumab biology are not mechanistically modelled in this first version.',
      'No real genetic sequence, vector architecture, delivery system, dose, wet-lab protocol or treatment recommendation is provided.',
      'Results cannot predict this individual’s response, prognosis, progression or survival.'
    ],
    results:[
      runScenario('hpv16-positive-comparator',baseSeed,replicateCount),
      runScenario('hpv-independent-hypothesis',baseSeed,replicateCount)
    ],
  };
}
export function formatOpsccV001Report(report: OpsccStudyReport): string {
  const lines=[
    'GENESIS LAB — GENESIS-OPSCC-V001 EDUCATIONAL COMPUTATIONAL STUDY',
    report.notice,`Report: ${report.reportId}`,`Created: ${report.createdAt}`,
    `Comparator: ${report.modelName}`,`Candidate: ${report.candidateId}`,
    `Replicates per arm per scenario: ${report.replicateCount}`,`Base seed: ${report.baseSeed}`,
    '', 'PERSONAL PURPOSE',report.personalPurpose,'','FAMILY CONTEXT (reported; not independently verified)',report.familyContext,
    '', 'CANDIDATE DESCRIPTION',report.candidateDescription,
  ];
  for(const result of report.results){
    lines.push('',`=== ${result.title} ===`,'Mean ± sample SD indices (0–100; dimensionless teaching values):',
      'Arm | Tumour burden | Apoptosis | Invasion | Immune recognition | Lung-colonisation proxy');
    for(const arm of ['baseline','sham','v001'] as const){
      const x=result.summaries[arm];
      lines.push(`${arm} | ${x.tumourBurdenMean.toFixed(2)} ± ${x.tumourBurdenSd.toFixed(2)} | ${x.apoptosisMean.toFixed(2)} ± ${x.apoptosisSd.toFixed(2)} | ${x.invasionMean.toFixed(2)} ± ${x.invasionSd.toFixed(2)} | ${x.immuneRecognitionMean.toFixed(2)} ± ${x.immuneRecognitionSd.toFixed(2)} | ${x.lungColonisationMean.toFixed(2)} ± ${x.lungColonisationSd.toFixed(2)}`);
    }
    lines.push('V001 minus baseline:',JSON.stringify(result.differences,null,2),'Replicate-level V001 rows:',
      ...result.arms.v001.map(x=>`replicate ${x.replicate}, seed ${x.seed}: burden ${x.tumourBurdenIndex.toFixed(2)}, apoptosis ${x.apoptosisIndex.toFixed(2)}, invasion ${x.invasionIndex.toFixed(2)}, immune ${x.immuneRecognitionIndex.toFixed(2)}, lung proxy ${x.lungColonisationIndex.toFixed(2)}`));
  }
  lines.push('','EVIDENCE BOUNDARIES',...report.evidenceBoundary.map(x=>`- ${x}`),'',
    'Interpretation: these are outputs of an invented mathematical teaching model. They are not biological measurements or evidence of therapeutic efficacy.');
  return lines.join('\n');
}
