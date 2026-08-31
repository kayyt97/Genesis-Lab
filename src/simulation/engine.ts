import type {
  EnvironmentConditions,
  OrganismSimulationState,
  Simulation,
  SimulationEvent,
  SimulationSnapshot,
  DataSourceMeta,
} from '../types';
import { seededRange, generateSeed } from '../services/seededRandom';
import { createOrganismStateFromProfile, getSimulationProfile } from '../services/organismSimulationProfile';

export const SIMULATION_METADATA: DataSourceMeta = {
  sourceType: 'simulation',
  label: 'SIMULATION / EDUCATIONAL MODEL',
  disclaimer:
    'Results are produced by a prototype educational model using simplified deterministic rules. They do not represent validated biological predictions or clinical outcomes.',
};

export function createInitialOrganismState(organismId: string): OrganismSimulationState {
  const legacy = legacyOrganismState(organismId);
  if (legacy) return legacy;
  return createOrganismStateFromProfile(organismId);
}

function legacyOrganismState(organismId: string): OrganismSimulationState | null {
  switch (organismId) {
    case 'ORG-001':
      return { population: 1_000_000, viability: 95, replicationRate: 0.6, stress: 5, mutationIndicator: 1, environmentalTolerance: 80 };
    case 'ORG-002':
      return { population: 100_000, viability: 70, replicationRate: 0.3, stress: 15, mutationIndicator: 5, environmentalTolerance: 40 };
    case 'ORG-003':
      return { population: 1_000_000, viability: 95, replicationRate: 0.35, stress: 5, mutationIndicator: 1, environmentalTolerance: 75 };
    case 'ORG-004':
      return { population: 500_000, viability: 90, replicationRate: 0.15, stress: 10, mutationIndicator: 2, environmentalTolerance: 60 };
    case 'ORG-005':
      return { population: 1, viability: 100, replicationRate: 0, stress: 0, mutationIndicator: 0, environmentalTolerance: 70 };
    case 'ORG-006':
      return { population: 1000, viability: 30, replicationRate: 0.05, stress: 50, mutationIndicator: 20, environmentalTolerance: 95 };
    default:
      return null;
  }
}

export function createSimulation(
  organismId: string,
  environment: EnvironmentConditions,
  experimentId?: string,
  opts?: { seed?: number; variabilityEnabled?: boolean; conditionId?: string },
): Simulation {
  return {
    id: `SIM-${Date.now()}`,
    experimentId,
    organismId,
    status: 'idle',
    speed: 1,
    currentTick: 0,
    timeHours: 0,
    organismState: createInitialOrganismState(organismId),
    environment: { ...environment },
    events: [],
    snapshots: [],
    metadata: SIMULATION_METADATA,
    seed: opts?.seed ?? generateSeed(),
    variabilityEnabled: opts?.variabilityEnabled ?? false,
    conditionId: opts?.conditionId,
  };
}

/** Prototype rule: compute environmental stress factor (0 = ideal, 1 = lethal) */
function computeEnvironmentalStress(
  env: EnvironmentConditions,
  organismId: string,
): number {
  let stress = 0;

  const profile = getSimulationProfile(organismId);
  const optimalTemp = profile.optimalTemp;
  const tempDiff = Math.abs(env.temperature - optimalTemp);
  stress += Math.min(tempDiff / 20, 0.4);

  const optimalPh = profile.optimalPh;
  const phDiff = Math.abs(env.ph - optimalPh);
  stress += Math.min(phDiff / 4, 0.3);

  // Oxygen (for anaerobes vs aerobes simplified)
  if (organismId === 'ORG-001' && env.oxygen < 5) {
    stress += 0.1; // facultative, minor stress
  }

  // Nutrient availability
  if (env.nutrientAvailability < 30) {
    stress += (30 - env.nutrientAvailability) / 100;
  }

  // Salinity
  if (env.salinity > 20) {
    stress += Math.min((env.salinity - 20) / 80, 0.25);
  }

  // Radiation
  if (env.radiationExposure > 0) {
    stress += Math.min(env.radiationExposure / 10, 0.5);
  }

  return Math.min(stress, 1);
}

