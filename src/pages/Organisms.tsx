import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { EntityActions } from '../components/ui/EntityActions';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import {
  organismIndex,
  ORGANISM_CATEGORIES,
  TUMOUR_BEHAVIOURS,
  TUMOUR_BODY_SYSTEMS,
  TUMOUR_FAMILIES,
  TUMOUR_TAXONOMY_META,
  isTumourEntry,
  tumourEducationDisclaimer,
} from '../catalogue/index';
import { getBuilderOrganismOptions } from '../services/demoCatalogueIdMap';
import { sendOrganismToVirtualLab, type EntityActionContext } from '../services/moduleActions';
import type { OrganismCatalogueEntry } from '../catalogue/types';

export function OrganismsPage() {
  const { dispatch } = useAppState();
  const [refCategory, setRefCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const [selectedSimId, setSelectedSimId] = useState<string | null>(null);
  const [behaviour, setBehaviour] = useState('all');
  const [bodySystem, setBodySystem] = useState('all');
  const [tumourFamily, setTumourFamily] = useState('all');
  const [ageGroup, setAgeGroup] = useState('all');
  const [simFilter, setSimFilter] = useState<'all' | 'ready' | 'reference'>('all');
  const languageLevel = useLanguage();
  const navigate = useNavigate();

  const actionCtx: EntityActionContext = { dispatch, navigate };
  const simulationOrganisms = useMemo(() => getBuilderOrganismOptions(), []);
  const showTumourFilters = refCategory === 'tumours-cancer' || refCategory === 'all';

  const cataloguePage = useMemo(
    () =>
      organismIndex.query({
        search,
        category: refCategory,
        page,
        pageSize: 24,
        sortBy: 'name',
        behaviour: showTumourFilters && behaviour !== 'all' ? behaviour : undefined,
        bodySystem: showTumourFilters && bodySystem !== 'all' ? bodySystem : undefined,
        tumourFamily: showTumourFilters && tumourFamily !== 'all' ? tumourFamily : undefined,
        ageGroup: showTumourFilters && ageGroup !== 'all' ? ageGroup : undefined,
        simulationReady:
          simFilter === 'ready' ? true : simFilter === 'reference' ? false : undefined,
      }),
    [search, refCategory, page, behaviour, bodySystem, tumourFamily, ageGroup, simFilter, showTumourFilters],
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
            placeholder="Search organisms, tumours/tumors, cells, tissues…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search catalogue"
          />
          <span className="text-muted">{cataloguePage.total.toLocaleString()} matches</span>
        </div>
        <div className="category-tabs" role="tablist" aria-label="Catalogue categories">
          {ORGANISM_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={refCategory === c.value}
              className={`category-tab ${refCategory === c.value ? 'active' : ''}`}
              onClick={() => { setRefCategory(c.value); setPage(1); }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {showTumourFilters && (
          <div className="tumour-filters" aria-label="Tumour and cancer filters">
            <p className="text-muted tumour-source-note">
              Tumours &amp; Cancer uses {TUMOUR_TAXONOMY_META.sourceVersionLabel}. Not every neoplasm is cancer —
              filter by behaviour. ICD-O-4 full tables are not bundled (IARC licence limits).
            </p>
            <div className="filter-row">
              <label>
                Behaviour
                <select value={behaviour} onChange={(e) => { setBehaviour(e.target.value); setPage(1); }}>
                  {TUMOUR_BEHAVIOURS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Body system
                <select value={bodySystem} onChange={(e) => { setBodySystem(e.target.value); setPage(1); }}>
                  <option value="all">All systems</option>
                  {TUMOUR_BODY_SYSTEMS.map((s) => (
                    <option key={s} value={s}>{s.replace(/ Neoplasm$/, '')}</option>
                  ))}
                </select>
              </label>
              <label>
                Tumour family
                <select value={tumourFamily} onChange={(e) => { setTumourFamily(e.target.value); setPage(1); }}>
                  <option value="all">All families</option>
                  {TUMOUR_FAMILIES.slice(0, 80).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label>
                Age group
                <select value={ageGroup} onChange={(e) => { setAgeGroup(e.target.value); setPage(1); }}>
                  <option value="all">Any age</option>
                  <option value="paediatric">Paediatric / childhood</option>
                  <option value="adult">Adult-leaning / unspecified</option>
                </select>
              </label>
              <label>
                Simulation
                <select
                  value={simFilter}
                  onChange={(e) => { setSimFilter(e.target.value as typeof simFilter); setPage(1); }}
                >
                  <option value="all">Reference + simulation-ready</option>
                  <option value="ready">Simulation-ready only</option>
                  <option value="reference">Reference-only</option>
                </select>
              </label>
            </div>
          </div>
        )}

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
                {isTumourEntry(e) && (
                  <span className={`catalogue-badge behaviour-${e.behaviour ?? 'undetermined'}`}>
                    {e.behaviour ?? 'undetermined'}
                  </span>
                )}
                {(e.simulationReady ?? e.compatibleModules.includes('virtual-lab')) ? (
                  <span className="catalogue-badge sim-ready">simulation-ready</span>
                ) : (
                  <span className="catalogue-badge sim-ref">reference-only</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {cataloguePage.page} of {cataloguePage.totalPages || 1}</span>
          <button type="button" disabled={page >= cataloguePage.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
        {selectedRef && <OrganismDetail entry={selectedRef} languageLevel={languageLevel} actionCtx={actionCtx} />}
      </Card>

      <Card title="Simulation-ready organisms (Virtual Lab)">
        <p className="text-muted">
          Curated catalogue entries shared with Experiment Builder and Virtual Lab — same IDs (e.g. ORG-ECOLI).
          Tumour disease taxonomy entries stay reference-only; only documented cell lines with a culture model appear here.
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
              {selectedSim.simulationModelNote && (
                <>
                  <dt>Simulation model</dt>
                  <dd>{selectedSim.simulationModelNote}</dd>
                </>
              )}
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

function OrganismDetail({
  entry,
  languageLevel,
  actionCtx,
}: {
  entry: OrganismCatalogueEntry;
  languageLevel: Parameters<typeof resolveTiered>[1];
  actionCtx: EntityActionContext;
}) {
  const tumour = isTumourEntry(entry) ? entry : null;
  const simReady = entry.simulationReady ?? entry.compatibleModules.includes('virtual-lab');
  const disclaimer = tumour ? tumourEducationDisclaimer(tumour) : null;

  return (
    <div className="ref-detail">
      <h4>{entry.name}</h4>
      <EvidenceBadge level={entry.evidence.level} />
      {entry.pathogenInfo && <p className="warn-text">Educational reference only — non-operational.</p>}
      {tumour && (
        <p className={`sim-status ${simReady ? 'ready' : 'unavailable'}`} role="status">
          {simReady ? 'Simulation-ready (cell-culture model)' : 'Simulation not available — reference catalogue entry'}
        </p>
      )}
      {disclaimer && <p className="text-muted">{resolveTiered(disclaimer, languageLevel)}</p>}
      <dl className="detail-dl">
        <dt>Scientific name</dt><dd><em>{entry.scientificName}</em></dd>
        <dt>Taxonomy / hierarchy</dt><dd>{entry.taxonomy}</dd>
        <dt>Description</dt><dd>{resolveTiered(entry.description, languageLevel)}</dd>
        {tumour?.behaviourLabel && (
          <>
            <dt>Behaviour</dt>
            <dd>{tumour.behaviourLabel} ({tumour.neoplasticStatus})</dd>
          </>
        )}
        {tumour?.bodySystem && (
          <>
            <dt>Body system</dt>
            <dd>{tumour.bodySystem}</dd>
          </>
        )}
        {tumour?.tumourFamily && (
          <>
            <dt>Tumour family</dt>
            <dd>{tumour.tumourFamily}</dd>
          </>
        )}
        {tumour?.tissueForm && (
          <>
            <dt>Tissue form</dt>
            <dd>{tumour.tissueForm === 'blood-lymphoid' ? 'Blood / lymphoid (typically non-solid)' : 'Solid tumour classification'}</dd>
          </>
        )}
        {tumour?.ageGroup && tumour.ageGroup !== 'any' && (
          <>
            <dt>Age group</dt>
            <dd>{tumour.ageGroup}</dd>
          </>
        )}
        {tumour?.ncitCode && (
          <>
            <dt>NCI Thesaurus code</dt>
            <dd>{tumour.ncitCode}</dd>
          </>
        )}
        {tumour?.icdoMorphologyCodes && tumour.icdoMorphologyCodes.length > 0 && (
          <>
            <dt>ICD-O morphology codes (via NCIm)</dt>
            <dd>{tumour.icdoMorphologyCodes.join(', ')}</dd>
          </>
        )}
        {entry.aliases.length > 0 && (
          <>
            <dt>Synonyms / spelling variants</dt>
            <dd>{entry.aliases.slice(0, 12).join('; ')}{entry.aliases.length > 12 ? '…' : ''}</dd>
          </>
        )}
        <dt>Morphology</dt><dd>{entry.morphology}</dd>
        <dt>Microscopy</dt>
        <dd>
          {entry.morphologySupported
            ? (entry.generatedDiagram !== false && tumour
              ? 'Yes — generated educational diagram (not real histology)'
              : 'Yes (modelled)')
            : 'No — insufficient data'}
        </dd>
        {tumour?.sourceDefinitionExcerpt && (
          <>
            <dt>NCI source definition (attributed excerpt)</dt>
            <dd>{tumour.sourceDefinitionExcerpt}</dd>
          </>
        )}
        {tumour?.sourceVersion && (
          <>
            <dt>Source version</dt>
            <dd>{tumour.sourceVersion}{tumour.reviewDate ? ` · reviewed ${tumour.reviewDate}` : ''}</dd>
          </>
        )}
        {tumour?.sourceLinks && (
          <>
            <dt>Source links</dt>
            <dd className="source-links">
              {tumour.sourceLinks.ncitConcept && (
                <a href={tumour.sourceLinks.ncitConcept} target="_blank" rel="noreferrer">NCI Thesaurus concept</a>
              )}
              {tumour.sourceLinks.nciCancerSearch && (
                <a href={tumour.sourceLinks.nciCancerSearch} target="_blank" rel="noreferrer">NCI cancer.gov search</a>
              )}
              {tumour.sourceLinks.icdo4Reference && (
                <a href={tumour.sourceLinks.icdo4Reference} target="_blank" rel="noreferrer">ICD-O-4 reference (IARC)</a>
              )}
              {tumour.sourceLinks.cellLineProvenance && (
                <span>{tumour.sourceLinks.cellLineProvenance}</span>
              )}
            </dd>
          </>
        )}
        {tumour?.simulationModelNote && (
          <>
            <dt>Facts vs simulation</dt>
            <dd>{tumour.simulationModelNote}</dd>
          </>
        )}
      </dl>
      <EntityActions ctx={actionCtx} organism={entry} />
    </div>
  );
}
