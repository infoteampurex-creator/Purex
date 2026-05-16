'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Award, Download, ExternalLink } from 'lucide-react';
import { type AdminParticipant } from '@/lib/data/mother-strong-types';

interface Props {
  participants: AdminParticipant[];
}

/**
 * Gratitude-card admin UI.
 *
 * Each row offers a "Preview" link (opens the PNG in a new tab) and
 * a "Download" link (sets the filename via the `download` attribute).
 * The PNG is generated on-demand by /api/mother-strong/cards/[id].
 */
export function CardsGenerator({ participants }: Props) {
  const [search, setSearch] = useState('');
  const filtered = participants.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.displayId.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  });

  if (participants.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card border border-border p-10 text-center text-text-muted">
        <Award size={20} className="mx-auto mb-3 opacity-50" />
        Cards become available once participants register and you have step
        data to celebrate.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent/5 border border-accent/20 p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
          End-of-program gratitude
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          Generate a personalised PNG for each mother: her name, photo,
          total steps walked, days she hit the goal, consistency %, and
          the PURE X mark. Download it and share via WhatsApp.
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, PX-id, or city…"
        className="w-full max-w-md h-10 px-4 rounded-full bg-bg-elevated border border-border text-sm focus:border-accent focus:outline-none"
      />

      <div className="rounded-2xl bg-bg-card border border-border overflow-hidden">
        <table className="w-full">
          <thead
            className="border-b border-border"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <tr>
              {['ID', 'Name', 'City', 'Status', 'Card'].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cardUrl = `/api/mother-strong/cards/${p.id}`;
              const filename = `purex-mother-strong-${p.displayId.toLowerCase()}.png`;
              return (
                <tr
                  key={p.id}
                  className="border-b border-border-soft last:border-0 hover:bg-bg-elevated/50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-xs font-bold text-accent">
                    {p.displayId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.photoUrl ? (
                        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-bg-elevated flex-shrink-0">
                          <Image
                            src={p.photoUrl}
                            alt=""
                            fill
                            sizes="28px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center font-mono text-[10px] font-bold text-text-muted flex-shrink-0">
                          {p.fullName
                            .split(/\s+/)
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="text-sm font-medium truncate">
                        {p.fullName}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">{p.city}</td>
                  <td className="py-3 px-4 text-xs font-mono uppercase tracking-[0.12em] text-text-muted">
                    {p.status}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={cardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-border text-xs font-medium hover:border-accent hover:text-accent transition-colors"
                      >
                        <ExternalLink size={11} />
                        Preview
                      </a>
                      <a
                        href={cardUrl}
                        download={filename}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-accent text-bg text-xs font-semibold hover:bg-accent-hover transition-colors"
                      >
                        <Download size={11} />
                        Download
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
