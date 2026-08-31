import type { ActiveExperimentSetup, ScientificReport } from '../types/experimentWorkspace';
import type { Simulation } from '../types';
import { GENESIS_LAB_VERSION, reportToMarkdown } from './reportGenerator';

export interface ExportProvenance {
  genesisLabVersion: string;
  experimentId: string;
  sampleId: string;
  controlId: string;
  runId: string;
  createdAt: string;
  simulationStatus: string;
  terminologyMode: string;
  reportLevel?: string;
  modelDerivedFields: string[];
  userEnteredFields: string[];
}

export function buildExportProvenance(
  setup: ActiveExperimentSetup,
  sim: Simulation | null,
  terminologyMode: string,
): ExportProvenance {
  return {
    genesisLabVersion: GENESIS_LAB_VERSION,
    experimentId: setup.id,
    sampleId: setup.sampleId,
    controlId: setup.control.sampleId,
    runId: sim?.id ?? 'Not recorded',
    createdAt: new Date().toISOString(),
    simulationStatus: setup.lifecycle,
    terminologyMode,
    reportLevel: terminologyMode,
    modelDerivedFields: ['results', 'duration', 'model-observations', 'control-comparison'],
    userEnteredFields: ['author', 'background', 'conclusion', 'treatments'],
  };
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportJson(report: ScientificReport, provenance: ExportProvenance) {
  downloadTextFile(
    `${report.title.replace(/\s+/g, '_')}_report.json`,
    JSON.stringify({ report, provenance }, null, 2),
    'application/json',
  );
}

export function exportReportMarkdown(report: ScientificReport) {
  downloadTextFile(`${report.title.replace(/\s+/g, '_')}_report.md`, reportToMarkdown(report), 'text/markdown');
}

export function exportExperimentCsv(setup: ActiveExperimentSetup, sim: Simulation | null, controlSim: Simulation | null) {
  const rows = [
    ['field', 'value', 'source'],
    ['sampleId', setup.sampleId, 'user'],
    ['sampleName', setup.sampleDisplayName, 'user'],
    ['viability', sim?.organismState.viability.toFixed(2) ?? '', 'model'],
    ['controlViability', controlSim?.organismState.viability.toFixed(2) ?? '', 'model'],
    ['timeHours', sim?.timeHours.toFixed(2) ?? '', 'model'],
    ['temperature', String(setup.environment.temperature), 'user'],
    ['ph', String(setup.environment.ph), 'user'],
  ];
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadTextFile(`${setup.sampleId}_results.csv`, csv, 'text/csv');
}

export function exportExperimentJson(setup: ActiveExperimentSetup, sim: Simulation | null, controlSim: Simulation | null, provenance: ExportProvenance) {
  downloadTextFile(
    `${setup.id}_experiment.json`,
    JSON.stringify({ setup, experimentalSimulation: sim, controlSimulation: controlSim, provenance }, null, 2),
    'application/json',
  );
}

export function openReportPrintPreview(report: ScientificReport) {
  const html = `<!DOCTYPE html><html><head><title>${report.title}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:2rem auto;line-height:1.5}
h1{border-bottom:2px solid #333}h2{margin-top:1.5rem;color:#444}.source{font-size:12px;color:#666;font-style:italic}</style></head><body>
<h1>${report.title}</h1>
${report.sections.map((s) => `<h2>${s.title}</h2><p class="source">Source: ${s.source}</p><p>${s.content}</p>`).join('')}
<p><em>Genesis Lab ${GENESIS_LAB_VERSION} — educational simulation disclaimer applies.</em></p>
</body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }
}
