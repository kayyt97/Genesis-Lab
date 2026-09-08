import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { SimpleLineChart } from '../components/ui/Metric';
import { SimulationBadge, DataSourceTag } from '../components/ui/DisclaimerBanner';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { useAppState } from '../store/AppContext';
import { formatPopulation } from '../simulation/engine';

export function ResultsPage() {
  const { state } = useAppState();
  const [selectedId, setSelectedId] = useState(state.simulationResults[0]?.id ?? null);
  const result = state.simulationResults.find((r) => r.id === selectedId);
  const activeSim = state.activeSimulation;

  const liveViability =
    activeSim?.snapshots.map((s) => ({
      x: s.timeHours,
      y: s.organismState.viability,
    })) ?? [];

  const livePopulation =
    activeSim?.snapshots.map((s) => ({
      x: s.timeHours,
      y: s.organismState.population / 1e6,
    })) ?? [];

  return (
    <div className="results-page">
      <PageHeader
        title="Results"
        subtitle="Experiment outcomes, timelines, and comparisons"
        actions={<SimulationBadge />}
      />

      <AboutThisTool
        title="Understanding Results"
        whatIsThis="A viewer for saved and live educational simulation outcomes — summaries, timelines, events, and optional control comparisons."
        whyUseIt="Review how a modelled experiment progressed after running the Virtual Lab, and compare result sets side by side."
        whatCanILearn="How viability and population change over simulated time, and what events the educational model recorded."
        caveat="All charts and metrics are prototype educational models — not validated physical or clinical predictions."
      />

      <div className="results-layout">
        <Card title="Result Sets">
          <ul className="result-list">
            {state.simulationResults.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`result-item ${selectedId === r.id ? 'active' : ''}`}
                  aria-current={selectedId === r.id ? 'true' : undefined}
                  onClick={() => setSelectedId(r.id)}
                >
                  <span>{r.experimentId ?? r.id}</span>
                  <DataSourceTag type={r.metadata.sourceType} />
                </button>
              </li>
            ))}
            {activeSim && activeSim.snapshots.length > 0 && (
              <li>
                <button
                  type="button"
                  className={`result-item ${selectedId === 'live' ? 'active' : ''}`}
                  onClick={() => setSelectedId('live')}
                >
                  <span>Live Simulation</span>
                  <DataSourceTag type="simulation" />
                </button>
              </li>
            )}
          </ul>
        </Card>

        <div className="results-detail">
          {selectedId === 'live' && activeSim ? (
            <>
              <Card title="Live Simulation Results">
                <p>{activeSim.metadata.disclaimer}</p>
                <div className="metrics-grid">
                  <div className="metric">
                    <div className="metric-label">Population</div>
                    <div className="metric-value">{formatPopulation(activeSim.organismState.population)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Viability</div>
                    <div className="metric-value">{activeSim.organismState.viability.toFixed(1)}%</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Elapsed</div>
                    <div className="metric-value">{activeSim.timeHours.toFixed(1)} h</div>
                  </div>
                </div>
              </Card>
              <Card title="Timeline">
                <div className="charts-row">
                  <SimpleLineChart data={liveViability} label="Viability" color="#66bb6a" yUnit="%" />
                  <SimpleLineChart data={livePopulation} label="Population" color="#4fc3f7" yUnit="×10⁶" />
                </div>
              </Card>
              <Card title="Events">
                <ul className="events-list">
                  {activeSim.events.map((ev, i) => (
                    <li key={i} className={`event event-${ev.type}`}>
                      <span className="event-time">{ev.timeHours.toFixed(1)}h</span>
                      {ev.message}
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          ) : result ? (
            <>
              <Card title="Experiment Summary" badge={result.metadata.label}>
                <p>{result.summary}</p>
                <p className="disclaimer-text">{result.metadata.disclaimer}</p>
              </Card>

              {result.controlComparison && (
                <Card title="Control vs Experimental Comparison">
                  <p className="comparison-note text-muted">
                    Demonstration comparison — not statistically validated.
                  </p>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>{result.controlComparison.controlLabel}</th>
                        <th>{result.controlComparison.experimentalLabel}</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.controlComparison.metrics.map((m) => (
                        <tr key={m.name}>
                          <td>{m.name}</td>
                          <td>{typeof m.control === 'number' && m.control > 1e5 ? formatPopulation(m.control) : m.control}</td>
                          <td>{typeof m.experimental === 'number' && m.experimental > 1e5 ? formatPopulation(m.experimental) : m.experimental}</td>
                          <td>{m.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}

              <Card title="Final Outcome">
                <div className="metrics-grid">
                  <div className="metric">
                    <div className="metric-label">Final Viability</div>
                    <div className="metric-value">{result.finalState.viability}%</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Final Population</div>
                    <div className="metric-value">{formatPopulation(result.finalState.population)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Stress Index</div>
                    <div className="metric-value">{result.finalState.stress}</div>
                  </div>
                </div>
              </Card>

              <Card title="Simulation Events">
                <ul className="events-list">
                  {result.events.map((ev, i) => (
                    <li key={i} className={`event event-${ev.type}`}>
                      <span className="event-time">{ev.timeHours.toFixed(1)}h</span>
                      {ev.message}
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          ) : (
            <Card title="No Results Selected">
              <p className="text-muted">Select a result set or run a simulation in the Virtual Lab.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
