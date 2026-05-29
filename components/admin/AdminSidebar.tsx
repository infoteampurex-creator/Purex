'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  Users,
  Radar,
  UserCog,
  FileText,
  Library,
  Footprints,
  Stethoscope,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/cn';
import { signOut as signOutAction } from '@/lib/actions/auth';

// Full nav set — used by desktop sidebar + the "More" sheet on mobile
const navItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/leads', label: 'Leads', icon: Inbox, badge: true },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/radar', label: 'Radar', icon: Radar },
  { href: '/admin/templates', label: 'Templates', icon: Library },
  { href: '/admin/mother-strong', label: 'Mother Strong', icon: Footprints },
  { href: '/admin/specialists', label: 'Specialists', icon: UserCog },
  { href: '/admin/forms', label: 'Forms', icon: FileText },
  { href: '/admin/diagnostic', label: 'Diagnostic', icon: Stethoscope },
];

// Mobile bottom nav — 4 most-used + "More" sheet for the rest. Order
// reflects daily coach workflow: Overview (Home) → Radar (triage) →
// Clients (work surface) → Leads (incoming).
const mobileBottomItems = [
  { href: '/admin/dashboard', label: 'Home',    icon: LayoutDashboard },
  { href: '/admin/radar',     label: 'Radar',   icon: Radar },
  { href: '/admin/clients',   label: 'Clients', icon: Users },
  { href: '/admin/leads',     label: 'Leads',   icon: Inbox },
];

const mobileMoreItems = navItems.filter(
  (i) => !mobileBottomItems.find((m) => m.href === i.href)
);

// ─── MOBILE BOTTOM NAV (matches client app pattern) ──────────────

export function AdminMobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = mobileMoreItems.some((i) => pathname.startsWith(i.href));

  return (
    <>
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
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
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
          {/* More tab */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-w-0"
          >
            {moreActive && (
              <span
                className="absolute top-0 w-8 h-0.5 rounded-full bg-accent"
                style={{ boxShadow: '0 0 8px rgba(198, 255, 61, 0.6)' }}
              />
            )}
            <Menu
              size={20}
              strokeWidth={moreActive ? 2.3 : 1.8}
              className={cn(
                'transition-colors',
                moreActive ? 'text-accent' : 'text-text-muted'
              )}
            />
            <span
              className={cn(
                'font-mono text-[9px] uppercase tracking-[0.12em] font-bold transition-colors',
                moreActive ? 'text-accent' : 'text-text-muted'
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Slide-up "More" sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 md:hidden"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 md:hidden rounded-t-3xl overflow-hidden"
              style={{
                background: '#0a0c09',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '85vh',
              }}
            >
              <div className="flex justify-center pt-2.5 pb-1">
                <div
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.18)',
                  }}
                />
              </div>
              <div className="px-5 pt-2 pb-3 flex items-center justify-between">
                <h2
                  className="font-mono uppercase tracking-[0.22em] font-bold"
                  style={{ fontSize: 11, color: '#c6ff3d' }}
                >
                  Admin · More
                </h2>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <X size={15} style={{ color: 'rgba(255,255,255,0.65)' }} />
                </button>
              </div>

              <ul className="pb-2">
                {mobileMoreItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-5 py-3.5 transition-colors',
                          active
                            ? 'bg-accent/10 text-accent'
                            : 'text-text hover:bg-white/[0.03]'
                        )}
                      >
                        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div
                className="border-t pt-2 pb-4"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-text-muted hover:text-text"
                >
                  <ExternalLink size={16} strokeWidth={1.8} />
                  <span className="text-sm font-medium">View site</span>
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-5 py-3 text-danger hover:bg-danger/5"
                  >
                    <LogOut size={16} strokeWidth={1.8} />
                    <span className="text-sm font-medium">Sign out</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── DESKTOP SIDEBAR (md+) ───────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-20 lg:w-64 flex-col bg-bg-card border-r border-border">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent text-bg flex items-center justify-center font-display font-black text-sm lg:hidden">
            P
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Logo className="h-6" />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent font-bold border border-accent/30 rounded px-1.5 py-0.5">
              Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 lg:px-4 space-y-1 overflow-y-auto">
        <div className="hidden lg:block font-mono text-[9px] uppercase tracking-[0.22em] text-text-dim font-bold px-2 mb-2">
          Manage
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative',
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text hover:bg-bg-elevated'
              )}
              style={{
                boxShadow: active ? 'inset 0 0 0 1px rgba(198, 255, 61, 0.2)' : 'none',
              }}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.8}
                className="flex-shrink-0 mx-auto lg:mx-0"
              />
              <span className="font-medium text-sm hidden lg:block">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'hidden lg:flex ml-auto items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold font-mono',
                    active ? 'bg-accent text-bg' : 'bg-accent/20 text-accent'
                  )}
                >
                  3
                </span>
              )}
              {active && (
                <span
                  className="hidden lg:block absolute right-2 w-1.5 h-1.5 rounded-full bg-accent"
                  style={{ boxShadow: '0 0 6px rgba(198, 255, 61, 0.7)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer — view site + sign out */}
      <div className="p-3 lg:p-4 border-t border-border space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-text hover:bg-bg-elevated transition-colors"
        >
          <ExternalLink size={16} className="flex-shrink-0 mx-auto lg:mx-0" strokeWidth={1.8} />
          <span className="hidden lg:block text-sm font-medium">View site</span>
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
          >
            <LogOut size={16} className="flex-shrink-0 mx-auto lg:mx-0" strokeWidth={1.8} />
            <span className="hidden lg:block text-sm font-medium">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
