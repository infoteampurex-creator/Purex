import { LineChart } from 'lucide-react';
import Link from 'next/link';

export default function ProgressPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md">
        <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/30 mb-5 text-accent">
          <LineChart size={22} />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
          Coming Next
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          Progress Report
        </h1>
        <p className="mt-4 text-sm text-text-muted leading-relaxed">
          Weight trend, body composition changes, performance metrics, and check-in history. Full progress visualisation ships next.
        </p>
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 mt-6 text-sm text-accent hover:underline font-medium"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
