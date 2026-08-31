import type { ActiveExperimentSetup, ControlConfiguration, ReportLanguageLevel, ScientificReport, TransferredMolecule } from '../types/experimentWorkspace';
import type { EnvironmentConditions, Simulation } from '../types';
import type { ResearchProject } from '../types/scientific';
import { biologicalSystemTypeLabel } from './organismSimulationProfile';
import { formatPopulation } from '../simulation/engine';

export const GENESIS_LAB_VERSION = '0.5.0-phase5';

export interface ReportQualityFlag {
  id: string;
  severity: 'warning' | 'info';
  message: string;
}

export function buildScientificReport(
  setup: ActiveExperimentSetup,
  experimentalSim: Simulation | null,
  controlSim: Simulation | null,
  project: ResearchProject | null,
  reportLevel: ReportLanguageLevel = 'standard',
  author = '',
): ScientificReport {
  const expState = experimentalSim?.organismState;
  const ctrlState = controlSim?.organismState;
  const now = new Date().toISOString();
  const comparison = computeComparison(expState, ctrlState, experimentalSim, controlSim, reportLevel);

  const sections = [
    section('title', t('Title', reportLevel), setup.sampleDisplayName, 'user-entered'),
    section('experiment-id', t('Experiment ID', reportLevel), setup.id, 'imported'),
    section('run-id', t('Run ID', reportLevel), experimentalSim?.id ?? 'Not recorded', experimentalSim ? 'model-generated' : 'not-recorded'),
    section('author', t('Author', reportLevel), author || 'Not recorded', author ? 'user-entered' : 'not-recorded'),
    section('datetime', t('Date / Time', reportLevel), now, 'model-generated'),
    section('project', t('Project', reportLevel), project?.title ?? setup.projectId ?? 'Not recorded', project ? 'imported' : 'not-recorded'),
    section('aim', t('Aim / Research Question', reportLevel), project?.researchQuestion ?? 'Not recorded', project ? 'imported' : 'not-recorded'),
    section('hypothesis', t('Hypothesis', reportLevel), project?.hypothesis ?? 'Not recorded', project ? 'imported' : 'not-recorded'),
    section('sample', t('Biological sample', reportLevel), formatSample(setup, reportLevel), 'imported'),
    section('setup', t('Experimental setup', reportLevel), formatSetup(setup, reportLevel), 'imported'),
    section('control', t('Control setup', reportLevel), formatControlDetail(setup.control, reportLevel), setup.control.mode === 'none-not-applicable' ? 'user-entered' : 'imported'),
    section('variables', t('Independent / dependent variables', reportLevel), describeVariables(setup, reportLevel), 'user-entered'),
    section('environment', t('Environmental conditions', reportLevel), formatEnvironment(setup.environment, reportLevel), 'user-entered'),
    section('treatments', t('Treatments / additions', reportLevel), formatTreatments(setup.transferredMolecules, reportLevel), 'user-entered'),
    section('method', t('Method summary', reportLevel), formatMethod(setup, experimentalSim, reportLevel), 'reference'),
    section('duration', t('Duration', reportLevel), experimentalSim ? `${experimentalSim.timeHours.toFixed(1)} simulated hours` : 'Not recorded', experimentalSim ? 'model-generated' : 'not-recorded'),
    section('results', t('Results', reportLevel), formatResults(expState, experimentalSim, reportLevel), expState ? 'model-generated' : 'not-recorded'),
    section('measurements', t('Key measurements', reportLevel), formatMeasurements(expState, ctrlState, reportLevel), expState ? 'model-generated' : 'not-recorded'),
    section('control-comparison', t('Experimental vs control comparison', reportLevel), comparison.summary, comparison.source),
    section('observations', t('Observations', reportLevel), formatObservations(experimentalSim, reportLevel), experimentalSim?.events.length ? 'model-generated' : 'not-recorded'),
    section('interpretation', t('Interpretation', reportLevel), formatInterpretation(comparison, setup, reportLevel), comparison.source === 'not-recorded' ? 'not-recorded' : 'model-generated'),
    section('limitations', t('Limitations', reportLevel), formatLimitations(reportLevel), 'reference'),
    section('conclusion', t('Conclusion', reportLevel), 'Not recorded — edit before export.', 'not-recorded'),
    section('provenance', t('Provenance', reportLevel), formatProvenance(setup, experimentalSim, reportLevel), 'imported'),
    section('disclaimer', t('Educational / simulation disclaimer', reportLevel), formatDisclaimer(reportLevel), 'reference'),
  ];

  return {
    id: `RPT-${Date.now().toString(36).toUpperCase()}`,
    experimentSetupId: setup.id,
    title: setup.sampleDisplayName,
    author,
    sections,
    qualityFlags: assessReportQuality(setup, experimentalSim).map((f) => f.message),
    reportLevel,
    createdAt: now,
    updatedAt: now,
    finalized: false,
  };
}

