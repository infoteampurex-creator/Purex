/**
 * Static deadlift silhouette at lockout position.
 *
 * Single illustration — NO animation, NO transforms, NO hover effects.
 * Goal: a clean, premium static graphic that says "strength" without
 * trying to be a moving puppet.
 *
 * Pose: figure standing tall at deadlift lockout (top of the lift).
 * Bar held at hip height with both hands. Shoulders pulled back,
 * chest up, glutes engaged. Front-facing silhouette for clarity.
 */

export function DeadliftSilhouette() {
  return (
    <svg
      viewBox="0 0 280 360"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        {/* Floor pool of accent light */}
        <radialGradient id="floor-pool" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#c6ff3d" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#c6ff3d" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#c6ff3d" stopOpacity="0" />
        </radialGradient>

        {/* Body silhouette gradient */}
        <linearGradient id="body-grad-static" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#262b1f" />
          <stop offset="100%" stopColor="#0f1410" />
        </linearGradient>

        {/* Soft glow on the bar */}
        <filter id="bar-glow-static" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ─── Floor light pool ─── */}
      <ellipse cx="140" cy="320" rx="100" ry="14" fill="url(#floor-pool)" />

      {/* ─── Floor line ─── */}
      <line x1="40" y1="320" x2="240" y2="320" stroke="#1a1f15" strokeWidth="1.5" />
      <line x1="40" y1="320" x2="240" y2="320" stroke="#c6ff3d" strokeWidth="0.5" strokeOpacity="0.25" />

      {/* ════════════════════════════════════════════════
           LIFTER AT LOCKOUT — single pose, no animation
      ════════════════════════════════════════════════ */}

      {/* Head */}
      <circle cx="140" cy="78" r="14" fill="url(#body-grad-static)" stroke="#2f3527" strokeWidth="1" />

      {/* Neck */}
      <rect x="135" y="90" width="10" height="8" fill="url(#body-grad-static)" />

      {/* Shoulders + traps */}
      <path
        d="M 110 100 Q 140 96 170 100 L 168 110 L 112 110 Z"
        fill="url(#body-grad-static)"
        stroke="#2f3527"
        strokeWidth="1"
      />

      {/* Torso (V-tapered) */}
      <path
        d="M 112 110 L 168 110 L 162 200 L 118 200 Z"
        fill="url(#body-grad-static)"
        stroke="#2f3527"
        strokeWidth="1"
      />

      {/* Subtle abdominal centerline */}
      <line x1="140" y1="118" x2="140" y2="195" stroke="#0a0c09" strokeWidth="1" opacity="0.5" />

      {/* Arms — held straight down, gripping bar */}
      {/* Left arm */}
      <path
        d="M 110 108 L 104 200 L 100 220 L 102 230"
        fill="none"
        stroke="url(#body-grad-static)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Right arm */}
      <path
        d="M 170 108 L 176 200 L 180 220 L 178 230"
        fill="none"
        stroke="url(#body-grad-static)"
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Hands gripping bar */}
      <ellipse cx="102" cy="232" rx="7" ry="5" fill="#1a1f15" />
      <ellipse cx="178" cy="232" rx="7" ry="5" fill="#1a1f15" />

      {/* Hip block */}
      <ellipse cx="140" cy="208" rx="26" ry="11" fill="url(#body-grad-static)" />

      {/* Legs — straight, stacked */}
      {/* Left thigh */}
      <line x1="128" y1="215" x2="124" y2="278" stroke="url(#body-grad-static)" strokeWidth="18" strokeLinecap="round" />
      {/* Right thigh */}
      <line x1="152" y1="215" x2="156" y2="278" stroke="url(#body-grad-static)" strokeWidth="18" strokeLinecap="round" />

      {/* Knee markers (subtle) */}
      <circle cx="124" cy="278" r="2.5" fill="#2f3527" />
      <circle cx="156" cy="278" r="2.5" fill="#2f3527" />

      {/* Left shin */}
      <line x1="124" y1="278" x2="122" y2="318" stroke="url(#body-grad-static)" strokeWidth="14" strokeLinecap="round" />
      {/* Right shin */}
      <line x1="156" y1="278" x2="158" y2="318" stroke="url(#body-grad-static)" strokeWidth="14" strokeLinecap="round" />

      {/* Feet */}
      <ellipse cx="120" cy="320" rx="11" ry="3" fill="#1a1f15" />
      <ellipse cx="160" cy="320" rx="11" ry="3" fill="#1a1f15" />

      {/* ════════════════════════════════════════════════
           BARBELL — at hip height, simple and elegant
      ════════════════════════════════════════════════ */}

      {/* Bar */}
      <line
        x1="50"
        y1="232"
        x2="230"
        y2="232"
        stroke="#c6ff3d"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#bar-glow-static)"
        opacity="0.9"
      />

      {/* Left plate */}
      <circle cx="42" cy="232" r="22" fill="#0a0c09" stroke="#c6ff3d" strokeWidth="1.5" opacity="0.85" />
      <circle cx="42" cy="232" r="14" fill="#0a0c09" stroke="#c6ff3d" strokeWidth="1" opacity="0.55" />
      <circle cx="42" cy="232" r="3" fill="#c6ff3d" />

      {/* Right plate */}
      <circle cx="238" cy="232" r="22" fill="#0a0c09" stroke="#c6ff3d" strokeWidth="1.5" opacity="0.85" />
      <circle cx="238" cy="232" r="14" fill="#0a0c09" stroke="#c6ff3d" strokeWidth="1" opacity="0.55" />
      <circle cx="238" cy="232" r="3" fill="#c6ff3d" />
    </svg>
  );
}
