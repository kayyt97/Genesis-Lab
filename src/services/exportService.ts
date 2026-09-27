import type { ActiveExperimentSetup, ScientificReport } from '../types/experimentWorkspace';
import type { Simulation } from '../types';
import { GENESIS_LAB_VERSION, reportToMarkdown } from './reportGenerator';
import {
  buildTumourCellMovementReadout,
  movementReadoutToCsvRows,
  movementReadoutToExportPayload,
} from './tumourCellMovementReadout';
import {
  buildTumourResponseMonitoring,
  responseMonitoringToCsvRows,
  responseMonitoringToExportPayload,
} from './tumourResponseMonitoring';
import {
  loadMetastaticInhibitorStudy,
  metastaticInhibitorStudyToCsvRows,
  metastaticInhibitorStudyToExportPayload,
  type MetastaticInhibitorStudy,
} from './metastaticInhibitorCandidate';
import { isTumourCellModel } from './tumourCellSimulation';

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

export function exportExperimentCsv(
  setup: ActiveExperimentSetup,
  sim: Simulation | null,
  controlSim: Simulation | null,
  replicateCount = 1,
) {
  const rows = [
    ['field', 'value', 'source'],
    ['sampleId', setup.sampleId, 'user'],
    ['sampleName', setup.sampleDisplayName, 'user'],
    ['viability', sim?.organismState.viability.toFixed(2) ?? '', 'model'],
    ['controlViability', controlSim?.organismState.viability.toFixed(2) ?? '', 'model'],
    ['proliferation', sim?.organismState.proliferation === null || sim?.organismState.proliferation === undefined ? '' : sim.organismState.proliferation.toFixed(2), 'model'],
    ['controlProliferation', controlSim?.organismState.proliferation === null || controlSim?.organismState.proliferation === undefined ? '' : controlSim.organismState.proliferation.toFixed(2), 'model'],
    ['cellMovement', sim?.organismState.cellMovement === null || sim?.organismState.cellMovement === undefined ? '' : sim.organismState.cellMovement.toFixed(2), 'model'],
    ['controlCellMovement', controlSim?.organismState.cellMovement === null || controlSim?.organismState.cellMovement === undefined ? '' : controlSim.organismState.cellMovement.toFixed(2), 'model'],
    ['timeHours', sim?.timeHours.toFixed(2) ?? '', 'model'],
    ['temperature', String(setup.environment.temperature), 'user'],
    ['ph', String(setup.environment.ph), 'user'],
  ];
  const movement = buildMovementExport(setup, sim, controlSim, replicateCount);
  if (movement) {
    rows.push(...movementReadoutToCsvRows(movement));
  }
  const response = buildResponseExport(setup, sim, controlSim);
  if (response) {
    rows.push(...responseMonitoringToCsvRows(response));
  }
  const mi = loadMetastaticInhibitorStudy();
  if (mi) {
    rows.push(...metastaticInhibitorStudyToCsvRows(mi));
  }
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadTextFile(`${setup.sampleId}_results.csv`, csv, 'text/csv');
}

export function exportExperimentJson(
  setup: ActiveExperimentSetup,
  sim: Simulation | null,
  controlSim: Simulation | null,
  provenance: ExportProvenance,
  replicateCount = 1,
  metastaticInhibitorStudy?: MetastaticInhibitorStudy | null,
) {
  const movementReadout = buildMovementExport(setup, sim, controlSim, replicateCount);
  const responseMonitoring = buildResponseExport(setup, sim, controlSim);
  const mi = metastaticInhibitorStudy ?? loadMetastaticInhibitorStudy();
  downloadTextFile(
    `${setup.id}_experiment.json`,
    JSON.stringify({
      setup,
      experimentalSimulation: sim,
      controlSimulation: controlSim,
      provenance,
      tumourCellMovement: movementReadout ? movementReadoutToExportPayload(movementReadout) : null,
      tumourResponseMonitoring: responseMonitoring
        ? responseMonitoringToExportPayload(responseMonitoring)
        : null,
      metastaticInhibitorStudy: mi ? metastaticInhibitorStudyToExportPayload(mi) : null,
    }, null, 2),
    'application/json',
  );
}

function buildMovementExport(
  setup: ActiveExperimentSetup,
  sim: Simulation | null,
  controlSim: Simulation | null,
  replicateCount: number,
) {
  if (!isTumourCellModel(setup.catalogueEntryId)) return null;
  return buildTumourCellMovementReadout({
    cellModelId: setup.catalogueEntryId,
    cellModelName: setup.sampleDisplayName,
    experimentalEnv: sim?.environment ?? setup.environment,
    controlEnv: setup.control.environment,
    treatment: setup.attachedTherapeutic,
    baseSeed: setup.simulationSeed ?? sim?.seed ?? 42,
    replicateCount,
    liveExperimental: sim,
    liveControl: controlSim,
  });
}

function buildResponseExport(
  setup: ActiveExperimentSetup,
  sim: Simulation | null,
  controlSim: Simulation | null,
) {
  if (!isTumourCellModel(setup.catalogueEntryId)) return null;
  return buildTumourResponseMonitoring({
    cellModelId: setup.catalogueEntryId,
    cellModelName: setup.sampleDisplayName,
    experimental: sim,
    control: controlSim,
    experimentalEnv: sim?.environment ?? setup.environment,
    controlEnv: setup.control.environment,
    treatment: setup.attachedTherapeutic ?? sim?.therapeuticTreatment ?? null,
    baseline: setup.recordedBaseline ?? null,
    savedAt: setup.pairedResponseSnapshot?.savedAt ?? null,
  });
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
