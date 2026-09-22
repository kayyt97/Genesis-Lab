import { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Metric } from '../components/ui/Metric';
import { SimpleLineChart } from '../components/ui/Metric';
import { GlossaryTerm, ParameterHelp } from '../components/ui/GlossaryTerm';
import { TimelineScrubber } from '../components/ui/TimelineScrubber';
import { PARAM_HELP } from '../content/parameterHelp';
import { SimulationBadge } from '../components/ui/DisclaimerBanner';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { EXPLAIN } from '../content/explainers';
import { ViabilityForecastPanel } from '../components/lab/ViabilityForecastPanel';
import { BiologicalSampleSelector } from '../components/lab/BiologicalSampleSelector';
import { ExperimentCompositionPanel } from '../components/lab/ExperimentCompositionPanel';
import { ControlExperimentPanel } from '../components/lab/ControlExperimentPanel';
import { CultureVisualisation } from '../components/lab/CultureVisualisation';
import { ScientificReportPanel } from '../components/lab/ScientificReportPanel';
import { forecastViability } from '../services/viabilityForecast';
import { runExperimentalDesignCheck, generateAutoControlEnvironment } from '../services/designCheck';
import { useAppState, sendToMicroscope } from '../store/AppContext';
import { defaultEnvironment } from '../data/demoData';
import { organismIndex } from '../catalogue/index';
import type { OrganismCatalogueEntry } from '../catalogue/types';
import {
  createExperimentSetup,
  applyMoleculeToSetup,
  environmentFromSetup,
  inferMoleculeRole,
  createDefaultControl,
} from '../services/experimentWorkspaceService';
import { getSimulationProfile, assertSimulationAllowed } from '../services/organismSimulationProfile';
import { buildScientificReport } from '../services/reportGenerator';
import {
  createSimulation,
  simulationTick,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  resetSimulation,
  setSimulationSpeed,
  updateSimulationEnvironment,
  formatPopulation,
} from '../simulation/engine';
import type { EnvironmentConditions } from '../types';
import type { ReportLanguageLevel, MoleculeTransferRole } from '../types/experimentWorkspace';

const ENV_LABELS: { key: keyof EnvironmentConditions; label: string; unit: string; min: number; max: number; step: number; glossary?: string }[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 80, step: 0.5, glossary: 'temperature' },
  { key: 'ph', label: 'pH', unit: '', min: 0, max: 14, step: 0.1, glossary: 'pH' },
  { key: 'oxygen', label: 'Oxygen', unit: '%', min: 0, max: 100, step: 1 },
  { key: 'carbonDioxide', label: 'CO₂', unit: '%', min: 0, max: 20, step: 0.5 },
  { key: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, step: 1 },
  { key: 'pressure', label: 'Pressure', unit: 'kPa', min: 50, max: 150, step: 0.5, glossary: 'pressure' },
  { key: 'salinity', label: 'Salinity', unit: 'ppt', min: 0, max: 100, step: 1, glossary: 'salinity' },
  { key: 'nutrientAvailability', label: 'Nutrients', unit: '%', min: 0, max: 100, step: 1 },
  { key: 'radiationExposure', label: 'Radiation', unit: 'mSv/h', min: 0, max: 50, step: 0.1, glossary: 'exposure' },
];

const ROLE_OPTIONS: { value: MoleculeTransferRole; label: string }[] = [
  { value: 'medium-component', label: 'Medium component' },
  { value: 'environment-component', label: 'Environment component' },
  { value: 'nutrient', label: 'Nutrient' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'analyte', label: 'Analyte' },
  { value: 'sample-component', label: 'Sample component' },
];