function t(title: string, _level: ReportLanguageLevel): string {
  return title;
}

function section(
  id: string,
  title: string,
  content: string,
  source: ScientificReport['sections'][0]['source'],
) {
  return { id, title, content, source };
}

function formatSample(setup: ActiveExperimentSetup, level: ReportLanguageLevel): string {
  const base = `${setup.sampleId}: ${setup.sampleDisplayName} (${biologicalSystemTypeLabel(setup.catalogueCategory)})`;
  if (level === 'simple') return `Sample tested: ${setup.sampleDisplayName} — a ${biologicalSystemTypeLabel(setup.catalogueCategory).toLowerCase()}. ID: ${setup.sampleId}.`;
  if (level === 'technical') return `${base}; catalogue=${setup.catalogueEntryId}; lifecycle=${setup.lifecycle}; provenance=${setup.provenance}`;
  return base;
}

function formatSetup(setup: ActiveExperimentSetup, level: ReportLanguageLevel): string {
  const parts = [`Sample ${setup.sampleId}`, `Environment model applied`, `Lifecycle: ${setup.lifecycle}`];
  if (setup.startedAt) parts.push(`Started: ${setup.startedAt}`);
  if (level === 'technical') parts.push(`History events: ${setup.history.length}`);
  return parts.join('; ');
}

function formatControlDetail(control: ControlConfiguration, level: ReportLanguageLevel): string {
  if (control.mode === 'none-not-applicable') {
    return level === 'simple'
      ? `No control used — marked not applicable (${control.reason ?? 'reason not recorded'}).`
      : `No control — not applicable (${control.reason ?? 'reason not recorded'})`;
  }
  const env = `pH ${control.environment.ph}, T ${control.environment.temperature}°C, O₂ ${control.environment.oxygen}%`;
  if (level === 'technical') return `${control.sampleId}: ${control.displayName} [${control.mode}]; ${env}; catalogue=${control.catalogueEntryId}`;
  return `${control.sampleId}: ${control.displayName} (${control.mode}) — ${env}, no treatment`;
}

function listByRole(molecules: TransferredMolecule[], role: TransferredMolecule['role']): string {
  return molecules.filter((m) => m.role === role).map((m) => m.name).join(', ');
}

function formatTreatments(molecules: TransferredMolecule[], level: ReportLanguageLevel): string {
  const treatments = listByRole(molecules, 'treatment');
  const nutrients = listByRole(molecules, 'nutrient');
  const added = listByRole(molecules, 'sample-component');
  if (!treatments && !nutrients && !added) return 'None recorded';
  if (level === 'simple') {
    const parts: string[] = [];
    if (treatments) parts.push(`Treatment added: ${treatments}`);
    if (nutrients) parts.push(`Nutrients: ${nutrients}`);
    if (added) parts.push(`Sample components: ${added}`);
    return parts.join('. ');
  }
  const parts: string[] = [];
  if (treatments) parts.push(`Treatments: ${treatments}`);
  if (nutrients) parts.push(`Nutrients: ${nutrients}`);
  if (added) parts.push(`Added: ${added}`);
  return parts.join('; ') || 'None recorded';
}

function formatEnvironment(env: EnvironmentConditions, level: ReportLanguageLevel): string {
  const base = `T ${env.temperature}°C, pH ${env.ph}, O₂ ${env.oxygen}%, CO₂ ${env.carbonDioxide}%, nutrients ${env.nutrientAvailability}%`;
  if (level === 'technical') {
    return `${base}; humidity ${env.humidity}%, pressure ${env.pressure} kPa, salinity ${env.salinity} ppt, radiation ${env.radiationExposure} mSv/h`;
  }
  if (level === 'simple') return `Temperature ${env.temperature}°C, acidity pH ${env.ph}, oxygen ${env.oxygen}%, food/nutrients ${env.nutrientAvailability}%.`;
  return base;
}

function describeVariables(setup: ActiveExperimentSetup, level: ReportLanguageLevel): string {
  const independent = ['temperature', 'pH', 'oxygen', 'nutrients', 'treatments'].join(', ');
  const dependent = 'viability, population, stress (model outputs)';
  if (level === 'simple') return `What we changed (independent): environment and any treatments. What we measured (dependent): how well the sample survived and grew in the model.`;
  if (level === 'technical') return `Independent: ${independent}; sample=${setup.sampleId}; Dependent: ${dependent}; control=${setup.control.sampleId}`;
  return `Independent: environmental parameters and treatments; Dependent: ${dependent}; Sample: ${setup.sampleDisplayName}`;
}

