import { useState, useRef, useEffect, useCallback, useId, useLayoutEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface HelpPopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  title?: string;
  ariaLabel?: string;
  className?: string;
  maxWidth?: number;
}

const GAP = 8;
const VIEWPORT_PAD = 12;

export function HelpPopover({
  trigger,
  content,
  title,
  ariaLabel = 'Show help information',
  className = '',
  maxWidth = 320,
}: HelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>('top');
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const reposition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const popoverEl = popoverRef.current;
    if (!triggerEl || !popoverEl) return;

    const tr = triggerEl.getBoundingClientRect();
    const pr = popoverEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceTop = tr.top - VIEWPORT_PAD;
    const spaceBottom = vh - tr.bottom - VIEWPORT_PAD;
    const spaceLeft = tr.left - VIEWPORT_PAD;
    const spaceRight = vw - tr.right - VIEWPORT_PAD;

    let chosen: Placement = 'top';
    if (spaceTop >= pr.height + GAP) chosen = 'top';
    else if (spaceBottom >= pr.height + GAP) chosen = 'bottom';
    else if (spaceRight >= pr.width + GAP) chosen = 'right';
    else if (spaceLeft >= pr.width + GAP) chosen = 'left';
    else chosen = spaceBottom >= spaceTop ? 'bottom' : 'top';

    let top = 0;
    let left = 0;

    switch (chosen) {
      case 'top':
        top = tr.top - pr.height - GAP;
        left = tr.left + tr.width / 2 - pr.width / 2;
        break;
      case 'bottom':
        top = tr.bottom + GAP;
        left = tr.left + tr.width / 2 - pr.width / 2;
        break;
      case 'left':
        top = tr.top + tr.height / 2 - pr.height / 2;
        left = tr.left - pr.width - GAP;
        break;
      case 'right':
        top = tr.top + tr.height / 2 - pr.height / 2;
        left = tr.right + GAP;
        break;
    }

    left = Math.max(VIEWPORT_PAD, Math.min(left, vw - pr.width - VIEWPORT_PAD));
    top = Math.max(VIEWPORT_PAD, Math.min(top, vh - pr.height - VIEWPORT_PAD));

    setPlacement(chosen);
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => reposition();
    const onResize = () => reposition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    const id = requestAnimationFrame(reposition);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, reposition, content]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggle = () => setOpen((v) => !v);

  const popover =
    open &&
    createPortal(
      <div
        ref={popoverRef}
        id={id}
        role="dialog"
        aria-label={title ?? 'Help information'}
        className={`help-popover help-popover-${placement}`}
        style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          maxWidth,
          zIndex: 10000,
        }}
      >
        {title && <div className="help-popover-title">{title}</div>}
        <div className="help-popover-body">{content}</div>
      </div>,
      document.body,
    );

  return (
    <span className={`help-popover-wrapper ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="help-popover-trigger"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel}
      >
        {trigger}
      </button>
      {popover}
    </span>
  );
}
