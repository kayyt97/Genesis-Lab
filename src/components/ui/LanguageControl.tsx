import { useAppState } from '../../store/AppContext';
import type { LanguageLevel } from '../../types/language';
import { LANGUAGE_LEVEL_LABELS } from '../../types/language';

const LEVELS: LanguageLevel[] = ['simple', 'standard', 'technical'];

export function LanguageControl({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useAppState();
  const level = state.settings.languageLevel;

  return (
    <div className={`language-control ${compact ? 'compact' : ''}`} role="group" aria-label="Language complexity">
      {!compact && <span className="language-control-label">Language</span>}
      <div className="language-control-buttons">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            className={`language-btn ${level === l ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { languageLevel: l } })}
            aria-pressed={level === l}
            title={LANGUAGE_LEVEL_LABELS[l]}
          >
            {compact ? LANGUAGE_LEVEL_LABELS[l] : LANGUAGE_LEVEL_LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function useLanguage() {
  const { state } = useAppState();
  return state.settings.languageLevel;
}
