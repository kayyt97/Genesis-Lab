import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { CURATED_PATHWAYS } from '../data/pathways';
import { searchPathwayExplorer, getPathwaysForGene } from '../services/pathwaySearch';
import { REFERENCE_GENES } from '../data/genes';

export function PathwayExplorerPage() {
  const [pathwayId, setPathwayId] = useState(CURATED_PATHWAYS[0]?.id ?? '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const languageLevel = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const searchResults = useMemo(
    () => (searchQuery.trim() ? searchPathwayExplorer(searchQuery) : []),
    [searchQuery],
  );

  useEffect(() => {
    const geneParam = searchParams.get('gene');
    if (geneParam) {
      setSearchQuery(geneParam);
      const results = searchPathwayExplorer(geneParam);
      const geneResult = results.find((r) => r.type === 'gene');
      if (geneResult?.gene) {
        const pathways = getPathwaysForGene(geneResult.gene.id);
        if (pathways.length > 0) {
          setPathwayId(pathways[0].id);
        }
      }
    }
  }, [searchParams]);

  const pathway = CURATED_PATHWAYS.find((p) => p.id === pathwayId);
  const node = pathway?.nodes.find((n) => n.id === selectedNodeId);

  const handleSearchSelect = (result: ReturnType<typeof searchPathwayExplorer>[0]) => {
    if (result.type === 'pathway' && result.pathway) {
      setPathwayId(result.pathway.id);
      setSelectedNodeId(null);
    } else if (result.type === 'gene' && result.gene) {
      const pathways = getPathwaysForGene(result.gene.id);
      if (pathways.length > 0) {
        setPathwayId(pathways[0].id);
        const geneNode = pathways[0].nodes.find((n) => n.linkedGeneId === result.gene!.id);
        if (geneNode) setSelectedNodeId(geneNode.id);
      } else {
        setSearchQuery(result.label);
      }
    }
    setSearchQuery('');
  };

  const toggleBranch = (nodeId: string) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const relatedPathways = useMemo(() => {
    if (!node?.linkedGeneId) return [];
    return getPathwaysForGene(node.linkedGeneId);
  }, [node]);

  return (
    <div className="pathway-page">
      <PageHeader
        title="Pathway & Interaction Explorer"
        subtitle="Gene → RNA → Protein → Pathway → Cell → Phenotype"
        actions={<EvidenceBadge level="reference-data" />}
      />

      <Card title="Search">
        <input
          type="search"
          className="search-input"
          placeholder="Search gene, protein, pathway, or process (e.g. HTT, BRCA1, DNA repair)…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <button type="button" className="search-result-btn" onClick={() => handleSearchSelect(r)}>
                  <span className="search-result-type">{r.type}</span> {r.label} — {r.description}
                </button>
              </li>
            ))}
          </ul>
        )}
        {searchQuery.trim() && searchResults.length === 0 && (
          <p className="text-muted">
            No matching reference data found. Pathway data is limited to curated reference entries — fictional interactions are not generated.
          </p>
        )}
      </Card>

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
            <EvidenceBadge level="reference-data" note="Curated reference pathway" />
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
                  {expandedBranches.has(n.id) && (
                    <div className="pathway-branch">
                      <p className="text-muted">{resolveTiered(n.description, languageLevel)}</p>
                      {n.linkedGeneId && (
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/genome-explorer`)}>
                          Open gene in Genome Explorer
                        </Button>
                      )}
                    </div>
                  )}
                  <button type="button" className="branch-toggle" onClick={() => toggleBranch(n.id)}>
                    {expandedBranches.has(n.id) ? '−' : '+'}
                  </button>
                  {i < pathway.nodes.length - 1 && <span className="pathway-arrow">↓</span>}
                </div>
              ))}
            </div>
          </Card>

          {node ? (
            <Card title={node.label} badge={node.type}>
              <p>{resolveTiered(node.description, languageLevel)}</p>
              <EvidenceBadge level="reference-data" />
              {relatedPathways.length > 1 && (
                <>
                  <h4>Related pathways</h4>
                  <ul>
                    {relatedPathways.filter((p) => p.id !== pathwayId).map((p) => (
                      <li key={p.id}>
                        <button type="button" className="link-btn" onClick={() => setPathwayId(p.id)}>{p.name}</button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="pathway-links">
                {node.linkedGeneId && (
                  <Button variant="ghost" onClick={() => {
                    const gene = REFERENCE_GENES.find((g) => g.id === node.linkedGeneId);
                    navigate(gene ? `/genome-explorer` : '/genome-explorer');
                  }}>
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
            <Card title="Select a node"><p className="text-muted">Click a pathway node to inspect it, or search for a gene such as HTT.</p></Card>
          )}
        </div>
      )}
    </div>
  );
}
