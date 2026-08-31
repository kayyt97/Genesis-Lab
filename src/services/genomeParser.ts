import type { GenomicVariant, GenomeUpload, GenomeImportReport } from '../types/scientific';
import { normalizeChromosome, buildChromosomeCounts } from './chromosomeUtils';

export interface ParseResult {
  success: boolean;
  upload?: GenomeUpload;
  error?: string;
}

function detectGenomeBuild(content: string): string {
  if (content.includes('GRCh38') || content.includes('build 38')) return 'GRCh38 (detected)';
  if (content.includes('GRCh37') || content.includes('build 37')) return 'GRCh37 (detected)';
  if (content.includes('b36')) return 'NCBI36/b36 (detected)';
  return 'unknown';
}

function emptyReport(): GenomeImportReport {
  return {
    totalRowsRead: 0,
    successfullyParsed: 0,
    chromosomeAssigned: 0,
    unsupportedUnmapped: 0,
    malformedSkipped: 0,
    chromosomeCoverage: {},
    detectedBuild: 'unknown',
    exclusionReasons: [],
  };
}

function parse23andMe(content: string, fileName: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const variants: GenomicVariant[] = [];
  const report = emptyReport();
  const exclusionMap = new Map<string, number>();

  const addExclusion = (reason: string) => {
    exclusionMap.set(reason, (exclusionMap.get(reason) ?? 0) + 1);
  };

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    report.totalRowsRead++;

    const parts = line.split('\t');
    if (parts.length < 4) {
      report.malformedSkipped++;
      addExclusion('Fewer than 4 tab-separated fields');
      continue;
    }

    const [rsid, chromosomeRaw, positionRaw, genotype] = parts;
    if (rsid === 'rsid' || chromosomeRaw === 'chromosome') continue;

    if (!chromosomeRaw?.trim() || !positionRaw?.trim()) {
      report.malformedSkipped++;
      addExclusion('Missing chromosome or position');
      continue;
    }

    const genotypeClean = genotype?.trim() ?? '';
    if (!genotypeClean || genotypeClean === '--' || genotypeClean === 'NA') {
      report.malformedSkipped++;
      addExclusion('Missing or no-call genotype (--/NA)');
      continue;
    }

    const position = parseInt(positionRaw.trim(), 10);
    if (Number.isNaN(position) || position < 0) {
      report.malformedSkipped++;
      addExclusion('Invalid position');
      continue;
    }

    const { normalized, reason } = normalizeChromosome(chromosomeRaw);
    if (!normalized) {
      report.unsupportedUnmapped++;
      addExclusion(reason === 'unsupported' ? `Unsupported chromosome: ${chromosomeRaw.trim()}` : 'Malformed chromosome identifier');
      continue;
    }

    variants.push({
      id: `VAR-${variants.length + 1}`,
      chromosome: normalized,
      position,
      rsId: rsid.startsWith('rs') ? rsid.trim() : undefined,
      referenceAllele: '',
      alternateAllele: '',
      genotype: genotypeClean,
      observationStatus: 'observed',
    });
    report.successfullyParsed++;
    report.chromosomeAssigned++;
  }

  if (variants.length === 0) {
    return { success: false, error: 'No valid genotype rows found in 23andMe-format file.' };
  }

  report.chromosomeCoverage = buildChromosomeCounts(variants);
  report.detectedBuild = detectGenomeBuild(content);
  report.exclusionReasons = [...exclusionMap.entries()].map(([reason, count]) => ({ reason, count }));

  return {
    success: true,
    upload: {
      id: `GEN-${Date.now().toString(36)}`,
      fileName,
      sourceFormat: '23andme',
      uploadedAt: new Date().toISOString(),
      variants,
      variantCount: variants.length,
      isPersisted: false,
      importReport: report,
    },
  };
}

function parseAncestry(content: string, fileName: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const variants: GenomicVariant[] = [];
  const report = emptyReport();
  const exclusionMap = new Map<string, number>();

  const addExclusion = (reason: string) => {
    exclusionMap.set(reason, (exclusionMap.get(reason) ?? 0) + 1);
  };

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    report.totalRowsRead++;

    const parts = line.split('\t');
    if (parts.length < 5) {
      report.malformedSkipped++;
      addExclusion('Fewer than 5 tab-separated fields');
      continue;
    }

    const [rsid, , chromosomeRaw, positionRaw, allele1, allele2] = parts;
    if (rsid === 'rsid') continue;

    const genotype = `${(allele1 ?? '').trim()}${(allele2 ?? '').trim()}`;
    if (!chromosomeRaw?.trim() || !positionRaw?.trim() || !genotype || genotype.includes('0')) {
      report.malformedSkipped++;
      addExclusion('Missing fields or invalid alleles');
      continue;
    }

    const position = parseInt(positionRaw.trim(), 10);
    if (Number.isNaN(position)) {
      report.malformedSkipped++;
      addExclusion('Invalid position');
      continue;
    }

    const { normalized, reason } = normalizeChromosome(chromosomeRaw);
    if (!normalized) {
      report.unsupportedUnmapped++;
      addExclusion(reason === 'unsupported' ? `Unsupported chromosome: ${chromosomeRaw.trim()}` : 'Malformed chromosome');
      continue;
    }

    variants.push({
      id: `VAR-${variants.length + 1}`,
      chromosome: normalized,
      position,
      rsId: rsid.startsWith('rs') ? rsid.trim() : undefined,
      referenceAllele: allele1?.trim() ?? '',
      alternateAllele: allele2?.trim() ?? '',
      genotype,
      observationStatus: 'observed',
    });
    report.successfullyParsed++;
    report.chromosomeAssigned++;
  }

  if (variants.length === 0) {
    return { success: false, error: 'No valid genotype rows found in Ancestry-format file.' };
  }

  report.chromosomeCoverage = buildChromosomeCounts(variants);
  report.detectedBuild = detectGenomeBuild(content);
  report.exclusionReasons = [...exclusionMap.entries()].map(([reason, count]) => ({ reason, count }));

  return {
    success: true,
    upload: {
      id: `GEN-${Date.now().toString(36)}`,
      fileName,
      sourceFormat: 'ancestry',
      uploadedAt: new Date().toISOString(),
      variants,
      variantCount: variants.length,
      isPersisted: false,
      importReport: report,
    },
  };
}

