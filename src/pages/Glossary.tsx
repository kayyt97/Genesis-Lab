import { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { glossaryEntries, searchGlossary } from '../data/glossary';
import { getGlossaryText } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';

export function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(glossaryEntries[0]?.id ?? '');
  const languageLevel = useLanguage();

  const filtered = useMemo(() => searchGlossary(query), [query]);
  const selected = glossaryEntries.find((e) => e.id === selectedId) ?? filtered[0];

  return (
    <div className="glossary-page">
      <PageHeader
        title="Scientific Glossary"
        subtitle="Plain-English definitions for laboratory and biological terminology"
      />

      <div className="glossary-layout">
        <Card title="Terms">
          <input
            type="search"
            className="search-input"
            placeholder="Search glossary…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              const results = searchGlossary(e.target.value);
              if (results.length > 0) setSelectedId(results[0].id);
            }}
          />
          <ul className="glossary-list">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`glossary-list-item ${selected?.id === entry.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(entry.id)}
                >
                  {entry.term}
                </button>
              </li>
            ))}
          </ul>
          <p className="glossary-count text-muted">{filtered.length} terms</p>
        </Card>

        {selected && (
          <Card title={selected.term}>
            <div className="glossary-detail">
              {selected.unit && (
                <div className="glossary-field">
                  <strong>Unit</strong>
                  <p>{selected.unit}</p>
                </div>
              )}
              <div className="glossary-field">
                <strong>{languageLevel === 'technical' ? 'Scientific Definition' : languageLevel === 'simple' ? 'Plain English' : 'Definition'}</strong>
                <p>{getGlossaryText(selected, languageLevel)}</p>
              </div>
              {languageLevel === 'standard' && selected.plainEnglish !== selected.scientificDefinition && (
                <div className="glossary-field">
                  <strong>Scientific Detail</strong>
                  <p>{selected.scientificDefinition}</p>
                </div>
              )}
              <div className="glossary-field">
                <strong>Example</strong>
                <p>{selected.example}</p>
              </div>
              <div className="glossary-field">
                <strong>Appears in Genesis Lab</strong>
                <div className="tag-list">
                  {selected.appearsIn.map((a) => (
                    <span key={a} className="tag">{a}</span>
                  ))}
                </div>
              </div>
              <div className="glossary-field">
                <strong>Related Terms</strong>
                <div className="tag-list">
                  {selected.relatedTerms.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="tag tag-link"
                      onClick={() => {
                        const found = glossaryEntries.find(
                          (e) => e.term.toLowerCase() === t.toLowerCase(),
                        );
                        if (found) setSelectedId(found.id);
                      }}
                    >
                      {t}
                    </button>
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
