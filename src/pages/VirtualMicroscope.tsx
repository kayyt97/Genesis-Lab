import { useState, useMemo, useCallback, useRef, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SimulationBadge } from '../components/ui/DisclaimerBanner';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { ExplainThis, ExplainLabel } from '../components/ui/ExplainThis';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { EXPLAIN } from '../content/explainers';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState, generateId } from '../store/AppContext';
import { organismIndex } from '../catalogue/index';
import { getReferenceById } from '../data/biologicalLibrary';
import { resolveCatalogueOrganismId } from '../services/demoCatalogueIdMap';
import type { MicroscopeMagnification, MicroscopeSpecimen } from '../types/scientific';

const MAGS: MicroscopeMagnification[] = [40, 100, 400, 1000];

const SCALE_UM: Record<MicroscopeMagnification, number> = {
  40: 250,
  100: 100,
  400: 25,
  1000: 10,
};

/** Educational visual specimen families */
type SpecimenKind = 'epithelial' | 'blood' | 'plant' | 'bacteria' | 'tissue' | 'fungi' | 'tumour-culture' | 'tumour-blood';

function resolveSpecimenKind(specimen: MicroscopeSpecimen | null): SpecimenKind {
  if (!specimen) return 'epithelial';
  const ref = specimen.sourceId ? getReferenceById(specimen.sourceId) : undefined;
  const cat = (specimen.organismCategory ?? ref?.category ?? '').toLowerCase();
  const sub = (ref?.subcategory ?? '').toLowerCase();
  const label = `${specimen.label} ${ref?.name ?? ''} ${ref?.morphology ?? ''}`.toLowerCase();
  const tissueForm = (ref?.tissueForm ?? '').toLowerCase();

  if (cat === 'tumours-cancer' || /tumour|tumor|neoplasm|carcinoma|sarcoma|glioblastoma|hela|mcf-7|a549|ht-29|pc-3|u-87/.test(label)) {
    if (tissueForm === 'blood-lymphoid' || sub.includes('blood') || /leukemia|leukaemia|lymphoma|jurkat|k-562|k562|blood smear/.test(label)) {
      return 'tumour-blood';
    }
    return 'tumour-culture';
  }
  if (cat === 'bacteria' || cat === 'archaea' || /bacillus|cocci|rod|microbe|microorganism/.test(label)) {
    return 'bacteria';
  }
  if (cat === 'plant-cells' || /onion|plant|epidermis|mesophyll|guard cell|xylem|phloem/.test(label)) {
    return 'plant';
  }
  if (cat === 'tissues' || /tissue|lobule|histolog|liver|mucosa|muscle|cortex/.test(label)) {
    return 'tissue';
  }
  if (cat === 'fungi' || /yeast|fungi|candida|budding/.test(label)) {
    return 'fungi';
  }
  if (sub === 'blood' || /blood|erythrocyte|neutrophil|lymphocyte|monocyte|platelet|wbc|rbc/.test(label)) {
    return 'blood';
  }
  if (sub === 'epithelial' || cat === 'mammalian-cells' || /epithelial|keratinocyte|enterocyte/.test(label)) {
    return 'epithelial';
  }
  if (cat === 'mammalian-cells') return 'epithelial';
  return 'epithelial';
}

function kindTitle(kind: SpecimenKind): string {
  switch (kind) {
    case 'epithelial': return 'Epithelial / cultured cells';
    case 'blood': return 'Blood smear';
    case 'plant': return 'Plant cells';
    case 'bacteria': return 'Bacteria / microorganisms';
    case 'tissue': return 'Tissue section';
    case 'fungi': return 'Fungi / yeast';
    case 'tumour-culture': return 'Tumour cell culture (generated diagram)';
    case 'tumour-blood': return 'Blood/lymphoid neoplasm smear (generated diagram)';
  }
}

interface StructureLabel {
  id: string;
  label: string;
  simple: string;
  standard: string;
  technical: string;
  x: number;
  y: number;
  minMag: MicroscopeMagnification;
}

interface EduPanel {
  seeing: string;
  whyLooks: string;
  structures: string[];
  magChange: string;
  useful: string;
  limitations: string;
}

