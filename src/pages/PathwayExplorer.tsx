import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { CURATED_PATHWAYS } from '../data/pathways';

export function PathwayExplorerPage() {
  const [pathwayId, setPathwayId] = useState(CURATED_PATHWAYS[0]?.id ?? '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const languageLevel = useLanguage();
  const navigate = useNavigate();

  const pathway = CURATED_PATHWAYS.find((p) => p.id === pathwayId);
  const node = pathway?.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="pathway-page">
      <PageHeader
        title="Pathway & Interaction Explorer"
        subtitle="Gene → RNA → Protein → Pathway → Cell → Phenotype"
        actions={<EvidenceBadge level="reference-data" />}
      />

      <div className="pathway-select">
        {CURATED_PATHWAYS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`category-tab ${pathwayId === p.id ? 'active' : ''}`}
            onClick={() => { setPathwayId(p.id); setSelectedNodeId(null); }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {pathway && (
        <div className="pathway-layout">
          <Card title={pathway.name}>
            <p>{resolveTiered(pathway.description, languageLevel)}</p>
            <div className="pathway-flow">
              {pathway.nodes.map((n, i) => (
                <div key={n.id} className="pathway-flow-item">
                  <button
                    type="button"
                    className={`pathway-node pathway-node-${n.type} ${selectedNodeId === n.id ? 'active' : ''}`}
                    onClick={() => setSelectedNodeId(n.id)}
                  >
                    <span className="node-type">{n.type}</span>
                    {n.label}
                  </button>
                  {i < pathway.nodes.length - 1 && <span className="pathway-arrow">↓</span>}
                </div>
              ))}
            </div>
          </Card>

          {node ? (
            <Card title={node.label} badge={node.type}>
              <p>{resolveTiered(node.description, languageLevel)}</p>
              <div className="pathway-links">
                {node.linkedGeneId && (
                  <Button variant="ghost" onClick={() => navigate('/genome-explorer')}>
                    Open in Genome Explorer
                  </Button>
                )}
                {node.linkedMoleculeId && (
                  <Button variant="ghost" onClick={() => navigate('/molecule-explorer')}>
                    Open in Molecule Explorer
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate('/virtual-lab')}>
                  Send context to Virtual Lab
                </Button>
              </div>
            </Card>
          ) : (
            <Card title="Select a node"><p className="text-muted">Click a pathway node to inspect it.</p></Card>
          )}
        </div>
      )}
    </div>
  );
}
