import { moleculeIndex } from '../catalogue/index';
import type { MoleculeCatalogueEntry } from '../catalogue/types';
import { CURATED_PATHWAYS } from '../data/pathways';
import type { PathwayModel } from '../types/scientific';

export interface MoleculePathwayContext {
  molecule: MoleculeCatalogueEntry;
  pathway: PathwayModel;
  nodeId: string;
  targetLabel: string;
  relationship: string;
}

/** Curated compound → reference pathway links. No invented drug targets. */
const CURATED_MAPPINGS: {
  match: (m: MoleculeCatalogueEntry) => boolean;
  pathwayId: string;
  nodeId: string;
  relationship: string;
}[] = [
  {
    match: (m) => ['MOL-GLUC', 'MOL-ATP', 'MOL-NADH'].includes(m.id) || m.name === 'Lactate' || m.name === 'Urea',
    pathwayId: 'PATH-METABOLIC',
    nodeId: 'm-path',
    relationship: 'Reference metabolic pathway context for this compound class.',
  },
  {
    match: (m) => m.category === 'lipid' || m.name === 'Cholesterol' || m.name === 'Atorvastatin',
    pathwayId: 'PATH-LIPID',
    nodeId: 'l-path',
    relationship: 'Reference lipid transport / metabolism pathway context.',
  },
  {
    match: (m) => m.category === 'neurotransmitter' || m.name === 'Caffeine',
    pathwayId: 'PATH-NEURO',
    nodeId: 'n2-path',
    relationship: 'Reference neuronal signalling pathway context.',
  },
  {
    match: (m) => m.category === 'hormone' || m.name === 'Metformin',
    pathwayId: 'PATH-SIGNALING',
    nodeId: 's-path',
    relationship: 'Reference cell signalling / metabolic regulation context.',
  },
  {
    match: (m) => m.id === 'MOL-O2' || m.id === 'MOL-CO2',
    pathwayId: 'PATH-METABOLIC',
    nodeId: 'm-cell',
    relationship: 'Reference aerobic / metabolic gas exchange context.',
  },
  {
    match: (m) => m.category === 'nucleobase',
    pathwayId: 'PATH-DNA-REPAIR',
    nodeId: 'n-pathway',
    relationship: 'Reference nucleic-acid / genome maintenance context.',
  },
];

export function getMoleculePathwayContext(moleculeId: string): MoleculePathwayContext | null {
  const molecule = moleculeIndex.getById(moleculeId);
  if (!molecule) return null;

  for (const rule of CURATED_MAPPINGS) {
    if (!rule.match(molecule)) continue;
    const pathway = CURATED_PATHWAYS.find((p) => p.id === rule.pathwayId);
    const node = pathway?.nodes.find((n) => n.id === rule.nodeId);
    if (!pathway || !node) continue;
    return {
      molecule,
      pathway,
      nodeId: node.id,
      targetLabel: node.label,
      relationship: rule.relationship,
    };
  }

  const fromNode = CURATED_PATHWAYS.flatMap((p) =>
    p.nodes.filter((n) => n.linkedMoleculeId === moleculeId).map((n) => ({ pathway: p, node: n })),
  )[0];
  if (fromNode) {
    return {
      molecule,
      pathway: fromNode.pathway,
      nodeId: fromNode.node.id,
      targetLabel: fromNode.node.label,
      relationship: 'Curated reference link from pathway node.',
    };
  }

  return null;
}

export function getPathwaysForMolecule(moleculeId: string): PathwayModel[] {
  const ctx = getMoleculePathwayContext(moleculeId);
  return ctx ? [ctx.pathway] : [];
}