function getLabelsForKind(kind: SpecimenKind): StructureLabel[] {
  switch (kind) {
    case 'bacteria':
      return [
        { id: 'colony', label: 'Colony / field', simple: 'A group of bacterial cells.', standard: 'Dense microbial field.', technical: 'Colony aggregate at low power.', x: 50, y: 48, minMag: 40 },
        { id: 'rod', label: 'Bacterial cell', simple: 'A single rod-shaped bacterium.', standard: 'Prokaryotic bacillus (~1–3 µm).', technical: 'No nucleus; nucleoid region only.', x: 48, y: 52, minMag: 400 },
        { id: 'nucleoid', label: 'Nucleoid region', simple: 'Where the DNA sits (not a true nucleus).', standard: 'Diffuse nucleoid.', technical: 'Chromosome region without nuclear envelope.', x: 52, y: 48, minMag: 1000 },
      ];
    case 'plant':
      return [
        { id: 'tissue-sheet', label: 'Epidermal sheet', simple: 'A layer of plant cells.', standard: 'Epidermal cell mosaic.', technical: 'Parenchymal epidermal sheet.', x: 50, y: 45, minMag: 40 },
        { id: 'cell-wall', label: 'Cell wall', simple: 'Rigid outer wall of cellulose.', standard: 'Primary cell wall.', technical: 'Cellulose-rich wall; box-like outline.', x: 32, y: 38, minMag: 100 },
        { id: 'vacuole', label: 'Central vacuole', simple: 'Large fluid-filled space.', standard: 'Central vacuole.', technical: 'Tonoplast-bound storage vacuole.', x: 55, y: 55, minMag: 100 },
        { id: 'nucleus', label: 'Nucleus', simple: 'Control centre of the cell.', standard: 'Membrane-bound nucleus.', technical: 'Often peripheral due to large vacuole.', x: 38, y: 62, minMag: 400 },
        { id: 'nucleolus', label: 'Nucleolus', simple: 'Dense spot inside the nucleus.', standard: 'Nucleolus.', technical: 'rRNA synthesis site.', x: 38, y: 62, minMag: 1000 },
        { id: 'chloroplast', label: 'Chloroplast', simple: 'Green organelle that makes food (if present).', standard: 'Chloroplast.', technical: 'Plastid; may be sparse in epidermis.', x: 68, y: 42, minMag: 1000 },
      ];
    case 'blood':
      return [
        { id: 'smear', label: 'Blood field', simple: 'Many red blood cells spread on a slide.', standard: 'Blood smear overview.', technical: 'Erythrocyte-dominant field.', x: 50, y: 50, minMag: 40 },
        { id: 'rbc', label: 'Erythrocyte', simple: 'Red blood cell — no nucleus.', standard: 'Biconcave RBC (~7 µm).', technical: 'Anucleate erythrocyte; central pallor.', x: 42, y: 48, minMag: 400 },
        { id: 'wbc', label: 'Leukocyte', simple: 'White blood cell with a nucleus.', standard: 'Nucleated leukocyte.', technical: 'Larger cell; nuclear morphology varies.', x: 62, y: 40, minMag: 400 },
        { id: 'platelet', label: 'Platelet', simple: 'Tiny cell fragment for clotting.', standard: 'Thrombocyte fragment.', technical: 'Small anucleate platelet.', x: 55, y: 62, minMag: 1000 },
      ];
    case 'tissue':
      return [
        { id: 'lobule', label: 'Tissue architecture', simple: 'Organised groups of cells in tissue.', standard: 'Lobular / plate pattern.', technical: 'Histological architecture at low power.', x: 50, y: 48, minMag: 40 },
        { id: 'sinusoid', label: 'Sinusoid / space', simple: 'Channel or gap between cell plates.', standard: 'Sinusoidal space.', technical: 'Vascular / interstitial channel.', x: 58, y: 52, minMag: 100 },
        { id: 'hepatocyte', label: 'Parenchymal cell', simple: 'A working tissue cell.', standard: 'Polygonal parenchyma.', technical: 'Hepatocyte-like cell with nucleus.', x: 40, y: 42, minMag: 400 },
        { id: 'nucleus', label: 'Nucleus', simple: 'Cell control centre.', standard: 'Nucleus.', technical: 'Round nucleus; nucleolus may appear.', x: 42, y: 44, minMag: 400 },
        { id: 'nucleolus', label: 'Nucleolus', simple: 'Dense spot in the nucleus.', standard: 'Nucleolus.', technical: 'Visible at oil-immersion educational detail.', x: 42, y: 44, minMag: 1000 },
      ];
    case 'fungi':
      return [
        { id: 'cluster', label: 'Yeast cluster', simple: 'Groups of oval yeast cells.', standard: 'Budding yeast field.', technical: 'Unicellular fungal aggregate.', x: 50, y: 50, minMag: 40 },
        { id: 'cell', label: 'Yeast cell', simple: 'Oval eukaryotic fungus cell.', standard: 'Budding yeast cell.', technical: 'Saccharomyces-like morphology.', x: 45, y: 48, minMag: 100 },
        { id: 'bud', label: 'Bud', simple: 'A new cell growing from the parent.', standard: 'Budding daughter cell.', technical: 'Asymmetric mitotic budding.', x: 58, y: 42, minMag: 400 },
        { id: 'nucleus', label: 'Nucleus', simple: 'Control centre holding DNA.', standard: 'Nucleus.', technical: 'Eukaryotic nucleus (small).', x: 46, y: 50, minMag: 400 },
        { id: 'vacuole', label: 'Vacuole', simple: 'Storage compartment inside the cell.', standard: 'Yeast vacuole.', technical: 'Prominent vacuolar compartment.', x: 48, y: 55, minMag: 1000 },
      ];
    case 'tumour-blood':
      return [
        { id: 'smear', label: 'Smear field', simple: 'A spread of blood cells (generated diagram).', standard: 'Educational leukemic smear overview.', technical: 'Generated diagram — not a patient slide.', x: 50, y: 50, minMag: 40 },
        { id: 'rbc', label: 'Erythrocyte', simple: 'Red blood cell background.', standard: 'Anucleate RBC.', technical: 'Background erythrocytes in smear.', x: 40, y: 55, minMag: 400 },
        { id: 'blast', label: 'Atypical / blast-like cell', simple: 'Larger nucleated cell used to teach blood cancers.', standard: 'Atypical lymphoid/myeloid cell cue.', technical: 'Educational blast-like morphology — not diagnostic.', x: 58, y: 42, minMag: 400 },
        { id: 'nucleus', label: 'Nucleus', simple: 'Large nucleus in the atypical cell.', standard: 'High nuclear:cytoplasmic ratio cue.', technical: 'Generated nuclear morphology for teaching.', x: 58, y: 42, minMag: 1000 },
      ];
    case 'tumour-culture':
      return [
        { id: 'monolayer', label: 'Culture field', simple: 'Crowded cultured cells (generated diagram).', standard: 'Tumour cell-line monolayer overview.', technical: 'Generated diagram — not real histology photography.', x: 50, y: 48, minMag: 40 },
        { id: 'cluster', label: 'Cell cluster', simple: 'Cells packed more tightly than a tidy sheet.', standard: 'Irregular culture cluster.', technical: 'Contact-rich cluster with variable size.', x: 48, y: 50, minMag: 100 },
        { id: 'membrane', label: 'Plasma membrane', simple: 'Outer boundary of a cultured cell.', standard: 'Cell membrane outline.', technical: 'Plasma membrane of adherent culture cell.', x: 34, y: 40, minMag: 400 },
        { id: 'nucleus', label: 'Nucleus', simple: 'Large nucleus — common teaching cue in tumour cell lines.', standard: 'Often prominent nucleus.', technical: 'Educational nuclear prominence — not a diagnostic grade.', x: 50, y: 46, minMag: 400 },
        { id: 'nucleolus', label: 'Nucleolus', simple: 'Dense spot inside the nucleus.', standard: 'Nucleolus.', technical: 'Nucleolar detail at oil-immersion teaching tier.', x: 52, y: 44, minMag: 1000 },
        { id: 'cytoplasm', label: 'Cytoplasm', simple: 'Working contents of the cell.', standard: 'Cytoplasm.', technical: 'Cytoplasmic texture in generated diagram.', x: 58, y: 58, minMag: 1000 },
      ];
    case 'epithelial':
    default:
      return [
        { id: 'monolayer', label: 'Cell sheet', simple: 'A layer of similar cells.', standard: 'Epithelial / culture monolayer.', technical: 'Adherent cell sheet overview.', x: 50, y: 48, minMag: 40 },
        { id: 'cluster', label: 'Cell cluster', simple: 'Cells packed together.', standard: 'Cell cluster with emerging borders.', technical: 'Contact-inhibited cluster.', x: 48, y: 50, minMag: 100 },
        { id: 'membrane', label: 'Plasma membrane', simple: 'Outer boundary of the cell.', standard: 'Cell membrane.', technical: 'Plasma membrane outline.', x: 35, y: 40, minMag: 400 },
        { id: 'nucleus', label: 'Nucleus', simple: 'Control centre holding DNA.', standard: 'Nucleus.', technical: 'Round / oval nuclear compartment.', x: 48, y: 48, minMag: 400 },
        { id: 'nucleolus', label: 'Nucleolus', simple: 'Dense spot inside the nucleus.', standard: 'Nucleolus.', technical: 'Nucleolar organiser region.', x: 50, y: 46, minMag: 1000 },
        { id: 'cytoplasm', label: 'Cytoplasm', simple: 'The cell\'s working fluid and structures.', standard: 'Cytoplasm.', technical: 'Cytoplasmic texture; organelles suggested.', x: 55, y: 58, minMag: 1000 },
      ];
  }
}

