import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy · PURE X',
  description:
    'How PURE X collects, uses, and protects your personal and health information.',
};

export default function PrivacyPage() {
  return (
    <main className="relative bg-bg text-text">
      {/* Hero */}
      <section className="relative pt-28 md:pt-36 pb-8 md:pb-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.05) 0%, transparent 55%)',
          }}
        />
        <div className="container-safe relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
              <span className="w-4 h-px bg-accent" />
              Legal
            </div>
            <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-4">
              Privacy Policy.
            </h1>
            <p className="text-text-muted">
              <span className="font-mono text-xs uppercase tracking-[0.14em]">
                Last updated:
              </span>{' '}
              23 April 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-12 md:py-20">
        <div className="container-safe max-w-3xl">
          <div className="prose-custom space-y-10 text-[15px] leading-[1.75] text-text-muted">
            <Intro>
              PURE X ("we", "our", "us") respects your privacy. This policy explains what
              information we collect, how we use it, and the controls you have. It applies
              to our website, mobile app, client platform, and any coaching services you
              receive through us.
            </Intro>

            <Section title="1. Information We Collect">
              <p>When you interact with PURE X, we may collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-text">Account information</strong> — name, email,
                  phone number, password (stored hashed).
                </li>
                <li>
                  <strong className="text-text">Health information</strong> — age, weight,
                  height, medical history, injuries, fitness goals, and anything you
                  voluntarily share with our doctor or physiotherapist.
                </li>
                <li>
                  <strong className="text-text">Programme data</strong> — training logs,
                  nutrition entries, sleep and activity data, progress photos, check-in
                  metrics.
                </li>
                <li>
                  <strong className="text-text">Payment information</strong> — processed by
                  our payment partner; we never store your full card details.
                </li>
                <li>
                  <strong className="text-text">Usage data</strong> — pages visited, device
                  type, IP address, browser type, time spent on the platform.
                </li>
              </ul>
            </Section>

            <Section title="2. How We Use It">
              <ul className="list-disc pl-6 space-y-2">
                <li>Deliver the coaching programme you signed up for.</li>
                <li>
                  Share relevant health information with the specific coach, doctor,
                  physio, or mental health consultant supporting your plan.
                </li>
                <li>
                  Process payments, manage bookings, and communicate about your programme.
                </li>
                <li>Monitor your progress and adapt your plan based on real data.</li>
                <li>
                  Improve our services, with anonymised aggregate analysis only (never
                  individual-level without your consent).
                </li>
                <li>Comply with legal obligations and respond to lawful requests.</li>
              </ul>
            </Section>

            <Section title="3. Who Sees Your Data">
              <p>
                Your personal and health information is only visible to the PURE X coaches
                and specialists directly supporting your programme — plus the platform
                administrators responsible for system operations.
              </p>
              <p>
                <strong className="text-text">We do not sell your data.</strong> We do not
                share your personal or health information with advertisers, data brokers,
                or unrelated third parties.
              </p>
              <p>
                Limited third parties that we use to operate the service (such as hosting
                providers, email senders, payment processors) process data under strict
                contracts and only for the purpose of delivering our service.
              </p>
            </Section>

            <Section title="4. Your Rights">
              <p>You can at any time:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Request a copy of the data we hold about you.</li>
                <li>Ask us to correct or update any information.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Withdraw consent for any non-essential data processing.</li>
                <li>Lodge a complaint with a relevant data protection authority.</li>
              </ul>
              <p>
                Contact{' '}
                <a
                  href="mailto:hello@purex.fit"
                  className="text-accent hover:underline"
                >
                  hello@purex.fit
                </a>{' '}
                to exercise any of these rights. We respond within 30 days.
              </p>
            </Section>

            <Section title="5. Data Retention">
              <p>
                We keep your account and programme data while you are an active client,
                and for up to 3 years after your last interaction. Anonymised aggregate
                data may be retained longer for internal analysis.
              </p>
            </Section>

            <Section title="6. Security">
              <p>
                We use industry-standard safeguards — encrypted connections, role-based
                access control, and private storage for sensitive files like progress
                photos. However, no system is 100% secure. Please use a strong unique
                password and notify us immediately if you suspect any compromise.
              </p>
            </Section>

            <Section title="7. Children">
              <p>
                PURE X services are for adults (18+) unless a parent or legal guardian
                explicitly enrols a minor with medical clearance. We do not knowingly
                collect data from anyone under 18 without guardian consent.
              </p>
            </Section>

            <Section title="8. International Users">
              <p>
                We operate from Hyderabad (India) and London (UK). Data may be processed
                in either jurisdiction. We apply the stricter protection standard (UK GDPR
                / India DPDP Act) across all users.
              </p>
            </Section>

            <Section title="9. Updates">
              <p>
                We may update this policy from time to time. If we make material changes,
                we will notify you by email and via the platform at least 14 days before
                they take effect.
              </p>
            </Section>

            <Section title="10. Contact">
              <p>
                Questions about your privacy?
                <br />
                <strong className="text-text">Email:</strong>{' '}
                <a
                  href="mailto:hello@purex.fit"
                  className="text-accent hover:underline"
                >
                  hello@purex.fit
                </a>
                <br />
                <strong className="text-text">Data Protection Officer:</strong> Siva
                Jampana, Co-Founder & Operations Head
              </p>
            </Section>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 md:py-20 border-t border-border-soft">
        <div className="container-safe max-w-2xl text-center">
          <p className="text-text-muted mb-6">
            Have more questions before signing up? Read our{' '}
            <Link href="/faq" className="text-accent hover:underline">
              FAQ
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-accent hover:underline">
              contact us
            </Link>
            .
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
          >
            Book a Consultation
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Intro({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base md:text-lg text-text leading-relaxed">{children}</p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display font-semibold text-xl md:text-2xl tracking-tight text-text mb-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
