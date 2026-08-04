import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUserId } from '@/lib/data/client-live';
import { getInvoiceById, getCompanySettings } from '@/lib/data/invoices';
import { InvoiceView } from '@/components/invoicing/InvoiceView';
import { DownloadPdfButton } from '@/components/invoicing/DownloadPdfButton';

export const metadata = { title: 'Invoice' };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [invoice, settings] = await Promise.all([
    getInvoiceById(id),
    getCompanySettings(),
  ]);
  if (!invoice) notFound();

  // Defence-in-depth: RLS should have blocked this, but 404 on any
  // invoice that doesn't belong to the current user OR is still a
  // draft (shouldn't be visible to client).
  if (invoice.clientId !== userId || invoice.status === 'draft') {
    notFound();
  }

  return (
    <div>
      <div className="print-hide flex items-center justify-between gap-4 mb-4">
        <Link
          href="/client/invoices"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors font-mono uppercase tracking-[0.14em] font-bold"
        >
          <ArrowLeft size={12} />
          Back to invoices
        </Link>
        <DownloadPdfButton
          invoiceNumber={invoice.invoiceNumber}
          variant="primary"
        />
      </div>

      <div className="rounded-2xl overflow-hidden">
        <InvoiceView invoice={invoice} settings={settings} />
      </div>
    </div>
  );
}
