import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SimulationBadge } from '../components/ui/DisclaimerBanner';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState, generateId } from '../store/AppContext';
import { BIOLOGICAL_LIBRARY, getReferenceById } from '../data/biologicalLibrary';
import { demoOrganisms } from '../data/demoData';
import type { MicroscopeMagnification, MicroscopeSpecimen } from '../types/scientific';

const MAGS: MicroscopeMagnification[] = [40, 100, 400, 1000];

const SCALE_UM: Record<MicroscopeMagnification, number> = {
  40: 250,
  100: 100,
  400: 25,
  1000: 10,
};

interface MicroscopeStructure {
  id: string;
  label: string;
  simple: string;
  standard: string;
  technical: string;
  x: number;
  y: number;
  size: number;
  minMag: MicroscopeMagnification;
}

function getStructuresForSpecimen(specimen: MicroscopeSpecimen | null): MicroscopeStructure[] {
  if (!specimen) return [];
  if (!specimen.morphologySupported) return [];

  const ref = specimen.sourceId ? getReferenceById(specimen.sourceId) : undefined;
  const isPlant = ref?.category === 'plant-cells' || ref?.id === 'REF-ONION';
  const isBacteria = ref?.category === 'bacteria';
  const isTissue = ref?.category === 'tissues';

  if (isBacteria) {
    return [
      { id: 'rod', label: 'Bacterial cell', simple: 'A rod-shaped bacterium.', standard: 'Prokaryotic rod (bacillus).', technical: 'Gram-stain dependent morphology; ~2 µm length.', x: 45, y: 45, size: 12, minMag: 400 },
    ];
  }
  if (isPlant) {
    return [
      { id: 'cell-wall', label: 'Cell wall', simple: 'Rigid outer layer made of cellulose.', standard: 'Plant cell wall boundary.', technical: 'Cellulose-rich primary wall.', x: 30, y: 30, size: 40, minMag: 100 },
      { id: 'nucleus', label: 'Nucleus', simple: 'Control centre of the cell.', standard: 'Membrane-bound nucleus.', technical: 'Eukaryotic nuclear compartment.', x: 50, y: 50, size: 15, minMag: 400 },
      { id: 'vacuole', label: 'Central vacuole', simple: 'Large fluid-filled space.', standard: 'Central vacuole in plant cell.', technical: 'Tonoplast-bound storage vacuole.', x: 50, y: 50, size: 25, minMag: 100 },
    ];
  }
  if (isTissue) {
    return [
      { id: 'hepatocyte', label: 'Hepatocyte', simple: 'Liver cell.', standard: 'Polygonal liver parenchymal cell.', technical: 'Metabolic hepatocyte with sinusoidal interface.', x: 40, y: 40, size: 20, minMag: 400 },
      { id: 'sinusoid', label: 'Sinusoid', simple: 'Blood channel between cells.', standard: 'Hepatic sinusoidal space.', technical: 'Discontinuous capillary in hepatic lobule.', x: 60, y: 55, size: 30, minMag: 100 },
    ];
  }
  return [
    { id: 'cell', label: 'Cell', simple: 'A single living unit.', standard: 'Individual cell in culture.', technical: 'Eukaryotic or prokaryotic unit cell.', x: 35, y: 35, size: 30, minMag: 100 },
    { id: 'membrane', label: 'Cell membrane', simple: 'Outer boundary of the cell.', standard: 'Phospholipid bilayer envelope.', technical: 'Plasma membrane regulating transport.', x: 35, y: 35, size: 30, minMag: 400 },
    { id: 'nucleus', label: 'Nucleus', simple: 'Control centre holding DNA.', standard: 'Membrane-bound organelle with genetic material.', technical: 'Nuclear compartment (eukaryotes).', x: 50, y: 50, size: 14, minMag: 400 },
  ];
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
  const [selected, setSelected] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [showLoadPanel, setShowLoadPanel] = useState(false);

  const specimen = state.microscopeSpecimen;
  const handoff = state.labHandoff;

  const structures = useMemo(() => getStructuresForSpecimen(specimen), [specimen]);
  const visibleStructures = structures.filter((s) => mag >= s.minMag);

  const focusBlur = Math.abs(focus - 80) * 0.15;
  const effectiveScale = mag / 400;
  const cellSize = 60 + effectiveScale * 40;

  const loadSpecimen = useCallback((s: MicroscopeSpecimen) => {
    dispatch({ type: 'SET_MICROSCOPE_SPECIMEN', payload: s });
    setShowLoadPanel(false);
    setSelected(null);
  }, [dispatch]);

  const loadFromVirtualLab = () => {
    const sim = state.activeSimulation;
    const org = demoOrganisms.find((o) => o.id === sim?.organismId);
    loadSpecimen({
      id: generateId('MS'),
      label: org ? `${org.commonName} (Virtual Lab)` : 'Virtual Lab sample',
      sourceType: 'virtual-lab',
      sourceId: sim?.organismId,
      organismCategory: org?.category,
      morphologySupported: true,
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
        observations: `Magnification: ${mag}×. Focus: ${focus}%. ${selected ? `Selected structure: ${selected}.` : 'General field observation.'} ${specimen.notes ?? ''}`,
        hypothesis: '',
        conclusions: '',
        tags: ['microscope', 'observation'],
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const controlSpecimen = compareMode && state.settings.autoControlEnabled
    ? { ...specimen!, label: `${specimen!.label} (Control)`, simulatedViability: 90 }
    : null;

  return (
    <div className="microscope-page">
      <PageHeader
        title="Virtual Microscope"
        subtitle="Simulated microscopy visualisation — not real imagery"
        actions={<SimulationBadge />}
      />

      {handoff && handoff.targetModule === 'Virtual Microscope' && (
        <div className="handoff-banner">
          Received from {handoff.sourceModule}: <strong>{handoff.label}</strong>
          <button type="button" className="handoff-dismiss" onClick={() => dispatch({ type: 'SET_LAB_HANDOFF', payload: null })}>×</button>
        </div>
      )}

      <Card title="Load Specimen">
        <Button onClick={() => setShowLoadPanel(!showLoadPanel)}>
          {specimen ? 'Change Specimen' : 'Load Specimen'}
        </Button>
        {state.activeSimulation && (
          <Button variant="secondary" onClick={loadFromVirtualLab}>Load from Virtual Lab</Button>
        )}
        {specimen && (
          <div className="specimen-info">
            <strong>{specimen.label}</strong>
            <EvidenceBadge level={specimen.morphologySupported ? 'model-derived' : 'reference-data'} />
            {specimen.simulatedViability !== undefined && (
              <span className="text-muted">Modelled viability: {specimen.simulatedViability.toFixed(1)}%</span>
            )}
          </div>
        )}
        {showLoadPanel && (
          <div className="specimen-load-panel">
            <h4>Reference specimens</h4>
            <div className="specimen-grid">
              {BIOLOGICAL_LIBRARY.filter((e) => e.morphologySupported).slice(0, 8).map((e) => (
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
                {state.samples.slice(0, 6).map((s) => (
                  <button key={s.id} type="button" className="specimen-btn" onClick={() => loadSpecimen({
                    id: generateId('MS'),
                    label: s.name,
                    sourceType: 'sample',
                    sourceId: s.id,
                    morphologySupported: true,
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
          <div className="mag-buttons">
            {MAGS.map((m) => (
              <button key={m} type="button" className={`mag-btn ${mag === m ? 'active' : ''}`} onClick={() => setMag(m)}>
                {m}×
              </button>
            ))}
          </div>
          <label>Focus: {focus}%
            <input type="range" min={0} max={100} value={focus} onChange={(e) => setFocus(parseInt(e.target.value, 10))} />
          </label>
          <label>Illumination: {illumination}%
            <input type="range" min={0} max={100} value={illumination} onChange={(e) => setIllumination(parseInt(e.target.value, 10))} />
          </label>
          <label>Contrast: {contrast}%
            <input type="range" min={0} max={100} value={contrast} onChange={(e) => setContrast(parseInt(e.target.value, 10))} />
          </label>
          <label>Pan X
            <input type="range" min={-50} max={50} value={panX} onChange={(e) => setPanX(parseInt(e.target.value, 10))} />
          </label>
          <label>Pan Y
            <input type="range" min={-50} max={50} value={panY} onChange={(e) => setPanY(parseInt(e.target.value, 10))} />
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
                mag={mag}
                focusBlur={focusBlur}
                illumination={illumination}
                contrast={contrast}
                panX={panX}
                panY={panY}
                cellSize={cellSize}
                structures={visibleStructures}
                selected={selected}
                onSelect={setSelected}
                label={compareMode ? 'Experimental' : undefined}
              />
              {compareMode && controlSpecimen && (
                <MicroscopeField
                  specimen={controlSpecimen}
                  mag={mag}
                  focusBlur={focusBlur}
                  illumination={illumination}
                  contrast={contrast}
                  panX={panX}
                  panY={panY}
                  cellSize={cellSize}
                  structures={visibleStructures}
                  selected={null}
                  onSelect={() => {}}
                  label="Control"
                />
              )}
            </div>
          )}
          {specimen && (
            <label className="checkbox-label">
              <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} />
              Control vs Experimental side-by-side
            </label>
          )}
        </Card>
      </div>

      {selected && visibleStructures.find((s) => s.id === selected) && (
        <Card title={visibleStructures.find((s) => s.id === selected)!.label}>
          <p>{resolveTiered({
            simple: visibleStructures.find((s) => s.id === selected)!.simple,
            standard: visibleStructures.find((s) => s.id === selected)!.standard,
            technical: visibleStructures.find((s) => s.id === selected)!.technical,
          }, languageLevel)}</p>
          <h4>Why does this look like this?</h4>
          <p className="text-muted">
            Appearance depends on magnification, focus, and specimen type. At {mag}×, {mag >= 400 ? 'subcellular detail may be visible' : 'overall cell shape dominates'}.
          </p>
        </Card>
      )}

      {specimen && (
        <Card title="Learning & Actions">
          <div className="assistant-actions">
            <Button variant="secondary" onClick={() => navigate('/research-assistant')}>Explain visible structures</Button>
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
  mag,
  focusBlur,
  illumination,
  contrast,
  panX,
  panY,
  cellSize,
  structures,
  selected,
  onSelect,
  label,
}: {
  specimen: MicroscopeSpecimen;
  mag: MicroscopeMagnification;
  focusBlur: number;
  illumination: number;
  contrast: number;
  panX: number;
  panY: number;
  cellSize: number;
  structures: MicroscopeStructure[];
  selected: string | null;
  onSelect: (id: string) => void;
  label?: string;
}) {
  const viability = specimen.simulatedViability ?? 85;
  const brightness = illumination / 100;
  const contrastFactor = contrast / 50;

  return (
    <div className="microscope-field-wrap">
      {label && <span className="field-label">{label}</span>}
      <div
        className="microscope-viewport"
        style={{
          filter: `brightness(${0.5 + brightness * 0.5}) contrast(${contrastFactor}) blur(${focusBlur}px)`,
        }}
      >
        <div
          className="microscope-view"
          style={{ transform: `translate(${panX}px, ${panY}px) scale(${mag / 400})` }}
        >
          <div
            className="microscope-cell-main"
            style={{
              width: cellSize,
              height: cellSize,
              opacity: viability / 100,
            }}
          >
            {structures.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`microscope-structure microscope-${s.id} ${selected === s.id ? 'active' : ''}`}
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: s.size * (mag / 400),
                  height: s.size * (mag / 400),
                }}
                onClick={() => onSelect(s.id)}
                aria-label={s.label}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
