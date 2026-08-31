import { useMemo } from 'react';
import type { SimulationSnapshot } from '../../types';

interface TimelineScrubberProps {
  snapshots: SimulationSnapshot[];
  currentTimeHours: number;
  onSeek: (timeHours: number) => void;
  marks?: number[];
}

export function TimelineScrubber({
  snapshots,
  currentTimeHours,
  onSeek,
  marks = [0, 6, 12, 24, 48, 72, 168],
}: TimelineScrubberProps) {
  const maxTime = useMemo(() => {
    if (snapshots.length === 0) return 168;
    return Math.max(...snapshots.map((s) => s.timeHours), 24);
  }, [snapshots]);

  const nearest = (time: number) => {
    if (snapshots.length === 0) return;
    let best = snapshots[0];
    let bestDist = Math.abs(best.timeHours - time);
    for (const s of snapshots) {
      const d = Math.abs(s.timeHours - time);
      if (d < bestDist) {
        best = s;
        bestDist = d;
      }
    }
    onSeek(best.timeHours);
  };

  return (
    <div className="timeline-scrubber">
      <label className="timeline-label">
        Simulation time: {currentTimeHours.toFixed(1)} h
        <input
          type="range"
          min={0}
          max={maxTime}
          step={0.25}
          value={Math.min(currentTimeHours, maxTime)}
          onChange={(e) => nearest(parseFloat(e.target.value))}
          aria-label="Scrub simulation timeline"
        />
      </label>
      <div className="timeline-marks">
        {marks.filter((m) => m <= maxTime).map((m) => (
          <button
            key={m}
            type="button"
            className="timeline-mark"
            onClick={() => nearest(m)}
          >
            {m >= 24 ? `${m / 24}d` : `${m}h`}
          </button>
        ))}
      </div>
    </div>
  );
}
