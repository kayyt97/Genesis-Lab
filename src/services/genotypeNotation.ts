import type { ExplainContent } from '../components/ui/ExplainThis';

export interface GenotypeNotationHelp {
  label: string;
  /** Short one-line summary for titles */
  explanation: string;
  /** Full structured beginner explanation */
  explain: ExplainContent;
  sourceAware?: boolean;
}

function indelExplain(
  label: string,
  bothOrMixed: string,
  sourceFormat?: string,
): GenotypeNotationHelp {
  const formatNote =
    sourceFormat === '23andme' || sourceFormat === 'ancestry'
      ? ` In this uploaded ${sourceFormat === 'ancestry' ? 'Ancestry' : '23andMe'}-style file, I usually means insertion and D means deletion at this marker — not an extra or missing whole chromosome.`
      : ' Exact I/D meaning depends on the source file’s allele coding; it is not universal across all genetic datasets.';

  return {
    label,
    explanation: `${bothOrMixed}${formatNote}`,
    sourceAware: true,
    explain: {
      whatIsIt: `What does ${label} mean? Here, ${bothOrMixed}`,
      whatResultMeans:
        `What does this tell me? It summarises the allele coding recorded for this marker in the uploaded file.${formatNote}`,
      whatItDoesNotMean:
        'What does it NOT tell me? It does not establish disease, health status, chromosome number, or a clinical diagnosis. Genotype codes are format-dependent.',
      whyItMatters: 'Understanding notation prevents mistaking indel codes for karyotype findings.',
    },
  };
}

const INDEL_BUILDERS: Record<string, (fmt?: string) => GenotypeNotationHelp> = {
  II: (fmt) =>
    indelExplain(
      'II',
      'II indicates that both genotype alleles are represented as the insertion form (I/I) for this particular variant notation.',
      fmt,
    ),
  DD: (fmt) =>
    indelExplain(
      'DD',
      'DD indicates that both genotype alleles are represented as the deletion form (D/D) for this particular variant notation.',
      fmt,
    ),
  DI: (fmt) =>
    indelExplain(
      'DI',
      'DI indicates a heterozygous indel coding — one deletion allele and one insertion allele at this marker in this file’s notation.',
      fmt,
    ),
  ID: (fmt) =>
    indelExplain(
      'ID',
      'ID indicates a heterozygous indel coding — one insertion allele and one deletion allele at this marker in this file’s notation.',
      fmt,
    ),
};

/** SNP-style letter genotypes (e.g. AG) — educational, not clinical. */
export function getSnpGenotypeExplain(genotype: string): ExplainContent | null {
  const g = genotype.trim().toUpperCase();
  if (!/^[ACGT]{1,2}$/.test(g) && !/^[ACGT]{2}$/.test(g)) {
    if (!/^[ACGT][ACGT]$/.test(g)) return null;
  }
  if (!/^[ACGT]{2}$/.test(g)) return null;
  const a = g[0];
  const b = g[1];
  const homo = a === b;
  return {
    whatIsIt: homo
      ? `Genotype ${g} usually means both alleles at this SNP are reported as ${a} (homozygous) in this file’s coding.`
      : `Genotype ${g} usually means one allele is reported as ${a} and the other as ${b} (heterozygous) in this file’s coding.`,
    whatResultMeans:
      'Letter codes typically refer to DNA bases (A, C, G, T) at a single-nucleotide polymorphism. Strand and reference-allele conventions can differ by dataset.',
    whatItDoesNotMean:
      'This genotype alone does not diagnose disease or prove a trait. It is an educational display of uploaded marker data.',
  };
}

export function getGenotypeNotationHelp(genotype: string, sourceFormat?: string): GenotypeNotationHelp | null {
  const key = genotype.trim().toUpperCase();
  const builder = INDEL_BUILDERS[key];
  if (builder) return builder(sourceFormat);
  return null;
}

export function isIndelGenotypeNotation(genotype: string): boolean {
  return ['II', 'DD', 'DI', 'ID'].includes(genotype.trim().toUpperCase());
}

/** Structured explain content for any displayed genotype cell. */
export function getGenotypeExplainContent(genotype: string, sourceFormat?: string): ExplainContent | null {
  const indel = getGenotypeNotationHelp(genotype, sourceFormat);
  if (indel) return indel.explain;
  return getSnpGenotypeExplain(genotype);
}
