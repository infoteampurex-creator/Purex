'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, LineChart, Calendar, User, LogOut } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/cn';
import { signOut as signOutAction } from '@/lib/actions/auth';

const navItems = [
  { href: '/client/dashboard', label: 'Home', icon: Home },
  { href: '/client/plan', label: 'Plan', icon: Dumbbell },
  { href: '/client/progress', label: 'Progress', icon: LineChart },
  { href: '/client/bookings', label: 'Bookings', icon: Calendar },
  { href: '/client/profile', label: 'Profile', icon: User },
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

      {/* Bottom quick CTA + sign out */}
      <div className="p-3 lg:p-4 border-t border-border space-y-2">
        <Link
          href="/book"
          className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/30 hover:border-accent/60 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-bg font-display font-black text-xs flex-shrink-0 mx-auto lg:mx-0">
            +
          </div>
          <div className="hidden lg:block min-w-0">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent font-bold">
              Quick
            </div>
            <div className="text-sm font-medium truncate">Book a specialist</div>
          </div>
        </Link>

        {/* Sign out */}
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
