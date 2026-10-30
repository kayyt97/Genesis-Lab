import { mkdir, writeFile } from 'node:fs/promises';
import { defaultEnvironment } from '../src/data/demoData';
import { runDualLungCancerStudies, formatDualLungCancerReport } from '../src/services/dualLungCancerStudies';

const baseSeed = 20261030;
const replicateCount = 30;
const ticks = 16;
const baseline = { ...defaultEnvironment, temperature: 37, ph: 7.4, oxygen: 21, carbonDioxide: 5 };
const scenarios = [
  { name: 'baseline', environment: baseline },
  { name: 'temperature-36C', environment: { ...baseline, temperature: 36 } },
  { name: 'temperature-38C', environment: { ...baseline, temperature: 38 } },
  { name: 'pH-7.2', environment: { ...baseline, ph: 7.2 } },
  { name: 'pH-7.6', environment: { ...baseline, ph: 7.6 } },
  { name: 'oxygen-18pct', environment: { ...baseline, oxygen: 18 } },
  { name: 'oxygen-24pct', environment: { ...baseline, oxygen: 24 } },
];

await mkdir('artifacts', { recursive: true });
const reports = scenarios.map(({ name, environment }) => ({
  scenario: name,
  report: runDualLungCancerStudies({ baseSeed, replicateCount, ticks, environment }),
}));
const combined = reports.map(({ scenario, report }) =>
  `ENVIRONMENT SCENARIO: ${scenario}\n${formatDualLungCancerReport(report)}`
).join('\n\n' + '='.repeat(80) + '\n\n');

await writeFile('artifacts/A549_30_replication_environment_reports.txt', combined);
await writeFile('artifacts/A549_30_replication_environment_reports.json', JSON.stringify({
  notice: 'Educational computer simulation only; not evidence of biological or clinical efficacy.',
  baseSeed, replicateCount, ticks,
  scenarios: reports,
}, null, 2));
console.log('Generated 7 environment scenarios, 30 paired replicates per study (420 paired study replicates total).');
