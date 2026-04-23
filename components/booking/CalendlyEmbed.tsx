'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';

interface CalendlyEmbedProps {
  /** Full Calendly URL, e.g. https://calendly.com/siva-reddy/discovery-call */
  url: string;
  /** Prefill form data */
  prefill?: {
    name?: string;
    email?: string;
  };
  /** UTM tracking */
  utm?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  /** Custom answers — for passing pre-consult form data */
  customAnswers?: Record<string, string>;
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: Record<string, unknown>;
        utm?: Record<string, unknown>;
      }) => void;
    };
  }
}

/**
 * Inline Calendly embed with loading state and script loading.
 * Falls back to a "book on Calendly" link button if script fails to load.
 */
export function CalendlyEmbed({ url, prefill, utm, customAnswers }: CalendlyEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Inject Calendly script if not already present
    const existing = document.getElementById('calendly-widget-script');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'calendly-widget-script';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => initWidget();
      script.onerror = () => setFailed(true);
      document.body.appendChild(script);

      // Stylesheet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    } else if (window.Calendly) {
      initWidget();
    }

    function initWidget() {
      if (!containerRef.current || !window.Calendly) return;

      // Clear container
      containerRef.current.innerHTML = '';

      const prefillData: Record<string, unknown> = {};
      if (prefill?.name) prefillData.name = prefill.name;
      if (prefill?.email) prefillData.email = prefill.email;
      if (customAnswers) prefillData.customAnswers = customAnswers;

      window.Calendly.initInlineWidget({
        url,
        parentElement: containerRef.current,
        prefill: Object.keys(prefillData).length ? prefillData : undefined,
        utm,
      });

      setLoaded(true);
    }

    // Timeout after 10s — if no load, show fallback
    const timeout = setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 10000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (failed) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-6 md:p-8 text-center">
        <p className="text-sm text-text-muted mb-4">
          Calendar isn&rsquo;t loading. You can book directly on Calendly:
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-accent text-bg font-semibold text-sm px-5 h-11 rounded-full hover:bg-accent-hover transition-colors"
        >
          Open Calendly
          <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-bg-card">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-card z-10">
          <div className="text-center">
            <Loader2 size={24} className="text-accent animate-spin mx-auto mb-3" />
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
              Loading calendar...
            </div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="calendly-inline-widget"
        style={{ minWidth: '320px', height: '700px' }}
      />
    </div>
  );
}
