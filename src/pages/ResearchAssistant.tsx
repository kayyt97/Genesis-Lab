import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { resolveTiered } from '../content/language';
import { SIMULATION_DISCLAIMER } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { explainSimulationResult } from '../services/explanationEngine';

export function ResearchAssistantPage() {
  const { state } = useAppState();
  const languageLevel = useLanguage();
  const [response, setResponse] = useState('');

  const project = state.projects.find((p) => p.id === state.settings.activeProjectId);
  const sim = state.activeSimulation;

  const explainResult = () => {
    setResponse(resolveTiered(SIMULATION_DISCLAIMER, languageLevel) + '\n\n' +
      (sim
        ? `Active simulation: ${sim.organismState.viability.toFixed(1)}% viability, tick ${sim.currentTick}.`
        : 'No active simulation.'));
  };

  const whyChange = () => {
    const prior = state.priorSimulationSnapshot;
    if (!prior || !sim) {
      setResponse('Run two simulation states with "Save baseline" first, then change a parameter and ask again.');
      return;
    }
    const params = (Object.keys(prior.environment) as (keyof typeof prior.environment)[])
      .filter((k) => prior.environment[k] !== sim.environment[k])
      .map((k) => ({
        paramName: k,
        beforeValue: prior.environment[k] as number,
        afterValue: sim.environment[k] as number,
        beforeState: prior.organismState,
        afterState: sim.organismState,
        beforeEnv: prior.environment,
        afterEnv: sim.environment,
      }));
    setResponse(explainSimulationResult(params, languageLevel));
  };

  const suggestVariable = () => {
    setResponse(
      project
        ? `Active project: "${project.title}". Consider investigating ${project.hypothesis ? 'variables linked to your hypothesis' : 'temperature or pH as starting points'}.`
        : 'Select an active research project for contextual suggestions.',
    );
  };

  return (
    <div className="assistant-page">
      <PageHeader
        title="Research Assistant"
        subtitle="Context-aware local explanations (no external AI)"
      />

      <Card title="Context">
        <dl className="detail-dl">
          <dt>Active project</dt><dd>{project?.title ?? 'None selected'}</dd>
          <dt>Active simulation</dt><dd>{sim ? `${sim.status} — ${sim.timeHours.toFixed(1)} h` : 'None'}</dd>
        </dl>
        <p className="text-muted future-tag">
          Full natural-language AI integration requires a future backend. Current features use deterministic local explanations.
        </p>
      </Card>

      <Card title="Ask">
        <div className="assistant-actions">
          <Button onClick={explainResult}>Explain this result simply</Button>
          <Button variant="secondary" onClick={whyChange}>Why did this change?</Button>
          <Button variant="secondary" onClick={suggestVariable}>What variable should I investigate next?</Button>
        </div>
        {response && (
          <div className="assistant-response">
            <h4>Response</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{response}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
