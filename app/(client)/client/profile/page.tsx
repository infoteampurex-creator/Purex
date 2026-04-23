import { User } from 'lucide-react';
import Link from 'next/link';
import { MOCK_CLIENT } from '@/lib/data/client-mock';

export default function ProfilePage() {
  return (
    <div className="max-w-xl mx-auto">
      {/* Profile header */}
      <div className="text-center mb-10">
        <div className="inline-flex w-20 h-20 items-center justify-center rounded-full border-2 border-accent/60 bg-gradient-to-br from-accent/20 to-bg-elevated mb-4 font-display font-black text-3xl text-accent">
          {MOCK_CLIENT.firstName[0]}
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          {MOCK_CLIENT.fullName}
        </h1>
        <div className="mt-1 text-sm text-text-muted">{MOCK_CLIENT.email}</div>

        <div className="mt-4 inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold">
            {MOCK_CLIENT.activePlan} · Day {MOCK_CLIENT.dayNumber}
          </span>
        </div>
      </div>

      {/* Profile completion */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
              Profile Completion
            </div>
            <div className="font-display font-semibold text-lg tracking-tight">
              {MOCK_CLIENT.profileCompletion}% complete
            </div>
          </div>
          <Link
            href="#"
            className="text-xs text-accent font-bold hover:underline"
          >
            Complete →
          </Link>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${MOCK_CLIENT.profileCompletion}%`,
              background: 'linear-gradient(90deg, #c6ff3d, #4dffb8)',
              boxShadow: '0 0 8px rgba(198, 255, 61, 0.4)',
            }}
          />
        </div>
      </div>

      {/* Coming next */}
      <div className="text-center py-10 px-5 bg-bg-card border border-border rounded-2xl">
        <User size={28} className="text-accent/60 mx-auto mb-3" />
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-2">
          Coming Next
        </div>
        <h2 className="font-display font-semibold text-lg tracking-tight mb-2">
          Profile Editor
        </h2>
        <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
          Edit personal info, assigned coach, notification preferences, plan details, and billing. Scaffolds next.
        </p>
      </div>
    </div>
  );
}
