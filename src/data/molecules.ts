import type { MoleculeModel } from '../types/scientific';

export const CURATED_MOLECULES: MoleculeModel[] = [
  {
    id: 'MOL-H2O',
    name: 'Water',
    formula: 'H₂O',
    atoms: [],
    bonds: [],
    molecularMass: 18.015,
    charge: 0,
    functionalGroups: ['hydroxyl'],
    biologicalRole: {
      simple: 'Water — the main liquid inside cells and in the body. Life needs water.',
      standard: 'Universal biological solvent; participates in hydrolysis and hydration.',
      technical: 'Dipolar solvent enabling hydrogen bonding networks in cellular compartments.',
    },
    structure2d: [
      { x: 100, y: 80, atomId: 'O' },
      { x: 70, y: 110, atomId: 'H' },
      { x: 130, y: 110, atomId: 'H' },
    ],
    evidence: { level: 'reference-data' },
  },
  {
    id: 'MOL-CO2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    atoms: [],
    bonds: [],
    molecularMass: 44.01,
    charge: 0,
    functionalGroups: ['carbonyl'],
    biologicalRole: {
      simple: 'CO₂ — a gas cells make during respiration. Plants use it in photosynthesis.',
      standard: 'Cellular respiration product; substrate in photosynthesis.',
      technical: 'Gaseous metabolite in carbon fixation and aerobic respiration pathways.',
    },
    structure2d: [
      { x: 70, y: 90, atomId: 'O' },
      { x: 100, y: 90, atomId: 'C' },
      { x: 130, y: 90, atomId: 'O' },
    ],
    evidence: { level: 'reference-data' },
  },
  {
    id: 'MOL-NACL',
    name: 'Sodium Chloride',
    formula: 'NaCl',
    atoms: [],
    bonds: [],
    molecularMass: 58.44,
    charge: 0,
    functionalGroups: ['ionic salt'],
    biologicalRole: {
      simple: 'Table salt — helps control water balance in cells when dissolved.',
      standard: 'Electrolyte affecting osmolarity and nerve signalling.',
      technical: 'Ionic compound dissociating to Na⁺ and Cl⁻ in aqueous biological fluids.',
    },
    structure2d: [
      { x: 85, y: 90, atomId: 'Na' },
      { x: 115, y: 90, atomId: 'Cl' },
    ],
    evidence: { level: 'reference-data' },
  },
  {
    id: 'MOL-GLUC',
    name: 'Glucose',
    formula: 'C₆H₁₂O₆',
    atoms: [],
    bonds: [],
    molecularMass: 180.16,
    charge: 0,
    functionalGroups: ['aldehyde', 'hydroxyl'],
    biologicalRole: {
      simple: 'Glucose — a sugar cells use for energy.',
      standard: 'Primary metabolic fuel via glycolysis.',
      technical: 'Hexose monosaccharide substrate for glycolysis and glycogen metabolism.',
    },
    structure2d: [
      { x: 100, y: 60, atomId: 'C' },
      { x: 80, y: 90, atomId: 'C' },
      { x: 120, y: 90, atomId: 'C' },
      { x: 100, y: 120, atomId: 'O' },
    ],
    evidence: { level: 'reference-data' },
  },
];

export function renderMolecule2dSvg(molecule: MoleculeModel): string {
  const nodes = molecule.structure2d ?? [];
  const bonds: string[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    bonds.push(
      `<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[i + 1].x}" y2="${nodes[i + 1].y}" stroke="#4fc3f7" stroke-width="2"/>`,
    );
  }
  const atoms = nodes
    .map(
      (n) =>
        `<circle cx="${n.x}" cy="${n.y}" r="16" fill="#1e2a3a" stroke="#38bdf8" stroke-width="2"/><text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="#e8edf4" font-size="11">${n.atomId}</text>`,
    )
    .join('');
  return `<svg viewBox="0 0 200 160" class="mol-svg">${bonds.join('')}${atoms}</svg>`;
}
