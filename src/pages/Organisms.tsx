import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { EntityActions } from '../components/ui/EntityActions';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { organismIndex, ORGANISM_CATEGORIES } from '../catalogue/index';
import { getBuilderOrganismOptions } from '../services/demoCatalogueIdMap';
import { sendOrganismToVirtualLab, type EntityActionContext } from '../services/moduleActions';

export function OrganismsPage() {
  const { dispatch } = useAppState();
  const [refCategory, setRefCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const [selectedSimId, setSelectedSimId] = useState<string | null>(null);
  const languageLevel = useLanguage();
  const navigate = useNavigate();

  const actionCtx: EntityActionContext = { dispatch, navigate };
  const simulationOrganisms = useMemo(() => getBuilderOrganismOptions(), []);

  const cataloguePage = useMemo(
    () => organismIndex.query({ search, category: refCategory, page, pageSize: 24, sortBy: 'name' }),
    [search, refCategory, page],
  );

  const selectedRef = selectedRefId ? organismIndex.getById(selectedRefId) : undefined;
  const selectedSim = selectedSimId ? organismIndex.getById(selectedSimId) : undefined;

  return (
    <div className="organisms-page">
      <PageHeader
        title="Organisms & Biological Systems"
        subtitle={`Educational reference catalogue — ${organismIndex.size.toLocaleString()} entries`}
      />

      <Card title="Reference Biological Library">
        <div className="catalogue-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Search organisms, cells, tissues, viruses…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <span className="text-muted">{cataloguePage.total.toLocaleString()} matches</span>
        </div>
        <div className="category-tabs">
          {ORGANISM_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`category-tab ${refCategory === c.value ? 'active' : ''}`}
              onClick={() => { setRefCategory(c.value); setPage(1); }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <ul className="organism-list catalogue-list">
          {cataloguePage.items.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                className={`organism-item ${selectedRefId === e.id ? 'active' : ''}`}
                onClick={() => { setSelectedRefId(e.id); setSelectedSimId(null); }}
              >
                <span className="organism-name">{e.name}</span>
                <span className="organism-sci">{e.scientificName}</span>
                <span className="catalogue-badge">{e.category}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {cataloguePage.page} of {cataloguePage.totalPages}</span>
          <button type="button" disabled={page >= cataloguePage.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
        {selectedRef && (
          <div className="ref-detail">
            <h4>{selectedRef.name}</h4>
            <EvidenceBadge level={selectedRef.evidence.level} />
            {selectedRef.pathogenInfo && <p className="warn-text">Educational reference only — non-operational.</p>}
            <dl className="detail-dl">
              <dt>Scientific name</dt><dd><em>{selectedRef.scientificName}</em></dd>
              <dt>Taxonomy</dt><dd>{selectedRef.taxonomy}</dd>
              <dt>Description</dt><dd>{resolveTiered(selectedRef.description, languageLevel)}</dd>
              <dt>Morphology</dt><dd>{selectedRef.morphology}</dd>
              <dt>Microscopy supported</dt><dd>{selectedRef.morphologySupported ? 'Yes (modelled)' : 'No — insufficient data'}</dd>
            </dl>
            <EntityActions ctx={actionCtx} organism={selectedRef} />
          </div>
        )}
      </Card>

      <Card title="Simulation-ready organisms (Virtual Lab)">
        <p className="text-muted">
          Curated catalogue entries shared with Experiment Builder and Virtual Lab — same IDs (e.g. ORG-ECOLI).
        </p>
        <ul className="organism-list">
          {simulationOrganisms.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className={`organism-item ${selectedSimId === o.id ? 'active' : ''}`}
                onClick={() => { setSelectedSimId(o.id); setSelectedRefId(null); }}
              >
                <span className="organism-name">{o.name}</span>
                <span className="organism-sci">{o.scientificName}</span>
                <span className="catalogue-badge">{o.id}</span>
              </button>
            </li>
          ))}
        </ul>
        {selectedSim && (
          <div className="ref-detail">
            <h4>{selectedSim.name}</h4>
            <dl className="detail-dl">
              <dt>Catalogue ID</dt><dd>{selectedSim.id}</dd>
              <dt>Description</dt><dd>{resolveTiered(selectedSim.description, languageLevel)}</dd>
              <dt>Classification</dt><dd>{selectedSim.taxonomy}</dd>
            </dl>
            <button type="button" className="link-btn" onClick={() => sendOrganismToVirtualLab(actionCtx, selectedSim)}>
              Send to Virtual Lab →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
