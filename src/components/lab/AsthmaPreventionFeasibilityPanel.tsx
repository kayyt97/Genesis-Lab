import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { downloadTextFile } from '../../services/exportService';

type Settings = {
  pathwayHypothesis: number;
  targetSelectivity: number;
  airwayAccess: number;
  defencePreservation: number;
  reversibility: number;
  offTargetBurden: number;
};

type Arm = { name: string; description: string; burden: number; safety: number };

const NOTICE = 'Synthetic in-silico teaching experiment only. No real vector is designed, built or tested. Scores are invented scenario indices, not biological measurements, treatment effects, or predicted asthma-attack prevention.';

const DEFAULTS: Settings = {
  pathwayHypothesis: 40,
  targetSelectivity: 70,
  airwayAccess: 55,
  defencePreservation: 85,
  reversibility: 80,
  offTargetBurden: 15,
};

const ARMS: Arm[] = [
  { name: 'A — Baseline', description: 'No delivery concept; reference airway-inflammatory state.', burden: 0, safety: 0 },
  { name: 'B — Sham control', description: 'Control for the idea of a delivery event without a pathway effect.', burden: 0, safety: 0 },
  { name: 'C — Non-targeting concept control', description: 'Conceptual delivery with no intended pathway modulation; tests whether assumed benefit is target-dependent.', burden: 0, safety: 1 },
  { name: 'D — Targeted concept scenario', description: 'Hypothetical modulation of one selected inflammatory signal, conditional on access and selectivity.', burden: 1, safety: 1 },
  { name: 'E — Safety-stress scenario', description: 'Same concept under increased off-target burden and reduced airway-defence preservation.', burden: 1, safety: 2 },
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function runScenario(settings: Settings) {
  const replicates = 100;
  const arms = ARMS.map((arm, armIndex) => {
    const values = Array.from({ length: replicates }, (_, i) => {
      const noise = (((i * 37 + armIndex * 19) % 17) - 8) / 20;
      const delivery = settings.airwayAccess / 100;
      const selectivity = settings.targetSelectivity / 100;
      const modulation = settings.pathwayHypothesis / 100;
      const defence = settings.defencePreservation / 100;
      const reversibility = settings.reversibility / 100;
      const offTarget = settings.offTargetBurden / 100;

      // Deliberately abstract bookkeeping: no molecular or physiological calibration.
      const hypotheticalSignalShift = arm.burden
        ? modulation * delivery * selectivity * 20
        : 0;
      const airwayDefenceRisk = arm.safety
        ? ((1 - defence) * 35 + offTarget * 30 + (1 - reversibility) * 15) * (arm.safety === 2 ? 1.35 : 1)
        : 0;
      const index = clamp(50 - hypotheticalSignalShift + airwayDefenceRisk + noise);
      return { index, shift: hypotheticalSignalShift, risk: airwayDefenceRisk };
    });
    const mean = values.reduce((sum, value) => sum + value.index, 0) / replicates;
    const meanShift = values.reduce((sum, value) => sum + value.shift, 0) / replicates;
    const meanRisk = values.reduce((sum, value) => sum + value.risk, 0) / replicates;
    return { ...arm, mean, meanShift, meanRisk, replicates };
  });
  return { arms, replicates };
}

function report(settings: Settings, result: ReturnType<typeof runScenario>) {
  return [
    'GENESIS LAB — ASTHMA IN-SILICO PREVENTION FEASIBILITY (C / V001)',
    NOTICE,
    '',
    'PURPOSE',
    'Explore whether a hypothetical airway-targeted change to inflammatory signalling could, in principle, alter an abstract pathway-pressure index while preserving airway defence.',
    '',
    'MODEL PARAMETERS (0–100 abstract assumptions; not biological units)',
    ...Object.entries(settings).map(([key, value]) => `- ${key}: ${value}`),
    '',
    'CONTROLLED EXPERIMENT ARMS',
    ...result.arms.map((arm) => [
      arm.name,
      arm.description,
      `Replicates: ${arm.replicates}`,
      `Synthetic pathway-pressure index: ${arm.mean.toFixed(2)}`,
      `Assumed signal-shift bookkeeping: ${arm.meanShift.toFixed(2)}`,
      `Assumed airway-defence risk bookkeeping: ${arm.meanRisk.toFixed(2)}`,
      '',
    ].join('\n')),
    'DESIGN AND INTERPRETATION',
    '- Same parameter settings and deterministic replicate noise are used across arms.',
    '- Baseline and sham are negative controls; non-targeting concept is a specificity control; targeted concept is the hypothesis arm; safety-stress is a robustness check.',
    '- The 100 replicates are repeated synthetic calculations, not independent biological samples.',
    '- The equations are invented for teaching and are not fitted to airway-cell, animal, clinical, or published efficacy data.',
    '- No result demonstrates asthma prevention, attack reduction, safety, delivery success, or therapeutic benefit.',
    '',
    'EXCLUDED FROM THIS MODEL',
    '- No vector class, capsid, sequence, promoter, construct, molecular architecture, dose, route, administration schedule or wet-lab protocol.',
    '- No patient phenotype assignment or personal clinical prediction.',
    '- No replacement for asthma action plans, prescribed preventer treatment or clinician review.',
    '',
    'NEXT REAL RESEARCH QUESTIONS',
    '- Which asthma endotype and airway cell population would be relevant, based on validated clinical and laboratory evidence?',
    '- Which biomarkers and functional readouts would distinguish pathway modulation from impaired host defence?',
    '- What evidence would be required for delivery specificity, reversibility, durability and long-term safety?',
  ].join('\n');
}

export function AsthmaPreventionFeasibilityPanel() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [result, setResult] = useState<ReturnType<typeof runScenario> | null>(null);
  const update = (key: keyof Settings, value: number) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setResult(null);
  };
  const parameters = useMemo(() => [
    { key: 'pathwayHypothesis' as const, label: 'Hypothetical pathway modulation', help: 'How strongly the teaching model assumes the selected inflammatory signal is changed.' },
    { key: 'targetSelectivity' as const, label: 'Target selectivity assumption', help: 'How selectively the hypothetical concept reaches the intended cell population.' },
    { key: 'airwayAccess' as const, label: 'Airway access assumption', help: 'Abstract allowance for mucus, clearance and epithelial-barrier obstacles.' },
    { key: 'defencePreservation' as const, label: 'Normal airway-defence preservation', help: 'Higher values represent an assumption that protective airway functions remain intact.' },
    { key: 'reversibility' as const, label: 'Reversibility assumption', help: 'Higher values represent an assumption that an unwanted effect could be reversed.' },
    { key: 'offTargetBurden' as const, label: 'Off-target burden assumption', help: 'Higher values represent more unintended effects in the hypothetical scenario.' },
  ], []);

  return (
    <section className="mi-candidate-panel" aria-label="Asthma prevention feasibility experiment">
      <header className="mi-candidate-header">
        <p className="mi-edu-banner">{NOTICE}</p>
        <h3>ASTHMA — Prevention feasibility experiment (C / V001)</h3>
        <p className="text-muted">A controlled comparison of an abstract airway-targeted therapeutic concept. It tests the logic of the hypothesis and its safety trade-offs, not a real treatment or vector.</p>
      </header>

      <h4>Experimental parameters</h4>
      <p className="text-muted">Adjust the hypothetical assumptions below. These are not doses, delivery settings or biological measurements.</p>
      <div className="env-controls-grid">
        {parameters.map((parameter) => (
          <div className="env-control" key={parameter.key}>
            <label>
              <span className="env-label-row">{parameter.label}</span>
              <span className="env-value">{settings[parameter.key]} / 100</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings[parameter.key]}
              onChange={(event) => update(parameter.key, Number(event.target.value))}
              aria-label={parameter.label}
            />
            <p className="text-muted">{parameter.help}</p>
          </div>
        ))}
      </div>

      <div className="mi-actions">
        <Button onClick={() => setResult(runScenario(settings))}>Run 100-replicate controlled sweep</Button>
        <Button variant="secondary" onClick={() => { setSettings(DEFAULTS); setResult(null); }}>Reset assumptions</Button>
        <Button variant="secondary" disabled={!result} onClick={() => result && downloadTextFile('GenesisLab_Asthma_Prevention_Feasibility_C_V001.txt', report(settings, result), 'text/plain')}>Export experiment report (TXT)</Button>
      </div>

      <h4>Controls and comparison groups</h4>
      <div className="table-scroll">
        <table className="tumour-report-table">
          <thead><tr><th>Arm</th><th>Purpose</th></tr></thead>
          <tbody>{ARMS.map((arm) => <tr key={arm.name}><th>{arm.name}</th><td>{arm.description}</td></tr>)}</tbody>
        </table>
      </div>

      {result && (
        <>
          <p className="mi-feedback" role="status">Sweep complete: {result.arms.length} arms × {result.replicates} synthetic replicates = {result.arms.length * result.replicates} calculations. These are illustrative model outputs only.</p>
          <h4>Illustrative scenario readout</h4>
          <div className="table-scroll">
            <table className="tumour-report-table">
              <thead><tr><th>Arm</th><th>Pathway-pressure index*</th><th>Assumed signal shift*</th><th>Airway-defence risk index*</th></tr></thead>
              <tbody>{result.arms.map((arm) => <tr key={arm.name}><th>{arm.name}</th><td>{arm.mean.toFixed(2)}</td><td>{arm.meanShift.toFixed(2)}</td><td>{arm.meanRisk.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="text-muted">*Invented dimensionless teaching indices. Lower pathway-pressure index is not a prediction of fewer asthma attacks. A favourable-looking scenario cannot establish efficacy or safety.</p>
        </>
      )}

      <h4>Pre-specified interpretation checks</h4>
      <ul>
        <li><strong>Specificity:</strong> the targeted concept should differ from the non-targeting control only because of the explicitly stated hypothetical pathway assumption.</li>
        <li><strong>Safety:</strong> any apparent pathway benefit must be considered alongside off-target burden and preservation of normal airway defence.</li>
        <li><strong>Robustness:</strong> vary access and selectivity assumptions; do not cherry-pick one favourable setting.</li>
        <li><strong>Generalisability:</strong> type-2-high, type-2-low/neutrophilic and mixed asthma patterns must not be treated as interchangeable.</li>
        <li><strong>Evidence gap:</strong> real prevention would require validated preclinical and clinical evidence, not this synthetic model.</li>
      </ul>
    </section>
  );
}
