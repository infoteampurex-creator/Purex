import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Receipt, ArrowRight } from 'lucide-react';
import { getCurrentUserId } from '@/lib/data/client-live';
import { listInvoicesForClient, formatMoney } from '@/lib/data/invoices';

export const metadata = { title: 'My invoices' };
export const dynamic = 'force-dynamic';

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  sent: {
    label: 'Pending',
    color: '#ffd24d',
    bg: 'rgba(255,210,77,0.10)',
  },
  paid: { label: 'Paid', color: '#c6ff3d', bg: 'rgba(198,255,61,0.10)' },
  void: { label: 'Void', color: '#82857a', bg: 'rgba(130,133,122,0.10)' },
};

export default async function ClientInvoicesPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const invoices = await listInvoicesForClient(userId);

  // Filter to just what the client should see — RLS already excludes
  // drafts, but be defensive.
  const visible = invoices.filter((i) => i.status !== 'draft');

  return (
    <div className="space-y-4 md:space-y-5">
      <header>
        <div
          className="font-mono uppercase tracking-[0.22em] font-bold mb-1"
          style={{ fontSize: 11, color: '#d4a050' }}
        >
          Billing
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          My invoices
        </h1>
        <p
          className="text-text-muted mt-2 max-w-2xl leading-relaxed"
          style={{ fontSize: 14 }}
        >
          Every invoice from Team Purex is here. Tap one to view the detail,
          download a PDF, or find bank details for payment.
        </p>
      </header>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-card p-10 text-center">
          <div
            className="inline-flex w-12 h-12 items-center justify-center rounded-xl mb-4"
            style={{
              background: 'rgba(212,160,80,0.10)',
              border: '1px solid rgba(212,160,80,0.35)',
              color: '#d4a050',
            }}
          >
            <Receipt size={20} />
          </div>
          <h2 className="font-display font-semibold text-lg mb-1">
            No invoices yet
          </h2>
          <p
            className="text-text-muted mx-auto max-w-sm leading-relaxed"
            style={{ fontSize: 13 }}
          >
            When your coach issues an invoice, it appears here. You&apos;ll also
            get a notification.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
          {visible.map((inv, i) => {
            const meta = STATUS_META[inv.status] ?? STATUS_META.sent;
            const overdue =
              inv.status === 'sent' &&
              inv.dueDate < new Date().toISOString().slice(0, 10);
            const statusLabel = overdue ? 'Overdue' : meta.label;
            const statusColor = overdue ? '#ff6b6b' : meta.color;
            const statusBg = overdue ? 'rgba(255,107,107,0.10)' : meta.bg;

            return (
              <Link
                key={inv.id}
                href={`/client/invoices/${inv.id}`}
                className={`block px-4 py-4 hover:bg-white/[0.02] transition-colors ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      background: statusBg,
                      border: `1px solid ${statusColor}38`,
                      color: statusColor,
                    }}
                  >
                    <Receipt size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <div
                        className="font-semibold tabular-nums"
                        style={{ fontSize: 15 }}
                      >
                        {formatMoney(inv.totalAmount, inv.currency)}
                      </div>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border font-mono uppercase tracking-[0.14em] font-bold"
                        style={{
                          fontSize: 9,
                          color: statusColor,
                          background: statusBg,
                          borderColor: `${statusColor}38`,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div
                      className="mt-1 font-mono tabular-nums text-text-muted"
                      style={{ fontSize: 11.5 }}
                    >
                      {inv.invoiceNumber}
                    </div>
                    <div
                      className="mt-0.5 text-text-muted"
                      style={{ fontSize: 12.5 }}
                    >
                      {inv.reference ? `${inv.reference} · ` : ''}
                      Issued {fmtDate(inv.issueDate)}
                      {inv.status === 'sent'
                        ? ` · Due ${fmtDate(inv.dueDate)}`
                        : inv.status === 'paid' && inv.paidAt
                          ? ` · Paid ${fmtDate(inv.paidAt.slice(0, 10))}`
                          : ''}
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-text-muted flex-shrink-0 mt-3"
                  />
                </div>
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
