import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AdminPageHeader({ eyebrow, title, subtitle, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-text-muted max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
