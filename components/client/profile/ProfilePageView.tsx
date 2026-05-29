'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  LogOut,
  Mail,
  Phone,
  Calendar,
  Target,
  Scale,
  Bell,
  Shield,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { signOut } from '@/lib/actions/auth';
import { bodyTypeLabel } from '@/lib/data/avatar-asset';
import type { ProfileBodySettings } from '@/lib/data/body-measurements';
import type { BodyProportions } from '@/lib/data/body-proportions';

interface Props {
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  memberSince: string;
  bodySettings: ProfileBodySettings;
  proportions: BodyProportions | null;
}

/**
 * ProfilePageView — account hub + Sign Out.
 *
 * Sections (top → bottom):
 *   1. Avatar header (initial fallback) + name + email + role pill
 *   2. Account info card (email, phone, member-since)
 *   3. Goal & body summary card (height, gender, BMI band)
 *   4. Quick links — Notifications, Privacy, Help
 *   5. Sign Out (red-tinted, prominent, isolated from accidental tap)
 *
 * The Sign Out button uses the existing signOut server action which
 * revalidates layout + redirects to `/`. Wrapped in useTransition to
 * give a "signing out…" state during the round-trip.
 */
export function ProfilePageView({
  email,
  fullName,
  phone,
  role,
  avatarUrl,
  memberSince,
  bodySettings,
  proportions,
}: Props) {
  const [signingOut, startSignOut] = useTransition();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const initials = (fullName ?? email ?? '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?';

  const displayName = fullName ?? email.split('@')[0];
  const memberSinceLabel = memberSince
    ? new Date(memberSince).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const handleSignOut = () => {
    if (signingOut) return;
    startSignOut(async () => {
      await signOut();
    });
  };

  return (
    <div className="space-y-5">
      {/* ─── Avatar + name header ─── */}
      <section
        className="rounded-3xl border p-6 text-center"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(198,255,61,0.08) 0%, transparent 60%),
            linear-gradient(180deg, #11140f 0%, #0a0c09 100%)
          `,
          borderColor: 'rgba(198,255,61,0.20)',
        }}
      >
        <div
          className="inline-flex w-20 h-20 items-center justify-center rounded-full border-2 mb-4 font-display font-black text-2xl"
          style={{
            borderColor: 'rgba(198,255,61,0.50)',
            background:
              'linear-gradient(135deg, rgba(198,255,61,0.20) 0%, rgba(255,138,77,0.10) 100%)',
            color: '#c6ff3d',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <h2
          className="font-display font-semibold tracking-tight"
          style={{ fontSize: 22, color: 'rgba(245,245,240,0.95)' }}
        >
          {displayName}
        </h2>
        <div
          className="mt-1 font-mono"
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
        >
          {email}
        </div>
        {role !== 'user' && (
          <div className="mt-3">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-mono uppercase tracking-[0.16em] font-bold"
              style={{
                fontSize: 9,
                color: '#ffd24d',
                background: 'rgba(255,210,77,0.10)',
                border: '1px solid rgba(255,210,77,0.30)',
              }}
            >
              <Shield size={10} />
              {role.replace(/_/g, ' ')}
            </span>
          </div>
        )}
      </section>

      {/* ─── Account info ─── */}
      <section
        className="rounded-3xl border overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="px-5 pt-4 pb-2">
          <h3
            className="font-mono uppercase tracking-[0.18em] font-bold"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            Account
          </h3>
        </div>
        <Row icon={Mail} label="Email" value={email} />
        {phone && <Row icon={Phone} label="Phone" value={phone} />}
        {memberSinceLabel && (
          <Row icon={Calendar} label="Member since" value={memberSinceLabel} />
        )}
      </section>

      {/* ─── Goal & body ─── */}
      <section
        className="rounded-3xl border overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="px-5 pt-4 pb-2 flex items-baseline justify-between">
          <h3
            className="font-mono uppercase tracking-[0.18em] font-bold"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            Goal & body
          </h3>
          <Link
            href="/client/health"
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: '#7dd3ff' }}
          >
            Edit in Health →
          </Link>
        </div>
        {bodySettings.heightCm && (
          <Row
            icon={Scale}
            label="Height"
            value={`${bodySettings.heightCm} cm`}
          />
        )}
        {bodySettings.gender && (
          <Row
            icon={Target}
            label="Gender"
            value={bodySettings.gender.charAt(0).toUpperCase() + bodySettings.gender.slice(1).replace(/_/g, ' ')}
          />
        )}
        {proportions?.bodyType && (
          <Row
            icon={Target}
            label="Body type"
            value={bodyTypeLabel(proportions.bodyType)}
          />
        )}
        {proportions?.bmi != null && (
          <Row
            icon={Scale}
            label="BMI"
            value={proportions.bmi.toFixed(1)}
          />
        )}
        {bodySettings.heightCm == null && proportions == null && (
          <div className="px-5 pb-4">
            <p
              className="leading-snug"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
            >
              Add your height and a body measurement in the Health tab to see
              your BMI and body-type readout here.
            </p>
          </div>
        )}
      </section>

      {/* ─── Quick links ─── */}
      <section
        className="rounded-3xl border overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="px-5 pt-4 pb-2">
          <h3
            className="font-mono uppercase tracking-[0.18em] font-bold"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            Preferences
          </h3>
        </div>
        <LinkRow
          icon={Bell}
          label="Notifications"
          sub="Push, email, daily reminders"
          href="#"
        />
        <LinkRow
          icon={Shield}
          label="Privacy & data"
          sub="What we store, how to export"
          href="#"
        />
        <LinkRow
          icon={ExternalLink}
          label="Book a specialist"
          sub="1-on-1 session with a coach"
          href="/book"
        />
      </section>

      {/* ─── Sign Out ─── */}
      <section
        className="rounded-3xl border overflow-hidden"
        style={{
          background: 'rgba(255,107,107,0.04)',
          borderColor: 'rgba(255,107,107,0.22)',
        }}
      >
        {!confirmingSignOut ? (
          <button
            type="button"
            onClick={() => setConfirmingSignOut(true)}
            className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors hover:bg-white/[0.02]"
          >
            <div>
              <div
                className="font-mono uppercase tracking-[0.18em] font-bold"
                style={{ fontSize: 10, color: '#ff6b6b' }}
              >
                Sign Out
              </div>
              <div
                className="mt-0.5"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}
              >
                End this session on this device
              </div>
            </div>
            <LogOut size={18} style={{ color: '#ff6b6b' }} />
          </button>
        ) : (
          <div className="px-5 py-4">
            <div
              className="font-mono uppercase tracking-[0.18em] font-bold mb-1"
              style={{ fontSize: 10, color: '#ff6b6b' }}
            >
              Sign out?
            </div>
            <p
              className="leading-snug mb-3"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)' }}
            >
              You&apos;ll need to sign back in with your email + password
              to access your data again.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  fontSize: 10,
                  color: '#fff',
                  background:
                    'linear-gradient(135deg, #ff6b6b 0%, #ff8a4d 100%)',
                  boxShadow: '0 0 12px rgba(255,107,107,0.28)',
                }}
              >
                <LogOut size={11} />
                {signingOut ? 'Signing out…' : 'Yes, sign out'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingSignOut(false)}
                disabled={signingOut}
                className="font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-80"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Row primitives ──────────────────────────────────────────

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div
      className="px-5 py-3 flex items-center gap-3 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.03)',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="font-mono uppercase tracking-[0.14em] font-bold"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
        >
          {label}
        </div>
        <div
          className="mt-0.5 truncate"
          style={{ fontSize: 14, color: 'rgba(245,245,240,0.92)' }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  sub,
  href,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="px-5 py-3 flex items-center gap-3 border-t transition-colors hover:bg-white/[0.02]"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(125,211,255,0.08)',
          color: '#7dd3ff',
        }}
      >
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="font-semibold"
          style={{ fontSize: 14, color: 'rgba(245,245,240,0.92)' }}
        >
          {label}
        </div>
        <div
          className="mt-0.5 truncate"
          style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}
        >
          {sub}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.40)' }} />
    </Link>
  );
}
