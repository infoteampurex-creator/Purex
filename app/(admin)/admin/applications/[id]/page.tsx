import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, MessageCircle, Calendar, ExternalLink } from 'lucide-react';
import { ApplicationActionsPanel } from '@/components/admin/ApplicationActionsPanel';
import {
  getAdminEnquiryById,
  getAssignableSpecialists,
} from '@/lib/data/enquiries';
import {
  PRIMARY_GOAL_OPTIONS,
  START_TIMING_OPTIONS,
  ENQUIRY_STATUS_LABEL,
  ENQUIRY_STATUS_COLOR,
} from '@/lib/data/enquiries-types';

export const metadata = { title: 'Admin · Application detail' };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [enquiry, specialists] = await Promise.all([
    getAdminEnquiryById(id),
    getAssignableSpecialists(),
  ]);
  if (!enquiry) notFound();

  const goalLabel =
    PRIMARY_GOAL_OPTIONS.find((o) => o.value === enquiry.primaryGoal)?.label ??
    enquiry.primaryGoal;
  const timingLabel =
    START_TIMING_OPTIONS.find((o) => o.value === enquiry.startTiming)?.label ??
    enquiry.startTiming;

  const submittedAt = new Date(enquiry.createdAt).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors mb-5 font-mono uppercase tracking-[0.14em] font-bold"
      >
        <ArrowLeft size={12} />
        Back to applications
      </Link>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 md:gap-8 items-start">
        {/* Main content */}
        <div className="space-y-5">
          {/* Identity card */}
          <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5">
                  Ref · {enquiry.id.slice(0, 8).toUpperCase()}
                </div>
                <h1 className="font-display font-semibold text-2xl tracking-tight">
                  {enquiry.fullName}
                </h1>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] uppercase tracking-[0.12em] font-bold border"
                style={{
                  color: ENQUIRY_STATUS_COLOR[enquiry.status],
                  borderColor: ENQUIRY_STATUS_COLOR[enquiry.status] + '50',
                  background: ENQUIRY_STATUS_COLOR[enquiry.status] + '15',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: ENQUIRY_STATUS_COLOR[enquiry.status],
                    boxShadow: `0 0 4px ${ENQUIRY_STATUS_COLOR[enquiry.status]}`,
                  }}
                />
                {ENQUIRY_STATUS_LABEL[enquiry.status]}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
              <a
                href={`https://wa.me/91${enquiry.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#25D366] transition-colors font-mono"
              >
                <MessageCircle size={11} />
                +91 {enquiry.whatsapp}
                <ExternalLink size={9} />
              </a>
              <a
                href={`mailto:${enquiry.email}`}
                className="inline-flex items-center gap-1.5 hover:text-accent transition-colors"
              >
                <Mail size={11} />
                {enquiry.email}
              </a>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Calendar size={11} />
                {submittedAt}
              </span>
            </div>
          </div>

          {/* Answers */}
          <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6">
            <h2 className="font-display font-semibold text-lg tracking-tight mb-4">
              Answers
            </h2>
            <dl className="space-y-4">
              <Pair label="Primary goal" value={goalLabel} accent />
              <Pair label="Can start" value={timingLabel} />
              {enquiry.message && (
                <Pair
                  label="Message"
                  value={enquiry.message}
                  wrap
                />
              )}
              {enquiry.source && (
                <Pair
                  label="Source"
                  value={enquiry.source}
                  mono
                />
              )}
            </dl>
          </div>
        </div>

        {/* Actions sidebar */}
        <ApplicationActionsPanel
          enquiry={enquiry}
          specialists={specialists}
        />
      </div>
    </>
  );
}

function Pair({
  label,
  value,
  accent,
  wrap,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  wrap?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1">
        {label}
      </dt>
      <dd
        className={
          (accent ? 'text-accent ' : 'text-text ') +
          (mono ? 'font-mono text-xs ' : '') +
          (wrap ? 'whitespace-pre-wrap leading-relaxed ' : '') +
          'font-medium'
        }
        style={{ fontSize: accent ? 17 : 15 }}
      >
        {value}
      </dd>
    </div>
  );
}