export function VirtualLabPage() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [selectedCatalogueId, setSelectedCatalogueId] = useState('ORG-ECOLI');
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [showDesignCheck, setShowDesignCheck] = useState(false);
  const [showReport, setShowReport] = useState(() => !!state.reportDraft);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [reportLevel, setReportLevel] = useState<ReportLanguageLevel>('standard');
  const [pendingRole, setPendingRole] = useState<MoleculeTransferRole | null>(null);

  const sim = state.activeSimulation;
  const controlSim = state.controlSimulation;
  const handoff = state.labHandoff;
  const setup = state.activeExperimentSetup;
  const catalogueEntry = organismIndex.getById(selectedCatalogueId);
  const profile = getSimulationProfile(selectedCatalogueId);
  const controlActive = setup?.control?.mode !== 'none-not-applicable';

  const displayState = scrubTime !== null && sim
    ? sim.snapshots.find((s) => s.timeHours === scrubTime)?.organismState ?? sim.organismState
    : sim?.organismState;

  const controlDisplayState = scrubTime !== null && controlSim
    ? controlSim.snapshots.find((s) => s.timeHours === scrubTime)?.organismState ?? controlSim.organismState
    : controlSim?.organismState;

  const env = sim?.environment ?? setup?.environment ?? defaultEnvironment;

  const legacyOrganism = catalogueEntry
    ? {
        id: catalogueEntry.id,
        commonName: catalogueEntry.name,
        scientificName: catalogueEntry.scientificName,
        category: catalogueEntry.category as never,
        description: catalogueEntry.description.standard,
        classification: catalogueEntry.taxonomy,
        characteristics: catalogueEntry.characteristics,
        preferredEnvironment: catalogueEntry.preferredEnvironment ?? {},
        associatedExperimentIds: [],
        references: [],
      }
    : undefined;

  const viabilityForecast = useMemo(
    () => forecastViability(env, legacyOrganism as never),
    [env, legacyOrganism],
  );

  const controlEnv = useMemo(
    () => setup?.control?.environment ?? (state.settings.autoControlEnabled ? generateAutoControlEnvironment(defaultEnvironment) : defaultEnvironment),
    [setup, state.settings.autoControlEnabled],
  );

  const designChecks = useMemo(
    () => runExperimentalDesignCheck(env, controlEnv, controlActive ?? false, state.settings.replicateCount),
    [env, controlEnv, controlActive, state.settings.replicateCount],
  );

  const initFromCatalogue = useCallback((entry: OrganismCatalogueEntry) => {
    const allowed = assertSimulationAllowed(entry.id);
    if (!allowed.ok) {
      setActionFeedback(allowed.reason);
      return;
    }
    const experimentSetup = createExperimentSetup(entry);
    const modelEnv = environmentFromSetup(experimentSetup);
    dispatch({ type: 'SET_EXPERIMENT_SETUP', payload: experimentSetup });
    dispatch({ type: 'SET_SIMULATION', payload: createSimulation(entry.id, modelEnv) });
    dispatch({
      type: 'SET_CONTROL_SIMULATION',
      payload: createSimulation(entry.id, experimentSetup.control.environment, undefined, { conditionId: experimentSetup.control.sampleId }),
    });
  }, [dispatch]);

  useEffect(() => {
    if (setup?.catalogueEntryId) setSelectedCatalogueId(setup.catalogueEntryId);
  }, [setup?.catalogueEntryId]);

  useEffect(() => {
    if (!catalogueEntry) return;
    const allowed = assertSimulationAllowed(catalogueEntry.id);
    if (!allowed.ok) return;
    if (!setup) {
      initFromCatalogue(catalogueEntry);
      return;
    }
    if (!sim) {
      dispatch({ type: 'SET_SIMULATION', payload: createSimulation(setup.catalogueEntryId, environmentFromSetup(setup)) });
    }
  }, [setup, sim, catalogueEntry, initFromCatalogue, dispatch]);

  useEffect(() => {
    if (!setup?.control || controlSim) return;
    if (setup.control.mode === 'none-not-applicable') return;
    dispatch({
      type: 'SET_CONTROL_SIMULATION',
      payload: createSimulation(setup.catalogueEntryId, setup.control.environment, undefined, { conditionId: setup.control.sampleId }),
    });
  }, [setup, controlSim, dispatch]);

  useEffect(() => {
    if (sim?.status !== 'running') return;
    const interval = setInterval(() => dispatch({ type: 'TICK_SIMULATION' }), 500);
    return () => clearInterval(interval);
  }, [sim?.status, dispatch]);

  useEffect(() => {
    if (!handoff || handoff.targetModule !== 'Virtual Lab') return;
    // Organism catalogue handoff — select sample, do not open molecule role picker
    if (handoff.entityId.startsWith('ORG-')) {
      const entry = organismIndex.getById(handoff.entityId);
      if (entry) {
        const allowed = assertSimulationAllowed(entry.id);
        if (!allowed.ok) {
          setActionFeedback(allowed.reason);
          dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
          return;
        }
        setSelectedCatalogueId(entry.id);
        initFromCatalogue(entry);
      }
      dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
      setPendingRole(null);
      return;
    }
    if (handoff.type !== 'molecule' && handoff.type !== 'therapeutic') return;
    if (handoff.type === 'therapeutic') {
      // Therapeutic designs attach as conceptual treatment context
      setPendingRole('treatment');
      return;
    }
    setPendingRole(handoff.moleculeRole ?? inferMoleculeRole(handoff.entityId, handoff.label));
  }, [handoff, dispatch, initFromCatalogue]);

  const applyHandoffMolecule = (role: MoleculeTransferRole) => {
    if (!handoff || !setup) return;
    const updated = applyMoleculeToSetup(setup, { id: handoff.entityId, name: handoff.label, formula: handoff.formula ?? '' }, role);
    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: updated });
    if (sim) dispatch({ type: 'SET_SIMULATION', payload: updateSimulationEnvironment(sim, environmentFromSetup(updated)) });
    dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
    setPendingRole(null);
  };

  const handleSelectOrganism = (entry: OrganismCatalogueEntry) => {
    setSelectedCatalogueId(entry.id);
    initFromCatalogue(entry);
  };

  const handleStart = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: startSimulation(sim) });
    if (controlSim && controlActive) dispatch({ type: 'SET_CONTROL_SIMULATION', payload: startSimulation(controlSim) });
    if (setup) {
      dispatch({
        type: 'UPDATE_EXPERIMENT_SETUP',
        payload: { ...setup, lifecycle: 'active', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      });
    }
  };

  const handlePause = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: pauseSimulation(sim) });
    if (controlSim?.status === 'running') dispatch({ type: 'SET_CONTROL_SIMULATION', payload: pauseSimulation(controlSim) });
  };

  const handleResume = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: resumeSimulation(sim) });
    if (controlSim?.status === 'paused') dispatch({ type: 'SET_CONTROL_SIMULATION', payload: resumeSimulation(controlSim) });
  };

  const handleReset = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: resetSimulation(sim) });
    if (controlSim) dispatch({ type: 'SET_CONTROL_SIMULATION', payload: resetSimulation(controlSim) });
  };

  const handleStep = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: pauseSimulation(simulationTick(startSimulation(sim))) });
    if (controlSim && controlActive) {
      dispatch({ type: 'SET_CONTROL_SIMULATION', payload: pauseSimulation(simulationTick(startSimulation(controlSim))) });
    }
  };

  const handleEnvChange = (key: keyof EnvironmentConditions, value: number) => {
    if (!sim || !setup) return;
    const newEnv = { ...sim.environment, [key]: value };
    dispatch({ type: 'SET_SIMULATION', payload: updateSimulationEnvironment(sim, { [key]: value }) });
    dispatch({
      type: 'UPDATE_EXPERIMENT_SETUP',
      payload: {
        ...setup,
        environment: newEnv,
        updatedAt: new Date().toISOString(),
        history: [...setup.history, { timestamp: new Date().toISOString(), type: 'parameter-change', detail: `${key} → ${value}` }],
      },
    });
  };

  const handleUseBaselineControl = () => {
    if (!setup || !catalogueEntry) return;
    const control = createDefaultControl(catalogueEntry, setup.control.sampleId, defaultEnvironment);
    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: { ...setup, control: { ...control, mode: 'auto-baseline' }, updatedAt: new Date().toISOString() } });
    dispatch({ type: 'SET_CONTROL_SIMULATION', payload: createSimulation(catalogueEntry.id, control.environment, undefined, { conditionId: control.sampleId }) });
  };

  const handleControlMode = (mode: NonNullable<typeof setup>['control']['mode'], reason?: string) => {
    if (!setup || !catalogueEntry) return;
    const control = { ...setup.control, mode, reason, environment: mode === 'custom' ? setup.environment : setup.control.environment, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: { ...setup, control, updatedAt: new Date().toISOString() } });
    if (mode !== 'none-not-applicable') {
      dispatch({ type: 'SET_CONTROL_SIMULATION', payload: createSimulation(catalogueEntry.id, control.environment, undefined, { conditionId: control.sampleId }) });
    } else {
      dispatch({ type: 'SET_CONTROL_SIMULATION', payload: null });
    }
  };

  const handleGenerateReport = (level: ReportLanguageLevel = reportLevel) => {
    if (!setup) {
      setActionFeedback('Unable to generate report. Select a biological sample and set up an experiment first.');
      return;
    }
    const project = state.projects.find((p) => p.id === state.settings.activeProjectId) ?? null;
    dispatch({ type: 'SET_REPORT_DRAFT', payload: buildScientificReport(setup, sim, controlSim, project, level) });
    setReportLevel(level);
    if (setup.lifecycle === 'active' || setup.lifecycle === 'ready') {
      dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: { ...setup, lifecycle: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
    }
    setShowReport(true);
    setActionFeedback('Scientific report generated. Preview is shown below — it will persist after refresh.');
  };

  const handleSaveBaseline = () => {
    if (!sim) {
      setActionFeedback('No active simulation to save as baseline. Start or step the simulation first.');
      return;
    }
    dispatch({ type: 'SAVE_SIMULATION_SNAPSHOT' });
    setActionFeedback('Baseline saved for comparison (Research Assistant and this session).');
  };

  const viabilityData = sim?.snapshots.map((s) => ({ x: s.timeHours, y: s.organismState.viability })) ?? [];
  const populationData = sim?.snapshots.map((s) => ({ x: s.timeHours, y: s.organismState.population / 1e6 })) ?? [];
  const hasTreatment = setup?.transferredMolecules.some((m) => m.role === 'treatment') ?? false;

  return (
    <div className="virtual-lab">
      <PageHeader title="Virtual Lab" subtitle="Construct and run educational simulation experiments" actions={<SimulationBadge />} />

      <AboutThisTool
        title="Understanding the Virtual Lab"
        whatIsThis={EXPLAIN.virtualLab.whatIsIt}
        whyUseIt={EXPLAIN.virtualLab.whyItMatters ?? ''}
        whatCanILearn="How environment, treatments, and controls affect modelled viability and population over simulated time."
        caveat={EXPLAIN.virtualLab.whatItDoesNotMean}
      />

      {handoff && handoff.targetModule === 'Virtual Lab' && pendingRole && (
        <div className="handoff-banner">
          <p>Import <strong>{handoff.label}</strong> from {handoff.sourceModule}. Choose its role:</p>
          <div className="handoff-role-picker">
            {ROLE_OPTIONS.map((opt) => (
              <Button key={opt.value} variant={pendingRole === opt.value ? 'primary' : 'secondary'} onClick={() => applyHandoffMolecule(opt.value)}>
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="lab-grid">
        <Card title="Sample / Environment View" className="lab-view-panel">
          <ViabilityForecastPanel forecast={viabilityForecast} />
          <div className="environment-visual">
            <p className="sim-vis-label text-muted">Simulated visualisation — not microscopy</p>
            <div className={`dual-culture-row ${controlActive ? 'with-control' : ''}`}>
              <div className="culture-panel experimental">
                <span className="pill-label">Experimental</span>
                <CultureVisualisation
                  compact
                  showLabel={false}
                  morphologyType={profile.morphologyType}
                  category={profile.category}
                  organismName={catalogueEntry?.name ?? 'No sample'}
                  state={displayState}
                  treatmentActive={hasTreatment}
                />
              </div>
              {controlActive && setup?.control && (
                <div className="culture-panel control">
                  <span className="pill-label">Control · {setup.control.sampleId}</span>
                  <CultureVisualisation
                    compact
                    showLabel={false}
                    morphologyType={profile.morphologyType}
                    category={profile.category}
                    organismName={setup.control.displayName}
                    state={controlDisplayState}
                  />
                </div>
              )}
            </div>
            <div className="env-readout">
              {sim && (
                <>
                  <span>T: {sim.environment.temperature}°C</span>
                  <span>pH: {sim.environment.ph}</span>
                  <span>O₂: {sim.environment.oxygen}%</span>
                  <span>Time: {sim.timeHours.toFixed(1)} h</span>
                  {setup && <span>{setup.sampleId}</span>}
                </>
              )}
            </div>
          </div>
        </Card>

        <Card title="Organism Selection">
          <BiologicalSampleSelector
            selectedId={selectedCatalogueId}
            sampleDisplayId={setup?.sampleId}
            onSelect={handleSelectOrganism}
          />

          {setup && (
            <details className="experiment-composition-details">
              <summary>Current experiment composition</summary>
              <ExperimentCompositionPanel
                setup={setup}
                controlConfigured={controlActive && controlSim !== null}
              />
            </details>
          )}

          <ControlExperimentPanel
            experimentalName={setup?.sampleDisplayName ?? catalogueEntry?.name ?? 'Experimental'}
            controlConfig={setup?.control ?? null}
            experimentalSim={sim}
            controlSim={controlSim}
            experimentalEnv={env}
            onModeChange={handleControlMode}
            onUseBaseline={handleUseBaselineControl}
          />
        </Card>

        <Card title="Simulation Controls">
          <div className="sim-controls">
            <Button className="sim-control-btn" onClick={handleStart} disabled={sim?.status === 'running'}>Start</Button>
            <Button className="sim-control-btn" variant="secondary" onClick={handlePause} disabled={!sim || sim.status !== 'running'}>Pause</Button>
            <Button className="sim-control-btn" variant="secondary" onClick={handleResume} disabled={!sim || sim.status !== 'paused'}>Resume</Button>
            <Button className="sim-control-btn" variant="secondary" onClick={handleReset} disabled={!sim}>Reset</Button>
            <Button className="sim-control-btn" variant="secondary" onClick={handleStep} disabled={!sim}>Step Forward</Button>
            <Button className="sim-control-btn" variant="secondary" onClick={handleSaveBaseline} disabled={!sim}>Save Baseline</Button>
            <Button className="sim-control-btn" variant="secondary" onClick={() => handleGenerateReport()} disabled={!setup}>Generate Report</Button>
          </div>
          {actionFeedback && <p className="success-text action-feedback" role="status">{actionFeedback}</p>}
          {!setup && <p className="text-muted">Select a sample above to enable report generation.</p>}
          {state.priorSimulationSnapshot && (
            <p className="text-muted">Baseline stored from tick {state.priorSimulationSnapshot.currentTick} ({state.priorSimulationSnapshot.timeHours.toFixed(1)} h).</p>
          )}
          {(showReport || state.reportDraft) && state.reportDraft && !showReport && (
            <Button variant="ghost" onClick={() => setShowReport(true)}>Show saved report preview</Button>
          )}
          <div className="report-level-picker">
            <span className="report-level-label">Report detail:</span>
            {(['simple', 'standard', 'technical'] as ReportLanguageLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                className={`filter-btn ${reportLevel === level ? 'active' : ''}`}
                onClick={() => setReportLevel(level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <label className="checkbox-label">
            <input type="checkbox" checked={sim?.variabilityEnabled ?? false} onChange={(e) => {
              if (!sim) return;
              dispatch({ type: 'SET_SIMULATION', payload: { ...sim, variabilityEnabled: e.target.checked } });
            }} />
            Enable experimental variability (seeded, reproducible)
          </label>
          {sim?.seed !== undefined && <p className="text-muted">Simulation seed: {sim.seed}</p>}
          <label className="checkbox-label">
            <input type="checkbox" checked={state.settings.autoControlEnabled} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { autoControlEnabled: e.target.checked } })} />
            Auto-control: matched control environment proposed
          </label>
          {!state.settings.autoControlEnabled && (
            <p className="text-muted warn-text">Auto-control off: interpretation without a control may be harder.</p>
          )}
          <Button
            variant={showDesignCheck ? 'primary' : 'secondary'}
            aria-pressed={showDesignCheck}
            onClick={() => setShowDesignCheck(!showDesignCheck)}
          >
            Design Check
          </Button>
          {showDesignCheck && (
            <ul className="design-check-list">
              {designChecks.map((c) => (
                <li key={c.id} className={`design-check design-check-${c.status}`}>{c.label}</li>
              ))}
            </ul>
          )}
          {controlActive && setup?.control && (
            <div className="control-comparison">
              <div className="control-pill experimental">
                <span className="pill-label">Experimental</span>
                <span>T: {env.temperature}°C · pH: {env.ph} · O₂: {env.oxygen}%</span>
              </div>
              <div className="control-pill control">
                <span className="pill-label">Control</span>
                <span>T: {setup.control.environment.temperature}°C · pH: {setup.control.environment.ph} · O₂: {setup.control.environment.oxygen}%</span>
              </div>
            </div>
          )}
          <label className="checkbox-label">
            Replicates: {state.settings.replicateCount}
            <input type="range" min="1" max="5" step="1" value={state.settings.replicateCount} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { replicateCount: parseInt(e.target.value, 10) } })} />
          </label>
          <div className="lab-handoff-actions">
            <Button variant="secondary" onClick={() => {
              if (!sim || !catalogueEntry) return;
              sendToMicroscope(dispatch, {
                id: `MS-${Date.now().toString(36)}`,
                label: `${catalogueEntry.name} (Virtual Lab)`,
                sourceType: 'virtual-lab',
                sourceId: selectedCatalogueId,
                organismCategory: catalogueEntry.category as never,
                morphologySupported: catalogueEntry.morphologySupported,
                simulatedViability: sim.organismState.viability,
                notes: `Modelled viability: ${sim.organismState.viability.toFixed(1)}% at ${sim.timeHours.toFixed(1)} h`,
              });
              navigate('/microscope');
            }}>Send to Microscope</Button>
            <Button variant="secondary" onClick={() => navigate('/pathway-explorer')}>Open in Pathway Explorer</Button>
          </div>
          <div className="speed-control">
            <label>Speed: {sim?.speed ?? 1}×
              <input type="range" min="0.25" max="8" step="0.25" value={sim?.speed ?? 1} onChange={(e) => {
                if (!sim) return;
                dispatch({ type: 'SET_SIMULATION', payload: setSimulationSpeed(sim, parseFloat(e.target.value)) });
              }} />
            </label>
          </div>
        </Card>

        <Card title="Environmental Conditions" className="span-2">
          <div className="env-controls-grid">
            {ENV_LABELS.map(({ key, label, unit, min, max, step, glossary }) => (
              <div key={key} className="env-control">
                <label>
                  <span className="env-label-row">
                    {glossary ? <GlossaryTerm term={glossary}>{label}</GlossaryTerm> : label}
                    {PARAM_HELP[key] && <ParameterHelp label={label} help={PARAM_HELP[key]} />}
                  </span>
                  <span className="env-value">{sim?.environment[key] ?? defaultEnvironment[key]}{unit}</span>
                </label>
                <input type="range" min={min} max={max} step={step} value={sim?.environment[key] ?? defaultEnvironment[key]} onChange={(e) => handleEnvChange(key, parseFloat(e.target.value))} />
              </div>
            ))}
          </div>
          <p className="env-note text-muted">Changing environmental variables applies prototype educational rules — not validated physical models.</p>
        </Card>

        <Card title="Measurements">
          {sim && displayState ? (
            <div className="metrics-grid">
              <Metric label="Population" value={formatPopulation(displayState.population)} />
              <Metric label="Viability" value={displayState.viability.toFixed(1)} unit="%" />
              <Metric label="Replication Rate" value={displayState.replicationRate.toFixed(3)} unit="/h" />
              <Metric label="Stress" value={displayState.stress.toFixed(1)} unit="%" variant={displayState.stress > 50 ? 'warning' : 'default'} />
              <Metric label="Mutation Indicator" value={displayState.mutationIndicator.toFixed(2)} unit="%" />
              <Metric label="Env. Tolerance" value={displayState.environmentalTolerance.toFixed(1)} unit="%" />
            </div>
          ) : (
            <p className="text-muted">Initialize simulation to view measurements.</p>
          )}
          {controlActive && controlSim && controlDisplayState && (
            <div className="control-measurements">
              <h4 className="control-measurements-title">Control measurements</h4>
              <div className="metrics-grid">
                <Metric label="Control viability" value={controlDisplayState.viability.toFixed(1)} unit="%" />
                <Metric label="Control population" value={formatPopulation(controlDisplayState.population)} />
              </div>
            </div>
          )}
        </Card>

        <Card title="Timeline & Observations" className="span-2">
          {sim && sim.snapshots.length > 0 && (
            <TimelineScrubber snapshots={sim.snapshots} currentTimeHours={scrubTime ?? sim.timeHours} onSeek={(t) => setScrubTime(t)} />
          )}
          <div className="charts-row">
            <SimpleLineChart data={viabilityData} label="Viability" color="#66bb6a" yUnit="%" />
            <SimpleLineChart data={populationData} label="Population" color="#4fc3f7" yUnit="×10⁶" />
          </div>
          <div className="events-log">
            <h4>Simulation Events</h4>
            {sim?.events.length === 0 && <p className="text-muted">No events yet.</p>}
            <ul>
              {sim?.events.slice().reverse().slice(0, 10).map((ev, i) => (
                <li key={i} className={`event event-${ev.type}`}>
                  <span className="event-time">{ev.timeHours.toFixed(1)}h</span>
                  {ev.message}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {(showReport || !!state.reportDraft) && state.reportDraft && setup && (
          <Card title="Scientific Report" className="span-2">
            <ScientificReportPanel
              report={state.reportDraft}
              setup={setup}
              experimentalSim={sim}
              controlSim={controlSim}
              project={state.projects.find((p) => p.id === state.settings.activeProjectId) ?? null}
              onRegenerate={(level) => handleGenerateReport(level)}
              onUpdateSection={(sectionId, content) => dispatch({ type: 'UPDATE_REPORT_SECTION', payload: { sectionId, content } })}
              onFinalize={() => dispatch({
                type: 'SET_REPORT_DRAFT',
                payload: state.reportDraft ? { ...state.reportDraft, finalized: true, updatedAt: new Date().toISOString() } : null,
              })}
            />
          </Card>
        )}
        {showReport && !setup && (
          <Card title="Scientific Report" className="span-2">
            <p className="error-text">Unable to show report preview without an active experiment setup. Select a biological sample first.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
