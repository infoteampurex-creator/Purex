'use client';

import { useState } from 'react';
import { Copy, CheckCircle2, Link as LinkIcon } from 'lucide-react';

interface Props {
  enquiryId: string;
  email: string;
}

/**
 * Sticky button on /admin/applications/[id] that copies the Form B
 * application URL (https://.../application?ref=<id>&email=<email>)
 * pre-filled so the team can WhatsApp the link straight to a
 * qualified lead.
 */
export function CopyApplicationLink({ enquiryId, email }: Props) {
  const [copied, setCopied] = useState(false);

  const siteUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : 'https://www.teampurex.com';
  const url = `${siteUrl}/application?ref=${enquiryId}&email=${encodeURIComponent(email)}`;

  const onCopy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      },
      () => {}
    );
  };

  return (
    <div className="rounded-2xl bg-bg-card border border-border p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3 flex items-center gap-1.5">
        <LinkIcon size={11} />
        Share application form
      </div>
      <p
        className="text-text-muted leading-relaxed mb-3"
        style={{ fontSize: 12.5 }}
      >
        Sends them to the detailed 11-section application, pre-filled with
        their email and linked back to this enquiry.
      </p>
      <button
        type="button"
        onClick={onCopy}
        className={
          'w-full inline-flex items-center justify-center gap-2 h-11 rounded-full text-sm font-semibold transition-colors ' +
          (copied
            ? 'bg-accent text-bg'
            : 'border border-accent/40 bg-accent/5 text-accent hover:bg-accent/10')
        }
      >
        {copied ? (
          <>
            <CheckCircle2 size={14} strokeWidth={2.5} />
            Link copied — paste into WhatsApp
          </>
        ) : (
          <>
            <Copy size={13} />
            Copy application link
          </>
        )}
      </button>
    </div>
  );
}