function parseVCF(content: string, fileName: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const variants: GenomicVariant[] = [];
  const report = emptyReport();
  const exclusionMap = new Map<string, number>();

  for (const line of lines) {
    if (line.startsWith('#')) continue;
    report.totalRowsRead++;

    const parts = line.split('\t');
    if (parts.length < 10) {
      report.malformedSkipped++;
      exclusionMap.set('Insufficient VCF columns', (exclusionMap.get('Insufficient VCF columns') ?? 0) + 1);
      continue;
    }

    const [chromRaw, posRaw, , ref, alt, , , , , sample] = parts;
    const position = parseInt(posRaw, 10);
    if (Number.isNaN(position)) {
      report.malformedSkipped++;
      continue;
    }

    const { normalized, reason } = normalizeChromosome(chromRaw);
    if (!normalized) {
      report.unsupportedUnmapped++;
      exclusionMap.set(reason === 'unsupported' ? `Unsupported contig: ${chromRaw}` : 'Malformed contig', (exclusionMap.get(reason ?? '') ?? 0) + 1);
      continue;
    }

    const gtMatch = sample.match(/(\d)[/|](\d)/);
    const genotype = gtMatch ? `${ref}${alt}` : sample.split(':')[0];

    variants.push({
      id: `VAR-${variants.length + 1}`,
      chromosome: normalized,
      position,
      referenceAllele: ref,
      alternateAllele: alt,
      genotype,
      observationStatus: 'observed',
    });
    report.successfullyParsed++;
    report.chromosomeAssigned++;
  }

  if (variants.length === 0) {
    return { success: false, error: 'No variant rows found in VCF file.' };
  }

  report.chromosomeCoverage = buildChromosomeCounts(variants);
  report.detectedBuild = detectGenomeBuild(content);
  report.exclusionReasons = [...exclusionMap.entries()].map(([reason, count]) => ({ reason, count }));

  return {
    success: true,
    upload: {
      id: `GEN-${Date.now().toString(36)}`,
      fileName,
      sourceFormat: 'vcf',
      uploadedAt: new Date().toISOString(),
      variants,
      variantCount: variants.length,
      isPersisted: false,
      importReport: report,
    },
  };
}

export function detectFormat(content: string, fileName: string): '23andme' | 'ancestry' | 'vcf' | 'unknown' {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.vcf') || lower.endsWith('.vcf.gz')) return 'vcf';
  const head = content.slice(0, 4000);
  if (head.includes('##fileformat=VCF')) return 'vcf';
  if (head.includes('rsid\tchromosome\tposition\tgenotype')) return '23andme';
  if (head.includes('rsid\tchromosome\tposition\tallele1\tallele2')) return 'ancestry';
  if (/^rs\d+\t/i.test(content.slice(0, 500))) return '23andme';
  return 'unknown';
}

export async function parseGenomeFile(file: File): Promise<ParseResult> {
  if (file.size > 100 * 1024 * 1024) {
    return { success: false, error: 'File exceeds 100 MB limit for local parsing.' };
  }

  let content: string;
  try {
    content = await file.text();
  } catch {
    return { success: false, error: 'Could not read file.' };
  }

  const format = detectFormat(content, file.name);

  switch (format) {
    case '23andme':
      return parse23andMe(content, file.name);
    case 'ancestry':
      return parseAncestry(content, file.name);
    case 'vcf':
      return parseVCF(content, file.name);
    default:
      return {
        success: false,
        error:
          'Unsupported or unrecognised format. Supported: 23andMe-style, Ancestry-style, and VCF.',
      };
  }
}

export function createSimulationCopy(
  upload: GenomeUpload,
  name: string,
): import('../types/scientific').GenomeSimulationCopy {
  return {
    id: `GSC-${Date.now().toString(36)}`,
    sourceUploadId: upload.id,
    name,
    createdAt: new Date().toISOString(),
    variants: upload.variants.map((v) => ({ ...v })),
    editedVariantIds: [],
    isSimulation: true,
  };
}

/** Reconcile import report totals for display validation */
export function validateImportReconciliation(report: GenomeImportReport): boolean {
  const coverageSum = Object.values(report.chromosomeCoverage).reduce((a, b) => a + b, 0);
  return coverageSum === report.chromosomeAssigned;
}
