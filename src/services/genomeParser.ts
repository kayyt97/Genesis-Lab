import type { GenomicVariant, GenomeUpload } from '../types/scientific';

export interface ParseResult {
  success: boolean;
  upload?: GenomeUpload;
  error?: string;
}

function parse23andMe(content: string, fileName: string): ParseResult {
  const lines = content.split('\n');
  const variants: GenomicVariant[] = [];
  let lineNum = 0;

  for (const line of lines) {
    lineNum++;
    if (line.startsWith('#') || line.trim() === '') continue;
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    const [rsid, chromosome, position, genotype] = parts;
    if (rsid === 'rsid' || chromosome === 'chromosome') continue;
    if (!chromosome || !position || !genotype || genotype === '--') continue;

    variants.push({
      id: `VAR-${variants.length + 1}`,
      chromosome: chromosome.replace(/^chr/i, ''),
      position: parseInt(position, 10),
      rsId: rsid.startsWith('rs') ? rsid : undefined,
      referenceAllele: '',
      alternateAllele: '',
      genotype: genotype.trim(),
      observationStatus: 'observed',
    });
  }

  if (variants.length === 0) {
    return { success: false, error: 'No valid genotype rows found in 23andMe-format file.' };
  }

  return {
    success: true,
    upload: {
      id: `GEN-${Date.now().toString(36)}`,
      fileName,
      sourceFormat: '23andme',
      uploadedAt: new Date().toISOString(),
      variants: variants.slice(0, 50000),
      variantCount: variants.length,
      isPersisted: false,
    },
  };
}

function parseAncestry(content: string, fileName: string): ParseResult {
  const lines = content.split('\n');
  const variants: GenomicVariant[] = [];

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    const [rsid, , chromosome, position, allele1, allele2] = parts;
    if (rsid === 'rsid') continue;
    const genotype = `${(allele1 ?? '').trim()}${(allele2 ?? '').trim()}`;
    if (!chromosome || !position || genotype.includes('0')) continue;

    variants.push({
      id: `VAR-${variants.length + 1}`,
      chromosome: chromosome.replace(/^chr/i, ''),
      position: parseInt(position, 10),
      rsId: rsid.startsWith('rs') ? rsid : undefined,
      referenceAllele: allele1?.trim() ?? '',
      alternateAllele: allele2?.trim() ?? '',
      genotype,
      observationStatus: 'observed',
    });
  }

  if (variants.length === 0) {
    return { success: false, error: 'No valid genotype rows found in Ancestry-format file.' };
  }

  return {
    success: true,
    upload: {
      id: `GEN-${Date.now().toString(36)}`,
      fileName,
      sourceFormat: 'ancestry',
      uploadedAt: new Date().toISOString(),
      variants: variants.slice(0, 50000),
      variantCount: variants.length,
      isPersisted: false,
    },
  };
}

function parseVCF(content: string, fileName: string): ParseResult {
  const lines = content.split('\n');
  const variants: GenomicVariant[] = [];

  for (const line of lines) {
    if (line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 10) continue;
    const [chrom, pos, , ref, alt, , , , , sample] = parts;
    const gtMatch = sample.match(/(\d)[\/|](\d)/);
    const genotype = gtMatch ? `${ref}${alt}` : sample.split(':')[0];

    variants.push({
      id: `VAR-${variants.length + 1}`,
      chromosome: chrom.replace(/^chr/i, ''),
      position: parseInt(pos, 10),
      referenceAllele: ref,
      alternateAllele: alt,
      genotype,
      observationStatus: 'observed',
    });
  }

  if (variants.length === 0) {
    return { success: false, error: 'No variant rows found in VCF file.' };
  }

  return {
    success: true,
    upload: {
      id: `GEN-${Date.now().toString(36)}`,
      fileName,
      sourceFormat: 'vcf',
      uploadedAt: new Date().toISOString(),
      variants: variants.slice(0, 50000),
      variantCount: variants.length,
      isPersisted: false,
    },
  };
}

export function detectFormat(content: string, fileName: string): '23andme' | 'ancestry' | 'vcf' | 'unknown' {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.vcf') || lower.endsWith('.vcf.gz')) return 'vcf';
  const head = content.slice(0, 2000);
  if (head.includes('##fileformat=VCF')) return 'vcf';
  if (head.includes('rsid\tchromosome\tposition\tgenotype')) return '23andme';
  if (head.includes('rsid\tchromosome\tposition\tallele1\tallele2')) return 'ancestry';
  if (head.match(/^rs\d/m)) return '23andme';
  return 'unknown';
}

export async function parseGenomeFile(file: File): Promise<ParseResult> {
  if (file.size > 50 * 1024 * 1024) {
    return { success: false, error: 'File exceeds 50 MB limit for local parsing.' };
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
