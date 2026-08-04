'use client';

import { Printer } from 'lucide-react';

/**
 * Client-side print button — triggers the browser's native
 * Print → Save as PDF dialog. Simplest, highest-quality PDF
 * export path for both admin and client surfaces.
 */
export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs text-text-muted hover:border-accent hover:text-accent transition-colors"
    >
      <Printer size={12} />
      Save as PDF
    </button>
  );
}
