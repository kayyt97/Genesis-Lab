import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAppState } from '../store/AppContext';
import type { HypothesisWorkflow } from '../types/scientific';

const STEPS = [
  'Observation',
  'Research Question',
  'Hypothesis',
  'Independent Variable',
  'Dependent Variable',
  'Controls',
  'Prediction',
  'Experiment',
  'Result',
  'Conclusion',
] as const;

export function HypothesisBuilderPage() {
  const { state, dispatch } = useAppState();
  const [wf, setWf] = useState<HypothesisWorkflow>({
    observation: '',
    researchQuestion: '',
    hypothesis: '',
    independentVariable: '',
    dependentVariable: '',
    controls: '',
    prediction: '',
    conclusion: '',
  });
  const [step, setStep] = useState(0);
  const [verdict, setVerdict] = useState<HypothesisWorkflow['verdict']>();

  const fields: (keyof HypothesisWorkflow)[] = [
    'observation', 'researchQuestion', 'hypothesis', 'independentVariable',
    'dependentVariable', 'controls', 'prediction', 'observation', 'observation', 'conclusion',
  ];

  const attachToExperiment = () => {
    const exp = state.experiments[0];
    if (!exp) return;
    dispatch({
      type: 'UPDATE_EXPERIMENT',
      payload: {
        ...exp,
        hypothesis: wf.hypothesis,
        researchQuestion: wf.researchQuestion,
        hypothesisWorkflow: { ...wf, verdict },
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const fieldKey = step < 8 ? fields[step] : 'conclusion';
  const value = wf[fieldKey as keyof HypothesisWorkflow] as string ?? '';

  return (
    <div className="hypothesis-page">
      <PageHeader title="Hypothesis Builder" subtitle="Structured experimental design assistant" />

      <div className="step-indicator">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={`step ${i === step ? 'active' : ''}`} onClick={() => setStep(i)}>
            <span className="step-num">{i + 1}</span>{s}
          </button>
        ))}
      </div>

      <Card title={STEPS[step]}>
        {step < 8 && (
          <label>
            {STEPS[step]}
            <textarea
              value={value}
              onChange={(e) => setWf({ ...wf, [fieldKey]: e.target.value })}
              rows={4}
            />
          </label>
        )}
        {step === 8 && (
          <div>
            <p className="text-muted">Link to simulation results or enter observations manually.</p>
            <textarea
              value={wf.conclusion ?? ''}
              onChange={(e) => setWf({ ...wf, conclusion: e.target.value })}
              rows={3}
              placeholder="Result summary…"
            />
          </div>
        )}
        {step === 9 && (
          <div>
            <label>Conclusion<textarea value={wf.conclusion ?? ''} onChange={(e) => setWf({ ...wf, conclusion: e.target.value })} rows={3} /></label>
            <p>Hypothesis verdict (never &quot;proven&quot;):</p>
            <div className="verdict-buttons">
              {(['supports', 'does-not-support', 'inconclusive'] as const).map((v) => (
                <Button key={v} variant={verdict === v ? 'primary' : 'secondary'} onClick={() => setVerdict(v)}>
                  {v.replace(/-/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="step-nav">
          {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
          {step < STEPS.length - 1 && <Button onClick={() => setStep(step + 1)}>Next</Button>}
          {step === STEPS.length - 1 && <Button onClick={attachToExperiment}>Save to experiment</Button>}
        </div>
      </Card>
    </div>
  );
}
