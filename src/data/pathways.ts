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
  {
    id: 'PATH-HTT',
    name: 'Huntingtin / Neuronal Function',
    description: {
      simple: 'How the HTT gene relates to nerve cell proteins and cell health. Educational reference — not clinical diagnosis.',
      standard: 'Reference pathway linking HTT expression to neuronal protein function and cellular phenotypes.',
      technical: 'Curated reference model: HTT transcription → huntingtin protein → vesicular transport/neuronal survival processes.',
    },
    nodes: [
      { id: 'h-gene', type: 'gene', label: 'HTT', description: { simple: 'The huntingtin gene on chromosome 4.', standard: 'HTT gene locus.', technical: 'HTT coding sequence at 4p16.3.' }, linkedGeneId: 'GEN-HTT' },
      { id: 'h-rna', type: 'rna', label: 'HTT mRNA', description: { simple: 'RNA copy of the HTT gene.', standard: 'Processed HTT transcript.', technical: 'Mature mRNA exported to cytoplasm.' } },
      { id: 'h-protein', type: 'protein', label: 'Huntingtin protein', description: { simple: 'Protein made from HTT, important in nerve cells.', standard: 'Scaffold protein in neurons.', technical: 'Htt protein with polyglutamine tract (reference).' } },
      { id: 'h-path', type: 'pathway', label: 'Neuronal transport & survival', description: { simple: 'Processes that keep nerve cells working.', standard: 'Axonal transport and survival signalling.', technical: 'Dynein-mediated transport and BDNF pathways (reference).' } },
      { id: 'h-cell', type: 'cell', label: 'Neuron', description: { simple: 'A nerve cell.', standard: 'Neuronal cell model.', technical: 'Medium spiny neuron reference.' } },
      { id: 'h-pheno', type: 'phenotype', label: 'Neuronal function / disease models', description: { simple: 'How well nerve cells function — studied in research, not diagnosed here.', standard: 'Neuronal viability and motor function phenotypes in literature.', technical: 'Model phenotypes associated with HTT biology in research contexts.' } },
    ],
    edges: [
      { from: 'h-gene', to: 'h-rna', label: 'transcription' },
      { from: 'h-rna', to: 'h-protein', label: 'translation' },
      { from: 'h-protein', to: 'h-path', label: 'activity' },
      { from: 'h-path', to: 'h-cell', label: 'regulation' },
      { from: 'h-cell', to: 'h-pheno', label: 'outcome' },
    ],
  },
  {
    id: 'PATH-ION-TRANSPORT',
    name: 'Ion Transport',
    description: {
      simple: 'How ions move across cell membranes to control cell function.',
      standard: 'Channel and transporter mediated ion flux across membranes.',
      technical: 'Electrochemical gradient-driven ion channel and pump activity.',
    },
    nodes: [
      { id: 'i-gene', type: 'gene', label: 'CFTR', description: { simple: 'Chloride channel gene', standard: 'CFTR gene', technical: 'CFTR locus' }, linkedGeneId: 'GEN-CFTR' },
      { id: 'i-rna', type: 'rna', label: 'CFTR mRNA', description: { simple: 'RNA for channel protein', standard: 'Transcript', technical: 'Processed CFTR mRNA' } },
      { id: 'i-protein', type: 'protein', label: 'CFTR channel', description: { simple: 'Protein controlling chloride flow', standard: 'Ion channel protein', technical: 'cAMP-regulated chloride channel' } },
      { id: 'i-path', type: 'pathway', label: 'Ion transport', description: { simple: 'Ion movement pathway', standard: 'Epithelial ion transport', technical: 'Apical chloride secretion pathway' } },
      { id: 'i-cell', type: 'cell', label: 'Epithelial cell', description: { simple: 'Surface lining cell', standard: 'Epithelial model', technical: 'Polarised epithelial cell' } },
      { id: 'i-pheno', type: 'phenotype', label: 'Fluid transport', description: { simple: 'Water and salt balance', standard: 'Mucociliary clearance phenotype', technical: 'Airway surface liquid homeostasis' } },
    ],
    edges: [
      { from: 'i-gene', to: 'i-rna' }, { from: 'i-rna', to: 'i-protein' }, { from: 'i-protein', to: 'i-path' }, { from: 'i-path', to: 'i-cell' }, { from: 'i-cell', to: 'i-pheno' },
    ],
  },
  {
    id: 'PATH-BLOOD',
    name: 'Haemoglobin & Blood Disorders',
    description: {
      simple: 'How haemoglobin genes relate to oxygen transport in blood.',
      standard: 'Globin gene expression and haemoglobin assembly reference.',
      technical: 'Alpha/beta globin loci and haemoglobin tetramer formation.',
    },
    nodes: [
      { id: 'b-gene', type: 'gene', label: 'HBB / HBA', description: { simple: 'Haemoglobin genes', standard: 'Globin genes', technical: 'Beta and alpha globin loci' }, linkedGeneId: 'GEN-HBB' },
      { id: 'b-rna', type: 'rna', label: 'Globin mRNAs', description: { simple: 'RNA for haemoglobin chains', standard: 'Globin transcripts', technical: 'Processed globin mRNAs' } },
      { id: 'b-protein', type: 'protein', label: 'Haemoglobin', description: { simple: 'Oxygen-carrying protein in red blood cells', standard: 'Tetrameric oxygen carrier', technical: 'α2β2 haemoglobin complex' } },
      { id: 'b-path', type: 'pathway', label: 'Erythropoiesis', description: { simple: 'Making red blood cells', standard: 'Red blood cell production', technical: 'Erythroid differentiation pathway' } },
      { id: 'b-cell', type: 'cell', label: 'Erythrocyte', description: { simple: 'Red blood cell', standard: 'Mature RBC', technical: 'Enucleated erythrocyte' } },
      { id: 'b-pheno', type: 'phenotype', label: 'Oxygen carrying capacity', description: { simple: 'How well blood carries oxygen', standard: 'Haematological phenotype', technical: 'Oxygen saturation and anaemia models' } },
    ],
    edges: [
      { from: 'b-gene', to: 'b-rna' }, { from: 'b-rna', to: 'b-protein' }, { from: 'b-protein', to: 'b-path' }, { from: 'b-path', to: 'b-cell' }, { from: 'b-cell', to: 'b-pheno' },
    ],
  },
  {
    id: 'PATH-NEURO',
    name: 'Neuronal Signalling',
    description: {
      simple: 'How nerve cells communicate and stay healthy.',
      standard: 'Synaptic signalling and neuronal survival reference.',
      technical: 'Neurotransmitter release, receptor activation, and survival pathways.',
    },
    nodes: [
      { id: 'n2-gene', type: 'gene', label: 'APP / SNCA', description: { simple: 'Neurological reference genes', standard: 'Neurodegeneration-associated genes', technical: 'APP and SNCA loci' }, linkedGeneId: 'GEN-APP' },
      { id: 'n2-rna', type: 'rna', label: 'Neuronal mRNAs', description: { simple: 'RNA in nerve cells', standard: 'Neuronal transcripts', technical: 'Activity-regulated mRNAs' } },
      { id: 'n2-protein', type: 'protein', label: 'Synaptic proteins', description: { simple: 'Proteins at nerve junctions', standard: 'Pre/post-synaptic proteins', technical: 'SNARE and receptor complexes' } },
      { id: 'n2-path', type: 'pathway', label: 'Synaptic transmission', description: { simple: 'Signal passing between nerves', standard: 'Neurotransmission', technical: 'Electrochemical synaptic signalling' } },
      { id: 'n2-cell', type: 'cell', label: 'Neuron', description: { simple: 'Nerve cell', standard: 'Neuronal model', technical: 'Excitable neuron' } },
      { id: 'n2-pheno', type: 'phenotype', label: 'Neural function', description: { simple: 'How nerves work', standard: 'Cognitive/motor phenotypes in models', technical: 'Neurophysiological readouts' } },
    ],
    edges: [
      { from: 'n2-gene', to: 'n2-rna' }, { from: 'n2-rna', to: 'n2-protein' }, { from: 'n2-protein', to: 'n2-path' }, { from: 'n2-path', to: 'n2-cell' }, { from: 'n2-cell', to: 'n2-pheno' },
    ],
  },
  {
    id: 'PATH-METABOLIC',
    name: 'Metabolic Pathways',
    description: {
      simple: 'How cells process nutrients and energy.',
      standard: 'Core metabolic pathway reference.',
      technical: 'Glycolysis, TCA cycle, and oxidative phosphorylation overview.',
    },
    nodes: [
      { id: 'm-gene', type: 'gene', label: 'PAH / G6PD', description: { simple: 'Metabolic enzyme genes', standard: 'Metabolic gene reference', technical: 'Enzyme coding loci' }, linkedGeneId: 'GEN-PAH' },
      { id: 'm-rna', type: 'rna', label: 'Enzyme mRNAs', description: { simple: 'RNA for metabolic enzymes', standard: 'Metabolic transcripts', technical: 'Housekeeping and inducible mRNAs' } },
      { id: 'm-protein', type: 'protein', label: 'Metabolic enzymes', description: { simple: 'Proteins that process food molecules', standard: 'Enzyme catalysts', technical: 'Kinases, dehydrogenases, transferases' } },
      { id: 'm-path', type: 'pathway', label: 'Metabolism', description: { simple: 'Energy and building block production', standard: 'Central metabolism', technical: 'Integrated metabolic network' } },
      { id: 'm-cell', type: 'cell', label: 'Metabolic cell', description: { simple: 'Any cell using energy', standard: 'Generic metabolically active cell', technical: 'Cell with active mitochondria' } },
      { id: 'm-pheno', type: 'phenotype', label: 'Energy status', description: { simple: 'Whether cells have enough energy', standard: 'Metabolic phenotype', technical: 'ATP/redox state proxies' } },
    ],
    edges: [
      { from: 'm-gene', to: 'm-rna' }, { from: 'm-rna', to: 'm-protein' }, { from: 'm-protein', to: 'm-path' }, { from: 'm-path', to: 'm-cell' }, { from: 'm-cell', to: 'm-pheno' },
    ],
  },
  {
    id: 'PATH-SIGNALING',
    name: 'Cell Signalling',
    description: {
      simple: 'How cells receive and respond to signals.',
      standard: 'Receptor-mediated signal transduction reference.',
      technical: 'Ligand-receptor-kinase cascades and transcriptional responses.',
    },
    nodes: [
      { id: 's-gene', type: 'gene', label: 'EGFR / KRAS', description: { simple: 'Signalling genes', standard: 'Oncogene/signalling reference', technical: 'RTK and RAS loci' }, linkedGeneId: 'GEN-EGFR' },
      { id: 's-rna', type: 'rna', label: 'Signalling mRNAs', description: { simple: 'RNA for signalling proteins', standard: 'Signalling transcripts', technical: 'Inducible signalling mRNAs' } },
      { id: 's-protein', type: 'protein', label: 'Receptors & kinases', description: { simple: 'Proteins that pass signals', standard: 'Signalling proteins', technical: 'RTKs, G proteins, kinases' } },
      { id: 's-path', type: 'pathway', label: 'Signalling cascade', description: { simple: 'Chain of signal events', standard: 'MAPK/PI3K reference', technical: 'Multi-tier kinase cascade' } },
      { id: 's-cell', type: 'cell', label: 'Target cell', description: { simple: 'Cell receiving signal', standard: 'Responsive cell model', technical: 'Ligand-responsive cell' } },
      { id: 's-pheno', type: 'phenotype', label: 'Cell response', description: { simple: 'What the cell does after signal', standard: 'Proliferation/differentiation response', technical: 'Transcriptional and phenotypic output' } },
    ],
    edges: [
      { from: 's-gene', to: 's-rna' }, { from: 's-rna', to: 's-protein' }, { from: 's-protein', to: 's-path' }, { from: 's-path', to: 's-cell' }, { from: 's-cell', to: 's-pheno' },
    ],
  },
  {
    id: 'PATH-IMPRINTING',
    name: 'Genomic Imprinting (11p15.5 reference)',
    description: {
      simple: 'Some genes are switched on from only one parent. This involves methylation marks — an epigenetic layer, not just DNA sequence.',
      standard: 'Parent-of-origin gene expression at 11p15.5 ICR1 — epigenetic regulation context.',
      technical: 'Imprinting control region ICR1 regulates H19/IGF2 expression; loss of methylation is an epigenetic abnormality distinct from sequence variants.',
    },
    nodes: [
      { id: 'i-gene', type: 'gene', label: 'H19 / IGF2', description: { simple: 'Imprinted gene pair', standard: 'Oppositely imprinted transcripts at 11p15.5', technical: 'ICR1-regulated locus' }, linkedGeneId: 'GEN-H19' },
      { id: 'i-rna', type: 'rna', label: 'Imprinted transcripts', description: { simple: 'Only one copy is usually active', standard: 'Parent-specific expression', technical: 'Monoallelic transcription' } },
      { id: 'i-protein', type: 'protein', label: 'IGF2 protein', description: { simple: 'Growth-related protein from the active copy', standard: 'Paternally expressed growth factor', technical: 'IGF2 signalling peptide when expressed' } },
      { id: 'i-path', type: 'pathway', label: 'Imprinting regulation', description: { simple: 'Methylation controls which copy is on', standard: 'Epigenetic imprinting', technical: 'DNA methylation at ICR1' } },
      { id: 'i-cell', type: 'cell', label: 'Somatic cell', description: { simple: 'Most body cells use imprinting', standard: 'Diploid somatic context', technical: 'Biallelic locus with monoallelic expression' } },
      { id: 'i-pheno', type: 'phenotype', label: 'Growth regulation', description: { simple: 'Growth may be affected when imprinting is disrupted', standard: 'Growth phenotype reference', technical: 'Educational imprinting disorder context — not diagnosis from SNP files' } },
    ],
    edges: [
      { from: 'i-gene', to: 'i-rna' }, { from: 'i-rna', to: 'i-protein' }, { from: 'i-gene', to: 'i-path' }, { from: 'i-path', to: 'i-cell' }, { from: 'i-cell', to: 'i-pheno' },
    ],
  },
];
