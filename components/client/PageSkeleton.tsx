/**
 * Generic client-page skeleton — used by every /client/* route's
 * loading.tsx so cold navigation shows a shape hint instead of a
 * blank white flash. Whoop / Fitbit / Google Fit all do this; the
 * perceived speed difference is huge on 4G.
 *
 * variant:
 *   dashboard  — hero card + rings + secondary cards
 *   detail     — big top card + tabs + content strip
 *   list       — hero + a run of card rows
 */
export function PageSkeleton({
  variant = 'detail',
}: {
  variant?: 'dashboard' | 'detail' | 'list';
}) {
  return (
    <div className="animate-pulse space-y-5 md:space-y-6">
      {/* Eyebrow + h1 */}
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
        <div className="h-9 w-2/3 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-3/4 max-w-md rounded-full bg-white/[0.04]" />
      </div>

      {variant === 'dashboard' && (
        <>
          {/* Hero score card */}
          <div className="h-56 rounded-3xl bg-white/[0.05]" />
          {/* Activity rings row */}
          <div className="h-40 rounded-2xl bg-white/[0.04]" />
          {/* Twin teaser */}
          <div className="h-96 rounded-3xl bg-white/[0.05]" />
          {/* Plan card */}
          <div className="h-44 rounded-2xl bg-white/[0.04]" />
        </>
      )}

      {variant === 'detail' && (
        <>
          {/* Big hero card */}
          <div className="h-40 rounded-3xl bg-white/[0.05]" />
          {/* Two-col mini grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-2xl bg-white/[0.04]" />
            <div className="h-24 rounded-2xl bg-white/[0.04]" />
          </div>
          {/* Content strip */}
          <div className="h-72 rounded-2xl bg-white/[0.04]" />
          {/* Secondary card */}
          <div className="h-56 rounded-2xl bg-white/[0.04]" />
        </>
      )}

      {variant === 'list' && (
        <>
          <div className="h-32 rounded-3xl bg-white/[0.05]" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.04]" />
          ))}
        </>
      )}
    </div>
  );
}
