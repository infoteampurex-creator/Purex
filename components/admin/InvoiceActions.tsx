'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle, XCircle, Trash2, Edit3 } from 'lucide-react';
import {
  sendInvoiceAction,
  markInvoicePaidAction,
  voidInvoiceAction,
  deleteDraftInvoiceAction,
} from '@/lib/actions/invoices';
import type { InvoiceWithItems } from '@/lib/data/invoices';
import { DownloadPdfButton } from '@/components/invoicing/DownloadPdfButton';

interface Props {
  invoice: InvoiceWithItems;
}

/**
 * Action toolbar above the invoice preview. Buttons are gated by
 * status: only drafts show Send + Delete; sent invoices show Mark
 * Paid + Void; paid/void invoices show only Print.
 */
export function InvoiceActions({ invoice }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setErr(null);
      const res = await fn();
      if (!res.ok) {
        setErr(res.error ?? 'Action failed');
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {err && (
        <span
          className="text-xs font-mono uppercase tracking-[0.16em] font-bold text-[#ff6b6b] mr-1"
          style={{ fontSize: 10 }}
        >
          {err}
        </span>
      )}
      {invoice.status === 'draft' && (
        <>
          <ActionBtn
            icon={<Send size={12} />}
            label="Send now"
            primary
            disabled={pending}
            onClick={() => run(() => sendInvoiceAction(invoice.id))}
          />
          <Link
            href={`/admin/invoices/${invoice.id}/edit`}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium border border-border text-text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Edit3 size={12} />
            Edit
          </Link>
          <ActionBtn
            icon={<Trash2 size={12} />}
            label="Delete draft"
            danger
            disabled={pending}
            onClick={() => {
              if (
                !confirm('Delete this draft invoice? This cannot be undone.')
              )
                return;
              run(async () => {
                const res = await deleteDraftInvoiceAction(invoice.id);
                if (res.ok) router.push('/admin/invoices');
                return res;
              });
            }}
          />
        </>
      )}
      {invoice.status === 'sent' && (
        <>
          <ActionBtn
            icon={<CheckCircle size={12} />}
            label="Mark paid"
            primary
            disabled={pending}
            onClick={() => run(() => markInvoicePaidAction(invoice.id))}
          />
          <ActionBtn
            icon={<XCircle size={12} />}
            label="Void"
            danger
            disabled={pending}
            onClick={() => {
              if (
                !confirm(
                  'Void this invoice? Sent invoices cannot be deleted — voiding is permanent.'
                )
              )
                return;
              run(() => voidInvoiceAction(invoice.id));
            }}
          />
        </>
      )}
      <DownloadPdfButton
        invoiceNumber={invoice.invoiceNumber}
        variant="ghost"
      />
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  primary,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const base = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium border transition-colors';
  const style = primary
    ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
    : danger
      ? 'bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/30 hover:bg-[#ff6b6b]/20'
      : 'border-border text-text-muted hover:border-accent hover:text-accent';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${style}`}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {icon}
      {label}
    </button>
  );
}
