import { EvidenceBadge } from '../ui/EvidenceBadge';
import { formatForecastExplanation, getCategoryLabel } from '../../services/viabilityForecast';
import type { ViabilityForecast } from '../../services/viabilityForecast';
import { useLanguage } from '../ui/LanguageControl';

interface ViabilityForecastPanelProps {
  forecast: ViabilityForecast;
}

export function ViabilityForecastPanel({ forecast }: ViabilityForecastPanelProps) {
  const languageLevel = useLanguage();

  if (forecast.confidence === 'insufficient') {
    return (
      <div className="viability-forecast viability-insufficient">
        <EvidenceBadge level="insufficient-information" />
        <p>{formatForecastExplanation(forecast, languageLevel)}</p>
      </div>
    );
  }

  return (
    <div className="viability-forecast">
      <div className="viability-forecast-header">
        <span className="viability-forecast-title">Modelled viability estimate</span>
        <EvidenceBadge level="model-derived" note="Not experimentally established" />
      </div>
      <div className="viability-forecast-metrics">
        <div className="vf-metric">
          <span className="vf-label">Predicted survival</span>
          <span className="vf-value">{forecast.modelledViability.toFixed(1)}%</span>
        </div>
        <div className="vf-metric">
          <span className="vf-label">Modelled die-off</span>
          <span className="vf-value">{forecast.modelledDieOff.toFixed(1)}%</span>
        </div>
        <div className="vf-metric">
          <span className="vf-label">Category</span>
          <span className={`vf-category vf-cat-${forecast.category}`}>{getCategoryLabel(forecast.category)}</span>
        </div>
      </div>
      {forecast.limitingFactors.length > 0 && (
        <div className="vf-limiting">
          <strong>Main limiting factor(s):</strong> {forecast.limitingFactors.join(', ')}
        </div>
      )}
      <p className="vf-explanation">{formatForecastExplanation(forecast, languageLevel)}</p>
    </div>
  );
}
