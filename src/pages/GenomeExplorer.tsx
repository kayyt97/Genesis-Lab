import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge, ObservedMarker, ProvenanceBadge } from '../components/ui/EvidenceBadge';
import { resolveTiered } from '../content/language';
import { GENOME_PRIVACY_NOTICE, GENOME_NOT_DIAGNOSIS } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { parseGenomeFile, createSimulationCopy } from '../services/genomeParser';
import { CHROMOSOMES, REFERENCE_GENES, findVariantsInGene } from '../data/genes';
import type { GenomicVariant } from '../types/scientific';

export function GenomeExplorerPage() {
  const { state, dispatch } = useAppState();
  const languageLevel = useLanguage();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedChr, setSelectedChr] = useState('17');
  const [selectedGeneId, setSelectedGeneId] = useState(REFERENCE_GENES[0]?.id ?? '');
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [simCopyName, setSimCopyName] = useState('Simulation Copy');

  const upload = state.genomeUpload;
  const selectedGene = REFERENCE_GENES.find((g) => g.id === selectedGeneId);
  const geneVariants = upload && selectedGene
    ? findVariantsInGene(selectedGene.id, upload.variants)
    : [];

  const chrVariants = upload
    ? upload.variants.filter((v) => v.chromosome.replace(/^chr/i, '') === selectedChr)
    : [];

  const handleUpload = async (file: File) => {
    setLoading(true);
    setParseError(null);
    const result = await parseGenomeFile(file);
    setLoading(false);
    if (!result.success || !result.upload) {
      setParseError(result.error ?? 'Parse failed.');
      return;
    }
    dispatch({ type: 'SET_GENOME_UPLOAD', payload: result.upload });
  };

  const createSimCopy = () => {
    if (!upload) return;
    const copy = createSimulationCopy(upload, simCopyName);
    dispatch({ type: 'ADD_GENOME_SIM_COPY', payload: copy });
  };

  const toggleVariantInCopy = (copyId: string, variantId: string, altGenotype: string) => {
    const copy = state.genomeSimulationCopies.find((c) => c.id === copyId);
    if (!copy) return;
    const updated: typeof copy = {
      ...copy,
      variants: copy.variants.map((v) =>
        v.id === variantId
          ? { ...v, genotype: altGenotype, observationStatus: 'observed' as const }
          : v,
      ),
      editedVariantIds: copy.editedVariantIds.includes(variantId)
        ? copy.editedVariantIds
        : [...copy.editedVariantIds, variantId],
    };
    dispatch({ type: 'UPDATE_GENOME_SIM_COPY', payload: updated });
  };

  return (
    <div className="genome-page">
      <PageHeader
        title="Genome Explorer"
        subtitle="Local genotype visualisation — not clinical diagnosis"
        actions={<ProvenanceBadge provenance="real-user-data" />}
      />

      <div className="genome-notices">
        <p>{resolveTiered(GENOME_PRIVACY_NOTICE, languageLevel)}</p>
        <p>{resolveTiered(GENOME_NOT_DIAGNOSIS, languageLevel)}</p>
      </div>

      <Card title="Upload Genotype File (Local Processing Only)">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.csv,.vcf,.tsv"
          className="file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        {loading && <p className="text-muted">Parsing locally…</p>}
        {parseError && <p className="error-text">{parseError}</p>}
        {upload && (
          <div className="upload-summary">
            <EvidenceBadge level="established" note="User uploaded file" />
            <p>
              <strong>{upload.fileName}</strong> — {upload.variantCount.toLocaleString()} variants parsed
              ({upload.sourceFormat}). Processed locally; not transmitted externally.
            </p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={upload.isPersisted}
                onChange={() =>
                  dispatch({
                    type: 'SET_GENOME_UPLOAD',
                    payload: { ...upload, isPersisted: !upload.isPersisted },
                  })
                }
              />
              Save in local project storage (optional)
            </label>
            <Button variant="secondary" onClick={() => dispatch({ type: 'SET_GENOME_UPLOAD', payload: null })}>
              Clear uploaded data
            </Button>
          </div>
        )}
      </Card>

      <div className="genome-layout">
        <Card title="Chromosomes">
          <div className="chr-grid">
            {CHROMOSOMES.map((chr) => {
              const count = upload
                ? upload.variants.filter((v) => v.chromosome.replace(/^chr/i, '') === chr.id).length
                : 0;
              return (
                <button
                  key={chr.id}
                  type="button"
                  className={`chr-btn ${selectedChr === chr.id ? 'active' : ''}`}
                  onClick={() => setSelectedChr(chr.id)}
                >
                  {chr.label}
                  {upload && <span className="chr-count">{count}</span>}
                </button>
              );
            })}
          </div>
          {!upload && (
            <p className="text-muted">Upload data to see variant markers. Reference chromosome map shown.</p>
          )}
        </Card>

        <Card title={`Variants on Chr ${selectedChr}`}>
          {!upload ? (
            <p className="text-muted">No uploaded data — variants cannot be displayed.</p>
          ) : chrVariants.length === 0 ? (
            <p className="text-muted">No observed variants on this chromosome in uploaded file.</p>
          ) : (
            <div className="variant-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>rsID</th>
                    <th>Genotype</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chrVariants.slice(0, 50).map((v) => (
                    <VariantRow key={v.id} variant={v} />
                  ))}
                </tbody>
              </table>
              {chrVariants.length > 50 && (
                <p className="text-muted">Showing first 50 of {chrVariants.length} variants.</p>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card title="Reference Genes">
        <div className="gene-tabs">
          {REFERENCE_GENES.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`gene-tab ${selectedGeneId === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGeneId(g.id)}
            >
              {g.symbol}
            </button>
          ))}
        </div>
        {selectedGene && (
          <div className="gene-detail">
            <dl className="detail-dl">
              <dt>Gene</dt><dd>{selectedGene.symbol} — {selectedGene.name}</dd>
              <dt>Region</dt><dd>Chr {selectedGene.chromosome}:{selectedGene.start.toLocaleString()}–{selectedGene.end.toLocaleString()}</dd>
              <dt>Function</dt><dd>{resolveTiered(selectedGene.function, languageLevel)}</dd>
              <dt>Description</dt><dd>{resolveTiered(selectedGene.description, languageLevel)}</dd>
            </dl>
            <ProvenanceBadge provenance="reference-information" />
            <h4>Variants in uploaded data</h4>
            {!upload ? (
              <ObservedMarker observed={false} />
            ) : geneVariants.length === 0 ? (
              <>
                <ObservedMarker observed={false} />
                <p className="text-muted">No variants observed in this gene region in uploaded file. This does not mean none exist — consumer arrays do not measure every base.</p>
              </>
            ) : (
              <ul>
                {geneVariants.slice(0, 10).map((v) => (
                  <li key={v.id}>
                    <ObservedMarker observed /> pos {v.position} — {v.genotype} {v.rsId && `(${v.rsId})`}
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" onClick={() => navigate('/pathway-explorer')}>
              View related pathways →
            </Button>
          </div>
        )}
      </Card>

      {upload && (
        <Card title="Genome Simulation Editor" badge="SIMULATION COPY">
          <p className="sim-copy-notice">
            <strong>Original data ≠ Simulated genome.</strong> Create a simulation copy to explore conceptual variant changes without altering your uploaded file.
          </p>
          <div className="sim-copy-form">
            <input type="text" value={simCopyName} onChange={(e) => setSimCopyName(e.target.value)} placeholder="Copy name" />
            <Button onClick={createSimCopy}>Create Simulation Copy</Button>
          </div>
          {state.genomeSimulationCopies.map((copy) => (
            <div key={copy.id} className="sim-copy-card">
              <span className="simulation-badge-inline">SIMULATED</span>
              <h4>{copy.name}</h4>
              <p className="text-muted">Edited variants: {copy.editedVariantIds.length}</p>
              {copy.editedVariantIds.length === 0 && geneVariants[0] && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleVariantInCopy(copy.id, geneVariants[0].id, 'ALT/ALT')}
                >
                  Conceptually toggle first gene variant (demo)
                </Button>
              )}
              <EvidenceBadge level="speculative" note="Simulated variant consequence" />
              <p className="text-muted">
                {geneVariants.length > 0
                  ? 'Potential pathway consequence: model-dependent; insufficient information for clinical inference.'
                  : 'Insufficient information to model this change — no observed variants in selected gene.'}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function VariantRow({ variant }: { variant: GenomicVariant }) {
  return (
    <tr>
      <td>{variant.position.toLocaleString()}</td>
      <td>{variant.rsId ?? '—'}</td>
      <td>{variant.genotype}</td>
      <td><ObservedMarker observed={variant.observationStatus === 'observed'} /></td>
    </tr>
  );
}
