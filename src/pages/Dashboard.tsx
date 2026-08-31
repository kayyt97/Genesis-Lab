import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Metric } from '../components/ui/Metric';
import { SimulationBadge } from '../components/ui/DisclaimerBanner';
import { useAppState } from '../store/AppContext';

export function DashboardPage() {
  const { state } = useAppState();
  const activeExp = state.experiments.find((e) => e.status === 'active');
  const recentExps = state.experiments.slice(0, 3);
  const recentSamples = state.samples.filter((s) => s.status === 'active').slice(0, 3);
  const recentNotes = state.notebookEntries.slice(0, 3);
  const simStatus = state.activeSimulation?.status ?? 'idle';

  return (
    <div className="dashboard">
      <PageHeader
        title="Genesis Lab"
        subtitle={`Project: ${state.settings.currentProjectName}`}
      />

      <div className="dashboard-grid">
        <Card title="Current Experiment" badge={activeExp?.status ?? 'none'} className="span-2">
          {activeExp ? (
            <div className="current-exp">
              <h4>{activeExp.name}</h4>
              <p className="text-muted">{activeExp.researchQuestion}</p>
              <p>
                <strong>Hypothesis:</strong> {activeExp.hypothesis}
              </p>
              <Link to="/experiment-builder" className="link-action">
                Edit experiment →
              </Link>
            </div>
          ) : (
            <p className="text-muted">No active experiment. Create one to get started.</p>
          )}
        </Card>

        <Card title="Simulation Status">
          <div className="sim-status-panel">
            <SimulationBadge />
            <Metric
              label="Engine State"
              value={simStatus.charAt(0).toUpperCase() + simStatus.slice(1)}
              variant={simStatus === 'running' ? 'success' : 'default'}
            />
            {state.activeSimulation && (
              <>
                <Metric
                  label="Elapsed Time"
                  value={state.activeSimulation.timeHours.toFixed(1)}
                  unit="h"
                />
                <Metric
                  label="Tick"
                  value={state.activeSimulation.currentTick}
                />
              </>
            )}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="quick-actions">
            <Link to="/experiment-builder"><Button variant="primary">New Experiment</Button></Link>
            <Link to="/samples"><Button variant="secondary">Create Sample</Button></Link>
            <Link to="/virtual-lab"><Button variant="secondary">Open Virtual Lab</Button></Link>
            <Link to="/molecular-library"><Button variant="ghost">Browse Molecular Library</Button></Link>
            <Link to="/glossary"><Button variant="ghost">Open Glossary</Button></Link>
          </div>
        </Card>

        <Card title="Recent Experiments">
          {recentExps.length === 0 ? (
            <p className="text-muted">No experiments yet.</p>
          ) : (
            <ul className="item-list">
              {recentExps.map((exp) => (
                <li key={exp.id}>
                  <span className="item-name">{exp.name}</span>
                  <span className={`status-pill status-${exp.status}`}>{exp.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Saved Samples">
          {recentSamples.length === 0 ? (
            <p className="text-muted">No active samples.</p>
          ) : (
            <ul className="item-list">
              {recentSamples.map((s) => (
                <li key={s.id}>
                  <span className="item-name">{s.name}</span>
                  <span className="item-meta">{s.id}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent Notebook Entries">
          {recentNotes.length === 0 ? (
            <p className="text-muted">No notebook entries.</p>
          ) : (
            <ul className="item-list">
              {recentNotes.map((n) => (
                <li key={n.id}>
                  <span className="item-name">{n.title}</span>
                  <span className="item-meta">
                    {new Date(n.dateTime).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="System Status" className="span-2">
          <div className="system-status">
            <div className="status-row">
              <span>Application</span>
              <span className="status-ok">Operational</span>
            </div>
            <div className="status-row">
              <span>Simulation Engine</span>
              <span className="status-ok">Prototype v1.0</span>
            </div>
            <div className="status-row">
              <span>Data Storage</span>
              <span className="status-ok">Local (browser)</span>
            </div>
            <div className="status-row">
              <span>Molecular Modelling</span>
              <span className="status-pending">Phase 4 placeholder</span>
            </div>
            <div className="status-row">
              <span>Experiments saved</span>
              <span>{state.experiments.length}</span>
            </div>
            <div className="status-row">
              <span>Samples registered</span>
              <span>{state.samples.length}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-disclaimer">
        <p>
          <strong>Disclaimer:</strong> Genesis Lab is an educational scientific simulation
          and research workspace. All simulation outputs are labelled as educational models.
          This software does not provide medical diagnosis, clinical validation, or
          substitutes for institutional laboratory training.
        </p>
      </div>
    </div>
  );
}
