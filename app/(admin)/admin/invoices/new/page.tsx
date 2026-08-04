import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAdminClientById } from '@/lib/data/admin-clients';
import { getCompanySettings } from '@/lib/data/invoices';
import { CreateInvoiceForm } from '@/components/admin/CreateInvoiceForm';

export const metadata = { title: 'Admin · New invoice' };
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const { clientId } = await searchParams;
  if (!clientId) redirect('/admin/clients');

  const [client, settings] = await Promise.all([
    getAdminClientById(clientId),
    getCompanySettings(),
  ]);
  if (!client) redirect('/admin/clients');

  return (
    <div>
      <Link
        href={`/admin/clients/${client.id}`}
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors font-mono uppercase tracking-[0.14em] font-bold mb-4"
      >
        <ArrowLeft size={12} />
        Back to {client.fullName}
      </Link>

      <div className="mb-6">
        <div
          className="font-mono uppercase tracking-[0.22em] font-bold mb-1"
          style={{ fontSize: 11, color: '#d4a050' }}
        >
          New invoice
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          Invoice for {client.fullName}
        </h1>
      </div>

      <CreateInvoiceForm
        clientId={client.id}
        clientName={client.fullName}
        clientEmail={client.email}
        settings={settings}
      />
    </div>
  );
}
