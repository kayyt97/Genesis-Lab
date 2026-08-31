import type { OrganismCatalogueEntry } from '../types';
import type { TieredText } from '../../types/language';

function tier(s: string, std?: string, tech?: string): TieredText {
  return { simple: s, standard: std ?? s, technical: tech ?? std ?? s };
}

function org(
  partial: Omit<OrganismCatalogueEntry, 'aliases' | 'tags' | 'keywords' | 'relatedIds' | 'compatibleModules' | 'summary' | 'evidence'> & {
    aliases?: string[];
    tags?: string[];
    keywords?: string[];
    relatedIds?: string[];
    compatibleModules?: OrganismCatalogueEntry['compatibleModules'];
    summary?: TieredText;
  },
): OrganismCatalogueEntry {
  return {
    aliases: [],
    tags: [],
    keywords: [],
    relatedIds: [],
    compatibleModules: ['virtual-lab', 'microscope', 'notebook'],
    evidence: { level: 'reference-data' },
    summary: partial.description,
    ...partial,
  };
}

/** Curated seed entries with accurate educational metadata */
const SEEDS: OrganismCatalogueEntry[] = [
  org({ id: 'ORG-ECOLI', name: 'E. coli', scientificName: 'Escherichia coli', category: 'bacteria', subcategory: 'gram-negative', taxonomy: 'Bacteria; Gammaproteobacteria', morphology: 'Rod-shaped bacillus, ~2 µm', description: tier('Common lab bacterium for studying growth.', 'Facultative anaerobic Gram-negative model bacterium.', 'Mesophilic enterobacterium; molecular biology model.'), cellularOrganisation: 'Prokaryotic', characteristics: ['Gram-negative', 'Facultative anaerobe'], preferredEnvironment: { temperature: 37, ph: 7, oxygen: 21 }, morphologySupported: true, relatedGenes: ['GEN-TP53'], tags: ['lab-organism', 'bacillus'], keywords: ['escherichia', 'coli', 'bacteria'] }),
  org({ id: 'ORG-BSUB', name: 'B. subtilis', scientificName: 'Bacillus subtilis', category: 'bacteria', subcategory: 'gram-positive', taxonomy: 'Bacteria; Bacillales', morphology: 'Rod-shaped, endospore-forming', description: tier('Soil bacterium forming tough spores.', 'Gram-positive spore-forming bacterium.', 'Endospore-forming firmicute model.'), cellularOrganisation: 'Prokaryotic', characteristics: ['Gram-positive', 'Spore-forming'], morphologySupported: true, tags: ['bacillus', 'spore'], keywords: ['subtilis'] }),
  org({ id: 'ORG-SAUREUS', name: 'S. aureus (reference)', scientificName: 'Staphylococcus aureus', category: 'bacteria', subcategory: 'cocci', taxonomy: 'Bacteria; Bacillales', morphology: 'Cocci in clusters', description: tier('Round bacterium; educational reference only.', 'Gram-positive coccus; pathogenic strains exist.', 'Facultative anaerobe; biofilm-capable reference.'), cellularOrganisation: 'Prokaryotic', characteristics: ['Gram-positive', 'Coccus'], morphologySupported: true, pathogenInfo: 'educational-reference-only', safetyClass: 'reference-pathogen', tags: ['cocci', 'medical-reference'], keywords: ['staphylococcus', 'aureus'] }),
  org({ id: 'ORG-HELA', name: 'HeLa cells', scientificName: 'Homo sapiens (HeLa)', category: 'mammalian-cells', subcategory: 'epithelial', taxonomy: 'Eukaryota; Mammalia', morphology: 'Epithelial adherent cells', description: tier('Human cells grown in culture dishes.', 'Immortalised cervical epithelial cell line.', 'Adherent diploid-derived biomedical model.'), cellularOrganisation: 'Eukaryotic with nucleus', characteristics: ['Adherent', 'Human', 'Immortalised'], preferredEnvironment: { temperature: 37, ph: 7.4, oxygen: 21 }, morphologySupported: true, tags: ['cell-line', 'epithelial'], keywords: ['hela', 'cervical'] }),
  org({ id: 'ORG-NEURON', name: 'Neuron (reference)', scientificName: 'Neuron (generic)', category: 'mammalian-cells', subcategory: 'neuron', taxonomy: 'Nervous tissue', morphology: 'Cell body with axon and dendrites', description: tier('Nerve cell that sends signals.', 'Electrically excitable nervous system cell.', 'Polarised cell with synaptic connectivity.'), cellularOrganisation: 'Eukaryotic', characteristics: ['Excitable'], morphologySupported: true, relatedGenes: ['GEN-HTT', 'GEN-APP'], tags: ['neuron', 'nervous'], keywords: ['neuron', 'nerve'] }),
  org({ id: 'ORG-ONION', name: 'Onion epidermis', scientificName: 'Allium cepa (epidermis)', category: 'plant-cells', subcategory: 'epidermis', taxonomy: 'Plantae; Liliaceae', morphology: 'Large rectangular cells with cell walls', description: tier('Plant cells from onion skin — classic microscopy specimen.', 'Plant epidermal cells for teaching.', 'Large vacuolated plant cells with cellulose walls.'), cellularOrganisation: 'Eukaryotic plant cell', characteristics: ['Cell wall visible'], morphologySupported: true, tags: ['plant', 'microscopy'], keywords: ['onion', 'allium'] }),
  org({ id: 'ORG-YEAST', name: "Baker's yeast", scientificName: 'Saccharomyces cerevisiae', category: 'fungi', subcategory: 'yeast', taxonomy: 'Fungi; Saccharomycetes', morphology: 'Oval budding cells', description: tier('Single-celled fungus used in baking and research.', 'Unicellular eukaryotic model fungus.', 'Budding yeast; cell cycle model.'), cellularOrganisation: 'Eukaryotic', characteristics: ['Unicellular', 'Budding'], morphologySupported: true, tags: ['yeast', 'fungi'], keywords: ['saccharomyces'] }),
  org({ id: 'ORG-PHAGE-T4', name: 'Bacteriophage T4', scientificName: 'Enterobacteria phage T4', category: 'viruses', subcategory: 'bacteriophage', taxonomy: 'Virus; Straboviridae', morphology: 'Icosahedral head with tail fibres', description: tier('Virus that infects bacteria.', 'Model bacteriophage for viral replication.', 'Double-stranded DNA phage; lytic cycle model.'), cellularOrganisation: 'Acellular', characteristics: ['DNA virus', 'Lytic'], morphologySupported: false, tags: ['phage', 'dna-virus'], keywords: ['t4', 'bacteriophage'] }),
  org({ id: 'ORG-LIVER', name: 'Liver tissue', scientificName: 'Hepatic tissue (reference)', category: 'tissues', subcategory: 'liver', taxonomy: 'Mammalian hepatic', morphology: 'Hexagonal lobules', description: tier('Liver tissue for learning histology.', 'Hepatic lobule architecture.', 'Hepatocyte plates with sinusoids.'), cellularOrganisation: 'Multicellular tissue', characteristics: ['Lobular'], morphologySupported: true, tags: ['histology', 'liver'], keywords: ['liver', 'hepatic'] }),
  org({ id: 'ORG-ARCH-METH', name: 'Methanogen (reference)', scientificName: 'Methanobrevibacter (reference)', category: 'archaea', subcategory: 'methanogen', taxonomy: 'Archaea; Euryarchaeota', morphology: 'Rod-shaped anaerobe', description: tier('Archaea that produce methane in anaerobic environments.', 'Methanogenic archaeon reference.', 'Anaerobic archaeal metabolism model.'), cellularOrganisation: 'Prokaryotic (archaeal)', characteristics: ['Anaerobic', 'Methanogenic'], morphologySupported: false, tags: ['archaea', 'methanogen'], keywords: ['methanogen', 'archaea'] }),
];

