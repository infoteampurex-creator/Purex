import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function BookingsPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md">
        <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/30 mb-5 text-accent">
          <Calendar size={22} />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
          Coming Next
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          All Bookings
        </h1>
        <p className="mt-4 text-sm text-text-muted leading-relaxed">
          Your full booking history and upcoming sessions with all 6 specialists. Phase 2 will integrate Calendly and show all past + future appointments here.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link href="/book">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              Book a Session
            </Button>
          </Link>
          <Link href="/client/dashboard">
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
