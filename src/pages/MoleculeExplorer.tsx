import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { CURATED_MOLECULES, renderMolecule2dSvg } from '../data/molecules';
import { sendToVirtualLab, useAppState } from '../store/AppContext';

export function MoleculeExplorerPage() {
  const [selectedId, setSelectedId] = useState(CURATED_MOLECULES[0]?.id ?? '');
  const languageLevel = useLanguage();
  const navigate = useNavigate();
  const { dispatch } = useAppState();
  const molecule = CURATED_MOLECULES.find((m) => m.id === selectedId);

  const handleSendToLab = () => {
    if (!molecule) return;
    sendToVirtualLab(dispatch, molecule.id, molecule.name, 'molecule');
    navigate('/virtual-lab');
  };

  return (
    <div className="molecule-explorer-page">
      <PageHeader
        title="Molecule Explorer"
        subtitle="2D molecular structures connected to Atomic Lab and Virtual Lab"
        actions={<EvidenceBadge level="reference-data" />}
      />

      <div className="molecular-layout">
        <Card title="Supported Molecules">
          <ul className="compound-list">
            {CURATED_MOLECULES.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`compound-item ${selectedId === m.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(m.id)}
                >
                  <span>{m.name}</span>
                  <span className="formula">{m.formula}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {molecule && (
          <Card title={molecule.name} badge={molecule.formula}>
            <div
              className="mol-2d-view"
              dangerouslySetInnerHTML={{ __html: renderMolecule2dSvg(molecule) }}
            />
            <dl className="detail-dl">
              <dt>Molecular mass</dt><dd>{molecule.molecularMass} g/mol</dd>
              <dt>Charge</dt><dd>{molecule.charge}</dd>
              <dt>Functional groups</dt><dd>{molecule.functionalGroups.join(', ')}</dd>
              <dt>Biological role</dt>
              <dd>{resolveTiered(molecule.biologicalRole!, languageLevel)}</dd>
            </dl>
            <div className="handoff-actions">
              <Button onClick={handleSendToLab}>Send to Virtual Lab</Button>
              <Button variant="secondary" onClick={() => navigate('/atomic-lab')}>
                Open Atomic Lab
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
