'use client';

import { useState, type FormEvent } from 'react';
import { Bell, X, Loader2, Check, AlertCircle } from 'lucide-react';

interface Props {
  clientId: string;
  clientFirstName: string;
}

type Preset = { title: string; body: string; label: string };

const PRESETS: Preset[] = [
  {
    label: 'Workout reminder',
    title: 'Your workout is waiting',
    body: 'Ready to move? Your plan for today is queued up in the app.',
  },
  {
    label: 'Log-in nudge',
    title: 'Quick check-in',
    body: 'Log today\'s meal, sleep, or steps — takes 15 seconds.',
  },
  {
    label: 'Streak protect',
    title: 'Don\'t break the streak',
    body: 'You\'re on a roll. One log keeps it alive.',
  },
  {
    label: 'Water reminder',
    title: 'Hydration check',
    body: 'How\'s your water intake today? Log a glass.',
  },
];

/**
 * "Send nudge" button for the admin's client-detail page. Opens a
 * bottom-sheet modal with title + body inputs and 4 canned presets
 * for common cases. On submit, POSTs to /api/admin/push/send which
 * fans the message out to every device the client has registered.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_B64 to be set on Vercel — the
 * server route returns a clear error if it isn't.
 */
export function SendNudgeButton({ clientId, clientFirstName }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | null
    | { ok: true; sent: number; failed: number; message?: string }
    | { ok: false; error: string }
  >(null);

  const applyPreset = (p: Preset) => {
    setTitle(p.title);
    setBody(p.body);
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, title, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setResult({ ok: false, error: json.error || `HTTP ${res.status}` });
      } else {
        setResult(json);
      }
    } catch (err) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setSending(false);
    }
  };

  const closeAndReset = () => {
    setOpen(false);
    setTitle('');
    setBody('');
    setResult(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/30 hover:bg-accent/20 transition-colors"
      >
        <Bell size={12} />
        Send nudge
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-label="Send nudge"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeAndReset}
          />
          <div className="relative w-full sm:max-w-md bg-bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div
                  className="font-mono uppercase tracking-[0.20em] font-bold mb-1"
                  style={{ fontSize: 10, color: '#c6ff3d' }}
                >
                  Push Notification
                </div>
                <h3 className="font-display font-semibold text-lg leading-tight">
                  Nudge {clientFirstName}
                </h3>
              </div>
              <button
                onClick={closeAndReset}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {result?.ok ? (
              <div
                className="rounded-xl border p-4 mb-4"
                style={{
                  background: 'rgba(198,255,61,0.08)',
                  borderColor: 'rgba(198,255,61,0.32)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Check size={14} className="text-accent" />
                  <span className="font-mono uppercase tracking-[0.16em] font-bold text-xs text-accent">
                    Sent
                  </span>
                </div>
                <p className="text-sm">
                  {result.message ||
                    `Delivered to ${result.sent} device${result.sent === 1 ? '' : 's'}${
                      result.failed > 0
                        ? `, ${result.failed} failed`
                        : ''
                    }.`}
                </p>
              </div>
            ) : result && !result.ok ? (
              <div
                className="rounded-xl border p-4 mb-4"
                style={{
                  background: 'rgba(255,107,107,0.08)',
                  borderColor: 'rgba(255,107,107,0.32)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={14} className="text-[#ff6b6b]" />
                  <span className="font-mono uppercase tracking-[0.16em] font-bold text-xs text-[#ff6b6b]">
                    Failed
                  </span>
                </div>
                <p className="text-xs text-text-muted break-words">{result.error}</p>
              </div>
            ) : null}

            <form onSubmit={send}>
              <div className="mb-3">
                <label className="block font-mono uppercase tracking-[0.16em] font-bold text-[10px] text-text-muted mb-1.5">
                  Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="text-[11px] rounded-full px-2.5 py-1 border border-border hover:border-accent/50 hover:text-accent transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="block font-mono uppercase tracking-[0.16em] font-bold text-[10px] text-text-muted mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={64}
                  required
                  placeholder="Quick check-in"
                  className="w-full h-10 px-3 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block font-mono uppercase tracking-[0.16em] font-bold text-[10px] text-text-muted mb-1.5">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={200}
                  required
                  rows={3}
                  placeholder="How's the day going? Log something small when you can."
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border focus:border-accent focus:outline-none text-sm resize-none"
                />
                <div className="flex justify-end mt-1 text-[10px] font-mono text-text-muted">
                  {body.length}/200
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={sending || !title || !body}
                  className="flex-1 h-11 rounded-xl font-mono uppercase tracking-[0.18em] font-bold flex items-center justify-center gap-2"
                  style={{
                    fontSize: 11,
                    color: '#0a0c09',
                    background: 'linear-gradient(135deg, #d4ff5a 0%, #a8e60a 100%)',
                    opacity: sending || !title || !body ? 0.5 : 1,
                  }}
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                  {sending ? 'Sending…' : 'Send nudge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
