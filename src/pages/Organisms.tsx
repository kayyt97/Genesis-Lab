import { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { demoOrganisms } from '../data/demoData';
import { BIOLOGICAL_LIBRARY, LIBRARY_CATEGORIES, type BiologicalReferenceEntry } from '../data/biologicalLibrary';
import type { OrganismCategory } from '../types';

const CATEGORIES: { value: OrganismCategory | 'all'; label: string; glossary?: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bacteria', label: 'Bacteria', glossary: 'bacteria' },
  { value: 'viruses', label: 'Viruses', glossary: 'virus' },
  { value: 'fungi', label: 'Fungi', glossary: 'fungus' },
  { value: 'mammalian-cells', label: 'Mammalian Cells', glossary: 'cell' },
  { value: 'plant-cells', label: 'Plant Cells', glossary: 'cell' },
  { value: 'proteins', label: 'Proteins', glossary: 'protein' },
  { value: 'prions', label: 'Prions', glossary: 'prion' },
];

export function OrganismsPage() {
  const [category, setCategory] = useState<OrganismCategory | 'all'>('all');
  const [refCategory, setRefCategory] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const languageLevel = useLanguage();

  const filtered =
    category === 'all'
      ? demoOrganisms
      : demoOrganisms.filter((o) => o.category === category);

  const refFiltered = useMemo(() => {
    if (refCategory === 'all') return BIOLOGICAL_LIBRARY;
    return BIOLOGICAL_LIBRARY.filter((e) => e.category === refCategory);
  }, [refCategory]);

  const selected = demoOrganisms.find((o) => o.id === selectedId);
  const selectedRef = BIOLOGICAL_LIBRARY.find((e) => e.id === selectedRefId);

  return (
    <div className="organisms-page">
      <PageHeader
        title="Organisms & Biological Systems"
        subtitle="Master reference library — educational specimens across biological categories"
      />

      <div className="category-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`category-tab ${category === c.value ? 'active' : ''}`}
            onClick={() => setCategory(c.value)}
          >
            {c.glossary ? <GlossaryTerm term={c.glossary}>{c.label}</GlossaryTerm> : c.label}
          </button>
        ))}
      </div>

      <div className="organisms-layout">
        <Card title="Simulation Organisms">
          <ul className="organism-list">
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className={`organism-item ${selectedId === o.id ? 'active' : ''}`}
                  onClick={() => { setSelectedId(o.id); setSelectedRefId(null); }}
                >
                  <span className="organism-name">{o.commonName}</span>
                  <span className="organism-sci">{o.scientificName}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {selected ? (
          <Card title={selected.commonName} badge={selected.category}>
            <dl className="detail-dl">
              <dt>Scientific Name</dt><dd><em>{selected.scientificName}</em></dd>
              <dt>Classification</dt><dd>{selected.classification}</dd>
              <dt>Description</dt><dd>{selected.description}</dd>
              <dt>Characteristics</dt>
              <dd>
                <ul>{selected.characteristics.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </dd>
              <dt>Preferred Environment</dt>
              <dd>
                {Object.entries(selected.preferredEnvironment).map(([k, v]) => (
                  <span key={k} className="env-tag">{k}: {v}</span>
                ))}
                {Object.keys(selected.preferredEnvironment).length === 0 && '—'}
              </dd>
              <dt>References</dt>
              <dd>{selected.references.join('; ')}</dd>
            </dl>
          </Card>
        ) : (
          <Card title="Select an Entry">
            <p className="text-muted">Choose an organism from the list to view details.</p>
          </Card>
        )}
      </div>

      <Card title="Reference Biological Library">
        <div className="category-tabs">
          {LIBRARY_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`category-tab ${refCategory === c.value ? 'active' : ''}`}
              onClick={() => setRefCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <ul className="organism-list">
          {refFiltered.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                className={`organism-item ${selectedRefId === e.id ? 'active' : ''}`}
                onClick={() => { setSelectedRefId(e.id); setSelectedId(null); }}
              >
                <span className="organism-name">{e.name}</span>
                <span className="organism-sci">{e.scientificName}</span>
              </button>
            </li>
          ))}
        </ul>
        {selectedRef && <ReferenceDetail entry={selectedRef} languageLevel={languageLevel} />}
      </Card>
    </div>
  );
}

function ReferenceDetail({ entry, languageLevel }: { entry: BiologicalReferenceEntry; languageLevel: import('../types/language').LanguageLevel }) {
  return (
    <div className="ref-detail" style={{ marginTop: 16 }}>
      <h4>{entry.name}</h4>
      <EvidenceBadge level={entry.evidence.level} />
      {entry.pathogenInfo && (
        <p className="text-muted warn-text">Educational reference only — non-operational pathogen information.</p>
      )}
      <dl className="detail-dl">
        <dt>Taxonomy</dt><dd>{entry.taxonomy}</dd>
        <dt>Morphology</dt><dd>{entry.morphology}</dd>
        <dt>Description</dt><dd>{resolveTiered(entry.description, languageLevel)}</dd>
        <dt>Cellular organisation</dt><dd>{entry.cellularOrganisation}</dd>
        <dt>Characteristics</dt><dd><ul>{entry.characteristics.map((c, i) => <li key={i}>{c}</li>)}</ul></dd>
        <dt>Morphology supported for microscopy</dt><dd>{entry.morphologySupported ? 'Yes (modelled)' : 'No — insufficient data'}</dd>
      </dl>
    </div>
  );
}
