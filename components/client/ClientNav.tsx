'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Apple, LineChart, HeartPulse, User, LogOut } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/cn';
import { signOut as signOutAction } from '@/lib/actions/auth';

// 6 tabs. Bookings dropped from primary nav (low-frequency action;
// still reachable via /book and from Profile). Health takes its slot
// — the daily-action surface for the user's body data: measurements,
// lab reports, vitals, mood pattern, conditions. Ordering puts the
// 3 daily-tracking surfaces (Nutrition / Progress / Health) together
// after Plan.
const navItems = [
  { href: '/client/dashboard', label: 'Home',      icon: Home },
  { href: '/client/plan',      label: 'Plan',      icon: Dumbbell },
  { href: '/client/nutrition', label: 'Nutrition', icon: Apple },
  { href: '/client/progress',  label: 'Progress',  icon: LineChart },
  { href: '/client/health',    label: 'Health',    icon: HeartPulse },
  { href: '/client/profile',   label: 'Profile',   icon: User },
];

// ───────────────────────── MOBILE BOTTOM NAV ─────────────────────────

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]"
      style={{
        background:
          'linear-gradient(to top, rgba(10,12,9,0.98) 70%, rgba(10,12,9,0.85) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(37, 42, 36, 0.8)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-w-0"
            >
              {active && (
                <span
                  className="absolute top-0 w-8 h-0.5 rounded-full bg-accent"
                  style={{ boxShadow: '0 0 8px rgba(198, 255, 61, 0.6)' }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.3 : 1.8}
                className={cn(
                  'transition-colors',
                  active ? 'text-accent' : 'text-text-muted'
                )}
              />
              <span
                className={cn(
                  'font-mono text-[9px] uppercase tracking-[0.12em] font-bold transition-colors',
                  active ? 'text-accent' : 'text-text-muted'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ───────────────────────── DESKTOP SIDEBAR ─────────────────────────

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-20 lg:w-64 flex-col bg-bg-card border-r border-border">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border">
        <Link href="/client/dashboard" className="flex items-center gap-2">
          <Logo className="h-7 hidden lg:block" />
          <div className="lg:hidden w-8 h-8 rounded-lg bg-accent text-bg flex items-center justify-center font-display font-black text-sm">
            P
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 lg:px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all group',
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text hover:bg-bg-elevated'
              )}
              style={{
                boxShadow: active ? 'inset 0 0 0 1px rgba(198, 255, 61, 0.2)' : 'none',
              }}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                className="flex-shrink-0 mx-auto lg:mx-0"
              />
              <span className="font-medium text-sm hidden lg:block">{item.label}</span>
              {active && (
                <span
                  className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-accent"
                  style={{ boxShadow: '0 0 6px rgba(198, 255, 61, 0.7)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out (the "Book a specialist" quick CTA was removed per
          product decision — Bookings is no longer surfaced in the
          primary menu. Direct booking still works at /book and
          /book/[expertSlug] for users who land there from emails or
          a coach's share link.) */}
      <div className="p-3 lg:p-4 border-t border-border">
        <SignOutSidebarButton />
      </div>
    </aside>
  );
}

// ─── Sign out sub-component (separate to keep import clean) ───
function SignOutSidebarButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
      >
        <LogOut size={18} className="flex-shrink-0 mx-auto lg:mx-0" strokeWidth={1.8} />
        <span className="hidden lg:block text-sm font-medium">Sign out</span>
      </button>
    </form>
  );
}