function buildEduPanel(kind: SpecimenKind, mag: MicroscopeMagnification, label: string): EduPanel {
  const structuresByMag: Record<SpecimenKind, Record<MicroscopeMagnification, string[]>> = {
    epithelial: {
      40: ['Tissue / culture overview', 'Sparse cell islands'],
      100: ['Cell clusters', 'Approximate cell boundaries'],
      400: ['Individual cells', 'Nuclei', 'Plasma membrane outline'],
      1000: ['Nucleolus', 'Cytoplasmic texture', 'Membrane detail (educational)'],
    },
    blood: {
      40: ['Smear field', 'Dense RBC haze'],
      100: ['RBC clusters', 'Occasional larger leukocytes'],
      400: ['Individual RBCs (central pallor)', 'Leukocyte nuclei'],
      1000: ['RBC biconcave shape cue', 'Platelets', 'Nuclear chromatin texture (WBC)'],
    },
    plant: {
      40: ['Epidermal sheet', 'Large rectangular outlines'],
      100: ['Cell walls', 'Central vacuoles emerging'],
      400: ['Nucleus (often pushed aside)', 'Clear wall boundaries'],
      1000: ['Nucleolus', 'Cytoplasmic strands', 'Occasional chloroplasts (if present)'],
    },
    bacteria: {
      40: ['Colony / smear haze', 'No clear individual cells'],
      100: ['Dense rods or cocci clusters'],
      400: ['Individual bacilli / cocci shapes'],
      1000: ['Cell outline', 'Nucleoid density (not a true nucleus)'],
    },
    tissue: {
      40: ['Lobules / plates', 'Tissue organisation'],
      100: ['Cell cords', 'Sinusoids / spaces'],
      400: ['Individual parenchyma', 'Nuclei'],
      1000: ['Nucleolus', 'Cytoplasmic granularity', 'Membrane interfaces'],
    },
    fungi: {
      40: ['Yeast cloud / clusters'],
      100: ['Oval cells', 'Loose aggregates'],
      400: ['Budding pairs', 'Nuclei'],
      1000: ['Vacuole', 'Bud scar cue', 'Cytoplasmic texture'],
    },
    'tumour-culture': {
      40: ['Culture overview (generated diagram)', 'Crowded cell field'],
      100: ['Irregular clusters', 'Variable cell size cues'],
      400: ['Individual cultured cells', 'Prominent nuclei'],
      1000: ['Nucleolus', 'Membrane outline', 'Cytoplasmic texture'],
    },
    'tumour-blood': {
      40: ['Smear overview (generated diagram)'],
      100: ['RBC background', 'Scattered larger nucleated cells'],
      400: ['Atypical / blast-like cells', 'RBC central pallor'],
      1000: ['Nuclear detail cue (educational)', 'High N:C ratio teaching cue'],
    },
  };

  const magChangeMap: Record<MicroscopeMagnification, string> = {
    40: 'Survey magnification — you see organisation, not fine organelles.',
    100: 'Cell groups and boundaries become clearer; nuclei may still be faint.',
    400: 'High-dry power — individual cells and nuclei are the main teaching targets.',
    1000: 'Oil-immersion educational tier — finer morphology cues appear (still simulated).',
  };

  const why: Record<SpecimenKind, string> = {
    epithelial: 'Cultured / epithelial cells form sheets. Stain and focus emphasise membranes and nuclei.',
    blood: 'A smear spreads cells thinly. RBCs lack nuclei; leukocytes stand out by size and nuclear shape.',
    plant: 'Rigid cellulose walls create boxy outlines; a large vacuole often pushes the nucleus aside.',
    bacteria: 'Prokaryotes are micrometre-scale — they look like dots or rods until high power.',
    tissue: 'Sections preserve architecture: plates of cells with spaces (e.g. sinusoids) between them.',
    fungi: 'Yeasts are oval eukaryotes; budding and vacuoles are classic light-microscope cues.',
    'tumour-culture': 'Tumour-derived cell lines are shown as generated culture diagrams — not patient histology photographs.',
    'tumour-blood': 'Blood/lymphoid neoplasms are taught with a generated smear diagram; they typically do not form a solid tumour mass.',
  };

  return {
    seeing: `Simulated ${kindTitle(kind).toLowerCase()} view of “${label}” at ${mag}×.`,
    whyLooks: why[kind],
    structures: structuresByMag[kind][mag],
    magChange: magChangeMap[mag],
    useful:
      mag <= 100
        ? 'Useful for finding a region of interest and understanding overall organisation.'
        : 'Useful for identifying cell type cues and practising morphological vocabulary.',
    limitations:
      'This is an educational simulation — not real optics, staining, or camera imagery. Resolution and organelles are simplified for teaching.',
  };
}

