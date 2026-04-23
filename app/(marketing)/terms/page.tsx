import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service · PURE X',
  description: 'The terms and conditions governing your use of PURE X services.',
};

export default function TermsPage() {
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
              Terms of Service.
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
            <p className="text-base md:text-lg text-text leading-relaxed">
              By creating an account or booking a programme with PURE X, you agree to
              these Terms. Please read them carefully. If you disagree with any part, do
              not use our services.
            </p>

            <Section title="1. Who We Are">
              <p>
                PURE X is an integrated health and fitness coaching platform with teams in
                Hyderabad (India) and London (United Kingdom). We provide personal
                training, physiotherapy, medical consultation, mental health support, and
                nutrition guidance as one coordinated service.
              </p>
            </Section>

            <Section title="2. Eligibility">
              <p>
                You must be 18 years or older to enrol directly. Minors may participate
                only with explicit consent from a parent or legal guardian, and only after
                our doctor has provided medical clearance.
              </p>
            </Section>

            <Section title="3. Your Account">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  You're responsible for keeping your login credentials private and for
                  all activity under your account.
                </li>
                <li>
                  Notify us immediately if you suspect any unauthorised access.
                </li>
                <li>
                  You agree to provide accurate and honest information, including medical
                  history. Incorrect information may endanger your safety.
                </li>
              </ul>
            </Section>

            <Section title="4. Medical Disclaimer">
              <p>
                Before starting any training programme with us, you will complete a
                medical screening with our Consultant Doctor. You must disclose all
                relevant health conditions, injuries, medications, and prior surgeries.
              </p>
              <p>
                PURE X coaches, doctors, and physiotherapists provide guidance based on
                the information you share. However:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Training carries inherent physical risk. You participate at your own
                  risk.
                </li>
                <li>
                  We strongly recommend consulting your primary physician before starting
                  any new fitness regimen if you have pre-existing conditions.
                </li>
                <li>
                  Our services are not a substitute for emergency medical care. Call your
                  local emergency number in any urgent situation.
                </li>
              </ul>
            </Section>

            <Section title="5. Payments & Refunds">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Programme fees are payable in advance at the start of each billing
                  cycle.
                </li>
                <li>
                  Pure Foundation is a one-time fee. Pure Core, Elite, and Elite Couple
                  are monthly subscriptions.
                </li>
                <li>
                  You can cancel any subscription anytime — cancellation takes effect at
                  the end of the current paid cycle.
                </li>
                <li>
                  <strong className="text-text">Refunds:</strong> We offer a 7-day money-back
                  guarantee on your first paid cycle if we haven't yet conducted your
                  medical screening. After that, fees are non-refundable, but you can
                  pause your subscription for valid medical reasons.
                </li>
              </ul>
            </Section>

            <Section title="6. Cancellation & Pausing">
              <p>
                Cancel anytime in-app or by emailing{' '}
                <a
                  href="mailto:hello@purex.fit"
                  className="text-accent hover:underline"
                >
                  hello@purex.fit
                </a>
                . Medical pauses (injury, illness, pregnancy) are honoured with written
                medical evidence — your subscription freezes at no additional cost until
                you are cleared to resume.
              </p>
            </Section>

            <Section title="7. Code of Conduct">
              <p>While using PURE X, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Treat all coaches, specialists, and other members with respect.</li>
                <li>
                  Follow safety instructions given by trainers, physios, or medical staff.
                </li>
                <li>
                  Not share your account, programme materials, or credentials with
                  non-clients.
                </li>
                <li>
                  Not reproduce, distribute, or resell our training plans, videos, or
                  content.
                </li>
              </ul>
              <p>
                We reserve the right to terminate accounts for repeated violations,
                harassment, or conduct that endangers other members.
              </p>
            </Section>

            <Section title="8. Intellectual Property">
              <p>
                All training systems, plans, content, videos, brand assets, and software
                on PURE X are owned by PURE X and its licensors. You receive a personal,
                non-transferable, revocable licence to use them solely while you are an
                active client.
              </p>
            </Section>

            <Section title="9. Platform Availability">
              <p>
                We aim for high availability but don't guarantee uninterrupted service.
                Scheduled maintenance is announced in advance. Brief outages due to
                hosting, infrastructure, or third-party issues do not entitle users to
                refunds.
              </p>
            </Section>

            <Section title="10. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, PURE X's total liability to you is
                limited to the fees paid by you in the three months preceding the event
                giving rise to the claim. We are not liable for indirect, incidental, or
                consequential damages (including injuries sustained while training
                outside of our supervised sessions).
              </p>
            </Section>

            <Section title="11. Changes to These Terms">
              <p>
                We may update these Terms periodically. Material changes will be notified
                to active clients at least 14 days before taking effect, via email or
                in-app notification.
              </p>
            </Section>

            <Section title="12. Governing Law">
              <p>
                These Terms are governed by the laws of India for Hyderabad-based clients
                and the United Kingdom for London-based clients. Disputes will be resolved
                in the courts of the applicable jurisdiction.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                Questions about these Terms?
                <br />
                <strong className="text-text">Email:</strong>{' '}
                <a
                  href="mailto:hello@purex.fit"
                  className="text-accent hover:underline"
                >
                  hello@purex.fit
                </a>
              </p>
            </Section>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 md:py-20 border-t border-border-soft">
        <div className="container-safe max-w-2xl text-center">
          <p className="text-text-muted mb-6">
            Ready to start? Book a free discovery call — we'll walk you through everything
            in person.
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
