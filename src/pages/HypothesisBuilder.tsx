import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ExplainThis } from '../components/ui/ExplainThis';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { useAppState } from '../store/AppContext';
import { EXPLAIN } from '../content/explainers';
import type { HypothesisWorkflow } from '../types/scientific';

const STEPS = [
  'Observation',
  'Research Question',
  'Hypothesis',
  'Independent Variable',
  'Dependent Variable',
  'Controls',
  'Prediction',
  'Experiment Plan',
  'Result',
  'Conclusion',
] as const;

type StepField =
  | 'observation'
  | 'researchQuestion'
  | 'hypothesis'
  | 'independentVariable'
  | 'dependentVariable'
  | 'controls'
  | 'prediction'
  | 'experimentPlan'
  | 'resultSummary'
  | 'conclusion';

const STEP_FIELDS: StepField[] = [
  'observation',
  'researchQuestion',
  'hypothesis',
  'independentVariable',
  'dependentVariable',
  'controls',
  'prediction',
  'experimentPlan',
  'resultSummary',
  'conclusion',
];

const STEP_HELP: Record<number, string> = {
  0: 'Describe what you noticed that prompted the investigation.',
  1: 'Frame a clear question your experiment could answer.',
  2: 'State a testable claim: if I change X, then Y should change because…',
  3: 'The factor you deliberately change.',
  4: 'The outcome you measure.',
  5: 'What you keep the same so comparisons are fair.',
  6: 'What outcome do you expect if the hypothesis is useful?',
  7: 'Briefly outline how you will test this (Virtual Lab or otherwise).',
  8: 'Record what actually happened in the simulation or observation.',
  9: 'Interpret the result. Hypotheses are supported, not proven.',
};

const emptyWorkflow = (): HypothesisWorkflow => ({
  observation: '',
  researchQuestion: '',
  hypothesis: '',
  independentVariable: '',
  dependentVariable: '',
  controls: '',
  prediction: '',
  experimentPlan: '',
  resultSummary: '',
  conclusion: '',
});

