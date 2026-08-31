import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { resolveTiered } from '../content/language';
import { SIMULATION_DISCLAIMER } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { explainSimulationResult } from '../services/explanationEngine';
import { getPathwaysForGene } from '../services/pathwaySearch';
import { REFERENCE_GENES } from '../data/genes';
import { getReferenceById } from '../data/biologicalLibrary';

export function ResearchAssistantPage() {
  const { state } = useAppState();
  const languageLevel = useLanguage();
  const [response, setResponse] = useState('');

  const project = state.projects.find((p) => p.id === state.settings.activeProjectId);
  const sim = state.activeSimulation;
  const specimen = state.microscopeSpecimen;
  const genome = state.genomeUpload;

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

  const explainGenomeContext = () => {
    if (!genome) {
      setResponse('No uploaded genotype data. Upload a file in Genome Explorer for local analysis.');
      return;
    }
    const report = genome.importReport;
    setResponse(
      `Uploaded file: ${genome.fileName}\n` +
      `Variants parsed: ${genome.variantCount.toLocaleString()}\n` +
      (report
        ? `Chromosome-assigned: ${report.chromosomeAssigned.toLocaleString()}\nBuild: ${report.detectedBuild}\n`
        : '') +
      '\nConsumer genotype arrays do not measure every variant. Absence of data in a gene region does not prove absence of variants.\n' +
      'This is reference/uploaded data — not a clinical interpretation.',
    );
  };

  const explainPathwayContext = () => {
    const gene = REFERENCE_GENES[0];
    const pathways = getPathwaysForGene(gene.id);
    setResponse(
      `Reference example: ${gene.symbol} is linked to ${pathways.length} curated pathway(s).\n` +
      resolveTiered(gene.description, languageLevel) +
      '\n\nPathway interactions shown are reference data with limited coverage. Search Pathway Explorer for specific genes such as HTT.',
    );
  };

  const explainMicroscopeContext = () => {
    if (!specimen) {
      setResponse('No specimen loaded in Virtual Microscope. Load a reference specimen or send a sample from Virtual Lab.');
      return;
    }
    const ref = specimen.sourceId ? getReferenceById(specimen.sourceId) : undefined;
    setResponse(
      `Specimen: ${specimen.label}\n` +
      (specimen.morphologySupported
        ? (ref
          ? resolveTiered(ref.description, languageLevel)
          : 'Simulated morphology based on specimen type and modelled state.')
        : 'No supported morphological prediction available for this specimen.') +
      (specimen.simulatedViability !== undefined
        ? `\n\nModelled viability from Virtual Lab: ${specimen.simulatedViability.toFixed(1)}%`
        : ''),
    );
  };

  const explainVirtualLabEnv = () => {
    if (!sim) {
      setResponse('No active Virtual Lab simulation.');
      return;
    }
    const env = sim.environment;
    setResponse(
      `Current environment: T=${env.temperature}°C, pH=${env.ph}, O₂=${env.oxygen}%, nutrients=${env.nutrientAvailability}%.\n` +
      `Modelled viability: ${sim.organismState.viability.toFixed(1)}%.\n\n` +
      'Oxygen availability affects how organisms produce energy. Some depend on oxygen; others tolerate low oxygen.\n' +
      'Temperature and pH affect enzyme activity and membrane stability in the educational model.\n' +
      'These are modelled predictions — not experimentally established outcomes.',
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
          <dt>Genome upload</dt><dd>{genome ? genome.fileName : 'None'}</dd>
          <dt>Microscope specimen</dt><dd>{specimen?.label ?? 'None'}</dd>
        </dl>
        <p className="text-muted future-tag">
          Explanations are generated locally from app context. Genomic data is not transmitted externally.
        </p>
      </Card>

      <Card title="Virtual Lab">
        <div className="assistant-actions">
          <Button onClick={explainResult}>Explain this result simply</Button>
          <Button variant="secondary" onClick={whyChange}>Why did this change?</Button>
          <Button variant="secondary" onClick={suggestVariable}>What variable should I investigate next?</Button>
          <Button variant="secondary" onClick={explainVirtualLabEnv}>Explain environmental effects</Button>
        </div>
      </Card>

      <Card title="Genome / Pathway / Microscope">
        <div className="assistant-actions">
          <Button variant="secondary" onClick={explainGenomeContext}>Explain genome upload context</Button>
          <Button variant="secondary" onClick={explainPathwayContext}>Explain pathway context</Button>
          <Button variant="secondary" onClick={explainMicroscopeContext}>Explain microscope observation</Button>
        </div>
      </Card>

      {response && (
        <Card title="Response">
          <p style={{ whiteSpace: 'pre-wrap' }}>{response}</p>
        </Card>
      )}
    </div>
  );
}
