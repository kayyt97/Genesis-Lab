import { useRef, useState, useEffect, useCallback } from 'react';
import type { GenomicVariant } from '../../types/scientific';
import type { GeneCatalogueEntry } from '../../catalogue/types';
import type { GenomeNavigationTarget } from '../../catalogue/types';

export type GenomeViewLevel = 'genome' | 'chromosome' | 'region' | 'gene' | 'variant';

interface GenomeBrowserViewProps {
  variants?: GenomicVariant[];
  selectedGene?: GeneCatalogueEntry | null;
  navigationTarget?: GenomeNavigationTarget | null;
  viewMode: 'reference' | 'uploaded';
  chromosome?: string;
  onLevelChange?: (level: GenomeViewLevel) => void;
}

export function GenomeBrowserView({
  variants = [],
  selectedGene,
  navigationTarget,
  viewMode,
  chromosome = '17',
  onLevelChange,
}: GenomeBrowserViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 25, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; rot: { x: number; y: number }; pan: { x: number; y: number }; mode: 'rotate' | 'pan' } | null>(null);

  useEffect(() => {
    setRotation({ x: 25, y: 0 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [selectedGene?.id, chromosome]);

  const level: GenomeViewLevel = selectedGene ? 'gene' : navigationTarget?.type === 'chromosome' ? 'chromosome' : 'genome';
  useEffect(() => { onLevelChange?.(level); }, [level, onLevelChange]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    grad.addColorStop(0, '#0f1724');
    grad.addColorStop(1, '#070b12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + pan.x, h / 2 + pan.y);
    ctx.scale(zoom, zoom);

    if (level === 'genome' || level === 'chromosome') {
      // Chromosome-level context view
      ctx.fillStyle = '#64748b';
      ctx.font = '12px IBM Plex Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Conceptual genome map — not to physical scale', 0, -h / 2 + 30);
      ctx.fillText(`Viewing: ${chromosome === 'MT' ? 'Mitochondrial' : `Chromosome ${chromosome}`}`, 0, -h / 2 + 48);

      const chrW = 28;
      const chrH = Math.min(200, h - 80);
      ctx.fillStyle = 'rgba(79,195,247,0.15)';
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-chrW / 2, -chrH / 2, chrW, chrH, 8);
      ctx.fill();
      ctx.stroke();

      // Centromere notch
      ctx.fillStyle = 'rgba(167,139,250,0.4)';
      ctx.fillRect(-chrW / 2 - 2, -8, chrW + 4, 16);

      if (selectedGene || navigationTarget?.type === 'gene') {
        const geneY = selectedGene ? -chrH / 2 + (chrH * 0.4) : 0;
        ctx.fillStyle = '#a78bfa';
        ctx.fillRect(-chrW / 2 - 6, geneY - 4, chrW + 12, 8);
        ctx.fillStyle = '#e8edf4';
        ctx.font = '11px IBM Plex Sans, sans-serif';
        ctx.fillText(selectedGene?.symbol ?? navigationTarget?.geneSymbol ?? 'Gene', 0, geneY - 10);
      }

      // Variant markers along chromosome
      if (viewMode === 'uploaded' && variants.length > 0) {
        const chrVars = variants.filter((v) => v.chromosome === chromosome);
        const markerCount = Math.min(40, chrVars.length);
        for (let i = 0; i < markerCount; i++) {
          const y = -chrH / 2 + (i / markerCount) * chrH;
          ctx.beginPath();
          ctx.fillStyle = 'rgba(251,191,36,0.85)';
          ctx.arc(chrW / 2 + 10, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px IBM Plex Sans, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${chrVars.length.toLocaleString()} uploaded variant markers`, chrW / 2 + 18, -chrH / 2 + 12);
      }
    } else {
      // Gene-level double helix with improved geometry
      const rotY = (rotation.y * Math.PI) / 180;
      const rotX = (rotation.x * Math.PI) / 180;
      const helixH = 260;
      const radius = 42;
      const turns = 3;
      const steps = 120;

      const project = (x: number, y: number, z: number) => {
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const perspective = 400 / (400 + z2);
        return { px: x1 * perspective, py: y1 * perspective, z: z2 };
      };

      const strandA: { px: number; py: number; z: number }[] = [];
      const strandB: { px: number; py: number; z: number }[] = [];

      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * turns * Math.PI * 2;
        const y = (i / steps - 0.5) * helixH;
        const xA = Math.cos(t) * radius;
        const zA = Math.sin(t) * radius;
        const xB = Math.cos(t + Math.PI) * radius;
        const zB = Math.sin(t + Math.PI) * radius;
        strandA.push(project(xA, y, zA));
        strandB.push(project(xB, y, zB));
      }

      // Base pair rungs
      for (let i = 0; i <= steps; i += 4) {
        const a = strandA[i];
        const b = strandB[i];
        const alpha = 0.25 + (1 - (a.z + radius) / (radius * 2)) * 0.35;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(148,163,184,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.stroke();
      }

      const drawStrand = (points: typeof strandA, color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        for (let i = 0; i < points.length; i++) {
          if (i === 0) ctx.moveTo(points[i].px, points[i].py);
          else ctx.lineTo(points[i].px, points[i].py);
        }
        ctx.stroke();
      };

      drawStrand(strandA, '#4fc3f7');
      drawStrand(strandB, '#66bb6a');

      // Gene highlight band on helix
      if (selectedGene) {
        const mid = Math.floor(steps / 2);
        const p = strandA[mid];
        ctx.beginPath();
        ctx.fillStyle = 'rgba(167,139,250,0.9)';
        ctx.arc(p.px, p.py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8edf4';
        ctx.font = 'bold 12px IBM Plex Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(selectedGene.symbol, p.px, p.py - 16);
        ctx.font = '10px IBM Plex Sans, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${selectedGene.cytoband ?? ''} · Chr ${selectedGene.chromosome}`, p.px, p.py + 24);
      }

      // Uploaded variant markers as overlays
      if (viewMode === 'uploaded' && variants.length > 0) {
        const geneVars = selectedGene
          ? variants.filter((v) => v.chromosome === selectedGene.chromosome && v.position >= selectedGene.start && v.position <= selectedGene.end)
          : variants.filter((v) => v.chromosome === chromosome);
        const mc = Math.min(25, geneVars.length);
        for (let i = 0; i < mc; i++) {
          const idx = Math.floor((i / mc) * steps);
          const p = strandA[idx];
          ctx.beginPath();
          ctx.fillStyle = 'rgba(251,191,36,0.9)';
          ctx.arc(p.px + 12, p.py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px IBM Plex Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      viewMode === 'uploaded'
        ? 'Uploaded sample overlay — markers show observed variants only'
        : 'Reference genome context — conceptual visualisation',
      12,
      h - 12,
    );
  }, [variants, selectedGene, navigationTarget, viewMode, chromosome, rotation, zoom, pan, level]);

  useEffect(() => { draw(); }, [draw]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      rot: { ...rotation },
      pan: { ...pan },
      mode: e.shiftKey ? 'pan' : 'rotate',
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (dragRef.current.mode === 'pan') {
      setPan({ x: dragRef.current.pan.x + dx * 0.5, y: dragRef.current.pan.y + dy * 0.5 });
    } else {
      setRotation({
        x: dragRef.current.rot.x + dy * 0.4,
        y: dragRef.current.rot.y + dx * 0.4,
      });
    }
  };

  const resetView = () => {
    setRotation({ x: 25, y: 0 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="genome-browser-view">
      <div className="helix-controls">
        <label>
          Zoom: {zoom.toFixed(1)}×
          <input type="range" min="0.4" max="2.5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
        </label>
        <button type="button" className="helix-reset" onClick={resetView}>Reset camera</button>
        <span className="text-muted helix-hint">Drag to rotate · Shift+drag to pan</span>
      </div>
      <canvas
        ref={canvasRef}
        width={520}
        height={360}
        className="helix-canvas genome-browser-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerLeave={() => { dragRef.current = null; }}
        aria-label="Interactive genome browser visualisation"
      />
      {selectedGene && (
        <div className="genome-breadcrumb">
          Genome → Chr {selectedGene.chromosome} → {selectedGene.cytoband ?? 'region'} → {selectedGene.symbol}
        </div>
      )}
    </div>
  );
}