function formatMethod(setup: ActiveExperimentSetup, sim: Simulation | null, level: ReportLanguageLevel): string {
  if (level === 'simple') return `Educational computer simulation in Genesis Lab. The model applies simplified rules — not a real wet-lab protocol.`;
  if (level === 'technical') {
    return `Genesis Lab educational simulation (${GENESIS_LAB_VERSION}); organismId=${setup.catalogueEntryId}; seed=${sim?.seed ?? 'n/a'}; variability=${sim?.variabilityEnabled ?? false}; speed=${sim?.speed ?? 1}×`;
  }
  return `Educational simulation using Genesis Lab model (${GENESIS_LAB_VERSION}). Prototype rules — not validated physical or biological methodology.`;
}

function formatResults(
  expState: Simulation['organismState'] | undefined,
  sim: Simulation | null,
  level: ReportLanguageLevel,
): string {
  if (!expState || !sim) return 'Not recorded';
  if (level === 'simple') return `After ${sim.timeHours.toFixed(1)} simulated hours, viability was ${expState.viability.toFixed(1)}% and the modelled population was ${formatPopulation(expState.population)}.`;
  return `At ${sim.timeHours.toFixed(1)} h: viability ${expState.viability.toFixed(1)}%; population ${formatPopulation(expState.population)}; stress ${expState.stress.toFixed(1)}%`;
}

function formatMeasurements(
  expState: Simulation['organismState'] | undefined,
  ctrlState: Simulation['organismState'] | undefined,
  level: ReportLanguageLevel,
): string {
  if (!expState) return 'Not recorded';
  const lines = [
    `Viability ${expState.viability.toFixed(1)}%`,
    `Population ${formatPopulation(expState.population)}`,
    `Replication ${expState.replicationRate.toFixed(3)}/h`,
    `Stress ${expState.stress.toFixed(1)}%`,
  ];
  if (ctrlState) lines.push(`Control viability ${ctrlState.viability.toFixed(1)}%`);
  if (level === 'simple') return `Main readings: ${lines.slice(0, 2).join('; ')}.`;
  if (level === 'technical') return lines.join('; ') + `; mutation indicator ${expState.mutationIndicator.toFixed(2)}%; tolerance ${expState.environmentalTolerance.toFixed(1)}%`;
  return lines.join('; ');
}

function computeComparison(
  exp: Simulation['organismState'] | undefined,
  ctrl: Simulation['organismState'] | undefined,
  expSim: Simulation | null,
  ctrlSim: Simulation | null,
  level: ReportLanguageLevel,
): { summary: string; source: ScientificReport['sections'][0]['source'] } {
  if (!exp || !ctrl || !expSim) {
    return { summary: 'Not recorded — control simulation not available or not applicable', source: 'not-recorded' };
  }
  const deltaV = exp.viability - ctrl.viability;
  const pctV = ctrl.viability !== 0 ? ((deltaV / ctrl.viability) * 100) : 0;
  const popDelta = exp.population - ctrl.population;
  const popPct = ctrl.population !== 0 ? ((popDelta / ctrl.population) * 100) : 0;

  if (level === 'simple') {
    return {
      summary: `Experimental viability ${exp.viability.toFixed(1)}% vs control ${ctrl.viability.toFixed(1)}% — a difference of ${deltaV >= 0 ? '+' : ''}${deltaV.toFixed(1)} percentage points (${pctV >= 0 ? '+' : ''}${pctV.toFixed(1)}% relative change).`,
      source: 'model-generated',
    };
  }
  if (level === 'technical') {
    const expStart = expSim.snapshots[0]?.organismState;
    const ctrlStart = ctrlSim?.snapshots[0]?.organismState;
    const parts = [
      `Δviability ${deltaV >= 0 ? '+' : ''}${deltaV.toFixed(2)} pp (${pctV >= 0 ? '+' : ''}${pctV.toFixed(2)}%)`,
      `Δpopulation ${popDelta >= 0 ? '+' : ''}${formatPopulation(Math.abs(popDelta))} (${popPct >= 0 ? '+' : ''}${popPct.toFixed(2)}%)`,
      `t=${expSim.timeHours.toFixed(2)} h`,
    ];
    if (expStart && ctrlStart) {
      parts.push(`viability change exp ${(exp.viability - expStart.viability).toFixed(2)} pp`, `ctrl ${(ctrl.viability - ctrlStart.viability).toFixed(2)} pp`);
    }
    return { summary: parts.join('; '), source: 'model-generated' };
  }
  return {
    summary: `Experimental viability ${exp.viability.toFixed(1)}% vs control ${ctrl.viability.toFixed(1)}% (Δ ${deltaV >= 0 ? '+' : ''}${deltaV.toFixed(1)} pp, ${pctV >= 0 ? '+' : ''}${pctV.toFixed(1)}%); population Δ ${popPct >= 0 ? '+' : ''}${popPct.toFixed(1)}%`,
    source: 'model-generated',
  };
}

