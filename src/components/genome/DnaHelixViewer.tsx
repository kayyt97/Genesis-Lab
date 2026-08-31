import { useRef, useState, useEffect } from 'react';
import type { GenomicVariant } from '../../types/scientific';
import { REFERENCE_GENES } from '../../data/genes';

interface DnaHelixViewerProps {
  variants?: GenomicVariant[];
  selectedGeneId?: string | null;
  onSelectGene?: (geneId: string) => void;
  highlightChromosome?: string;
}

export function DnaHelixViewer({
  variants = [],
  selectedGeneId,
  onSelectGene,
  highlightChromosome,
}: DnaHelixViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<{ x: number; y: number; rot: number } | null>(null);

  const selectedGene = REFERENCE_GENES.find((g) => g.id === selectedGeneId);
  const variantMarkers = variants.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const amp = 40 * zoom;
    const freq = 0.08;
    const rotRad = (rotation * Math.PI) / 180;

    // Draw double helix
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      ctx.strokeStyle = strand === 0 ? '#4fc3f7' : '#66bb6a';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 2) {
        const phase = y * freq + rotRad + strand * Math.PI;
        const x = cx + Math.sin(phase) * amp;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Base pair rungs
    for (let y = 20; y < h - 20; y += 18) {
      const phase = y * freq + rotRad;
      const x1 = cx + Math.sin(phase) * amp;
      const x2 = cx + Math.sin(phase + Math.PI) * amp;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.lineWidth = 1;
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }

    // Variant markers as overlays (NOT helix deformation)
    if (variantMarkers > 0) {
      const markerCount = Math.min(30, variantMarkers);
      for (let i = 0; i < markerCount; i++) {
        const y = 30 + (i / markerCount) * (h - 60);
        const phase = y * freq + rotRad;
        const x = cx + Math.sin(phase) * amp;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(251,191,36,0.8)';
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Selected gene annotation marker
    if (selectedGene) {
      ctx.fillStyle = '#a78bfa';
      ctx.font = '11px IBM Plex Sans, sans-serif';
      ctx.fillText(`${selectedGene.symbol} region (reference annotation)`, 10, h - 12);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '10px IBM Plex Sans, sans-serif';
    ctx.fillText('Reference helix — variant markers are annotations, not structural changes', 10, 16);
    if (highlightChromosome) {
      ctx.fillText(`Viewing context: Chr ${highlightChromosome}`, 10, 28);
    }
  }, [rotation, zoom, variants.length, selectedGene, highlightChromosome]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, rot: rotation };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    setRotation(dragRef.current.rot + dx * 0.5);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="dna-helix-viewer">
      <div className="helix-controls">
        <label>
          Zoom: {zoom.toFixed(1)}×
          <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
        </label>
        <button type="button" className="helix-reset" onClick={() => { setRotation(0); setZoom(1); }}>Reset view</button>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={320}
        className="helix-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        aria-label="Interactive DNA helix reference visualisation"
      />
      {variantMarkers > 0 && (
        <p className="text-muted helix-marker-note">
          {variantMarkers.toLocaleString()} uploaded variant(s) shown as markers/overlays — not as helix deformation.
        </p>
      )}
      <div className="helix-gene-quick">
        {REFERENCE_GENES.slice(0, 6).map((g) => (
          <button
            key={g.id}
            type="button"
            className={`gene-tab ${selectedGeneId === g.id ? 'active' : ''}`}
            onClick={() => onSelectGene?.(g.id)}
          >
            {g.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
