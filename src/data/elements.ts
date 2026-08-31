import type { AtomModel } from '../types/scientific';

export interface ElementDef {
  symbol: string;
  name: string;
  atomicNumber: number;
  defaultNeutrons: number;
  group: string;
  period: number;
}

export const ELEMENTS: ElementDef[] = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, defaultNeutrons: 0, group: '1', period: 1 },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, defaultNeutrons: 6, group: '14', period: 2 },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, defaultNeutrons: 7, group: '15', period: 2 },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, defaultNeutrons: 8, group: '16', period: 2 },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, defaultNeutrons: 12, group: '1', period: 3 },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, defaultNeutrons: 18, group: '17', period: 3 },
  { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, defaultNeutrons: 16, group: '15', period: 3 },
  { symbol: 'S', name: 'Sulfur', atomicNumber: 16, defaultNeutrons: 16, group: '16', period: 3 },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26, defaultNeutrons: 30, group: '8', period: 4 },
  { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, defaultNeutrons: 20, group: '2', period: 4 },
];

export function buildAtom(
  element: ElementDef,
  opts: { neutrons?: number; charge?: number; isotope?: string } = {},
): AtomModel {
  const neutrons = opts.neutrons ?? element.defaultNeutrons;
  const charge = opts.charge ?? 0;
  const electrons = element.atomicNumber - charge;
  return {
    id: `AT-${element.symbol}-${Date.now().toString(36)}`,
    element: element.name,
    symbol: element.symbol,
    atomicNumber: element.atomicNumber,
    protons: element.atomicNumber,
    neutrons,
    electrons,
    charge,
    isotope: opts.isotope,
    energyState: 'ground',
  };
}

export const ATOMIC_LAB_LIMITATIONS = {
  simple:
    'Atomic Lab uses simple counting rules, not quantum mechanics. Bond energies and electron clouds are not calculated accurately.',
  standard:
    'This is an educational atomic model. It does not perform quantum chemistry, molecular orbital, or ab initio calculations.',
  technical:
    'Prototype deterministic atom builder. No Schrödinger solver, no DFT, no force-field minimisation. Bond formation uses curated compatibility rules only.',
};
