'use client';

/**
 * Centerpiece deadlift animation.
 *
 * Side-profile silhouette of a lifter performing a continuous deadlift loop.
 * Pure SVG + CSS keyframes — no JS animation runtime. Loops indefinitely.
 *
 * Loop structure (6 seconds total):
 *   0.0–1.0s  Hold at floor (setup, breathing)
 *   1.0–3.0s  Pull phase — lifter rises, bar travels from floor to hip
 *   3.0–4.0s  Lockout — full standing, bar at hip
 *   4.0–6.0s  Controlled descent — bar back to floor
 *
 * The lifter is composed of articulated body segments (head, torso, hip,
 * thigh, shin, arm, forearm) so the angle changes during the lift look
 * biomechanically correct — not just one silhouette transforming.
 *
 * Bar/plate behaviour:
 *   - Plates rotate microscopically (3°) during the pull, communicating mass
 *   - Bar position is locked to the lifter's hand height throughout the loop
 *   - A subtle accent glow on the bar intensifies during the pull phase
 */

interface DeadliftAnimationProps {
  /** Reserved for future variant work — currently unused. */
  activated?: boolean;
}

export function DeadliftAnimation({ activated: _activated }: DeadliftAnimationProps = {}) {
  return (
    <div className="relative w-full max-w-md aspect-square mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Deadlift animation"
      >
        {/* ─── Definitions ─── */}
        <defs>
          {/* Soft accent glow used on the bar */}
          <filter id="bar-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Stronger glow used on plates during pull */}
          <filter id="plate-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle floor light — radial fade */}
          <radialGradient id="floor-light" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#c6ff3d" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#c6ff3d" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#c6ff3d" stopOpacity="0" />
          </radialGradient>

          {/* Body silhouette gradient — slightly lit from above */}
          <linearGradient id="body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f2418" />
            <stop offset="100%" stopColor="#0f1410" />
          </linearGradient>
        </defs>

        {/* ─── Floor light pool ─── */}
        <ellipse
          cx="200"
          cy="320"
          rx="140"
          ry="20"
          fill="url(#floor-light)"
        />

        {/* ─── Floor line ─── */}
        <line
          x1="60"
          y1="320"
          x2="340"
          y2="320"
          stroke="#1a1f15"
          strokeWidth="1.5"
        />
        <line
          x1="60"
          y1="320"
          x2="340"
          y2="320"
          stroke="#c6ff3d"
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />

        {/* ════════════════════════════════════════════════
             LIFTER (composite group, animated as one unit)
        ════════════════════════════════════════════════ */}
        <g className="lifter-group">
          {/* The lifter is animated entirely via CSS transforms applied
               to nested <g> elements. Each body segment rotates around its
               own pivot for a kinematically correct lift cycle.            */}

          {/* Hip pivot (whole upper body rotates around hip) */}
          <g className="hip-rotation">
            {/* Torso (slightly forward-leaning at setup, vertical at lockout) */}
            <g className="torso-rotation">
              {/* Head */}
              <circle
                cx="200"
                cy="148"
                r="14"
                fill="url(#body-grad)"
                stroke="#2a3024"
                strokeWidth="1"
              />
              {/* Neck */}
              <rect
                x="195"
                y="160"
                width="10"
                height="8"
                fill="url(#body-grad)"
              />
              {/* Torso (trapezoidal, broad shoulders narrowing to waist) */}
              <path
                d="M 178 168 L 222 168 L 218 232 L 182 232 Z"
                fill="url(#body-grad)"
                stroke="#2a3024"
                strokeWidth="1"
              />

              {/* Right arm hanging straight down — connects to bar */}
              <line
                x1="183"
                y1="172"
                x2="183"
                y2="282"
                stroke="#1f2418"
                strokeWidth="9"
                strokeLinecap="round"
              />
              {/* Left arm — slightly behind, mirrored */}
              <line
                x1="217"
                y1="172"
                x2="217"
                y2="282"
                stroke="#1a1d14"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.7"
              />
            </g>

            {/* Hip block (anchor point) */}
            <ellipse
              cx="200"
              cy="240"
              rx="22"
              ry="10"
              fill="url(#body-grad)"
            />
          </g>

          {/* Thigh + shin (legs animate with knee flexion) */}
          <g className="leg-rotation">
            {/* Thigh */}
            <line
              x1="200"
              y1="240"
              x2="200"
              y2="285"
              stroke="#1f2418"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Knee marker (subtle) */}
            <circle cx="200" cy="285" r="3" fill="#2a3024" />
            {/* Shin */}
            <line
              x1="200"
              y1="285"
              x2="200"
              y2="320"
              stroke="#1f2418"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Foot */}
            <ellipse
              cx="204"
              cy="320"
              rx="14"
              ry="3"
              fill="#1f2418"
            />
          </g>

          {/* ════════════════════════════════════════════════
               BARBELL (animates vertically, locked to hands)
          ════════════════════════════════════════════════ */}
          <g className="barbell-group">
            {/* Glow halo — intensifies during pull */}
            <circle
              cx="200"
              cy="290"
              r="28"
              fill="#c6ff3d"
              opacity="0"
              className="barbell-glow"
              filter="url(#plate-glow)"
            />

            {/* Bar (horizontal line) */}
            <line
              x1="120"
              y1="290"
              x2="280"
              y2="290"
              stroke="#c6ff3d"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#bar-glow)"
              className="barbell-bar"
            />

            {/* Left plate set */}
            <g className="plate-rotation-left" style={{ transformOrigin: '110px 290px' }}>
              <circle cx="110" cy="290" r="22" fill="#0a0c09" stroke="#c6ff3d" strokeWidth="1.5" />
              <circle cx="110" cy="290" r="14" fill="#0a0c09" stroke="#c6ff3d" strokeWidth="1" opacity="0.7" />
              <circle cx="110" cy="290" r="3" fill="#c6ff3d" />
              {/* Tick marks to make rotation visible */}
              <line x1="110" y1="270" x2="110" y2="266" stroke="#c6ff3d" strokeWidth="1.5" />
              <line x1="110" y1="314" x2="110" y2="310" stroke="#c6ff3d" strokeWidth="1.5" opacity="0.5" />
              <line x1="90" y1="290" x2="86" y2="290" stroke="#c6ff3d" strokeWidth="1.5" opacity="0.5" />
              <line x1="130" y1="290" x2="134" y2="290" stroke="#c6ff3d" strokeWidth="1.5" opacity="0.5" />
            </g>

            {/* Right plate set */}
            <g className="plate-rotation-right" style={{ transformOrigin: '290px 290px' }}>
              <circle cx="290" cy="290" r="22" fill="#0a0c09" stroke="#c6ff3d" strokeWidth="1.5" />
              <circle cx="290" cy="290" r="14" fill="#0a0c09" stroke="#c6ff3d" strokeWidth="1" opacity="0.7" />
              <circle cx="290" cy="290" r="3" fill="#c6ff3d" />
              <line x1="290" y1="270" x2="290" y2="266" stroke="#c6ff3d" strokeWidth="1.5" />
              <line x1="290" y1="314" x2="290" y2="310" stroke="#c6ff3d" strokeWidth="1.5" opacity="0.5" />
              <line x1="270" y1="290" x2="266" y2="290" stroke="#c6ff3d" strokeWidth="1.5" opacity="0.5" />
              <line x1="310" y1="290" x2="314" y2="290" stroke="#c6ff3d" strokeWidth="1.5" opacity="0.5" />
            </g>
          </g>
        </g>

        {/* ════════════════════════════════════════════════
             AMBIENT PARTICLES — drift upward slowly
        ════════════════════════════════════════════════ */}
        <circle cx="80" cy="280" r="1.2" fill="#c6ff3d" opacity="0.5" className="particle particle-1" />
        <circle cx="320" cy="240" r="1" fill="#c6ff3d" opacity="0.4" className="particle particle-2" />
        <circle cx="120" cy="200" r="0.8" fill="#c6ff3d" opacity="0.5" className="particle particle-3" />
        <circle cx="280" cy="180" r="1.2" fill="#c6ff3d" opacity="0.4" className="particle particle-4" />
        <circle cx="60" cy="160" r="0.8" fill="#c6ff3d" opacity="0.4" className="particle particle-5" />
      </svg>

      <style>{`
        /* ════════════════════════════════════════════════
             KEYFRAME LIBRARY
             6-second loop. All animations share the same
             duration so the body stays kinematically synced.
        ════════════════════════════════════════════════ */

        /* Whole lifter rises during pull. Translation on the entire group.
             0-1s   y=0    (setup at floor)
             1-3s   y=-10  (rising during pull)
             3-4s   y=-30  (lockout, fully standing)
             4-6s   y=0    (descent back)              */
        @keyframes lifter-vertical {
          0%, 16.6%   { transform: translateY(0); }
          50%         { transform: translateY(-30px); }
          66.6%       { transform: translateY(-30px); }
          100%        { transform: translateY(0); }
        }

        /* Hip rotation — torso lean
             At setup: torso is leaned 35° forward (hinged at hips)
             At lockout: torso is upright (0°)                      */
        @keyframes hip-hinge {
          0%, 16.6%   { transform: rotate(35deg); }
          50%         { transform: rotate(0deg); }
          66.6%       { transform: rotate(0deg); }
          100%        { transform: rotate(35deg); }
        }

        /* Torso secondary correction — counters hip a bit so the head
             stays oriented vertically rather than rotating with the torso */
        @keyframes torso-counter {
          0%, 16.6%   { transform: rotate(-15deg); }
          50%         { transform: rotate(0deg); }
          66.6%       { transform: rotate(0deg); }
          100%        { transform: rotate(-15deg); }
        }

        /* Knee flexion — bend during setup, straight at lockout */
        @keyframes knee-bend {
          0%, 16.6%   { transform: translateY(0) scaleY(0.85); }
          50%         { transform: translateY(0) scaleY(1); }
          66.6%       { transform: translateY(0) scaleY(1); }
          100%        { transform: translateY(0) scaleY(0.85); }
        }

        /* Bar travels from floor (y=0) to hip height (y=-65px) */
        @keyframes bar-travel {
          0%, 16.6%   { transform: translateY(0); }
          50%         { transform: translateY(-65px); }
          66.6%       { transform: translateY(-65px); }
          100%        { transform: translateY(0); }
        }

        /* Plate rotation — only during the pull. Subtle 3° wobble. */
        @keyframes plate-spin-left {
          0%, 16.6%   { transform: rotate(0deg); }
          33%         { transform: rotate(-3deg); }
          50%         { transform: rotate(0deg); }
          66.6%       { transform: rotate(0deg); }
          83%         { transform: rotate(3deg); }
          100%        { transform: rotate(0deg); }
        }
        @keyframes plate-spin-right {
          0%, 16.6%   { transform: rotate(0deg); }
          33%         { transform: rotate(3deg); }
          50%         { transform: rotate(0deg); }
          66.6%       { transform: rotate(0deg); }
          83%         { transform: rotate(-3deg); }
          100%        { transform: rotate(0deg); }
        }

        /* Bar glow — pulses brighter during the pull phase */
        @keyframes bar-glow-pulse {
          0%, 16.6%   { opacity: 0; }
          33%         { opacity: 0.6; }
          50%         { opacity: 0.4; }
          66.6%       { opacity: 0.4; }
          83%         { opacity: 0.6; }
          100%        { opacity: 0; }
        }

        /* Particles drift upward and fade */
        @keyframes particle-drift {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-220px); opacity: 0; }
        }

        /* ════════════════════════════════════════════════
             ANIMATION ASSIGNMENTS
        ════════════════════════════════════════════════ */
        .lifter-group {
          animation: lifter-vertical 6s cubic-bezier(0.45, 0.1, 0.55, 0.9) infinite;
        }

        .hip-rotation {
          transform-origin: 200px 240px;
          animation: hip-hinge 6s cubic-bezier(0.45, 0.1, 0.55, 0.9) infinite;
        }

        .torso-rotation {
          transform-origin: 200px 232px;
          animation: torso-counter 6s cubic-bezier(0.45, 0.1, 0.55, 0.9) infinite;
        }

        .leg-rotation {
          transform-origin: 200px 320px;
          animation: knee-bend 6s cubic-bezier(0.45, 0.1, 0.55, 0.9) infinite;
        }

        .barbell-group {
          animation: bar-travel 6s cubic-bezier(0.45, 0.1, 0.55, 0.9) infinite;
        }

        .plate-rotation-left {
          animation: plate-spin-left 6s cubic-bezier(0.45, 0.1, 0.55, 0.9) infinite;
        }

        .plate-rotation-right {
          animation: plate-spin-right 6s cubic-bezier(0.45, 0.1, 0.55, 0.9) infinite;
        }

        .barbell-glow {
          animation: bar-glow-pulse 6s ease-in-out infinite;
        }

        .particle {
          animation: particle-drift 8s ease-out infinite;
        }
        .particle-1 { animation-delay: 0s; }
        .particle-2 { animation-delay: 1.6s; }
        .particle-3 { animation-delay: 3.2s; }
        .particle-4 { animation-delay: 4.8s; }
        .particle-5 { animation-delay: 6.4s; }

        /* Honour user's reduced-motion preference */
        @media (prefers-reduced-motion: reduce) {
          .lifter-group,
          .hip-rotation,
          .torso-rotation,
          .leg-rotation,
          .barbell-group,
          .plate-rotation-left,
          .plate-rotation-right,
          .barbell-glow,
          .particle {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
