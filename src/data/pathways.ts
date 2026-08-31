import type { PathwayModel } from '../types/scientific';

export const CURATED_PATHWAYS: PathwayModel[] = [
  {
    id: 'PATH-DNA-REPAIR',
    name: 'DNA Damage Response',
    description: {
      simple: 'How cells detect and fix DNA damage before dividing.',
      standard: 'Pathway coordinating detection and repair of DNA lesions.',
      technical: 'ATM/ATR kinase cascade activating repair effectors and checkpoints.',
    },
    nodes: [
      { id: 'n-gene', type: 'gene', label: 'BRCA1 / TP53', description: { simple: 'DNA repair genes', standard: 'Tumour suppressors', technical: 'HR and checkpoint mediators' }, linkedGeneId: 'GEN-BRCA1' },
      { id: 'n-rna', type: 'rna', label: 'mRNA', description: { simple: 'Instructions copied from DNA', standard: 'Transcribed messenger RNA', technical: 'Processed transcript exported to cytoplasm' } },
      { id: 'n-protein', type: 'protein', label: 'Repair proteins', description: { simple: 'Proteins that fix DNA', standard: 'Effector repair complexes', technical: 'RAD51 foci and ligase assemblies' } },
      { id: 'n-pathway', type: 'pathway', label: 'DNA Repair pathway', description: { simple: 'The repair process as a whole', standard: 'Coordinated repair network', technical: 'Multi-branch HR/NHEJ decision network' } },
      { id: 'n-cell', type: 'cell', label: 'Cell cycle control', description: { simple: 'Cell decides whether to divide', standard: 'Checkpoint enforcement', technical: 'G1/S and G2/M arrest' } },
      { id: 'n-pheno', type: 'phenotype', label: 'Genome stability', description: { simple: 'Cell keeps DNA in good shape', standard: 'Maintained or compromised stability', technical: 'Mutation rate and viability phenotype' } },
    ],
    edges: [
      { from: 'n-gene', to: 'n-rna', label: 'transcription' },
      { from: 'n-rna', to: 'n-protein', label: 'translation' },
      { from: 'n-protein', to: 'n-pathway', label: 'activity' },
      { from: 'n-pathway', to: 'n-cell', label: 'regulation' },
      { from: 'n-cell', to: 'n-pheno', label: 'outcome' },
    ],
  },
  {
    id: 'PATH-CELL-CYCLE',
    name: 'Cell Cycle Regulation',
    description: {
      simple: 'How cells decide when to grow and divide.',
      standard: 'Cyclin-CDK driven cell cycle progression with checkpoints.',
      technical: 'Phase transitions governed by cyclin/CDK complexes and ubiquitin-mediated proteolysis.',
    },
    nodes: [
      { id: 'c-gene', type: 'gene', label: 'TP53', description: { simple: 'Guardian gene', standard: 'Checkpoint gene', technical: 'Transcription factor' }, linkedGeneId: 'GEN-TP53' },
      { id: 'c-rna', type: 'rna', label: 'Cell cycle mRNAs', description: { simple: 'RNA messages for division', standard: 'Regulatory transcripts', technical: 'Cyclin and CDK mRNAs' } },
      { id: 'c-protein', type: 'protein', label: 'Cyclin-CDK', description: { simple: 'Proteins that drive division steps', standard: 'Kinase complexes', technical: 'Phase-specific CDK activators' } },
      { id: 'c-path', type: 'pathway', label: 'Cell cycle', description: { simple: 'Grow then divide', standard: 'Ordered phase progression', technical: 'G1→S→G2→M transitions' } },
      { id: 'c-cell', type: 'cell', label: 'Dividing cell', description: { simple: 'One cell becomes two', standard: 'Mitotic cell', technical: 'Cytokinesis-competent cell' } },
      { id: 'c-pheno', type: 'phenotype', label: 'Proliferation rate', description: { simple: 'How fast cells multiply', standard: 'Population growth', technical: 'Doubling time phenotype' } },
    ],
    edges: [
      { from: 'c-gene', to: 'c-rna' },
      { from: 'c-rna', to: 'c-protein' },
      { from: 'c-protein', to: 'c-path' },
      { from: 'c-path', to: 'c-cell' },
      { from: 'c-cell', to: 'c-pheno' },
    ],
  },
  {
    id: 'PATH-LIPID',
    name: 'Lipid Transport',
    description: {
      simple: 'How fats and cholesterol move around the body.',
      standard: 'Apolipoprotein-mediated lipid particle transport.',
      technical: 'Receptor-mediated endocytosis of lipoprotein particles.',
    },
    nodes: [
      { id: 'l-gene', type: 'gene', label: 'APOE', description: { simple: 'Fat transport gene', standard: 'Apolipoprotein E gene', technical: 'APOE locus' }, linkedGeneId: 'GEN-APOE' },
      { id: 'l-rna', type: 'rna', label: 'APOE mRNA', description: { simple: 'RNA for APOE protein', standard: 'Transcript', technical: 'Processed APOE mRNA' } },
      { id: 'l-protein', type: 'protein', label: 'ApoE protein', description: { simple: 'Protein carrying fats', standard: 'Lipid carrier', technical: 'Lipoprotein component' }, linkedMoleculeId: 'MOL-GLUC' },
      { id: 'l-path', type: 'pathway', label: 'Lipid pathway', description: { simple: 'Fat transport chain', standard: 'Lipid metabolism', technical: 'Lipoprotein metabolism' } },
      { id: 'l-cell', type: 'cell', label: 'Hepatocyte', description: { simple: 'Liver cell', standard: 'Liver cell model', technical: 'Hepatic parenchymal cell' } },
      { id: 'l-pheno', type: 'phenotype', label: 'Blood lipid levels', description: { simple: 'Fat levels in blood', standard: 'Lipid profile', technical: 'Serum lipoprotein concentrations' } },
    ],
    edges: [
      { from: 'l-gene', to: 'l-rna' },
      { from: 'l-rna', to: 'l-protein' },
      { from: 'l-protein', to: 'l-path' },
      { from: 'l-path', to: 'l-cell' },
      { from: 'l-cell', to: 'l-pheno' },
    ],
  },
];