export function VirtualMicroscopePage() {
  const { state, dispatch } = useAppState();
  const languageLevel = useLanguage();
  const navigate = useNavigate();
  const [mag, setMag] = useState<MicroscopeMagnification>(400);
  const [focus, setFocus] = useState(80);
  const [illumination, setIllumination] = useState(70);
  const [contrast, setContrast] = useState(50);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [controlPanX, setControlPanX] = useState(0);
  const [controlPanY, setControlPanY] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [linkFields, setLinkFields] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const prevMagRef = useRef<MicroscopeMagnification>(400);

  const specimen = state.microscopeSpecimen;
  const handoff = state.labHandoff;
  const setup = state.activeExperimentSetup;

  const kind = useMemo(() => resolveSpecimenKind(specimen), [specimen]);
  const allLabels = useMemo(() => getLabelsForKind(kind), [kind]);
  const visibleLabels = allLabels.filter((s) => mag >= s.minMag);
  const edu = useMemo(
    () => (specimen ? buildEduPanel(kind, mag, specimen.label) : null),
    [specimen, kind, mag],
  );

  const setMagnification = useCallback((newMag: MicroscopeMagnification) => {
    const oldScale = prevMagRef.current / 400;
    const newScale = newMag / 400;
    const ratio = oldScale / newScale;
    setPanX((x) => Math.round(x * ratio));
    setPanY((y) => Math.round(y * ratio));
    setControlPanX((x) => Math.round(x * ratio));
    setControlPanY((y) => Math.round(y * ratio));
    prevMagRef.current = newMag;
    setMag(newMag);
    setSelected(null);
  }, []);

  const centreView = useCallback(() => {
    setPanX(0);
    setPanY(0);
    setControlPanX(0);
    setControlPanY(0);
  }, []);

  const clampPan = (v: number) => Math.max(-120, Math.min(120, v));

  const handlePanDrag = useCallback((dx: number, dy: number) => {
    setPanX((x) => clampPan(x + dx));
    setPanY((y) => clampPan(y + dy));
    if (linkFields) {
      setControlPanX((x) => clampPan(x + dx));
      setControlPanY((y) => clampPan(y + dy));
    }
  }, [linkFields]);

  const handleControlPanDrag = useCallback((dx: number, dy: number) => {
    if (linkFields) {
      handlePanDrag(dx, dy);
      return;
    }
    setControlPanX((x) => clampPan(x + dx));
    setControlPanY((y) => clampPan(y + dy));
  }, [linkFields, handlePanDrag]);

  const focusBlur = Math.abs(focus - 80) * 0.15;

  const controlSpecimen = compareMode && setup?.control?.mode !== 'none-not-applicable' && specimen
    ? { ...specimen, label: `${specimen.label} (${setup!.control.sampleId})`, simulatedViability: 90 }
    : compareMode && state.settings.autoControlEnabled && specimen
    ? { ...specimen, label: `${specimen.label} (Control)`, simulatedViability: 90 }
    : null;

  const loadSpecimen = useCallback((s: MicroscopeSpecimen) => {
    dispatch({ type: 'SET_MICROSCOPE_SPECIMEN', payload: s });
    setShowLoadPanel(false);
    setSelected(null);
    centreView();
  }, [dispatch, centreView]);

  const loadFromVirtualLab = () => {
    const sim = state.activeSimulation;
    const catalogueId = resolveCatalogueOrganismId(sim?.organismId);
    const org = catalogueId ? organismIndex.getById(catalogueId) : undefined;
    loadSpecimen({
      id: generateId('MS'),
      label: org ? `${org.name} (Virtual Lab)` : 'Virtual Lab sample',
      sourceType: 'virtual-lab',
      sourceId: catalogueId ?? sim?.organismId,
      organismCategory: org?.category,
      morphologySupported: org?.morphologySupported ?? true,
      simulatedViability: sim?.organismState.viability,
      notes: sim ? `Modelled viability: ${sim.organismState.viability.toFixed(1)}%` : undefined,
    });
  };

  const addObservationToNotebook = () => {
    if (!specimen) return;
    dispatch({
      type: 'ADD_NOTEBOOK',
      payload: {
        id: generateId('NB'),
        title: `Microscope observation: ${specimen.label}`,
        dateTime: new Date().toISOString(),
        experimentId: specimen.sourceType === 'experiment' ? specimen.sourceId : undefined,
        notes: '',
        observations: `Magnification: ${mag}×. Focus: ${focus}%. Kind: ${kindTitle(kind)}. ${selected ? `Selected structure: ${selected}.` : 'General field observation.'} ${specimen.notes ?? ''}`,
        hypothesis: '',
        conclusions: '',
        tags: ['microscope', 'observation'],
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const selectedMeta = visibleLabels.find((s) => s.id === selected);

  return (
    <div className="microscope-page">
      <PageHeader
        title="Virtual Microscope"
        subtitle="Simulated microscopy visualisation — not real imagery"
        actions={
          <>
            <ExplainThis title="Virtual Microscope" content={EXPLAIN.microscope} />
            <SimulationBadge />
          </>
        }
      />

      {handoff && handoff.targetModule === 'Virtual Microscope' && (
        <div className="handoff-banner">
          Received from {handoff.sourceModule}: <strong>{handoff.label}</strong>
          <button type="button" className="handoff-dismiss" aria-label="Dismiss handoff" onClick={() => dispatch({ type: 'SET_LAB_HANDOFF', payload: null })}>×</button>
        </div>
      )}

      <p className="microscope-disclaimer text-muted">
        Educational simulation only. Fields of view are generated diagrams matched to magnification tiers — not photographs from a physical microscope.
      </p>

      <AboutThisTool
        title="Understanding the Digital Microscope"
        whatIsThis={EXPLAIN.microscope.whatIsIt}
        whyUseIt="Practise recognising structures at different magnifications and learn what each optical control does."
        whatCanILearn="How overview (low mag) differs from cellular detail (high mag), and which structures are appropriate to discuss at each tier."
        caveat={EXPLAIN.microscope.whatItDoesNotMean}
      />

      <Card title="Load Specimen">
        <div className="assistant-actions">
          <Button onClick={() => setShowLoadPanel(!showLoadPanel)}>
            {specimen ? 'Change Specimen' : 'Load Specimen'}
          </Button>
          {state.activeSimulation && (
            <Button variant="secondary" onClick={loadFromVirtualLab}>Load from Virtual Lab</Button>
          )}
        </div>
        {specimen && (
          <div className="specimen-info">
            <strong>{specimen.label}</strong>
            <span className="specimen-kind-chip">{kindTitle(kind)}</span>
            <EvidenceBadge level={specimen.morphologySupported ? 'model-derived' : 'reference-data'} />
            {(specimen.isGeneratedDiagram || kind === 'tumour-culture' || kind === 'tumour-blood') && (
              <span className="generated-diagram-badge" role="status">Generated diagram — not real histology</span>
            )}
            {specimen.simulatedViability !== undefined && (
              <span className="text-muted">Modelled viability: {specimen.simulatedViability.toFixed(1)}%</span>
            )}
            {specimen.notes && <p className="text-muted specimen-notes">{specimen.notes}</p>}
          </div>
        )}
        {showLoadPanel && (
          <div className="specimen-load-panel">
            <h4>Tumour / cancer specimens</h4>
            <div className="specimen-grid">
              {organismIndex
                .query({ category: 'tumours-cancer', compatibleModule: 'microscope', pageSize: 200, sortBy: 'name' })
                .items
                .filter((e) => e.morphologySupported)
                .sort((a, b) => {
                  const rank = (e: typeof a) => {
                    if (e.entryKind === 'tumour-cell-line') return 0;
                    if (e.entryKind === 'educational-specimen') return 1;
                    return 2;
                  };
                  const d = rank(a) - rank(b);
                  return d !== 0 ? d : a.name.localeCompare(b.name);
                })
                .slice(0, 16)
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="specimen-btn"
                    onClick={() => loadSpecimen({
                      id: generateId('MS'),
                      label: e.name,
                      sourceType: 'reference',
                      sourceId: e.id,
                      organismCategory: e.category,
                      morphologySupported: e.morphologySupported,
                      isGeneratedDiagram: true,
                      notes: 'Generated educational diagram — not real histology.',
                    })}
                  >
                    {e.name}
                  </button>
                ))}
            </div>
            <h4>Other reference specimens</h4>
            <div className="specimen-grid">
              {organismIndex.query({ compatibleModule: 'microscope', pageSize: 12 }).items
                .filter((e) => e.morphologySupported && e.category !== 'tumours-cancer')
                .map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="specimen-btn"
                  onClick={() => loadSpecimen({
                    id: generateId('MS'),
                    label: e.name,
                    sourceType: 'reference',
                    sourceId: e.id,
                    organismCategory: e.category,
                    morphologySupported: e.morphologySupported,
                  })}
                >
                  {e.name}
                </button>
              ))}
            </div>
            <h4>Saved samples</h4>
            {state.samples.length === 0 ? (
              <p className="text-muted">No saved samples.</p>
            ) : (
              <div className="specimen-grid">
                {state.samples.slice(0, 8).map((s) => (
                  <button key={s.id} type="button" className="specimen-btn" onClick={() => loadSpecimen({
                    id: generateId('MS'),
                    label: s.name,
                    sourceType: 'sample',
                    sourceId: s.id,
                    morphologySupported: true,
                    isGeneratedDiagram: /tumour|tumor|hela|leukem|leukaem|cell line|mcf|jurkat|k-562|a549/i.test(s.name),
                    notes: /tumour|tumor|hela|leukem|leukaem|cell line|mcf|jurkat|k-562|a549/i.test(s.name)
                      ? 'Generated educational diagram — not real histology.'
                      : undefined,
                  })}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="microscope-controls-row">
        <Card title="Magnification & Optics">
          <div className="mag-row-header">
            <span>Magnification</span>
            <ExplainThis title="Magnification" content={EXPLAIN.magnification} />
          </div>
          <div className="mag-buttons">
            {MAGS.map((m) => (
              <button key={m} type="button" className={`mag-btn ${mag === m ? 'active' : ''}`} aria-pressed={mag === m} onClick={() => setMagnification(m)}>
                {m}×
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={centreView}>Reset / Centre View</Button>

          <label className="checkbox-label">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
            Show Labels
          </label>

          <label>
            <span className="control-label-row">
              Focus: {focus}%
              <ExplainThis
                title="Focus"
                content={{
                  whatIsIt: 'Focus adjusts how sharp the simulated field appears.',
                  whyItMatters: 'Real microscopy requires focusing through the specimen depth; here blur teaches that concept.',
                  whatItDoesNotMean: 'This is not a real z-stack or optical section.',
                }}
              />
            </span>
            <input type="range" min={0} max={100} value={focus} onChange={(e) => setFocus(parseInt(e.target.value, 10))} />
          </label>
          <label>
            <span className="control-label-row">
              Illumination: {illumination}%
              <ExplainThis
                title="Illumination"
                content={{
                  whatIsIt: 'Illumination is the brightness of light through the field.',
                  whyItMatters: 'Too dim hides detail; too bright washes contrast.',
                  whatItDoesNotMean: 'Not a calibrated lamp or condenser setting.',
                }}
              />
            </span>
            <input type="range" min={0} max={100} value={illumination} onChange={(e) => setIllumination(parseInt(e.target.value, 10))} />
          </label>
          <label>
            <span className="control-label-row">
              Contrast: {contrast}%
              <ExplainThis
                title="Contrast"
                content={{
                  whatIsIt: 'Contrast emphasises differences between structures and background.',
                  whyItMatters: 'Staining and optics both affect how clearly boundaries appear.',
                  whatItDoesNotMean: 'Not equivalent to a specific contrast method (phase, DIC, etc.).',
                }}
              />
            </span>
            <input type="range" min={0} max={100} value={contrast} onChange={(e) => setContrast(parseInt(e.target.value, 10))} />
          </label>
          <label>Pan X
            <input
              type="range"
              min={-120}
              max={120}
              value={panX}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setPanX(v);
                if (linkFields) setControlPanX(v);
              }}
            />
          </label>
          <label>Pan Y
            <input
              type="range"
              min={-120}
              max={120}
              value={panY}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setPanY(v);
                if (linkFields) setControlPanY(v);
              }}
            />
          </label>
          <div className="scale-bar">
            Scale bar: {SCALE_UM[mag]} µm at {mag}×
          </div>
        </Card>

        <Card title="Field of View">
          {!specimen ? (
            <p className="text-muted">Load a specimen to begin microscopy.</p>
          ) : !specimen.morphologySupported ? (
            <p className="text-muted warn-text">No supported morphological prediction available for this specimen.</p>
          ) : (
            <div className={`microscope-compare ${compareMode ? 'compare-active' : ''}`}>
              <MicroscopeField
                specimen={specimen}
                kind={kind}
                mag={mag}
                focusBlur={focusBlur}
                illumination={illumination}
                contrast={contrast}
                panX={panX}
                panY={panY}
                labels={visibleLabels}
                selected={selected}
                onSelect={setSelected}
                onPanDrag={handlePanDrag}
                showMinimap={!compareMode}
                showLabels={showLabels}
                label={compareMode ? 'Experimental' : undefined}
              />
              {compareMode && controlSpecimen && (
                <MicroscopeField
                  specimen={controlSpecimen}
                  kind={kind}
                  mag={mag}
                  focusBlur={focusBlur}
                  illumination={illumination}
                  contrast={contrast}
                  panX={linkFields ? panX : controlPanX}
                  panY={linkFields ? panY : controlPanY}
                  labels={visibleLabels}
                  selected={null}
                  onSelect={() => {}}
                  onPanDrag={handleControlPanDrag}
                  showMinimap={false}
                  showLabels={showLabels}
                  label="Control"
                />
              )}
            </div>
          )}
          {specimen && (
            <>
              <label className="checkbox-label">
                <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} />
                Control vs Experimental side-by-side
              </label>
              {compareMode && (
                <label className="checkbox-label">
                  <input type="checkbox" checked={linkFields} onChange={(e) => setLinkFields(e.target.checked)} />
                  Link fields of view
                </label>
              )}
              <p className="text-muted fov-hint">Drag inside the field to pan · Pan sliders stay synchronised</p>
            </>
          )}
        </Card>
      </div>

      {edu && specimen && (
        <Card title="What you are seeing">
          <div className="microscope-info-panel">
            <div className="microscope-info-block">
              <h4>What you are seeing</h4>
              <p>{edu.seeing}</p>
            </div>
            <div className="microscope-info-block">
              <h4>Why it looks this way</h4>
              <p>{edu.whyLooks}</p>
            </div>
            <div className="microscope-info-block">
              <h4>Structures visible</h4>
              <ul>
                {edu.structures.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="microscope-info-block">
              <h4>What changes at this magnification</h4>
              <p>{edu.magChange}</p>
            </div>
            <div className="microscope-info-block">
              <h4>Why this magnification is useful</h4>
              <p>{edu.useful}</p>
            </div>
            <div className="microscope-info-block">
              <h4>Limitations</h4>
              <p className="text-muted">{edu.limitations}</p>
            </div>
          </div>
          <div className="quick-glossary microscope-mini-glossary">
            <h4>Microscopy glossary (relevant terms)</h4>
            <div className="explain-legend">
              <ExplainLabel label="Specimen" content={EXPLAIN.specimen} />
              <ExplainLabel label="Magnification" content={EXPLAIN.magnification} />
              <ExplainLabel label="Focus" content={EXPLAIN.focus} />
              <ExplainLabel label="Contrast" content={EXPLAIN.contrast} />
              <ExplainLabel label="Illumination" content={EXPLAIN.illumination} />
              <ExplainLabel label="Resolution" content={EXPLAIN.resolution} />
              {(kind === 'epithelial' || kind === 'tissue' || kind === 'blood' || kind === 'plant' || kind === 'fungi' || kind === 'tumour-culture' || kind === 'tumour-blood') && (
                <>
                  <ExplainLabel label="Cell" content={EXPLAIN.cell} />
                  <ExplainLabel label="Nucleus" content={EXPLAIN.nucleus} />
                  <ExplainLabel label="Membrane" content={EXPLAIN.membrane} />
                  <ExplainLabel label="Cytoplasm" content={EXPLAIN.cytoplasm} />
                </>
              )}
              {kind === 'tissue' && <ExplainLabel label="Tissue" content={EXPLAIN.tissue} />}
              {(kind === 'plant' || kind === 'fungi' || mag >= 1000) && (
                <ExplainLabel label="Organelle" content={EXPLAIN.organelle} />
              )}
              {kind === 'bacteria' && <ExplainLabel label="Cell" content={EXPLAIN.cell} />}
            </div>
          </div>
        </Card>
      )}

      {selectedMeta && (
        <Card title={selectedMeta.label}>
          <p>{resolveTiered({
            simple: selectedMeta.simple,
            standard: selectedMeta.standard,
            technical: selectedMeta.technical,
          }, languageLevel)}</p>
          <h4>Why does this look like this?</h4>
          <p className="text-muted">
            At {mag}× on a {kindTitle(kind).toLowerCase()} specimen, this structure is within the educational detail tier for this magnification.
          </p>
        </Card>
      )}

      {specimen && (
        <Card title="Learning & Actions">
          <div className="assistant-actions">
            <Button variant="secondary" onClick={() => navigate('/assistant')}>Explain visible structures</Button>
            <Button variant="secondary" onClick={addObservationToNotebook}>Add observation to notebook</Button>
            {getReferenceById(specimen.sourceId ?? '')?.relatedPathways?.[0] && (
              <Button variant="ghost" onClick={() => navigate('/pathway-explorer')}>Open in Pathway Explorer</Button>
            )}
          </div>
          <p className="text-muted">What am I looking at? {specimen.label} — {specimen.notes ?? 'Simulated educational representation.'}</p>
        </Card>
      )}
    </div>
  );
}

function MicroscopeField({
  specimen,
  kind,
  mag,
  focusBlur,
  illumination,
  contrast,
  panX,
  panY,
  labels,
  selected,
  onSelect,
  onPanDrag,
  showMinimap = false,
  showLabels = true,
  label,
}: {
  specimen: MicroscopeSpecimen;
  kind: SpecimenKind;
  mag: MicroscopeMagnification;
  focusBlur: number;
  illumination: number;
  contrast: number;
  panX: number;
  panY: number;
  labels: StructureLabel[];
  selected: string | null;
  onSelect: (id: string) => void;
  onPanDrag?: (dx: number, dy: number) => void;
  showMinimap?: boolean;
  showLabels?: boolean;
  label?: string;
}) {
  const viability = specimen.simulatedViability ?? 85;
  const brightness = illumination / 100;
  const contrastFactor = contrast / 50;
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const stageUid = useId().replace(/:/g, '');

  const onPointerDown = (e: React.PointerEvent) => {
    if (!onPanDrag) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !onPanDrag) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    onPanDrag(dx, dy);
  };

  const onPointerUp = () => { dragRef.current = null; };

  const minimapX = 50 + (panX / 120) * 35;
  const minimapY = 50 + (panY / 120) * 35;

  // Stage pan is primary; mild scale reinforces “closer look” without being the only difference
  const stageScale = mag === 40 ? 0.92 : mag === 100 ? 1 : mag === 400 ? 1.08 : 1.15;

  return (
    <div className="microscope-field-wrap">
      {label && <span className="field-label">{label}</span>}
      <div
        className="microscope-viewport"
        style={{
          filter: `brightness(${0.45 + brightness * 0.55}) contrast(${contrastFactor}) blur(${focusBlur}px)`,
          cursor: onPanDrag ? 'grab' : 'default',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="microscope-view microscope-stage"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${stageScale})`,
            opacity: Math.max(0.35, viability / 100),
          }}
          data-kind={kind}
          data-mag={mag}
        >
          <SpecimenStage kind={kind} mag={mag} uid={stageUid} />
          {showLabels && labels.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`structure-label-btn ${selected === s.id ? 'active' : ''}`}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              onClick={(e) => { e.stopPropagation(); onSelect(s.id); }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="microscope-scale-overlay" aria-hidden="true">
          <span className="microscope-scale-bar-graphic" />
          <span>{SCALE_UM[mag]} µm</span>
        </div>
        {showMinimap && (
          <div className="microscope-minimap" aria-hidden="true">
            <div className={`minimap-specimen minimap-kind-${kind}`} />
            <div className="minimap-viewport-indicator" style={{ left: `${minimapX}%`, top: `${minimapY}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Mag-tier SVG scenes — composition changes with magnification, not mere zoom. */
function SpecimenStage({ kind, mag, uid }: { kind: SpecimenKind; mag: MicroscopeMagnification; uid: string }) {
  const bgId = `fov-bg-${uid}`;
  const softId = `soft-${uid}`;
  return (
    <svg className={`mag-layer mag-${mag} kind-${kind}`} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id={bgId} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#1a3a2a" />
          <stop offset="100%" stopColor="#070b10" />
        </radialGradient>
        <filter id={softId}>
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="98" fill={`url(#${bgId})`} />
      {kind === 'epithelial' && <EpithelialScene mag={mag} />}
      {kind === 'blood' && <BloodScene mag={mag} />}
      {kind === 'plant' && <PlantScene mag={mag} />}
      {kind === 'bacteria' && <BacteriaScene mag={mag} softFilterId={softId} />}
      {kind === 'tissue' && <TissueScene mag={mag} />}
      {kind === 'fungi' && <FungiScene mag={mag} />}
      {kind === 'tumour-culture' && <EpithelialScene mag={mag} />}
      {kind === 'tumour-blood' && <BloodScene mag={mag} />}
    </svg>
  );
}

function EpithelialScene({ mag }: { mag: MicroscopeMagnification }) {
  if (mag === 40) {
    return (
      <g className="scene-epithelial-40">
        {[
          [40, 50, 28], [95, 70, 34], [145, 45, 26], [70, 130, 30], [130, 125, 22],
        ].map(([cx, cy, r], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.85} fill="rgba(79,195,247,0.12)" stroke="rgba(148,210,255,0.25)" strokeWidth="1" />
        ))}
      </g>
    );
  }
  if (mag === 100) {
    return (
      <g className="scene-epithelial-100">
        {[
          [55, 55], [95, 50], [135, 58], [50, 95], [90, 100], [130, 92], [70, 140], [115, 145],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <ellipse cx={cx} cy={cy} rx="22" ry="18" fill="rgba(79,195,247,0.18)" stroke="rgba(186,230,253,0.45)" strokeWidth="1.2" />
            <circle cx={cx + 2} cy={cy - 2} r="5" fill="rgba(167,139,250,0.25)" />
          </g>
        ))}
      </g>
    );
  }
  if (mag === 400) {
    return (
      <g className="scene-epithelial-400">
        <ellipse cx="100" cy="100" rx="55" ry="48" fill="rgba(79,195,247,0.22)" stroke="rgba(224,242,254,0.7)" strokeWidth="2" />
        <ellipse cx="100" cy="100" rx="55" ry="48" fill="none" stroke="rgba(125,211,252,0.35)" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="108" cy="92" r="18" fill="rgba(167,139,250,0.45)" stroke="rgba(196,181,253,0.8)" strokeWidth="1.5" />
        <circle cx="70" cy="120" r="8" fill="rgba(52,211,153,0.2)" />
        <circle cx="130" cy="125" r="6" fill="rgba(52,211,153,0.15)" />
      </g>
    );
  }
  return (
    <g className="scene-epithelial-1000">
      <ellipse cx="100" cy="100" rx="70" ry="62" fill="rgba(79,195,247,0.2)" stroke="rgba(224,242,254,0.85)" strokeWidth="2.5" />
      {/* cytoplasmic texture */}
      {Array.from({ length: 18 }).map((_, i) => (
        <circle
          key={i}
          cx={55 + (i % 6) * 18 + (i % 2) * 4}
          cy={55 + Math.floor(i / 6) * 28 + (i % 3) * 3}
          r={1.2 + (i % 3) * 0.4}
          fill="rgba(110,231,183,0.35)"
        />
      ))}
      <circle cx="112" cy="88" r="26" fill="rgba(139,92,246,0.4)" stroke="rgba(196,181,253,0.9)" strokeWidth="2" />
      <circle cx="118" cy="84" r="7" fill="rgba(237,233,254,0.75)" />
      <ellipse cx="72" cy="130" rx="10" ry="7" fill="rgba(52,211,153,0.35)" stroke="rgba(167,243,208,0.5)" />
      <ellipse cx="140" cy="125" rx="8" ry="6" fill="rgba(251,191,36,0.25)" />
    </g>
  );
}

function BloodScene({ mag }: { mag: MicroscopeMagnification }) {
  if (mag === 40) {
    return (
      <g className="scene-blood-40">
        {Array.from({ length: 40 }).map((_, i) => (
          <circle
            key={i}
            cx={30 + (i % 8) * 20 + (i % 3) * 3}
            cy={35 + Math.floor(i / 8) * 28 + (i % 2) * 4}
            r="7"
            fill="rgba(248,113,113,0.35)"
          />
        ))}
      </g>
    );
  }
  if (mag === 100) {
    return (
      <g className="scene-blood-100">
        {Array.from({ length: 22 }).map((_, i) => (
          <circle
            key={i}
            cx={40 + (i % 6) * 24}
            cy={45 + Math.floor(i / 6) * 32}
            r="11"
            fill="rgba(248,113,113,0.4)"
            stroke="rgba(254,202,202,0.35)"
          />
        ))}
        <circle cx="150" cy="70" r="16" fill="rgba(147,197,253,0.35)" stroke="rgba(191,219,254,0.6)" />
      </g>
    );
  }
  if (mag === 400) {
    return (
      <g className="scene-blood-400">
        {[
          [55, 70], [95, 55], [135, 75], [70, 115], [115, 125], [150, 120], [45, 140],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="18" fill="rgba(239,68,68,0.45)" stroke="rgba(254,202,202,0.5)" />
            <circle cx={cx} cy={cy} r="7" fill="rgba(127,29,29,0.35)" />
          </g>
        ))}
        <circle cx="150" cy="50" r="28" fill="rgba(96,165,250,0.35)" stroke="rgba(191,219,254,0.7)" strokeWidth="2" />
        <ellipse cx="150" cy="50" rx="10" ry="14" fill="rgba(30,64,175,0.55)" />
      </g>
    );
  }
  return (
    <g className="scene-blood-1000">
      <g>
        <circle cx="70" cy="90" r="38" fill="rgba(239,68,68,0.5)" stroke="rgba(254,226,226,0.7)" strokeWidth="2" />
        <circle cx="70" cy="90" r="14" fill="rgba(127,29,29,0.4)" />
      </g>
      <g>
        <circle cx="140" cy="70" r="42" fill="rgba(96,165,250,0.4)" stroke="rgba(219,234,254,0.8)" strokeWidth="2" />
        <path d="M125 55 Q140 40 155 60 Q160 80 145 95 Q125 90 125 55" fill="rgba(30,58,138,0.65)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx={128 + (i % 3) * 10} cy={58 + Math.floor(i / 3) * 12} r="1.5" fill="rgba(226,232,240,0.5)" />
        ))}
      </g>
      {[
        [110, 140], [130, 155], [95, 155],
      ].map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="6" ry="4" fill="rgba(251,191,36,0.55)" stroke="rgba(253,230,138,0.6)" />
      ))}
    </g>
  );
}

