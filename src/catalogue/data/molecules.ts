import type { MoleculeCatalogueEntry, MoleculeCategory } from '../types';
import type { TieredText } from '../../types/language';
import { CatalogueIndex } from '../CatalogueIndex';

function tier(s: string, std?: string, tech?: string): TieredText {
  return { simple: s, standard: std ?? s, technical: tech ?? std ?? s };
}

function mol(
  id: string,
  name: string,
  formula: string,
  mass: number,
  elements: string[],
  category: MoleculeCategory,
  role: TieredText,
  aliases: string[] = [],
  charge = 0,
): MoleculeCatalogueEntry {
  return {
    id,
    name,
    formula,
    molecularMass: mass,
    charge,
    elements,
    functionalGroups: [],
    biologicalRole: role,
    pathwayIds: [],
    category,
    aliases,
    description: role,
    summary: role,
    tags: [category, ...elements.map((e) => e.toLowerCase())],
    keywords: [name.toLowerCase(), formula.toLowerCase(), ...aliases.map((a) => a.toLowerCase()), ...elements],
    relatedIds: [],
    compatibleModules: ['molecule-explorer', 'molecular-library', 'pathway-explorer', 'notebook'],
    evidence: { level: 'reference-data' },
  };
}

const CORE: MoleculeCatalogueEntry[] = [
  mol('MOL-H2O', 'Water', 'H₂O', 18.015, ['H', 'O'], 'water-solvent', tier('Main biological solvent.', 'Universal biological solvent.', 'Dipolar solvent; hydrogen bonding.')),
  mol('MOL-CO2', 'Carbon dioxide', 'CO₂', 44.01, ['C', 'O'], 'gas', tier('Respiration product; photosynthesis substrate.', 'Cellular respiration product.', 'Gaseous metabolite.')),
  mol('MOL-O2', 'Oxygen', 'O₂', 32.0, ['O'], 'gas', tier('Gas used in aerobic respiration.', 'Electron acceptor in aerobic respiration.', 'O₂ terminal electron acceptor.')),
  mol('MOL-N2', 'Nitrogen', 'N₂', 28.014, ['N'], 'gas', tier('Major atmospheric gas.', 'Atmospheric diatomic nitrogen.', 'Inert atmospheric N₂.')),
  mol('MOL-NACL', 'Sodium chloride', 'NaCl', 58.44, ['Na', 'Cl'], 'salt', tier('Table salt; electrolyte.', 'Electrolyte affecting osmolarity.', 'Ionic NaCl dissociation.')),
  mol('MOL-GLUC', 'Glucose', 'C₆H₁₂O₆', 180.16, ['C', 'H', 'O'], 'carbohydrate', tier('Primary cellular fuel sugar.', 'Glycolysis substrate.', 'Hexose monosaccharide.')),
  mol('MOL-ATP', 'ATP', 'C₁₀H₁₆N₅O₁₃P₃', 507.18, ['C', 'H', 'N', 'O', 'P'], 'metabolic', tier('Energy currency of cells.', 'Primary energy carrier.', 'Adenosine triphosphate.')),
  mol('MOL-NADH', 'NADH', 'C₂₁H₂₇N₇O₁₄P₂', 663.43, ['C', 'H', 'N', 'O', 'P'], 'cofactor', tier('Electron carrier in metabolism.', 'Reduced electron carrier.', 'Nicotinamide adenine dinucleotide (reduced).')),
];

const AMINO_ACIDS = ['Alanine', 'Arginine', 'Asparagine', 'Aspartic acid', 'Cysteine', 'Glutamine', 'Glutamic acid', 'Glycine', 'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Proline', 'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine'];

const NUCLEOBASES = ['Adenine', 'Guanine', 'Cytosine', 'Thymine', 'Uracil'];

const VITAMINS = ['Vitamin A (retinol reference)', 'Vitamin B1 (thiamine)', 'Vitamin B12 (cobalamin)', 'Vitamin C (ascorbic acid)', 'Vitamin D3 (cholecalciferol reference)', 'Vitamin E (tocopherol reference)', 'Folate', 'Niacin'];

const NEUROTRANSMITTERS = ['Dopamine', 'Serotonin', 'Acetylcholine', 'GABA', 'Glutamate', 'Norepinephrine', 'Epinephrine', 'Histamine'];

