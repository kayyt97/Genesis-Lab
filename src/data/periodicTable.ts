import type { ElementDef } from './elements';

/** Standard element names in atomic number order (1–118) */
const NAMES = [
  'Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen', 'Fluorine', 'Neon',
  'Sodium', 'Magnesium', 'Aluminium', 'Silicon', 'Phosphorus', 'Sulfur', 'Chlorine', 'Argon', 'Potassium', 'Calcium',
  'Scandium', 'Titanium', 'Vanadium', 'Chromium', 'Manganese', 'Iron', 'Cobalt', 'Nickel', 'Copper', 'Zinc',
  'Gallium', 'Germanium', 'Arsenic', 'Selenium', 'Bromine', 'Krypton', 'Rubidium', 'Strontium', 'Yttrium', 'Zirconium',
  'Niobium', 'Molybdenum', 'Technetium', 'Ruthenium', 'Rhodium', 'Palladium', 'Silver', 'Cadmium', 'Indium', 'Tin',
  'Antimony', 'Tellurium', 'Iodine', 'Xenon', 'Caesium', 'Barium', 'Lanthanum', 'Cerium', 'Praseodymium', 'Neodymium',
  'Promethium', 'Samarium', 'Europium', 'Gadolinium', 'Terbium', 'Dysprosium', 'Holmium', 'Erbium', 'Thulium', 'Ytterbium',
  'Lutetium', 'Hafnium', 'Tantalum', 'Tungsten', 'Rhenium', 'Osmium', 'Iridium', 'Platinum', 'Gold', 'Mercury',
  'Thallium', 'Lead', 'Bismuth', 'Polonium', 'Astatine', 'Radon', 'Francium', 'Radium', 'Actinium', 'Thorium',
  'Protactinium', 'Uranium', 'Neptunium', 'Plutonium', 'Americium', 'Curium', 'Berkelium', 'Californium', 'Einsteinium', 'Fermium',
  'Mendelevium', 'Nobelium', 'Lawrencium', 'Rutherfordium', 'Dubnium', 'Seaborgium', 'Bohrium', 'Hassium', 'Meitnerium', 'Darmstadtium',
  'Roentgenium', 'Copernicium', 'Nihonium', 'Flerovium', 'Moscovium', 'Livermorium', 'Tennessine', 'Oganesson',
];

const SYMBOLS = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
  'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
  'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
];

/** Approximate standard atomic weights (educational reference) */
const ATOMIC_MASSES = [
  1.008, 4.003, 6.94, 9.012, 10.81, 12.011, 14.007, 15.999, 18.998, 20.180,
  22.990, 24.305, 26.982, 28.085, 30.974, 32.06, 35.45, 39.948, 39.098, 40.078,
  44.956, 47.867, 50.942, 51.996, 54.938, 55.845, 58.933, 58.693, 63.546, 65.38,
  69.723, 72.630, 74.922, 78.971, 79.904, 83.798, 85.468, 87.62, 88.906, 91.224,
  92.906, 95.95, 98, 101.07, 102.91, 106.42, 107.87, 112.41, 114.82, 118.71,
  121.76, 127.60, 126.90, 131.29, 132.91, 137.33, 138.91, 140.12, 140.91, 144.24,
  145, 150.36, 151.96, 157.25, 158.93, 162.50, 164.93, 167.26, 168.93, 173.05,
  174.97, 178.49, 180.95, 183.84, 186.21, 190.23, 192.22, 195.08, 196.97, 200.59,
  204.38, 207.2, 208.98, 209, 210, 222, 223, 226, 227, 232.04,
  231.04, 238.03, 237, 244, 243, 247, 247, 251, 252, 257,
  258, 259, 266, 267, 268, 269, 270, 270, 278, 281,
  282, 285, 286, 289, 290, 293, 294, 294,
];

const RADIOACTIVE = new Set([
  'Tc', 'Pm', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
  'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
]);

function getPeriod(n: number): number {
  if (n <= 2) return 1;
  if (n <= 10) return 2;
  if (n <= 18) return 3;
  if (n <= 36) return 4;
  if (n <= 54) return 5;
  if (n <= 86) return 6;
  return 7;
}

