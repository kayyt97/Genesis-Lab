import { useEffect, useCallback, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Metric } from '../components/ui/Metric';
import { SimpleLineChart } from '../components/ui/Metric';
import { GlossaryTerm, ParameterHelp } from '../components/ui/GlossaryTerm';
import { TimelineScrubber } from '../components/ui/TimelineScrubber';
import { PARAM_HELP } from '../content/parameterHelp';
import { SimulationBadge } from '../components/ui/DisclaimerBanner';
import { useAppState } from '../store/AppContext';
import { demoOrganisms, defaultEnvironment } from '../data/demoData';
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

export function VirtualLabPage() {
  const { state, dispatch } = useAppState();
  const [selectedOrganism, setSelectedOrganism] = useState('ORG-001');
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const sim = state.activeSimulation;
  const handoff = state.labHandoff;

  const displayState = scrubTime !== null && sim
    ? sim.snapshots.find((s) => s.timeHours === scrubTime)?.organismState ?? sim.organismState
    : sim?.organismState;

  const initSimulation = useCallback(() => {
    const newSim = createSimulation(selectedOrganism, defaultEnvironment);
    dispatch({ type: 'SET_SIMULATION', payload: newSim });
  }, [selectedOrganism, dispatch]);

  useEffect(() => {
    if (!sim) initSimulation();
  }, [sim, initSimulation]);

  useEffect(() => {
    if (sim?.status !== 'running') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK_SIMULATION' });
    }, 500);
    return () => clearInterval(interval);
  }, [sim?.status, dispatch]);

  const handleStart = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: startSimulation(sim) });
  };

  const handlePause = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: pauseSimulation(sim) });
  };

  const handleResume = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: resumeSimulation(sim) });
  };

  const handleReset = () => {
    if (!sim) return;
    dispatch({ type: 'SET_SIMULATION', payload: resetSimulation(sim) });
  };

  const handleStep = () => {
    if (!sim) return;
    const running = startSimulation(sim);
    const stepped = simulationTick(running);
    dispatch({ type: 'SET_SIMULATION', payload: pauseSimulation(stepped) });
  };

  const handleEnvChange = (key: keyof EnvironmentConditions, value: number) => {
    if (!sim) return;
    dispatch({
      type: 'SET_SIMULATION',
      payload: updateSimulationEnvironment(sim, { [key]: value }),
    });
  };

  const organism = demoOrganisms.find((o) => o.id === selectedOrganism);
  const viabilityData =
    sim?.snapshots.map((s) => ({ x: s.timeHours, y: s.organismState.viability })) ?? [];
  const populationData =
    sim?.snapshots.map((s) => ({
      x: s.timeHours,
      y: s.organismState.population / 1e6,
    })) ?? [];

  return (
    <div className="virtual-lab">
      <PageHeader
        title="Virtual Lab"
        subtitle="Construct and run educational simulation experiments"
        actions={<SimulationBadge />}
      />

      {handoff && handoff.targetModule === 'Virtual Lab' && (
        <div className="handoff-banner">
          Received from {handoff.sourceModule}: <strong>{handoff.label}</strong>
          <button type="button" className="handoff-dismiss" onClick={() => dispatch({ type: 'SET_LAB_HANDOFF', payload: null })}>×</button>
        </div>
      )}

      <div className="lab-grid">
        <Card title="Sample / Environment View" className="lab-view-panel">
          <div className="environment-visual">
            <div className="petri-dish">
              <div
                className="culture-glow"
                style={{
                  opacity: sim ? sim.organismState.viability / 100 : 0.5,
                  transform: `scale(${0.8 + (sim?.organismState.population ?? 0) / 2e9})`,
                }}
              />
              <div className="organism-label">
                {organism?.commonName ?? 'No organism selected'}
              </div>
            </div>
            <div className="env-readout">
              {sim && (
                <>
                  <span>T: {sim.environment.temperature}°C</span>
                  <span>pH: {sim.environment.ph}</span>
                  <span>O₂: {sim.environment.oxygen}%</span>
                  <span>Time: {sim.timeHours.toFixed(1)} h</span>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card title="Organism Selection">
          <select
            className="select-input"
            value={selectedOrganism}
            onChange={(e) => {
              setSelectedOrganism(e.target.value);
              const newSim = createSimulation(e.target.value, defaultEnvironment);
              dispatch({ type: 'SET_SIMULATION', payload: newSim });
            }}
          >
            {demoOrganisms.map((o) => (
              <option key={o.id} value={o.id}>
                {o.commonName} ({o.scientificName})
              </option>
            ))}
          </select>
          {organism && (
            <p className="organism-desc">{organism.description.slice(0, 150)}…</p>
          )}
        </Card>

        <Card title="Simulation Controls">
          <div className="sim-controls">
            <Button onClick={handleStart} disabled={sim?.status === 'running'}>
              Start
            </Button>
            <Button variant="secondary" onClick={handlePause} disabled={sim?.status !== 'running'}>
              Pause
            </Button>
            <Button variant="secondary" onClick={handleResume} disabled={sim?.status !== 'paused'}>
              Resume
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="ghost" onClick={handleStep}>
              Step Forward
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: 'SAVE_SIMULATION_SNAPSHOT' })}>
              Save Baseline
            </Button>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={sim?.variabilityEnabled ?? false}
              onChange={(e) => {
                if (!sim) return;
                dispatch({
                  type: 'SET_SIMULATION',
                  payload: { ...sim, variabilityEnabled: e.target.checked },
                });
              }}
            />
            Enable experimental variability (seeded, reproducible)
          </label>
          {sim?.seed !== undefined && (
            <p className="text-muted">Simulation seed: {sim.seed}</p>
          )}
          <div className="speed-control">
            <label>
              Speed: {sim?.speed ?? 1}×
              <input
                type="range"
                min="0.25"
                max="8"
                step="0.25"
                value={sim?.speed ?? 1}
                onChange={(e) => {
                  if (!sim) return;
                  dispatch({
                    type: 'SET_SIMULATION',
                    payload: setSimulationSpeed(sim, parseFloat(e.target.value)),
                  });
                }}
              />
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
                  <span className="env-value">
                    {sim?.environment[key] ?? defaultEnvironment[key]}
                    {unit}
                  </span>
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={sim?.environment[key] ?? defaultEnvironment[key]}
                  onChange={(e) => handleEnvChange(key, parseFloat(e.target.value))}
                />
              </div>
            ))}
          </div>
          <p className="env-note text-muted">
            Changing environmental variables applies prototype educational rules — not validated physical models.
          </p>
        </Card>

        <Card title="Measurements">
          {sim && displayState ? (
            <div className="metrics-grid">
              <Metric label="Population" value={formatPopulation(displayState.population)} />
              <Metric label="Viability" value={displayState.viability.toFixed(1)} unit="%" />
              <Metric
                label="Replication Rate"
                value={displayState.replicationRate.toFixed(3)}
                unit="/h"
              />
              <Metric label="Stress" value={displayState.stress.toFixed(1)} unit="%" variant={displayState.stress > 50 ? 'warning' : 'default'} />
              <Metric label="Mutation Indicator" value={displayState.mutationIndicator.toFixed(2)} unit="%" />
              <Metric label="Env. Tolerance" value={displayState.environmentalTolerance.toFixed(1)} unit="%" />
            </div>
          ) : (
            <p className="text-muted">Initialize simulation to view measurements.</p>
          )}
        </Card>

        <Card title="Timeline & Observations" className="span-2">
          {sim && sim.snapshots.length > 0 && (
            <TimelineScrubber
              snapshots={sim.snapshots}
              currentTimeHours={scrubTime ?? sim.timeHours}
              onSeek={(t) => setScrubTime(t)}
            />
          )}
          <div className="charts-row">
            <SimpleLineChart data={viabilityData} label="Viability" color="#66bb6a" yUnit="%" />
            <SimpleLineChart data={populationData} label="Population" color="#4fc3f7" yUnit="×10⁶" />
          </div>
          <div className="events-log">
            <h4>Simulation Events</h4>
            {sim?.events.length === 0 && <p className="text-muted">No events yet.</p>}
            <ul>
              {sim?.events
                .slice()
                .reverse()
                .slice(0, 10)
                .map((ev, i) => (
                  <li key={i} className={`event event-${ev.type}`}>
                    <span className="event-time">{ev.timeHours.toFixed(1)}h</span>
                    {ev.message}
                  </li>
                ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
