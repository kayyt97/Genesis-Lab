import type { MoleculeModel } from '../types/scientific';
import { MOLECULE_CATALOGUE } from '../catalogue/data/molecules';

/** Legacy-compatible molecule list derived from scalable catalogue */
export const CURATED_MOLECULES: MoleculeModel[] = MOLECULE_CATALOGUE.map((m) => ({
  id: m.id,
  name: m.name,
  formula: m.formula,
  atoms: [],
  bonds: [],
  molecularMass: m.molecularMass,
  charge: m.charge,
  functionalGroups: m.functionalGroups,
  biologicalRole: m.biologicalRole,
  structure2d: m.elements.slice(0, 4).map((el, i) => ({
    x: 70 + i * 30,
    y: 90,
    atomId: el,
  })),
  evidence: m.evidence,
}));

export { MOLECULE_CATALOGUE, moleculesContainingElement, MOLECULE_LIBRARY_CATEGORIES } from '../catalogue/data/molecules';

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

export function catalogueEntryToMoleculeModel(id: string): MoleculeModel | undefined {
  return CURATED_MOLECULES.find((m) => m.id === id);
}
