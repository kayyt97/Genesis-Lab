import { PERIODIC_TABLE } from '../data/periodicTable';
import { moleculesContainingElement } from '../catalogue/index';

export interface ResolvedElement {
  symbol: string;
  name: string;
}

/** Elements with extremely limited established compound chemistry in educational catalogues. */
const LIMITED_CHEMISTRY_ELEMENTS = new Set([
  'He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og',
  'Fr', 'At', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts',
]);

/** Resolve a search token to an element symbol using names, symbols, and common aliases. */
export function resolveElementQuery(query: string): ResolvedElement | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const bySymbol = PERIODIC_TABLE.find((e) => e.symbol.toLowerCase() === q);
  if (bySymbol) return { symbol: bySymbol.symbol, name: bySymbol.name };

  const byName = PERIODIC_TABLE.find((e) => e.name.toLowerCase() === q);
  if (byName) return { symbol: byName.symbol, name: byName.name };

  const byPrefix = PERIODIC_TABLE.filter((e) => e.name.toLowerCase().startsWith(q));
  if (byPrefix.length === 1) return { symbol: byPrefix[0].symbol, name: byPrefix[0].name };

  const aliases: Record<string, string> = {
    sulphur: 'S',
    sulfur: 'S',
    aluminium: 'Al',
    aluminum: 'Al',
    caesium: 'Cs',
    cesium: 'Cs',
    technetium: 'Tc',
  };
  if (aliases[q]) {
    const el = PERIODIC_TABLE.find((e) => e.symbol === aliases[q]);
    if (el) return { symbol: el.symbol, name: el.name };
  }

  return null;
}

export function elementRecognisedEmptyMessage(element: ResolvedElement): string {
  const count = moleculesContainingElement(element.symbol).length;
  if (count > 0) return '';

  if (LIMITED_CHEMISTRY_ELEMENTS.has(element.symbol)) {
    return `${element.name} (${element.symbol}) recognised. Established representative compound chemistry for this element is extremely limited — the Genesis catalogue does not currently include a representative entry.`;
  }

  return `${element.name} (${element.symbol}) recognised. No compounds containing ${element.symbol} are currently represented in the Genesis catalogue — additional established chemistry may be added in future updates.`;
}
