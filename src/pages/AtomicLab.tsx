import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { ParameterHelp } from '../components/ui/GlossaryTerm';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { ELEMENTS, buildAtom, ATOMIC_LAB_LIMITATIONS } from '../data/elements';
import type { AtomModel } from '../types/scientific';

const SUPPORTED_BONDS: Record<string, string[]> = {
  H: ['O', 'C', 'N'],
  O: ['H', 'C'],
  C: ['H', 'O', 'N', 'C'],
  N: ['H', 'C'],
  Na: ['Cl'],
  Cl: ['Na'],
};

export function AtomicLabPage() {
  const languageLevel = useLanguage();
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState('C');
  const [neutrons, setNeutrons] = useState(6);
  const [charge, setCharge] = useState(0);
  const [atoms, setAtoms] = useState<AtomModel[]>([]);
  const [bondLog, setBondLog] = useState<string[]>([]);

  const element = ELEMENTS.find((e) => e.symbol === selectedSymbol)!;

  const currentAtom = useMemo(
    () => buildAtom(element, { neutrons, charge }),
    [element, neutrons, charge],
  );

  const addAtom = () => setAtoms((a) => [...a, { ...currentAtom, id: `AT-${a.length}` }]);

  const tryBond = () => {
    if (atoms.length < 2) {
      setBondLog((l) => [...l, 'Need at least two atoms to explore bonding.']);
      return;
    }
    const a = atoms[atoms.length - 2];
    const b = atoms[atoms.length - 1];
    const compatible =
      SUPPORTED_BONDS[a.symbol]?.includes(b.symbol) ||
      SUPPORTED_BONDS[b.symbol]?.includes(a.symbol);
    if (compatible) {
      setBondLog((l) => [
        ...l,
        `Educational bond formed between ${a.symbol} and ${b.symbol} (simplified model).`,
      ]);
    } else {
      setBondLog((l) => [
        ...l,
        `No supported bond rule for ${a.symbol}–${b.symbol} in this teaching model.`,
      ]);
    }
  };

  const massNumber = currentAtom.protons + currentAtom.neutrons;

  return (
    <div className="atomic-lab-page">
      <PageHeader
        title="Atomic Lab"
        subtitle="Educational atomic and bonding exploration"
        actions={<EvidenceBadge level="model-derived" />}
      />

      <Card title="Model Limitations" className="limitations-card">
        <p>{resolveTiered(ATOMIC_LAB_LIMITATIONS, languageLevel)}</p>
      </Card>

      <div className="atomic-layout">
        <Card title="Periodic Table (Starter Set)">
          <div className="element-grid">
            {ELEMENTS.map((el) => (
              <button
                key={el.symbol}
                type="button"
                className={`element-btn ${selectedSymbol === el.symbol ? 'active' : ''}`}
                onClick={() => {
                  setSelectedSymbol(el.symbol);
                  setNeutrons(el.defaultNeutrons);
                  setCharge(0);
                }}
              >
                <span className="el-symbol">{el.symbol}</span>
                <span className="el-num">{el.atomicNumber}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Atom Builder">
          <div className="atom-visual">
            <div className="atom-diagram">
              <div className="nucleus">+{currentAtom.protons}p {currentAtom.neutrons}n</div>
              <div className="electron-shell">{currentAtom.electrons}e⁻</div>
            </div>
          </div>
          <dl className="detail-dl">
            <dt>Element</dt><dd>{element.name} ({element.symbol})</dd>
            <dt>Atomic number</dt><dd>{currentAtom.atomicNumber}</dd>
            <dt>Mass number</dt><dd>{massNumber}</dd>
            <dt>Charge</dt><dd>{charge > 0 ? `+${charge}` : charge}</dd>
            <dt>Electrons</dt><dd>{currentAtom.electrons}</dd>
            <dt>Energy state</dt><dd>{currentAtom.energyState}</dd>
          </dl>
          <div className="form-section">
            <label>
              <ParameterHelp label="Neutrons" help={{
                simple: 'Neutrons — particles in the atom nucleus with no charge. Changing them makes an isotope.',
                standard: 'Neutron count defines the isotope and mass number.',
                technical: 'Neutron number (N) with proton number (Z) determines nuclide identity.',
              }} /> {neutrons}
              <input type="range" min={0} max={30} value={neutrons} onChange={(e) => setNeutrons(parseInt(e.target.value, 10))} />
            </label>
            <label>
              <ParameterHelp label="Ionic charge" help={{
                simple: 'Charge — positive means the atom lost electrons; negative means it gained electrons.',
                standard: 'Formal ionic charge from electron gain or loss.',
                technical: 'Net charge q = Z - e; affects ionic bonding eligibility in prototype rules.',
              }} /> {charge}
              <input type="range" min={-3} max={3} value={charge} onChange={(e) => setCharge(parseInt(e.target.value, 10))} />
            </label>
          </div>
          <Button onClick={addAtom}>Add atom to workspace</Button>
        </Card>

        <Card title="Bonding Explorer" className="span-2">
          <p className="text-muted">Explore simplified bond compatibility rules between added atoms.</p>
          <Button variant="secondary" onClick={tryBond}>Test bond (last two atoms)</Button>
          <ul className="bond-log">
            {bondLog.slice(-5).map((m, i) => <li key={i}>{m}</li>)}
          </ul>
          <p className="text-muted">Atoms in workspace: {atoms.map((a) => a.symbol).join(', ') || 'none'}</p>
        </Card>
      </div>

      <Card title="Next Steps">
        <Button variant="secondary" onClick={() => navigate('/molecule-explorer')}>
          Open Molecule Explorer →
        </Button>
      </Card>
    </div>
  );
}
