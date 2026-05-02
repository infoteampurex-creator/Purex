import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { BRAND } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-inset">
      <div className="container-safe py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Logo className="h-8 mb-4" />
            <p className="text-sm text-text-muted max-w-xs leading-relaxed">
              Integrated health coaching. Built for transformation, not aesthetics.
            </p>
            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
              {BRAND.locations.join(' · ')}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-4">Discover</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/experts" className="text-text-muted hover:text-text transition-colors">Meet the Team</Link></li>
              <li><Link href="/programs" className="text-text-muted hover:text-text transition-colors">Programs</Link></li>
              <li><Link href="/transformations" className="text-text-muted hover:text-text transition-colors">Transformations</Link></li>
              <li><Link href="/about" className="text-text-muted hover:text-text transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-4">Get in Touch</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/book" className="text-text-muted hover:text-text transition-colors">Get Started</Link></li>
              <li><Link href="/contact" className="text-text-muted hover:text-text transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="text-text-muted hover:text-text transition-colors">FAQ</Link></li>
              <li>
                <a href={`mailto:${BRAND.email}`} className="text-text-muted hover:text-text transition-colors">
                  {BRAND.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-4">Legal</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="text-text-muted hover:text-text transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-text-muted hover:text-text transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 md:mt-16 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            © {new Date().getFullYear()} PURE X. All rights reserved.
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Train for Life. Not Just Aesthetics.
          </div>
        </div>
      </div>
    </footer>
  );
}
