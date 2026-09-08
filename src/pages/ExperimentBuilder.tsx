import { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { useAppState, generateId } from '../store/AppContext';
import { demoSamples, defaultEnvironment } from '../data/demoData';
import {
  getBuilderOrganismOptions,
  getCatalogueOrganismLabel,
  resolveCatalogueOrganismFromSample,
  resolveCatalogueOrganismId,
} from '../services/demoCatalogueIdMap';
import type { Experiment, ExperimentVariable } from '../types';

const STEPS = [
  'Basic Info',
  'Sample & Organism',
  'Groups & Variables',
  'Environment & Treatments',
  'Review & Save',
];

const emptyVariable = (): ExperimentVariable => ({
  name: '',
  role: 'independent',
  value: '',
  unit: '',
});

export function ExperimentBuilderPage() {
  const { state, dispatch } = useAppState();
  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const organismOptions = useMemo(() => getBuilderOrganismOptions(), []);
  const [form, setForm] = useState<Partial<Experiment>>({
    name: '',
    researchQuestion: '',
    hypothesis: '',
    controlGroup: '',
    experimentalGroup: '',
    independentVariables: [emptyVariable()],
    dependentVariables: [emptyVariable()],
    controlledVariables: [emptyVariable()],
    compoundIds: [],
    environment: { ...defaultEnvironment },
    durationHours: 24,
    observations: [],
    notes: '',
    status: 'draft',
  });

  const loadExperiment = (exp: Experiment) => {
    setForm({
      ...exp,
      organismId: resolveCatalogueOrganismId(exp.organismId) ?? exp.organismId,
    });
    setEditingId(exp.id);
    setStep(0);
  };

  const updateField = <K extends keyof Experiment>(key: K, value: Experiment[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const selectSample = (sampleId: string | undefined) => {
    setForm((f) => {
      const next: Partial<Experiment> = { ...f, sampleId };
      const suggested = resolveCatalogueOrganismFromSample(sampleId);
      if (suggested && !f.organismId) {
        next.organismId = suggested;
      }
      return next;
    });
  };

  const saveExperiment = () => {
    if (!form.name?.trim()) {
      setError('Please enter an experiment name before saving.');
      setStep(0);
      return;
    }
    if (!form.hypothesis?.trim()) {
      setError('Please enter a hypothesis before saving. Use Hypothesis Builder if you need help.');
      setStep(0);
      return;
    }
    const now = new Date().toISOString();
    const experiment: Experiment = {
      id: editingId ?? generateId('EXP'),
      name: form.name.trim(),
      researchQuestion: form.researchQuestion ?? '',
      hypothesis: form.hypothesis.trim(),
      sampleId: form.sampleId,
      organismId: resolveCatalogueOrganismId(form.organismId),
      controlGroup: form.controlGroup ?? '',
      experimentalGroup: form.experimentalGroup ?? '',
      independentVariables: form.independentVariables ?? [],
      dependentVariables: form.dependentVariables ?? [],
      controlledVariables: form.controlledVariables ?? [],
      compoundIds: form.compoundIds ?? [],
      environment: form.environment ?? { ...defaultEnvironment },
      durationHours: form.durationHours ?? 24,
      observations: form.observations ?? [],
      notes: form.notes ?? '',
      status: form.status ?? 'draft',
      createdAt: editingId
        ? state.experiments.find((e) => e.id === editingId)?.createdAt ?? now
        : now,
      updatedAt: now,
    };

    if (editingId) {
      dispatch({ type: 'UPDATE_EXPERIMENT', payload: experiment });
    } else {
      dispatch({ type: 'ADD_EXPERIMENT', payload: experiment });
    }
    setEditingId(experiment.id);
    setError(null);
    setFeedback(`Experiment “${experiment.name}” saved. It will persist after browser refresh.`);
    setStep(4);
  };

  const goNext = () => {
    if (step === 0 && !form.name?.trim()) {
      setError('Enter an experiment name to continue.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const newExperiment = () => {
    setForm({
      name: '',
      researchQuestion: '',
      hypothesis: '',
      controlGroup: '',
      experimentalGroup: '',
      independentVariables: [emptyVariable()],
      dependentVariables: [emptyVariable()],
      controlledVariables: [emptyVariable()],
      compoundIds: [],
      environment: { ...defaultEnvironment },
      durationHours: 24,
      observations: [],
      notes: '',
      status: 'draft',
    });
    setEditingId(null);
    setStep(0);
  };

  return (
    <div className="experiment-builder">
      <PageHeader
        title="Experiment Builder"
        subtitle="Define structured experiments step by step"
        actions={<Button variant="secondary" onClick={newExperiment}>New Experiment</Button>}
      />

      <AboutThisTool
        title="Understanding Experiment Builder"
        whatIsThis="A guided form for writing down an experiment’s question, hypothesis, groups, variables, and environment."
        whyUseIt="Structure your thinking before running a Virtual Lab simulation so results are easier to interpret."
        whatCanILearn="How independent, dependent, and controlled variables fit together in educational experimental design."
        caveat="Saving stores your design locally. Simulation outcomes remain educational models, not clinical results."
      />

      <div className="builder-layout">
        <div className="builder-main">
          <div className="step-indicator">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                onClick={() => setStep(i)}
              >
                <span className="step-num">{i + 1}</span>
                {s}
              </button>
            ))}
          </div>

          <Card>
            {step === 0 && (
              <div className="form-section">
                <label>
                  Experiment Name
                  <input
                    type="text"
                    value={form.name ?? ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g. Temperature effect on bacterial growth"
                  />
                </label>
                <label>
                  Research Question
                  <textarea
                    value={form.researchQuestion ?? ''}
                    onChange={(e) => updateField('researchQuestion', e.target.value)}
                    rows={3}
                  />
                </label>
                <label>
                  <GlossaryTerm term="hypothesis">Hypothesis</GlossaryTerm>
                  <textarea
                    value={form.hypothesis ?? ''}
                    onChange={(e) => updateField('hypothesis', e.target.value)}
                    rows={2}
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    value={form.notes ?? ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={2}
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="form-section">
                <label>
                  Sample
                  <select
                    value={form.sampleId ?? ''}
                    onChange={(e) => selectSample(e.target.value || undefined)}
                  >
                    <option value="">— Select sample —</option>
                    {state.samples.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Organism / System
                  <select
                    value={resolveCatalogueOrganismId(form.organismId) ?? ''}
                    onChange={(e) => updateField('organismId', e.target.value || undefined)}
                  >
                    <option value="">— Select organism —</option>
                    {organismOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.name} ({o.id})</option>
                    ))}
                  </select>
                </label>
                <p className="text-muted">
                  Organism IDs match the Virtual Lab catalogue (e.g. ORG-ECOLI). Legacy demo IDs such as ORG-001 are mapped automatically when you load older experiments.
                </p>
                <label>
                  Duration (hours)
                  <input
                    type="number"
                    min="1"
                    value={form.durationHours ?? 24}
                    onChange={(e) => updateField('durationHours', parseInt(e.target.value, 10))}
                  />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="form-section">
                <label>
                  <GlossaryTerm term="control">Control Group</GlossaryTerm>
                  <textarea
                    value={form.controlGroup ?? ''}
                    onChange={(e) => updateField('controlGroup', e.target.value)}
                    rows={2}
                  />
                </label>
                <label>
                  Experimental Group
                  <textarea
                    value={form.experimentalGroup ?? ''}
                    onChange={(e) => updateField('experimentalGroup', e.target.value)}
                    rows={2}
                  />
                </label>
                <VariableEditor
                  title="Independent Variables"
                  glossaryTerm="independent variable"
                  variables={form.independentVariables ?? []}
                  onChange={(v) => updateField('independentVariables', v)}
                  role="independent"
                />
                <VariableEditor
                  title="Dependent Variables"
                  glossaryTerm="dependent variable"
                  variables={form.dependentVariables ?? []}
                  onChange={(v) => updateField('dependentVariables', v)}
                  role="dependent"
                />
                <VariableEditor
                  title="Controlled Variables"
                  variables={form.controlledVariables ?? []}
                  onChange={(v) => updateField('controlledVariables', v)}
                  role="controlled"
                />
              </div>
            )}

            {step === 3 && (
              <div className="form-section">
                <h4>Environmental Conditions</h4>
                <p className="text-muted">Set baseline incubation parameters. Optional treatments can be added later in Virtual Lab via molecule handoff.</p>
                <div className="env-form-grid">
                  <label>
                    <GlossaryTerm term="temperature">Temperature</GlossaryTerm> (°C)
                    <input
                      type="number"
                      value={form.environment?.temperature ?? 37}
                      onChange={(e) =>
                        updateField('environment', {
                          ...form.environment!,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    <GlossaryTerm term="pH">pH</GlossaryTerm>
                    <input
                      type="number"
                      step="0.1"
                      value={form.environment?.ph ?? 7}
                      onChange={(e) =>
                        updateField('environment', {
                          ...form.environment!,
                          ph: parseFloat(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Oxygen (%)
                    <input
                      type="number"
                      value={form.environment?.oxygen ?? 21}
                      onChange={(e) =>
                        updateField('environment', {
                          ...form.environment!,
                          oxygen: parseFloat(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  Status
                  <select
                    value={form.status ?? 'draft'}
                    onChange={(e) =>
                      updateField('status', e.target.value as Experiment['status'])
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>
            )}

            {step === 4 && (
              <div className="review-section">
                <h4>Experiment Summary</h4>
                <dl className="review-dl">
                  <dt>Name</dt><dd>{form.name || '—'}</dd>
                  <dt>Research Question</dt><dd>{form.researchQuestion || '—'}</dd>
                  <dt>Hypothesis</dt><dd>{form.hypothesis || '—'}</dd>
                  <dt>Sample</dt>
                  <dd>
                    {state.samples.find((s) => s.id === form.sampleId)?.name
                      ?? demoSamples.find((s) => s.id === form.sampleId)?.name
                      ?? '—'}
                  </dd>
                  <dt>Organism</dt>
                  <dd>{getCatalogueOrganismLabel(form.organismId) ?? '—'}</dd>
                  <dt>Duration</dt><dd>{form.durationHours} hours</dd>
                  <dt>Treatments / compounds</dt>
                  <dd>{(form.compoundIds?.length ?? 0) > 0 ? form.compoundIds!.join(', ') : 'None selected (optional)'}</dd>
                  <dt>Status</dt><dd>{form.status}</dd>
                </dl>
                {editingId && (
                  <p className="save-confirm success-text">Saved as {editingId}</p>
                )}
                {feedback && <p className="success-text action-feedback" role="status">{feedback}</p>}
                {error && <p className="error-text action-feedback" role="alert">{error}</p>}
                <p className="text-muted">
                  Educational note: saving stores your experiment design locally. Run outcomes come from Virtual Lab simulation — they are models, not clinical results.
                </p>
              </div>
            )}

            {error && step !== 4 && <p className="error-text action-feedback" role="alert">{error}</p>}

            <div className="step-nav">
              {step > 0 && (
                <Button variant="secondary" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 && (
                <Button onClick={goNext}>Next</Button>
              )}
              {step === STEPS.length - 1 && (
                <Button onClick={saveExperiment}>Save Experiment</Button>
              )}
            </div>
          </Card>
        </div>

        <aside className="builder-sidebar">
          <Card title="Saved Experiments">
            <ul className="exp-list">
              {state.experiments.map((exp) => (
                <li key={exp.id}>
                  <button type="button" className="exp-list-item" onClick={() => loadExperiment(exp)}>
                    <span>{exp.name}</span>
                    <span className={`status-pill status-${exp.status}`}>{exp.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function VariableEditor({
  title,
  glossaryTerm,
  variables,
  onChange,
  role,
}: {
  title: string;
  glossaryTerm?: string;
  variables: ExperimentVariable[];
  onChange: (v: ExperimentVariable[]) => void;
  role: ExperimentVariable['role'];
}) {
  const update = (index: number, field: keyof ExperimentVariable, value: string) => {
    const next = variables.map((v, i) =>
      i === index ? { ...v, [field]: value, role } : v,
    );
    onChange(next);
  };

  const add = () => onChange([...variables, { ...emptyVariable(), role }]);

  return (
    <div className="variable-editor">
      <h4>{glossaryTerm ? <GlossaryTerm term={glossaryTerm}>{title}</GlossaryTerm> : title}</h4>
      {variables.map((v, i) => (
        <div key={i} className="variable-row">
          <input
            placeholder="Name"
            value={v.name}
            onChange={(e) => update(i, 'name', e.target.value)}
          />
          <input
            placeholder="Value"
            value={v.value}
            onChange={(e) => update(i, 'value', e.target.value)}
          />
          <input
            placeholder="Unit"
            value={v.unit ?? ''}
            onChange={(e) => update(i, 'unit', e.target.value)}
          />
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={add}>+ Add variable</Button>
    </div>
  );
}
