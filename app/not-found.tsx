import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center">
      <div className="container-safe text-center max-w-xl">
        <div className="font-display font-black text-accent text-9xl tracking-tighter leading-none">
          404
        </div>
        <h1 className="mt-6 font-display font-semibold text-display-lg tracking-tight">
          This page doesn&rsquo;t exist.
        </h1>
        <p className="mt-4 text-base text-text-muted">
          Try heading back home or booking a consultation instead.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/"><Button variant="primary">Back to Home</Button></Link>
          <Link href="/book"><Button variant="outline">Get Started</Button></Link>
        </div>
      </div>
    </section>
  );
}
