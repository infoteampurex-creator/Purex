import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import { listAllInvoices, formatMoney } from '@/lib/data/invoices';

export const metadata = { title: 'Admin · Invoices' };
export const dynamic = 'force-dynamic';

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: 'Draft', color: '#ffd24d', bg: 'rgba(255,210,77,0.10)' },
  sent: { label: 'Sent', color: '#7dd3ff', bg: 'rgba(125,211,255,0.10)' },
  paid: { label: 'Paid', color: '#c6ff3d', bg: 'rgba(198,255,61,0.10)' },
  void: { label: 'Void', color: '#ff6b6b', bg: 'rgba(255,107,107,0.10)' },
};

export default async function AdminInvoicesPage() {
  const invoices = await listAllInvoices();

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div
            className="font-mono uppercase tracking-[0.22em] font-bold mb-1"
            style={{ fontSize: 11, color: '#d4a050' }}
          >
            Billing
          </div>
          <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
            Invoices
          </h1>
        </div>
        <Link
          href="/admin/settings/company"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs text-text-muted hover:border-accent hover:text-accent transition-colors"
        >
          Company settings
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-card p-10 text-center">
          <div
            className="inline-flex w-12 h-12 items-center justify-center rounded-xl mb-4"
            style={{
              background: 'rgba(212,160,80,0.10)',
              border: '1px solid rgba(212,160,80,0.35)',
              color: '#d4a050',
            }}
          >
            <FileText size={20} />
          </div>
          <h2 className="font-display font-semibold text-lg mb-1">
            No invoices yet
          </h2>
          <p
            className="text-text-muted mx-auto max-w-sm leading-relaxed mb-5"
            style={{ fontSize: 13 }}
          >
            Create your first invoice from a client&apos;s detail page. It&apos;ll
            open pre-filled with the client&apos;s name and email — you just
            add the line items and click Send.
          </p>
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-accent text-bg text-xs font-semibold hover:bg-accent-hover transition-colors"
          >
            <Plus size={12} />
            Pick a client
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
          <div
            className="grid grid-cols-[1fr_140px_140px_140px_100px_44px] gap-4 items-center px-5 py-3 border-b border-border font-mono uppercase tracking-[0.18em] font-bold text-text-muted"
            style={{ fontSize: 9.5 }}
          >
            <div>Client · Number</div>
            <div>Issued</div>
            <div>Due</div>
            <div className="text-right">Total</div>
            <div className="text-right">Status</div>
            <div />
          </div>
          {invoices.map((inv) => {
            const status = STATUS_META[inv.status];
            return (
              <Link
                key={inv.id}
                href={`/admin/invoices/${inv.id}`}
                className="grid grid-cols-[1fr_140px_140px_140px_100px_44px] gap-4 items-center px-5 py-4 border-b border-border last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {inv.billToName}
                  </div>
                  <div
                    className="font-mono mt-0.5 text-text-muted tabular-nums"
                    style={{ fontSize: 11 }}
                  >
                    {inv.invoiceNumber}
                  </div>
                </div>
                <div
                  className="tabular-nums text-text-muted"
                  style={{ fontSize: 12.5 }}
                >
                  {fmtDate(inv.issueDate)}
                </div>
                <div
                  className="tabular-nums text-text-muted"
                  style={{ fontSize: 12.5 }}
                >
                  {fmtDate(inv.dueDate)}
                </div>
                <div
                  className="text-right tabular-nums font-semibold"
                  style={{ fontSize: 14 }}
                >
                  {formatMoney(inv.totalAmount, inv.currency)}
                </div>
                <div className="text-right">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border font-mono uppercase tracking-[0.16em] font-bold"
                    style={{
                      fontSize: 9,
                      color: status.color,
                      background: status.bg,
                      borderColor: `${status.color}38`,
                    }}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="text-right text-text-muted">→</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