/** Programmatic expansion templates for scale */
const BACTERIAL_TEMPLATES = [
  { sub: 'gram-positive', prefix: 'Gram-positive', forms: ['coccus', 'bacillus', 'spore-former'] },
  { sub: 'gram-negative', prefix: 'Gram-negative', forms: ['bacillus', 'coccobacillus', 'spirillum'] },
  { sub: 'environmental', prefix: 'Environmental', forms: ['soil bacterium', 'water bacterium', 'symbiont'] },
  { sub: 'microbiome', prefix: 'Microbiome-associated', forms: ['gut commensal', 'skin commensal', 'oral commensal'] },
  { sub: 'lab-reference', prefix: 'Laboratory reference', forms: ['model organism', 'biosafety level reference'] },
];

const CELL_TEMPLATES: { sub: string; names: string[] }[] = [
  { sub: 'epithelial', names: ['Epithelial cell', 'Keratinocyte', 'Enterocyte', 'Pneumocyte type II'] },
  { sub: 'neuron', names: ['Pyramidal neuron', 'Purkinje cell', 'Motor neuron', 'Sensory neuron', 'Interneuron'] },
  { sub: 'glial', names: ['Astrocyte', 'Oligodendrocyte', 'Microglia', 'Schwann cell'] },
  { sub: 'muscle', names: ['Skeletal myocyte', 'Cardiomyocyte', 'Smooth muscle cell'] },
  { sub: 'blood', names: ['Erythrocyte', 'Neutrophil', 'Lymphocyte', 'Monocyte', 'Platelet'] },
  { sub: 'immune', names: ['Macrophage', 'Dendritic cell', 'B lymphocyte', 'T lymphocyte', 'NK cell'] },
  { sub: 'organ', names: ['Hepatocyte', 'Podocyte', 'Beta cell (pancreas)', 'Adipocyte', 'Osteocyte', 'Chondrocyte'] },
  { sub: 'stem', names: ['Hematopoietic stem cell', 'Mesenchymal stem cell', 'Neural progenitor cell'] },
];

