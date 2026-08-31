import type { GenomeUpload, GenomicVariant } from '../types/scientific';
import { CHROMOSOMES } from '../data/genes';
import { getChromosomeVariants } from './chromosomeUtils';

export interface DataQualitySignal {
  id: string;
  category: 'coverage' | 'genotype-call' | 'duplicate' | 'sex-chromosome' | 'sparse';
  label: string;
  observation: string;
  disclaimer: string;
}

export interface DataQualityAssessment {
  summaryLabel: string;
  reviewRecommended: boolean;
  signals: DataQualitySignal[];
  limitations: string;
}

const NON_DIAGNOSTIC =
  'Potential signal — not diagnostic. May reflect platform coverage or file characteristics. Confirmation requires an appropriate validated genetic test.';

function detectDuplicatePositions(variants: GenomicVariant[]): DataQualitySignal[] {
  const byKey = new Map<string, GenomicVariant[]>();
  for (const v of variants) {
    const key = `${v.chromosome}:${v.position}`;
    const list = byKey.get(key) ?? [];
    list.push(v);
    byKey.set(key, list);
  }
  const dupes = [...byKey.entries()].filter(([, list]) => list.length > 1).slice(0, 5);
  return dupes.map(([key, list]) => ({
    id: `dupe-${key}`,
    category: 'duplicate' as const,
    label: `Duplicate position entries: ${key}`,
    observation: `${list.length} records share the same chromosome:position with genotypes ${list.map((v) => v.genotype).join(', ')}.`,
    disclaimer: NON_DIAGNOSTIC,
  }));
}

function detectUnusualGenotypes(variants: GenomicVariant[]): DataQualitySignal[] {
  const indel = variants.filter((v) => ['II', 'DD', 'DI', 'ID'].includes(v.genotype.toUpperCase()));
  if (indel.length === 0) return [];
  return [{
    id: 'indel-notation',
    category: 'genotype-call',
    label: 'Insertion/deletion genotype notation detected',
    observation: `${indel.length} variant(s) use I/D notation — source-format dependent; not an extra chromosome.`,
    disclaimer: NON_DIAGNOSTIC,
  }];
}

function detectSexChromosomePatterns(upload: GenomeUpload): DataQualitySignal[] {
  const xCount = getChromosomeVariants(upload.variants, 'X').length;
  const yCount = getChromosomeVariants(upload.variants, 'Y').length;
  const signals: DataQualitySignal[] = [];
  if (yCount === 0 && xCount > 0) {
    signals.push({
      id: 'sex-no-y',
      category: 'sex-chromosome',
      label: 'No Y-chromosome variants observed',
      observation: `X chromosome: ${xCount.toLocaleString()} variants; Y: 0. This may reflect sample sex or array coverage — not a diagnosis.`,
      disclaimer: NON_DIAGNOSTIC,
    });
  }
  if (yCount > 0 && xCount > 0 && Math.abs(xCount - yCount) > xCount * 0.5) {
    signals.push({
      id: 'sex-xy-asymmetry',
      category: 'sex-chromosome',
      label: 'Uneven X/Y variant counts',
      observation: `X: ${xCount.toLocaleString()}, Y: ${yCount.toLocaleString()} — may reflect platform coverage, not chromosome number.`,
      disclaimer: NON_DIAGNOSTIC,
    });
  }
  return signals;
}

/** Conservative data-quality assessment for uploaded genotype files. */
export function assessDataQualitySignals(upload: GenomeUpload): DataQualityAssessment {
  const signals: DataQualitySignal[] = [
    ...detectDuplicatePositions(upload.variants),
    ...detectUnusualGenotypes(upload.variants),
    ...detectSexChromosomePatterns(upload),
  ];

  for (const chr of CHROMOSOMES) {
    const count = getChromosomeVariants(upload.variants, chr.id).length;
    if (count === 0 && (upload.importReport?.chromosomeCoverage[chr.id] ?? 0) === 0 && chr.id !== 'Y') {
      signals.push({
        id: `sparse-${chr.id}`,
        category: 'sparse',
        label: `Chr ${chr.label}: no variants observed`,
        observation: 'No uploaded variants on this chromosome — may reflect array coverage gaps.',
        disclaimer: NON_DIAGNOSTIC,
      });
    }
  }

  const reviewRecommended = signals.some((s) => s.category !== 'genotype-call');
  const capped = signals.slice(0, 8);

  return {
    summaryLabel: capped.length === 0
      ? 'Potential signals / data quality: 0'
      : `Potential signals / data quality: ${capped.length}${reviewRecommended ? ' — Review' : ''}`,
    reviewRecommended,
    signals: capped,
    limitations:
      'Consumer SNP/genotype files cannot reliably diagnose trisomy, monosomy, large deletions/duplications, mosaicism, translocations, methylation abnormalities, or most structural variants. Genesis flags only observable file/data patterns.',
  };
}