function formatObservations(sim: Simulation | null, level: ReportLanguageLevel): string {
  if (!sim?.events.length) return 'None recorded';
  const events = sim.events.slice(-5).map((e) => `${e.timeHours.toFixed(1)} h: ${e.message}`);
  if (level === 'simple') return events.join(' ');
  return events.join('; ');
}

function formatInterpretation(
  comparison: { summary: string; source: ScientificReport['sections'][0]['source'] },
  setup: ActiveExperimentSetup,
  level: ReportLanguageLevel,
): string {
  if (comparison.source === 'not-recorded') return 'Not recorded — insufficient control or results data for comparison.';
  if (level === 'simple') return `The experimental condition differed from the control as shown above. ${setup.control.mode === 'none-not-applicable' ? 'No control was used, so comparison is limited.' : 'Interpret cautiously — this is an educational model.'}`;
  if (level === 'technical') return `Model-derived comparison only; control mode=${setup.control.mode}. ${comparison.summary}. Causal inference not supported by prototype simulation.`;
  return `Model comparison recorded. ${comparison.summary}. Educational interpretation only.`;
}

function formatLimitations(level: ReportLanguageLevel): string {
  if (level === 'simple') return 'This is a simplified educational simulation. It does not replace real experiments or clinical testing.';
  if (level === 'technical') return `Prototype educational simulation (${GENESIS_LAB_VERSION}) — deterministic/semi-stochastic rules; not validated for predictive, clinical, or regulatory use; parameter coupling simplified.`;
  return 'Prototype educational simulation — not validated for clinical or predictive use.';
}

function formatProvenance(setup: ActiveExperimentSetup, sim: Simulation | null, level: ReportLanguageLevel): string {
  const base = `Experiment ${setup.id}; sample ${setup.sampleId}; control ${setup.control.sampleId}; provenance ${setup.provenance}`;
  if (level === 'technical') return `${base}; run ${sim?.id ?? 'n/a'}; seed ${sim?.seed ?? 'n/a'}; updated ${setup.updatedAt}`;
  return base;
}

function formatDisclaimer(level: ReportLanguageLevel): string {
  if (level === 'simple') return 'All results are from a computer simulation for learning. They are not medical or laboratory advice.';
  return 'All results are simulated and for educational purposes only. Not for clinical diagnosis, therapeutic decisions, or wet-lab protocols.';
}

export function assessReportQuality(
  setup: ActiveExperimentSetup,
  sim: Simulation | null,
): ReportQualityFlag[] {
  const flags: ReportQualityFlag[] = [];
  if (setup.control.mode === 'custom' || setup.control.mode === 'auto-baseline') {
    flags.push({ id: 'control-ok', severity: 'info', message: 'Control configured' });
  } else if (setup.control.mode === 'none-not-applicable') {
    flags.push({ id: 'control-na', severity: 'info', message: 'No control — marked not applicable' });
  } else {
    flags.push({ id: 'control-missing', severity: 'warning', message: 'Missing control' });
  }
  if (!sim || sim.snapshots.length === 0) {
    flags.push({ id: 'no-results', severity: 'warning', message: 'Missing observations / simulation results' });
  }
  if (!setup.notes.trim()) {
    flags.push({ id: 'no-notes', severity: 'info', message: 'Missing background notes' });
  }
  return flags;
}

export function reportToMarkdown(report: ScientificReport): string {
  const lines = [
    `# ${report.title}`,
    '',
    `Author: ${report.author || 'Not recorded'}`,
    `Report level: ${report.reportLevel}`,
    `Generated: ${report.createdAt}`,
    '',
  ];
  for (const s of report.sections) {
    lines.push(`## ${s.title}`, `[${s.source}]`, s.content, '');
  }
  if (report.qualityFlags.length) {
    lines.push('## Quality checks', ...report.qualityFlags.map((f) => `- ${f}`));
  }
  return lines.join('\n');
}