function PlantScene({ mag }: { mag: MicroscopeMagnification }) {
  if (mag === 40) {
    return (
      <g className="scene-plant-40">
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={35 + col * 45}
              y={40 + row * 40}
              width="42"
              height="36"
              fill="rgba(74,222,128,0.1)"
              stroke="rgba(134,239,172,0.4)"
              strokeWidth="1.5"
            />
          )),
        )}
      </g>
    );
  }
  if (mag === 100) {
    return (
      <g className="scene-plant-100">
        {[
          [40, 40], [100, 40], [40, 105], [100, 105],
        ].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width="55" height="55" fill="rgba(74,222,128,0.12)" stroke="rgba(187,247,208,0.65)" strokeWidth="2.5" />
            <ellipse cx={x + 28} cy={y + 28} rx="18" ry="20" fill="rgba(56,189,248,0.12)" stroke="rgba(125,211,252,0.35)" />
          </g>
        ))}
      </g>
    );
  }
  if (mag === 400) {
    return (
      <g className="scene-plant-400">
        <rect x="40" y="35" width="120" height="130" fill="rgba(74,222,128,0.15)" stroke="rgba(220,252,231,0.85)" strokeWidth="4" />
        <ellipse cx="110" cy="105" rx="40" ry="48" fill="rgba(14,165,233,0.15)" stroke="rgba(125,211,252,0.4)" strokeWidth="1.5" />
        <circle cx="70" cy="145" r="16" fill="rgba(167,139,250,0.45)" stroke="rgba(196,181,253,0.8)" />
        <line x1="70" y1="129" x2="95" y2="70" stroke="rgba(167,243,208,0.35)" strokeWidth="1" />
      </g>
    );
  }
  return (
    <g className="scene-plant-1000">
      <rect x="30" y="25" width="140" height="150" fill="rgba(74,222,128,0.12)" stroke="rgba(240,253,244,0.9)" strokeWidth="5" />
      <ellipse cx="115" cy="100" rx="48" ry="55" fill="rgba(14,165,233,0.18)" stroke="rgba(186,230,253,0.5)" strokeWidth="2" />
      <circle cx="65" cy="150" r="22" fill="rgba(139,92,246,0.45)" stroke="rgba(221,214,254,0.9)" strokeWidth="2" />
      <circle cx="68" cy="146" r="6" fill="rgba(237,233,254,0.85)" />
      {[
        [145, 50], [155, 70], [140, 85],
      ].map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="9" ry="5" fill="rgba(34,197,94,0.55)" stroke="rgba(134,239,172,0.7)" transform={`rotate(${i * 25} ${cx} ${cy})`} />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={i} x1={50 + i * 8} y1={60} x2={70 + i * 10} y2={130} stroke="rgba(167,243,208,0.25)" strokeWidth="0.8" />
      ))}
    </g>
  );
}

