import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { TEACHING_SCENARIOS } from '../data/equipment';
import { runActiveExperimentDesignCheck } from '../services/activeExperimentDesignCheck';
import { defaultEnvironment } from '../data/demoData';

export function TeachingModePage() {
  const { state, dispatch } = useAppState();
  const [scenarioId, setScenarioId] = useState(TEACHING_SCENARIOS[0]?.id ?? '');
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showDesignCheck, setShowDesignCheck] = useState(true);
  const languageLevel = useLanguage();
  const navigate = useNavigate();

  const scenario = TEACHING_SCENARIOS.find((s) => s.id === scenarioId);
  const sim = state.activeSimulation;
  const setup = state.activeExperimentSetup;
  const env = sim?.environment ?? setup?.environment ?? defaultEnvironment;
  const controlEnv = setup?.control?.environment ?? defaultEnvironment;

  const designChecks = useMemo(
    () => runActiveExperimentDesignCheck(setup, env, controlEnv, state.settings.replicateCount),
    [setup, env, controlEnv, state.settings.replicateCount],
  );

  const changedVars = sim
    ? (Object.keys(defaultEnvironment) as (keyof typeof defaultEnvironment)[]).filter(
        (k) => Math.abs(sim.environment[k] - defaultEnvironment[k]) > 0.01,
      )
    : [];

  return (
    <div className="teaching-page">
      <PageHeader title="Teaching Mode" subtitle="Learn through exploration — guidance, not restrictions" />

      <Card title="Experimental Design Check (Pre-run)">
        <p className="text-muted">
          Active experiment review — separate from teaching examples below. Genesis teaches rather than blocks — you can always run unusual experiments.
        </p>
        <Button variant="ghost" onClick={() => setShowDesignCheck(!showDesignCheck)}>
          {showDesignCheck ? 'Hide' : 'Show'} Design Check
        </Button>
          {showDesignCheck && (
            <>
              <ul className="design-check-list">
                {designChecks.map((c) => (
                  <li key={c.id} className={`design-check design-check-${c.status}`}>
                    {c.status === 'pass' && '✓ '}{c.status === 'warn' && '⚠ '}{c.status === 'info' && '○ '}
                    {c.label}
                    {c.explanation && <span className="design-check-detail"> — {c.explanation}</span>}
                  </li>
                ))}
              </ul>
              <div className="teaching-actions">
                <Button variant="secondary" onClick={() => navigate('/experiment-builder')}>Create Improved Experiment</Button>
                <Button variant="ghost" onClick={() => navigate('/virtual-lab')}>
                  Compare With Control{setup?.control?.sampleId ? ` (${setup.control.sampleId})` : ''}
                </Button>
                <Button variant="ghost" onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { replicateCount: Math.max(2, state.settings.replicateCount) } })}>Add Replicates</Button>
              </div>
            </>
          )}
        {changedVars.length > 1 && (
          <div className="teaching-prompt warn-text">
            <strong>WHAT CHANGED?</strong> Multiple variables changed simultaneously ({changedVars.join(', ')}).
            <br />
            <strong>WHY MIGHT THAT MATTER?</strong> Attributing an outcome to one specific variable may be difficult.
            <br />
            <strong>WHAT SHOULD I LOOK FOR?</strong> Compare against a control with only one variable changed.
            <br />
            <strong>WHAT COULD I INVESTIGATE NEXT?</strong> Reset all but one variable and re-run.
          </div>
        )}
        {changedVars.length === 1 && (
          <div className="teaching-prompt">
            <strong>WHAT CHANGED?</strong> {changedVars[0]} was modified from baseline.
            <br />
            <strong>WHY MIGHT THAT MATTER?</strong> This variable can affect organism viability and growth in the model.
            <br />
            <strong>WHAT SHOULD I LOOK FOR?</strong> Changes in viability, population, and stress measurements.
          </div>
        )}
      </Card>

      <div className="pathway-select">
        {TEACHING_SCENARIOS.map((s) => (
          <button key={s.id} type="button" className={`category-tab ${scenarioId === s.id ? 'active' : ''}`} onClick={() => { setScenarioId(s.id); setSelected(null); setRevealed(false); }}>
            {s.title}
          </button>
        ))}
      </div>

      {scenario && (
        <Card title={scenario.title}>
          <span className="learning-topic-badge">LEARNING TOPIC · Example scenario (not necessarily your active experiment)</span>
          <p>{resolveTiered(scenario.description, languageLevel)}</p>
          <div className="teaching-options">
            {scenario.options.map((opt) => (
              <Button
                key={opt.id}
                variant={selected === opt.id ? 'primary' : 'secondary'}
                onClick={() => { setSelected(opt.id); setRevealed(true); }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          {revealed && selected && (
            <div className={`teaching-feedback ${scenario.options.find((o) => o.id === selected)?.correct ? 'correct' : 'incorrect'}`}>
              <p>{resolveTiered(scenario.options.find((o) => o.id === selected)!.explanation, languageLevel)}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
