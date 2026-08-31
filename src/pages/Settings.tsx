import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppState } from '../store/AppContext';
import { LanguageControl } from '../components/ui/LanguageControl';

const STORAGE_KEYS = ['genesis-lab-state-v1', 'genesis-lab-state-v2', 'genesis-lab-state-v3'];

export function SettingsPage() {
  const { state, dispatch } = useAppState();
  const { settings } = state;
  const [confirmClear, setConfirmClear] = useState(false);

  const update = (partial: Partial<typeof settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: partial });
  };

  const clearLocalData = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    dispatch({ type: 'SET_GENOME_UPLOAD', payload: null });
    window.location.reload();
  };

  return (
    <div className="settings-page">
      <PageHeader title="Settings" subtitle="Application preferences" />

      <div className="settings-grid">
        <Card title="Project">
          <label>
            Current Project Name
            <input
              type="text"
              value={settings.currentProjectName}
              onChange={(e) => update({ currentProjectName: e.target.value })}
            />
          </label>
        </Card>

        <Card title="Simulation">
          <label>
            Default Simulation Speed: {settings.simulationSpeedDefault}×
            <input
              type="range"
              min="0.25"
              max="8"
              step="0.25"
              value={settings.simulationSpeedDefault}
              onChange={(e) =>
                update({ simulationSpeedDefault: parseFloat(e.target.value) })
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.autoControlEnabled}
              onChange={(e) => update({ autoControlEnabled: e.target.checked })}
            />
            Auto-control: ON by default
          </label>
          <label>
            Replicate count: {settings.replicateCount}
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={settings.replicateCount}
              onChange={(e) => update({ replicateCount: parseInt(e.target.value, 10) })}
            />
          </label>
        </Card>

        <Card title="Language">
          <LanguageControl />
          <p className="text-muted">Applies across glossary, tooltips, simulations, and module explanations. The scientific model does not change.</p>
        </Card>

        <Card title="Display">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.showDisclaimers}
              onChange={(e) => update({ showDisclaimers: e.target.checked })}
            />
            Show educational disclaimers
          </label>
          <p className="text-muted">Theme: Dark laboratory (Phase 1 default)</p>
        </Card>

        <Card title="Research Notebook">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.autosaveNotebook}
              onChange={(e) => update({ autosaveNotebook: e.target.checked })}
            />
            Autosave notebook entries locally
          </label>
        </Card>

        <Card title="Data provenance">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.showDemoContent}
              onChange={(e) => update({ showDemoContent: e.target.checked })}
            />
            Show examples / demo content
          </label>
          <p className="text-muted">
            When you create your own experiments, demo records are excluded from reports and workspace calculations.
            Uncheck to hide all demo content once you begin working with user data.
          </p>
          {state.userWorkspaceActive && !settings.showDemoContent && (
            <p className="text-muted">Demo content hidden — user workspace active.</p>
          )}
        </Card>

        <Card title="Data Management">
          <p className="text-muted">
            All data is stored locally in your browser. Genomic uploads are processed on-device only.
          </p>
          {confirmClear ? (
            <div className="clear-data-confirm">
              <p><strong>The following will be permanently removed:</strong></p>
              <ul>
                <li>Saved samples and experiments</li>
                <li>Simulation results and runs</li>
                <li>Research notebook entries</li>
                <li>Uploaded genomic data and simulation copies</li>
                <li>Therapeutic designs and project state</li>
              </ul>
              <div className="clear-data-actions">
                <Button variant="danger" onClick={clearLocalData}>Confirm Clear All</Button>
                <Button variant="secondary" onClick={() => setConfirmClear(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" onClick={clearLocalData}>
              Clear Local Data
            </Button>
          )}
        </Card>

        <Card title="About & Credits">
          <dl className="detail-dl">
            <dt>Application</dt><dd>Genesis Lab</dd>
            <dt>Created by</dt><dd>Kara Louise Tait</dd>
            <dt>Copyright</dt><dd>© 2026 Kara Louise Tait. All rights reserved.</dd>
            <dt>Version</dt><dd>Phase 5 — Polish & Research Workflow</dd>
            <dt>Simulation Engine</dt><dd>Prototype v1.0 (Educational Model)</dd>
            <dt>Storage</dt><dd>Local-first (browser localStorage)</dd>
            <dt>Genomic processing</dt><dd>Local-only — no external transmission</dd>
          </dl>
          <p className="text-muted">Educational simulation software — not for clinical diagnosis or wet-lab protocols. See COPYRIGHT.md and LICENSE.md in the project root.</p>
        </Card>
      </div>
    </div>
  );
}