function BacteriaScene({ mag, softFilterId }: { mag: MicroscopeMagnification; softFilterId: string }) {
  if (mag === 40) {
    return (
      <g className="scene-bacteria-40">
        <ellipse cx="100" cy="95" rx="55" ry="40" fill="rgba(251,191,36,0.15)" filter={`url(#${softFilterId})`} />
        <ellipse cx="70" cy="130" rx="30" ry="20" fill="rgba(251,191,36,0.1)" />
      </g>
    );
  }
  if (mag === 100) {
    return (
      <g className="scene-bacteria-100">
        {Array.from({ length: 28 }).map((_, i) => (
          <ellipse
            key={i}
            cx={45 + (i % 7) * 18}
            cy={50 + Math.floor(i / 7) * 28 + (i % 2) * 4}
            rx="7"
            ry="3"
            fill="rgba(251,191,36,0.45)"
            transform={`rotate(${(i * 17) % 50 - 25} ${45 + (i % 7) * 18} ${50 + Math.floor(i / 7) * 28})`}
          />
        ))}
      </g>
    );
  }
  if (mag === 400) {
    return (
      <g className="scene-bacteria-400">
        {[
          [60, 70, 22, 8, 15], [100, 90, 24, 9, -10], [140, 70, 20, 8, 25],
          [70, 120, 22, 8, -20], [115, 130, 23, 9, 5], [150, 115, 18, 7, 35],
        ].map(([cx, cy, rx, ry, rot], i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="rgba(251,191,36,0.5)"
            stroke="rgba(253,230,138,0.7)"
            strokeWidth="1.2"
            transform={`rotate(${rot} ${cx} ${cy})`}
          />
        ))}
      </g>
    );
  }
  return (
    <g className="scene-bacteria-1000">
      <ellipse cx="100" cy="100" rx="55" ry="22" fill="rgba(245,158,11,0.55)" stroke="rgba(254,243,199,0.85)" strokeWidth="2.5" />
      <ellipse cx="95" cy="100" rx="28" ry="12" fill="rgba(120,53,15,0.35)" />
      <ellipse cx="100" cy="100" rx="55" ry="22" fill="none" stroke="rgba(253,230,138,0.4)" strokeWidth="1" strokeDasharray="2 2" />
      {/* No true nucleus — nucleoid density only */}
      <text x="100" y="175" textAnchor="middle" fill="rgba(253,230,138,0.45)" fontSize="7">no nuclear envelope</text>
    </g>
  );
}

