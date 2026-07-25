import { createClient } from '@/lib/supabase/server';
import { LocalDateGreeting } from './LocalDateGreeting';

function serverGreeting() {
  // Fallback greeting for SSR — replaced by the client-side one on
  // hydrate. Uses UTC-adjacent time so it's a reasonable placeholder.
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Welcomes the logged-in user by name (from Supabase profile).
 * Server component: does the profile lookup + emits initial SSR
 * strings. Handoff to <LocalDateGreeting /> for hydration; that
 * client component overwrites the date + greeting with the user's
 * DEVICE local time (fixes the "server said morning, my phone says
 * evening" bug reported 2026-07-16).
 */
export async function WelcomeHeader() {
  const initialDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  const initialGreeting = serverGreeting();

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
    <LocalDateGreeting
      initialDate={initialDate}
      initialGreeting={initialGreeting}
      firstName={firstName}
    />
  );
}
