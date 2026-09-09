import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { ParameterHelp, GlossaryTerm } from '../components/ui/GlossaryTerm';
import { ExplainThis } from '../components/ui/ExplainThis';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { EXPLAIN } from '../content/explainers';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { buildAtom, ATOMIC_LAB_LIMITATIONS } from '../data/elements';
import { PERIODIC_TABLE, getTablePosition, type FullElementDef } from '../data/periodicTable';
import { evaluateIsotope, getIsotopesForElement, hasStableIsotopes } from '../data/isotopes';
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
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [workspaceFeedback, setWorkspaceFeedback] = useState<string | null>(null);
  const [bondLog, setBondLog] = useState<string[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [showIsotopeTable, setShowIsotopeTable] = useState(false);

  const element = PERIODIC_TABLE.find((e) => e.symbol === selectedSymbol)!;

  const isotopeEval = useMemo(
    () => evaluateIsotope(selectedSymbol, neutrons),
    [selectedSymbol, neutrons],
  );

  const elementIsotopes = useMemo(() => getIsotopesForElement(selectedSymbol), [selectedSymbol]);

  const currentAtom = useMemo(
    () => buildAtom(element, { neutrons, charge }),
    [element, neutrons, charge],
  );

  const filteredElements = useMemo(() => {
    if (filterClass === 'all') return PERIODIC_TABLE;
    if (filterClass === 'radioactive') return PERIODIC_TABLE.filter((e) => e.radioactive);
    return PERIODIC_TABLE.filter((e) => e.classification.includes(filterClass));
  }, [filterClass]);

  const addAtom = () => {
    const id = `AT-${Date.now().toString(36)}-${atoms.length}`;
    const next = { ...currentAtom, id };
    setAtoms((a) => [...a, next]);
    setSelectedAtomId(id);
    setWorkspaceFeedback(`Added ${currentAtom.symbol} (mass ${massNumber}${charge !== 0 ? `, charge ${charge > 0 ? '+' : ''}${charge}` : ''}) to workspace.`);
  };

  const removeSelectedAtom = () => {
    if (!selectedAtomId) {
      setWorkspaceFeedback('Select an atom in the workspace list first, then remove it.');
      return;
    }
    setAtoms((a) => a.filter((atom) => atom.id !== selectedAtomId));
    setWorkspaceFeedback(`Removed atom ${selectedAtomId} from workspace.`);
    setSelectedAtomId(null);
  };

  const clearWorkspace = () => {
    setAtoms([]);
    setSelectedAtomId(null);
    setBondLog([]);
    setWorkspaceFeedback('Workspace cleared.');
  };

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

  const selectElement = (el: FullElementDef) => {
    setSelectedSymbol(el.symbol);
    setNeutrons(el.defaultNeutrons);
    setCharge(0);
  };

  const massNumber = currentAtom.protons + currentAtom.neutrons;

  return (
    <div className="atomic-lab-page">
      <PageHeader
        title="Atomic Lab"
        subtitle="Interactive periodic table — all 118 elements"
        actions={<EvidenceBadge level="model-derived" />}
      />

      <AboutThisTool
        title="Understanding Atomic Lab"
        whatIsThis="An educational periodic-table workspace for exploring elements, isotopes, charge, and simplified bonding rules between atoms you add to a teaching workspace."
        whyUseIt="Practise atomic vocabulary and basic bonding ideas before linking chemistry concepts to molecules elsewhere in Genesis Lab."
        whatCanILearn="How proton/neutron/electron counts relate to mass number and charge, and which element pairs this teaching model treats as bond-compatible."
        caveat="Atomic Lab is a simulated educational environment — it does not perform real laboratory measurements, spectroscopy, or quantum chemistry calculations."
      />

      <Card title="Model Limitations" className="limitations-card">
        <p>{resolveTiered(ATOMIC_LAB_LIMITATIONS, languageLevel)}</p>
      </Card>

      <div className="atomic-layout">
        <Card title="Periodic Table (118 Elements)" className="span-2">
          <div className="periodic-filters">
            {['all', 'nonmetal', 'metal', 'transition metal', 'noble gas', 'halogen', 'radioactive'].map((f) => (
              <button key={f} type="button" className={`filter-btn ${filterClass === f ? 'active' : ''}`} onClick={() => setFilterClass(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="periodic-table-grid">
            {filteredElements.map((el) => {
              const pos = getTablePosition(el);
              return (
                <button
                  key={el.symbol}
                  type="button"
                  className={`element-btn periodic-cell ${selectedSymbol === el.symbol ? 'active' : ''} ${el.radioactive ? 'radioactive' : ''} cls-${el.classification.replace(/\s+/g, '-')}`}
                  style={{ gridRow: pos.row, gridColumn: pos.col }}
                  onClick={() => selectElement(el)}
                  title={`${el.name} — ${el.classification}`}
                >
                  <span className="el-num">{el.atomicNumber}</span>
                  <span className="el-symbol">{el.symbol}</span>
                  <span className="el-mass">{el.atomicMass.toFixed(el.atomicMass < 10 ? 3 : 1)}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Element Details">
          <dl className="detail-dl">
            <dt>Element</dt><dd>{element.name} ({element.symbol})</dd>
            <dt>Atomic number</dt><dd>{element.atomicNumber}</dd>
            <dt>Atomic mass</dt><dd>{element.atomicMass} u</dd>
            <dt>Group</dt><dd>{element.group}</dd>
            <dt>Period</dt><dd>{element.period}</dd>
            <dt>Classification</dt><dd>{element.classification}</dd>
            <dt><GlossaryTerm term="electron-configuration">Electron configuration</GlossaryTerm></dt><dd>{element.electronConfig} (simplified reference)</dd>
            <dt>Stable isotopes known</dt>
            <dd>{hasStableIsotopes(element.symbol) ? 'Yes — see isotope table' : 'No stable isotopes of this element are known.'}</dd>
          </dl>
          <Button variant="secondary" onClick={() => setShowIsotopeTable(!showIsotopeTable)}>
            {showIsotopeTable ? 'Hide isotope table' : 'View isotope table'}
          </Button>
          {showIsotopeTable && (
            <table className="isotope-table">
              <thead>
                <tr><th>Isotope</th><th>Stable</th><th>Half-life</th><th>Decay</th><th>Daughter</th></tr>
              </thead>
              <tbody>
                {elementIsotopes.length === 0 && (
                  <tr><td colSpan={5}>No curated isotopes — use Atom Builder to evaluate a neutron count.</td></tr>
                )}
                {elementIsotopes.map((iso) => (
                  <tr key={iso.name}>
                    <td>{iso.name}</td>
                    <td>{iso.stable ? 'Stable' : 'Unstable'}</td>
                    <td>{iso.halfLife ?? '—'}</td>
                    <td>{iso.decayMode ?? '—'}</td>
                    <td>{iso.daughterNuclide ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Button variant="secondary" onClick={() => navigate(`/molecule-explorer?element=${selectedSymbol}`)}>
            View compounds containing {selectedSymbol}
          </Button>
        </Card>

        <Card title="Selected isotope (Atom Builder)">
          <dl className="detail-dl">
            <dt>Isotope</dt><dd>{isotopeEval.name}</dd>
            <dt>Protons</dt><dd>{isotopeEval.protons}</dd>
            <dt>Neutrons</dt><dd>{isotopeEval.neutrons}</dd>
            <dt>Mass number</dt><dd>{isotopeEval.massNumber}</dd>
            <dt>Stability</dt><dd>{isotopeEval.stable ? 'STABLE' : 'UNSTABLE'}</dd>
            <dt>Radioactive</dt><dd>{isotopeEval.radioactive ? 'Yes' : 'No'}</dd>
            {isotopeEval.halfLife && <dt><GlossaryTerm term="half-life">Half-life</GlossaryTerm></dt>}
            {isotopeEval.halfLife && <dd>{isotopeEval.halfLife}</dd>}
            {isotopeEval.decayMode && <dt><GlossaryTerm term="decay-mode">Primary decay mode</GlossaryTerm></dt>}
            {isotopeEval.decayMode && <dd>{isotopeEval.decayMode}</dd>}
            {isotopeEval.daughterNuclide && <dt><GlossaryTerm term="daughter-nuclide">Daughter nuclide</GlossaryTerm></dt>}
            {isotopeEval.daughterNuclide && <dd>{isotopeEval.daughterNuclide}</dd>}
          </dl>
          <p className="text-muted">{isotopeEval.stabilityExplanation}</p>
          {isotopeEval.notes && <p className="text-muted warn-text">{isotopeEval.notes}</p>}
          {!isotopeEval.radioactive && (
            <p className="text-muted">Educational reference only — radioactive materials are not inherently explosive; decay releases energy gradually according to half-life.</p>
          )}
        </Card>

        <Card title="Atom Builder">
          <div className="atom-visual">
            <div className="atom-diagram">
              <div className="nucleus">+{currentAtom.protons}p {currentAtom.neutrons}n</div>
              <div className="electron-shell">{currentAtom.electrons}e⁻</div>
            </div>
          </div>
          <dl className="detail-dl">
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
              <input type="range" min={0} max={Math.max(30, element.defaultNeutrons + 20)} value={neutrons} onChange={(e) => setNeutrons(parseInt(e.target.value, 10))} />
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
          {workspaceFeedback && <p className="success-text action-feedback" role="status">{workspaceFeedback}</p>}
        </Card>

        <Card title="Bonding Explorer" className="span-2">
          <p className="text-muted">
            Explore simplified bond compatibility rules between added atoms.{' '}
            <ExplainThis title="Atomic workspace" content={EXPLAIN.atomWorkspace} />
          </p>
          <div className="workspace-atom-list">
            {atoms.length === 0 ? (
              <p className="text-muted">No atoms yet — add one above.</p>
            ) : (
              <ul className="atom-chip-list">
                {atoms.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={`atom-chip ${selectedAtomId === a.id ? 'active' : ''}`}
                      onClick={() => setSelectedAtomId(a.id)}
                      aria-pressed={selectedAtomId === a.id}
                    >
                      {a.symbol}
                      <span className="atom-chip-meta">Z={a.protons} N={a.neutrons}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="sim-controls">
            <Button variant="secondary" onClick={tryBond} disabled={atoms.length < 2}>Test bond (last two atoms)</Button>
            <Button variant="secondary" onClick={removeSelectedAtom} disabled={!selectedAtomId}>Remove selected</Button>
            <Button variant="secondary" onClick={clearWorkspace} disabled={atoms.length === 0}>Clear workspace</Button>
          </div>
          <ul className="bond-log">
            {bondLog.slice(-5).map((m, i) => <li key={i}>{m}</li>)}
          </ul>
          <p className="text-muted">Atoms in workspace: {atoms.length} — {atoms.map((a) => a.symbol).join(', ') || 'none'}</p>
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
