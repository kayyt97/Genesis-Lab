import { useState } from 'react';
import { Button } from '../ui/Button';
import type { ReportLanguageLevel, ScientificReport } from '../../types/experimentWorkspace';
import type { ResearchProject } from '../../types/scientific';
import {
  exportExperimentCsv,
  exportExperimentJson,
  exportReportJson,
  exportReportMarkdown,
  openReportPrintPreview,
  buildExportProvenance,
} from '../../services/exportService';
import type { ActiveExperimentSetup } from '../../types/experimentWorkspace';
import type { Simulation } from '../../types';

interface ScientificReportPanelProps {
  report: ScientificReport;
  setup: ActiveExperimentSetup;
  experimentalSim: Simulation | null;
  controlSim: Simulation | null;
  project: ResearchProject | null;
  onRegenerate: (level: ReportLanguageLevel) => void;
  onUpdateSection: (sectionId: string, content: string) => void;
  onFinalize: () => void;
}

const LEVELS: { value: ReportLanguageLevel; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'standard', label: 'Standard' },
  { value: 'technical', label: 'Technical' },
];

export function ScientificReportPanel({
  report,
  setup,
  experimentalSim,
  controlSim,
  project: _project,
  onRegenerate,
  onUpdateSection,
  onFinalize,
}: ScientificReportPanelProps) {
  const [preview, setPreview] = useState(false);
  const provenance = buildExportProvenance(setup, experimentalSim, report.reportLevel);

  return (
    <div className="scientific-report-panel">
      <h4>Scientific report</h4>
      <div className="report-level-picker">
        <span className="report-level-label">Report language level (independent of app language):</span>
        {LEVELS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`filter-btn ${report.reportLevel === value ? 'active' : ''}`}
            onClick={() => onRegenerate(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {report.qualityFlags.length > 0 && (
        <ul className="report-quality-flags">
          {report.qualityFlags.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      {report.sections.map((section) => (
        <label key={section.id} className="report-section-edit">
          <span>{section.title} <em className="text-muted">({section.source})</em></span>
          <textarea
            value={section.content}
            onChange={(e) => onUpdateSection(section.id, e.target.value)}
            rows={section.id === 'conclusion' || section.id === 'interpretation' ? 3 : 2}
          />
        </label>
      ))}
      <div className="report-actions">
        <Button variant="secondary" onClick={() => setPreview(!preview)}>{preview ? 'Hide preview' : 'Preview report'}</Button>
        <Button onClick={onFinalize}>Mark ready for export</Button>
        <Button variant="ghost" onClick={() => openReportPrintPreview(report)}>Print / PDF preview</Button>
        <Button variant="ghost" onClick={() => exportReportMarkdown(report)}>Download Markdown</Button>
        <Button variant="ghost" onClick={() => exportReportJson(report, provenance)}>Download JSON</Button>
        <Button variant="ghost" onClick={() => exportExperimentCsv(setup, experimentalSim, controlSim)}>Export CSV data</Button>
        <Button variant="ghost" onClick={() => exportExperimentJson(setup, experimentalSim, controlSim, provenance)}>Export experiment JSON</Button>
      </div>
      {preview && (
        <div className="report-preview">
          <p className="text-muted">Report level: {report.reportLevel}</p>
          {report.sections.map((s) => (
            <div key={s.id}>
              <h5>{s.title}</h5>
              <p>{s.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
