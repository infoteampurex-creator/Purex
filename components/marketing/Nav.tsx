'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/Button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const navLinks = [
  { href: '/experts', label: 'Experts' },
  { href: '/programs', label: 'Programs' },
  { href: '/#hyrox', label: 'HYROX' },
  { href: '/#ironman', label: 'IRONMAN' },
  { href: '/transformations', label: 'Stories' },
  { href: '/faq', label: 'FAQ' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-bg/90 backdrop-blur-xl border-b border-border'
            : 'bg-transparent'
        )}
      >
        <nav className="container-safe flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <Logo className="h-7 md:h-8" />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-muted hover:text-text transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:inline-flex text-sm text-text-muted hover:text-text font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link href="/book" className="hidden md:inline-flex">
              <Button variant="primary" size="sm">
                Book a Consultation
              </Button>
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full border border-border hover:border-accent transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur-xl"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-bg-card border-l border-border p-6 flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <Logo className="h-7" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-border"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className="py-3 text-lg font-display font-semibold hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-3">
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="block w-full text-center py-3 text-sm font-medium text-text-muted hover:text-accent transition-colors border-t border-border pt-4"
              >
                Already a member? Sign in
              </Link>
              <Link href="/book" onClick={() => setDrawerOpen(false)}>
                <Button variant="primary" size="lg" className="w-full">
                  Book a Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
