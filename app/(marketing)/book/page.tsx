import { BookingFlow } from '@/components/marketing/booking/BookingFlow';

interface BookingPageProps {
  searchParams: Promise<{ expert?: string }>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const { expert } = await searchParams;
  return (
    <section className="pt-28 pb-20 md:pt-32 md:pb-24 min-h-screen">
      <div className="container-safe">
        <div className="text-center mb-10 md:mb-14">
          <span className="eyebrow-accent">Book Your Consultation</span>
          <h1 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
            Five quick steps.{' '}
            <span className="text-accent">One real conversation.</span>
          </h1>
          <p className="mt-4 text-base text-text-muted max-w-xl mx-auto leading-relaxed">
            No payment required. We&rsquo;ll confirm your slot by WhatsApp or email within 24 hours.
          </p>
        </div>

        <BookingFlow preselectedExpertSlug={expert} />
      </div>
    </section>
  );
}
