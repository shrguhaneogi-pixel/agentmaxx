"use client";

import { useMemo } from "react";
import { AstrolabeProps, MOOD_CONFIG, ASTROLABE_COLORS } from "./types";
import { cn } from "@/lib/utils";

/**
 * AstrolabeFallback
 *
 * Semantic, accessible non-WebGL SVG representation of the Cybernetic Astrolabe
 * and Haunted Lamp. Renders smoothly without WebGL support, during SSR/dynamic
 * loading, or when prefers-reduced-motion is enabled.
 */
export function AstrolabeFallback({
  mood = "neutral",
  isNegotiating = false,
  isProcessingCheckout = false,
  round = 1,
  className,
}: AstrolabeProps) {
  const currentMood = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral;
  const clampedRound = Math.min(Math.max(round, 1), 4);

  const statusLabel = useMemo(() => {
    if (isProcessingCheckout) return "SETTLEMENT VERIFICATION IN PROGRESS";
    if (isNegotiating) return "STATEFUL BAZAAR NEGOTIATION ACTIVE";
    return `MERCHANT STALL IDLE // MOOD: ${mood.toUpperCase()}`;
  }, [isProcessingCheckout, isNegotiating, mood]);

  return (
    <div
      role="img"
      aria-label={`Cybernetic Bazaar Astrolabe (${statusLabel}, Round ${clampedRound} of 4)`}
      className={cn(
        "relative flex size-full min-h-[280px] items-center justify-center overflow-hidden bg-void/80 p-4 select-none",
        className
      )}
    >
      {/* Ambient Radial Gradient Glow */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at center, ${currentMood.targetColor}25 0%, transparent 70%)`,
        }}
      />

      {/* Precision Astrolabe SVG Framework */}
      <svg
        viewBox="0 0 200 200"
        className="relative size-full max-w-[280px] max-h-[280px] drop-shadow-[0_0_20px_rgba(197,160,89,0.25)]"
        aria-hidden="true"
      >
        {/* Outer Degree Rim */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={ASTROLABE_COLORS.brass}
          strokeWidth="1.5"
          opacity="0.6"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke={ASTROLABE_COLORS.brass}
          strokeWidth="0.75"
          strokeDasharray="2 4"
          opacity="0.8"
        />

        {/* Cardinal Astrolabe Calibration Ticks */}
        <line x1="100" y1="4" x2="100" y2="14" stroke={ASTROLABE_COLORS.brass} strokeWidth="2" />
        <line x1="100" y1="186" x2="100" y2="196" stroke={ASTROLABE_COLORS.brass} strokeWidth="2" />
        <line x1="4" y1="100" x2="14" y2="100" stroke={ASTROLABE_COLORS.brass} strokeWidth="2" />
        <line x1="186" y1="100" x2="196" y2="100" stroke={ASTROLABE_COLORS.brass} strokeWidth="2" />

        {/* Ring 4: Outer Navigation Ring (Progressively scaled with negotiation round) */}
        <circle
          cx="100"
          cy="100"
          r={76 + (clampedRound - 1) * 2}
          fill="none"
          stroke={ASTROLABE_COLORS.brass}
          strokeWidth={1.2 + (clampedRound - 1) * 0.3}
          opacity={0.4 + clampedRound * 0.15}
          strokeDasharray="8 6"
          className={cn(
            !isProcessingCheckout && "origin-center animate-[spin_60s_linear_infinite]"
          )}
        />

        {/* Ring 3: Tilted Secondary Ring / Rete Ellipse */}
        <ellipse
          cx="100"
          cy="100"
          rx="66"
          ry="38"
          fill="none"
          stroke={currentMood.targetColor}
          strokeWidth="1.2"
          opacity="0.75"
          className={cn(
            !isProcessingCheckout && "origin-center animate-[spin_40s_linear_infinite_reverse]"
          )}
          style={{
            transform: isProcessingCheckout ? "rotate(0deg)" : undefined,
          }}
        />

        {/* Ring 2: Primary Instrument Gyroscope Ring */}
        <ellipse
          cx="100"
          cy="100"
          rx="44"
          ry="54"
          fill="none"
          stroke={ASTROLABE_COLORS.brass}
          strokeWidth="1.4"
          opacity="0.85"
          className={cn(
            !isProcessingCheckout && "origin-center animate-[spin_25s_linear_infinite]"
          )}
          style={{
            transform: isProcessingCheckout ? "rotate(90deg)" : undefined,
          }}
        />

        {/* Ring 1: Inner Stabilizing Ring */}
        <circle
          cx="100"
          cy="100"
          r="32"
          fill="none"
          stroke={ASTROLABE_COLORS.brass}
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.9"
        />

        {/* Central Luminous Haunted Lamp Core */}
        <circle
          cx="100"
          cy="100"
          r={isNegotiating ? 14 : isProcessingCheckout ? 16 : 10}
          fill={currentMood.targetColor}
          opacity={isProcessingCheckout ? 0.9 : 0.75}
          className={cn(
            "transition-all duration-500",
            (isNegotiating || isProcessingCheckout) && "animate-pulse"
          )}
        />
        <circle
          cx="100"
          cy="100"
          r="4"
          fill="#FFFDF7"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}
