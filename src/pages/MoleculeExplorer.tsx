import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { EntityActions } from '../components/ui/EntityActions';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { CURATED_MOLECULES, renderMolecule2dSvg } from '../data/molecules';
import { moleculeIndex, moleculesContainingElement } from '../catalogue/index';
import { sendToVirtualLab, useAppState } from '../store/AppContext';
import { inferMoleculeRole } from '../services/experimentWorkspaceService';
import { resolveElementQuery, elementRecognisedEmptyMessage } from '../services/elementSearch';
import type { EntityActionContext } from '../services/moduleActions';
import type { MoleculeTransferRole } from '../types/experimentWorkspace';

export function MoleculeExplorerPage() {
  const [selectedId, setSelectedId] = useState(CURATED_MOLECULES[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const languageLevel = useLanguage();
  const navigate = useNavigate();
  const { dispatch } = useAppState();
  const [searchParams] = useSearchParams();

  const actionCtx: EntityActionContext = { dispatch, navigate };

  const resolvedElement = useMemo(() => resolveElementQuery(search), [search]);

  useEffect(() => {
    const molId = searchParams.get('mol');
    const element = searchParams.get('element');
    if (molId) setSelectedId(molId);
    if (element) setElementFilter(element);
  }, [searchParams]);

  const cataloguePage = useMemo(() => {
    const pageSize = 24;

    if (elementFilter) {
      const items = moleculesContainingElement(elementFilter, search);
      const total = items.length;
      return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        total,
        page,
        pageSize,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        elementOnly: true,
        resolvedElement: null as ReturnType<typeof resolveElementQuery>,
      };
    }

    const q = search.trim().toLowerCase();
    const isPureElementQuery = resolvedElement && (
      q === resolvedElement.name.toLowerCase() || q === resolvedElement.symbol.toLowerCase()
    );

    if (isPureElementQuery && resolvedElement) {
      const items = moleculesContainingElement(resolvedElement.symbol);
      const total = items.length;
      return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        total,
        page,
        pageSize,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        elementOnly: true,
        resolvedElement,
      };
    }

    return {
      ...moleculeIndex.query({ search, page, pageSize, sortBy: 'name' }),
      elementOnly: false,
      resolvedElement: null,
    };
  }, [search, page, elementFilter, resolvedElement]);

  const molecule = CURATED_MOLECULES.find((m) => m.id === selectedId) ?? CURATED_MOLECULES.find((m) => cataloguePage.items.some((c) => c.id === m.id));
  const catalogueEntry = moleculeIndex.getById(selectedId);

  const sendWithRole = (role: MoleculeTransferRole) => {
    if (!molecule) return;
    sendToVirtualLab(dispatch, molecule.id, molecule.name, 'molecule', {
      moleculeRole: role,
      formula: molecule.formula,
    });
    navigate('/virtual-lab');
  };

  return (
    <div className="molecule-explorer-page">
      <PageHeader title="Molecule Explorer" subtitle="Elements, atoms, ions, and compounds — integrated with Atomic Lab" actions={<EvidenceBadge level="reference-data" />} />

      <AboutThisTool
        title="Understanding Molecule Explorer"
        whatIsThis="An educational browser for curated compounds — search by name, formula, or element, then inspect a simple 2D sketch and role summary."
        whyUseIt="Find a molecule of interest, then send it to Virtual Lab or open Atomic Lab to explore related chemistry concepts."
        whatCanILearn="How formulae relate to constituent elements, approximate mass, and short biological or laboratory context for common compounds."
        caveat="Entries are educational reference data — not prescriptions, purity certificates, or clinical advice."
      />

      {elementFilter && (
        <div className="handoff-banner">
          Showing compounds containing <strong>{elementFilter}</strong>
          {search && <> matching “{search}”</>}
          <button type="button" className="handoff-dismiss" aria-label="Clear element filter" onClick={() => { setElementFilter(null); navigate('/molecule-explorer'); }}>×</button>
        </div>
      )}

      <Card title="Search Molecules">
        <input
          type="search"
          className="search-input"
          placeholder="Name, formula, category, element name or symbol…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        />
        <p className="text-muted">Search by name, formula, category, element symbol, or full element name (e.g. carbon, radon, oxygen).</p>
      </Card>

      <div className="molecular-layout">
        <Card title={`Catalogue (${cataloguePage.total.toLocaleString()})`}>
          {cataloguePage.total === 0 ? (
            <div className="empty-state">
              {cataloguePage.elementOnly && cataloguePage.resolvedElement
                ? elementRecognisedEmptyMessage(cataloguePage.resolvedElement)
                : elementFilter
                  ? `No entries in the Genesis catalogue contain ${elementFilter}${search ? ` matching “${search}”` : ''}.`
                  : search
                    ? `No catalogue entries match “${search}”.`
                    : 'No compounds in catalogue.'}
            </div>
          ) : (
            <>
              {cataloguePage.elementOnly && cataloguePage.resolvedElement && (
                <p className="text-muted">Showing compounds containing {cataloguePage.resolvedElement.name} ({cataloguePage.resolvedElement.symbol}).</p>
              )}
              <ul className="compound-list catalogue-list">
                {cataloguePage.items.map((m) => (
                  <li key={m.id}>
                    <button type="button" className={`compound-item ${selectedId === m.id ? 'active' : ''}`} onClick={() => setSelectedId(m.id)}>
                      <span>{m.name}</span>
                      <span className="formula">{m.formula}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {cataloguePage.totalPages > 0 && (
                <div className="pagination">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                  <span>Page {cataloguePage.page} of {cataloguePage.totalPages}</span>
                  <button type="button" disabled={page >= cataloguePage.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </Card>

        {molecule && (
          <Card title={molecule.name} badge={molecule.formula}>
            <div className="mol-2d-view" dangerouslySetInnerHTML={{ __html: renderMolecule2dSvg(molecule) }} />
            <dl className="detail-dl">
              <dt>Type</dt><dd>{catalogueEntry ? `${catalogueEntry.category} (reference compound)` : 'Compound'}</dd>
              <dt>Constituent elements</dt><dd>{catalogueEntry?.elements.join(', ') ?? '—'}</dd>
              <dt>Molecular mass</dt><dd>{molecule.molecularMass} g/mol</dd>
              <dt>Charge</dt><dd>{molecule.charge}</dd>
              <dt>Biological role</dt><dd>{resolveTiered(molecule.biologicalRole!, languageLevel)}</dd>
            </dl>
            <div className="handoff-actions">
              <Button onClick={() => sendWithRole(inferMoleculeRole(molecule.id, molecule.name))}>Send to Virtual Lab</Button>
              <Button variant="secondary" onClick={() => sendWithRole('treatment')}>Send as treatment</Button>
              <Button variant="secondary" onClick={() => navigate('/atomic-lab')}>Open Atomic Lab</Button>
            </div>
            {catalogueEntry && <EntityActions ctx={actionCtx} molecule={catalogueEntry} />}
          </Card>
        )}
      </div>
    </div>
  );
}
