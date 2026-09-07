import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge, ObservedMarker, ProvenanceBadge } from '../components/ui/EvidenceBadge';
import { EntityActions } from '../components/ui/EntityActions';
import { GenomeBrowserView } from '../components/genome/GenomeBrowserView';
import { resolveTiered } from '../content/language';
import { GENOME_PRIVACY_NOTICE, GENOME_NOT_DIAGNOSIS } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState } from '../store/AppContext';
import { parseGenomeFile, createSimulationCopy } from '../services/genomeParser';
import { getChromosomeVariants } from '../services/chromosomeUtils';
import { searchGenomeNavigation, getGeneBySymbol } from '../services/genomeNavigation';
import { getGeneBySymbol as getCanonicalGene, imprintingNoteForGene } from '../services/geneReferenceService';
import { CHROMOSOMES, findVariantsInGene } from '../data/genes';
import { geneIndex, GENE_CATALOGUE } from '../catalogue/index';
import { filterUploadedVariants } from '../services/variantFilter';
import { getGenotypeNotationHelp, getGenotypeExplainContent } from '../services/genotypeNotation';
import { assessDataQualitySignals } from '../services/dataQualitySignalService';
import { ExplainThis } from '../components/ui/ExplainThis';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { EXPLAIN } from '../content/explainers';
import type { GenomicVariant } from '../types/scientific';
import type { EntityActionContext } from '../services/moduleActions';