function getClassification(n: number, symbol: string): string {
  if (n === 1) return 'nonmetal';
  if (n === 2) return 'noble gas';
  if (['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'].includes(symbol)) return 'alkali metal';
  if (['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra'].includes(symbol)) return 'alkaline earth metal';
  if (['F', 'Cl', 'Br', 'I', 'At', 'Ts'].includes(symbol)) return 'halogen';
  if (['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og'].includes(symbol)) return 'noble gas';
  if (n >= 57 && n <= 71) return 'lanthanide';
  if (n >= 89 && n <= 103) return 'actinide';
  if (['Fe', 'Co', 'Ni', 'Cu', 'Zn'].includes(symbol)) return 'transition metal';
  if (RADIOACTIVE.has(symbol)) return 'radioactive';
  if (n >= 21 && n <= 30) return 'transition metal';
  if (n >= 39 && n <= 48) return 'transition metal';
  if (n >= 72 && n <= 80) return 'transition metal';
  if (['B', 'C', 'N', 'O', 'P', 'S', 'Se'].includes(symbol)) return 'nonmetal';
  if (['Si', 'Ge', 'As', 'Sb', 'Te'].includes(symbol)) return 'metalloid';
  return 'metal';
}

function getGroup(_n: number, symbol: string): number {
  const map: Record<string, number> = {
    H: 1, Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Fr: 1,
    Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Ra: 2,
    Sc: 3, Y: 3, La: 3, Ac: 3,
    Ti: 4, Zr: 4, Hf: 4, Rf: 4,
    V: 5, Nb: 5, Ta: 5, Db: 5,
    Cr: 6, Mo: 6, W: 6, Sg: 6,
    Mn: 7, Tc: 7, Re: 7, Bh: 7,
    Fe: 8, Ru: 8, Os: 8, Hs: 8,
    Co: 9, Rh: 9, Ir: 9, Mt: 9,
    Ni: 10, Pd: 10, Pt: 10, Ds: 10,
    Cu: 11, Ag: 11, Au: 11, Rg: 11,
    Zn: 12, Cd: 12, Hg: 12, Cn: 12,
    B: 13, Al: 13, Ga: 13, In: 13, Tl: 13, Nh: 13,
    C: 14, Si: 14, Ge: 14, Sn: 14, Pb: 14, Fl: 14,
    N: 15, P: 15, As: 15, Sb: 15, Bi: 15, Mc: 15,
    O: 16, S: 16, Se: 16, Te: 16, Po: 16, Lv: 16,
    F: 17, Cl: 17, Br: 17, I: 17, At: 17, Ts: 17,
    He: 18, Ne: 18, Ar: 18, Kr: 18, Xe: 18, Rn: 18, Og: 18,
  };
  return map[symbol] ?? 0;
}

export interface FullElementDef extends ElementDef {
  atomicMass: number;
  classification: string;
  electronConfig: string;
  radioactive: boolean;
  halfLife?: string;
  decayMode?: string;
}

export const PERIODIC_TABLE: FullElementDef[] = SYMBOLS.map((symbol, i) => {
  const atomicNumber = i + 1;
  const defaultNeutrons = Math.round(ATOMIC_MASSES[i]) - atomicNumber;
  return {
    symbol,
    name: NAMES[i],
    atomicNumber,
    defaultNeutrons: Math.max(0, defaultNeutrons),
    group: String(getGroup(atomicNumber, symbol)),
    period: getPeriod(atomicNumber),
    atomicMass: ATOMIC_MASSES[i],
    classification: getClassification(atomicNumber, symbol),
    electronConfig: `[${atomicNumber}e]`, // simplified placeholder
    radioactive: RADIOACTIVE.has(symbol),
    halfLife: RADIOACTIVE.has(symbol) ? 'Varies by isotope — reference data' : undefined,
    decayMode: RADIOACTIVE.has(symbol) ? 'Alpha/beta decay (isotope-dependent)' : undefined,
  };
});

export function getElementBySymbol(symbol: string): FullElementDef | undefined {
  return PERIODIC_TABLE.find((e) => e.symbol === symbol);
}

export function getElementByNumber(n: number): FullElementDef | undefined {
  return PERIODIC_TABLE.find((e) => e.atomicNumber === n);
}

/** Periodic table grid positions for rendering (period, group) */
export function getTablePosition(el: FullElementDef): { row: number; col: number } {
  if (el.atomicNumber >= 57 && el.atomicNumber <= 71) {
    return { row: 8, col: el.atomicNumber - 57 + 3 };
  }
  if (el.atomicNumber >= 89 && el.atomicNumber <= 103) {
    return { row: 9, col: el.atomicNumber - 89 + 3 };
  }
  const group = getGroup(el.atomicNumber, el.symbol);
  return { row: el.period, col: group || 1 };
}
