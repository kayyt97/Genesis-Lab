import { useMemo, useState } from 'react';
import { ORGANISM_CATEGORIES, organismIndex } from '../../catalogue/index';
import type { OrganismCatalogueEntry } from '../../catalogue/types';
import { biologicalSystemTypeLabel } from '../../services/organismSimulationProfile';

interface BiologicalSampleSelectorProps {
  selectedId: string;
  sampleDisplayId?: string;
  onSelect: (entry: OrganismCatalogueEntry) => void;
}

function isSimReady(entry: OrganismCatalogueEntry): boolean {
  return entry.simulationReady ?? entry.compatibleModules.includes('virtual-lab');
}

export function BiologicalSampleSelector({ selectedId, sampleDisplayId, onSelect }: BiologicalSampleSelectorProps) {
  const selected = organismIndex.getById(selectedId);
  const [category, setCategory] = useState(selected?.category ?? 'bacteria');
  const [search, setSearch] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);

  const page = useMemo(() => {
    const result = organismIndex.query({
      category,
      search: search.trim() || undefined,
      page: 1,
      pageSize: 48,
      simulationReady: true,
    });
    return result;
  }, [category, search]);

  const categories = ORGANISM_CATEGORIES.filter((c) => {
    if (c.value === 'all') return false;
    // Only categories that have at least one simulation-ready entry
    return organismIndex.query({ category: c.value, simulationReady: true, pageSize: 1 }).total > 0;
  });

  return (
    <div className="bio-sample-selector compact">
      {selected && (
        <div className="bio-sample-current">
          <span className="bio-sample-id">{sampleDisplayId ?? selectedId}</span>
          <strong>{selected.name}</strong>
          <span className="text-muted">{biologicalSystemTypeLabel(selected.category)}</span>
          {!isSimReady(selected) && (
            <span className="warn-text">Simulation not available for this entry</span>
          )}
        </div>
      )}

      <p className="text-muted bio-sim-hint">
        Virtual Lab lists simulation-ready organisms and cell lines only. Tumour disease taxonomy stays reference-only.
      </p>

      <label className="bio-field">
        <span className="bio-field-label">Category</span>
        <select className="select-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </label>

      <label className="bio-field">
        <span className="bio-field-label">Search catalogue</span>
        <input
          type="search"
          className="search-input"
          placeholder="Name, taxonomy, keywords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <label className="bio-field">
        <span className="bio-field-label">Select sample</span>
        <select
          className="select-input"
          value={selectedId}
          onChange={(e) => {
            const entry = organismIndex.getById(e.target.value);
            if (entry && isSimReady(entry)) onSelect(entry);
          }}
        >
          {page.items.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name} — {entry.scientificName}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="link-btn bio-browse-toggle" onClick={() => setBrowseOpen((o) => !o)}>
        {browseOpen ? 'Hide browse list' : `Browse ${page.total} simulation-ready entries`}
      </button>

      {browseOpen && (
        <ul className="bio-sample-list compact-list">
          {page.items.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className={`bio-sample-item ${selectedId === entry.id ? 'active' : ''}`}
                onClick={() => onSelect(entry)}
              >
                <span className="bio-sample-name">{entry.name}</span>
                <span className="bio-sample-meta">{entry.scientificName}</span>
              </button>
            </li>
          ))}
          {page.total === 0 && <li className="empty-state">No simulation-ready entries in this category.</li>}
        </ul>
      )}

      {selected && (
        <p className="organism-desc text-muted">{selected.description.standard.slice(0, 150)}…</p>
      )}
    </div>
  );
}