const HORMONES = ['Insulin (reference)', 'Glucagon (reference)', 'Cortisol (reference)', 'Estrogen (reference)', 'Testosterone (reference)', 'Thyroid hormone (T4 reference)', 'Growth hormone (reference)'];

const LAB_COMPOUNDS = ['Ethanol', 'Methanol', 'Isopropanol', 'Formaldehyde (reference)', 'Phenol (reference)', 'Agarose (reference)', 'EDTA', 'Tris buffer', 'PBS buffer', 'Agar'];

const MEDICINES = ['Aspirin', 'Paracetamol', 'Ibuprofen', 'Metformin', 'Atorvastatin', 'Warfarin (reference)', 'Penicillin (reference)', 'Morphine (reference)', 'Caffeine', 'Nicotine (reference)'];

const LIPIDS = ['Palmitic acid', 'Oleic acid', 'Cholesterol', 'Phosphatidylcholine', 'Triglyceride (reference)', 'Sphingomyelin (reference)'];

const ENVIRONMENTAL = ['Methane', 'Ammonia', 'Hydrogen sulfide', 'Ozone', 'Formaldehyde (environmental reference)', 'Benzene (reference)', 'PCB (reference)'];

function generateMolecules(): MoleculeCatalogueEntry[] {
  const list = [...CORE];
  let idx = 100;

  for (const aa of AMINO_ACIDS) {
    list.push(mol(`MOL-AA-${idx++}`, aa, 'C₄H₇NO₂ (generic)', 110, ['C', 'H', 'N', 'O'], 'amino-acid', tier(`${aa} — protein building block.`, `Amino acid: ${aa}.`, `Standard amino acid reference.`)));
  }
  for (const nb of NUCLEOBASES) {
    list.push(mol(`MOL-NB-${idx++}`, nb, 'C₅H₅N₂O (generic)', 135, ['C', 'H', 'N', 'O'], 'nucleobase', tier(`${nb} — DNA/RNA base.`, `Nucleobase: ${nb}.`, `Nitrogenous base reference.`)));
  }
  for (const v of VITAMINS) {
    list.push(mol(`MOL-VIT-${idx++}`, v, 'variable', 300, ['C', 'H', 'O'], 'vitamin', tier(`${v} — vitamin reference.`, `Vitamin reference: ${v}.`, `Micronutrient reference.`)));
  }
  for (const nt of NEUROTRANSMITTERS) {
    list.push(mol(`MOL-NT-${idx++}`, nt, 'variable', 150, ['C', 'H', 'N', 'O'], 'neurotransmitter', tier(`${nt} — signalling molecule in nerves.`, `Neurotransmitter: ${nt}.`, `Synaptic signalling reference.`)));
  }
  for (const h of HORMONES) {
    list.push(mol(`MOL-HORM-${idx++}`, h, 'variable', 300, ['C', 'H', 'O'], 'hormone', tier(`${h} — hormone reference.`, `Endocrine signalling reference.`, `Hormone reference entry.`)));
  }
  for (const lc of LAB_COMPOUNDS) {
    list.push(mol(`MOL-LAB-${idx++}`, lc, 'variable', 100, ['C', 'H', 'O'], 'lab-compound', tier(`${lc} — common laboratory compound.`, `Lab reagent: ${lc}.`, `Laboratory compound reference.`)));
  }
  for (const med of MEDICINES) {
    list.push(mol(`MOL-MED-${idx++}`, med, 'variable', 250, ['C', 'H', 'N', 'O'], 'medicine', tier(`${med} — educational medicine reference.`, `Pharmacology reference: ${med}.`, `Drug reference — not therapeutic recommendation.`), [`${med} reference`]));
  }
  for (const lip of LIPIDS) {
    list.push(mol(`MOL-LIP-${idx++}`, lip, 'variable', 400, ['C', 'H', 'O'], 'lipid', tier(`${lip} — lipid reference.`, `Lipid class reference.`, `Membrane/metabolic lipid reference.`)));
  }
  for (const env of ENVIRONMENTAL) {
    list.push(mol(`MOL-ENV-${idx++}`, env, 'variable', 50, ['C', 'H', 'N', 'O', 'S'], 'environmental', tier(`${env} — environmental molecule.`, `Environmental chemistry reference.`, `Environmental compound reference.`)));
  }

  // Element-linked common compounds
  const elementCompounds: { name: string; formula: string; elements: string[]; cat: MoleculeCategory }[] = [
    { name: 'Calcium carbonate', formula: 'CaCO₃', elements: ['Ca', 'C', 'O'], cat: 'inorganic' },
    { name: 'Iron oxide', formula: 'Fe₂O₃', elements: ['Fe', 'O'], cat: 'inorganic' },
    { name: 'Potassium chloride', formula: 'KCl', elements: ['K', 'Cl'], cat: 'salt' },
    { name: 'Magnesium sulfate', formula: 'MgSO₄', elements: ['Mg', 'S', 'O'], cat: 'salt' },
    { name: 'Hydrochloric acid', formula: 'HCl', elements: ['H', 'Cl'], cat: 'acid-base' },
    { name: 'Sodium hydroxide', formula: 'NaOH', elements: ['Na', 'O', 'H'], cat: 'acid-base' },
    { name: 'Sulfuric acid', formula: 'H₂SO₄', elements: ['H', 'S', 'O'], cat: 'acid-base' },
    { name: 'Ammonium chloride', formula: 'NH₄Cl', elements: ['N', 'H', 'Cl'], cat: 'inorganic' },
    { name: 'Urea', formula: 'CO(NH₂)₂', elements: ['C', 'O', 'N', 'H'], cat: 'metabolic' },
    { name: 'Lactate', formula: 'C₃H₅O₃', elements: ['C', 'H', 'O'], cat: 'metabolic' },
    { name: 'Sodium pertechnetate', formula: 'NaTcO₄', elements: ['Na', 'Tc', 'O'], cat: 'inorganic' },
    { name: 'Technetium-99m pertechnetate', formula: 'NaTcO₄', elements: ['Na', 'Tc', 'O'], cat: 'inorganic' },
    { name: 'Uranium hexafluoride', formula: 'UF₆', elements: ['U', 'F'], cat: 'inorganic' },
    { name: 'Plutonium dioxide', formula: 'PuO₂', elements: ['Pu', 'O'], cat: 'inorganic' },
    { name: 'Cobalt-60 (conceptual)', formula: 'Co', elements: ['Co'], cat: 'inorganic' },
    { name: 'Iodine-131 (conceptual)', formula: 'I', elements: ['I'], cat: 'inorganic' },
    { name: 'Radium chloride', formula: 'RaCl₂', elements: ['Ra', 'Cl'], cat: 'inorganic' },
    { name: 'Polonium (elemental reference)', formula: 'Po', elements: ['Po'], cat: 'inorganic' },
  ];
  for (const c of elementCompounds) {
    list.push(mol(`MOL-EL-${idx++}`, c.name, c.formula, 100, c.elements, c.cat, tier(`${c.name} — contains ${c.elements.join(', ')}.`, `Compound containing ${c.elements.join(', ')}.`, `Reference compound: ${c.formula}.`)));
  }

  return list;
}

export const MOLECULE_CATALOGUE: MoleculeCatalogueEntry[] = generateMolecules();

export const MOLECULE_LIBRARY_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'biochemistry', label: 'Biochemistry' },
  { value: 'cell-biology', label: 'Cell Biology' },
  { value: 'genetics', label: 'Genetics' },
  { value: 'pharmacology', label: 'Pharmacology' },
  { value: 'lab-compound', label: 'Laboratory' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'inorganic', label: 'Inorganic' },
  { value: 'organic', label: 'Organic' },
  { value: 'carbohydrate', label: 'Carbohydrates' },
  { value: 'amino-acid', label: 'Amino Acids' },
  { value: 'lipid', label: 'Lipids' },
  { value: 'medicine', label: 'Medicines (reference)' },
];

export function moleculesContainingElement(symbol: string, search?: string): MoleculeCatalogueEntry[] {
  const byElement = MOLECULE_CATALOGUE.filter((m) => m.elements.includes(symbol));
  if (!search?.trim()) return byElement;
  const idx = new CatalogueIndex(byElement);
  return idx.query({ search: search.trim(), page: 1, pageSize: 10000 }).items;
}
