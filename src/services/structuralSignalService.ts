import type { GenomeUpload } from '../types/scientific';
import { CHROMOSOMES } from '../data/genes';
import { getChromosomeVariants } from './chromosomeUtils';

export type GenomicDataCapability = 'consumer-snp' | 'sparse-genotype' | 'structural-vcf' | 'unknown';

export interface StructuralSignal {
  id: string;
  category: 'coverage-gap' | 'variant-density' | 'cnv' | 'mosaic' | 'whole-chromosome';
  label: string;
  observation: string;
  evidenceLevel: 'low' | 'moderate' | 'high';
  limitation: string;
  confirmatoryNote: string;
}

export interface StructuralSignalAssessment {
  capability: GenomicDataCapability;
  summaryCount: number;
  summaryLabel: string;
  reviewRecommended: boolean;
  signals: StructuralSignal[];
  limitations: string;
  educationalNote: string;
}

function getDataCapability(upload: GenomeUpload): GenomicDataCapability {
  if (upload.sourceFormat === '23andme' || upload.sourceFormat === 'ancestry') return 'consumer-snp';
  if (upload.sourceFormat.toLowerCase().includes('vcf') && upload.variantCount > 0) {
    return 'structural-vcf';
  }
  if (upload.variantCount < 500) return 'sparse-genotype';
  return 'unknown';
}

export function assessStructuralSignals(upload: GenomeUpload): StructuralSignalAssessment {
  const capability = getDataCapability(upload);

  if (capability === 'consumer-snp' || capability === 'sparse-genotype') {
    return {
      capability,
      summaryCount: 0,
      summaryLabel: 'Insufficient data to assess structural anomalies',
      reviewRecommended: false,
      signals: [],
      limitations:
        'Consumer SNP/genotype files contain sampled variant positions only. They cannot reliably detect whole-chromosome gain/loss (e.g. trisomy), large deletions/duplications, or copy-number changes without dedicated CNV/SV or cytogenetic data.',
      educationalNote:
        'An extra whole chromosome (e.g. trisomy) is different from an extra copy of a gene segment (duplication/CNV gain). Genesis does not diagnose either from sparse SNP data.',
    };
  }

  const signals: StructuralSignal[] = [];
  for (const chr of CHROMOSOMES) {
    const count = getChromosomeVariants(upload.variants, chr.id).length;
    const expectedMin = chr.id === 'MT' ? 5 : 100;
    if (count === 0 && upload.importReport && (upload.importReport.chromosomeCoverage[chr.id] ?? 0) === 0) {
      signals.push({
        id: `gap-${chr.id}`,
        category: 'coverage-gap',
        label: `Chr ${chr.label}: no observed variants`,
        observation: `No variants observed on chromosome ${chr.label} in this upload.`,
        evidenceLevel: 'low',
        limitation: 'May reflect array coverage gaps rather than a structural abnormality.',
        confirmatoryNote: 'Possible signal — requires confirmatory testing (e.g. karyotype, microarray, or sequencing).',
      });
    } else if (count > 0 && count < expectedMin / 10) {
      signals.push({
        id: `density-${chr.id}`,
        category: 'variant-density',
        label: `Chr ${chr.label}: sparse coverage`,
        observation: `Only ${count} variants observed — lower than typical for this reference chromosome.`,
        evidenceLevel: 'low',
        limitation: 'Sparse SNP density cannot assess copy-number or large structural variants.',
        confirmatoryNote: 'Possible signal — requires confirmatory testing.',
      });
    }
  }

  const reviewRecommended = signals.some((s) => s.evidenceLevel !== 'high');

  return {
    capability,
    summaryCount: signals.length,
    summaryLabel: signals.length === 0
      ? 'Structural signals: 0'
      : `Structural signals: ${signals.length}${reviewRecommended ? ' — Review' : ''}`,
    reviewRecommended,
    signals,
    limitations: 'Assessment based on uploaded variant coverage only — not a clinical structural variant caller.',
    educationalNote:
      'Whole-chromosome changes and segmental CNVs require appropriate data types. Educational/non-clinical analysis only.',
  };
}
