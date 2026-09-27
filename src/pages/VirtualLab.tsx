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
import { TumourMetricsPanel } from '../components/lab/TumourMetricsPanel';
import { TumourCellMovementReadoutPanel } from '../components/lab/TumourCellMovementReadoutPanel';
import { TumourResponseMonitoringPanel } from '../components/lab/TumourResponseMonitoringPanel';
import { TumourTestFlowPanel } from '../components/lab/TumourTestFlowPanel';
import { buildTumourCellMovementReadout } from '../services/tumourCellMovementReadout';
import {
  buildTumourResponseMonitoring,
  savePairedResponseOnSetup,
  toPairedResponseSnapshot,
} from '../services/tumourResponseMonitoring';
import {
  loadTherapeuticDesignsFromStorage,
  sanitizeTherapeuticDesign,
} from '../services/therapeuticDesignPersistence';
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
  attachTherapeuticToSetup,
  isTherapeuticDesignId,
  recordDishBaseline,
  syncMatchedControlEnvironment,
  environmentsMatchForComparison,
} from '../services/experimentWorkspaceService';
import { getSimulationProfile, assertSimulationAllowed } from '../services/organismSimulationProfile';
import { buildScientificReport, ensureTumourMovementReportSection, ensureTumourResponseReportSection } from '../services/reportGenerator';
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
import {
  deriveTumourExperimentSeed,
  isTumourCellModel,
  therapeuticConfigFromDesign,
} from '../services/tumourCellSimulation';
import { THERAPEUTIC_INTENDED_OUTCOME_LABELS } from '../types/scientific';
import type { EnvironmentConditions, TherapeuticTreatmentConfig } from '../types';
import type { ActiveExperimentSetup, ReportLanguageLevel, MoleculeTransferRole } from '../types/experimentWorkspace';
import type { TherapeuticDesign } from '../types/scientific';

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

function pairedSimulations(
  setup: ActiveExperimentSetup,
  treatment: TherapeuticTreatmentConfig | null | undefined,
) {
  const seed = setup.simulationSeed
    ?? deriveTumourExperimentSeed(treatment?.designId, setup.catalogueEntryId);
  const expEnv = environmentFromSetup(setup);
  const experimental = createSimulation(setup.catalogueEntryId, expEnv, undefined, {
    seed,
    therapeuticTreatment: treatment ?? undefined,
  });
  const control = createSimulation(setup.catalogueEntryId, setup.control.environment, undefined, {
    seed,
    conditionId: setup.control.sampleId,
    // Control is always untreated
  });
  return { experimental, control, seed };
}

