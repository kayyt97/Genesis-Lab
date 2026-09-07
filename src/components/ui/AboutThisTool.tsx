import { useState, type ReactNode } from 'react';

interface AboutThisToolProps {
  title?: string;
  whatIsThis: string;
  whyUseIt: string;
  whatCanILearn: string;
  caveat?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}

/** Compact collapsible “Understanding this page” card for major tools. */
export function AboutThisTool({
  title = 'Understanding this tool',
  whatIsThis,
  whyUseIt,
  whatCanILearn,
  caveat,
  defaultOpen = false,
  children,
}: AboutThisToolProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="about-this-tool">
      <button
        type="button"
        className="about-this-tool-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span className="about-this-tool-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="about-this-tool-body">
          <div className="about-this-tool-grid">
            <div>
              <h4>What is this?</h4>
              <p>{whatIsThis}</p>
            </div>
            <div>
              <h4>Why would I use it?</h4>
              <p>{whyUseIt}</p>
            </div>
            <div>
              <h4>What can I learn?</h4>
              <p>{whatCanILearn}</p>
            </div>
          </div>
          {caveat && <p className="text-muted about-this-tool-caveat">{caveat}</p>}
          {children}
        </div>
      )}
    </div>
  );
}
