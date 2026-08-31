export function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner" role="note">
      <span className="disclaimer-icon">ℹ</span>
      <span>
        <strong>Educational Simulation</strong> — Genesis Lab produces simulated and
        educational results. These are not validated medical or clinical findings.
        Simulated data is clearly labelled throughout the application.
      </span>
    </div>
  );
}

export function SimulationBadge() {
  return (
    <span className="simulation-badge" title="Prototype educational model">
      SIMULATION / EDUCATIONAL MODEL
    </span>
  );
}

export function DataSourceTag({ type }: { type: string }) {
  const labels: Record<string, string> = {
    simulation: 'Simulated',
    educational: 'Educational',
    hypothesis: 'Hypothesis',
    'user-entered': 'User Data',
    'validated-evidence': 'Validated Evidence',
  };
  return <span className={`source-tag source-${type}`}>{labels[type] ?? type}</span>;
}