/** Single simulation tick — prototype deterministic rules */
export function simulationTick(sim: Simulation): Simulation {
  if (sim.status !== 'running') return sim;

  const dt = 0.25 * sim.speed; // hours per tick adjusted by speed
  const newTimeHours = sim.timeHours + dt;
  const newTick = sim.currentTick + 1;
  const env = { ...sim.environment, incubationTime: newTimeHours };
  const stress = computeEnvironmentalStress(env, sim.organismId);
  const prev = sim.organismState;

  // Replication rate modulated by stress and nutrients
  const nutrientFactor = env.nutrientAvailability / 100;
  const effectiveReplication =
    prev.replicationRate * (1 - stress * 0.8) * nutrientFactor;

  // Population change (logistic-style cap for education)
  const carryingCapacity = 1e9;
  const growthFactor = effectiveReplication * dt;
  const logisticModifier = 1 - prev.population / carryingCapacity;
  const populationDelta = prev.population * growthFactor * Math.max(logisticModifier, 0);
  const newPopulation = Math.max(0, prev.population + populationDelta);

  // Optional reproducible variability
  let viabilityNoise = 0;
  let replicationNoise = 1;
  if (sim.variabilityEnabled && sim.seed !== undefined) {
    viabilityNoise = seededRange(sim.seed, -0.5, 0.5, newTick);
    replicationNoise = seededRange(sim.seed, 0.95, 1.05, newTick + 1000);
  }

  // Viability decreases with stress
  const viabilityDelta = -stress * 2 * dt + (stress < 0.2 ? 0.5 * dt : 0) + viabilityNoise * dt;
  const newViability = clamp(prev.viability + viabilityDelta, 0, 100);

  // Stress accumulates or recovers
  const newStress = clamp(prev.stress + (stress - 0.2) * 10 * dt, 0, 100);

  // Mutation indicator rises with radiation and stress
  const mutationDelta =
    env.radiationExposure * 0.1 * dt + (newStress > 50 ? 0.05 * dt : 0);
  const newMutation = clamp(prev.mutationIndicator + mutationDelta, 0, 100);

  // Environmental tolerance adapts slowly
  const toleranceDelta = stress > 0.5 ? -0.2 * dt : 0.05 * dt;
  const newTolerance = clamp(prev.environmentalTolerance + toleranceDelta, 0, 100);

  const newState: OrganismSimulationState = {
    population: newPopulation,
    viability: newViability,
    replicationRate: effectiveReplication * replicationNoise,
    stress: newStress,
    mutationIndicator: newMutation,
    environmentalTolerance: newTolerance,
  };

  const events: SimulationEvent[] = [...sim.events];
  if (newTick === 1) {
    events.push({
      tick: newTick,
      timeHours: newTimeHours,
      message: 'Simulation started — prototype educational model active',
      type: 'info',
    });
  }
  if (stress > 0.5 && prev.stress <= 50 && newStress > 50) {
    events.push({
      tick: newTick,
      timeHours: newTimeHours,
      message: 'Elevated environmental stress detected (simulated)',
      type: 'warning',
    });
  }
  if (newViability < 50 && prev.viability >= 50) {
    events.push({
      tick: newTick,
      timeHours: newTimeHours,
      message: 'Viability dropped below 50% (simulated)',
      type: 'warning',
    });
  }
  if (newPopulation > prev.population * 2 && newTick > 4) {
    events.push({
      tick: newTick,
      timeHours: newTimeHours,
      message: 'Population doubled (simulated growth phase)',
      type: 'change',
    });
  }

  const snapshot: SimulationSnapshot = {
    tick: newTick,
    timeHours: newTimeHours,
    organismState: { ...newState },
    environment: { ...env },
  };

  const snapshots = [...sim.snapshots, snapshot];
  // Keep last 200 snapshots for performance
  const trimmedSnapshots = snapshots.length > 200 ? snapshots.slice(-200) : snapshots;

  return {
    ...sim,
    currentTick: newTick,
    timeHours: newTimeHours,
    environment: env,
    organismState: newState,
    events,
    snapshots: trimmedSnapshots,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function startSimulation(sim: Simulation): Simulation {
  return {
    ...sim,
    status: 'running',
    startedAt: sim.startedAt ?? new Date().toISOString(),
  };
}

export function pauseSimulation(sim: Simulation): Simulation {
  return { ...sim, status: 'paused' };
}

export function resumeSimulation(sim: Simulation): Simulation {
  return { ...sim, status: 'running' };
}

export function resetSimulation(sim: Simulation): Simulation {
  return {
    ...createSimulation(sim.organismId, sim.environment, sim.experimentId, {
      seed: sim.seed,
      variabilityEnabled: sim.variabilityEnabled,
      conditionId: sim.conditionId,
    }),
    id: sim.id,
    speed: sim.speed,
  };
}

export function setSimulationSpeed(sim: Simulation, speed: number): Simulation {
  return { ...sim, speed: clamp(speed, 0.25, 8) };
}

export function updateSimulationEnvironment(
  sim: Simulation,
  env: Partial<EnvironmentConditions>,
): Simulation {
  return {
    ...sim,
    environment: { ...sim.environment, ...env },
  };
}

export function formatPopulation(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}×10⁹`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}×10⁶`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}×10³`;
  return n.toFixed(0);
}
