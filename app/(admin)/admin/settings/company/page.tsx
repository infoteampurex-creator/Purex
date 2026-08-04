import { getCompanySettings } from '@/lib/data/invoices';
import { CompanySettingsForm } from '@/components/admin/CompanySettingsForm';

export const metadata = { title: 'Admin · Company settings' };
export const dynamic = 'force-dynamic';

export default async function CompanySettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div>
      <div className="mb-6">
        <div
          className="font-mono uppercase tracking-[0.22em] font-bold mb-1"
          style={{ fontSize: 11, color: '#d4a050' }}
        >
          Settings · Company
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          Billing details
        </h1>
        <p className="text-text-muted mt-2 max-w-2xl" style={{ fontSize: 14 }}>
          Everything on this page appears on every invoice you send. UK VAT
          and India GST numbers are optional — leave them blank until you
          register and existing invoices will simply omit them.
        </p>
      </div>

      <CompanySettingsForm initial={settings} />
    </div>
  );
}
