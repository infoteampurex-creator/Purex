'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';

// Dynamically import the 3D viewer so Three.js (~400KB) is only loaded
// on pages that actually need it. Server rendering is disabled since
// Three.js relies on the browser.
const TwinViewer3D = dynamic(
  () => import('./TwinViewer3D').then((m) => ({ default: m.TwinViewer3D })),
  {
    ssr: false,
    loading: () => <LoadingState />,
  }
);

interface TwinViewer3DLazyProps {
  avatarUrl?: string;
  variant?: 'current' | 'projected';
  height?: number;
  interactive?: boolean;
}

export function TwinViewer3DLazy(props: TwinViewer3DLazyProps) {
  return (
    <ThreeErrorBoundary height={props.height || 480}>
      <TwinViewer3D {...props} />
    </ThreeErrorBoundary>
  );
}

// ─── Error boundary — catches Three.js / reconciler crashes ──────────
interface EBState {
  hasError: boolean;
  message?: string;
}

class ThreeErrorBoundary extends Component<
  { children: ReactNode; height: number },
  EBState
> {
  constructor(props: { children: ReactNode; height: number }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[TwinViewer3D] render failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState height={this.props.height} message={this.state.message} />;
    }
    return this.props.children;
  }
}

function ErrorState({
  height,
  message,
}: {
  height: number;
  message?: string;
}) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center"
      style={{
        height,
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(255, 107, 91, 0.06) 0%, #0a0c09 70%)',
      }}
    >
      <div className="text-center max-w-[80%]">
        <AlertTriangle size={28} className="mx-auto mb-3 text-amber" strokeWidth={2} />
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber font-bold mb-2">
          3D Viewer Unavailable
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          The 3D engine couldn't initialise. Your data and progress are unaffected.
        </p>
        {message && (
          <p className="text-[10px] text-text-dim leading-relaxed mt-2 font-mono">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center"
      style={{
        height: 480,
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(198, 255, 61, 0.06) 0%, #0a0c09 70%)',
      }}
    >
      <div className="text-center">
        <div className="relative mx-auto mb-4 w-12 h-12">
          <Sparkles
            size={32}
            className="absolute inset-0 m-auto text-accent animate-pulse"
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-accent/30 animate-spin"
            style={{ borderTopColor: '#c6ff3d' }}
          />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1">
          Loading Twin
        </div>
        <div className="font-mono text-[10px] text-text-muted">
          Rendering your digital self…
        </div>
      </div>
    </div>
  );
}
