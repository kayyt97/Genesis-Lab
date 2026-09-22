import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppState, generateId } from '../store/AppContext';
import type { Sample, SampleType } from '../types';

const SAMPLE_TYPES: { value: SampleType; label: string }[] = [
  { value: 'bacterial-culture', label: 'Bacterial Culture' },
  { value: 'cell-culture', label: 'Cell Culture' },
  { value: 'tissue', label: 'Tissue' },
  { value: 'environmental', label: 'Environmental Sample' },
  { value: 'protein', label: 'Protein Sample' },
  { value: 'dna', label: 'DNA' },
  { value: 'rna', label: 'RNA' },
];


export function SamplesPage() {
  const { state, dispatch } = useAppState();
  const [selected, setSelected] = useState<Sample | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Sample>>({
    name: '',
    sampleType: 'bacterial-culture',
    source: '',
    storageCondition: '',
    status: 'active',
    notes: '',
  });

  const saveSample = () => {
    const sample: Sample = {
      id: generateId('SMP'),
      name: form.name ?? 'Unnamed Sample',
      sampleType: form.sampleType ?? 'bacterial-culture',
      source: form.source ?? '',
      dateCreated: new Date().toISOString(),
      storageCondition: form.storageCondition ?? '',
      status: form.status ?? 'active',
      associatedExperimentIds: [],
      notes: form.notes ?? '',
    };
    dispatch({ type: 'ADD_SAMPLE', payload: sample });
    setShowForm(false);
    setForm({ name: '', sampleType: 'bacterial-culture', source: '', storageCondition: '', status: 'active', notes: '' });
  };

  return (
    <div className="samples-page">
      <PageHeader
        title="Samples"
        subtitle="Virtual sample management — not certified laboratory inventory. Tumour cell lines are labelled separately from neoplasm taxonomy entries."
        actions={<Button onClick={() => setShowForm(true)}>Create Sample</Button>}
      />

      {showForm && (
        <Card title="New Sample" className="sample-form-card">
          <div className="form-section">
            <label>Name<input type="text" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>
              Type
              <select value={form.sampleType} onChange={(e) => setForm({ ...form, sampleType: e.target.value as SampleType })}>
                {SAMPLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label>Source<input type="text" value={form.source ?? ''} onChange={(e) => setForm({ ...form, source: e.target.value })} /></label>
            <label>Storage Condition<input type="text" value={form.storageCondition ?? ''} onChange={(e) => setForm({ ...form, storageCondition: e.target.value })} /></label>
            <label>Notes<textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></label>
            <div className="form-actions">
              <Button onClick={saveSample}>Save</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="samples-layout">
        <Card title="Sample Registry">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {state.samples.map((s) => (
                <tr
                  key={s.id}
                  className={selected?.id === s.id ? 'selected' : ''}
                  onClick={() => setSelected(s)}
                >
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.sampleType.replace('-', ' ')}</td>
                  <td><span className={`status-pill status-${s.status}`}>{s.status}</span></td>
                  <td>{new Date(s.dateCreated).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {selected && (
          <Card title="Sample Details">
            <dl className="detail-dl">
              <dt>ID</dt><dd>{selected.id}</dd>
              <dt>Name</dt><dd>{selected.name}</dd>
              <dt>Type</dt><dd>{selected.sampleType}</dd>
              <dt>Source</dt><dd>{selected.source}</dd>
              <dt>Storage</dt><dd>{selected.storageCondition}</dd>
              <dt>Status</dt><dd>{selected.status}</dd>
              <dt>Created</dt><dd>{new Date(selected.dateCreated).toLocaleString()}</dd>
              <dt>Associated Experiments</dt>
              <dd>{selected.associatedExperimentIds.length > 0 ? selected.associatedExperimentIds.join(', ') : 'None'}</dd>
              <dt>Notes</dt><dd>{selected.notes || '—'}</dd>
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}
