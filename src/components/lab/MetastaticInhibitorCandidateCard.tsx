import {
  EDUCATIONAL_NO_CLINICAL_NOTICE,
  METASTATIC_INHIBITOR_AIM,
  METASTATIC_INHIBITOR_NAME,
  METASTATIC_INHIBITOR_PARAMETERS,
  getMetastaticInhibitorDesign,
} from '../../services/metastaticInhibitorCandidate';
import { Button } from '../ui/Button';
import type { TherapeuticDesign } from '../../types/scientific';

interface MetastaticInhibitorCandidateCardProps {
  onLoadCandidate: (design: TherapeuticDesign) => void;
  onSendToVirtualLab: (design: TherapeuticDesign) => void;
}

export function MetastaticInhibitorCandidateCard({
  onLoadCandidate,
  onSendToVirtualLab,
}: MetastaticInhibitorCandidateCardProps) {
  const design = getMetastaticInhibitorDesign();

  return (
    <section className="mi-candidate-card" aria-label={`${METASTATIC_INHIBITOR_NAME} built-in candidate`}>
      <p className="mi-edu-banner" role="status">
        {EDUCATIONAL_NO_CLINICAL_NOTICE}
      </p>
      <h3>{METASTATIC_INHIBITOR_NAME}</h3>
      <p className="text-muted">{METASTATIC_INHIBITOR_AIM}</p>
      <p>
        Exact candidate name: <strong>{design.name}</strong> · id {design.id} · intended outcome{' '}
        {design.intendedOutcome} · target {design.targetCellModelId}
      </p>

      <table className="tumour-report-table" aria-label="Metastatic Inhibitor parameters">
        <thead>
          <tr>
            <th scope="col">Parameter</th>
            <th scope="col">Unit / scale</th>
            <th scope="col">Baseline</th>
            <th scope="col">Chosen</th>
            <th scope="col">Rationale</th>
            <th scope="col">Uncertainty</th>
          </tr>
        </thead>
        <tbody>
          {METASTATIC_INHIBITOR_PARAMETERS.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.label}</th>
              <td>{p.unitOrScale}</td>
              <td>{p.baselineValue}</td>
              <td>{p.chosenValue}</td>
              <td>{p.rationale}</td>
              <td>{p.uncertainty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mi-actions">
        <Button
          onClick={() => onLoadCandidate(design)}
          aria-label={`Load ${METASTATIC_INHIBITOR_NAME} into the design form`}
        >
          Load {METASTATIC_INHIBITOR_NAME} into form
        </Button>
        <Button
          variant="secondary"
          onClick={() => onSendToVirtualLab(design)}
          aria-label={`Save and send ${METASTATIC_INHIBITOR_NAME} to Virtual Lab`}
        >
          Save &amp; send to Virtual Lab
        </Button>
      </div>
    </section>
  );
}
