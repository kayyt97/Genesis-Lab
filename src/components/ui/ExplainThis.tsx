import type { ReactNode } from 'react';
import { HelpPopover } from './HelpPopover';

export interface ExplainContent {
  whatIsIt: string;
  whatAmILookingAt?: string;
  whyItMatters?: string;
  howUsed?: string;
  whatResultMeans?: string;
  whatItDoesNotMean?: string;
}

interface ExplainThisProps {
  title: string;
  content: ExplainContent;
  ariaLabel?: string;
  maxWidth?: number;
  children?: ReactNode;
}

/** Universal educational "?" control — teaches rather than only defining. */
export function ExplainThis({
  title,
  content,
  ariaLabel,
  maxWidth = 360,
  children,
}: ExplainThisProps) {
  return (
    <span className="explain-this">
      {children}
      <HelpPopover
        title={title}
        ariaLabel={ariaLabel ?? `Explain: ${title}`}
        maxWidth={maxWidth}
        trigger={<span className="explain-trigger" aria-hidden="true">?</span>}
        content={
          <div className="explain-body">
            <ExplainBlock heading="What is it?" text={content.whatIsIt} />
            {content.whatAmILookingAt && (
              <ExplainBlock heading="What am I looking at?" text={content.whatAmILookingAt} />
            )}
            {content.whyItMatters && (
              <ExplainBlock heading="Why does it matter?" text={content.whyItMatters} />
            )}
            {content.howUsed && (
              <ExplainBlock heading="How is it used?" text={content.howUsed} />
            )}
            {content.whatResultMeans && (
              <ExplainBlock heading="What does my result mean?" text={content.whatResultMeans} />
            )}
            {content.whatItDoesNotMean && (
              <ExplainBlock heading="What does it NOT mean?" text={content.whatItDoesNotMean} />
            )}
          </div>
        }
      />
    </span>
  );
}

function ExplainBlock({ heading, text }: { heading: string; text: string }) {
  return (
    <div className="explain-block">
      <strong>{heading}</strong>
      <p>{text}</p>
    </div>
  );
}

/** Compact inline label + explain control. */
export function ExplainLabel({
  label,
  title,
  content,
}: {
  label: string;
  title?: string;
  content: ExplainContent;
}) {
  return (
    <span className="explain-label">
      <span>{label}</span>
      <ExplainThis title={title ?? label} content={content} />
    </span>
  );
}
