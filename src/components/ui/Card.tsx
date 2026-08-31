import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Card({ title, subtitle, badge, children, className = '', actions }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          <div className="card-header-right">
            {badge && <span className="badge">{badge}</span>}
            {actions}
          </div>
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
