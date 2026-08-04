import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getInvoiceById, getCompanySettings } from '@/lib/data/invoices';
import { InvoiceView } from '@/components/invoicing/InvoiceView';
import { InvoiceActions } from '@/components/admin/InvoiceActions';

export const metadata = { title: 'Admin · Invoice' };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([
    getInvoiceById(id),
    getCompanySettings(),
  ]);
  if (!invoice) notFound();

  return (
    <div>
      <div className="print-hide flex items-center justify-between gap-4 mb-4">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors font-mono uppercase tracking-[0.14em] font-bold"
        >
          <ArrowLeft size={12} />
          Back to invoices
        </Link>
        <InvoiceActions invoice={invoice} />
      </div>

      <div className="rounded-2xl overflow-hidden">
        <InvoiceView invoice={invoice} settings={settings} />
      </div>
    </div>
  );
}
