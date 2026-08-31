import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { findGlossaryEntry, getGlossaryHelpText } from '../../services/glossaryService';
import { getGlossaryText, getGlossaryTitle } from '../../content/language';
import { HelpPopover } from './HelpPopover';
import { useLanguage } from './LanguageControl';
import type { GlossaryEntry } from '../../types';

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
  helpText?: string;
}

export function GlossaryTerm({ term, children, helpText }: GlossaryTermProps) {
  const [entry, setEntry] = useState<GlossaryEntry | undefined>();
  const languageLevel = useLanguage();

  useEffect(() => {
    setEntry(findGlossaryEntry(term));
  }, [term]);

  const display = children ?? term;

  if (!entry && !helpText) {
    return <span>{display}</span>;
  }

  const definition = entry
    ? getGlossaryText(entry, languageLevel)
    : (helpText ?? '');
  const title = entry ? getGlossaryTitle(entry, languageLevel) : term;

  const popoverContent = (
    <>
      <p className="glossary-plain">{definition}</p>
      {entry?.example && (
        <p className="glossary-example">
          <em>Example:</em> {entry.example}
        </p>
      )}
      {entry?.unit && (
        <p className="glossary-unit-line">
          <strong>Unit:</strong> {entry.unit}
        </p>
      )}
      {entry && (
        <Link to="/glossary" className="glossary-link">
          View in Glossary →
        </Link>
      )}
    </>
  );

  return (
    <span className="glossary-term-inline">
      {display}
      <HelpPopover
        trigger={<span className="glossary-help-icon" aria-hidden="true">?</span>}
        title={title}
        content={popoverContent}
        ariaLabel={`Help: ${title}`}
      />
    </span>
  );
}

interface ParameterHelpProps {
  label: string;
  help: import('../../types/language').TieredText | string;
  glossaryId?: string;
}

export function ParameterHelp({ label, help, glossaryId }: ParameterHelpProps) {
  const languageLevel = useLanguage();
  const glossaryText = glossaryId ? getGlossaryHelpText(glossaryId, languageLevel) : '';
  const text =
    glossaryText ||
    (typeof help === 'string' ? help : help[languageLevel]);

  return (
    <HelpPopover
      trigger={<span className="param-help-icon" aria-hidden="true">?</span>}
      title={label}
      content={<p className="param-help-text">{text}</p>}
      ariaLabel={`Help for ${label}`}
    />
  );
}