export function GenomeExplorerPage() {
  const { state, dispatch } = useAppState();
  const languageLevel = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedChr, setSelectedChr] = useState('17');
  const [selectedGeneId, setSelectedGeneId] = useState(GENE_CATALOGUE[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [simCopyName, setSimCopyName] = useState('Simulation Copy');
  const [viewMode, setViewMode] = useState<'reference' | 'uploaded'>('reference');
  const [genePage, setGenePage] = useState(1);
  const [variantFilterQuery, setVariantFilterQuery] = useState('');
  const [showQualityDetails, setShowQualityDetails] = useState(false);
  const [navEpoch, setNavEpoch] = useState(0);

  const upload = state.genomeUpload;
  const selectedGene = geneIndex.getById(selectedGeneId) ?? null;
  const actionCtx: EntityActionContext = { dispatch, navigate };

  const searchResults = useMemo(
    () => searchGenomeNavigation(searchQuery, upload?.variants ?? []),
    [searchQuery, upload?.variants],
  );

  const chrCounts = useMemo(() => {
    if (!upload) return {} as Record<string, number>;
    if (upload.importReport?.chromosomeCoverage) return upload.importReport.chromosomeCoverage;
    const counts: Record<string, number> = {};
    for (const chr of CHROMOSOMES) counts[chr.id] = getChromosomeVariants(upload.variants, chr.id).length;
    return counts;
  }, [upload]);

  const chrVariants = upload ? getChromosomeVariants(upload.variants, selectedChr) : [];
  const filteredVariants = useMemo(
    () => filterUploadedVariants(chrVariants, variantFilterQuery),
    [chrVariants, variantFilterQuery],
  );
  const qualityAssessment = useMemo(
    () => (upload ? assessDataQualitySignals(upload) : null),
    [upload],
  );
  const geneVariants = upload && selectedGene ? findVariantsInGene(selectedGene.id, upload.variants) : [];

  const geneListPage = useMemo(
    () => geneIndex.query({ search: searchQuery.length > 2 ? '' : undefined, page: genePage, pageSize: 20, sortBy: 'name' }),
    [genePage, searchQuery],
  );

  useEffect(() => {
    const geneParam = searchParams.get('gene');
    if (geneParam) {
      const g = getCanonicalGene(geneParam) ?? getGeneBySymbol(geneParam);
      if (g) applyNavigation({ geneId: g.id, chromosome: g.chromosome });
    }
  }, [searchParams]);

  const applyNavigation = (target: { geneId?: string; chromosome?: string; view?: 'reference' | 'uploaded'; variantFilter?: string }) => {
    if (target.chromosome) setSelectedChr(target.chromosome);
    if (target.geneId !== undefined) {
      setSelectedGeneId(target.geneId);
      const g = geneIndex.getById(target.geneId);
      if (g) {
        const idx = GENE_CATALOGUE.findIndex((entry) => entry.id === g.id);
        if (idx >= 0) setGenePage(Math.floor(idx / 20) + 1);
      }
    }
    if (target.view) setViewMode(target.view);
    if (target.variantFilter !== undefined) setVariantFilterQuery(target.variantFilter);
    setSearchQuery('');
    setNavEpoch((n) => n + 1);
  };

  const navigateToGene = (geneId: string, chr?: string) => {
    const g = geneIndex.getById(geneId);
    applyNavigation({ geneId, chromosome: g?.chromosome ?? chr ?? selectedChr });
  };

  const handleSearchSelect = (result: ReturnType<typeof searchGenomeNavigation>[0]) => {
    if (result.target.type === 'gene' && result.target.geneId) {
      navigateToGene(result.target.geneId, result.target.chromosome);
    } else if (result.target.type === 'chromosome' && result.target.chromosome) {
      applyNavigation({ geneId: '', chromosome: result.target.chromosome });
    } else if (result.target.type === 'cytoband' && result.target.chromosome) {
      applyNavigation({ geneId: '', chromosome: result.target.chromosome });
    } else if (result.target.type === 'variant' && result.target.chromosome) {
      applyNavigation({
        geneId: '',
        chromosome: result.target.chromosome,
        view: 'uploaded',
        variantFilter: result.target.label?.startsWith('rs') ? result.target.label : String(result.target.position ?? ''),
      });
    }
  };

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
    setViewMode('uploaded');
  };

  const report = upload?.importReport;

  return (
    <div className="genome-page">
      <PageHeader
        title="Genome Explorer"
        subtitle="Educational genome browser — not clinical diagnosis"
        actions={
          <>
            <ExplainThis title="Gene" content={EXPLAIN.gene} />
            <ProvenanceBadge provenance="real-user-data" />
          </>
        }
      />

      <div className="genome-notices">
        <p>{resolveTiered(GENOME_PRIVACY_NOTICE, languageLevel)}</p>
        <p>{resolveTiered(GENOME_NOT_DIAGNOSIS, languageLevel)}</p>
      </div>

      <AboutThisTool
        title="Understanding this view"
        whatIsThis="This view shows genetic information arranged along a chromosome. Genes and variants are positioned according to their genomic coordinates."
        whyUseIt="Researchers use genome browsers to explore where genes and genetic variants are located and how they relate to pathways or other biological context."
        whatCanILearn="You can search for genes or variants, inspect available genotype information from an uploaded file, and open related pathway or therapeutic context."
        caveat="Uploaded consumer genotype files contain sampled markers — not a complete genome. Educational exploration is not clinical diagnosis."
        defaultOpen
      />

      <Card title="Genome Search & Navigation">
        <input
          type="search"
          className="search-input"
          placeholder="Gene (HTT), chromosome (chr4), cytoband (11p15.5), or rsID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchResults.length === 1) {
              e.preventDefault();
              handleSearchSelect(searchResults[0]);
            }
          }}
        />
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.slice(0, 12).map((r, i) => (
              <li key={i}>
                <button type="button" className="search-result-btn" onClick={() => handleSearchSelect(r)}>
                  <span className="search-result-type">{r.matchType}</span> {r.detail}
                </button>
              </li>
            ))}
          </ul>
        )}
        {searchQuery.trim() && searchResults.length === 0 && (
          <p className="text-muted">No matching gene, chromosome, cytoband, or uploaded variant. Try TP53, chr17, or 17p13.1.</p>
        )}
      </Card>

      <Card title="Upload Genotype File (Local Processing Only)">
        <input ref={fileRef} type="file" accept=".txt,.csv,.vcf,.tsv" className="file-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        {loading && <p className="text-muted">Parsing locally…</p>}
        {parseError && <p className="error-text">{parseError}</p>}
        {upload && (
          <div className="upload-summary">
            <EvidenceBadge level="established" note="User uploaded file" />
            <p><strong>{upload.fileName}</strong> — {upload.variantCount.toLocaleString()} variants ({upload.sourceFormat}). Local only.</p>
            <Button variant="secondary" onClick={() => dispatch({ type: 'SET_GENOME_UPLOAD', payload: null })}>Clear uploaded data</Button>
          </div>
        )}
      </Card>

      {report && (
        <Card title="Import Quality Report">
          <dl className="detail-dl import-report-dl">
            <dt>Total records</dt><dd>{report.totalRowsRead.toLocaleString()}</dd>
            <dt>Parsed</dt><dd>{report.successfullyParsed.toLocaleString()}</dd>
            <dt>Chromosome-assigned</dt><dd>{report.chromosomeAssigned.toLocaleString()}</dd>
            <dt>Skipped/invalid</dt><dd>{(report.malformedSkipped + report.unsupportedUnmapped).toLocaleString()}</dd>
            <dt>Genome build</dt><dd>{report.detectedBuild}</dd>
          </dl>
          <h4>Variant count by chromosome</h4>
          <div className="chr-count-grid">
            {CHROMOSOMES.map((c) => (
              <span key={c.id} className="chr-count-pill">{c.label}: {(chrCounts[c.id] ?? 0).toLocaleString()}</span>
            ))}
          </div>
        </Card>
      )}

      {upload && qualityAssessment && (
        <Card title="Potential signals / data quality">
          <p className="structural-summary">{qualityAssessment.summaryLabel}</p>
          <p className="text-muted">{qualityAssessment.limitations}</p>
          <button type="button" className="link-btn" onClick={() => setShowQualityDetails((v) => !v)}>
            {showQualityDetails ? 'Hide details' : 'Evidence / details'}
          </button>
          {showQualityDetails && (
            <div className="structural-details">
              {qualityAssessment.signals.length === 0 ? (
                <p className="text-muted">No potential data-quality signals flagged from this dataset.</p>
              ) : (
                <ul>
                  {qualityAssessment.signals.map((s) => (
                    <li key={s.id}>
                      <strong>{s.label}</strong> — {s.observation}
                      <br />
                      <span className="text-muted">{s.disclaimer}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      <Card title="Interactive Genome Browser">
        <div className="genome-view-toggle">
          <button type="button" className={`category-tab ${viewMode === 'reference' ? 'active' : ''}`} onClick={() => setViewMode('reference')}>Reference</button>
          <button type="button" className={`category-tab ${viewMode === 'uploaded' ? 'active' : ''}`} onClick={() => setViewMode('uploaded')} disabled={!upload}>Uploaded sample overlay</button>
        </div>
        <GenomeBrowserView
          key={`${selectedGeneId}-${selectedChr}-${navEpoch}`}
          variants={viewMode === 'uploaded' && upload ? upload.variants : []}
          selectedGene={selectedGene}
          chromosome={selectedChr}
          viewMode={viewMode}
          navigationTarget={selectedGene ? { type: 'gene', chromosome: selectedGene.chromosome, geneId: selectedGene.id, geneSymbol: selectedGene.symbol, label: selectedGene.symbol } : { type: 'chromosome', chromosome: selectedChr, label: `Chr ${selectedChr}` }}
        />
        <p className="text-muted">Conceptual visualisation — consumer genotype files contain sampled variants, not a complete genome sequence. Unobserved regions remain reference context.</p>
        {selectedGene && (
          <>
            <Button variant="secondary" onClick={() => navigateToGene(selectedGene.id, selectedGene.chromosome)}>Centre on {selectedGene.symbol}</Button>
            <EntityActions ctx={actionCtx} gene={selectedGene} />
          </>
        )}
      </Card>

      <div className="genome-layout">
        <Card title="Chromosomes">
          <p className="text-muted card-edu-line">
            <ExplainThis title="Chromosome" content={EXPLAIN.chromosome} /> Select a chromosome to focus the browser and uploaded-variant list.
          </p>
          <div className="chr-grid">
            {CHROMOSOMES.map((chr) => (
              <button key={chr.id} type="button" className={`chr-btn ${selectedChr === chr.id ? 'active' : ''}`} onClick={() => applyNavigation({ geneId: '', chromosome: chr.id })}>
                {chr.label}
                {upload && <span className="chr-count">{(chrCounts[chr.id] ?? 0).toLocaleString()}</span>}
              </button>
            ))}
          </div>
        </Card>

        <Card title={`Variants on Chr ${selectedChr}`}>
          <p className="text-muted card-edu-line">
            <ExplainThis title="Variant" content={EXPLAIN.variant} />{' '}
            <ExplainThis title="Genotype" content={EXPLAIN.genotype} />{' '}
            <ExplainThis title="Position" content={EXPLAIN.position} />{' '}
            <ExplainThis title="rsID" content={EXPLAIN.rsId} />{' '}
            <ExplainThis title="Status" content={EXPLAIN.observedStatus} />
          </p>
          {!upload ? <p className="text-muted">Upload data to see variant markers.</p>
            : chrVariants.length === 0 ? <p className="text-muted">No variants on this chromosome in uploaded file.</p>
            : (
              <>
                <div className="variant-filter-row">
                  <input
                    type="search"
                    className="search-input compact"
                    placeholder="Filter: position, range, rsID, genotype…"
                    value={variantFilterQuery}
                    onChange={(e) => setVariantFilterQuery(e.target.value)}
                  />
                  {variantFilterQuery && (
                    <button type="button" className="filter-btn" onClick={() => setVariantFilterQuery('')}>Clear</button>
                  )}
                </div>
                {filteredVariants.message && <p className="text-muted">{filteredVariants.message}</p>}
                <VariantTable
                  variants={filteredVariants.variants.slice(0, 50)}
                  total={filteredVariants.variants.length}
                  sourceFormat={upload.sourceFormat}
                  highlightId={filteredVariants.highlightId}
                />
              </>
            )}
        </Card>
      </div>

      <Card title={`Gene Catalogue (${GENE_CATALOGUE.length} reference genes)`}>
        <div className="gene-tabs gene-tabs-scroll">
          {geneListPage.items.map((g) => (
            <button key={g.id} type="button" className={`gene-tab ${selectedGeneId === g.id ? 'active' : ''}`} onClick={() => navigateToGene(g.id, g.chromosome)}>
              {g.symbol}
            </button>
          ))}
        </div>
        <div className="pagination">
          <button type="button" disabled={genePage <= 1} onClick={() => setGenePage((p) => p - 1)}>Previous</button>
          <span>Page {geneListPage.page} of {geneListPage.totalPages}</span>
          <button type="button" disabled={genePage >= geneListPage.totalPages} onClick={() => setGenePage((p) => p + 1)}>Next</button>
        </div>
        {selectedGene && (
          <div className="gene-detail">
            <dl className="detail-dl">
              <dt>Gene <ExplainThis title="Gene" content={EXPLAIN.gene} /></dt><dd>{selectedGene.symbol} — {selectedGene.fullName}</dd>
              <dt>Chromosome <ExplainThis title="Chromosome" content={EXPLAIN.chromosome} /></dt>
              <dd>Chr {selectedGene.chromosome} · {selectedGene.cytoband} · {selectedGene.start.toLocaleString()}–{selectedGene.end.toLocaleString()}</dd>
              <dt>Function</dt><dd>{resolveTiered(selectedGene.function, languageLevel)}</dd>
            </dl>
            {imprintingNoteForGene(selectedGene.symbol) && (
              <p className="text-muted imprinting-note">{imprintingNoteForGene(selectedGene.symbol)}</p>
            )}
            <h4>Uploaded variants in region</h4>
            {!upload ? <ObservedMarker observed={false} /> : geneVariants.length === 0 ? (
              <p className="text-muted">No observed variants in this gene region. Consumer arrays do not measure every base.</p>
            ) : (
              <ul>{geneVariants.slice(0, 10).map((v) => (
                <li key={v.id}>
                  <ObservedMarker observed /> {v.position} — <GenotypeCell genotype={v.genotype} sourceFormat={upload?.sourceFormat} />
                </li>
              ))}</ul>
            )}
          </div>
        )}
      </Card>

      {upload && (
        <Card title="Genome Simulation Editor" badge="SIMULATION COPY">
          <p className="sim-copy-notice"><strong>Original data ≠ Simulated genome.</strong></p>
          <div className="sim-copy-form">
            <input type="text" value={simCopyName} onChange={(e) => setSimCopyName(e.target.value)} />
            <Button onClick={() => dispatch({ type: 'ADD_GENOME_SIM_COPY', payload: createSimulationCopy(upload, simCopyName) })}>Create Simulation Copy</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function GenotypeCell({ genotype, sourceFormat }: { genotype: string; sourceFormat?: string }) {
  const explain = getGenotypeExplainContent(genotype, sourceFormat);
  const indel = getGenotypeNotationHelp(genotype, sourceFormat);
  if (!explain) return <>{genotype}</>;
  return (
    <span className="genotype-with-help">
      {genotype}
      <ExplainThis
        title={indel ? `What does ${genotype} mean?` : `Genotype ${genotype}`}
        content={explain}
        ariaLabel={`Explain genotype ${genotype}`}
      />
    </span>
  );
}

function VariantTable({ variants, total, sourceFormat, highlightId }: { variants: GenomicVariant[]; total: number; sourceFormat?: string; highlightId?: string | null }) {
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightId, variants]);

  return (
    <div className="variant-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Position <ExplainThis title="Position" content={EXPLAIN.position} /></th>
            <th>rsID <ExplainThis title="rsID" content={EXPLAIN.rsId} /></th>
            <th>Genotype <ExplainThis title="Genotype" content={EXPLAIN.genotype} /></th>
            <th>Status <ExplainThis title="Status" content={EXPLAIN.observedStatus} /></th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr
              key={v.id}
              ref={v.id === highlightId ? highlightRef : undefined}
              className={v.id === highlightId ? 'variant-highlight' : undefined}
            >
              <td>{v.position.toLocaleString()}</td>
              <td>{v.rsId ?? '—'}</td>
              <td><GenotypeCell genotype={v.genotype} sourceFormat={sourceFormat} /></td>
              <td><ObservedMarker observed /> <ExplainThis title="Observed status" content={EXPLAIN.observedStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {total > 50 && <p className="text-muted">Showing 50 of {total.toLocaleString()}.</p>}
    </div>
  );
}
