/** Educational isotope reference data for Atomic Lab */

import { PERIODIC_TABLE } from './periodicTable';

export interface IsotopeReference {
  symbol: string;
  name: string;
  protons: number;
  neutrons: number;
  massNumber: number;
  stable: boolean;
  radioactive: boolean;
  halfLife?: string;
  decayMode?: string;
  daughterNuclide?: string;
  notes?: string;
}

const ISOTOPES: IsotopeReference[] = [
  { symbol: 'H', name: 'Hydrogen-1 (protium)', protons: 1, neutrons: 0, massNumber: 1, stable: true, radioactive: false },
  { symbol: 'H', name: 'Deuterium', protons: 1, neutrons: 1, massNumber: 2, stable: true, radioactive: false },
  { symbol: 'H', name: 'Tritium', protons: 1, neutrons: 2, massNumber: 3, stable: false, radioactive: true, halfLife: '12.3 years', decayMode: 'Beta decay', daughterNuclide: 'Helium-3' },
  { symbol: 'C', name: 'Carbon-12', protons: 6, neutrons: 6, massNumber: 12, stable: true, radioactive: false },
  { symbol: 'C', name: 'Carbon-14', protons: 6, neutrons: 8, massNumber: 14, stable: false, radioactive: true, halfLife: '5,730 years', decayMode: 'Beta decay', daughterNuclide: 'Nitrogen-14' },
  { symbol: 'N', name: 'Nitrogen-14', protons: 7, neutrons: 7, massNumber: 14, stable: true, radioactive: false },
  { symbol: 'O', name: 'Oxygen-16', protons: 8, neutrons: 8, massNumber: 16, stable: true, radioactive: false },
  { symbol: 'Na', name: 'Sodium-23', protons: 11, neutrons: 12, massNumber: 23, stable: true, radioactive: false },
  { symbol: 'Cl', name: 'Chlorine-35', protons: 17, neutrons: 18, massNumber: 35, stable: true, radioactive: false },
  { symbol: 'Fe', name: 'Iron-56', protons: 26, neutrons: 30, massNumber: 56, stable: true, radioactive: false },
  { symbol: 'U', name: 'Uranium-238', protons: 92, neutrons: 146, massNumber: 238, stable: false, radioactive: true, halfLife: '4.5 billion years', decayMode: 'Alpha decay', daughterNuclide: 'Thorium-234' },
  { symbol: 'Ra', name: 'Radium-226', protons: 88, neutrons: 138, massNumber: 226, stable: false, radioactive: true, halfLife: '1,600 years', decayMode: 'Alpha decay', daughterNuclide: 'Radon-222' },
  { symbol: 'Rn', name: 'Radon-222', protons: 86, neutrons: 136, massNumber: 222, stable: false, radioactive: true, halfLife: '3.8 days', decayMode: 'Alpha decay', daughterNuclide: 'Polonium-218' },
  { symbol: 'Tc', name: 'Technetium-99', protons: 43, neutrons: 56, massNumber: 99, stable: false, radioactive: true, halfLife: '211,000 years', decayMode: 'Beta decay', daughterNuclide: 'Ruthenium-99', notes: 'No stable technetium isotopes are known.' },
  { symbol: 'Pb', name: 'Lead-208', protons: 82, neutrons: 126, massNumber: 208, stable: true, radioactive: false },
  { symbol: 'Po', name: 'Polonium-210', protons: 84, neutrons: 126, massNumber: 210, stable: false, radioactive: true, halfLife: '138 days', decayMode: 'Alpha decay', daughterNuclide: 'Lead-206' },
];

function getProtonCount(symbol: string): number {
  const el = PERIODIC_TABLE.find((e) => e.symbol === symbol);
  return el?.atomicNumber ?? 0;
}

function isLikelyStable(protons: number, neutrons: number): boolean {
  if (protons <= 0) return false;
  const ratio = neutrons / protons;
  return ratio >= 0.8 && ratio <= 1.6 && protons < 83;
}

export function getIsotopesForElement(symbol: string): IsotopeReference[] {
  return ISOTOPES.filter((i) => i.symbol === symbol);
}

export function evaluateIsotope(symbol: string, neutrons: number): IsotopeReference & { stabilityExplanation: string } {
  const protons = getProtonCount(symbol);
  const massNumber = protons + neutrons;
  const exact = ISOTOPES.find((i) => i.symbol === symbol && i.neutrons === neutrons);
  if (exact) {
    return {
      ...exact,
      stabilityExplanation: exact.stable
        ? 'This isotope is stable under normal conditions in the educational reference model.'
        : `This isotope is unstable and undergoes radioactive decay (${exact.decayMode ?? 'decay mode reference'}).`,
    };
  }
  const stableKnown = getIsotopesForElement(symbol).some((i) => i.stable);
  const radioactive = !isLikelyStable(protons, neutrons);
  return {
    symbol,
    name: `${elementName(symbol)}-${massNumber}`,
    protons,
    neutrons,
    massNumber,
    stable: !radioactive,
    radioactive,
    halfLife: radioactive ? 'Not in curated reference table — treat as potentially unstable' : undefined,
    decayMode: radioactive ? 'Unknown in reference catalogue' : undefined,
    daughterNuclide: undefined,
    stabilityExplanation: radioactive
      ? 'This neutron count is not listed as a stable reference isotope. It is treated as potentially unstable in this educational model.'
      : 'This isotope composition is not in the curated table but is treated as stable in this simplified model.',
    notes: !stableKnown && radioactive ? 'No stable isotopes of this element are known.' : undefined,
  };
}

function elementName(symbol: string): string {
  return PERIODIC_TABLE.find((e) => e.symbol === symbol)?.name ?? symbol;
}

export function hasStableIsotopes(symbol: string): boolean {
  return getIsotopesForElement(symbol).some((i) => i.stable);
}
