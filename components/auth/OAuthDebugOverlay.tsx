'use client';

import { useEffect, useState } from 'react';

/**
 * On-screen console for the OAuth deep-link flow — used when USB
 * debugging isn't available. Only mounts on Capacitor native builds
 * and only surfaces logs prefixed with `[oauth]`.
 *
 * Floats a small pill in the bottom-right corner. Tap it to expand
 * a scrolling panel with the last 20 log lines. Tap the ✕ to dismiss.
 * Reappears every time a new `[oauth]` log lands.
 *
 * Works by monkey-patching console.log / console.warn / console.error
 * on mount — the underlying implementation still runs (so USB-connected
 * DevTools still see everything), but every call is ALSO teed into
 * our in-memory ring buffer.
 */
export function OAuthDebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        setIsNative(Capacitor.isNativePlatform());
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!isNative) return;
    const orig = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };
    const push = (level: 'log' | 'warn' | 'error', args: unknown[]) => {
      const joined = args
        .map((a) =>
          typeof a === 'string' ? a : safeStringify(a)
        )
        .join(' ');
      if (!joined.includes('[oauth]')) return;
      const prefix = level === 'warn' ? '⚠ ' : level === 'error' ? '✕ ' : '· ';
      setLines((prev) => [...prev.slice(-19), prefix + joined]);
      setVisible(true);
    };
    console.log = (...args) => {
      push('log', args);
      orig.log(...args);
    };
    console.warn = (...args) => {
      push('warn', args);
      orig.warn(...args);
    };
    console.error = (...args) => {
      push('error', args);
      orig.error(...args);
    };
    return () => {
      console.log = orig.log;
      console.warn = orig.warn;
      console.error = orig.error;
    };
  }, [isNative]);

  if (!isNative || !visible) return null;

  return (
    <div
      className="fixed z-[95]"
      style={{
        right: 12,
        bottom: 'calc(env(safe-area-inset-bottom) + 96px)',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      {expanded ? (
        <div
          className="rounded-2xl border p-3"
          style={{
            width: 'min(360px, calc(100vw - 24px))',
            maxHeight: '55vh',
            overflowY: 'auto',
            background: 'rgba(6,8,5,0.94)',
            borderColor: 'rgba(198,255,61,0.35)',
            color: '#e6ffb8',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 11,
            lineHeight: 1.35,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="font-bold"
              style={{
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#c6ff3d',
              }}
            >
              OAuth debug ({lines.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLines([])}
                aria-label="Clear"
                style={{
                  fontSize: 10,
                  color: 'rgba(198,255,61,0.75)',
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="Dismiss"
                style={{
                  fontSize: 14,
                  color: 'rgba(198,255,61,0.85)',
                  paddingInline: 4,
                }}
              >
                ✕
              </button>
            </div>
          </div>
          {lines.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.45)' }}>
              Waiting for [oauth] events…
            </div>
          ) : (
            <div className="space-y-1">
              {lines.map((l, i) => (
                <div
                  key={i}
                  style={{ wordBreak: 'break-all' }}
                >
                  {l}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-2 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(198,255,61,0.20)' }}>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{
                fontSize: 10,
                color: 'rgba(198,255,61,0.85)',
              }}
            >
              Minimise
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lines.join('\n'));
                } catch {
                  // ignore
                }
              }}
              style={{
                fontSize: 10,
                color: 'rgba(198,255,61,0.85)',
              }}
            >
              Copy all
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full px-3 py-1.5 font-mono uppercase font-bold"
          style={{
            fontSize: 10,
            letterSpacing: '0.16em',
            color: '#0a0c09',
            background: '#c6ff3d',
            border: '1px solid rgba(198,255,61,0.8)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          }}
        >
          oauth log · {lines.length}
        </button>
      )}
    </div>
  );
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
