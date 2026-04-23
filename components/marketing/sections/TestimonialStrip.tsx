import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      'I came for a HYROX plan. I left with a team who actually coordinated everything — training, physio, medical. I\'d never go back to a solo coach.',
    name: 'Arjun M.',
    role: 'HYROX Finisher · 16-week programme',
  },
  {
    quote:
      'The medical oversight was the game-changer. Dr. Chandralekha caught a thyroid issue in month one that no previous trainer even thought to check.',
    name: 'Meera K.',
    role: 'Pure Core · 12 weeks',
  },
  {
    quote:
      'Both my wife and I hit our HYROX Doubles goal in 24 weeks. The couples plan is exceptionally well-designed — shared nutrition, joint sessions, everything.',
    name: 'Rohan P.',
    role: 'Pure Elite · 24-week programme',
  },
];

export function TestimonialStrip() {
  return (
    <section className="py-20 md:py-28 border-t border-border bg-bg-inset">
      <div className="container-safe">
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="eyebrow">What Clients Say</span>
          <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
            Real words from{' '}
            <span className="text-accent">real transformations.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="flex flex-col">
              <Quote size={24} className="text-accent/40 mb-4" strokeWidth={2.5} />
              <p className="text-base text-text leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="pt-4 border-t border-border-soft">
                <div className="font-display font-semibold text-sm tracking-tight">
                  {t.name}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mt-1 font-medium">
                  {t.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