function TissueScene({ mag }: { mag: MicroscopeMagnification }) {
  if (mag === 40) {
    return (
      <g className="scene-tissue-40">
        <polygon points="100,35 155,70 140,140 60,140 45,70" fill="rgba(244,114,182,0.12)" stroke="rgba(249,168,212,0.4)" strokeWidth="1.5" />
        <line x1="100" y1="35" x2="100" y2="140" stroke="rgba(249,168,212,0.25)" />
        <line x1="45" y1="70" x2="155" y2="70" stroke="rgba(249,168,212,0.2)" />
        <line x1="60" y1="140" x2="140" y2="70" stroke="rgba(249,168,212,0.15)" />
      </g>
    );
  }
  if (mag === 100) {
    return (
      <g className="scene-tissue-100">
        {[
          [50, 50], [95, 45], [140, 55], [55, 100], [100, 105], [145, 95], [70, 145], [120, 150],
        ].map(([cx, cy], i) => (
          <polygon
            key={i}
            points={`${cx},${cy - 16} ${cx + 16},${cy - 6} ${cx + 12},${cy + 14} ${cx - 12},${cy + 14} ${cx - 16},${cy - 6}`}
            fill="rgba(244,114,182,0.2)"
            stroke="rgba(251,207,232,0.5)"
          />
        ))}
        <path d="M40 80 Q100 95 160 75" fill="none" stroke="rgba(125,211,252,0.35)" strokeWidth="6" strokeLinecap="round" />
      </g>
    );
  }
  if (mag === 400) {
    return (
      <g className="scene-tissue-400">
        <polygon points="55,50 130,45 155,110 120,155 50,140 35,85" fill="rgba(244,114,182,0.25)" stroke="rgba(252,231,243,0.75)" strokeWidth="2" />
        <circle cx="95" cy="95" r="18" fill="rgba(167,139,250,0.45)" stroke="rgba(196,181,253,0.8)" />
        <path d="M150 60 Q170 100 145 145" fill="none" stroke="rgba(125,211,252,0.4)" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
      </g>
    );
  }
  return (
    <g className="scene-tissue-1000">
      <polygon points="40,40 145,35 170,100 130,165 45,155 25,90" fill="rgba(244,114,182,0.22)" stroke="rgba(252,231,243,0.85)" strokeWidth="2.5" />
      {Array.from({ length: 20 }).map((_, i) => (
        <circle key={i} cx={55 + (i % 5) * 20} cy={60 + Math.floor(i / 5) * 22} r="1.4" fill="rgba(251,207,232,0.4)" />
      ))}
      <circle cx="100" cy="95" r="26" fill="rgba(139,92,246,0.45)" stroke="rgba(221,214,254,0.9)" strokeWidth="2" />
      <circle cx="105" cy="90" r="7" fill="rgba(237,233,254,0.8)" />
      <path d="M155 50 Q175 100 150 155" fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="12" />
    </g>
  );
}

