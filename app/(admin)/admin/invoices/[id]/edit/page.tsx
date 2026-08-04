import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getInvoiceById, getCompanySettings } from '@/lib/data/invoices';
import { getAdminClientById } from '@/lib/data/admin-clients';
import { CreateInvoiceForm } from '@/components/admin/CreateInvoiceForm';

export const metadata = { title: 'Admin · Edit invoice' };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([
    getInvoiceById(id),
    getCompanySettings(),
  ]);
  if (!invoice) notFound();
  if (invoice.status !== 'draft') {
    // Guard: sent / paid / void invoices are immutable
    notFound();
  }

  const client = await getAdminClientById(invoice.clientId);
  if (!client) notFound();

  return (
    <div>
      <Link
        href={`/admin/invoices/${id}`}
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors font-mono uppercase tracking-[0.14em] font-bold mb-4"
      >
        <ArrowLeft size={12} />
        Back to invoice
      </Link>

      <div className="mb-6">
        <div
          className="font-mono uppercase tracking-[0.22em] font-bold mb-1"
          style={{ fontSize: 11, color: '#d4a050' }}
        >
          Edit draft
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          {invoice.invoiceNumber} · {client.fullName}
        </h1>
      </div>

      <CreateInvoiceForm
        clientId={client.id}
        clientName={client.fullName}
        clientEmail={client.email}
        settings={settings}
        mode="edit"
        invoiceId={invoice.id}
        initial={invoice}
      />
    </div>
  );
}
