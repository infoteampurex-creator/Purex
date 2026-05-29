'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, ChevronDown, X } from 'lucide-react';
import {
  ALERT_PALETTE,
  type SmartAlert,
} from '@/lib/data/smart-alerts';

interface Props {
  alerts: SmartAlert[];
  /** Maximum alerts shown collapsed (defaults to 2). */
  collapsedLimit?: number;
}

/**
 * SmartAlertsCard — in-app alert stack on the dashboard.
 *
 * Renders top N alerts collapsed (severity-sorted); a "Show all (X)"
 * affordance expands the rest. Each alert is dismissable for THIS
 * page-view only — alerts recompute on every dashboard load from
 * current state, so dismissing has no persistence (and is OK — the
 * trigger fades when the input situation changes).
 */
export function SmartAlertsCard({ alerts, collapsedLimit = 2 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.key));
  if (visible.length === 0) return null;

  const collapsed = visible.slice(0, collapsedLimit);
  const overflow = visible.slice(collapsedLimit);

  const showOverflow = expanded && overflow.length > 0;

  // Lead-alert severity drives the card's outer color
  const leadColor = ALERT_PALETTE[visible[0].severity].color;

  return (
    <section
      className="rounded-3xl border overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, ${leadColor}14 0%, transparent 60%),
          linear-gradient(180deg, #100f0d 0%, #0a0c09 100%)
        `,
        borderColor: `${leadColor}33`,
      }}
    >
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: leadColor }}
        >
          <Bell size={11} />
          Smart Alerts
        </div>
        <span
          className="font-mono uppercase tracking-[0.16em] font-bold"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
        >
          {visible.length} active
        </span>
      </div>

      <div className="px-5 pb-3 space-y-2">
        {collapsed.map((a) => (
          <AlertRow
            key={a.key}
            alert={a}
            onDismiss={() =>
              setDismissed((prev) => {
                const next = new Set(prev);
                next.add(a.key);
                return next;
              })
            }
          />
        ))}

        <AnimatePresence initial={false}>
          {showOverflow &&
            overflow.map((a) => (
              <motion.div
                key={a.key}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertRow
                  alert={a}
                  onDismiss={() =>
                    setDismissed((prev) => {
                      const next = new Set(prev);
                      next.add(a.key);
                      return next;
                    })
                  }
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {overflow.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="relative w-full flex items-center justify-between px-5 py-3 border-t font-mono uppercase tracking-[0.20em] font-bold transition-colors hover:bg-white/[0.02]"
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.55)',
            borderColor: 'rgba(255,255,255,0.05)',
          }}
        >
          {expanded ? 'Hide extras' : `Show ${overflow.length} more`}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDown size={14} />
          </motion.span>
        </button>
      )}
    </section>
  );
}

// ─── Sub-component ──────────────────────────────────────────

function AlertRow({
  alert,
  onDismiss,
}: {
  alert: SmartAlert;
  onDismiss: () => void;
}) {
  const palette = ALERT_PALETTE[alert.severity];
  return (
    <div
      className="rounded-xl border px-3 py-3 flex items-start gap-3"
      style={{
        background: palette.bg,
        borderColor: palette.border,
      }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{
          background: `${palette.color}1A`,
          color: palette.color,
        }}
      >
        <AlertTriangle size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="font-display font-semibold leading-tight"
          style={{ fontSize: 14, color: 'rgba(245,245,240,0.95)' }}
        >
          {alert.title}
        </div>
        <p
          className="leading-snug mt-1"
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)' }}
        >
          {alert.body}
        </p>
        {alert.action && (
          <div
            className="inline-block font-mono uppercase tracking-[0.14em] font-bold mt-2"
            style={{ fontSize: 9, color: palette.color }}
          >
            → {alert.action}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="w-6 h-6 rounded-md text-text-muted hover:text-text transition-colors flex items-center justify-center flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}
