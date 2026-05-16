'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  Users,
  UserCog,
  FileText,
  Library,
  Footprints,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/cn';
import { signOut as signOutAction } from '@/lib/actions/auth';

const navItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/leads', label: 'Leads', icon: Inbox, badge: true },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/templates', label: 'Templates', icon: Library },
  { href: '/admin/mother-strong', label: 'Mother Strong', icon: Footprints },
  { href: '/admin/specialists', label: 'Specialists', icon: UserCog },
  { href: '/admin/forms', label: 'Forms', icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-20 lg:w-64 flex flex-col bg-bg-card border-r border-border">
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
