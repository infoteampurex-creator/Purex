'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface Props {
  invoiceNumber: string;
  /** CSS selector for the element to render as PDF. Defaults to
   *  `.invoice-paper` — the paper card inside InvoiceView. */
  targetSelector?: string;
  variant?: 'primary' | 'ghost';
}

/**
 * Direct-download PDF button using html2pdf.js. Works on Capacitor
 * WebView (where window.print() often silently fails) and on
 * desktop browsers. Downloads a file called
 * `TeamPurex-<invoice-number>.pdf`.
 *
 * Dynamically imports html2pdf.js so the ~200KB library only loads
 * on the first tap — not on every invoice-view render.
 */
export function DownloadPdfButton({
  invoiceNumber,
  targetSelector = '.invoice-paper',
  variant = 'ghost',
}: Props) {
  const [saving, setSaving] = useState(false);

  const download = async () => {
    setSaving(true);
    try {
      const target = document.querySelector<HTMLElement>(targetSelector);
      if (!target) {
        // eslint-disable-next-line no-alert
        alert('Could not find the invoice to download. Please try again.');
        return;
      }
      // Dynamic import — keeps html2pdf out of the initial bundle
      const html2pdfMod = await import('html2pdf.js');
      const html2pdf = html2pdfMod.default;

      const filename = `TeamPurex-${invoiceNumber}.pdf`;
      await html2pdf()
        .from(target)
        .set({
          margin: 0,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#fbf9f4',
            logging: false,
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
          },
        })
        .save();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[invoice] PDF download failed', err);
      // eslint-disable-next-line no-alert
      alert('Sorry — the PDF could not be generated. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const base =
    'inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium border transition-colors disabled:opacity-50';
  const style =
    variant === 'primary'
      ? 'bg-[#d4a050]/10 text-[#d4a050] border-[#d4a050]/30 hover:bg-[#d4a050]/20'
      : 'border-border text-text-muted hover:border-accent hover:text-accent';

  return (
    <button
      type="button"
      onClick={download}
      disabled={saving}
      className={`${base} ${style}`}
    >
      {saving ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      {saving ? 'Preparing…' : 'Download PDF'}
    </button>
  );
}
