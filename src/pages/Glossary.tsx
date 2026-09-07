import { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { glossaryEntries } from '../data/glossary';
import { GLOSSARY_CATEGORIES, searchGlossary } from '../services/glossaryService';
import { getGlossaryText } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { HelpPopover } from '../components/ui/HelpPopover';
import type { GlossaryCategory } from '../types';

export function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState(glossaryEntries[0]?.id ?? '');
  const languageLevel = useLanguage();

  const filtered = useMemo(() => searchGlossary(query, category), [query, category]);
  const selected = glossaryEntries.find((e) => e.id === selectedId) ?? filtered[0];

  return (
    <div className="glossary-page">
      <PageHeader title="Scientific Glossary" subtitle="Plain-English definitions for laboratory and biological terminology" />

      <div className="glossary-layout">
        <Card title="Terms">
          <div className="category-chips scroll-x">
            {GLOSSARY_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`filter-btn ${category === c.value ? 'active' : ''}`}
                onClick={() => {
                  setCategory(c.value);
                  setSelectedId(glossaryEntries.find((e) =>
                    c.value === 'all' || e.categories.includes(c.value as never)
                  )?.id ?? '');
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="glossary-search-row">
            <input
              type="search"
              className="search-input"
              placeholder="Search glossary…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                const results = searchGlossary(e.target.value, category);
                if (results.length > 0) setSelectedId(results[0].id);
              }}
            />
            <HelpPopover
              trigger={<span className="param-help-icon" aria-hidden="true">?</span>}
              title="Category filtering"
              content={<p>Select a category to narrow both the visible terms and search results. Select ALL to browse the complete glossary.</p>}
              ariaLabel="Help: category filtering"
            />
          </div>
          <ul className="glossary-list">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <button type="button" className={`glossary-list-item ${selected?.id === entry.id ? 'active' : ''}`} onClick={() => setSelectedId(entry.id)}>
                  {entry.term}
                </button>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && <p className="empty-state">No terms match in this category.</p>}
          <p className="glossary-count text-muted">{filtered.length} terms</p>
        </Card>

        {selected && (
          <Card title={selected.term}>
            <div className="glossary-detail">
              <div className="tag-list">
                {selected.categories.map((c) => (
                  <span key={c} className="tag">{c}</span>
                ))}
              </div>
              <div className="glossary-detail-grid">
                {selected.unit && (
                  <div className="glossary-field">
                    <strong>Unit</strong>
                    <p>{selected.unit}</p>
                  </div>
                )}
                <div className="glossary-field">
                  <strong>{languageLevel === 'technical' ? 'Technical' : languageLevel === 'simple' ? 'Plain English' : 'Standard'}</strong>
                  <p>{getGlossaryText(selected, languageLevel)}</p>
                </div>
                {languageLevel !== 'simple' && (
                  <div className="glossary-field">
                    <strong>Plain English</strong>
                    <p>{selected.plainEnglish}</p>
                  </div>
                )}
                {languageLevel !== 'simple' && (
                  <div className="glossary-field">
                    <strong>Scientific detail</strong>
                    <p>{selected.scientificDefinition}</p>
                  </div>
                )}
                <div className="glossary-field">
                  <strong>Example</strong>
                  <p>{selected.example}</p>
                </div>
                <div className="glossary-field">
                  <strong>Why it matters</strong>
                  <p>{selected.scientificDefinition.slice(0, 180)}{selected.scientificDefinition.length > 180 ? '…' : ''}</p>
                </div>
              </div>
              <div className="glossary-field">
                <strong>Used in Genesis</strong>
                <div className="tag-list">{selected.appearsIn.map((a) => <span key={a} className="tag">{a}</span>)}</div>
              </div>
              <div className="glossary-field">
                <strong>Related Terms</strong>
                <div className="tag-list">
                  {selected.relatedTerms.map((t) => (
                    <button key={t} type="button" className="tag tag-link" onClick={() => {
                      const found = glossaryEntries.find((e) => e.term.toLowerCase() === t.toLowerCase() || e.id === t);
                      if (found) setSelectedId(found.id);
                    }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
