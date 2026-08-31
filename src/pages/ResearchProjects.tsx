import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppState, generateId } from '../store/AppContext';
import type { ResearchProject } from '../types/scientific';

export function ResearchProjectsPage() {
  const { state, dispatch } = useAppState();
  const [selectedId, setSelectedId] = useState(state.projects[0]?.id ?? null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', researchQuestion: '', hypothesis: '', notes: '' });

  const project = state.projects.find((p) => p.id === selectedId);

  const createProject = () => {
    const p: ResearchProject = {
      id: generateId('PRJ'),
      title: form.title || 'New Project',
      researchQuestion: form.researchQuestion,
      hypothesis: form.hypothesis,
      notes: form.notes,
      experimentIds: [],
      simulationRunIds: [],
      notebookEntryIds: [],
      includeGenomicData: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PROJECT', payload: p });
    dispatch({ type: 'SET_ACTIVE_PROJECT', payload: p.id });
    dispatch({ type: 'UPDATE_SETTINGS', payload: { currentProjectName: p.title, activeProjectId: p.id } });
    setSelectedId(p.id);
    setShowForm(false);
  };

  const setActive = (id: string) => {
    setSelectedId(id);
    const p = state.projects.find((pr) => pr.id === id);
    if (p) {
      dispatch({ type: 'SET_ACTIVE_PROJECT', payload: id });
      dispatch({ type: 'UPDATE_SETTINGS', payload: { currentProjectName: p.title, activeProjectId: id } });
    }
  };

  const duplicateExperiment = (expId: string) => {
    dispatch({ type: 'DUPLICATE_EXPERIMENT', payload: expId });
  };

  return (
    <div className="projects-page">
      <PageHeader
        title="Research Projects"
        subtitle="Persistent project workspace linking experiments, simulations, and notebook"
        actions={<Button onClick={() => setShowForm(true)}>New Project</Button>}
      />

      {showForm && (
        <Card title="New Project" className="sample-form-card">
          <div className="form-section">
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Research question<textarea value={form.researchQuestion} onChange={(e) => setForm({ ...form, researchQuestion: e.target.value })} rows={2} /></label>
            <label>Hypothesis<textarea value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} rows={2} /></label>
            <label>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></label>
            <div className="form-actions">
              <Button onClick={createProject}>Create</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="projects-layout">
        <Card title="Projects">
          <ul className="item-list">
            {state.projects.map((p) => (
              <li key={p.id}>
                <button type="button" className={`exp-list-item ${selectedId === p.id ? 'active' : ''}`} onClick={() => setActive(p.id)}>
                  <span>{p.title}</span>
                  {state.settings.activeProjectId === p.id && <span className="status-pill status-active">Active</span>}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {project && (
          <div className="project-detail">
            <Card title={project.title}>
              <dl className="detail-dl">
                <dt>Research question</dt><dd>{project.researchQuestion || '—'}</dd>
                <dt>Hypothesis</dt><dd>{project.hypothesis || '—'}</dd>
                <dt>Notes</dt><dd>{project.notes || '—'}</dd>
              </dl>
            </Card>
            <Card title="Linked Experiments">
              {project.experimentIds.length === 0 ? (
                <p className="text-muted">No linked experiments.</p>
              ) : (
                <ul className="item-list">
                  {project.experimentIds.map((id) => {
                    const exp = state.experiments.find((e) => e.id === id);
                    return exp ? (
                      <li key={id}>
                        <span>{exp.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => duplicateExperiment(id)}>
                          Duplicate experiment
                        </Button>
                      </li>
                    ) : null;
                  })}
                </ul>
              )}
            </Card>
            <Card title="Notebook Entries">
              <ul className="item-list">
                {project.notebookEntryIds.map((id) => {
                  const nb = state.notebookEntries.find((n) => n.id === id);
                  return nb ? <li key={id}><span>{nb.title}</span></li> : null;
                })}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
