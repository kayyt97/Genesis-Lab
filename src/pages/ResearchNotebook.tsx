import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppState, generateId } from '../store/AppContext';
import type { NotebookEntry } from '../types';

export function ResearchNotebookPage() {
  const { state, dispatch } = useAppState();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(state.notebookEntries[0]?.id ?? null);
  const [editForm, setEditForm] = useState<Partial<NotebookEntry> | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return state.notebookEntries;
    return state.notebookEntries.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.notes.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [state.notebookEntries, search]);

  useEffect(() => {
    const entry = state.notebookEntries.find((n) => n.id === selectedId);
    if (entry) setEditForm({ ...entry });
  }, [selectedId, state.notebookEntries]);

  useEffect(() => {
    if (!editForm || !selectedId || !state.settings.autosaveNotebook) return;
    const timer = setTimeout(() => {
      const entry: NotebookEntry = {
        id: selectedId,
        title: editForm.title ?? '',
        dateTime: editForm.dateTime ?? new Date().toISOString(),
        experimentId: editForm.experimentId,
        notes: editForm.notes ?? '',
        observations: editForm.observations ?? '',
        hypothesis: editForm.hypothesis ?? '',
        conclusions: editForm.conclusions ?? '',
        tags: editForm.tags ?? [],
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'UPDATE_NOTEBOOK', payload: entry });
    }, 800);
    return () => clearTimeout(timer);
  }, [editForm, selectedId, state.settings.autosaveNotebook, dispatch]);

  const createEntry = () => {
    const entry: NotebookEntry = {
      id: generateId('NB'),
      title: 'New Entry',
      dateTime: new Date().toISOString(),
      notes: '',
      observations: '',
      hypothesis: '',
      conclusions: '',
      tags: [],
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_NOTEBOOK', payload: entry });
    setSelectedId(entry.id);
  };

  return (
    <div className="notebook-page">
      <PageHeader
        title="Research Notebook"
        subtitle="Laboratory notebook with local autosave"
        actions={<Button onClick={createEntry}>New Entry</Button>}
      />

      <div className="notebook-layout">
        <Card title="Entries">
          <input
            type="search"
            className="search-input"
            placeholder="Search entries, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="notebook-list">
            {filtered.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notebook-item ${selectedId === n.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(n.id)}
                >
                  <span className="nb-title">{n.title}</span>
                  <span className="nb-date">{new Date(n.dateTime).toLocaleDateString()}</span>
                  {n.tags.length > 0 && (
                    <span className="nb-tags">{n.tags.join(', ')}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {editForm && (
          <Card title="Entry Editor">
            <div className="form-section">
              <label>
                Title
                <input
                  type="text"
                  value={editForm.title ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </label>
              <label>
                Associated Experiment
                <select
                  value={editForm.experimentId ?? ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, experimentId: e.target.value || undefined })
                  }
                >
                  <option value="">— None —</option>
                  {state.experiments.map((exp) => (
                    <option key={exp.id} value={exp.id}>{exp.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Notes
                <textarea
                  value={editForm.notes ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={4}
                />
              </label>
              <label>
                Observations
                <textarea
                  value={editForm.observations ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
                  rows={3}
                />
              </label>
              <label>
                Hypothesis
                <textarea
                  value={editForm.hypothesis ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, hypothesis: e.target.value })}
                  rows={2}
                />
              </label>
              <label>
                Conclusions
                <textarea
                  value={editForm.conclusions ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, conclusions: e.target.value })}
                  rows={2}
                />
              </label>
              <label>
                Tags (comma-separated)
                <input
                  type="text"
                  value={editForm.tags?.join(', ') ?? ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                />
              </label>
              {state.settings.autosaveNotebook && (
                <p className="autosave-note text-muted">Autosaving locally…</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
