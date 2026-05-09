'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Phone, X } from 'lucide-react';
import { type SpecialistClient } from '@/lib/data/admin-specialists';

interface ViewSpecialistClientsModalProps {
  open: boolean;
  onClose: () => void;
  specialistName: string;
  clients: SpecialistClient[];
}

export function ViewSpecialistClientsModal({
  open,
  onClose,
  specialistName,
  clients,
}: ViewSpecialistClientsModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-bg-card border-t md:border md:rounded-2xl border-border shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-bg/90 border border-border-soft flex items-center justify-center hover:border-accent/40 transition-all"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            <div className="px-6 md:px-8 pt-7 pb-5 border-b border-border-soft">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1.5">
                Assigned clients
              </div>
              <h2 className="font-display font-semibold text-2xl tracking-tight">
                {specialistName}
              </h2>
              <p className="text-sm text-text-muted mt-1.5">
                {clients.length === 0
                  ? 'No clients are currently assigned to this specialist.'
                  : `${clients.length} client${clients.length === 1 ? '' : 's'} on plans assigned to this specialist.`}
              </p>
            </div>

            <div className="px-6 md:px-8 py-5 max-h-[60vh] overflow-y-auto">
              {clients.length === 0 ? (
                <div className="text-center py-8 text-sm text-text-muted">
                  Assign this specialist as the coach on a client&apos;s plan to see them here.
                </div>
              ) : (
                <div className="space-y-2">
                  {clients.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/clients/${c.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border-soft bg-bg-elevated/40 px-3 py-2.5 hover:border-accent/40 hover:bg-bg-elevated transition-colors"
                      onClick={onClose}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {c.fullName}
                          </span>
                          <StatusPill status={c.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Mail size={10} />
                            {c.email}
                          </span>
                          {c.phone && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Phone size={10} />
                              {c.phone}
                            </span>
                          )}
                        </div>
                        {c.planName && (
                          <div className="text-[11px] text-text-muted mt-0.5">
                            Plan: {c.planName}
                          </div>
                        )}
                      </div>
                      <ArrowRight size={14} className="text-text-muted flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    active: { bg: 'rgba(198, 255, 61, 0.12)', fg: '#c6ff3d' },
    onboarding: { bg: 'rgba(255, 184, 77, 0.12)', fg: '#ffb84d' },
    paused: { bg: 'rgba(125, 211, 255, 0.12)', fg: '#7dd3ff' },
    completed: { bg: 'rgba(200, 200, 200, 0.08)', fg: '#a0a69a' },
    cancelled: { bg: 'rgba(255, 107, 107, 0.12)', fg: '#ff6b6b' },
  };
  const s = map[status] ?? map.active;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-[0.12em] font-bold"
      style={{ background: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}
