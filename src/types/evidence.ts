/** Reusable evidence / uncertainty labelling across Genesis Lab */

export type EvidenceLevel =
  | 'established'
  | 'reference-data'
  | 'model-derived'
  | 'estimated'
  | 'speculative'
  | 'insufficient-information';

export interface EvidenceMeta {
  level: EvidenceLevel;
  label?: string;
  note?: string;
  range?: { min: number; max: number; unit?: string };
}

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  established: 'Established',
  'reference-data': 'Reference Data',
  'model-derived': 'Model-Derived',
  estimated: 'Estimated',
  speculative: 'Speculative',
  'insufficient-information': 'Insufficient Information',
};

export type WorkspaceProvenanceClass =
  | 'reference'
  | 'demo'
  | 'user-uploaded'
  | 'user-created'
  | 'model-generated';

export type DataProvenance =
  | 'real-user-data'
  | 'reference-information'
  | 'model-input'
  | 'model-output'
  | 'assumption'
  | 'speculation'
  | WorkspaceProvenanceClass;

export const PROVENANCE_LABELS: Record<DataProvenance, string> = {
  'real-user-data': 'Real User Data',
  'reference-information': 'Reference Information',
  'model-input': 'Model Input',
  'model-output': 'Model Output',
  assumption: 'Assumption',
  speculation: 'Speculation',
  reference: 'Reference',
  demo: 'Demo',
  'user-uploaded': 'User Uploaded',
  'user-created': 'User Created',
  'model-generated': 'Model Generated',
};
