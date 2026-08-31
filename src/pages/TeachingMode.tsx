import { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { TEACHING_SCENARIOS } from '../data/equipment';
import { runExperimentalDesignCheck, generateAutoControlEnvironment } from '../services/designCheck';
import { defaultEnvironment } from '../data/demoData';

export function TeachingModePage() {
  const { state } = useAppState();
  const [scenarioId, setScenarioId] = useState(TEACHING_SCENARIOS[0]?.id ?? '');
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showDesignCheck, setShowDesignCheck] = useState(true);
  const languageLevel = useLanguage();

  const scenario = TEACHING_SCENARIOS.find((s) => s.id === scenarioId);
  const sim = state.activeSimulation;
  const env = sim?.environment ?? defaultEnvironment;
  const controlEnv = state.settings.autoControlEnabled
    ? generateAutoControlEnvironment(defaultEnvironment)
    : defaultEnvironment;

  const designChecks = useMemo(
    () => runExperimentalDesignCheck(env, controlEnv, state.settings.autoControlEnabled, state.settings.replicateCount),
    [env, controlEnv, state.settings.autoControlEnabled, state.settings.replicateCount],
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
          Optional review before running. Genesis teaches rather than blocks — you can always run unusual experiments.
        </p>
        <Button variant="ghost" onClick={() => setShowDesignCheck(!showDesignCheck)}>
          {showDesignCheck ? 'Hide' : 'Show'} Design Check
        </Button>
        {showDesignCheck && (
          <ul className="design-check-list">
            {designChecks.map((c) => (
              <li key={c.id} className={`design-check design-check-${c.status}`}>
                {c.status === 'pass' && '✓ '}
                {c.status === 'warn' && '⚠ '}
                {c.status === 'info' && '○ '}
                {c.label}
                {c.explanation && <span className="design-check-detail"> — {c.explanation}</span>}
              </li>
            ))}
          </ul>
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