const TISSUE_NAMES = [
  'Brain cortex', 'Spinal cord', 'Peripheral nerve', 'Heart muscle', 'Lung alveolar region',
  'Kidney cortex', 'Pancreatic islet region', 'Gastric mucosa', 'Small intestine villi',
  'Colon epithelium', 'Skin epidermis', 'Skeletal muscle', 'Smooth muscle', 'Bone matrix',
  'Cartilage', 'Adipose tissue', 'Lymph node', 'Spleen', 'Testis seminiferous tubule', 'Ovary cortex',
];

const VIRUS_FAMILIES = [
  { sub: 'dna-virus', names: ['Herpesvirus (reference)', 'Adenovirus (reference)', 'Papillomavirus (reference)', 'Poxvirus (reference)'] },
  { sub: 'rna-virus', names: ['Influenza A (reference)', 'Coronavirus (reference)', 'Rhinovirus (reference)', 'Rabies virus (reference)'] },
  { sub: 'enveloped', names: ['HIV (reference)', 'Ebola virus (reference)', 'Measles virus (reference)'] },
  { sub: 'non-enveloped', names: ['Poliovirus (reference)', 'Norovirus (reference)', 'Adenovirus (reference)'] },
];

const PLANT_CELL_TYPES = ['Guard cell', 'Root hair cell', 'Xylem vessel element', 'Phloem sieve element', 'Mesophyll cell', 'Meristematic cell', 'Pollen grain'];

const PROTEIN_ENTRIES = [
  { name: 'Green Fluorescent Protein', symbol: 'GFP', sub: 'reporter' },
  { name: 'Insulin', symbol: 'INS', sub: 'hormone' },
  { name: 'Haemoglobin', symbol: 'HBB', sub: 'transport' },
  { name: 'Collagen type I', symbol: 'COL1A1', sub: 'structural' },
  { name: 'Actin', symbol: 'ACTB', sub: 'structural' },
  { name: 'Myosin', symbol: 'MYH', sub: 'motor' },
  { name: 'Cytochrome c', symbol: 'CYCS', sub: 'metabolic' },
  { name: 'PD-1', symbol: 'PDCD1', sub: 'receptor' },
  { name: 'ACE2', symbol: 'ACE2', sub: 'receptor' },
  { name: 'Prion protein (PrP)', symbol: 'PRNP', sub: 'prion' },
  { name: 'Antibody (IgG concept)', symbol: 'IgG', sub: 'antibody' },
  { name: 'Sodium-potassium ATPase', symbol: 'ATP1A1', sub: 'transport' },
  { name: 'GABA receptor', symbol: 'GABRA1', sub: 'ion-channel' },
  { name: 'p53 protein', symbol: 'TP53', sub: 'tumour-suppressor' },
  { name: 'CFTR channel', symbol: 'CFTR', sub: 'ion-channel' },
];

function slug(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase().slice(0, 24);
}