function FungiScene({ mag }: { mag: MicroscopeMagnification }) {
  if (mag === 40) {
    return (
      <g className="scene-fungi-40">
        {[
          [60, 70, 20], [100, 55, 24], [140, 75, 18], [80, 120, 22], [125, 125, 20],
        ].map(([cx, cy, r], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.8} fill="rgba(253,186,116,0.25)" stroke="rgba(254,215,170,0.35)" />
        ))}
      </g>
    );
  }
  if (mag === 100) {
    return (
      <g className="scene-fungi-100">
        {[
          [55, 60], [100, 55], [145, 65], [70, 110], [120, 115], [90, 150],
        ].map(([cx, cy], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="22" ry="18" fill="rgba(253,186,116,0.35)" stroke="rgba(254,215,170,0.55)" strokeWidth="1.5" />
        ))}
      </g>
    );
  }
  if (mag === 400) {
    return (
      <g className="scene-fungi-400">
        <ellipse cx="90" cy="105" rx="40" ry="34" fill="rgba(251,146,60,0.35)" stroke="rgba(254,215,170,0.75)" strokeWidth="2" />
        <ellipse cx="135" cy="70" rx="22" ry="18" fill="rgba(251,146,60,0.4)" stroke="rgba(254,215,170,0.8)" strokeWidth="2" />
        <circle cx="85" cy="100" r="12" fill="rgba(167,139,250,0.4)" />
        <line x1="120" y1="85" x2="118" y2="95" stroke="rgba(254,215,170,0.5)" strokeWidth="2" />
      </g>
    );
  }
  return (
    <g className="scene-fungi-1000">
      <ellipse cx="95" cy="110" rx="55" ry="45" fill="rgba(251,146,60,0.35)" stroke="rgba(255,237,213,0.85)" strokeWidth="2.5" />
      <ellipse cx="100" cy="125" rx="22" ry="18" fill="rgba(154,52,18,0.25)" stroke="rgba(253,186,116,0.5)" />
      <circle cx="88" cy="95" r="18" fill="rgba(139,92,246,0.45)" stroke="rgba(221,214,254,0.8)" />
      <circle cx="90" cy="92" r="5" fill="rgba(237,233,254,0.7)" />
      <ellipse cx="150" cy="65" rx="28" ry="22" fill="rgba(251,146,60,0.4)" stroke="rgba(255,237,213,0.85)" strokeWidth="2" />
      <path d="M128 88 Q138 78 145 72" fill="none" stroke="rgba(254,215,170,0.6)" strokeWidth="2" />
      {Array.from({ length: 10 }).map((_, i) => (
        <circle key={i} cx={70 + (i % 5) * 14} cy={100 + Math.floor(i / 5) * 18} r="1.2" fill="rgba(254,215,170,0.4)" />
      ))}
    </g>
  );
}
