import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/marketing/booking/BookingFlow';
import { FALLBACK_EXPERTS } from '@/lib/constants';

interface PageProps {
  params: Promise<{ expertSlug: string }>;
}

export function generateStaticParams() {
  return FALLBACK_EXPERTS.map((e) => ({ expertSlug: e.slug }));
}

export default async function ExpertBookingPage({ params }: PageProps) {
  const { expertSlug } = await params;
  const expert = FALLBACK_EXPERTS.find((e) => e.slug === expertSlug);
  if (!expert) notFound();

  return (
    <section className="pt-28 pb-20 md:pt-32 md:pb-24 min-h-screen">
      <div className="container-safe">
        <div className="text-center mb-10 md:mb-14">
          <span className="eyebrow-accent">Booking with {expert.name}</span>
          <h1 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
            Four quick steps.{' '}
            <span className="text-accent">One real conversation.</span>
          </h1>
          <p className="mt-4 text-base text-text-muted max-w-xl mx-auto leading-relaxed">
            No payment required. We&rsquo;ll confirm your slot by WhatsApp or email within 24 hours.
          </p>
        </div>

        <BookingFlow preselectedExpertSlug={expertSlug} />
      </div>
    </section>
  );
}
