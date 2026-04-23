'use client';

import { motion } from 'framer-motion';
import { Video, MapPin, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { MOCK_UPCOMING_BOOKING } from '@/lib/data/client-mock';

export function UpcomingBookingCard() {
  const booking = MOCK_UPCOMING_BOOKING;
  const date = new Date(booking.date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
            Next Session
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight">Upcoming booking</h3>
        </div>
        <Link href="/client/bookings" className="text-xs text-text-muted hover:text-accent font-medium flex items-center gap-1 transition-colors">
          All bookings
          <ChevronRight size={14} />
        </Link>
      </div>

      <Link
        href="/client/bookings"
        className="block relative overflow-hidden rounded-2xl p-5 group"
        style={{
          background: `
            radial-gradient(ellipse at 80% 20%, rgba(125, 211, 255, 0.14), transparent 55%),
            linear-gradient(135deg, #1a2030 0%, #141824 50%, #101420 100%)
          `,
          border: '1px solid rgba(125, 211, 255, 0.25)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-[#7dd3ff]"
            style={{ background: 'rgba(125, 211, 255, 0.15)' }}
          >
            <Calendar size={18} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7dd3ff] font-bold">
                In {booking.daysAway} days
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.14em] font-bold text-accent">
                {booking.status === 'confirmed' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Confirmed
                  </>
                ) : (
                  booking.status
                )}
              </span>
            </div>
            <h4 className="font-display font-semibold text-lg tracking-tight leading-tight">
              {booking.specialistName}
            </h4>
            <div className="text-xs text-text-muted mt-0.5">{booking.specialistRole}</div>

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs text-text font-medium">
                <Calendar size={12} />
                {date} · {booking.time}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted font-medium">
                {booking.format === 'online' ? (
                  <>
                    <Video size={12} />
                    Online
                  </>
                ) : (
                  <>
                    <MapPin size={12} />
                    In-person
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 w-9 h-9 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-[#7dd3ff] group-hover:text-bg group-hover:border-[#7dd3ff] transition-all">
            <ChevronRight size={16} />
          </div>
        </div>
      </Link>
    </motion.section>
  );
}
