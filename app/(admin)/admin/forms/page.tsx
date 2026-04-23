import { FileText, Inbox } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const metadata = { title: 'Admin · Forms' };

export default function AdminFormsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Submissions"
        title="Pre-Consult Forms"
        subtitle="View form submissions attached to bookings. Different form templates per specialist (trainer intake, medical screening, physio assessment, etc.)."
      />

      <div className="rounded-2xl bg-bg-card border border-border p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
          <FileText size={24} strokeWidth={1.5} />
        </div>
        <div className="font-display font-semibold text-lg mb-2">
          Forms viewer coming soon
        </div>
        <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
          Next iteration will show all pre-consult form submissions here, filterable by
          template (trainer, doctor, physio, athletic, mental, ops) and linked to their
          booking records.
        </p>

        <div className="mt-6 pt-6 border-t border-border-soft">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3">
            Available form templates
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
            {[
              'Trainer Intake',
              'Medical Screening',
              'Physio Assessment',
              'Athletic Performance',
              'Mental Performance',
              'Onboarding',
            ].map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-elevated border border-border text-[11px] font-medium text-text-muted"
              >
                <Inbox size={10} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
