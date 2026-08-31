import type { EvidenceLevel, DataProvenance } from '../../types/evidence';
import { EVIDENCE_LABELS, PROVENANCE_LABELS } from '../../types/evidence';

interface EvidenceBadgeProps {
  level: EvidenceLevel;
  note?: string;
  className?: string;
}

export function EvidenceBadge({ level, note, className = '' }: EvidenceBadgeProps) {
  return (
    <span
      className={`evidence-badge evidence-${level} ${className}`}
      title={note ?? EVIDENCE_LABELS[level]}
    >
      {EVIDENCE_LABELS[level]}
    </span>
  );
}

interface ProvenanceBadgeProps {
  provenance: DataProvenance;
  className?: string;
}

export function ProvenanceBadge({ provenance, className = '' }: ProvenanceBadgeProps) {
  return (
    <span className={`provenance-badge provenance-${provenance} ${className}`}>
      {PROVENANCE_LABELS[provenance]}
    </span>
  );
}

interface ObservedMarkerProps {
  observed: boolean;
  className?: string;
}

export function ObservedMarker({ observed, className = '' }: ObservedMarkerProps) {
  if (observed) {
    return (
      <span className={`observed-marker observed-yes ${className}`}>
        Observed in uploaded data
      </span>
    );
  }
  return (
    <span className={`observed-marker observed-no ${className}`}>
      Not measured / unknown
    </span>
  );
}