export function HypothesisBuilderPage() {
  const { state, dispatch } = useAppState();
  const [wf, setWf] = useState<HypothesisWorkflow>(emptyWorkflow);
  const [step, setStep] = useState(0);
  const [verdict, setVerdict] = useState<HypothesisWorkflow['verdict']>();
  const [targetExperimentId, setTargetExperimentId] = useState(state.experiments[0]?.id ?? '');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fieldKey = STEP_FIELDS[step];
  const value = (wf[fieldKey] as string | undefined) ?? '';

  const validateCurrent = (): boolean => {
    if (step <= 6 && !value.trim()) {
      setError(`Please enter a ${STEPS[step].toLowerCase()} before continuing.`);
      return false;
    }
    if (step === 9 && !verdict) {
      setError('Choose a verdict: supports, does not support, or inconclusive.');
      return false;
    }
    setError(null);
    return true;
  };

  const goNext = () => {
    if (!validateCurrent()) return;
    setFeedback(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const resetWorkflow = () => {
    setWf(emptyWorkflow());
    setVerdict(undefined);
    setStep(0);
    setError(null);
    setFeedback('Hypothesis workflow reset.');
  };

  const attachToExperiment = () => {
    if (!validateCurrent()) return;
    if (!wf.hypothesis.trim()) {
      setError('A hypothesis statement is required before saving.');
      return;
    }
    const exp = state.experiments.find((e) => e.id === targetExperimentId) ?? state.experiments[0];
    if (!exp) {
      setError('No saved experiment found. Create one in Experiment Builder first, then return here.');
      return;
    }
    dispatch({
      type: 'UPDATE_EXPERIMENT',
      payload: {
        ...exp,
        hypothesis: wf.hypothesis,
        researchQuestion: wf.researchQuestion || exp.researchQuestion,
        hypothesisWorkflow: { ...wf, verdict },
        updatedAt: new Date().toISOString(),
      },
    });
    setError(null);
    setFeedback(`Hypothesis saved to experiment “${exp.name}”.`);
  };

  return (
    <div className="hypothesis-page">
      <PageHeader
        title="Hypothesis Builder"
        subtitle="Structured experimental design assistant — educational workflow"
        actions={
          <ExplainThis title="Hypothesis Builder" content={EXPLAIN.hypothesis} />
        }
      />

      <Card title="Why use this page?">
        <p className="text-muted">
          Build a clear, testable claim step by step. Genesis teaches scientific reasoning —
          results can <em>support</em> a hypothesis; they never absolute-prove it.
        </p>
      </Card>

      <AboutThisTool
        title="Understanding Hypothesis Builder"
        whatIsThis={EXPLAIN.hypothesis.whatIsIt}
        whyUseIt={EXPLAIN.hypothesis.whyItMatters ?? ''}
        whatCanILearn="How to move from observation → question → hypothesis → variables → prediction → verdict."
        caveat={EXPLAIN.hypothesis.whatItDoesNotMean}
      />

      <div className="step-indicator">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => { setStep(i); setError(null); }}
          >
            <span className="step-num">{i + 1}</span>{s}
          </button>
        ))}
      </div>

      <Card title={STEPS[step]}>
        <p className="text-muted step-help">{STEP_HELP[step]}</p>

        {step < 9 && (
          <label>
            {step === 2 ? (
              <GlossaryTerm term="hypothesis">{STEPS[step]}</GlossaryTerm>
            ) : (
              STEPS[step]
            )}
            <textarea
              value={step === 8 ? (wf.resultSummary ?? '') : value}
              onChange={(e) => {
                const key = step === 8 ? 'resultSummary' : fieldKey;
                setWf({ ...wf, [key]: e.target.value });
                setError(null);
              }}
              rows={4}
              placeholder={`Enter ${STEPS[step].toLowerCase()}…`}
            />
          </label>
        )}

        {step === 9 && (
          <div>
            <label>
              Conclusion
              <textarea
                value={wf.conclusion ?? ''}
                onChange={(e) => setWf({ ...wf, conclusion: e.target.value })}
                rows={3}
                placeholder="Interpret results carefully…"
              />
            </label>
            <p>
              Hypothesis verdict (never &quot;proven&quot;):{' '}
              <ExplainThis
                title="Verdict"
                content={{
                  whatIsIt: 'A verdict summarises whether your results support the hypothesis.',
                  whatItDoesNotMean: '“Supports” is not the same as proven. Future evidence can change the picture.',
                }}
              />
            </p>
            <div className="verdict-buttons">
              {(['supports', 'does-not-support', 'inconclusive'] as const).map((v) => (
                <Button
                  key={v}
                  variant={verdict === v ? 'primary' : 'secondary'}
                  onClick={() => { setVerdict(v); setError(null); }}
                >
                  {v.replace(/-/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="error-text action-feedback" role="alert">{error}</p>}
        {feedback && <p className="success-text action-feedback" role="status">{feedback}</p>}

        {step === STEPS.length - 1 && (
          <label>
            Attach to experiment
            {state.experiments.length === 0 ? (
              <p className="text-muted">
                No experiments yet.{' '}
                <Link to="/experiment-builder">Create one in Experiment Builder</Link>.
              </p>
            ) : (
              <select
                value={targetExperimentId}
                onChange={(e) => setTargetExperimentId(e.target.value)}
              >
                {state.experiments.map((exp) => (
                  <option key={exp.id} value={exp.id}>{exp.name}</option>
                ))}
              </select>
            )}
          </label>
        )}

        <div className="step-nav">
          {step > 0 && (
            <Button variant="secondary" onClick={() => { setStep(step - 1); setError(null); }}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 && <Button onClick={goNext}>Next</Button>}
          {step === STEPS.length - 1 && (
            <Button onClick={attachToExperiment}>Save to experiment</Button>
          )}
          <Button variant="ghost" onClick={resetWorkflow}>Reset</Button>
        </div>
      </Card>
    </div>
  );
}
