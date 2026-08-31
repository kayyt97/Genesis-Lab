import type { GeneReference } from '../types/scientific';

export const CHROMOSOMES = [
  { id: '1', label: 'Chr 1', length: 249000000 },
  { id: '2', label: 'Chr 2', length: 242000000 },
  { id: '3', label: 'Chr 3', length: 198000000 },
  { id: '4', label: 'Chr 4', length: 190000000 },
  { id: '5', label: 'Chr 5', length: 181000000 },
  { id: '6', label: 'Chr 6', length: 170000000 },
  { id: '7', label: 'Chr 7', length: 158000000 },
  { id: '8', label: 'Chr 8', length: 145000000 },
  { id: '9', label: 'Chr 9', length: 138000000 },
  { id: '10', label: 'Chr 10', length: 133000000 },
  { id: '11', label: 'Chr 11', length: 135000000 },
  { id: '12', label: 'Chr 12', length: 133000000 },
  { id: '13', label: 'Chr 13', length: 114000000 },
  { id: '14', label: 'Chr 14', length: 107000000 },
  { id: '15', label: 'Chr 15', length: 101000000 },
  { id: '16', label: 'Chr 16', length: 90000000 },
  { id: '17', label: 'Chr 17', length: 81000000 },
  { id: '18', label: 'Chr 18', length: 78000000 },
  { id: '19', label: 'Chr 19', length: 63000000 },
  { id: '20', label: 'Chr 20', length: 63000000 },
  { id: '21', label: 'Chr 21', length: 48000000 },
  { id: '22', label: 'Chr 22', length: 51000000 },
  { id: 'X', label: 'Chr X', length: 156000000 },
  { id: 'Y', label: 'Chr Y', length: 57000000 },
  { id: 'MT', label: 'Chr MT (mitochondrial)', length: 16569 },
];

export const REFERENCE_GENES: GeneReference[] = [
  {
    id: 'GEN-BRCA1',
    symbol: 'BRCA1',
    name: 'BRCA1 DNA repair associated',
    chromosome: '17',
    start: 43044295,
    end: 43170245,
    description: {
      simple: 'BRCA1 — a gene that helps fix damaged DNA. Variants here are studied in cancer research.',
      standard: 'Tumour suppressor gene involved in homologous recombination DNA repair.',
      technical: 'Encodes E3 ubiquitin ligase coordinating double-strand break repair via HR pathway.',
    },
    function: {
      simple: 'Helps cells repair breaks in DNA so they can divide safely.',
      standard: 'Maintains genome stability through DNA damage response.',
      technical: 'Facilitates RAD51 loading and checkpoint activation at DSB sites.',
    },
    pathwayIds: ['PATH-DNA-REPAIR'],
  },
  {
    id: 'GEN-TP53',
    symbol: 'TP53',
    name: 'Tumour protein p53',
    chromosome: '17',
    start: 7668421,
    end: 7687490,
    description: {
      simple: 'TP53 — often called the "guardian of the genome". It can stop damaged cells from dividing.',
      standard: 'Critical tumour suppressor regulating cell cycle arrest and apoptosis.',
      technical: 'Transcription factor integrating stress signals to enforce cell cycle checkpoints.',
    },
    function: {
      simple: 'Checks DNA damage and can pause cell division or trigger cell death.',
      standard: 'Central node in DNA damage response and apoptosis.',
      technical: 'Modulates CDKN1A, BAX, and MDM2 feedback loops.',
    },
    pathwayIds: ['PATH-DNA-REPAIR', 'PATH-CELL-CYCLE'],
  },
  {
    id: 'GEN-CFTR',
    symbol: 'CFTR',
    name: 'CF transmembrane conductance regulator',
    chromosome: '7',
    start: 117480025,
    end: 117668665,
    description: {
      simple: 'CFTR — controls salt and water movement in cells lining the lungs and gut.',
      standard: 'Chloride channel regulating epithelial fluid transport.',
      technical: 'cAMP-regulated chloride channel in epithelial apical membranes.',
    },
    function: {
      simple: 'Helps move chloride ions across cell membranes to keep tissues moist.',
      standard: 'Mediates chloride and bicarbonate transport in epithelia.',
      technical: 'ATP-gated channel influencing mucociliary clearance.',
    },
    pathwayIds: ['PATH-ION-TRANSPORT'],
  },
  {
    id: 'GEN-APOE',
    symbol: 'APOE',
    name: 'Apolipoprotein E',
    chromosome: '19',
    start: 44905796,
    end: 44909393,
    description: {
      simple: 'APOE — helps transport fats in the blood and brain. Common in genomics education examples.',
      standard: 'Apolipoprotein involved in lipid metabolism and transport.',
      technical: 'Ligand for LDL receptor family modulating lipoprotein catabolism.',
    },
    function: {
      simple: 'Carries cholesterol and fats to cells that need them.',
      standard: 'Mediates cholesterol homeostasis in peripheral and CNS tissue.',
      technical: 'Binds lipid particles facilitating receptor-mediated uptake.',
    },
    pathwayIds: ['PATH-LIPID'],
  },
  {
    id: 'GEN-HTT',
    symbol: 'HTT',
    name: 'Huntingtin',
    chromosome: '4',
    start: 3076407,
    end: 3245688,
    description: {
      simple: 'HTT — the huntingtin gene. It provides instructions for a protein involved in nerve cell function. Studied in Huntington disease research.',
      standard: 'Gene encoding huntingtin protein; CAG repeat expansion associated with Huntington disease in clinical literature.',
      technical: 'HTT locus on 4p16.3; encodes huntingtin scaffold protein involved in vesicular transport and transcriptional regulation.',
    },
    function: {
      simple: 'Helps transport materials inside nerve cells and supports cell health.',
      standard: 'Neuronal protein involved in axonal transport and synaptic function.',
      technical: 'Scaffold protein interacting with dynein/dynactin; mutant polyQ expansions alter aggregation propensity.',
    },
    pathwayIds: ['PATH-HTT'],
  },
];

export function findGeneForVariant(chromosome: string, position: number): GeneReference | undefined {
  const chr = chromosome.replace(/^chr/i, '');
  return REFERENCE_GENES.find(
    (g) => g.chromosome === chr && position >= g.start && position <= g.end,
  );
}

export function findVariantsInGene(
  geneId: string,
  variants: import('../types/scientific').GenomicVariant[],
): import('../types/scientific').GenomicVariant[] {
  const gene = REFERENCE_GENES.find((g) => g.id === geneId);
  if (!gene) return [];
  return variants.filter(
    (v) =>
      v.chromosome.replace(/^chr/i, '') === gene.chromosome &&
      v.position >= gene.start &&
      v.position <= gene.end,
  );
}
