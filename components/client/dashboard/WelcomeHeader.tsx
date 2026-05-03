import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Welcomes the logged-in user by name (from Supabase profile).
 * Falls back to a neutral "Welcome back" if name isn't available.
 */
export async function WelcomeHeader() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  let firstName: string | null = null;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, first_name')
          .eq('id', user.id)
          .single();

        // Use the dedicated first_name column when present; otherwise
        // fall back to the first word of full_name; finally fall back
        // to the email's local-part.
        firstName =
          profile?.first_name ||
          (profile?.full_name?.split(' ')[0] ?? null) ||
          user.email?.split('@')[0] ||
          null;
      }
    }
  } catch {
    // ignore — render generic greeting
  }

  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-medium mb-1">
          {today}
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight">
          {firstName ? (
            <>
              {greeting()},{' '}
              <span className="text-accent">{firstName}</span>.
            </>
          ) : (
            <>{greeting()}.</>
          )}
        </h1>
      </div>

      <button
        className="w-10 h-10 flex items-center justify-center rounded-full border border-border hover:border-accent transition-colors flex-shrink-0"
        aria-label="Notifications"
      >
        <Bell size={16} />
      </button>
    </header>
  );
}
