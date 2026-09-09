import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
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
  const controlConfig = setup?.control ?? null;
  const controlApplicable = Boolean(
    controlConfig && controlConfig.mode !== 'none-not-applicable',
  );

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
        <Button variant="secondary" onClick={() => setShowDesignCheck(!showDesignCheck)}>
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

            <div className="control-workstation teaching-control-group">
              <h4 className="control-workstation-title">
                <GlossaryTerm term="control">Control Group</GlossaryTerm>
              </h4>
              {!setup ? (
                <p className="text-muted">
                  No active Virtual Lab experiment is loaded. Open Virtual Lab to configure a sample and control, or study the “Missing Control Group” example scenario below.
                </p>
              ) : controlConfig?.mode === 'none-not-applicable' ? (
                <p className="text-muted control-na-msg">
                  No control — marked not applicable
                  {controlConfig.reason ? `: ${controlConfig.reason}` : ''}.
                </p>
              ) : controlApplicable && controlConfig ? (
                <>
                  <dl className="control-meta-dl">
                    <dt>Control ID</dt>
                    <dd>{controlConfig.sampleId}</dd>
                    <dt>Biological sample</dt>
                    <dd>{controlConfig.displayName}</dd>
                    <dt>Conditions</dt>
                    <dd>
                      pH {controlConfig.environment.ph} · {controlConfig.environment.temperature}°C · O₂{' '}
                      {controlConfig.environment.oxygen}% · No treatment
                    </dd>
                  </dl>
                  <div className="control-comparison">
                    <div className="control-pill experimental">
                      <span className="pill-label">Experimental</span>
                      <span>{setup.sampleDisplayName}</span>
                      <span>T: {env.temperature}°C · pH: {env.ph} · O₂: {env.oxygen}%</span>
                    </div>
                    <div className="control-pill control">
                      <span className="pill-label">Control</span>
                      <span>{controlConfig.displayName}</span>
                      <span>
                        T: {controlConfig.environment.temperature}°C · pH: {controlConfig.environment.ph} · O₂:{' '}
                        {controlConfig.environment.oxygen}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted warn-text">
                  Missing control group — the active experiment has no configured control. Use Virtual Lab to add a control, or open the “Missing Control Group” learning scenario below.
                </p>
              )}
            </div>

            <div className="teaching-actions">
              <Button variant="secondary" onClick={() => navigate('/experiment-builder')}>Create Improved Experiment</Button>
              <Button variant="secondary" onClick={() => navigate('/virtual-lab')}>
                Compare With Control{controlConfig?.sampleId ? ` (${controlConfig.sampleId})` : ''}
              </Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { replicateCount: Math.max(2, state.settings.replicateCount) } })}>Add Replicates</Button>
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

      <Card title="Learning scenarios">
        <p className="text-muted">Example scenarios for practice — not necessarily your active experiment.</p>
        <div className="pathway-select teaching-scenario-tabs">
          {TEACHING_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`category-tab ${scenarioId === s.id ? 'active' : ''}`}
              onClick={() => { setScenarioId(s.id); setSelected(null); setRevealed(false); }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {scenario && (
          <div className="teaching-scenario-body">
            <span className="learning-topic-badge">LEARNING TOPIC · Example scenario (not necessarily your active experiment)</span>
            <h4>{scenario.title}</h4>
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
          </div>
        )}
      </Card>
    </div>
  );
}
