import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge, ObservedMarker, ProvenanceBadge } from '../components/ui/EvidenceBadge';
import { DnaHelixViewer } from '../components/genome/DnaHelixViewer';
import { resolveTiered } from '../content/language';
import { GENOME_PRIVACY_NOTICE, GENOME_NOT_DIAGNOSIS } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { parseGenomeFile, createSimulationCopy } from '../services/genomeParser';
import { getChromosomeVariants } from '../services/chromosomeUtils';
import { CHROMOSOMES, REFERENCE_GENES, findVariantsInGene } from '../data/genes';
import type { GenomicVariant } from '../types/scientific';

export function GenomeExplorerPage() {
  const { state, dispatch } = useAppState();
  const languageLevel = useLanguage();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedChr, setSelectedChr] = useState('17');
  const [selectedGeneId, setSelectedGeneId] = useState(REFERENCE_GENES[0]?.id ?? '');
  const [geneSearch, setGeneSearch] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [simCopyName, setSimCopyName] = useState('Simulation Copy');
  const [viewMode, setViewMode] = useState<'reference' | 'uploaded'>('uploaded');

  const upload = state.genomeUpload;
  const selectedGene = REFERENCE_GENES.find((g) => g.id === selectedGeneId);
  const geneVariants = upload && selectedGene
    ? findVariantsInGene(selectedGene.id, upload.variants)
    : [];

  const chrVariants = upload ? getChromosomeVariants(upload.variants, selectedChr) : [];

  const chrCounts = useMemo(() => {
    if (!upload) return {} as Record<string, number>;
    if (upload.importReport?.chromosomeCoverage) {
      return upload.importReport.chromosomeCoverage;
    }
    const counts: Record<string, number> = {};
    for (const chr of CHROMOSOMES) {
      counts[chr.id] = getChromosomeVariants(upload.variants, chr.id).length;
    }
    return counts;
  }, [upload]);

  const geneSearchResults = useMemo(() => {
    const q = geneSearch.trim().toLowerCase();
    if (!q) return [];
    return REFERENCE_GENES.filter(
      (g) =>
        g.symbol.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q),
    );
  }, [geneSearch]);

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

  const jumpToGene = (geneId: string) => {
    const gene = REFERENCE_GENES.find((g) => g.id === geneId);
    if (!gene) return;
    setSelectedGeneId(geneId);
    setSelectedChr(gene.chromosome);
    setGeneSearch('');
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

  const report = upload?.importReport;

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

      {report && (
        <Card title="Import Quality Report">
          <dl className="detail-dl import-report-dl">
            <dt>Total rows read</dt><dd>{report.totalRowsRead.toLocaleString()}</dd>
            <dt>Successfully parsed</dt><dd>{report.successfullyParsed.toLocaleString()}</dd>
            <dt>Chromosome-assigned</dt><dd>{report.chromosomeAssigned.toLocaleString()}</dd>
            <dt>Unsupported / unmapped</dt><dd>{report.unsupportedUnmapped.toLocaleString()}</dd>
            <dt>Malformed / skipped</dt><dd>{report.malformedSkipped.toLocaleString()}</dd>
            <dt>Detected genome build</dt><dd>{report.detectedBuild}</dd>
          </dl>
          {report.exclusionReasons.length > 0 && (
            <>
              <h4>Exclusion reasons</h4>
              <ul className="exclusion-list">
                {report.exclusionReasons.map((r) => (
                  <li key={r.reason}>{r.reason}: {r.count.toLocaleString()}</li>
                ))}
              </ul>
            </>
          )}
          <p className="text-muted">
            Chromosome totals should reconcile with assigned records. Unassigned records are listed above with reasons.
          </p>
        </Card>
      )}

      <Card title="Interactive Genome Visualisation">
        <div className="genome-view-toggle">
          <button type="button" className={`category-tab ${viewMode === 'reference' ? 'active' : ''}`} onClick={() => setViewMode('reference')}>
            Reference
          </button>
          <button type="button" className={`category-tab ${viewMode === 'uploaded' ? 'active' : ''}`} onClick={() => setViewMode('uploaded')} disabled={!upload}>
            Uploaded sample
          </button>
        </div>
        <DnaHelixViewer
          variants={viewMode === 'uploaded' && upload ? upload.variants : []}
          selectedGeneId={selectedGeneId}
          onSelectGene={jumpToGene}
          highlightChromosome={selectedChr}
        />
        <p className="text-muted">
          Navigate: Genome → Chromosome → Region → Gene → Variant. Sequence differences appear as markers, not helix deformation.
        </p>
      </Card>

      <Card title="Search Genes">
        <input
          type="search"
          className="search-input"
          placeholder="Search e.g. HTT, BRCA1, CFTR…"
          value={geneSearch}
          onChange={(e) => setGeneSearch(e.target.value)}
        />
        {geneSearchResults.length > 0 && (
          <ul className="search-results">
            {geneSearchResults.map((g) => (
              <li key={g.id}>
                <button type="button" className="search-result-btn" onClick={() => jumpToGene(g.id)}>
                  {g.symbol} — Chr {g.chromosome}
                </button>
              </li>
            ))}
          </ul>
        )}
        {geneSearch.trim() && geneSearchResults.length === 0 && (
          <p className="text-muted">No reference genes match. Only curated reference genes are searchable.</p>
        )}
      </Card>

      <div className="genome-layout">
        <Card title="Chromosomes">
          <div className="chr-grid">
            {CHROMOSOMES.map((chr) => {
              const count = chrCounts[chr.id] ?? 0;
              return (
                <button
                  key={chr.id}
                  type="button"
                  className={`chr-btn ${selectedChr === chr.id ? 'active' : ''}`}
                  onClick={() => setSelectedChr(chr.id)}
                >
                  {chr.label}
                  {upload && <span className="chr-count">{count.toLocaleString()}</span>}
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
                <p className="text-muted">Showing first 50 of {chrVariants.length.toLocaleString()} variants.</p>
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
              onClick={() => jumpToGene(g.id)}
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
            <Button variant="ghost" onClick={() => navigate(`/pathway-explorer?gene=${selectedGene.symbol}`)}>
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
