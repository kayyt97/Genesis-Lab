import type { TieredText } from '../types/language';
import type { EvidenceMeta } from '../types/evidence';
import type { OrganismCategory } from '../types';

export type ReferenceCategory =
  | OrganismCategory
  | 'parasites'
  | 'tissues'
  | 'non-pathogenic-lab'
  | 'other';

export interface BiologicalReferenceEntry {
  id: string;
  name: string;
  scientificName: string;
  category: ReferenceCategory;
  taxonomy: string;
  morphology: string;
  description: TieredText;
  characteristics: string[];
  preferredEnvironment?: {
    temperature?: number;
    ph?: number;
    oxygen?: number;
    salinity?: number;
    nutrientAvailability?: number;
  };
  cellularOrganisation: string;
  relatedGenes?: string[];
  relatedPathways?: string[];
  morphologySupported: boolean;
  pathogenInfo?: 'educational-reference-only';
  evidence: EvidenceMeta;
}

function entry(
  partial: Omit<BiologicalReferenceEntry, 'evidence'> & { evidence?: EvidenceMeta },
): BiologicalReferenceEntry {
  return { evidence: { level: 'reference-data' }, ...partial };
}

export const BIOLOGICAL_LIBRARY: BiologicalReferenceEntry[] = [
  entry({
    id: 'REF-ECOLI', name: 'E. coli', scientificName: 'Escherichia coli', category: 'bacteria',
    taxonomy: 'Bacteria; Gammaproteobacteria', morphology: 'Rod-shaped (bacillus), ~2 µm',
    description: { simple: 'Common bacterium used in labs to study growth and genetics.', standard: 'Facultative anaerobic Gram-negative model bacterium.', technical: 'Mesophilic enterobacterium; model organism for molecular biology.' },
    characteristics: ['Gram-negative', 'Facultative anaerobe', 'Mesophilic'], cellularOrganisation: 'Prokaryotic, no nucleus',
    preferredEnvironment: { temperature: 37, ph: 7.0, oxygen: 21, nutrientAvailability: 80 },
    relatedGenes: ['GEN-TP53'], relatedPathways: ['PATH-CELL-CYCLE'], morphologySupported: true,
  }),
  entry({
    id: 'REF-BSUB', name: 'B. subtilis', scientificName: 'Bacillus subtilis', category: 'bacteria',
    taxonomy: 'Bacteria; Bacillales', morphology: 'Rod-shaped, forms endospores',
    description: { simple: 'Soil bacterium that can form tough spores.', standard: 'Gram-positive spore-forming bacterium.', technical: 'Endospore-forming firmicute; model for sporulation studies.' },
    characteristics: ['Gram-positive', 'Spore-forming', 'Aerobic'], cellularOrganisation: 'Prokaryotic',
    preferredEnvironment: { temperature: 30, ph: 7.0, oxygen: 21 }, morphologySupported: true,
  }),
  entry({
    id: 'REF-SAUREUS', name: 'S. aureus (reference)', scientificName: 'Staphylococcus aureus', category: 'bacteria',
    taxonomy: 'Bacteria; Bacillales', morphology: 'Cocci in clusters (grape-like)',
    description: { simple: 'A round bacterium often found on skin. Educational reference only — not for culture instructions.', standard: 'Gram-positive coccus; pathogenic strains exist. Reference data only.', technical: 'Facultative anaerobe; biofilm-capable pathogen reference.' },
    characteristics: ['Gram-positive', 'Coccus', 'Facultative anaerobe'], cellularOrganisation: 'Prokaryotic',
    preferredEnvironment: { temperature: 37, ph: 7.4 }, morphologySupported: true, pathogenInfo: 'educational-reference-only',
  }),
  entry({
    id: 'REF-INFLUENZA', name: 'Influenza A (reference)', scientificName: 'Influenza A virus', category: 'viruses',
    taxonomy: 'Virus; Orthomyxoviridae', morphology: 'Enveloped, ~80–120 nm',
    description: { simple: 'A virus that causes flu. Shown here for learning about viruses, not for lab work.', standard: 'Enveloped RNA virus; educational taxonomy reference.', technical: 'Segmented negative-sense RNA virus; antigenic drift reference.' },
    characteristics: ['Enveloped', 'RNA genome', 'Obligate intracellular'], cellularOrganisation: 'Acellular',
    preferredEnvironment: { temperature: 37 }, morphologySupported: false, pathogenInfo: 'educational-reference-only',
  }),
  entry({
    id: 'REF-BACTERIOPHAGE', name: 'Bacteriophage T4', scientificName: 'Enterobacteria phage T4', category: 'viruses',
    taxonomy: 'Virus; Straboviridae', morphology: 'Icosahedral head with tail fibres',
    description: { simple: 'A virus that infects bacteria — useful for learning how viruses attach to cells.', standard: 'Model bacteriophage for viral replication studies.', technical: 'Double-stranded DNA phage; lytic cycle model organism.' },
    characteristics: ['DNA virus', 'Lytic phage'], cellularOrganisation: 'Acellular',
    morphologySupported: false,
  }),
  entry({
    id: 'REF-YEAST', name: "Baker's yeast", scientificName: 'Saccharomyces cerevisiae', category: 'fungi',
    taxonomy: 'Fungi; Saccharomycetes', morphology: 'Oval budding cells, ~5–10 µm',
    description: { simple: 'Single-celled fungus used in baking and research.', standard: 'Unicellular eukaryotic model fungus.', technical: 'Budding yeast; eukaryotic cell cycle model.' },
    characteristics: ['Unicellular', 'Budding', 'Eukaryotic'], cellularOrganisation: 'Eukaryotic with nucleus',
    preferredEnvironment: { temperature: 30, ph: 5.5, oxygen: 21 }, morphologySupported: true,
  }),
  entry({
    id: 'REF-ASPERGILLUS', name: 'Aspergillus (reference)', scientificName: 'Aspergillus fumigatus', category: 'fungi',
    taxonomy: 'Fungi; Eurotiomycetes', morphology: 'Filamentous hyphae with conidia',
    description: { simple: 'A mould fungus. Reference information for learning fungal structure.', standard: 'Filamentous fungus; opportunistic pathogen reference.', technical: 'Conidiophore-producing ascomycete; biofilm reference.' },
    characteristics: ['Filamentous', 'Spore-forming'], cellularOrganisation: 'Eukaryotic, multicellular hyphae',
    morphologySupported: true, pathogenInfo: 'educational-reference-only',
  }),
  entry({
    id: 'REF-HELA', name: 'HeLa cells', scientificName: 'Homo sapiens (HeLa)', category: 'mammalian-cells',
    taxonomy: 'Eukaryota; Mammalia', morphology: 'Epithelial, adherent',
    description: { simple: 'Human cells grown in dishes for research.', standard: 'Immortalised human cervical epithelial cell line.', technical: 'Adherent diploid-derived cell line; biomedical model.' },
    characteristics: ['Adherent', 'Human origin', 'Immortalised'], cellularOrganisation: 'Eukaryotic with nucleus and organelles',
    preferredEnvironment: { temperature: 37, ph: 7.4, oxygen: 21 }, morphologySupported: true,
  }),
  entry({
    id: 'REF-NEURON', name: 'Neuron (reference)', scientificName: 'Neuron (generic model)', category: 'mammalian-cells',
    taxonomy: 'Eukaryota; Nervous tissue', morphology: 'Cell body with axon and dendrites',
    description: { simple: 'A nerve cell that sends signals.', standard: 'Electrically excitable cell of the nervous system.', technical: 'Polarised cell with synaptic connectivity; HTT expression in some populations.' },
    characteristics: ['Excitable', 'Polarised morphology'], cellularOrganisation: 'Eukaryotic',
    relatedGenes: ['GEN-HTT'], relatedPathways: ['PATH-HTT'], morphologySupported: true,
  }),
  entry({
    id: 'REF-ONION', name: 'Onion epidermis', scientificName: 'Allium cepa (epidermal cells)', category: 'plant-cells',
    taxonomy: 'Plantae; Liliaceae', morphology: 'Large rectangular cells with visible cell walls',
    description: { simple: 'Plant cells from onion skin — often used to see cell walls under a microscope.', standard: 'Plant epidermal cells; classic microscopy teaching specimen.', technical: 'Large vacuolated plant cells with cellulose walls.' },
    characteristics: ['Cell wall visible', 'Large vacuole'], cellularOrganisation: 'Eukaryotic plant cell',
    morphologySupported: true,
  }),
  entry({
    id: 'REF-PLASMODIUM', name: 'Plasmodium (reference)', scientificName: 'Plasmodium falciparum', category: 'parasites',
    taxonomy: 'Apicomplexa; Haemosporida', morphology: 'Intracellular parasite within red blood cells',
    description: { simple: 'A parasite that causes malaria. Educational reference only.', standard: 'Apicomplexan parasite; disease biology reference.', technical: 'Intraerythrocytic protozoan parasite reference.' },
    characteristics: ['Obligate intracellular', 'Vector-borne'], cellularOrganisation: 'Eukaryotic protozoan',
    morphologySupported: false, pathogenInfo: 'educational-reference-only',
  }),
  entry({
    id: 'REF-PRION', name: 'Prion protein (reference)', scientificName: 'PrP (reference)', category: 'prions',
    taxonomy: 'Proteinaceous infectious particle', morphology: 'Misfolded protein aggregate',
    description: { simple: 'A misfolded protein that can cause other proteins to misfold. Reference only.', standard: 'Protein-only infectious agent reference.', technical: 'Conformationally transmitted prion protein reference.' },
    characteristics: ['Protein-only', 'Conformation-dependent'], cellularOrganisation: 'Protein aggregate',
    morphologySupported: false, pathogenInfo: 'educational-reference-only',
  }),
  entry({
    id: 'REF-GFP', name: 'Green Fluorescent Protein', scientificName: 'GFP (Aequorea victoria)', category: 'proteins',
    taxonomy: 'Protein; β-barrel', morphology: 'Globular protein',
    description: { simple: 'A protein that glows green under blue light.', standard: 'Fluorescent reporter protein.', technical: 'Autocatalytic chromophore-forming reporter.' },
    characteristics: ['Fluorescent', 'Reporter'], cellularOrganisation: 'Protein',
    morphologySupported: false,
  }),
  entry({
    id: 'REF-LIVER-TISSUE', name: 'Liver tissue (reference)', scientificName: 'Hepatic tissue (reference)', category: 'tissues',
    taxonomy: 'Mammalian; hepatic', morphology: 'Hexagonal lobules with hepatocytes',
    description: { simple: 'Liver tissue structure for learning histology.', standard: 'Hepatic lobule architecture reference.', technical: 'Organised hepatocyte plates with sinusoidal vasculature.' },
    characteristics: ['Organised lobules', 'Metabolic tissue'], cellularOrganisation: 'Multicellular tissue',
    morphologySupported: true,
  }),
  entry({
    id: 'REF-DROSOPHILA', name: 'Fruit fly', scientificName: 'Drosophila melanogaster', category: 'non-pathogenic-lab',
    taxonomy: 'Animalia; Diptera', morphology: 'Small insect, ~2–3 mm',
    description: { simple: 'A common lab organism for genetics experiments.', standard: 'Model organism for developmental genetics.', technical: 'Dipteran model for gene function and inheritance.' },
    characteristics: ['Short generation time', 'Genetically tractable'], cellularOrganisation: 'Multicellular eukaryote',
    morphologySupported: false,
  }),
  entry({
    id: 'REF-CELEGANS', name: 'C. elegans', scientificName: 'Caenorhabditis elegans', category: 'non-pathogenic-lab',
    taxonomy: 'Animalia; Nematoda', morphology: 'Transparent nematode, ~1 mm',
    description: { simple: 'Tiny worm used to study development and nerves.', standard: 'Nematode model organism.', technical: 'Transparent eutelic nematode; cell lineage mapped.' },
    characteristics: ['Transparent', 'Fixed cell number'], cellularOrganisation: 'Multicellular eukaryote',
    morphologySupported: true,
  }),
];

export function searchBiologicalLibrary(query: string): BiologicalReferenceEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return BIOLOGICAL_LIBRARY;
  return BIOLOGICAL_LIBRARY.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.scientificName.toLowerCase().includes(q) ||
      e.category.includes(q) ||
      e.id.toLowerCase().includes(q),
  );
}

export function getReferenceById(id: string): BiologicalReferenceEntry | undefined {
  return BIOLOGICAL_LIBRARY.find((e) => e.id === id);
}

export const LIBRARY_CATEGORIES: { value: ReferenceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bacteria', label: 'Bacteria' },
  { value: 'viruses', label: 'Viruses' },
  { value: 'fungi', label: 'Fungi' },
  { value: 'parasites', label: 'Parasites' },
  { value: 'mammalian-cells', label: 'Human/Animal Cells' },
  { value: 'plant-cells', label: 'Plant Cells' },
  { value: 'tissues', label: 'Tissues/Histology' },
  { value: 'proteins', label: 'Proteins' },
  { value: 'prions', label: 'Prions' },
  { value: 'non-pathogenic-lab', label: 'Lab Organisms' },
  { value: 'other', label: 'Other' },
];
