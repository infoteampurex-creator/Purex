import { ReactNode } from 'react';

interface AdminTableProps {
  headers: string[];
  children: ReactNode;
  empty?: ReactNode;
  isEmpty?: boolean;
}

/**
 * Standard admin data table. Dark theme, responsive with horizontal scroll on mobile.
 * Use AdminTableRow + AdminTableCell inside for content.
 */
export function AdminTable({ headers, children, empty, isEmpty }: AdminTableProps) {
  if (isEmpty && empty) {
    return (
      <div className="rounded-2xl bg-bg-card border border-border p-12 text-center">
        {empty}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-bg-card border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="border-b border-border"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTableRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={
        'border-b border-border-soft last:border-0 hover:bg-bg-elevated/50 transition-colors ' +
        (onClick ? 'cursor-pointer' : '')
      }
    >
      {children}
    </tr>
  );
}

export function AdminTableCell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`py-3.5 px-4 text-sm ${className}`}>{children}</td>;
}

export function StatusBadge({
  status,
  variant,
}: {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) {
  const styles: Record<string, { bg: string; fg: string; border: string }> = {
    success: {
      bg: 'rgba(198, 255, 61, 0.1)',
      fg: '#c6ff3d',
      border: 'rgba(198, 255, 61, 0.3)',
    },
    warning: {
      bg: 'rgba(255, 184, 77, 0.1)',
      fg: '#ffb84d',
      border: 'rgba(255, 184, 77, 0.3)',
    },
    danger: {
      bg: 'rgba(255, 107, 107, 0.1)',
      fg: '#ff6b6b',
      border: 'rgba(255, 107, 107, 0.3)',
    },
    info: {
      bg: 'rgba(125, 211, 255, 0.1)',
      fg: '#7dd3ff',
      border: 'rgba(125, 211, 255, 0.3)',
    },
    neutral: {
      bg: 'rgba(200, 200, 200, 0.06)',
      fg: '#a0a69a',
      border: 'rgba(200, 200, 200, 0.2)',
    },
  };
  const s = styles[variant || 'neutral'];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-[0.12em] font-bold whitespace-nowrap"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}
