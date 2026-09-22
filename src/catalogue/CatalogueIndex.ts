import type { CatalogueEntityBase, CataloguePage, CatalogueQuery, MoleculeCatalogueEntry, OrganismCatalogueEntry, SortField } from './types';

/** Normalize British/American spelling variants for catalogue search */
export function normalizeSearch(q: string): string {
  return q
    .toLowerCase()
    .trim()
    .replace(/\btumours\b/g, 'tumors')
    .replace(/\btumour\b/g, 'tumor')
    .replace(/\bleukaemia\b/g, 'leukemia')
    .replace(/\bleukaemias\b/g, 'leukemias')
    .replace(/\boesophageal\b/g, 'esophageal')
    .replace(/\bhaematopoietic\b/g, 'hematopoietic')
    .replace(/\bpaediatric\b/g, 'pediatric');
}

function searchHaystack(entity: CatalogueEntityBase): string {
  const mol = entity as MoleculeCatalogueEntry;
  const org = entity as unknown as OrganismCatalogueEntry;
  const parts = [
    entity.name,
    entity.id,
    entity.category,
    entity.category.replace(/-/g, ' '),
    entity.subcategory ?? '',
    ...entity.aliases,
    ...entity.tags,
    ...entity.keywords,
    mol.formula ?? '',
    ...(mol.elements ?? []),
    org.scientificName ?? '',
    org.taxonomy ?? '',
    org.behaviour ?? '',
    org.bodySystem ?? '',
    org.tumourFamily ?? '',
    org.neoplasticStatus ?? '',
    ...(org.icdoMorphologyCodes ?? []),
    org.ncitCode ?? '',
  ];
  return normalizeSearch(parts.join(' '));
}

function matchesSearch(entity: CatalogueEntityBase, q: string): boolean {
  if (!q) return true;
  const n = normalizeSearch(q);
  if (!n) return true;
  const hay = searchHaystack(entity);
  if (hay.includes(n)) return true;
  // Also try raw lowercase for id-style queries
  if (entity.id.toLowerCase().includes(q.toLowerCase().trim())) return true;
  return false;
}

/** Deduplicate catalogue entries by stable ID — first occurrence wins */
export function dedupeCatalogueById<T extends CatalogueEntityBase>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function sortItems<T extends CatalogueEntityBase>(
  items: T[],
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
): T[] {
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    return String(av).localeCompare(String(bv)) * dir;
  });
}

export class CatalogueIndex<T extends CatalogueEntityBase> {
  private byId = new Map<string, T>();
  private byCategory = new Map<string, T[]>();
  private all: T[] = [];

  constructor(items: T[]) {
    this.rebuild(items);
  }

  rebuild(items: T[]) {
    this.all = dedupeCatalogueById(items);
    this.byId = new Map(this.all.map((i) => [i.id, i]));
    this.byCategory = new Map();
    for (const item of this.all) {
      const list = this.byCategory.get(item.category) ?? [];
      list.push(item);
      this.byCategory.set(item.category, list);
    }
  }

  get size() {
    return this.all.length;
  }

  getAll(): T[] {
    return this.all;
  }

  getById(id: string): T | undefined {
    return this.byId.get(id);
  }

  getByCategory(category: string): T[] {
    return this.byCategory.get(category) ?? [];
  }

  getCategories(): string[] {
    return [...this.byCategory.keys()].sort();
  }

  query(params: CatalogueQuery = {}): CataloguePage<T> {
    const pageSize = params.pageSize ?? 24;
    const page = params.page ?? 1;

    let filtered = this.all;

    if (params.category && params.category !== 'all') {
      filtered = filtered.filter((e) => e.category === params.category);
    }
    if (params.subcategory) {
      filtered = filtered.filter((e) => e.subcategory === params.subcategory);
    }
    if (params.compatibleModule) {
      filtered = filtered.filter((e) => e.compatibleModules.includes(params.compatibleModule!));
    }
    if (params.tags?.length) {
      filtered = filtered.filter((e) => params.tags!.every((t) => e.tags.includes(t)));
    }
    if (params.behaviour && params.behaviour !== 'all') {
      filtered = filtered.filter((e) => (e as unknown as OrganismCatalogueEntry).behaviour === params.behaviour);
    }
    if (params.bodySystem && params.bodySystem !== 'all') {
      filtered = filtered.filter((e) => (e as unknown as OrganismCatalogueEntry).bodySystem === params.bodySystem);
    }
    if (params.tumourFamily && params.tumourFamily !== 'all') {
      filtered = filtered.filter((e) => (e as unknown as OrganismCatalogueEntry).tumourFamily === params.tumourFamily);
    }
    if (params.ageGroup && params.ageGroup !== 'all') {
      filtered = filtered.filter((e) => {
        const age = (e as unknown as OrganismCatalogueEntry).ageGroup ?? 'any';
        if (params.ageGroup === 'paediatric') return age === 'paediatric';
        if (params.ageGroup === 'adult') return age === 'adult' || age === 'any';
        return age === params.ageGroup;
      });
    }
    if (params.tissueForm && params.tissueForm !== 'all') {
      filtered = filtered.filter((e) => (e as unknown as OrganismCatalogueEntry).tissueForm === params.tissueForm);
    }
    if (typeof params.simulationReady === 'boolean') {
      filtered = filtered.filter((e) => {
        const org = e as unknown as OrganismCatalogueEntry;
        const ready = org.simulationReady ?? org.compatibleModules.includes('virtual-lab');
        return ready === params.simulationReady;
      });
    }
    if (params.search) {
      filtered = filtered.filter((e) => matchesSearch(e, params.search!));
    }

    filtered = sortItems(filtered, params.sortBy, params.sortDir);
    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  related(id: string): T[] {
    const entity = this.byId.get(id);
    if (!entity) return [];
    return entity.relatedIds
      .map((rid) => this.byId.get(rid))
      .filter((e): e is T => e !== undefined);
  }
}