function generateOrganisms(): OrganismCatalogueEntry[] {
  const generated: OrganismCatalogueEntry[] = [...SEEDS];
  let idx = 100;

  for (const tmpl of BACTERIAL_TEMPLATES) {
    for (const form of tmpl.forms) {
      for (let i = 1; i <= 8; i++) {
        const name = `${tmpl.prefix} ${form} ${i} (reference)`;
        const id = `ORG-BAC-${idx++}`;
        generated.push(org({
          id, name, scientificName: `Bacterial reference strain ${idx}`, category: 'bacteria', subcategory: tmpl.sub,
          taxonomy: 'Bacteria', morphology: form.includes('coccus') ? 'Cocci' : form.includes('spir') ? 'Spiral' : 'Rod-shaped',
          description: tier(`${name} — educational bacterial reference.`, `Reference ${tmpl.sub} bacterium (${form}).`, `Catalogue reference entry for ${form} morphology.`),
          cellularOrganisation: 'Prokaryotic', characteristics: [tmpl.sub, form], morphologySupported: true,
          tags: ['bacteria', tmpl.sub, form], keywords: [form, tmpl.sub, 'bacteria'],
          safetyClass: tmpl.sub === 'lab-reference' ? 'non-pathogenic' : 'standard',
        }));
      }
    }
  }

  for (const tmpl of CELL_TEMPLATES) {
    for (const cellName of tmpl.names) {
      const id = `ORG-CELL-${slug(cellName)}`;
      generated.push(org({
        id, name: cellName, scientificName: `${cellName} (reference)`, category: 'mammalian-cells', subcategory: tmpl.sub,
        taxonomy: 'Eukaryota; Mammalia', morphology: 'Variable by cell type',
        description: tier(`${cellName} — representative mammalian cell type.`, `Educational reference for ${cellName}.`, `Catalogue cell-type reference.`),
        cellularOrganisation: 'Eukaryotic', characteristics: [tmpl.sub], preferredEnvironment: { temperature: 37, ph: 7.4, oxygen: 21 },
        morphologySupported: true, tags: ['cell', tmpl.sub], keywords: [cellName.toLowerCase(), tmpl.sub],
      }));
    }
  }

  for (const tissue of TISSUE_NAMES) {
    generated.push(org({
      id: `ORG-TIS-${slug(tissue)}`, name: tissue, scientificName: `${tissue} (reference)`, category: 'tissues', subcategory: 'histology',
      taxonomy: 'Multicellular tissue', morphology: 'Tissue-specific architecture',
      description: tier(`${tissue} — histology reference.`, `Normal/reference ${tissue.toLowerCase()} for education.`, `Histological reference specimen.`),
      cellularOrganisation: 'Multicellular tissue', characteristics: ['Histology'], morphologySupported: true,
      tags: ['tissue', 'histology'], keywords: [tissue.toLowerCase()],
      compatibleModules: ['microscope', 'notebook', 'project'],
    }));
  }

  for (const fam of VIRUS_FAMILIES) {
    for (const vname of fam.names) {
      generated.push(org({
        id: `ORG-VIR-${slug(fam.sub)}-${slug(vname)}`, name: vname, scientificName: vname.replace(' (reference)', ''), category: 'viruses', subcategory: fam.sub,
        taxonomy: 'Virus', morphology: fam.sub.includes('enveloped') ? 'Enveloped virion' : 'Non-enveloped virion',
        description: tier(`${vname} — educational virus reference only.`, 'Viral taxonomy and structure reference.', 'Non-operational pathogen reference entry.'),
        cellularOrganisation: 'Acellular', characteristics: [fam.sub], morphologySupported: false,
        pathogenInfo: 'educational-reference-only', safetyClass: 'reference-pathogen',
        tags: ['virus', fam.sub], keywords: [vname.toLowerCase()],
        compatibleModules: ['pathway-explorer', 'notebook', 'project'],
      }));
    }
  }

  for (const pc of PLANT_CELL_TYPES) {
    generated.push(org({
      id: `ORG-PLT-${slug(pc)}`, name: pc, scientificName: `${pc} (plant reference)`, category: 'plant-cells', subcategory: 'plant',
      taxonomy: 'Plantae', morphology: 'Plant cell morphology',
      description: tier(`${pc} — plant cell reference.`, `Educational plant cell type: ${pc}.`, 'Plant cell catalogue reference.'),
      cellularOrganisation: 'Eukaryotic plant cell', characteristics: ['Plant'], morphologySupported: true,
      tags: ['plant'], keywords: [pc.toLowerCase()],
    }));
  }

  const fungiTypes = ['Aspergillus (reference)', 'Penicillium (reference)', 'Candida (reference)', 'Neurospora (reference)', 'Schizosaccharomyces pombe'];
  for (const f of fungiTypes) {
    generated.push(org({
      id: `ORG-FUN-${slug(f)}`, name: f, scientificName: f, category: 'fungi', subcategory: f.includes('yeast') ? 'yeast' : 'mould',
      taxonomy: 'Fungi', morphology: 'Filamentous or unicellular',
      description: tier(`${f} — fungal reference.`, 'Educational fungal reference entry.', 'Fungal morphology reference.'),
      cellularOrganisation: 'Eukaryotic', characteristics: ['Fungi'], morphologySupported: true,
      tags: ['fungi'], keywords: [f.toLowerCase()],
    }));
  }

  const parasites = ['Plasmodium falciparum (reference)', 'Toxoplasma gondii (reference)', 'Giardia (reference)', 'Trypanosoma (reference)', 'Ascaris (reference)', 'Tapeworm (reference)'];
  for (const p of parasites) {
    generated.push(org({
      id: `ORG-PAR-${slug(p)}`, name: p, scientificName: p, category: 'parasites', subcategory: p.includes('worm') || p.includes('Ascaris') || p.includes('Tapeworm') ? 'helminth' : 'protozoan',
      taxonomy: 'Parasite reference', morphology: 'Parasite-specific',
      description: tier(`${p} — educational parasite reference.`, 'Parasite biology reference only.', 'Non-operational parasite reference.'),
      cellularOrganisation: 'Eukaryotic', characteristics: ['Parasite'], morphologySupported: false,
      pathogenInfo: 'educational-reference-only', safetyClass: 'reference-pathogen',
      tags: ['parasite'], keywords: [p.toLowerCase()],
    }));
  }

  const archaeaTypes = ['Halophile (reference)', 'Thermophile (reference)', 'Sulfolobus (reference)', 'Archaeal extremophile (reference)'];
  for (const a of archaeaTypes) {
    generated.push(org({
      id: `ORG-ARC-${slug(a)}`, name: a, scientificName: a, category: 'archaea', subcategory: a.split(' ')[0].toLowerCase(),
      taxonomy: 'Archaea', morphology: 'Archaeal cell',
      description: tier(`${a} — archaea educational reference.`, 'Archaeal diversity reference.', 'Archaea catalogue entry.'),
      cellularOrganisation: 'Prokaryotic (archaeal)', characteristics: ['Archaea'], morphologySupported: false,
      tags: ['archaea'], keywords: [a.toLowerCase()],
    }));
  }

  for (const pr of PROTEIN_ENTRIES) {
    generated.push(org({
      id: `ORG-PRO-${pr.symbol}`, name: pr.name, scientificName: pr.name, category: 'proteins', subcategory: pr.sub,
      taxonomy: 'Protein', morphology: 'Globular or structural protein',
      description: tier(`${pr.name} — protein reference.`, `Educational protein: ${pr.name}.`, `Protein function reference (${pr.sub}).`),
      cellularOrganisation: 'Protein', characteristics: [pr.sub], morphologySupported: false,
      relatedGenes: pr.symbol.length <= 6 ? [`GEN-${pr.symbol}`] : undefined,
      tags: ['protein', pr.sub], keywords: [pr.name.toLowerCase(), pr.symbol.toLowerCase()],
      compatibleModules: ['molecule-explorer', 'pathway-explorer', 'notebook'],
    }));
  }

  const prionEntries = [
    { name: 'Cellular prion protein (PrPC)', desc: 'Normal cellular form of prion protein.' },
    { name: 'Misfolded prion concept (PrPSc)', desc: 'Misfolded prion state — educational concept only.' },
    { name: 'Creutzfeldt-Jakob disease (reference context)', desc: 'Human prion disease reference context.' },
    { name: 'Scrapie (animal prion reference)', desc: 'Animal prion disease reference context.' },
  ];
  for (const pr of prionEntries) {
    generated.push(org({
      id: `ORG-PRI-${slug(pr.name)}`, name: pr.name, scientificName: pr.name, category: 'prions', subcategory: 'prion',
      taxonomy: 'Proteinaceous particle reference', morphology: 'Protein aggregate concept',
      description: tier(pr.desc, pr.desc, 'Educational prion biology reference — non-operational.'),
      cellularOrganisation: 'Protein aggregate', characteristics: ['Prion'], morphologySupported: false,
      pathogenInfo: 'educational-reference-only', tags: ['prion'], keywords: ['prion', 'prnp'],
      compatibleModules: ['pathway-explorer', 'notebook'],
    }));
  }

  return generated;
}

export const ORGANISM_CATALOGUE: OrganismCatalogueEntry[] = generateOrganisms();

export const ORGANISM_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'bacteria', label: 'Bacteria' },
  { value: 'archaea', label: 'Archaea' },
  { value: 'fungi', label: 'Fungi' },
  { value: 'viruses', label: 'Viruses' },
  { value: 'parasites', label: 'Parasites' },
  { value: 'mammalian-cells', label: 'Human/Animal Cells' },
  { value: 'plant-cells', label: 'Plant Cells' },
  { value: 'tissues', label: 'Tissues/Histology' },
  { value: 'proteins', label: 'Proteins' },
  { value: 'prions', label: 'Prions' },
];
