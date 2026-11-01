/** Educational OPSCC mechanism-dissection simulator. All coefficients and scores are invented teaching assumptions. */
export const OPSCC_MECHANISM_NOTICE='Educational computational simulation only — invented dimensionless assumptions; not biological evidence or clinical efficacy.';
export const OPSCC_MECHANISM_ID='GENESIS-OPSCC-MECH-001';
export type OpsccMechanismScenario='hpv16-positive-comparator'|'hpv-independent-hypothesis';
export type OpsccMechanismId='tumour-survival'|'apoptosis'|'local-invasion'|'intravasation'|'circulation-survival'|'extravasation'|'lung-colonisation'|'immune-recognition'|'treatment-resistance';
export interface OpsccMechanismDefinition{id:OpsccMechanismId;label:string;question:string;direction:'lower'|'higher';assumedEffect:number;}
export const OPSCC_MECHANISMS:OpsccMechanismDefinition[]=[
{id:'tumour-survival',label:'Tumour-cell survival',question:'What if survival signalling were reduced?',direction:'lower',assumedEffect:-5},
{id:'apoptosis',label:'Programmed cell death (apoptosis)',question:'What if susceptibility to apoptosis were increased?',direction:'higher',assumedEffect:5.5},
{id:'local-invasion',label:'Local tissue invasion',question:'What if local invasion capacity were reduced?',direction:'lower',assumedEffect:-4},
{id:'intravasation',label:'Entry into blood/lymph vessels',question:'What if entry into circulation were reduced?',direction:'lower',assumedEffect:-3.5},
{id:'circulation-survival',label:'Survival in circulation',question:'What if survival while travelling were reduced?',direction:'lower',assumedEffect:-3},
{id:'extravasation',label:'Exit into distant tissue',question:'What if exit from vessels into lung tissue were reduced?',direction:'lower',assumedEffect:-3},
{id:'lung-colonisation',label:'Lung-site colonisation',question:'What if establishment at a distant site were reduced?',direction:'lower',assumedEffect:-3.5},
{id:'immune-recognition',label:'Immune recognition',question:'What if tumour recognition by immune cells were increased?',direction:'higher',assumedEffect:7},
{id:'treatment-resistance',label:'Treatment resistance',question:'What if resistance-associated survival were reduced?',direction:'lower',assumedEffect:-4}
];
export interface OpsccMechanismSummary{mean:number;sampleSd:number;}
export interface OpsccMechanismArmResult{id:string;label:string;summaries:Record<OpsccMechanismId,OpsccMechanismSummary>;}
export interface OpsccMechanismScenarioResult{scenario:OpsccMechanismScenario;title:string;arms:OpsccMechanismArmResult[];}
export interface OpsccMechanismReport{reportId:string;createdAt:string;baseSeed:number;replicateCount:number;modelId:string;comparator:string;notice:string;purpose:string;familyContext:string;scenarios:OpsccMechanismScenarioResult[];boundaries:string[];}
const BASE:Record<OpsccMechanismId,number>={'tumour-survival':70,apoptosis:24,'local-invasion':62,intravasation:55,'circulation-survival':48,extravasation:42,'lung-colonisation':48,'immune-recognition':34,'treatment-resistance':58};
function rng(seed:number){let x=seed>>>0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function clamp(v:number){return Math.max(0,Math.min(100,v));}
function mean(v:number[]){return v.reduce((a,b)=>a+b,0)/Math.max(1,v.length);}
function sd(v:number[]){if(v.length<2)return 0;const m=mean(v);return Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/(v.length-1));}
function summarise(rows:Record<OpsccMechanismId,number>[]):Record<OpsccMechanismId,OpsccMechanismSummary>{return Object.fromEntries(OPSCC_MECHANISMS.map(m=>{const v=rows.map(r=>r[m.id]);return[m.id,{mean:mean(v),sampleSd:sd(v)}];})) as Record<OpsccMechanismId,OpsccMechanismSummary>;}
function runScenario(scenario:OpsccMechanismScenario,baseSeed:number,n:number):OpsccMechanismScenarioResult{
const positive=scenario==='hpv16-positive-comparator';const baseline:Record<OpsccMechanismId,number>[]=[];
for(let i=0;i<n;i++){const r=rng((baseSeed+(i+1)*130363+(positive?101:10007))>>>0);const row={} as Record<OpsccMechanismId,number>;for(const m of OPSCC_MECHANISMS){const center=m.id==='immune-recognition'?(positive?34:28):BASE[m.id];row[m.id]=clamp(center+(r()-.5)*8);}baseline.push(row);}
const arms:OpsccMechanismArmResult[]=[{id:'baseline',label:'Untreated baseline',summaries:summarise(baseline)},{id:'sham',label:'Matched no-effect sham',summaries:summarise(baseline.map(r=>({...r})))}];
for(const m of OPSCC_MECHANISMS){arms.push({id:m.id,label:m.label,summaries:summarise(baseline.map(r=>({...r,[m.id]:clamp(r[m.id]+m.assumedEffect)})))});}
arms.push({id:'combined-v001',label:'Combined V001 hypothesis (all mechanisms switched on)',summaries:summarise(baseline.map(r=>Object.fromEntries(OPSCC_MECHANISMS.map(m=>[m.id,clamp(r[m.id]+m.assumedEffect)])) as Record<OpsccMechanismId,number>))});
return{scenario,title:positive?'HPV16-positive UPCI-SCC-090 comparator scenario':'HPV-independent / HPV-negative hypothesis (not patient status)',arms};
}
export function runOpsccMechanismStudy(options?:{baseSeed?:number;replicateCount?:number}):OpsccMechanismReport{
const baseSeed=options?.baseSeed??Math.floor(Math.random()*2_000_000_000)+1;const replicateCount=Math.max(10,Math.min(500,Math.floor(options?.replicateCount??100)));
return{reportId:`OPSCC-MECH-${baseSeed}`,createdAt:new Date().toISOString(),baseSeed,replicateCount,modelId:OPSCC_MECHANISM_ID,comparator:'UPCI-SCC-090 (HPV16-positive base-of-tongue OPSCC comparator)',notice:OPSCC_MECHANISM_NOTICE,purpose:'The personal motivation is to understand the biology behind a real family experience. Personal context motivates the questions but is not used to calibrate or predict an individual outcome.',familyContext:'Family-reported OPSCC with reported right-lung secondary metastasis; prior chemotherapy/radiotherapy and current pembrolizumab. Exact subsite, HPV/p16 and PD-L1 status are unknown to this model.',scenarios:[runScenario('hpv16-positive-comparator',baseSeed,replicateCount),runScenario('hpv-independent-hypothesis',baseSeed,replicateCount)],boundaries:[
'All numerical scores, baseline values, noise and intervention effects are invented dimensionless teaching assumptions, not fitted to biological data.',
'The biological topics are real areas of cancer research; the simulated intervention effects are hypotheses, not established effects.',
'Each mechanism is changed independently to isolate its assumed contribution. The combined arm adds all assumptions; it does not model biological interactions or feedback.',
'The metastatic cascade stages are separate conceptual indices, not simulated cells moving through vessels or colonising lung tissue.',
'Immune recognition is not a mechanistic PD-1/PD-L1 or pembrolizumab model.',
'Treatment resistance is a conceptual score; therapy resistance pathways are not mechanistically represented.',
'UPCI-SCC-090 is a comparator cell line, not the patient tumour. HPV status remains unknown; the HPV-independent scenario is hypothetical.',
'No real vector sequence, molecular architecture, delivery system, dose, wet-lab protocol or treatment recommendation is included.',
'Outputs cannot predict an individual response, prognosis, progression or survival.'
]};
}
export function formatOpsccMechanismReport(report:OpsccMechanismReport):string{
const lines=['GENESIS LAB — OPSCC MECHANISM-DISSECTION STUDY',report.notice,`Report: ${report.reportId}`,`Created: ${report.createdAt}`,`Comparator: ${report.comparator}`,`Replicates per arm per scenario: ${report.replicateCount}`,`Base seed: ${report.baseSeed}`,'','PERSONAL PURPOSE',report.purpose,'','FAMILY CONTEXT (reported; not independently verified)',report.familyContext];
for(const s of report.scenarios){lines.push('',`=== ${s.title} ===`,'Arm | Mechanism | Mean ± sample SD (0–100)');for(const a of s.arms)for(const m of OPSCC_MECHANISMS){const x=a.summaries[m.id];lines.push(`${a.id} | ${m.label} | ${x.mean.toFixed(2)} ± ${x.sampleSd.toFixed(2)}`);}}
lines.push('','EVIDENCE BOUNDARIES',...report.boundaries.map(x=>`- ${x}`),'','Interpretation: mathematical teaching exercise, not biological evidence or therapeutic efficacy.');return lines.join('\n');
}
