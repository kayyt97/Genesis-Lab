import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { EQUIPMENT } from '../data/equipment';

export function EquipmentLabPage() {
  const [selectedId, setSelectedId] = useState(EQUIPMENT[0]?.id ?? '');
  const languageLevel = useLanguage();
  const eq = EQUIPMENT.find((e) => e.id === selectedId);

  return (
    <div className="equipment-page">
      <PageHeader
        title="Virtual Lab Equipment"
        subtitle="Conceptual instruments — simulated outputs, not real hardware"
        actions={<EvidenceBadge level="model-derived" />}
      />

      <div className="equipment-layout">
        <Card title="Instruments">
          <ul className="compound-list">
            {EQUIPMENT.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={`compound-item ${selectedId === e.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(e.id)}
                >
                  <span>{e.name}</span>
                  <span className="formula">{e.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {eq && (
          <Card title={eq.name} badge={eq.status}>
            <p>{resolveTiered(eq.description, languageLevel)}</p>
            <h4>Measures</h4>
            <ul>{eq.measures.map((m) => <li key={m}>{m}</li>)}</ul>
            {eq.id === 'EQ-PIP' && <PipettingHelper />}
            {eq.status === 'conceptual' && (
              <p className="text-muted future-tag">Interactive simulation for this instrument is planned in a future update.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function PipettingHelper() {
  const [c1, setC1] = useState(1);
  const [v1, setV1] = useState(100);
  const [c2, setC2] = useState(0.1);
  const v2 = (c1 * v1) / c2;

  return (
    <div className="pip-helper">
      <h4>Dilution calculator (C₁V₁ = C₂V₂)</h4>
      <label>C₁ (mol/L)<input type="number" step="0.01" value={c1} onChange={(e) => setC1(parseFloat(e.target.value))} /></label>
      <label>V₁ (µL)<input type="number" value={v1} onChange={(e) => setV1(parseFloat(e.target.value))} /></label>
      <label>C₂ (mol/L)<input type="number" step="0.01" value={c2} onChange={(e) => setC2(parseFloat(e.target.value))} /></label>
      <p>Required V₂: <strong>{v2.toFixed(1)} µL</strong> <EvidenceBadge level="model-derived" /></p>
    </div>
  );
}
