import { Button } from './Button';
import type { OrganismCatalogueEntry, GeneCatalogueEntry, MoleculeCatalogueEntry } from '../../catalogue/types';
import {
  sendOrganismToVirtualLab,
  sendOrganismToMicroscope,
  openGeneInGenome,
  openGeneInPathway,
  openMoleculeInExplorer,
  openMoleculeInPathway,
  addEntityToNotebook,
  type EntityActionContext,
} from '../../services/moduleActions';

interface EntityActionsProps {
  ctx: EntityActionContext;
  organism?: OrganismCatalogueEntry;
  gene?: GeneCatalogueEntry;
  molecule?: MoleculeCatalogueEntry;
}

export function EntityActions({ ctx, organism, gene, molecule }: EntityActionsProps) {
  const actions: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'ghost' }[] = [];
  const notices: string[] = [];

  if (organism) {
    const simReady = organism.simulationReady ?? organism.compatibleModules.includes('virtual-lab');
    if (simReady && organism.compatibleModules.includes('virtual-lab')) {
      actions.push({ label: 'Send to Virtual Lab', onClick: () => sendOrganismToVirtualLab(ctx, organism), variant: 'secondary' });
    } else if (organism.category === 'tumours-cancer' || organism.entryKind) {
      notices.push('Simulation not available for this catalogue entry. Browse simulation-ready tumour cell lines (e.g. HeLa, MCF-7) instead.');
    }
    if (organism.morphologySupported && organism.compatibleModules.includes('microscope')) {
      actions.push({ label: 'View Under Microscope', onClick: () => sendOrganismToMicroscope(ctx, organism), variant: 'secondary' });
    }
    if (organism.relatedGenes?.length) {
      actions.push({ label: 'Open Related Genes', onClick: () => ctx.navigate('/genome-explorer'), variant: 'secondary' });
    }
    if (organism.relatedPathways?.length) {
      actions.push({ label: 'Open Related Pathway', onClick: () => ctx.navigate('/pathway-explorer'), variant: 'secondary' });
    }
    actions.push({
      label: 'Add to Notebook',
      onClick: () => addEntityToNotebook(ctx, `Reference: ${organism.name}`, organism.summary.standard, ['organism', organism.category]),
      variant: 'secondary',
    });
  }

  if (gene) {
    actions.push({ label: 'Centre on Gene', onClick: () => openGeneInGenome(ctx, gene), variant: 'secondary' });
    actions.push({ label: 'Open Pathway', onClick: () => openGeneInPathway(ctx, gene), variant: 'secondary' });
    actions.push({ label: 'Therapeutic Context', onClick: () => ctx.navigate('/therapeutic-design'), variant: 'secondary' });
    actions.push({
      label: 'Add to Notebook',
      onClick: () => addEntityToNotebook(ctx, `Gene: ${gene.symbol}`, gene.function.standard, ['gene', gene.symbol]),
      variant: 'secondary',
    });
  }

  if (molecule) {
    actions.push({ label: 'Open in Molecule Explorer', onClick: () => openMoleculeInExplorer(ctx, molecule), variant: 'secondary' });
    actions.push({ label: 'Open Pathway Explorer', onClick: () => openMoleculeInPathway(ctx, molecule), variant: 'secondary' });
    actions.push({
      label: 'Add to Notebook',
      onClick: () => addEntityToNotebook(ctx, `Molecule: ${molecule.name}`, molecule.biologicalRole.standard, ['molecule', molecule.formula]),
      variant: 'secondary',
    });
  }

  if (actions.length === 0 && notices.length === 0) return null;

  return (
    <div className="entity-actions">
      {notices.map((n) => (
        <p key={n} className="warn-text sim-unavailable-note" role="status">{n}</p>
      ))}
      {actions.map((a) => (
        <Button key={a.label} variant={a.variant ?? 'secondary'} onClick={a.onClick}>
          {a.label}
        </Button>
      ))}
    </div>
  );
}
