import type { OrganismSimulationState } from '../../types';

interface CultureVisualisationProps {
  morphologyType: string;
  category: string;
  organismName: string;
  state: OrganismSimulationState | undefined;
  treatmentActive?: boolean;
  compact?: boolean;
  showLabel?: boolean;
}

export function CultureVisualisation({
  morphologyType,
  category,
  organismName,
  state,
  treatmentActive,
  compact = false,
  showLabel = true,
}: CultureVisualisationProps) {
  const viability = state?.viability ?? 50;
  const stress = state?.stress ?? 0;
  const density = Math.min(1, (state?.population ?? 0) / 2_000_000);

  return (
    <div className={`culture-visualisation ${compact ? 'compact' : ''}`}>
      {showLabel && (
        <p className="sim-vis-label text-muted">Simulated visualisation — not microscopy</p>
      )}
      <div className={`petri-dish ${compact ? 'compact' : ''}`}>
        <div className="culture-schematic" data-morphology={morphologyType} data-category={category}>
          {renderMorphology(morphologyType, viability, stress, density, treatmentActive)}
        </div>
      </div>
      <div className="organism-label" title={organismName}>{organismName}</div>
    </div>
  );
}

function renderMorphology(
  type: string,
  viability: number,
  stress: number,
  density: number,
  treatmentActive?: boolean,
) {
  const color = viability > 70 ? '#66bb6a' : viability > 40 ? '#ffb74d' : '#ef5350';
  const opacity = 0.35 + (viability / 100) * 0.55;
  const scale = 0.7 + density * 0.5;

  if (type === 'protein' || type === 'prion') {
    return (
      <svg viewBox="0 0 120 80" className="morph-svg protein-morph" aria-hidden>
        <path d="M20 40 Q40 10 60 40 T100 40" stroke={color} strokeWidth="4" fill="none" opacity={opacity} />
        <text x="10" y="72" fontSize="8" fill="#94a3b8">Protein / aggregate schematic</text>
      </svg>
    );
  }

  if (type === 'virus') {
    return (
      <svg viewBox="0 0 120 80" className="morph-svg" aria-hidden>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <circle key={i} cx={60 + Math.cos((deg * Math.PI) / 180) * 18} cy={40 + Math.sin((deg * Math.PI) / 180) * 18} r="3" fill={color} opacity={opacity} />
        ))}
        <polygon points="60,22 68,38 52,38" fill={color} opacity={opacity} />
      </svg>
    );
  }

  if (type === 'neuron') {
    return (
      <svg viewBox="0 0 120 80" className="morph-svg" aria-hidden>
        <circle cx="30" cy="40" r="10" fill={color} opacity={opacity} />
        <path d="M40 40 L90 20 M40 40 L85 55 M40 40 L80 40" stroke={color} strokeWidth="2" opacity={opacity} />
      </svg>
    );
  }

  if (type === 'tissue') {
    return (
      <svg viewBox="0 0 120 80" className="morph-svg" aria-hidden>
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 6 }).map((__, col) => (
            <rect key={`${row}-${col}`} x={8 + col * 18} y={10 + row * 14} width="14" height="10" rx="2" fill={color} opacity={0.25 + opacity * 0.5} />
          )),
        )}
      </svg>
    );
  }

  if (type === 'plant-cell') {
    return (
      <svg viewBox="0 0 120 80" className="morph-svg" aria-hidden>
        <rect x="25" y="20" width="30" height="40" rx="2" stroke={color} fill={color} fillOpacity={opacity * 0.4} strokeWidth="2" />
        <rect x="65" y="25" width="28" height="35" rx="2" stroke={color} fill={color} fillOpacity={opacity * 0.35} strokeWidth="2" />
      </svg>
    );
  }

  if (type === 'hela' || type === 'adherent-cell') {
    return (
      <svg viewBox="0 0 120 80" className="morph-svg" aria-hidden>
        <ellipse cx="45" cy="42" rx="16" ry="10" fill={color} opacity={opacity} transform={`scale(${scale})`} style={{ transformOrigin: '45px 42px' }} />
        <ellipse cx="78" cy="36" rx="14" ry="9" fill={color} opacity={opacity * 0.85} />
        <ellipse cx="62" cy="52" rx="12" ry="8" fill={color} opacity={opacity * 0.7} />
      </svg>
    );
  }

  if (type === 'yeast') {
    return (
      <svg viewBox="0 0 120 80" className="morph-svg" aria-hidden>
        <ellipse cx="50" cy="40" rx="14" ry="10" fill={color} opacity={opacity} />
        <ellipse cx="68" cy="32" rx="8" ry="6" fill={color} opacity={opacity * 0.7} />
      </svg>
    );
  }

  if (type === 'coccus') {
    return (
      <svg viewBox="0 0 120 80" className="morph-svg" aria-hidden>
        {[[40, 35], [55, 42], [48, 50], [62, 38]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill={color} opacity={opacity} />
        ))}
      </svg>
    );
  }

  // Default bacterium rods
  return (
    <svg viewBox="0 0 120 80" className="morph-svg" aria-hidden>
      {[[35, 38], [55, 44], [75, 36], [48, 52]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="18" height="6" rx="3" fill={color} opacity={opacity} transform={`rotate(${i * 15} ${x + 9} ${y + 3})`} />
      ))}
      {treatmentActive && <circle cx="95" cy="15" r="4" fill="#4fc3f7" opacity="0.8" />}
      {stress > 40 && <text x="8" y="72" fontSize="8" fill="#ffb74d">Stress elevated</text>}
    </svg>
  );
}
