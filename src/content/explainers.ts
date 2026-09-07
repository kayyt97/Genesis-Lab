import type { ExplainContent } from '../components/ui/ExplainThis';

/** Shared educational explainers used across modules. */
export const EXPLAIN = {
  pathway: {
    whatIsIt:
      'A biological pathway is a series of molecular steps that cells use to carry out a process — for example repairing DNA, sensing signals, or making energy.',
    whatAmILookingAt:
      'This explorer shows curated educational pathway maps. Nodes are genes, proteins, processes or phenotypes. Lines (edges) show known educational relationships between them.',
    whyItMatters:
      'Researchers use pathway maps to understand how a change in one molecule can ripple through a system.',
    howUsed:
      'Search a gene or molecule, select a pathway, then click nodes to learn what each part does.',
    whatItDoesNotMean:
      'A connection here is not a clinical diagnosis. Pathways are simplified educational models — real biology is more complex and context-dependent. Connections should not automatically be interpreted as proof that one factor causes another.',
  },
  node: {
    whatIsIt:
      'A node is an individual biological entity in the diagram — such as a gene, protein, process, or phenotype.',
    whatAmILookingAt: 'Click a node to read what it represents in this educational pathway.',
    whyItMatters: 'Nodes break a complex system into understandable parts.',
    whatItDoesNotMean: 'Selecting a node does not mean that molecule is “active” in your sample.',
  },
  interaction: {
    whatIsIt:
      'An interaction is a relationship or connection between biological entities — how one part relates to another.',
    whatAmILookingAt: 'Lines or arrows between nodes show educational relationships in the curated map.',
    whyItMatters: 'Interactions help explain how systems work together rather than in isolation.',
    howUsed: 'Trace from a gene or protein along connected nodes to see downstream effects in the model.',
    whatResultMeans: 'You can learn plausible research relationships and vocabulary.',
    whatItDoesNotMean:
      'An interaction on the map is not automatic proof of causation in every person, tissue, or experiment.',
  },
  gene: {
    whatIsIt:
      'A gene is a stretch of DNA that carries instructions — often for making a protein or a functional RNA molecule.',
    whyItMatters:
      'Many traits and diseases relate to how genes work, how much they are expressed, or whether their sequence is altered.',
    howUsed: 'Researchers examine genes to understand function, variation, and links to pathways or traits.',
    whatItDoesNotMean:
      'Finding a gene name in Genesis Lab is educational reference information, not a medical test result.',
  },
  chromosome: {
    whatIsIt:
      'A chromosome is a packaged structure of DNA (and proteins) that organises genetic information. Humans typically have chromosomes numbered 1–22 plus X and Y, and mitochondrial DNA (MT).',
    whyItMatters:
      'The chromosome number tells you which DNA molecule a gene or variant sits on — useful for locating and comparing regions.',
    whatAmILookingAt: 'Selecting a chromosome focuses the browser on that DNA molecule’s educational context and any uploaded variants assigned to it.',
    whatItDoesNotMean: 'Chromosome selection here is navigation, not a karyotype diagnosis.',
  },
  genotype: {
    whatIsIt:
      'Genotype describes the allele combination observed at a specific position — often shown as letter pairs such as AA, AG, or GG, or indel codes such as II/DD in some consumer file formats.',
    whyItMatters: 'Genotype notation summarises what was measured at that marker in the uploaded dataset.',
    whatResultMeans:
      'Letter pairs usually represent the two alleles at a SNP. Exact meaning depends on the source format and reference allele convention.',
    whatItDoesNotMean:
      'A genotype alone does not establish disease, health status, or a clinical diagnosis.',
  },
  variant: {
    whatIsIt:
      'A genetic variant is a difference in DNA sequence at a position compared with a reference. People can differ at many positions.',
    whyItMatters: 'Variants help researchers study diversity, ancestry markers, and disease association — with careful interpretation.',
    whatResultMeans: '“Observed in uploaded data” means this marker was present in the file you imported — not that every base of the genome was sequenced.',
    whatItDoesNotMean: 'Unobserved regions cannot be inferred. Consumer files are sampled variants, not a complete genome.',
  },
  position: {
    whatIsIt:
      'Genomic position is a coordinate along a chromosome — a numbered location used so researchers can refer to the same place consistently.',
    whyItMatters: 'Coordinates let catalogues, papers, and files point to the same locus.',
    whatItDoesNotMean: 'A position number is not by itself a diagnosis or a trait prediction.',
  },
  rsId: {
    whatIsIt:
      'An rsID (e.g. rs12345) is a common catalogue identifier for a known variant in databases such as dbSNP.',
    whyItMatters: 'rsIDs make it easier to look up the same variant across studies and tools.',
    whatItDoesNotMean: 'Having an rsID does not mean the variant is rare, harmful, or clinically actionable.',
  },
  observedStatus: {
    whatIsIt:
      'Status describes whether a variant was seen in the uploaded dataset.',
    whatResultMeans:
      '“Observed in uploaded data” means the parser found this marker in your file. It does not mean the rest of the chromosome was measured.',
    whatItDoesNotMean: 'Missing status does not prove absence of variation — arrays leave most bases unmeasured.',
  },
  protein: {
    whatIsIt:
      'A protein is a working molecule built from amino acids. Proteins do most of the jobs inside cells — catalysts, sensors, scaffolds, and messengers.',
    whyItMatters: 'Many therapies and diseases are studied at the protein level because proteins carry out cellular functions.',
  },
  activation: {
    whatIsIt:
      'Activation means one molecule increases the activity or output of another step — like turning a process up.',
    whatItDoesNotMean:
      'An activation arrow in an educational map is a simplified relationship, not a guarantee of what happens in every tissue or condition.',
  },
  inhibition: {
    whatIsIt:
      'Inhibition means one molecule reduces or blocks another step — like turning a process down.',
    whatItDoesNotMean:
      'Inhibition on a map does not automatically mean a drug will safely achieve that effect in people.',
  },
  expression: {
    whatIsIt:
      'Gene expression is how actively a gene is being “read” to make RNA (and often protein). High expression means more product; low means less.',
    whatItDoesNotMean:
      'Expression context here is educational. Consumer genotype files do not directly measure expression.',
  },
  therapeutic: {
    whatIsIt:
      'Therapeutic design is the conceptual process of choosing a biological target and imagining how a therapy might reach and affect it — for example by delivering, regulating, or modifying genetic or molecular material in a research model.',
    whatAmILookingAt:
      'This page lets you build an educational model of a therapy idea — target type, delivery concept, and approximate effect parameters.',
    whyItMatters:
      'It helps learners understand how researchers think about targets, delivery, and trade-offs before any real lab work.',
    howUsed:
      'Choose a starting point (gene, protein, process), describe a target, adjust conceptual sliders, then save the design for Virtual Lab exploration.',
    whatResultMeans:
      'The saved design is a teaching artefact summarising your choices — useful for discussion and simulation handoff.',
    whatItDoesNotMean:
      'It is NOT a clinical therapy, NOT laboratory-ready, and NOT validated for human use. Genesis does not generate wet-lab construction protocols.',
  },
  vector: {
    whatIsIt:
      'In gene therapy concepts, a vector is a delivery vehicle for genetic material — a way to carry instructions into cells in certain research or therapeutic approaches (modelled here as non-replicating carriers where relevant).',
    whyItMatters:
      'Delivery is as important as the payload: a therapy idea must reach the right cells without uncontrolled spread.',
    whatItDoesNotMean:
      'Selecting a vector type here is educational only. It does not produce viable infectious agents or construction recipes.',
  },
  microscope: {
    whatIsIt:
      'A microscope magnifies small structures so we can study cells and tissues that are invisible to the naked eye.',
    whatAmILookingAt:
      'Genesis shows a simulated educational field of view — not real camera imagery from a physical microscope.',
    whyItMatters:
      'Microscopy is a core skill for understanding cell shape, tissue organisation, and how conditions change appearance.',
    whatItDoesNotMean:
      'Simulated views cannot replace trained microscopy of real specimens, and magnification here is conceptual.',
  },
  magnification: {
    whatIsIt:
      'Magnification enlarges the image. Higher magnification shows a smaller area in greater detail.',
    whyItMatters:
      'Low power surveys tissue organisation; high power reveals cell and organelle-level features appropriate to the specimen.',
    whatItDoesNotMean:
      'Zooming a flat image is not the same as optical resolution. Genesis reveals educational detail tiers rather than raw pixel zoom alone.',
  },
  resolution: {
    whatIsIt: 'Resolution is the ability to distinguish fine detail as separate. Magnification without resolution only makes a blur bigger.',
    whatItDoesNotMean: 'Genesis uses educational detail tiers — not measured optical resolving power.',
  },
  focus: {
    whatIsIt: 'Focus adjusts how sharp the field appears. Real microscopes move the stage or optics; here focus is a teaching control.',
    whatItDoesNotMean: 'Focus blur is simulated for learning, not a calibrated lens model.',
  },
  contrast: {
    whatIsIt: 'Contrast is the difference between light and dark regions that makes structures stand out.',
    whyItMatters: 'Poor contrast can hide boundaries even at high magnification.',
  },
  illumination: {
    whatIsIt: 'Illumination is how brightly the specimen is lit. Too dim hides detail; too bright can wash out structure.',
  },
  cell: {
    whatIsIt: 'A cell is the basic living unit. Different specimens show different cell shapes and arrangements.',
  },
  nucleus: {
    whatIsIt: 'The nucleus is a membrane-bound compartment that holds most of a cell’s DNA (in eukaryotes).',
    whatItDoesNotMean: 'Bacteria typically lack a true nucleus — they have a nucleoid region instead.',
  },
  membrane: {
    whatIsIt: 'The cell membrane is the outer boundary that controls what enters and leaves the cell.',
  },
  cytoplasm: {
    whatIsIt: 'Cytoplasm is the material inside the cell (outside the nucleus in eukaryotes) where many reactions happen.',
  },
  tissue: {
    whatIsIt: 'Tissue is a group of similar cells organised to perform a shared function.',
  },
  organelle: {
    whatIsIt: 'Organelles are specialised structures inside eukaryotic cells (for example chloroplasts or vacuoles) visible at high educational magnification.',
  },
  specimen: {
    whatIsIt: 'A specimen is the sample being examined — here a simulated educational representation of a biological sample.',
  },
  hypothesis: {
    whatIsIt:
      'A hypothesis is a clear, testable statement about how changing one factor might affect a measurable outcome.',
    whyItMatters:
      'Good hypotheses make experiments interpretable — they define what you expect and what would count as evidence for or against.',
    whatItDoesNotMean:
      'A supported hypothesis is never “proven” forever. Results can support, fail to support, or remain inconclusive.',
  },
  report: {
    whatIsIt:
      'A scientific report summarises aim, methods, observations, and limitations of an experiment session.',
    whatResultMeans:
      'Genesis reports are built from stored experiment and simulation data. Empty sections mean that information was not recorded.',
    whatItDoesNotMean:
      'Reports do not invent missing methodology. Educational simulation outputs are not clinical or laboratory certifications.',
  },
  atomWorkspace: {
    whatIsIt:
      'The atomic workspace holds atoms you have added so you can explore simplified bonding rules between them.',
    howUsed:
      'Select an element, adjust neutrons/charge if desired, click Add atom, then Test bond with the last two atoms.',
    whatItDoesNotMean:
      'Bond results are teaching rules, not a full quantum chemistry calculation.',
  },
  virtualLab: {
    whatIsIt: 'The Virtual Lab is an educational simulation workspace for growing modelled organisms under controlled conditions.',
    whyItMatters: 'It lets you practise experimental design, controls, and interpretation without wet-lab risk.',
    howUsed: 'Select a sample, adjust environment, run or step the simulation, compare with a control, then generate a report.',
    whatResultMeans: 'Charts and metrics show how the educational model responds over simulated time.',
    whatItDoesNotMean: 'Outputs are prototype educational models — not validated physical or clinical predictions.',
  },
} as const satisfies Record<string, ExplainContent>;
