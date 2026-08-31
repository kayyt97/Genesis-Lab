import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EntityActions } from '../components/ui/EntityActions';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { moleculeIndex, MOLECULE_LIBRARY_CATEGORIES } from '../catalogue/index';
import type { EntityActionContext } from '../services/moduleActions';

export function MolecularLibraryPage() {
  const { dispatch } = useAppState();
  const navigate = useNavigate();
  const languageLevel = useLanguage();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const actionCtx: EntityActionContext = { dispatch, navigate };

  const cataloguePage = useMemo(
    () => moleculeIndex.query({ search, category: category === 'all' ? undefined : category, page, pageSize: 24, sortBy: 'name' }),
    [search, category, page],
  );

  const selected = selectedId ? moleculeIndex.getById(selectedId) : undefined;

  return (
    <div className="molecular-page">
      <PageHeader
        title="Molecular Library"
        subtitle={`Scalable compound catalogue — ${moleculeIndex.size.toLocaleString()} entries`}
      />

      <Card title="Connected Modules" className="connected-modules">
        <div className="handoff-actions">
          <Link to="/atomic-lab"><Button variant="secondary">Open Atomic Lab</Button></Link>
          <Link to="/molecule-explorer"><Button variant="secondary">Open Molecule Explorer</Button></Link>
        </div>
      </Card>

      <Card title="Browse Compounds">
        <input type="search" className="search-input" placeholder="Search name, formula, element…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div className="category-tabs">
          {MOLECULE_LIBRARY_CATEGORIES.map((c) => (
            <button key={c.value} type="button" className={`category-tab ${category === c.value ? 'active' : ''}`} onClick={() => { setCategory(c.value); setPage(1); }}>
              {c.label}
            </button>
          ))}
        </div>
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
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {cataloguePage.page} of {cataloguePage.totalPages} ({cataloguePage.total} total)</span>
          <button type="button" disabled={page >= cataloguePage.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
        {selected && (
          <div className="ref-detail">
            <h4>{selected.name}</h4>
            <dl className="detail-dl">
              <dt>Formula</dt><dd>{selected.formula}</dd>
              <dt>Elements</dt><dd>{selected.elements.join(', ')}</dd>
              <dt>Mass</dt><dd>{selected.molecularMass} g/mol</dd>
              <dt>Category</dt><dd>{selected.category}</dd>
              <dt>Role</dt><dd>{resolveTiered(selected.biologicalRole, languageLevel)}</dd>
            </dl>
            <p className="text-muted">Reference catalogue entry — not a therapeutic recommendation.</p>
            <EntityActions ctx={actionCtx} molecule={selected} />
          </div>
        )}
      </Card>
    </div>
  );
}
