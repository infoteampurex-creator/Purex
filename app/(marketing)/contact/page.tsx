'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Mail, Phone, MapPin, Send, ArrowRight, Check } from 'lucide-react';
import { BRAND, whatsappLink } from '@/lib/constants';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // TODO: wire to email service (Resend) or form handler
    // For now, opens WhatsApp with pre-filled message
    const text = `Hi PURE X team,

Name: ${name}
Email: ${email}
Subject: ${subject}

${message}`;

    await new Promise((r) => setTimeout(r, 600));

    // Open WhatsApp with pre-filled text
    window.open(whatsappLink(text), '_blank');

    setSubmitting(false);
    setSent(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
      setSent(false);
    }, 3500);
  };

  return (
    <main className="relative bg-bg text-text">
      {/* Hero */}
      <section className="relative pt-28 md:pt-36 pb-8 md:pb-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
          }}
        />
        <div className="container-safe relative text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <span className="w-4 h-px bg-accent" />
            Get In Touch
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-5 max-w-2xl mx-auto">
            We <span className="text-accent">reply fast</span>.
          </h1>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            Questions about programmes, medical eligibility, logistics, or just want to
            chat? Pick your channel — we're on all of them.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="relative py-8 md:py-12">
        <div className="container-safe">
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            <ChannelCard
              icon={<MessageCircle size={20} />}
              label="WhatsApp"
              value="Fastest reply · 24h"
              href={whatsappLink()}
              external
              accent="#25D366"
            />
            <ChannelCard
              icon={<Mail size={20} />}
              label="Email"
              value={BRAND.email}
              href={`mailto:${BRAND.email}`}
              external
              accent="#c6ff3d"
            />
            <ChannelCard
              icon={<Phone size={20} />}
              label="Book a Call"
              value="20-min discovery call"
              href="/book"
              accent="#7dd3ff"
            />
          </div>
        </div>
      </section>

      {/* Form + Locations */}
      <section className="relative py-12 md:py-20">
        <div className="container-safe">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-start">
            {/* Form */}
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
                <span className="w-3 h-px bg-accent" />
                Send us a message
              </div>
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight mb-6">
                Drop us a line.
              </h2>
              <p className="text-text-muted mb-8 leading-relaxed">
                Fill in the form below — we'll route your message to the right team member
                and reply within 24 hours (usually much sooner).
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Your name" required>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-11 px-3 rounded-lg bg-bg-card border border-border text-sm focus:border-accent/60 focus:outline-none transition-colors"
                    />
                  </FormField>
                  <FormField label="Email" required>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 px-3 rounded-lg bg-bg-card border border-border text-sm focus:border-accent/60 focus:outline-none transition-colors"
                    />
                  </FormField>
                </div>

                <FormField label="I'm writing about">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-bg-card border border-border text-sm focus:border-accent/60 focus:outline-none transition-colors"
                  >
                    <option value="general">General enquiry</option>
                    <option value="programmes">Programme questions</option>
                    <option value="medical">Medical eligibility</option>
                    <option value="partnerships">Partnerships / press</option>
                    <option value="technical">Technical support</option>
                  </select>
                </FormField>

                <FormField label="Message" required>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Tell us what's on your mind…"
                    className="w-full px-3 py-2.5 rounded-lg bg-bg-card border border-border text-sm focus:border-accent/60 focus:outline-none transition-colors resize-none leading-relaxed"
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={submitting || sent}
                  className={`inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm transition-all ${
                    sent
                      ? 'bg-success text-bg'
                      : 'bg-accent text-bg hover:bg-accent-hover'
                  } ${(submitting || sent) && 'cursor-not-allowed'}`}
                >
                  {sent ? (
                    <>
                      <Check size={14} strokeWidth={3} />
                      Message sent
                    </>
                  ) : submitting ? (
                    <>
                      <Spinner />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send via WhatsApp
                    </>
                  )}
                </button>
                <p className="text-[11px] text-text-dim font-mono">
                  Submitting opens WhatsApp with your message pre-filled. You send it from
                  there — keeps everything on a channel you control.
                </p>
              </form>
            </div>

            {/* Locations */}
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
                <span className="w-3 h-px bg-accent" />
                Our Locations
              </div>
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight mb-6">
                Two cities. One system.
              </h2>

              <LocationCard
                flag="🇮🇳"
                city="India"
                country="India"
                description="Primary training hub. In-person sessions, medical screening, physiotherapy, and programme delivery."
                focus="Training · Medical · Rehab"
              />
              <LocationCard
                flag="🇬🇧"
                city="UK"
                country="United Kingdom"
                description="Performance coaching, mental health support, operations, and global client coordination."
                focus="Performance · Mental · Operations"
              />

              <div className="mt-6 rounded-xl bg-bg-card border border-border p-4">
                <div className="flex items-start gap-2">
                  <MapPin size={15} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
                      Remote clients welcome
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Pure Core delivers the full PURE X system remotely. Clients
                      worldwide work with us through app tracking, weekly calls, and
                      remote specialist access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 md:py-20 border-t border-border-soft">
        <div className="container-safe">
          <div className="rounded-3xl bg-bg-card border border-accent/30 p-8 md:p-14 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 100%, rgba(198, 255, 61, 0.12) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h3 className="font-display font-semibold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-4 max-w-xl mx-auto">
                Prefer to talk?
              </h3>
              <p className="text-text-muted mb-8 max-w-md mx-auto">
                Book a 20-minute discovery call and speak to the team directly. No sales
                pressure — just honest advice.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ChannelCard({
  icon,
  label,
  value,
  href,
  external = false,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
  accent: string;
}) {
  const isExternal = external || href.startsWith('http') || href.startsWith('mailto');
  const Comp = isExternal ? 'a' : Link;
  const props = isExternal
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href };

  return (
    <Comp
      {...(props as any)}
      className="group relative rounded-2xl bg-bg-card border border-border p-5 md:p-6 hover:border-accent/50 transition-all duration-500 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}24 0%, transparent 70%)` }}
      />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: `${accent}14`,
          border: `1px solid ${accent}40`,
          color: accent,
        }}
      >
        {icon}
      </div>
      <div
        className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-1.5"
        style={{ color: accent }}
      >
        {label}
      </div>
      <div className="font-display font-medium text-base md:text-lg text-text">
        {value}
      </div>
    </Comp>
  );
}

function LocationCard({
  flag,
  city,
  country,
  description,
  focus,
}: {
  flag: string;
  city: string;
  country: string;
  description: string;
  focus: string;
}) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl leading-none">{flag}</span>
        <div>
          <div className="font-display font-semibold text-lg leading-tight text-text">
            {city}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mt-0.5">
            {country}
          </div>
        </div>
      </div>
      <p className="text-sm text-text-muted leading-relaxed mb-3">{description}</p>
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 font-mono text-[9px] uppercase tracking-[0.16em] text-accent font-bold">
        {focus}
      </div>
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted font-bold mb-1.5">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="45 20"
        opacity="0.6"
      />
    </svg>
  );
}
