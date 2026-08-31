import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { TEACHING_SCENARIOS } from '../data/equipment';

export function TeachingModePage() {
  const [scenarioId, setScenarioId] = useState(TEACHING_SCENARIOS[0]?.id ?? '');
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const languageLevel = useLanguage();

  const scenario = TEACHING_SCENARIOS.find((s) => s.id === scenarioId);

  return (
    <div className="teaching-page">
      <PageHeader title="Teaching Mode" subtitle="Identify simulated experimental problems" />

      <div className="pathway-select">
        {TEACHING_SCENARIOS.map((s) => (
          <button key={s.id} type="button" className={`category-tab ${scenarioId === s.id ? 'active' : ''}`} onClick={() => { setScenarioId(s.id); setSelected(null); setRevealed(false); }}>
            {s.title}
          </button>
        ))}
      </div>

      {scenario && (
        <Card title={scenario.title}>
          <p>{resolveTiered(scenario.description, languageLevel)}</p>
          <div className="teaching-options">
            {scenario.options.map((opt) => (
              <Button
                key={opt.id}
                variant={selected === opt.id ? 'primary' : 'secondary'}
                onClick={() => { setSelected(opt.id); setRevealed(true); }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          {revealed && selected && (
            <div className={`teaching-feedback ${scenario.options.find((o) => o.id === selected)?.correct ? 'correct' : 'incorrect'}`}>
              <p>{resolveTiered(scenario.options.find((o) => o.id === selected)!.explanation, languageLevel)}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
