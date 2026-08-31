import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppState } from '../store/AppContext';
import { LanguageControl } from '../components/ui/LanguageControl';

export function SettingsPage() {
  const { state, dispatch } = useAppState();
  const { settings } = state;

  const update = (partial: Partial<typeof settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: partial });
  };

  const clearLocalData = () => {
    if (window.confirm('Clear all locally saved experiments, samples, and notebook entries? Demo data will reload on next refresh.')) {
      localStorage.removeItem('genesis-lab-state-v1');
      window.location.reload();
    }
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

        <Card title="Data Management">
          <p className="text-muted">
            All data is stored locally in your browser. No cloud sync in Phase 1.
          </p>
          <Button variant="danger" onClick={clearLocalData}>
            Clear Local Data
          </Button>
        </Card>

        <Card title="About">
          <dl className="detail-dl">
            <dt>Application</dt><dd>Genesis Lab</dd>
            <dt>Version</dt><dd>Phase 2 — Expanded</dd>
            <dt>Simulation Engine</dt><dd>Prototype v1.0 (Educational Model)</dd>
            <dt>Storage</dt><dd>Local-first (browser localStorage)</dd>
          </dl>
        </Card>
      </div>
    </div>
  );
}
