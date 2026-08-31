export interface GenotypeNotationHelp {
  label: string;
  explanation: string;
  sourceAware?: boolean;
}

const INDEL_NOTATION: Record<string, GenotypeNotationHelp> = {
  II: {
    label: 'II',
    explanation: 'Insertion/insertion genotype — both alleles carry the insertion variant at this locus (source-format dependent). This does NOT mean an extra whole chromosome.',
    sourceAware: true,
  },
  DD: {
    label: 'DD',
    explanation: 'Deletion/deletion genotype — both alleles carry the deletion variant at this locus (source-format dependent). This does NOT mean a missing whole chromosome.',
    sourceAware: true,
  },
  DI: {
    label: 'DI',
    explanation: 'Deletion/insertion heterozygous genotype — one allele carries a deletion and one an insertion at this locus (source-format dependent).',
    sourceAware: true,
  },
  ID: {
    label: 'ID',
    explanation: 'Insertion/deletion heterozygous genotype — one allele carries an insertion and one a deletion at this locus (source-format dependent).',
    sourceAware: true,
  },
};

export function getGenotypeNotationHelp(genotype: string, sourceFormat?: string): GenotypeNotationHelp | null {
  const key = genotype.trim().toUpperCase();
  const help = INDEL_NOTATION[key];
  if (!help) return null;
  if (sourceFormat === '23andme' || sourceFormat === 'ancestry') {
    return {
      ...help,
      explanation: `${help.explanation} In 23andMe-style files, I/D often denotes indel alleles at a specific SNP — not chromosome number.`,
    };
  }
  return help;
}

export function isIndelGenotypeNotation(genotype: string): boolean {
  return ['II', 'DD', 'DI', 'ID'].includes(genotype.trim().toUpperCase());
}
