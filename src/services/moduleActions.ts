import type { Dispatch } from 'react';
import { sendToVirtualLab, sendToMicroscope, generateId } from '../store/AppContext';
import type { OrganismCatalogueEntry, GeneCatalogueEntry, MoleculeCatalogueEntry } from '../catalogue/types';
import type { MicroscopeSpecimen } from '../types/scientific';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppDispatch = Dispatch<any>;

export type EntityActionContext = {
  dispatch: AppDispatch;
  navigate: (path: string) => void;
};

export function sendOrganismToVirtualLab(ctx: EntityActionContext, entry: OrganismCatalogueEntry) {
  const simReady = entry.simulationReady ?? entry.compatibleModules.includes('virtual-lab');
  if (!simReady) {
    // Do not hand off reference-only tumour taxonomy into the E. coli-capable lab path.
    ctx.navigate('/organisms');
    return;
  }
  sendToVirtualLab(ctx.dispatch, entry.id, entry.name, 'pathway-node');
  ctx.navigate('/virtual-lab');
}

export function organismToMicroscopeSpecimen(entry: OrganismCatalogueEntry): MicroscopeSpecimen {
  const generated = entry.generatedDiagram !== false && (
    entry.category === 'tumours-cancer'
    || entry.entryKind === 'educational-specimen'
    || entry.entryKind === 'tumour-cell-line'
    || entry.entryKind === 'neoplasm-taxonomy'
  );
  return {
    id: generateId('MS'),
    label: entry.name,
    sourceType: 'reference',
    sourceId: entry.id,
    organismCategory: entry.category,
    morphologySupported: entry.morphologySupported,
    notes: generated
      ? `${entry.summary.simple} Generated educational diagram — not real histology.`
      : entry.summary.simple,
    isGeneratedDiagram: generated || undefined,
  };
}

export function sendOrganismToMicroscope(ctx: EntityActionContext, entry: OrganismCatalogueEntry) {
  const specimen = organismToMicroscopeSpecimen(entry);
  sendToMicroscope(ctx.dispatch, specimen);
  ctx.navigate('/microscope');
}

export function openGeneInGenome(ctx: EntityActionContext, gene: GeneCatalogueEntry) {
  ctx.navigate(`/genome-explorer?gene=${gene.symbol}`);
}

export function openGeneInPathway(ctx: EntityActionContext, gene: GeneCatalogueEntry) {
  ctx.navigate(`/pathway-explorer?gene=${gene.symbol}`);
}

export function openMoleculeInExplorer(ctx: EntityActionContext, molecule: MoleculeCatalogueEntry) {
  ctx.navigate(`/molecule-explorer?mol=${molecule.id}`);
}

export function openMoleculeInPathway(ctx: EntityActionContext, molecule: MoleculeCatalogueEntry) {
  ctx.navigate(`/pathway-explorer?mol=${molecule.id}`);
}

export function addEntityToNotebook(
  ctx: EntityActionContext,
  title: string,
  observations: string,
  tags: string[] = [],
) {
  ctx.dispatch({
    type: 'ADD_NOTEBOOK',
    payload: {
      id: generateId('NB'),
      title,
      dateTime: new Date().toISOString(),
      notes: '',
      observations,
      hypothesis: '',
      conclusions: '',
      tags,
      updatedAt: new Date().toISOString(),
    },
  });
}
