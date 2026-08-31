import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { demoCompounds } from '../data/demoData';

export function MolecularLibraryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(demoCompounds[0]?.id ?? null);
  const selected = demoCompounds.find((c) => c.id === selectedId);

  return (
    <div className="molecular-page">
      <PageHeader
        title="Molecular Library"
        subtitle="Compounds and molecular reference data for scientific modelling"
      />

      <Card title="Connected Modules" className="connected-modules">
        <p className="text-muted">Explore atoms and molecules in dedicated modules:</p>
        <div className="handoff-actions">
          <Link to="/atomic-lab"><Button variant="secondary">Open Atomic Lab</Button></Link>
          <Link to="/molecule-explorer"><Button variant="secondary">Open Molecule Explorer</Button></Link>
        </div>
      </Card>

      <div className="molecular-layout">
        <Card title="Compounds">
          <ul className="compound-list">
            {demoCompounds.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`compound-item ${selectedId === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <span>{c.name}</span>
                  <span className="formula">{c.formula}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {selected && (
          <Card title={selected.name} badge={selected.category}>
            <dl className="detail-dl">
              <dt>Formula</dt><dd>{selected.formula}</dd>
              <dt>
                <GlossaryTerm term="molecule">Molecular Mass</GlossaryTerm>
              </dt>
              <dd>{selected.molecularMass > 0 ? `${selected.molecularMass} ${selected.massUnit}` : 'N/A'}</dd>
              <dt>Category</dt><dd>{selected.category}</dd>
              <dt>Description</dt><dd>{selected.description}</dd>
              <dt>Known Interactions</dt>
              <dd><ul>{selected.knownInteractions.map((i, n) => <li key={n}>{i}</li>)}</ul></dd>
              <dt>Experimental Notes</dt><dd>{selected.experimentalNotes}</dd>
              <dt>References</dt><dd>{selected.references.join('; ')}</dd>
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}
