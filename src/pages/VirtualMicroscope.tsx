import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { SimulationBadge } from '../components/ui/DisclaimerBanner';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import type { MicroscopeMagnification } from '../types/scientific';

const MAGS: MicroscopeMagnification[] = [40, 100, 400, 1000];

const STRUCTURES = [
  { id: 'cell', label: 'Cell', simple: 'A single living unit.', standard: 'Individual cell in culture.', technical: 'Eukaryotic or prokaryotic unit cell.' },
  { id: 'membrane', label: 'Cell membrane', simple: 'Outer boundary of the cell.', standard: 'Phospholipid bilayer envelope.', technical: 'Plasma membrane regulating transport.' },
  { id: 'nucleus', label: 'Nucleus', simple: 'Control centre holding DNA.', standard: 'Membrane-bound organelle with genetic material.', technical: 'Nuclear compartment (eukaryotes).' },
];

export function VirtualMicroscopePage() {
  const { state } = useAppState();
  const languageLevel = useLanguage();
  const [mag, setMag] = useState<MicroscopeMagnification>(400);
  const [selected, setSelected] = useState<string | null>(null);

  const viability = state.activeSimulation?.organismState.viability ?? 85;
  const scale = mag / 400;

  return (
    <div className="microscope-page">
      <PageHeader
        title="Virtual Microscope"
        subtitle="Simulated microscopy visualisation — not real imagery"
        actions={<SimulationBadge />}
      />

      <Card title="Magnification">
        <div className="mag-buttons">
          {MAGS.map((m) => (
            <button key={m} type="button" className={`mag-btn ${mag === m ? 'active' : ''}`} onClick={() => setMag(m)}>
              {m}×
            </button>
          ))}
        </div>
      </Card>

      <Card title="Simulated Field of View">
        <div className="microscope-view" style={{ transform: `scale(${scale})` }}>
          <div className="microscope-cell" style={{ opacity: viability / 100 }}>
            {STRUCTURES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`microscope-structure microscope-${s.id} ${selected === s.id ? 'active' : ''}`}
                onClick={() => setSelected(s.id)}
              />
            ))}
          </div>
        </div>
        <p className="text-muted">Simulated imagery derived from active simulation state (viability {viability.toFixed(0)}%).</p>
      </Card>

      {selected && (
        <Card title={STRUCTURES.find((s) => s.id === selected)?.label ?? 'Structure'}>
          <p>{resolveTiered({
            simple: STRUCTURES.find((s) => s.id === selected)!.simple,
            standard: STRUCTURES.find((s) => s.id === selected)!.standard,
            technical: STRUCTURES.find((s) => s.id === selected)!.technical,
          }, languageLevel)}</p>
        </Card>
      )}
    </div>
  );
}