export function VirtualLabPage() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [selectedCatalogueId, setSelectedCatalogueId] = useState(
    () => state.activeExperimentSetup?.catalogueEntryId ?? 'ORG-ECOLI',
  );
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
  const attachedTherapeutic = setup?.attachedTherapeutic ?? null;

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

  const applySetupSims = useCallback((nextSetup: ActiveExperimentSetup) => {
    const { experimental, control, seed } = pairedSimulations(nextSetup, nextSetup.attachedTherapeutic);
    const withSeed = nextSetup.simulationSeed === seed
      ? nextSetup
      : { ...nextSetup, simulationSeed: seed };
    if (withSeed !== nextSetup) {
      dispatch({ type: 'SET_EXPERIMENT_SETUP', payload: withSeed });
    } else {
      dispatch({ type: 'SET_EXPERIMENT_SETUP', payload: nextSetup });
    }
    dispatch({ type: 'SET_SIMULATION', payload: experimental });
    dispatch({ type: 'SET_CONTROL_SIMULATION', payload: control });
  }, [dispatch]);

  const initFromCatalogue = useCallback((entry: OrganismCatalogueEntry, therapeutic?: TherapeuticDesign | null) => {
    const allowed = assertSimulationAllowed(entry.id);
    if (!allowed.ok) {
      setActionFeedback(allowed.reason);
      return;
    }
    // Always start the dish untreated so a true pre-vector baseline can be recorded.
    let experimentSetup = createExperimentSetup(entry);
    setSelectedCatalogueId(entry.id);
    const { experimental, control, seed } = pairedSimulations(experimentSetup, null);
    experimentSetup = { ...experimentSetup, simulationSeed: seed };

    if (therapeutic && isTumourCellModel(entry.id)) {
      experimentSetup = recordDishBaseline(experimentSetup, experimental, control.organismState);
      experimentSetup = attachTherapeuticToSetup(experimentSetup, therapeutic);
      const treated = {
        ...experimental,
        seed: experimentSetup.simulationSeed ?? seed,
        therapeuticTreatment: therapeuticConfigFromDesign(therapeutic),
      };
      dispatch({ type: 'SET_EXPERIMENT_SETUP', payload: experimentSetup });
      dispatch({ type: 'SET_SIMULATION', payload: treated });
      dispatch({ type: 'SET_CONTROL_SIMULATION', payload: { ...control, seed: experimentSetup.simulationSeed ?? seed } });
      return;
    }

    if (therapeutic) {
      experimentSetup = attachTherapeuticToSetup(experimentSetup, therapeutic);
      applySetupSims(experimentSetup);
      return;
    }

    applySetupSims(experimentSetup);
  }, [applySetupSims, dispatch]);

  const handleRecordDishBaseline = useCallback(() => {
    if (!setup || !sim) {
      setActionFeedback('Select a tumour cell and initialise the dish before recording a baseline.');
      return;
    }
    if (!isTumourCellModel(setup.catalogueEntryId)) {
      setActionFeedback('Baseline-before-vector flow is for simulation-ready tumour cell models.');
      return;
    }
    if (setup.attachedTherapeutic || sim.therapeuticTreatment) {
      setActionFeedback('Baseline should be recorded before applying the conceptual vector. Clear the vector or re-select the cell to start untreated.');
      return;
    }
    const updated = recordDishBaseline(setup, sim, controlSim?.organismState ?? null);
    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: updated });
    dispatch({ type: 'SAVE_SIMULATION_SNAPSHOT' });
    setActionFeedback(
      `Baseline recorded at ${sim.timeHours.toFixed(2)} simulated hours (tick ${sim.currentTick}). Values are simulated educational estimates.`,
    );
  }, [setup, sim, controlSim, dispatch]);

  const handleApplyVector = useCallback((design: TherapeuticDesign) => {
    if (!setup || !sim) {
      setActionFeedback('Load a tumour cell into the dish first.');
      return;
    }
    if (!isTumourCellModel(setup.catalogueEntryId)) {
      setActionFeedback('Conceptual vector apply-on-dish is for tumour cell models.');
      return;
    }

    let next = setup;
    // Ensure a baseline exists before vector so before/after is meaningful
    if (!next.recordedBaseline) {
      if (sim.therapeuticTreatment || next.attachedTherapeutic) {
        setActionFeedback('Cannot invent a pre-vector baseline after treatment started. Re-select the cell, record baseline, then apply the vector.');
        return;
      }
      next = recordDishBaseline(next, sim, controlSim?.organismState ?? null);
    }

    next = attachTherapeuticToSetup(next, design);
    // Control must match experimental environment so treatment is the only intentional difference
    next = syncMatchedControlEnvironment(next, sim.environment);
    const treatment = therapeuticConfigFromDesign(design);
    // Keep current dish state (and baseline); attach treatment in place — do not wipe metrics.
    const treatedSim = {
      ...sim,
      seed: next.simulationSeed ?? sim.seed,
      therapeuticTreatment: treatment,
    };
    const matchedControl = controlSim
      ? {
        ...controlSim,
        seed: next.simulationSeed ?? controlSim.seed,
        therapeuticTreatment: undefined,
        environment: { ...next.control.environment },
      }
      : createSimulation(next.catalogueEntryId, next.control.environment, undefined, {
        seed: next.simulationSeed,
        conditionId: next.control.sampleId,
      });

    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: next });
    dispatch({ type: 'SET_SIMULATION', payload: treatedSim });
    dispatch({ type: 'SET_CONTROL_SIMULATION', payload: matchedControl });
    setActionFeedback(
      `Applied conceptual vector “${design.name}” (${THERAPEUTIC_INTENDED_OUTCOME_LABELS[design.intendedOutcome ?? 'growth-suppression']}). pH unchanged. Control remains untreated and matched. Step the simulation to see before/after.`,
    );
  }, [setup, sim, controlSim, dispatch]);

  const handleFlowRunSteps = useCallback((n: number) => {
    if (!sim) return;
    let nextExp = sim.status === 'running' ? sim : startSimulation(sim);
    let nextCtrl = controlSim
      ? (controlSim.status === 'running' ? controlSim : startSimulation(controlSim))
      : null;
    for (let i = 0; i < n; i++) {
      nextExp = simulationTick(nextExp);
      if (nextCtrl && controlActive) nextCtrl = simulationTick(nextCtrl);
    }
    dispatch({ type: 'SET_SIMULATION', payload: pauseSimulation(nextExp) });
    if (nextCtrl) dispatch({ type: 'SET_CONTROL_SIMULATION', payload: pauseSimulation(nextCtrl) });
  }, [sim, controlSim, controlActive, dispatch]);

  useEffect(() => {
    if (setup?.catalogueEntryId) setSelectedCatalogueId(setup.catalogueEntryId);
  }, [setup?.catalogueEntryId]);

  // Repair legacy mismatched auto-baseline controls (e.g. forced pH 7) so comparisons isolate treatment.
  useEffect(() => {
    if (!setup || !sim) return;
    if (setup.control.mode !== 'auto-baseline') return;
    const match = environmentsMatchForComparison(sim.environment, setup.control.environment);
    if (match.ok) return;
    const synced = syncMatchedControlEnvironment(setup, sim.environment);
    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: synced });
    if (controlSim) {
      dispatch({
        type: 'SET_CONTROL_SIMULATION',
        payload: { ...controlSim, environment: { ...synced.control.environment } },
      });
    }
  }, [setup?.id, setup?.control.mode, sim?.environment.ph, sim?.environment.temperature]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!catalogueEntry) return;
    // Do not auto-init the default Bacteria dish while a Therapeutic Design handoff is pending —
    // that race left E. coli loaded and hid tumour-cell design apply UI.
    if (handoff?.targetModule === 'Virtual Lab' && handoff.type === 'therapeutic') return;
    const allowed = assertSimulationAllowed(catalogueEntry.id);
    if (!allowed.ok) return;
    if (!setup) {
      initFromCatalogue(catalogueEntry);
      return;
    }
    if (!sim) {
      const { experimental, control } = pairedSimulations(setup, setup.attachedTherapeutic);
      dispatch({ type: 'SET_SIMULATION', payload: experimental });
      if (!controlSim && setup.control.mode !== 'none-not-applicable') {
        dispatch({ type: 'SET_CONTROL_SIMULATION', payload: control });
      }
    }
  }, [setup, sim, catalogueEntry, initFromCatalogue, dispatch, controlSim, handoff]);

  useEffect(() => {
    if (!setup?.control || controlSim) return;
    if (setup.control.mode === 'none-not-applicable') return;
    const seed = setup.simulationSeed
      ?? deriveTumourExperimentSeed(setup.attachedTherapeutic?.designId, setup.catalogueEntryId);
    dispatch({
      type: 'SET_CONTROL_SIMULATION',
      payload: createSimulation(setup.catalogueEntryId, setup.control.environment, undefined, {
        seed,
        conditionId: setup.control.sampleId,
      }),
    });
  }, [setup, controlSim, dispatch]);

  useEffect(() => {
    if (sim?.status !== 'running') return;
    const interval = setInterval(() => dispatch({ type: 'TICK_SIMULATION' }), 500);
    return () => clearInterval(interval);
  }, [sim?.status, dispatch]);

  useEffect(() => {
    if (!handoff || handoff.targetModule !== 'Virtual Lab') return;

    if (handoff.entityId.startsWith('ORG-')) {
      const entry = organismIndex.getById(handoff.entityId);
      if (entry) {
        const allowed = assertSimulationAllowed(entry.id);
        if (!allowed.ok) {
          setActionFeedback(allowed.reason);
          dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
          return;
        }
        initFromCatalogue(entry);
      }
      dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
      setPendingRole(null);
      return;
    }

    if (handoff.type === 'therapeutic') {
      const fromHandoff = handoff.therapeuticDesign
        ? sanitizeTherapeuticDesign(handoff.therapeuticDesign)
        : null;
      const fromState = state.therapeuticDesigns.find((d) => d.id === handoff.entityId) ?? null;
      const fromStorage = loadTherapeuticDesignsFromStorage().find((d) => d.id === handoff.entityId) ?? null;
      const design = fromHandoff ?? fromState ?? fromStorage;
      if (!design) {
        setActionFeedback(
          `Therapeutic design “${handoff.label}” was not found in saved designs. Open Therapeutic Design, save again, then send to Virtual Lab.`,
        );
        dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
        return;
      }
      // Keep the list in sync if we recovered the design from handoff embedding / dedicated storage
      if (!fromState) {
        dispatch({ type: 'ADD_THERAPEUTIC', payload: design });
      }

      const targetId = design.targetCellModelId;
      if (targetId) {
        const entry = organismIndex.getById(targetId);
        if (entry) {
          const allowed = assertSimulationAllowed(entry.id);
          if (!allowed.ok) {
            setActionFeedback(allowed.reason);
            dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
            return;
          }
          initFromCatalogue(entry, design);
          setActionFeedback(
            `Loaded ${entry.name} with conceptual treatment “${design.name}” (${THERAPEUTIC_INTENDED_OUTCOME_LABELS[design.intendedOutcome ?? 'growth-suppression']}). Design settings (uptake, effect, targeting, …) are linked to the educational simulation — control is untreated. Simulated estimates only; not evidence a real treatment works.`,
          );
          dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
          setPendingRole(null);
          return;
        }
      }

      if (setup) {
        // Prefer in-place apply with baseline so before/after is available
        let next = setup;
        if (!next.recordedBaseline && sim && !sim.therapeuticTreatment && !next.attachedTherapeutic) {
          next = recordDishBaseline(next, sim, controlSim?.organismState ?? null);
        } else if (!next.recordedBaseline && sim) {
          next = recordDishBaseline(next, sim, controlSim?.organismState ?? null);
        }
        next = attachTherapeuticToSetup(next, design);
        const treatment = therapeuticConfigFromDesign(design);
        if (sim) {
          dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: next });
          dispatch({
            type: 'SET_SIMULATION',
            payload: { ...sim, seed: next.simulationSeed ?? sim.seed, therapeuticTreatment: treatment },
          });
          if (controlSim) {
            dispatch({
              type: 'SET_CONTROL_SIMULATION',
              payload: { ...controlSim, seed: next.simulationSeed ?? controlSim.seed, therapeuticTreatment: undefined },
            });
          }
        } else {
          applySetupSims(next);
        }
        setActionFeedback(
          `Attached conceptual treatment “${design.name}” with its saved settings. Baseline preserved for before/after. Control remains untreated. Simulated educational estimates only.`,
        );
        dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
        setPendingRole(null);
        return;
      }

      // No sample yet — default to HeLa for tumour-cell designs, else ask user to pick
      const fallback = organismIndex.getById('ORG-HELA');
      if (fallback && (design.targetType === 'tumour-cell' || design.targetCellModelId)) {
        initFromCatalogue(fallback, design);
        setActionFeedback(`Loaded HeLa with conceptual treatment “${design.name}” and its saved settings. Select another cell model if needed.`);
        dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
        setPendingRole(null);
        return;
      }

      setActionFeedback('Select a biological sample first, then re-send the therapeutic design.');
      dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
      return;
    }

    if (handoff.type !== 'molecule') return;
    setPendingRole(handoff.moleculeRole ?? inferMoleculeRole(handoff.entityId, handoff.label));
  }, [handoff, dispatch, initFromCatalogue, setup, state.therapeuticDesigns, applySetupSims, sim, controlSim]);

  const applyHandoffMolecule = (role: MoleculeTransferRole) => {
    if (!handoff || !setup) return;
    // Guard: therapeutic ids should not go through molecule pH path
    if (isTherapeuticDesignId(handoff.entityId) && role === 'treatment') {
      const design = state.therapeuticDesigns.find((d) => d.id === handoff.entityId);
      if (design) {
        handleApplyVector(design);
        dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
        setPendingRole(null);
        return;
      }
    }
    const updated = applyMoleculeToSetup(setup, { id: handoff.entityId, name: handoff.label, formula: handoff.formula ?? '' }, role);
    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: updated });
    if (sim) dispatch({ type: 'SET_SIMULATION', payload: updateSimulationEnvironment(sim, environmentFromSetup(updated)) });
    dispatch({ type: 'SET_LAB_HANDOFF', payload: null });
    setPendingRole(null);
  };

  const handleSelectOrganism = (entry: OrganismCatalogueEntry) => {
    setSelectedCatalogueId(entry.id);
    // Preserve attached therapeutic when switching among tumour models if target matches or unset
    const keepTherapeutic = setup?.attachedTherapeutic && isTumourCellModel(entry.id)
      ? state.therapeuticDesigns.find((d) => d.id === setup.attachedTherapeutic?.designId)
      : null;
    initFromCatalogue(entry, keepTherapeutic ?? null);
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
    let nextSetup: typeof setup = {
      ...setup,
      environment: newEnv,
      updatedAt: new Date().toISOString(),
      history: [...setup.history, { timestamp: new Date().toISOString(), type: 'parameter-change', detail: `${key} → ${value}` }],
    };
    if (setup.control.mode === 'auto-baseline') {
      nextSetup = syncMatchedControlEnvironment(nextSetup, newEnv);
    }
    dispatch({ type: 'SET_SIMULATION', payload: updateSimulationEnvironment(sim, { [key]: value }) });
    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: nextSetup });
    if (controlSim && nextSetup.control.mode === 'auto-baseline') {
      dispatch({
        type: 'SET_CONTROL_SIMULATION',
        payload: updateSimulationEnvironment(controlSim, { ...nextSetup.control.environment }),
      });
    }
  };

  const handleUseBaselineControl = () => {
    if (!setup || !catalogueEntry) return;
    const baselineEnv = sim?.environment ?? setup.environment;
    const control = createDefaultControl(catalogueEntry, setup.control.sampleId, baselineEnv);
    const next = { ...setup, control: { ...control, mode: 'auto-baseline' as const }, updatedAt: new Date().toISOString() };
    applySetupSims(next);
  };

  const handleControlMode = (mode: NonNullable<typeof setup>['control']['mode'], reason?: string) => {
    if (!setup || !catalogueEntry) return;
    const matchedEnv = sim?.environment ?? setup.environment;
    const control = {
      ...setup.control,
      mode,
      reason,
      environment: mode === 'none-not-applicable'
        ? setup.control.environment
        : mode === 'custom'
          ? setup.control.environment
          : { ...matchedEnv },
      catalogueEntryId: catalogueEntry.id,
      displayName: `${catalogueEntry.name} (control)`,
      updatedAt: new Date().toISOString(),
    };
    const next = { ...setup, control, updatedAt: new Date().toISOString() };
    if (mode === 'none-not-applicable') {
      dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: next });
      dispatch({ type: 'SET_CONTROL_SIMULATION', payload: null });
    } else {
      applySetupSims(next);
    }
  };

  const handleGenerateReport = (level: ReportLanguageLevel = reportLevel) => {
    if (!setup) {
      setActionFeedback('Unable to generate report. Select a biological sample and set up an experiment first.');
      return;
    }
    const project = state.projects.find((p) => p.id === state.settings.activeProjectId) ?? null;
    dispatch({ type: 'SET_REPORT_DRAFT', payload: buildScientificReport(setup, sim, controlSim, project, level, '', state.settings.replicateCount) });
    setReportLevel(level);
    if (setup.lifecycle === 'active' || setup.lifecycle === 'ready') {
      dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: { ...setup, lifecycle: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
    }
    setShowReport(true);
    setActionFeedback('Scientific report generated. Preview is shown below — it will persist after refresh.');
  };

  // Backfill Tumour Cell Movement + Response Monitoring into older persisted report drafts.
  useEffect(() => {
    if (!setup || !state.reportDraft || !isTumourCellModel(setup.catalogueEntryId)) return;
    let draft = ensureTumourMovementReportSection(
      state.reportDraft,
      setup,
      sim,
      controlSim,
      state.settings.replicateCount,
    );
    draft = ensureTumourResponseReportSection(draft, setup, sim, controlSim);
    const movementChanged =
      state.reportDraft.sections.find((s) => s.id === 'tumour-cell-movement')?.content
      !== draft.sections.find((s) => s.id === 'tumour-cell-movement')?.content;
    const responseChanged =
      state.reportDraft.sections.find((s) => s.id === 'tumour-response-monitoring')?.content
      !== draft.sections.find((s) => s.id === 'tumour-response-monitoring')?.content;
    if (movementChanged || responseChanged || !state.reportDraft.sections.some((s) => s.id === 'tumour-response-monitoring')) {
      dispatch({ type: 'SET_REPORT_DRAFT', payload: draft });
    }
  }, [setup?.id, setup?.catalogueEntryId, setup?.attachedTherapeutic?.designId, setup?.pairedResponseSnapshot?.savedAt, sim?.currentTick, controlSim?.currentTick, state.settings.replicateCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveBaseline = () => {
    if (!sim) {
      setActionFeedback('No active simulation to save as baseline. Start or step the simulation first.');
      return;
    }
    dispatch({ type: 'SAVE_SIMULATION_SNAPSHOT' });
    if (setup && isTumourCellModel(setup.catalogueEntryId) && !setup.attachedTherapeutic && !sim.therapeuticTreatment) {
      const updated = recordDishBaseline(setup, sim, controlSim?.organismState ?? null);
      dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: updated });
      setActionFeedback(
        `Baseline recorded at ${sim.timeHours.toFixed(2)} simulated hours for before/after tumour-cell comparison (simulated educational estimates).`,
      );
      return;
    }
    setActionFeedback('Baseline saved for comparison (Research Assistant and this session).');
  };

  const viabilityData = sim?.snapshots.map((s) => ({ x: s.timeHours, y: s.organismState.viability })) ?? [];
  const populationData = sim?.snapshots.map((s) => ({ x: s.timeHours, y: s.organismState.population / 1e6 })) ?? [];
  const hasTreatment = (setup?.transferredMolecules.some((m) => m.role === 'treatment') ?? false)
    || !!attachedTherapeutic
    || !!sim?.therapeuticTreatment;

  const treatmentLabel = attachedTherapeutic?.designName
    ?? sim?.therapeuticTreatment?.designName
    ?? setup?.transferredMolecules.find((m) => m.role === 'treatment')?.name
    ?? null;

  const treatmentOutcome = attachedTherapeutic?.intendedOutcome
    ?? sim?.therapeuticTreatment?.intendedOutcome;

  const envMatch = setup && sim
    ? environmentsMatchForComparison(sim.environment, setup.control.environment)
    : { ok: true as const };

  const controlSummary = setup?.control
    ? `${setup.control.displayName}; T ${setup.control.environment.temperature}°C, pH ${setup.control.environment.ph}, O₂ ${setup.control.environment.oxygen}%; untreated${envMatch.ok ? '; matched to experimental' : '; MISMATCHED vs experimental'}`
    : 'No control';

  // Gate on the active experiment’s cell model (not just the selector) so HeLa dishes show the readout.
  const movementReadout = useMemo(() => {
    if (!setup || !isTumourCellModel(setup.catalogueEntryId)) return null;
    const treatment = attachedTherapeutic ?? sim?.therapeuticTreatment ?? null;
    const baseSeed = setup.simulationSeed
      ?? sim?.seed
      ?? deriveTumourExperimentSeed(treatment?.designId, setup.catalogueEntryId);
    // Educational projection from the dish seed — visible without pressing Start.
    return buildTumourCellMovementReadout({
      cellModelId: setup.catalogueEntryId,
      cellModelName: catalogueEntry?.name ?? setup.sampleDisplayName,
      experimentalEnv: sim?.environment ?? environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment,
      baseSeed,
      replicateCount: state.settings.replicateCount,
      liveExperimental: sim,
      liveControl: controlSim,
    });
  }, [
    setup,
    attachedTherapeutic,
    sim,
    controlSim,
    catalogueEntry?.name,
    state.settings.replicateCount,
  ]);

  const responseMonitoring = useMemo(() => {
    if (!setup || !isTumourCellModel(setup.catalogueEntryId)) return null;
    const treatment = attachedTherapeutic ?? sim?.therapeuticTreatment ?? null;
    return buildTumourResponseMonitoring({
      cellModelId: setup.catalogueEntryId,
      cellModelName: catalogueEntry?.name ?? setup.sampleDisplayName,
      experimental: sim,
      control: controlSim,
      experimentalEnv: sim?.environment ?? environmentFromSetup(setup),
      controlEnv: setup.control.environment,
      treatment,
      baseline: setup.recordedBaseline ?? null,
      savedAt: setup.pairedResponseSnapshot?.savedAt ?? null,
    });
  }, [setup, attachedTherapeutic, sim, controlSim, catalogueEntry?.name]);

  const handleSavePairedComparison = () => {
    if (!setup || !responseMonitoring) {
      setActionFeedback('Unable to save paired comparison — load a tumour cell dish first.');
      return;
    }
    const snapshot = toPairedResponseSnapshot(
      responseMonitoring,
      attachedTherapeutic?.designId ?? sim?.therapeuticTreatment?.designId ?? null,
    );
    const updated = savePairedResponseOnSetup(setup, snapshot);
    dispatch({ type: 'UPDATE_EXPERIMENT_SETUP', payload: updated });
    if (state.reportDraft) {
      const draft = ensureTumourResponseReportSection(
        state.reportDraft,
        updated,
        sim,
        controlSim,
      );
      dispatch({ type: 'SET_REPORT_DRAFT', payload: draft });
    }
    setActionFeedback(
      snapshot.matchOk
        ? `Paired tumour response comparison saved. It will reopen after refresh (seed ${snapshot.seed ?? 'n/a'}). Educational simulation only — not evidence a real treatment works.`
        : `Paired comparison saved with mismatch flags (${snapshot.mismatches.join('; ')}). Fix matching settings before treating this as a clean control comparison.`,
    );
  };

  return (
    <div className="virtual-lab">
      <PageHeader title="Virtual Lab" subtitle="Construct and run educational simulation experiments" actions={<SimulationBadge />} />

      <AboutThisTool
        title="Understanding the Virtual Lab"
        whatIsThis={EXPLAIN.virtualLab.whatIsIt}
        whyUseIt={EXPLAIN.virtualLab.whyItMatters ?? ''}
        whatCanILearn="How environment, treatments, and controls affect modelled viability, population, and (for tumour cell lines) movement and proliferation over simulated time."
        caveat={EXPLAIN.virtualLab.whatItDoesNotMean}
      />

      {handoff && handoff.targetModule === 'Virtual Lab' && pendingRole && (
        <div className="handoff-banner" role="region" aria-label="Import molecule role picker">
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
                  organismName={catalogueEntry?.name ?? setup?.sampleDisplayName ?? 'No sample'}
                  state={displayState}
                  treatmentActive={hasTreatment}
                />
                {hasTreatment && treatmentLabel ? (
                  <div className="dish-treatment-status" role="status" aria-label="Experimental dish treatment status">
                    <span className="dish-treatment-badge">Treatment active</span>
                    <span className="dish-treatment-name">{treatmentLabel}</span>
                    {treatmentOutcome && (
                      <span className="dish-treatment-outcome">
                        {THERAPEUTIC_INTENDED_OUTCOME_LABELS[treatmentOutcome]}
                      </span>
                    )}
                    <span className="text-muted dish-treatment-note">Conceptual / educational — not a real vector</span>
                  </div>
                ) : (
                  <p className="dish-treatment-status untreated" role="status">No treatment on experimental dish</p>
                )}
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
                  <p className="dish-treatment-status untreated" role="status">
                    Untreated control · matched sample {setup.control.catalogueEntryId === setup.catalogueEntryId ? '✓' : '(sample mismatch)'}
                  </p>
                </div>
              )}
            </div>
            {!envMatch.ok && (
              <p className="warn-text env-mismatch-banner" role="alert">
                Experimental and control conditions differ ({envMatch.mismatches.join('; ')}).
                Treatment-effect comparisons are blocked until environments match. Use “Use baseline as control” or change env under auto-baseline.
              </p>
            )}
            <div className="env-readout" aria-label="Environment readout">
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
            key={setup?.catalogueEntryId ?? selectedCatalogueId}
            selectedId={setup?.catalogueEntryId ?? selectedCatalogueId}
            sampleDisplayId={setup?.sampleId}
            dishCategory={setup?.catalogueCategory ?? catalogueEntry?.category}
            onSelect={handleSelectOrganism}
          />

          <div className="saved-therapeutics-panel" aria-label="Saved conceptual therapeutics">
            <h4 className="saved-therapeutics-heading">Saved conceptual therapeutics</h4>
            <p className="text-muted saved-therapeutics-hint">
              Designs saved in Therapeutic Design appear here after navigation and refresh.
              Applying links their settings into the educational simulation only — not evidence a real treatment works.
            </p>
            {state.therapeuticDesigns.length === 0 ? (
              <p className="text-muted">No saved designs yet. Create and save one in Therapeutic Design.</p>
            ) : (
              <ul className="item-list saved-therapeutics-list">
                {state.therapeuticDesigns.map((d) => {
                  const cell = d.targetCellModelId ? organismIndex.getById(d.targetCellModelId) : null;
                  const active = attachedTherapeutic?.designId === d.id;
                  return (
                    <li key={d.id}>
                      <div className="item-meta-block">
                        <span className="item-name">{d.name}{active ? ' (on dish)' : ''}</span>
                        <span className="text-muted">
                          {THERAPEUTIC_INTENDED_OUTCOME_LABELS[d.intendedOutcome ?? 'growth-suppression']}
                          {cell ? ` · ${cell.name}` : ''}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={active ? 'secondary' : 'primary'}
                        onClick={() => {
                          const entry = organismIndex.getById(d.targetCellModelId ?? 'ORG-HELA');
                          if (entry && isTumourCellModel(entry.id)) {
                            initFromCatalogue(entry, d);
                            setActionFeedback(
                              `Applied “${d.name}” to ${entry.name}. Design settings are in the educational simulation; control is untreated. Simulated estimates only.`,
                            );
                            return;
                          }
                          handleApplyVector(d);
                        }}
                        aria-label={`Apply saved design ${d.name} to Virtual Lab dish`}
                      >
                        {active ? 'Re-apply to dish' : 'Apply to dish'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {setup && (
            <details className="experiment-composition-details">
              <summary>Current experiment composition</summary>
              <ExperimentCompositionPanel
                setup={setup}
                controlConfigured={controlActive && controlSim !== null}
              />
              {attachedTherapeutic && (
                <p className="text-muted" role="status">
                  Attached therapeutic: {attachedTherapeutic.designName} (
                  {THERAPEUTIC_INTENDED_OUTCOME_LABELS[attachedTherapeutic.intendedOutcome]})
                  — experimental dish only · settings from Therapeutic Design
                </p>
              )}
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
          {sim?.seed !== undefined && <p className="text-muted">Simulation seed: {sim.seed} (matched experimental + control)</p>}
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
            <input type="range" min="1" max="5" step="1" value={state.settings.replicateCount} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { replicateCount: parseInt(e.target.value, 10) } })} aria-label="Replicate count" />
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
              }} aria-label="Simulation speed" />
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
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={sim?.environment[key] ?? defaultEnvironment[key]}
                  onChange={(e) => handleEnvChange(key, parseFloat(e.target.value))}
                  aria-label={label}
                />
              </div>
            ))}
          </div>
          <p className="env-note text-muted">Changing environmental variables applies prototype educational rules — not validated physical models.</p>
        </Card>

        <Card title="Measurements" className="span-2">
          {responseMonitoring && (
            <TumourResponseMonitoringPanel
              monitoring={responseMonitoring}
              onSavePairedComparison={handleSavePairedComparison}
              saveFeedback={
                setup?.pairedResponseSnapshot
                  ? (setup.pairedResponseSnapshot.matchOk
                    ? 'Saved paired comparison is available after refresh.'
                    : 'Saved comparison includes mismatch flags.')
                  : null
              }
            />
          )}
          {movementReadout && <TumourCellMovementReadoutPanel readout={movementReadout} />}
          {setup && isTumourCellModel(setup.catalogueEntryId) && (
            <TumourTestFlowPanel
              setup={setup}
              organismName={catalogueEntry?.name ?? setup.sampleDisplayName}
              experimentalSim={sim}
              controlSim={controlSim}
              designs={state.therapeuticDesigns}
              comparisonAllowed={envMatch.ok}
              comparisonBlockReason={
                envMatch.ok
                  ? undefined
                  : `Experimental and control conditions differ (${envMatch.mismatches.join('; ')}). Align environments before comparing treatment effects.`
              }
              onRecordBaseline={handleRecordDishBaseline}
              onApplyVector={handleApplyVector}
              onRunSteps={handleFlowRunSteps}
            />
          )}
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
          {setup && isTumourCellModel(setup.catalogueEntryId) && (
            <TumourMetricsPanel
              organismId={setup.catalogueEntryId}
              organismName={catalogueEntry?.name ?? setup.sampleDisplayName}
              experimental={displayState ?? sim?.organismState}
              control={controlDisplayState ?? controlSim?.organismState}
              experimentalSim={sim}
              controlSim={controlSim}
              treatment={attachedTherapeutic ?? sim?.therapeuticTreatment}
              seed={setup.simulationSeed ?? sim?.seed}
              controlSummary={controlSummary}
            />
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
              replicateCount={state.settings.replicateCount}
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
