import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { demoOrganisms } from '../data/demoData';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered =
    category === 'all'
      ? demoOrganisms
      : demoOrganisms.filter((o) => o.category === category);

  const selected = demoOrganisms.find((o) => o.id === selectedId);

  return (
    <div className="organisms-page">
      <PageHeader
        title="Organisms & Biological Systems"
        subtitle="Browsable biological library — demonstration data for Phase 1"
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
        <Card title="Entries">
          <ul className="organism-list">
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className={`organism-item ${selectedId === o.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(o.id)}
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
    </div>
  );
}
