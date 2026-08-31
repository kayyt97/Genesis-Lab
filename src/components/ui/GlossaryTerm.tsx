import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { findGlossaryEntry } from '../../data/glossary';
import type { GlossaryEntry } from '../../types';

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
}

export function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState<GlossaryEntry | undefined>();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setEntry(findGlossaryEntry(term));
  }, [term]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const display = children ?? term;

  if (!entry) {
    return <span>{display}</span>;
  }

  return (
    <span className="glossary-term-wrapper" ref={ref}>
      <button
        type="button"
        className="glossary-term-btn"
        onClick={() => setOpen(!open)}
        aria-label={`Definition of ${term}`}
      >
        {display}
        <span className="glossary-info-icon">ⓘ</span>
      </button>
      {open && (
        <div className="glossary-tooltip">
          <div className="glossary-tooltip-header">
            <strong>{entry.term}</strong>
            {entry.unit && <span className="glossary-unit">{entry.unit}</span>}
          </div>
          <p className="glossary-plain">{entry.plainEnglish}</p>
          <p className="glossary-scientific">{entry.scientificDefinition}</p>
          {entry.example && (
            <p className="glossary-example">
              <em>Example:</em> {entry.example}
            </p>
          )}
          <Link to="/glossary" className="glossary-link" onClick={() => setOpen(false)}>
            View in Glossary →
          </Link>
        </div>
      )}
    </span>
  );
}
